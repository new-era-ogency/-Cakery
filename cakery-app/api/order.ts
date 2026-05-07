/**
 * DEBUG / connectivity test build — no validation, honeypot, or time-trap.
 * Revert to strict pipeline before production.
 *
 * Trust boundary: `FORMSPREE_URL` stays server-only.
 */

export const config = {
  runtime: "edge",
};

/** TEMP: open CORS for debugging only (remove before production). */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
} as const;

function headersWithCors(
  extra: Record<string, string> = {},
): Record<string, string> {
  return { ...CORS_HEADERS, ...extra };
}

type ApiError = {
  code: string;
  field?: string;
  message: { bg: string; en: string };
};

function jsonError(status: number, err: ApiError): Response {
  return new Response(JSON.stringify({ ok: false, ...err }), {
    status,
    headers: headersWithCors({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    }),
  });
}

function jsonOk(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: headersWithCors({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    }),
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
  console.log("API Version: Debug-Mode-Active");
  console.log("Request received from origin:", req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: headersWithCors({
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Max-Age": "86400",
      }),
    });
  }

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
