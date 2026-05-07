// Single source of truth for runtime configuration. Values that must vary per
// environment (Formspree endpoint) come from import.meta.env so they can be
// injected at build time without ending up in the git history.

const env = import.meta.env;

export const FORMSPREE_ENDPOINT =
  env.VITE_FORMSPREE_ENDPOINT?.trim() || "https://formspree.io/f/REPLACE_ME";
export const FORMSPREE_PLACEHOLDER = "REPLACE_ME";

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
// also be enforced by Formspree (or any server in front of it).
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
