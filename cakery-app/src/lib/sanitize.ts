// Lightweight string sanitiser for free-form text fields (decor, notes).
// React already escapes anything we render via JSX text nodes, so we are NOT
// rendering raw HTML anywhere. This helper exists to:
//   1. Strip ASCII / Unicode control characters used for header injection.
//   2. Remove zero-width / bidirectional override characters (CVE-2021-42574).
//   3. Trim and cap length defensively before serialisation to FormData.

const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/g;
// Bidi override + zero-width chars often used for spoofing.
// eslint-disable-next-line no-misleading-character-class
const SPOOF_CHARS_RE = /[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;

export function sanitiseText(input: unknown, maxLen = 5000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(CONTROL_CHARS_RE, " ")
    .replace(SPOOF_CHARS_RE, "")
    .trim()
    .slice(0, maxLen);
}

export function sanitisePhone(input: unknown): string {
  if (typeof input !== "string") return "";
  // Allow only +, digits, spaces, dashes, parens.
  return input.replace(/[^\d+()\s-]/g, "").slice(0, 30);
}
