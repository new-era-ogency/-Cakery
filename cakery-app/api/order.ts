/**
 * Vercel Edge Function — POST /api/order
 *
 * Trust boundary: this function is the ONLY thing that knows the Formspree
 * URL. The browser POSTs to same-origin `/api/order` only.
 *
 * Pipeline:
 *   1. Method gate (POST only).
 *   2. Parse `multipart/form-data` or `application/json` → unified FormData.
 *   3. Honeypot — silent 200 if `_gotcha` is filled.
 *   4. Time-trap — silent 200 if `_meta_age_ms` &lt; 2s.
 *   5. Strict Zod validation (mirrors client allowlists).
 *   6. Pickup datetime must be ≥ now + 72h (UTC composition).
 *   7. Optional `photo`: MIME allowlist + size cap.
 *   8. Forward multipart to Formspree (server-side `FORMSPREE_URL`).
 */

import { z } from "zod";

export const config = {
  runtime: "edge",
};

const LIMITS = {
  decor: 1000,
  notes: 1000,
  name: 100,
  phone: 30,
  email: 200,
} as const;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIN_PICKUP_HOURS = 72;
const HONEYPOT_MIN_FILL_MS = 2000;

/** Must stay in sync with `messages-bg.ts` / `messages-en.ts` option ids */
const sizeIds = ["6", "10", "16", "20"] as const;
const flavorIds = [
  "vanilla",
  "chocolate",
  "red-velvet",
  "lemon",
  "caramel",
  "other",
] as const;
const creamIds = ["mascarpone", "buttercream", "ganache", "fruit"] as const;

const phoneRe = /^\+?[\d\s().-]{7,30}$/;
const nameRe = /^[\p{L}\p{M}'\-.\s]{2,100}$/u;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

const OrderSchema = z.object({
  size: z.enum(sizeIds),
  flavor: z.enum(flavorIds),
  creams: z
    .string()
    .min(1)
    .max(200)
    .refine((v) => {
      const items = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return (
        items.length > 0 &&
        items.length <= creamIds.length &&
        items.every((id) => (creamIds as readonly string[]).includes(id))
      );
    }, "creams"),
  decor: z.string().max(LIMITS.decor).optional().or(z.literal("")),
  date: z.string().regex(dateRe),
  time: z.string().regex(timeRe),
  name: z.string().min(2).max(LIMITS.name).regex(nameRe),
  phone: z.string().min(7).max(LIMITS.phone).regex(phoneRe),
  email: z.union([
    z.literal(""),
    z.string().max(LIMITS.email).email(),
  ]),
  notes: z.string().max(LIMITS.notes).optional().or(z.literal("")),
  gdpr: z.literal("yes"),
  language: z.enum(["bg", "en"]),
});

type Lang = "bg" | "en";

type ApiError = {
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

function jsonError(status: number, err: ApiError): Response {
  return new Response(JSON.stringify({ ok: false, ...err }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function jsonOk(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function parseBodyToFormData(
  req: Request,
): Promise<{ fd: FormData } | { err: Response }> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return {
        err: jsonError(400, {
          code: "invalid_body",
          message: {
            bg: "Невалидни данни (JSON).",
            en: "Invalid JSON body.",
          },
        }),
      };
    }

    const data =
      typeof payload === "object" &&
      payload !== null &&
      !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null;

    if (!data) {
      return {
        err: jsonError(400, {
          code: "invalid_body",
          message: { bg: "Невалидни данни.", en: "Invalid body." },
        }),
      };
    }

    const keys = [
      "size",
      "flavor",
      "creams",
      "decor",
      "date",
      "time",
      "name",
      "phone",
      "email",
      "notes",
      "gdpr",
      "language",
      "_subject",
      "_gotcha",
      "_meta_age_ms",
      "_meta_suspicious",
      "_meta_honeypot_filled",
    ] as const;

    const fd = new FormData();
    for (const key of keys) {
      const v = data[key];
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        fd.append(key, v.map(String).join(", "));
        continue;
      }
      fd.append(key, typeof v === "string" ? v : String(v));
    }

    return { fd };
  }

  try {
    return { fd: await req.formData() };
  } catch {
    return {
      err: jsonError(400, {
        code: "invalid_body",
        message: { bg: "Невалидни данни.", en: "Invalid body." },
      }),
    };
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonError(405, {
      code: "method_not_allowed",
      message: { bg: "Само POST.", en: "POST only." },
    });
  }

  const formspreeUrl = (
    (globalThis as unknown as { process?: { env?: Record<string, string> } })
      .process?.env?.FORMSPREE_URL ?? ""
  ).trim();
  if (!formspreeUrl || !formspreeUrl.startsWith("https://formspree.io/")) {
    return jsonError(503, {
      code: "not_configured",
      message: {
        bg: "Услугата не е свързана. Моля, обадете се.",
        en: "Service not configured. Please call.",
      },
    });
  }

  const parsed = await parseBodyToFormData(req);
  if ("err" in parsed) {
    return parsed.err;
  }
  const fd = parsed.fd;

  const gotcha = String(fd.get("_gotcha") ?? "");
  if (gotcha) return jsonOk();

  const ageMs = Number(fd.get("_meta_age_ms") ?? 0);
  if (Number.isFinite(ageMs) && ageMs > 0 && ageMs < HONEYPOT_MIN_FILL_MS) {
    return jsonOk();
  }

  const candidate = {
    size: String(fd.get("size") ?? ""),
    flavor: String(fd.get("flavor") ?? ""),
    creams: String(fd.get("creams") ?? ""),
    decor: String(fd.get("decor") ?? ""),
    date: String(fd.get("date") ?? ""),
    time: String(fd.get("time") ?? ""),
    name: String(fd.get("name") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    email: String(fd.get("email") ?? ""),
    notes: String(fd.get("notes") ?? ""),
    gdpr: String(fd.get("gdpr") ?? ""),
    language: ((): Lang => {
      const l = String(fd.get("language") ?? "bg");
      return l === "en" ? "en" : "bg";
    })(),
  };

  const orderParsed = OrderSchema.safeParse(candidate);
  if (!orderParsed.success) {
    const issue = orderParsed.error.issues[0];
    const field = issue?.path?.[0]?.toString();
    return jsonError(422, {
      code: "validation",
      ...(field ? { field } : {}),
      message: {
        bg: "Невалидни данни в полето.",
        en: "Invalid value in a field.",
      },
    });
  }

  const { date, time } = orderParsed.data;
  const [yy, mm, dd] = date.split("-").map(Number);
  const [hh, mi] = time.split(":").map(Number);
  if (
    yy === undefined ||
    mm === undefined ||
    dd === undefined ||
    hh === undefined ||
    mi === undefined
  ) {
    return jsonError(422, {
      code: "validation",
      field: "date",
      message: {
        bg: "Невалидна дата или час.",
        en: "Invalid date or time.",
      },
    });
  }

  const pickupMs = Date.UTC(yy, mm - 1, dd, hh, mi, 0, 0);
  const earliestMs = Date.now() + MIN_PICKUP_HOURS * 3600 * 1000;
  if (pickupMs < earliestMs) {
    return jsonError(422, {
      code: "date_too_soon",
      field: "date",
      message: {
        bg:
          "Поръчката трябва да е поне 72 часа напред. Моля, изберете по-късна дата.",
        en:
          "The order must be at least 72 hours from now. Please pick a later date.",
      },
    });
  }

  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_FILE_BYTES) {
      return jsonError(413, {
        code: "file_too_big",
        field: "photo",
        message: {
          bg: "Файлът е твърде голям (макс. 5MB).",
          en: "File is too large (max. 5MB).",
        },
      });
    }
    if (!["image/jpeg", "image/png"].includes(photo.type)) {
      return jsonError(415, {
        code: "file_wrong_type",
        field: "photo",
        message: {
          bg: "Поддържат се само JPG и PNG.",
          en: "Only JPG and PNG are supported.",
        },
      });
    }
  }

  const out = new FormData();
  for (const [key, value] of fd.entries()) {
    if (key.startsWith("_meta_")) continue;
    out.append(key, value);
  }

  let upstream: Response;
  try {
    upstream = await fetch(formspreeUrl, {
      method: "POST",
      body: out,
      headers: { Accept: "application/json" },
    });
  } catch {
    return jsonError(502, {
      code: "upstream",
      message: {
        bg:
          "Услугата временно не работи. Моля, опитайте по-късно или ни се обадете.",
        en:
          "Order service is temporarily unavailable. Please try later or call us.",
      },
    });
  }

  if (!upstream.ok) {
    return jsonError(upstream.status === 429 ? 429 : 502, {
      code: "upstream",
      message: {
        bg: "Услугата не прие поръчката. Моля, опитайте по-късно.",
        en: "The order was not accepted. Please try later.",
      },
    });
  }

  return jsonOk();
}
