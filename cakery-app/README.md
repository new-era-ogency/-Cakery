# Cakery — Кейкъри · Production app

Vite + React + TypeScript + Tailwind CSS + react-hook-form + Zod.
**Zero `<script src="https://...">` in `index.html`** — every dependency comes
from `npm` and gets bundled at build time.

```
cakery-app/
├── index.html              ← single, minimal entry; no CDN <script> tags
├── package.json
├── vite.config.ts          ← chunked production build
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json             ← Security Headers (Vercel)
├── netlify.toml            ← Security Headers (Netlify)
├── .env.example            ← copy to .env.local with your real Formspree id
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx            ← React 18 root
    ├── App.tsx             ← composition root
    ├── index.css           ← Tailwind + design tokens
    ├── env.d.ts            ← typed import.meta.env
    ├── components/         ← Header / Hero / Menu / About / Reviews /
    │   │                     Gallery / Contact / CakeConstructor /
    │   │                     Footer / MobileCallBar / MagneticButton / Stars
    │   └── order/          ← multi-step form pieces + image-magic check
    ├── hooks/              ← useLanguage, useReveal, useReducedMotion
    └── lib/
        ├── constants.ts    ← runtime config (env-aware, no secrets)
        ├── sanitize.ts     ← strip control / bidi-override chars
        ├── validation.ts   ← Zod schemas + step layout
        ├── menu-data.ts    ← cakes / pastries / bakery
        ├── gallery-data.ts
        ├── reviews-data.ts
        └── i18n/           ← BG + EN messages, typed
```

## Local development

```bash
cd cakery-app
cp .env.example .env.local        # set VITE_FORMSPREE_ENDPOINT
npm install
npm run dev                       # http://localhost:5173
```

## Production build

```bash
npm run build                     # outputs ./dist
npm run preview                   # smoke-test the dist on http://localhost:4173
```

The build is **fully self-hosted JavaScript** — only the runtime calls out to
`fonts.googleapis.com`, `images.unsplash.com`, `formspree.io` and Google Maps
embed. Everything else is in `dist/assets`.

## Deployment

### Vercel
`vercel.json` already contains all security headers and the CSP. Just
`vercel --prod` from this folder.

### Netlify
`netlify.toml` mirrors the same headers. `netlify deploy --prod`.

### Custom server (nginx)
Use the headers in `vercel.json` as the canonical reference and paste the
`Content-Security-Policy` and friends into your `add_header` directives.

## Security model (already enforced in code)

- **Zod schemas** validate every step + the full form on submit. Step bypass
  via dev-tools is rejected by `validateAll`.
- **Date refine** uses local-midnight comparison (no `toISOString` shifting),
  enforcing the 72-hour minimum lead time.
- **Honeypot field** (`_gotcha`) is offscreen + `aria-hidden`. Time-trap
  rejects submissions completed in <2 s.
- **Hard GDPR guard**: `data.gdpr === true` is checked before `fetch()`.
- **File defence-in-depth**: MIME allowlist, 5 MB cap, magic-byte check
  (JPG/PNG signatures).
- **No `dangerouslySetInnerHTML`** anywhere. All user input is rendered as
  React text — automatically HTML-escaped.
- **Sanitiser** strips C0 control characters and Unicode bidi-overrides
  (CVE-2021-42574 family) before serialising to FormData.
- **`fetch`** is called with `credentials: "omit"`, `referrerPolicy: "no-referrer"`,
  `cache: "no-store"`.
- **External links** all carry `rel="noopener noreferrer external"` and
  `target="_blank"`.
- **Strict CSP** is shipped via response headers; the meta-CSP is omitted
  intentionally (multi-line meta-CSPs break in some browsers and can blank
  the page).

## Things you must do before going live

See [SECURITY.md](./SECURITY.md) for the full threat model and the operator
checklist. In short:

1. Sign up at https://formspree.io/forms, copy the endpoint into `.env.local`
   and into your hosting environment variables.
2. In the Formspree dashboard configure: Allowed domains, reCAPTCHA, Akismet,
   rate limit, file-allowlist (jpg/png 5 MB), a rule that drops submissions
   where `_meta_suspicious = yes`, and sign the DPA.
3. Replace the Instagram / Facebook URLs in `src/components/Footer.tsx` with
   your real, owned profile URLs.
4. Add a real `/privacy` page and replace the in-form `<details>` link target.
