import { Star } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { PHONE_DISPLAY, PHONE_E164 } from "@/lib/constants";

export default function ContactSection({ t }: { t: Messages }) {
  return (
    <section id="contact" className="scroll-mt-24 bg-cream/40 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-3 lg:px-12">
        <div className="reveal rounded-3xl border border-espresso/10 bg-white/80 p-7 shadow-soft backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.ratingTitle}
          </p>
          <div className="mt-5 flex items-end gap-3">
            <span className="font-display text-6xl font-semibold tracking-tight text-espresso">
              4.8
            </span>
            <div className="pb-2">
              <div className="flex gap-0.5 text-caramel">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
                ))}
                <span className="relative h-5 w-5 overflow-hidden">
                  <Star className="h-5 w-5" fill="none" strokeWidth={1.5} />
                  <span
                    className="absolute left-0 top-0 h-full overflow-hidden"
                    style={{ width: "80%" }}
                  >
                    <Star className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-widest text-espresso/45">
                200+ {t.ratingCount}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-espresso/65">
            {t.ratingCaption}
          </p>
        </div>

        <div className="reveal rounded-3xl border border-espresso/10 bg-white/80 p-7 shadow-soft backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.navContact}
          </p>
          <ul className="mt-5 space-y-3 text-sm text-espresso/80">
            <li className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-caramel">◇</span>
              <span>{t.footerAddr}</span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-caramel">☎</span>
              <a
                href={`tel:${PHONE_E164}`}
                className="font-semibold underline-offset-4 hover:text-caramel hover:underline"
              >
                {PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-caramel">◴</span>
              <span>{t.footerHours}</span>
            </li>
          </ul>
        </div>

        <div className="reveal card-glow relative isolate overflow-hidden rounded-3xl border border-espresso/10 bg-espresso p-7 text-porcelain shadow-lift">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-caramel/30 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.orderCake}
          </p>
          <h3 className="mt-4 font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
            {t.contactCtaTitle}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-porcelain/70">
            {t.contactCtaText}
          </p>
          <a
            href="#order-section"
            className="btn-premium group mt-7 inline-flex min-h-[48px] items-center gap-3 rounded-full bg-porcelain px-7 text-sm font-semibold text-espresso shadow-soft hover:bg-caramel"
          >
            {t.ctaOrder}
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-espresso text-porcelain transition-transform duration-500 ease-silk group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
