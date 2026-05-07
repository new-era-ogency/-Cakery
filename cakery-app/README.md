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
├── vercel.json             ← Security Headers + Edge function config
├── netlify.toml            ← Security Headers (Netlify)
├── .env.example            ← copy to .env.local with your real Formspree id
├── api/
│   └── order.ts            ← Vercel Edge Function (POST proxy to Formspree)
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx            ← React 18 root
    ├── App.tsx             ← composition root
    ├── index.css           ← Tailwind + design tokens
    ├── env.d.ts            ← typed import.meta.env (NO secrets)
    ├── components/         ← Header / Hero / Menu / About / Reviews /
    │   │                     Gallery / Contact / CakeConstructor /
    │   │                     Footer / MobileCallBar / MagneticButton / Stars
    │   └── order/          ← multi-step form pieces + image-magic check
    ├── hooks/              ← useLanguage, useReveal, useReducedMotion
    └── lib/
        ├── constants.ts    ← runtime config (env-aware, no secrets)
        ├── sanitize.ts     ← strip control / bidi-override chars
        ├── validation.ts   ← Zod schemas + step layout (client-side)
        ├── menu-data.ts    ← cakes / pastries / bakery
        ├── gallery-data.ts
        ├── reviews-data.ts
        └── i18n/           ← BG + EN messages, typed
```

## Architecture: where the order goes

```
[ browser form ]
    │  POST  /api/order              (same-origin, no Formspree URL in JS)
    ▼
[ Vercel Edge Function api/order.ts ]
    │  ─ honeypot / time-trap (silent 200)
    │  ─ Zod schema validation
    │  ─ HARD pickup-date >= now + 72h
    │  ─ file MIME / size check
    │  POST  $FORMSPREE_URL          (server-only env var)
    ▼
[ Formspree → operator inbox ]
```

The Formspree URL is **never** present in the client bundle. `connect-src`
in CSP is therefore tightened to `'self'` only.

## Local development

```bash
cd cakery-app
cp .env.example .env.local        # set FORMSPREE_URL (server-only) + phone vars
npm install

# UI only (form will fail with "service not configured" because /api is not running):
npm run dev                       # http://localhost:5173

# Full stack (UI + Edge function), recommended:
npm i -g vercel                   # one-time
vercel link                       # link to a Vercel project
vercel env pull .env.local        # pulls FORMSPREE_URL from the project (or use the local file)
vercel dev                        # http://localhost:3000  ← /api/order is live
```

## Production build

```bash
npm run build                     # outputs ./dist (static SPA)
npm run preview                   # smoke-test the dist on http://localhost:4173
                                  # (the API only runs on vercel/netlify)
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

- **Server-only Formspree URL.** The browser bundle has no Formspree URL.
  Order POSTs go to `/api/order` (same-origin); the Edge function reads
  `FORMSPREE_URL` from `process.env` and proxies upstream. `connect-src` in
  CSP is tightened to `'self'`.
- **Server-side Zod validation** (in `api/order.ts`) re-checks every field
  with strict regexes/enum allowlists, and **hard-rejects** any pickup time
  earlier than `now + 72 h` (`Date.UTC` comparison — no TZ off-by-one).
- **Honeypot** (`_gotcha`) and **time-trap** (`_meta_age_ms < 2 s`) run on
  the SERVER and silently return 200 — bots get no feedback.
- **Client mirror**: Zod runs in the browser too for instant UX feedback.
  Step bypass via dev-tools is rejected by `validateAll` and the server
  schema as a second line.
- **Hard GDPR guard**: client and server both require `gdpr === "yes"`.
- **File checks**: MIME allowlist, 5 MB cap, magic-byte check, header-only
  pixel-bomb sniff, canvas re-encode (drops EXIF / GPS / ICC) — server
  re-validates MIME + size.
- **No `dangerouslySetInnerHTML`** anywhere. React text-rendering escapes
  all user input.
- **Sanitiser** strips C0 control characters and Unicode bidi-overrides
  (CVE-2021-42574 family) before serialising to FormData.
- **`fetch`** uses `credentials: "same-origin"`, `referrerPolicy: "same-origin"`,
  `cache: "no-store"`.
- **Iframes** (Google Maps) carry `referrerPolicy="no-referrer"` and a
  restrictive `sandbox`.
- **External links** all carry `rel="noopener noreferrer external"`.
- **Strict CSP**: `script-src 'self'` (no `unsafe-eval`, no `unsafe-inline`),
  `connect-src 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.
- **Cache-Control: no-store** on every `/api/*` response — order data is
  never cached by intermediaries.

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
