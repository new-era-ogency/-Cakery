// Single source of truth for client-side runtime configuration.
//
// IMPORTANT: the Formspree URL is a server-only secret — it lives in the
// `FORMSPREE_URL` environment variable consumed by `api/order.ts`. The
// browser never sees it. The browser POSTs to `/api/order`.

const env = import.meta.env;

export const ORDER_ENDPOINT = "/api/order";

export const PHONE_DISPLAY = env.VITE_PHONE_DISPLAY?.trim() || "088 884 9908";
export const PHONE_E164 = env.VITE_PHONE_E164?.trim() || "+359888849908";
export const PHONE_WA = PHONE_E164.replace(/^\+/, "");

export const ADDRESS_QUERY = "Sv. Kipriyan 260B, Mladost 2, Sofia";
export const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(
  ADDRESS_QUERY,
)}&output=embed`;
export const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  ADDRESS_QUERY,
)}`;

// Defence-in-depth limits. Mirrored in Zod schemas. Server-side limits MUST
// also be enforced by api/order.ts (already done) and Formspree.
export const LIMITS = {
  decor: 1000,
  notes: 1000,
  name: 100,
  phone: 30,
  email: 200,
} as const;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MIN_PICKUP_HOURS = 72;
export const HONEYPOT_MIN_FILL_MS = 2000;
