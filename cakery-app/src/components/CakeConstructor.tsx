import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";

import type { Lang, Messages } from "@/lib/i18n";
import {
  HONEYPOT_MIN_FILL_MS,
  MAX_FILE_BYTES,
  PHONE_DISPLAY,
} from "@/lib/constants";
import {
  buildFullSchema,
  buildSchemas,
  minPickupISO,
  STEP_FIELDS,
  type OrderFormData,
} from "@/lib/validation";
import { sanitisePhone, sanitiseText } from "@/lib/sanitize";
import { Step1, Step2, Step3, Step4, Step5, Step6 } from "./order/Steps";
import { checkImageMagic, reencodeImage } from "./order/image-magic";

/** Relative path only — must not include protocol or host (CSP + same-origin). */
const API_URL = "/api/order" as const;

const TOTAL_STEPS = 6;

type Status = "idle" | "submitting" | "success" | "error";

const ORDER_FORM_DEFAULTS = {
  size: "",
  flavor: "",
  creams: [] as string[],
  decor: "",
  date: "",
  time: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
  gdpr: false,
  _gotcha: "",
} satisfies OrderFormData;

/** Shape of the JSON envelope returned by `/api/order`. */
type ApiResponse =
  | { ok: true }
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
  const fullSchema = useMemo(() => buildFullSchema(t), [t]);

  const resolver = useMemo(
    () => zodResolver(fullSchema),
    [fullSchema],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    clearErrors,
    setError,
    getValues,
  } = useForm<OrderFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: ORDER_FORM_DEFAULTS,
    resolver,
  });

  const updateFormData = useCallback(
    (field: "size" | "flavor", value: string) => {
      if (!value) return;
      setValue(field, value, {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: true,
      });
      clearErrors(field);
    },
    [setValue, clearErrors],
  );

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
    setGlobalError(null);
    const fields = STEP_FIELDS[step] ?? [];
    const raw = getValues();
    const parsed = schemas[step]!.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const key = issue?.path?.[0];
      if (typeof key === "string") {
        const k = key as keyof OrderFormData;
        setError(k, { type: issue.code, message: issue.message });
      }
      setGlobalError(issue?.message ?? t.invalid);
      return;
    }

    clearErrors(fields);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (raw: OrderFormData) => {
    setGlobalError(null);

    for (let i = 0; i < schemas.length; i += 1) {
      const result = schemas[i]!.safeParse(raw);
      if (!result.success) {
        const issue = result.error.issues[0];
        setStep(i);
        setGlobalError(issue?.message || t.invalid);
        return;
      }
    }

    if (raw.gdpr !== true) {
      setStep(5);
      setGlobalError(t.required);
      return;
    }

    const merged = fullSchema.safeParse(raw);
    if (!merged.success) {
      const issue = merged.error.issues[0];
      setGlobalError(issue?.message ?? t.invalid);
      return;
    }

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

      /** Do not set Content-Type on multipart — browser must add the boundary. */
      const acceptJsonHeaders = { Accept: "application/json" } as const;

      let res: Response;
      if (file) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(payload)) {
          fd.append(k, v);
        }
        fd.append("photo", file);
        res = await fetch(API_URL, {
          method: "POST",
          body: fd,
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "same-origin",
          headers: acceptJsonHeaders,
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
          credentials: "same-origin",
          cache: "no-store",
          referrerPolicy: "same-origin",
          headers: {
            ...acceptJsonHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      if (!res.ok) {
        let userMsg = `${t.errorText} (HTTP ${res.status}).`;
        try {
          const errJson = (await res.json()) as {
            ok?: false;
            message?: { bg: string; en: string };
          };
          if (
            errJson &&
            typeof errJson.message === "object" &&
            errJson.message !== null &&
            typeof errJson.message[lang] === "string"
          ) {
            userMsg = errJson.message[lang];
          }
        } catch {
          /* keep userMsg */
        }
        setGlobalError(userMsg);
        setStatus("idle");
        return;
      }

      let body: ApiResponse | null = null;
      try {
        body = (await res.json()) as ApiResponse;
      } catch {
        body = null;
      }

      if (!body) {
        setGlobalError(t.errorText);
        setStatus("idle");
        return;
      }

      if (body && "ok" in body && body.ok === true) {
        setStatus("success");
        return;
      }

      const fieldToStep: Record<string, number> = {
        size: 0,
        flavor: 1,
        creams: 2,
        decor: 3,
        photo: 3,
        date: 4,
        time: 4,
        name: 5,
        phone: 5,
        email: 5,
        notes: 5,
        gdpr: 5,
      };

      if (body && "ok" in body && body.ok === false && "message" in body) {
        switch (body.code) {
          case "not_configured":
            setGlobalError(`${t.formNotConfigured} ${PHONE_DISPLAY}.`);
            break;
          case "date_too_soon":
            setStep(4);
            setGlobalError(body.message[lang]);
            break;
          case "validation":
          case "invalid_body": {
            const targetStep =
              body.field !== undefined &&
              fieldToStep[body.field as string] !== undefined
                ? fieldToStep[body.field as string]!
                : step;
            setStep(targetStep);
            setGlobalError(body.message[lang]);
            break;
          }
          case "file_too_big":
          case "file_wrong_type":
            setStep(3);
            setGlobalError(body.message[lang]);
            break;
          default:
            setGlobalError(body.message[lang]);
        }
        setStatus("idle");
        return;
      }

      setGlobalError(
        `${t.errorText}${res.status ? ` (HTTP ${res.status})` : ""}`,
      );
      setStatus("idle");
    } catch {
      setGlobalError(t.errorText);
      setStatus("idle");
    }
  };

  const handleReset = () => {
    reset({ ...ORDER_FORM_DEFAULTS });
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
      className="scroll-mt-24 bg-gradient-to-b from-cream/40 via-porcelain to-cream/30 py-16 sm:py-24 md:py-32"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10">
        <div className="reveal mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.orderCake}
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.03em] text-espresso sm:text-5xl md:text-6xl">
            {t.orderHero}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-espresso/65 sm:text-base md:text-lg">
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
            className="relative rounded-3xl border border-espresso/10 bg-white/85 p-4 shadow-soft backdrop-blur-md sm:p-8"
          >
            <div className="pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            <ProgressBar step={step} />
            <p className="mb-4 text-xs font-medium text-espresso/55 sm:text-sm">
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
              <Step1
                t={t}
                errors={errors}
                watch={watch}
                updateFormData={updateFormData}
              />
            )}
            {step === 1 && (
              <Step2
                t={t}
                errors={errors}
                watch={watch}
                updateFormData={updateFormData}
              />
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
            </div>

            <div
              className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[38] grid grid-cols-2 gap-3 border-t border-espresso/10 bg-white/[0.97] px-4 py-3 shadow-[0_-8px_32px_-14px_rgba(58,36,24,0.18)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 md:relative md:inset-x-auto md:bottom-auto md:z-0 md:mt-8 md:flex md:w-full md:grid-cols-none md:flex-row md:justify-between md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:backdrop-blur-none"
            >
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || status === "submitting"}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border-2 border-espresso/20 px-4 text-sm font-semibold text-espresso transition hover:border-espresso disabled:cursor-not-allowed disabled:opacity-40 md:w-auto md:min-w-[44px] md:px-6"
              >
                {t.back}
              </button>

              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="btn-premium inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-espresso px-4 text-sm font-semibold text-porcelain shadow-lift transition hover:bg-ink md:w-auto md:min-w-[44px] md:px-8"
                >
                  {t.next}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="btn-premium inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-caramel px-4 text-sm font-semibold text-espresso shadow-lift transition hover:bg-porcelain disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:min-w-[44px] md:px-8"
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
