/**
 * Image safety checks done in the browser.
 *
 * Hard truth: clients can be bypassed. Anything implemented here is a UX layer
 * and a defence-in-depth — the server (Formspree + your storage) MUST also:
 *   1. Re-encode the image with a hardened library (Sharp / Pillow / ImageMagick).
 *   2. Strip EXIF / GPS / colour-profile metadata.
 *   3. Cap byte size, pixel dimensions and frames.
 *   4. Run AV / known-bad-hash checks.
 *   5. Serve uploads from a sandboxed origin that cannot read user cookies.
 *
 * Browser-side pipeline used here:
 *   1. Magic-byte signature check (JPEG / PNG only).
 *   2. Header-only dimension sniff (no full decode) to reject pixel-bombs
 *      BEFORE handing them to <img>. This protects the renderer process from
 *      decoding hostile dimensions.
 *   3. Decode through HTMLImageElement; failure rejects polyglot files.
 *   4. Re-paint into <canvas> and re-export — strips EXIF / ICC / trailers.
 *   5. Re-check the post-encode byte size (PNG can grow on re-encode).
 *   6. Sanitise the file name (no control / bidi / path chars).
 */

const MAX_DIM = 2400; // px on the longest edge of the re-encoded output
const MAX_PIXELS = 24_000_000; // 24 MP — guards against pixel-bomb decode
const REENCODE_QUALITY = 0.85;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

export function checkImageMagic(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(false);
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer | null;
      if (!buf) return resolve(false);
      const b = new Uint8Array(buf).slice(0, 8);
      const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
      const isPng =
        b[0] === 0x89 &&
        b[1] === 0x50 &&
        b[2] === 0x4e &&
        b[3] === 0x47 &&
        b[4] === 0x0d &&
        b[5] === 0x0a &&
        b[6] === 0x1a &&
        b[7] === 0x0a;
      resolve(isJpeg || isPng);
    };
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
}

/**
 * Read the image's declared dimensions WITHOUT triggering a full decode.
 *  - PNG: bytes 16..23 hold width and height after the IHDR length+type.
 *  - JPEG: scan for the first SOF0/2 marker and read the 2-byte W/H pair.
 *
 * This stops a 100 000 × 100 000 PNG from reaching the renderer process.
 * Returns null if the header could not be parsed (caller treats as invalid).
 */
export async function sniffDimensions(
  file: File,
): Promise<{ w: number; h: number } | null> {
  const head = await readArrayBuffer(file.slice(0, 64 * 1024));
  if (!head) return null;
  const view = new DataView(head);
  const len = view.byteLength;
  if (len < 24) return null;

  // PNG signature already validated by checkImageMagic; IHDR follows from
  // byte 8 (4-byte length, 4-byte "IHDR", 4-byte width, 4-byte height).
  if (
    view.getUint8(0) === 0x89 &&
    view.getUint8(1) === 0x50 &&
    view.getUint8(2) === 0x4e &&
    view.getUint8(3) === 0x47
  ) {
    const w = view.getUint32(16, false);
    const h = view.getUint32(20, false);
    return { w, h };
  }

  // JPEG: walk markers until the first Start-Of-Frame.
  if (view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
    let i = 2;
    while (i < len - 9) {
      if (view.getUint8(i) !== 0xff) {
        i += 1;
        continue;
      }
      // Skip fill bytes (0xFF padding).
      while (i < len - 1 && view.getUint8(i) === 0xff) i += 1;
      const marker = view.getUint8(i);
      i += 1;
      // Standalone markers without payload.
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker >= 0xd0 && marker <= 0xd7) continue;
      if (i + 1 >= len) return null;
      const segLen = view.getUint16(i, false);
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        if (i + 7 >= len) return null;
        const h = view.getUint16(i + 3, false);
        const w = view.getUint16(i + 5, false);
        return { w, h };
      }
      i += segLen;
    }
  }

  return null;
}

export type ReencodeResult =
  | { ok: true; file: File }
  | { ok: false; reason: "decode" | "pixel-bomb" | "encode" | "too-big" };

/**
 * Re-encode a verified JPEG/PNG via canvas. Returns a *new* File whose bytes
 * never include EXIF, ICC, colour profiles, comment chunks, or trailing
 * payloads from the original. The output MIME matches the input.
 */
export async function reencodeImage(file: File): Promise<ReencodeResult> {
  // Pre-decode pixel-bomb check (header sniff, no rendering).
  const dims = await sniffDimensions(file);
  if (!dims || dims.w <= 0 || dims.h <= 0) {
    return { ok: false, reason: "decode" };
  }
  if (dims.w * dims.h > MAX_PIXELS) {
    return { ok: false, reason: "pixel-bomb" };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url).catch(() => null);
    if (!img) return { ok: false, reason: "decode" };

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return { ok: false, reason: "decode" };
    if (w * h > MAX_PIXELS) return { ok: false, reason: "pixel-bomb" };

    const scale = Math.min(1, MAX_DIM / Math.max(w, h));
    const dw = Math.max(1, Math.round(w * scale));
    const dh = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return { ok: false, reason: "encode" };
    ctx.drawImage(img, 0, 0, dw, dh);

    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, REENCODE_QUALITY),
    );
    if (!blob) return { ok: false, reason: "encode" };

    // Post-encode byte cap. Re-encoded PNGs occasionally inflate (canvas
    // emits uncompressed colour profiles / extra IDAT padding). Re-try as
    // JPEG before giving up.
    let outBlob = blob;
    let outMime = mime;
    if (outBlob.size > MAX_OUTPUT_BYTES && mime === "image/png") {
      const jpeg = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", REENCODE_QUALITY),
      );
      if (jpeg && jpeg.size <= MAX_OUTPUT_BYTES) {
        outBlob = jpeg;
        outMime = "image/jpeg";
      }
    }
    if (outBlob.size > MAX_OUTPUT_BYTES) {
      return { ok: false, reason: "too-big" };
    }

    const safeBase = sanitiseFileBase(file.name);
    const ext = outMime === "image/png" ? "png" : "jpg";
    const newFile = new File([outBlob], `${safeBase}.${ext}`, {
      type: outMime,
    });
    return { ok: true, file: newFile };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readArrayBuffer(blob: Blob): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => resolve(reader.result as ArrayBuffer | null);
    reader.readAsArrayBuffer(blob);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.decoding = "async";
    img.src = url;
  });
}

/**
 * Strip everything except `[a-z0-9._-]` from the file basename and clamp the
 * length. Falls back to "reference" when the result is empty. This prevents
 * downstream storage / mail clients from interpreting bidi-overrides, path
 * separators, control characters or RTLO tricks in the file name.
 */
function sanitiseFileBase(originalName: string): string {
  const stem = String(originalName)
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 64);
  return stem || "reference";
}
