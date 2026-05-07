/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Server-only `FORMSPREE_URL` is consumed by api/order.ts via process.env;
  // it is intentionally NOT exposed to the client (no VITE_ prefix).
  readonly VITE_PHONE_DISPLAY?: string;
  readonly VITE_PHONE_E164?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
