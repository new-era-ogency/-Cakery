import type { Messages } from "@/lib/i18n";

export default function AboutSection({ t }: { t: Messages }) {
  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden bg-cream/30 py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute right-0 top-1/4 h-[440px] w-[440px] rounded-full bg-caramel/15 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-chocolate/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-20">
          <div className="reveal relative order-2 lg:order-1 lg:col-span-6">
            <div className="aspect-[4/5] overflow-hidden rounded-[28px] shadow-ring">
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85"
                alt="Cakery kitchen"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1500ms] ease-silk hover:scale-[1.04]"
              />
            </div>
            <div className="absolute -right-6 bottom-8 hidden aspect-square w-44 overflow-hidden rounded-3xl border-4 border-porcelain shadow-lift sm:block">
              <img
                src="https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=85"
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="reveal order-1 lg:order-2 lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
              · {t.aboutEyebrow}
            </p>
            <h2 className="mt-3 whitespace-pre-line font-display text-[clamp(2rem,7vw,3.75rem)] font-bold leading-[0.95] tracking-[-0.035em] text-espresso md:text-6xl lg:text-7xl">
              {t.aboutTitle}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-espresso/70 sm:text-lg md:text-xl">
              {t.aboutText}
            </p>

            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { k: "01", v: t.aboutBadge1 },
                { k: "02", v: t.aboutBadge2 },
                { k: "03", v: t.aboutBadge3 },
              ].map(({ k, v }) => (
                <div
                  key={k}
                  className="card-glow rounded-2xl border border-espresso/10 bg-white/70 p-5 shadow-soft backdrop-blur-md"
                >
                  <dt className="font-display text-3xl font-bold text-caramel">
                    {k}
                  </dt>
                  <dd className="mt-2 text-sm font-medium uppercase tracking-widest text-espresso">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
