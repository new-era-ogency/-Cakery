import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { GALLERY, type GalleryImage } from "@/lib/gallery-data";
import type { Messages } from "@/lib/i18n";

export default function GallerySection({ t }: { t: Messages }) {
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);
  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, close]);

  return (
    <section
      id="gallery-section"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-porcelain via-cream/30 to-porcelain py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute -left-24 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-caramel/15 blur-[140px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-[340px] w-[340px] rounded-full bg-chocolate/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="reveal mb-14 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.galleryEyebrow}
          </p>
          <h2 className="mt-3 whitespace-pre-line font-display text-[clamp(2rem,7vw,3.75rem)] font-bold leading-[0.95] tracking-[-0.035em] text-espresso sm:text-5xl md:text-6xl">
            {t.galleryTitle}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-espresso/65 sm:text-lg">
            {t.gallerySub}
          </p>
        </div>

        <div
          style={{
            columnCount: "auto",
            columnWidth: "260px",
            columnGap: "16px",
          }}
        >
          {GALLERY.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              className="reveal group relative mb-4 w-full cursor-zoom-in overflow-hidden rounded-2xl bg-cream shadow-soft transition-all duration-500 ease-silk hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-espresso"
              style={{ breakInside: "avoid", transitionDelay: `${idx * 40}ms` }}
              onClick={() => setLightbox(img)}
              aria-label={`${t.galleryOpenAria}: ${img.alt}`}
            >
              <img
                src={img.src}
                alt=""
                loading="lazy"
                className="pointer-events-none block h-auto w-full object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-110"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-espresso/85 to-transparent p-4 text-left text-xs font-medium uppercase tracking-widest text-porcelain opacity-0 transition-all duration-500 ease-silk group-hover:translate-y-0 group-hover:opacity-100">
                {img.alt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="pop-in fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src.replace("w=720", "w=1400")}
              alt={lightbox.alt}
              className="h-auto max-h-[80vh] w-full rounded-3xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={close}
              className="absolute -right-3 -top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-espresso shadow-lift transition hover:scale-105"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="mt-4 text-center text-sm text-cream/80">
              {lightbox.alt}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
