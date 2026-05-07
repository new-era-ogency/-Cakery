import { z } from "zod";
import { LIMITS, MIN_PICKUP_HOURS } from "./constants";
import type { Messages } from "./i18n";

// ─── Local-time helpers (avoid TZ off-by-one bypass) ────────────────────────
export function todayLocalMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function minPickupDate(): Date {
  const now = new Date();
  const earliest = new Date(now.getTime() + MIN_PICKUP_HOURS * 3600 * 1000);
  earliest.setHours(0, 0, 0, 0);
  return earliest;
}

export function minPickupISO(): string {
  return localISODate(minPickupDate());
}

// ─── Zod schemas (one per step + a full schema for final submit) ────────────
//
// Strict regexes:
//   • phone: digits + standard separators only
//   • name : letters (Unicode), spaces, apostrophe, hyphen, dot
// These keep injection vectors narrow even though we never render this text
// as raw HTML.
const phoneRe = /^\+?[\d\s().-]{7,30}$/;
const nameRe = /^[\p{L}\p{M}'\-.\s]{2,100}$/u;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export function buildSchemas(t: Messages) {
  const sizes = t.sizeOptions.map((o) => o.id);
  const flavors = t.flavorOptions.map((o) => o.id);
  const creams = t.creamOptions.map((o) => o.id);

  return [
    z.object({
      size: z.enum(sizes as [string, ...string[]], {
        errorMap: () => ({ message: t.required }),
      }),
    }),
    z.object({
      flavor: z.enum(flavors as [string, ...string[]], {
        errorMap: () => ({ message: t.required }),
      }),
    }),
    z.object({
      creams: z
        .array(z.enum(creams as [string, ...string[]]))
        .min(1, t.required)
        .max(creams.length, t.invalid),
    }),
    z.object({
      decor: z.string().max(LIMITS.decor, t.tooLong).optional().or(z.literal("")),
    }),
    z.object({
      date: z
        .string()
        .regex(dateRe, t.invalidDate)
        .refine((v) => {
          const [y, m, d] = v.split("-").map(Number);
          if (!y || !m || !d) return false;
          const picked = new Date(y, m - 1, d, 0, 0, 0, 0);
          if (Number.isNaN(picked.getTime())) return false;
          return picked.getTime() >= minPickupDate().getTime();
        }, t.invalidDate),
      time: z.string().regex(timeRe, t.invalid),
    }),
    z.object({
      name: z.string().min(2, t.required).max(LIMITS.name, t.tooLong).regex(nameRe, t.invalid),
      phone: z
        .string()
        .min(7, t.invalidPhone)
        .max(LIMITS.phone, t.tooLong)
        .regex(phoneRe, t.invalidPhone),
      email: z
        .string()
        .max(LIMITS.email, t.tooLong)
        .email(t.invalidEmail)
        .or(z.literal(""))
        .optional(),
      notes: z
        .string()
        .max(LIMITS.notes, t.tooLong)
        .optional()
        .or(z.literal("")),
      gdpr: z.literal(true, {
        errorMap: () => ({ message: t.required }),
      }),
    }),
  ] as const;
}

export type OrderFormData = {
  size: string;
  flavor: string;
  creams: string[];
  decor: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  gdpr: boolean;
  /** Honeypot field — must remain empty for a real submission. */
  _gotcha: string;
};

export const STEP_FIELDS: Array<Array<keyof OrderFormData>> = [
  ["size"],
  ["flavor"],
  ["creams"],
  ["decor"],
  ["date", "time"],
  ["name", "phone", "email", "notes", "gdpr"],
];

// Combined schema used at final submit to validate ALL steps at once,
// protecting against step-bypass via dev-tools / state mutation.
export function buildFullSchema(t: Messages) {
  const steps = buildSchemas(t);
  const merged = steps.reduce(
    (acc, s) => acc.merge(s as z.AnyZodObject),
    z.object({}),
  );
  return merged.merge(
    z.object({
      _gotcha: z.string().max(200).optional().default(""),
    }),
  );
}
