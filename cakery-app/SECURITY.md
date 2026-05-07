# Security model — Cakery / Кейкъри

This file documents the **threat model**, the boundaries between client-side
and server-side controls, and the residual risks that the operator is
responsible for. Read it before going live.

## Trust boundary

```
[ Browser ]   [ Static host (Vercel/Netlify) ]   [ Formspree ]   [ Operator inbox ]
   |                     |                            |                  |
   | HTML+JS+CSS         | HTTP response headers      | reCAPTCHA        | Manual review
   | bundled at build    | + cache rules              | + Akismet        | + replies
   |                     |                            | + rate limit     |
   |                     |                            | + DPA / GDPR     |
```

Every checkbox below is **a control we cannot enforce from the React
app** — they have to be configured outside this repository.

## What the frontend enforces

The `cakery-app/` bundle ships with these layers. **All of them are bypassable
by a direct POST to Formspree** — they exist for UX and as defence-in-depth.

- React text rendering (no `dangerouslySetInnerHTML`).
- `lib/sanitize.ts` strips C0 / bidi-override characters before serialisation.
- `lib/validation.ts` (Zod):
  - `enum` allowlists for size / flavour / cream.
  - Phone, name, e-mail, date and time regexes.
  - `MIN_PICKUP_HOURS = 72` checked via local-time refine (no TZ off-by-one).
  - `gdpr === true` literal check.
- `CakeConstructor.tsx`:
  - Runs every step's schema again at submit (`validateAll`).
  - Hard `if (raw.gdpr !== true) return` guard before `fetch()`.
  - Sends `_meta_age_ms`, `_meta_suspicious`, `_meta_honeypot_filled` so the
    server can drop bot submissions **without silent client-side blocking**.
- `order/image-magic.ts`:
  - Magic-byte signature check (JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`).
  - Decode through `<img>` to fail polyglot files.
  - Pixel-bomb guard (`MAX_PIXELS = 24 MP`).
  - Canvas re-encode → drops EXIF / GPS / colour profile / trailing payload,
    down-scales to ≤ 2400 px on the longest edge.
- `fetch()` uses `credentials: "omit"`, `referrerPolicy: "no-referrer"`,
  `cache: "no-store"`.
- Google Maps iframe: `referrerPolicy="no-referrer"` + `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"`.
- All `target="_blank"` links carry `rel="noopener noreferrer external"`.

## What the operator MUST configure

### Formspree dashboard

1. **Allowed domains** — only your production domain. This is **best-effort**:
   Formspree compares the request `Origin` / `Referer` header. Hand-crafted
   POSTs (curl, scripts) can omit those headers entirely or spoof them, so
   Allowed domains alone is **not** a sufficient barrier. Treat it as a
   filter that catches drive-by browser-based abuse, not as authentication.
2. **reCAPTCHA** v2 or v3 enabled — the primary anti-automation barrier.
3. **Akismet / spam filter** enabled.
4. **Rate limit** ≈ 10 submissions / IP / hour (or stricter).
5. **File uploads**: only `image/jpeg`, `image/png`, max **5 MB**.
6. **Custom rule** that drops messages where
   `_meta_suspicious = yes` (or routes them to a quarantine inbox for review).
7. **DPA signed** with Formspree LLC for GDPR.
8. Notifications routed to a dedicated `orders@` inbox, not to the founder's
   personal e-mail.

#### Smoke-test before launch

Before announcing the site, verify the bypasses **do not** work in practice.
Replace `<form_id>` with your real ID and run from a developer machine:

```bash
# 1. POST without Origin / Referer (a CLI bot pretending to be a server).
#    EXPECTED: rejected (4xx) when reCAPTCHA + Allowed domains are on.
curl -i -X POST https://formspree.io/f/<form_id> \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'name=curl&phone=+359000000000&gdpr=yes&size=10&flavor=vanilla'

# 2. POST with a forged Origin matching your domain.
#    EXPECTED: rejected because reCAPTCHA token is missing.
curl -i -X POST https://formspree.io/f/<form_id> \
  -H 'Origin: https://cakery.bg' -H 'Referer: https://cakery.bg/' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'name=spoofed&phone=+359000000000&gdpr=yes&size=10&flavor=vanilla'

# 3. Fill the honeypot.
#    EXPECTED: server-side rule on `_meta_suspicious=yes` drops or quarantines.
curl -i -X POST https://formspree.io/f/<form_id> \
  -H 'Origin: https://cakery.bg' -H 'Referer: https://cakery.bg/' \
  --data '_gotcha=spam&_meta_suspicious=yes&name=bot&phone=+359000000000'
```

If any of those three actually deliver a real e-mail, the configuration is
incomplete and you must add a backend proxy (Cloudflare Worker / Hono /
serverless function) that re-checks the reCAPTCHA token, normalises headers,
and only then forwards to Formspree.

### Hosting headers (Vercel / Netlify / nginx)

Already shipped in `vercel.json` / `netlify.toml`. The CSP is strict:
**no `unsafe-eval`, no `unsafe-inline` for `script-src`**.

```
default-src 'self';
script-src 'self';
script-src-elem 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https://images.unsplash.com;
connect-src 'self' https://formspree.io;
frame-src https://www.google.com https://maps.google.com;
form-action 'self' https://formspree.io;
frame-ancestors 'none';
base-uri 'self';
object-src 'none';
worker-src 'self';
manifest-src 'self';
upgrade-insecure-requests
```

`'unsafe-inline'` for `style-src` is required because Tailwind generates
inline `<style>` for keyframes during the build. To remove it, either nonce
those styles or eject from utility-first.

Other headers (also shipped):

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(),
                    usb=(), accelerometer=(), gyroscope=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
```

### File-upload reality check

The browser-side controls **cannot** stop:

- Polyglot files crafted to look like JPEG to libmagic but trigger something
  else when re-rendered by an old image library.
- Direct POSTs that bypass the React app entirely.

The operator must therefore:

- Trust **only the Formspree-side** validation for file MIME / size.
- If files are later mirrored to your own storage:
  - Re-encode via Sharp / Pillow / ImageMagick (NOT GraphicsMagick legacy).
  - Strip EXIF / IPTC / XMP / ICC.
  - Cap byte size *and* pixel dimensions.
  - Quarantine for AV scanning before serving.
  - Serve from a separate origin (e.g. `cdn.cakery.bg`) that **cannot** read
    cookies of the main domain.

## Residual risks

- **Direct POST to Formspree** with hand-crafted FormData — partially blocked
  by Formspree's Allowed Domains (Origin check) + reCAPTCHA. Without those
  the only line of defence is the operator manually reviewing the inbox.
- **CDN compromise** of Google Fonts / Unsplash / Google Maps. Mitigated by
  CSP allowlists and the fact that these are static asset providers.
- **Phishing via social-media links** that point to bare domains. Update
  `src/components/Footer.tsx` to your real owned profiles before launch.
- **No /privacy page** yet — `<details>` block in the form is a placeholder.
- **No CAPTCHA visible to the user** — relying on Formspree's invisible
  reCAPTCHA v3 keeps UX clean, but doesn't stop a determined attacker.

## Reporting a vulnerability

E-mail `security@cakery.bg` (or your real address) with details. Please do
not file public issues for security reports.
