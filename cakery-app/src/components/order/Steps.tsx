import { Upload } from "lucide-react";
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
} from "react-hook-form";
import type { Messages } from "@/lib/i18n";
import { LIMITS } from "@/lib/constants";
import type { OrderFormData } from "@/lib/validation";

type StepProps = {
  t: Messages;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
};

/** Steps 1–2: `updateFormData` centralises setValue + clearErrors for card picks. */
type StepChoiceProps = {
  t: Messages;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  updateFormData: (field: "size" | "flavor", value: string) => void;
};

function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-espresso sm:text-sm"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-right text-xs text-espresso/50">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Step1({ t, errors, watch, updateFormData }: StepChoiceProps) {
  const sizeValue = watch("size");
  return (
    <div>
      <h3
        id="step-order-size"
        className="font-display text-lg font-bold text-espresso sm:text-xl"
      >
        {t.s1Title}
      </h3>
      <p className="mt-1 text-xs text-espresso/60 sm:text-sm">{t.s1Sub}</p>
      <div
        role="radiogroup"
        aria-labelledby="step-order-size"
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {t.sizeOptions.map((opt) => {
          const selected = sizeValue === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                if (!opt?.id) return;
                updateFormData("size", opt.id);
              }}
              className={`relative flex min-h-[44px] cursor-pointer flex-col justify-center rounded-xl border-2 p-4 text-left transition ${
                selected
                  ? "border-caramel bg-caramel/10"
                  : "border-espresso/15 hover:border-caramel/60"
              }`}
            >
              <span className="font-display text-lg font-semibold text-espresso">
                {opt.label}
              </span>
              <span className="mt-1 text-sm text-espresso/60">
                {t.fromShort} {opt.priceFrom} {t.currency}
              </span>
            </button>
          );
        })}
      </div>
      {errors.size?.message && (
        <p className="mt-2 text-xs font-medium text-red-700" role="alert">
          {errors.size.message}
        </p>
      )}
    </div>
  );
}

export function Step2({ t, errors, watch, updateFormData }: StepChoiceProps) {
  const flavorValue = watch("flavor");
  return (
    <div>
      <h3
        id="step-order-flavor"
        className="font-display text-lg font-bold text-espresso sm:text-xl"
      >
        {t.s2Title}
      </h3>
      <div
        role="radiogroup"
        aria-labelledby="step-order-flavor"
        className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {t.flavorOptions.map((opt) => {
          const selected = flavorValue === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                if (!opt?.id) return;
                updateFormData("flavor", opt.id);
              }}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                selected
                  ? "border-caramel bg-caramel/10"
                  : "border-espresso/15 hover:border-caramel/60"
              }`}
            >
              <span
                className="inline-flex h-4 w-4 shrink-0 rounded-full border-2 border-espresso/25"
                aria-hidden
              >
                {selected ? (
                  <span className="m-0.5 block h-2.5 w-2.5 rounded-full bg-caramel" />
                ) : null}
              </span>
              <span className="text-sm font-medium text-espresso">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {errors.flavor?.message && (
        <p className="mt-2 text-xs font-medium text-red-700" role="alert">
          {errors.flavor.message}
        </p>
      )}
    </div>
  );
}

export function Step3({ t, register, errors, watch }: StepProps) {
  const value = watch("creams") || [];
  return (
    <div>
      <h3 className="font-display text-lg font-bold text-espresso sm:text-xl">
        {t.s3Title}
      </h3>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {t.creamOptions.map((opt) => {
          const active = value.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                active
                  ? "border-caramel bg-caramel/10"
                  : "border-espresso/15 hover:border-caramel/60"
              }`}
            >
              <input
                type="checkbox"
                value={opt.id}
                {...register("creams")}
                className="h-5 w-5 shrink-0 accent-espresso"
              />
              <span className="text-sm font-medium text-espresso">
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      {errors.creams?.message && (
        <p className="mt-2 text-xs font-medium text-red-700" role="alert">
          {errors.creams.message as string}
        </p>
      )}
    </div>
  );
}

export function Step4({
  t,
  register,
  errors,
  watch,
  file,
  fileError,
  onFile,
}: StepProps & {
  file: File | null;
  fileError?: string;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const decor = watch("decor") || "";
  return (
    <div className="space-y-5">
      <h3 className="font-display text-lg font-bold text-espresso sm:text-xl">{t.s4Title}</h3>
      <Field
        label={t.s4Decor}
        htmlFor="decor"
        error={errors.decor?.message as string | undefined}
        hint={`${decor.length} / ${LIMITS.decor}`}
      >
        <textarea
          id="decor"
          rows={4}
          maxLength={LIMITS.decor}
          {...register("decor")}
          className="w-full rounded-xl border-2 border-espresso/15 bg-white px-4 py-3 text-base text-espresso outline-none transition focus:border-caramel"
        />
      </Field>
      <Field label={t.s4Photo} htmlFor="photo" error={fileError}>
        <label
          htmlFor="photo"
          className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-espresso/25 bg-cream/40 px-4 py-3 text-sm text-espresso/70 transition hover:border-caramel hover:bg-caramel/10"
        >
          <Upload className="h-5 w-5 shrink-0" />
          <span className="truncate">{file ? file.name : t.s4Hint}</span>
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png"
          onChange={onFile}
          className="hidden"
        />
      </Field>
    </div>
  );
}

export function Step5({
  t,
  register,
  errors,
  minDate,
}: StepProps & { minDate: string }) {
  return (
    <div className="space-y-5">
      <h3 className="font-display text-lg font-bold text-espresso sm:text-xl">{t.s5Title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.s5Date}
          htmlFor="date"
          error={errors.date?.message as string | undefined}
        >
          <input
            id="date"
            type="date"
            min={minDate}
            {...register("date")}
            className="w-full min-h-[44px] rounded-xl border-2 border-espresso/15 bg-white px-4 py-[0.6875rem] text-base leading-normal text-espresso outline-none transition focus:border-caramel"
          />
        </Field>
        <Field
          label={t.s5Time}
          htmlFor="time"
          error={errors.time?.message as string | undefined}
        >
          <input
            id="time"
            type="time"
            {...register("time")}
            className="w-full min-h-[44px] rounded-xl border-2 border-espresso/15 bg-white px-4 py-[0.6875rem] text-base leading-normal text-espresso outline-none transition focus:border-caramel"
          />
        </Field>
      </div>
    </div>
  );
}

export function Step6({ t, register, errors, watch }: StepProps) {
  const notes = watch("notes") || "";
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-espresso sm:text-xl">{t.s6Title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.s6Name}
          htmlFor="name"
          error={errors.name?.message as string | undefined}
        >
          <input
            id="name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.name}
            {...register("name")}
            className="w-full min-h-[44px] rounded-xl border-2 border-espresso/15 bg-white px-4 py-[0.6875rem] text-base leading-normal text-espresso outline-none transition focus:border-caramel"
          />
        </Field>
        <Field
          label={t.s6Phone}
          htmlFor="phone"
          error={errors.phone?.message as string | undefined}
        >
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            maxLength={LIMITS.phone}
            placeholder="+359 88 884 9908"
            {...register("phone")}
            className="w-full min-h-[44px] rounded-xl border-2 border-espresso/15 bg-white px-4 py-[0.6875rem] text-base leading-normal text-espresso outline-none transition focus:border-caramel"
          />
        </Field>
      </div>
      <Field
        label={t.s6Email}
        htmlFor="email"
        error={errors.email?.message as string | undefined}
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          {...register("email")}
          className="w-full min-h-[44px] rounded-xl border-2 border-espresso/15 bg-white px-4 py-[0.6875rem] text-base leading-normal text-espresso outline-none transition focus:border-caramel"
        />
      </Field>
      <Field
        label={t.s6Notes}
        htmlFor="notes"
        error={errors.notes?.message as string | undefined}
        hint={`${notes.length} / ${LIMITS.notes}`}
      >
        <textarea
          id="notes"
          rows={3}
          maxLength={LIMITS.notes}
          {...register("notes")}
          className="w-full rounded-xl border-2 border-espresso/15 bg-white px-4 py-3 text-base text-espresso outline-none transition focus:border-caramel"
        />
      </Field>

      <div className="rounded-xl border border-espresso/15 bg-cream/30 p-3">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 py-1">
          <input
            type="checkbox"
            {...register("gdpr")}
            className="h-5 w-5 shrink-0 accent-espresso"
          />
          <span className="text-xs leading-relaxed text-espresso/85 sm:text-[13px]">
            {t.s6Gdpr}{" "}
            <a
              href="#privacy"
              className="font-semibold text-espresso underline decoration-caramel/60 underline-offset-2 hover:decoration-espresso"
            >
              {t.privacyLink}
            </a>
            .
          </span>
        </label>
        <details
          id="privacy"
          className="mt-3 scroll-mt-24 text-xs text-espresso/75"
        >
          <summary className="cursor-pointer font-semibold text-espresso/85">
            {t.privacyTitle}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {t.privacyBullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </details>
      </div>
      {errors.gdpr?.message && (
        <p className="text-xs font-medium text-red-700" role="alert">
          {errors.gdpr.message as string}
        </p>
      )}
    </div>
  );
}
