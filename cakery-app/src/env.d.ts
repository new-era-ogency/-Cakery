/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORMSPREE_ENDPOINT: string;
  readonly VITE_PHONE_DISPLAY?: string;
  readonly VITE_PHONE_E164?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
