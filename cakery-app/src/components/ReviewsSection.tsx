import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Stars from "./Stars";
import { REVIEWS } from "@/lib/reviews-data";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Lang, Messages } from "@/lib/i18n";

export default function ReviewsSection({
  lang,
  t,
}: {
  lang: Lang;
  t: Messages;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const total = REVIEWS.length;

  const go = useCallback(
    (idx: number) => setCurrent((idx + total) % total),
    [total],
  );

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % total), 5000);
    return () => clearInterval(id);
  }, [paused, reduced, total]);

  const review = REVIEWS[current];
  if (!review) return null;

  return (
    <section
      id="reviews-section"
      className="relative scroll-mt-24 overflow-hidden bg-espresso py-24 text-porcelain sm:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setPaused(false);
      }}
    >
      <div className="pointer-events-none absolute -left-32 top-10 h-[460px] w-[460px] rounded-full bg-caramel/25 blur-[160px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-chocolate/30 blur-[160px]" />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8 lg:px-12">
        <div className="reveal mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel/90">
            · {t.reviewsEyebrow}
          </p>
          <h2 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-[-0.035em] sm:text-6xl">
            {t.reviewsTitle}
          </h2>
          <p className="mt-4 text-porcelain/65">{t.reviewsSub}</p>
        </div>

        <div className="relative">
          <div
            key={review.id}
            className="pop-in rounded-3xl border border-porcelain/10 bg-porcelain/5 p-8 shadow-ring backdrop-blur-md sm:p-12"
          >
            <span
              aria-hidden="true"
              className="font-display text-7xl leading-none text-caramel/70"
            >
              “
            </span>
            <p className="-mt-4 text-xl leading-relaxed text-porcelain sm:text-2xl">
              {review.text[lang]}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-porcelain/10 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-caramel font-display text-base font-semibold text-espresso">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{review.author}</p>
                  <p className="text-xs text-porcelain/50">
                    {review.date[lang]}
                  </p>
                </div>
              </div>
              <Stars count={review.stars} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label={t.prevAria}
            className="absolute -left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-porcelain/20 bg-porcelain/10 text-porcelain shadow-soft backdrop-blur transition hover:bg-porcelain hover:text-espresso sm:-left-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label={t.nextAria}
            className="absolute -right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-porcelain/20 bg-porcelain/10 text-porcelain shadow-soft backdrop-blur transition hover:bg-porcelain hover:text-espresso sm:-right-8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-2" role="tablist">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ease-silk ${
                i === current
                  ? "w-8 bg-caramel"
                  : "w-1.5 bg-porcelain/30 hover:bg-porcelain/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
