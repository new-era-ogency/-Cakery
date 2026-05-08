import { useState } from "react";
import type { Lang, Messages } from "@/lib/i18n";
import { MENU } from "@/lib/menu-data";

const TAB_KEYS = ["cakes", "pastries", "bakery"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function MenuSection({
  lang,
  t,
}: {
  lang: Lang;
  t: Messages;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("cakes");
  const tabLabels: Record<TabKey, string> = {
    cakes: t.tabCakes,
    pastries: t.tabPastries,
    bakery: t.tabBakery,
  };
  const items = MENU[activeTab];
  const [featured, ...rest] = items;
  if (!featured) return null;

  return (
    <section
      id="menu-section"
      className="relative scroll-mt-24 overflow-hidden bg-porcelain pb-20 pt-24 sm:pb-28 sm:pt-32"
    >
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-caramel/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-10 h-[280px] w-[280px] rounded-full bg-chocolate/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="reveal flex flex-col gap-6 pb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pb-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
              · {t.menuEyebrow}
            </p>
            <h2 className="mt-3 whitespace-pre-line font-display text-[clamp(2rem,7vw,3.75rem)] font-bold leading-[0.95] tracking-[-0.035em] text-espresso sm:text-5xl md:text-6xl">
              {t.menuTitle}
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-relaxed text-espresso/60 md:block">
            {t.menuSub}
          </p>
        </div>

        <div className="reveal mb-12 flex justify-center px-1">
          <div
            className="flex max-w-full flex-wrap justify-center gap-1 rounded-full border border-espresso/10 bg-white/70 p-1 shadow-soft backdrop-blur-md"
            role="tablist"
          >
            {TAB_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-all duration-500 ease-silk sm:px-6 ${
                  activeTab === key
                    ? "bg-espresso text-porcelain shadow-lift"
                    : "text-espresso/60 hover:text-espresso"
                }`}
              >
                {tabLabels[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:auto-rows-[260px] lg:grid-cols-3">
          <article
            key={featured.id}
            className="reveal card-glow group relative col-span-1 flex flex-col overflow-hidden rounded-[28px] border border-espresso/10 bg-white shadow-soft lg:col-span-2 lg:row-span-2"
          >
            <div className="relative h-72 flex-1 overflow-hidden bg-cream/60 lg:h-auto">
              <img
                src={featured.img}
                alt={featured.name[lang]}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-silk group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full border border-porcelain/30 bg-porcelain/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-porcelain backdrop-blur">
                {t.menuFeatured}
              </span>
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-porcelain">
                <div>
                  <h3 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
                    {featured.name[lang]}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-porcelain/85">
                    {featured.desc[lang]}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <span className="font-display text-3xl font-bold tabular-nums">
                    {featured.price.toFixed(0)}
                    <span className="ml-1 text-sm font-normal text-porcelain/70">
                      {t.currency}
                    </span>
                  </span>
                  <a
                    href="#order-section"
                    className="btn-premium inline-flex min-h-[44px] items-center gap-2 rounded-full bg-caramel px-5 text-xs font-semibold uppercase tracking-widest text-espresso shadow-soft hover:bg-porcelain"
                  >
                    <span>{t.orderCake}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </article>

          {rest.map((item, idx) => (
            <article
              key={item.id}
              className="reveal card-glow group relative flex overflow-hidden rounded-[28px] border border-espresso/10 bg-white shadow-soft"
              style={{ transitionDelay: `${idx * 60}ms` }}
            >
              <div className="relative aspect-square w-1/2 shrink-0 overflow-hidden bg-cream/60">
                <img
                  src={item.img}
                  alt={item.name[lang]}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-espresso">
                    {item.name[lang]}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-espresso/65">
                    {item.desc[lang]}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-espresso/10 pt-3">
                  <span className="font-display text-lg font-bold text-espresso">
                    {item.price.toFixed(2)}
                    <span className="ml-0.5 text-[10px] font-normal text-espresso/50">
                      {t.currency}
                    </span>
                  </span>
                  <a
                    href="#order-section"
                    aria-label={t.orderCake}
                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-cream text-espresso transition group-hover:bg-espresso group-hover:text-porcelain"
                  >
                    →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
