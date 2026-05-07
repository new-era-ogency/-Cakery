/**
 * Vercel Edge Function — POST /api/order
 *
 * Trust boundary: this function is the ONLY thing that knows the Formspree
 * URL. The browser bundle has no idea where the order ultimately lands.
 *
 * Pipeline:
 *   1. Method gate (POST only).
 *   2. Honeypot — silent 200 if the bot field is filled.
 *   3. Time-trap — silent 200 if the form was submitted in <2 s.
 *   4. Body: `multipart/form-data` (with optional `photo` file) or
 *      `application/json` with the same string fields.
 *   5. Zod validation of fields (temporary relaxed schema possible for debug).
 *   6. File check when `photo` is present (MIME + size).
 *   7. Forward to Formspree — server-only secret URL.
 *
 * Edge runtime is used for two reasons:
 *   - `await req.formData()` is built in (no formidable/busboy dependency).
 *   - Cold starts are fast and the function has no Node-only API needs.
 */

import { z } from "zod";

export const config = {
  runtime: "edge",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const HONEYPOT_MIN_FILL_MS = 2000;

/** DEBUG: permissive schema — tighten before production. */
const OrderSchema = z.object({
  size: z.string().optional(),
  flavor: z.string().optional(),
  creams: z.string().optional(),
  decor: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
  gdpr: z.string().optional(),
  language: z.enum(["bg", "en"]).optional(),
});

function jsonValidationError(error: z.ZodError): Response {
  return new Response(JSON.stringify({ error: error.message }), {
    status: 400,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function summarizeFormData(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of fd.entries()) {
    out[key] =
      value instanceof File
        ? `File(${value.name}, ${value.size}b, ${value.type})`
        : String(value);
  }
  return out;
}

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

/**
 * Supports `multipart/form-data` (incl. file `photo`) and `application/json`
 * with the same string fields FormData would carry (JSON path has no upload).
 */
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
          message: { bg: "Невалидни данни (JSON).", en: "Invalid JSON body." },
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
  console.log("Body received:", req.body);

  // 1. Method
  if (req.method !== "POST") {
    return jsonError(405, {
      code: "method_not_allowed",
      message: { bg: "Само POST.", en: "POST only." },
    });
  }

  // 2. Endpoint configured
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

  // 3. Parse multipart or JSON → unified FormData for the rest of the pipeline
  const parsed = await parseBodyToFormData(req);
  if ("err" in parsed) {
    return parsed.err;
  }
  const fd = parsed.fd;

  console.log("FormData (summary):", summarizeFormData(fd));

  // 4. Honeypot — silently report success so we don't leak the heuristic.
  const gotcha = String(fd.get("_gotcha") ?? "");
  if (gotcha) return jsonOk();

  // 5. Time-trap (server-side; client also sends _meta_age_ms).
  const ageMs = Number(fd.get("_meta_age_ms") ?? 0);
  if (Number.isFinite(ageMs) && ageMs > 0 && ageMs < HONEYPOT_MIN_FILL_MS) {
    return jsonOk();
  }

  // 6. Zod validation
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
    return jsonValidationError(orderParsed.error);
  }

  // 7. DEBUG: 72-hour pickup rule temporarily disabled for submission testing.

  // 8. File checks (best effort — server pipeline must re-encode for real).
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

  // 9. Forward to Formspree. We rebuild a clean FormData that drops every
  //    underscore-prefixed internal field except the ones Formspree itself
  //    consumes (`_gotcha`, `_subject`).
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
        bg: "Услугата временно не работи. Моля, опитайте по-късно или ни се обадете.",
        en: "Order service is temporarily unavailable. Please try later or call us.",
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
