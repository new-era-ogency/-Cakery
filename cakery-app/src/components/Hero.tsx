import { useEffect, useRef } from "react";
import MagneticButton from "./MagneticButton";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Messages } from "@/lib/i18n";

const HERO_IMG =
  "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1400&q=85";

export default function Hero({ t }: { t: Messages }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined" || reduced) return;

    const onScroll = () => {
      const el = imgRef.current;
      if (!el) return;
      const y = Math.min(window.scrollY, 400);
      el.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(${
        1 + y * 0.0004
      })`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const rafId = window.requestAnimationFrame(onScroll);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduced]);

  return (
    <section
      className="relative isolate overflow-hidden bg-porcelain"
      aria-labelledby="hero-title"
    >
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-caramel/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full bg-chocolate/15 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pt-16">
        <div className="lg:col-span-7 lg:pt-10">
          <div className="reveal flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            <span className="h-px w-10 bg-caramel/60" />
            {t.heroEyebrow}
          </div>

          <h1
            id="hero-title"
            className="reveal mt-6 font-display text-[clamp(3rem,9vw,7rem)] font-bold leading-[0.92] tracking-[-0.035em] text-espresso"
          >
            {t.heroH1Line1}
            <br />
            <span className="font-light italic text-chocolate">
              {t.heroH1Line2}
            </span>
          </h1>

          <p className="reveal mt-6 max-w-md text-lg leading-relaxed text-espresso/70 sm:text-xl">
            {t.heroLede}
          </p>

          <div className="reveal mt-9 flex flex-wrap items-center gap-5">
            <MagneticButton
              href="#order-section"
              className="btn-premium group rounded-full bg-espresso px-10 py-4 text-base font-semibold text-porcelain shadow-lift transition-all duration-500 ease-silk hover:shadow-ring"
            >
              <span className="inline-flex items-center gap-3 tracking-wide">
                {t.ctaOrder}
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-caramel/95 text-espresso transition-transform duration-500 ease-silk group-hover:translate-x-1 group-hover:rotate-12"
                >
                  →
                </span>
              </span>
            </MagneticButton>

            <a
              href="#menu-section"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-espresso/70 underline-offset-[6px] hover:text-espresso hover:underline"
            >
              {t.ctaMenu}
            </a>
          </div>

          <dl className="reveal mt-12 grid grid-cols-3 gap-6 border-t border-espresso/10 pt-6 text-sm sm:max-w-md">
            <div>
              <dt className="text-xs uppercase tracking-widest text-espresso/50">
                {t.heroStat1Label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-espresso">
                4.8★
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-espresso/50">
                {t.heroStat2Label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-espresso">
                200+
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-espresso/50">
                {t.heroStat3Label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-espresso">
                100%
              </dd>
            </div>
          </dl>
        </div>

        <div className="reveal relative lg:col-span-5">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[28px] shadow-ring lg:max-w-none">
            <img
              ref={imgRef}
              src={HERO_IMG}
              alt="Pastel handcrafted layer cake"
              className="h-full w-full object-cover transition-transform duration-700 ease-silk"
              fetchPriority="high"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/35 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-xs text-white backdrop-blur-md">
              <span className="font-semibold uppercase tracking-widest">
                {t.heroBadge}
              </span>
              <span className="opacity-80">от 60 BGN</span>
            </div>
          </div>

          <div className="absolute -left-5 top-10 hidden items-center gap-2 rounded-full border border-espresso/10 bg-white/85 px-4 py-2 text-xs font-semibold text-espresso shadow-soft backdrop-blur-md sm:flex">
            <span aria-hidden="true">✦</span>
            {t.heroChip}
          </div>
        </div>
      </div>

      <div className="relative mt-16 overflow-hidden border-y border-espresso/10 bg-cream/40 py-4">
        <div className="marquee-track flex shrink-0 items-center gap-12 whitespace-nowrap font-display text-2xl italic text-espresso/55 sm:text-3xl">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-12 pr-12">
              {t.marquee.map((m, i) => (
                <span
                  key={`${dup}-${i}`}
                  className="flex items-center gap-12"
                >
                  {m}
                  <span aria-hidden="true" className="text-caramel">
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
