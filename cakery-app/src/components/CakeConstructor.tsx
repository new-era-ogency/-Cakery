import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";

import type { Lang, Messages } from "@/lib/i18n";
import {
  HONEYPOT_MIN_FILL_MS,
  MAX_FILE_BYTES,
  ORDER_ENDPOINT,
} from "@/lib/constants";
import {
  buildSchemas,
  minPickupISO,
  STEP_FIELDS,
  type OrderFormData,
} from "@/lib/validation";
import { sanitisePhone, sanitiseText } from "@/lib/sanitize";
import { Step1, Step2, Step3, Step4, Step5, Step6 } from "./order/Steps";
import { checkImageMagic, reencodeImage } from "./order/image-magic";

const TOTAL_STEPS = 6;

type Status = "idle" | "submitting" | "success" | "error";

/** Shape of the JSON envelope returned by `/api/order`. */
type ApiResponse =
  | { ok: true }
  /** DEBUG: Zod validation failures return `{ error: message }` with HTTP 400. */
  | { error: string }
  | {
      ok: false;
      code:
        | "method_not_allowed"
        | "not_configured"
        | "invalid_body"
        | "validation"
        | "date_too_soon"
        | "file_too_big"
        | "file_wrong_type"
        | "upstream";
      field?: string;
      message: { bg: string; en: string };
    };

function formDataToPlainObject(fd: FormData): Record<string, string> {
  return Object.fromEntries(
    [...fd.entries()].map(([k, v]) => [
      k,
      v instanceof File ? `File(${v.name}, ${v.size}b, ${v.type})` : String(v),
    ]),
  );
}

export default function CakeConstructor({
  lang,
  t,
}: {
  lang: Lang;
  t: Messages;
}) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const formMountedAtRef = useRef<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const schemas = useMemo(() => buildSchemas(t), [t]);
  const currentSchema = schemas[step];

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    reset,
    watch,
    setValue,
  } = useForm<OrderFormData>({
    mode: "onBlur",
    defaultValues: {
      size: "",
      flavor: "",
      creams: [],
      decor: "",
      date: "",
      time: "",
      name: "",
      phone: "",
      email: "",
      notes: "",
      gdpr: false,
      _gotcha: "",
    },
    // Validate only the fields of the current step at the field level. The
    // final submit additionally re-validates against the *full* schema.
    resolver: zodResolver(currentSchema),
  });

  const minDate = useMemo(() => minPickupISO(), []);

  // Sanitise phone on the fly to make injection of control chars harder.
  const phoneVal = watch("phone");
  useEffect(() => {
    const cleaned = sanitisePhone(phoneVal);
    if (cleaned !== phoneVal) {
      setValue("phone", cleaned, { shouldValidate: false });
    }
  }, [phoneVal, setValue]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const f = input.files?.[0] || null;
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setFileError(t.fileWrongType);
      input.value = "";
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError(t.fileTooBig);
      input.value = "";
      setFile(null);
      return;
    }
    const ok = await checkImageMagic(f);
    if (!ok) {
      setFileError(t.fileCorrupt);
      input.value = "";
      setFile(null);
      return;
    }
    // Defence-in-depth: re-encode through canvas. This drops EXIF / GPS /
    // colour profiles / trailing bytes, validates that the file decodes as
    // a real image, and rejects pixel-bombs. Server-side re-encode is still
    // mandatory.
    const re = await reencodeImage(f);
    if (!re.ok) {
      setFileError(re.reason === "too-big" ? t.fileTooBig : t.fileCorrupt);
      input.value = "";
      setFile(null);
      return;
    }
    // Belt-and-braces: the re-encoded blob can be larger than the source
    // (PNG → PNG can grow). reencodeImage already enforces MAX_OUTPUT_BYTES
    // internally, but we re-check here so the cap is visible at the call
    // site too.
    if (re.file.size > MAX_FILE_BYTES) {
      setFileError(t.fileTooBig);
      input.value = "";
      setFile(null);
      return;
    }
    setFile(re.file);
  };

  const next = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const ok = await trigger(fields);
    if (ok) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (raw: OrderFormData) => {
    setGlobalError(null);

    // 1. Re-validate ALL steps against current data — defence against bypass.
    for (let i = 0; i < schemas.length; i += 1) {
      const result = schemas[i]!.safeParse(raw);
      if (!result.success) {
        setStep(i);
        const issue = result.error.issues[0];
        setGlobalError(issue?.message || t.invalid);
        return;
      }
    }

    // 2. Hard GDPR guard
    if (raw.gdpr !== true) {
      setStep(5);
      setGlobalError(t.required);
      return;
    }

    // 3. Build anti-spam metadata. We deliberately do NOT silent-block on the
    //    client (would create false positives + leak the heuristic to bots).
    //    The server-side /api/order route inspects these fields:
    //      - `_gotcha`: honeypot text — silent success if filled.
    //      - `_meta_age_ms`: time since form mount, server rejects <2s.
    const ageMs = Date.now() - formMountedAtRef.current;
    const tooFast = ageMs < HONEYPOT_MIN_FILL_MS;
    const honeypotFilled = Boolean(raw._gotcha);
    const suspicious = tooFast || honeypotFilled;

    setStatus("submitting");
    try {
      const payload: Record<string, string> = {
        size: raw.size,
        flavor: raw.flavor,
        creams: raw.creams.join(", "),
        decor: sanitiseText(raw.decor, 1000),
        date: raw.date,
        time: raw.time,
        name: sanitiseText(raw.name, 100),
        phone: sanitisePhone(raw.phone),
        email: sanitiseText(raw.email, 200),
        notes: sanitiseText(raw.notes, 1000),
        gdpr: "yes",
        language: lang,
        _subject: "Cakery — нова поръчка",
        _gotcha: raw._gotcha,
        _meta_age_ms: String(ageMs),
        _meta_suspicious: suspicious ? "yes" : "no",
        _meta_honeypot_filled: honeypotFilled ? "yes" : "no",
      };

      const headers: HeadersInit = {
        Accept: "application/json",
      };

      let res: Response;
      if (file) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(payload)) {
          fd.append(k, v);
        }
        fd.append("photo", file);
        console.log("Sending data:", formDataToPlainObject(fd));
        res = await fetch(ORDER_ENDPOINT, {
          method: "POST",
          body: fd,
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "same-origin",
          headers,
        });
      } else {
        console.log("Sending data:", payload);
        res = await fetch(ORDER_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(payload),
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "same-origin",
          headers: {
            ...headers,
            "Content-Type": "application/json; charset=utf-8",
          },
        });
      }

      let body: ApiResponse | null = null;
      try {
        body = (await res.json()) as ApiResponse;
      } catch {
        body = null;
      }

      // Zod / debug envelope: `{ error: string }`
      if (
        body &&
        "error" in body &&
        typeof (body as { error?: unknown }).error === "string"
      ) {
        const msg = (body as { error: string }).error;
        setGlobalError(msg);
        setStatus("idle");
        return;
      }

      if (res.status === 200 && body && "ok" in body && body.ok === true) {
        setStatus("success");
        return;
      }

      // Any non-success HTTP or unexpected JSON: stay on current step — do not move `step`.
      let msg = `${t.errorText} (HTTP ${res.status}).`;
      if (
        body &&
        "ok" in body &&
        body.ok === false &&
        "message" in body
      ) {
        msg = body.message[lang];
      }
      setGlobalError(msg);
      setStatus("idle");
    } catch (e) {
      console.error(e);
      const msg =
        e instanceof Error && e.message
          ? `${t.errorText} ${e.message}`
          : t.errorText;
      setGlobalError(msg);
      setStatus("idle");
    }
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setFileError(null);
    setStep(0);
    setStatus("idle");
    setGlobalError(null);
    formMountedAtRef.current = Date.now();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section
      id="order-section"
      className="scroll-mt-24 bg-gradient-to-b from-cream/40 via-porcelain to-cream/30 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
        <div className="reveal mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.orderCake}
          </p>
          <h2 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-[-0.035em] text-espresso sm:text-6xl">
            {t.orderHero}
          </h2>
          <p className="mt-4 text-base text-espresso/65 sm:text-lg">
            {t.orderHeroSub}
          </p>
        </div>

        {status === "success" ? (
          <SuccessCard t={t} onReset={handleReset} />
        ) : status === "error" ? (
          <ErrorCard
            t={t}
            message={globalError}
            onRetry={() => {
              setStatus("idle");
              setGlobalError(null);
            }}
          />
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-3xl border border-espresso/10 bg-white/85 p-5 shadow-soft backdrop-blur-md sm:p-8"
          >
            <ProgressBar step={step} />
            <p className="mb-4 text-sm font-medium text-espresso/55">
              {t.stepLabel} {step + 1} {t.of} {TOTAL_STEPS}
            </p>

            {globalError ? (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {globalError}
              </div>
            ) : null}

            {/* Honeypot — hidden from real users, picked up by naive bots. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-10000px",
                top: "auto",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="cakery-website-field">
                Leave this field empty
              </label>
              <input
                id="cakery-website-field"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("_gotcha")}
              />
            </div>

            {step === 0 && (
              <Step1 t={t} register={register} errors={errors} watch={watch} />
            )}
            {step === 1 && (
              <Step2 t={t} register={register} errors={errors} watch={watch} />
            )}
            {step === 2 && (
              <Step3 t={t} register={register} errors={errors} watch={watch} />
            )}
            {step === 3 && (
              <Step4
                t={t}
                register={register}
                errors={errors}
                watch={watch}
                file={file}
                fileError={fileError ?? undefined}
                onFile={onFile}
              />
            )}
            {step === 4 && (
              <Step5
                t={t}
                register={register}
                errors={errors}
                watch={watch}
                minDate={minDate}
              />
            )}
            {step === 5 && (
              <Step6 t={t} register={register} errors={errors} watch={watch} />
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || status === "submitting"}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-espresso/20 px-6 text-sm font-semibold text-espresso transition hover:border-espresso disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.back}
              </button>

              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="btn-premium inline-flex min-h-[48px] items-center justify-center rounded-full bg-espresso px-8 text-sm font-semibold text-porcelain shadow-lift transition hover:bg-ink"
                >
                  {t.next}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="btn-premium inline-flex min-h-[48px] items-center justify-center rounded-full bg-caramel px-8 text-sm font-semibold text-espresso shadow-lift transition hover:bg-porcelain disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting" ? t.sending : t.submit}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ease-silk ${
            i <= step ? "bg-caramel" : "bg-espresso/15"
          }`}
        />
      ))}
    </div>
  );
}

function SuccessCard({ t, onReset }: { t: Messages; onReset: () => void }) {
  return (
    <div className="pop-in rounded-3xl border border-caramel/30 bg-white/90 p-8 text-center shadow-lift">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-espresso text-porcelain">
        <Check className="h-8 w-8" />
      </div>
      <h3 className="mt-5 font-display text-3xl font-bold text-espresso sm:text-4xl">
        {t.successTitle}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-espresso/75">{t.successText}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-espresso px-6 text-sm font-semibold text-espresso transition hover:bg-espresso hover:text-porcelain"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}

function ErrorCard({
  t,
  message,
  onRetry,
}: {
  t: Messages;
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-md">
      <h3 className="font-display text-3xl font-bold text-red-800">
        {t.errorTitle}
      </h3>
      <p className="mt-3 text-red-700/80">{message || t.errorText}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-espresso px-6 text-sm font-semibold text-porcelain hover:bg-ink"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}
