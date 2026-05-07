import { Instagram, Facebook, Phone } from "lucide-react";
import MagneticButton from "./MagneticButton";
import type { Messages } from "@/lib/i18n";
import {
  MAP_EMBED,
  MAP_LINK,
  PHONE_DISPLAY,
  PHONE_E164,
  PHONE_WA,
} from "@/lib/constants";

// Social profile URLs are deliberately undefined until the operator pastes the
// real, owned profile URLs here. Pointing to bare domains (instagram.com /
// facebook.com) is a phishing risk if an impostor squats on the brand handle.
// The icons render in a disabled state until each value is set.
const SOCIAL = {
  instagram: undefined as string | undefined,
  facebook: undefined as string | undefined,
} as const;

function SocialLink({
  href,
  label,
  children,
}: {
  href: string | undefined;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-porcelain/15 transition";
  if (!href) {
    return (
      <span
        aria-label={`${label} (not configured)`}
        title={`${label} — not configured`}
        className={`${base} cursor-not-allowed text-porcelain/30`}
      >
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer external"
      aria-label={label}
      className={`${base} text-porcelain hover:border-caramel hover:text-caramel`}
    >
      {children}
    </a>
  );
}

function SocialLinks({ waUrl }: { waUrl: string }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <SocialLink href={SOCIAL.instagram} label="Instagram">
        <Instagram className="h-5 w-5" />
      </SocialLink>
      <SocialLink href={SOCIAL.facebook} label="Facebook">
        <Facebook className="h-5 w-5" />
      </SocialLink>
      <SocialLink href={waUrl} label="WhatsApp">
        <Phone className="h-4 w-4" />
      </SocialLink>
    </div>
  );
}

export default function Footer({ t }: { t: Messages }) {
  const navCols = [
    {
      title: t.footerNavCakery,
      links: [
        { href: "#about", label: t.navAbout },
        { href: "#menu-section", label: t.navMenu },
        { href: "#gallery-section", label: t.navGallery },
        { href: "#reviews-section", label: t.navReviews },
      ],
    },
    {
      title: t.footerNavOrder,
      links: [
        { href: "#order-section", label: t.orderCake },
        { href: "#contact", label: t.navContact },
        { href: `tel:${PHONE_E164}`, label: PHONE_DISPLAY },
        {
          href: `https://wa.me/${PHONE_WA}`,
          label: "WhatsApp",
          external: true,
        },
      ],
    },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-espresso text-porcelain">
      <div className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-caramel/20 blur-[180px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-[460px] w-[460px] rounded-full bg-chocolate/30 blur-[180px]" />

      <div className="relative border-b border-porcelain/10 bg-ink/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              {t.footerHeadline1}
              <br />
              <span className="font-light italic text-caramel">
                {t.footerHeadline2}
              </span>
            </h2>
            <MagneticButton
              href="#order-section"
              className="btn-premium group rounded-full bg-caramel px-9 py-4 text-sm font-semibold uppercase tracking-widest text-espresso shadow-lift hover:bg-porcelain"
            >
              <span className="inline-flex items-center gap-3">
                {t.ctaOrder}
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-espresso text-porcelain transition-transform duration-500 ease-silk group-hover:translate-x-1 group-hover:rotate-12"
                >
                  →
                </span>
              </span>
            </MagneticButton>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <a
              href="#"
              className="font-display text-3xl font-semibold tracking-tight"
            >
              Cakery<span className="text-caramel">.</span>
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-porcelain/65">
              {t.footerAbout}
            </p>

            <SocialLinks waUrl={`https://wa.me/${PHONE_WA}`} />
          </div>

          {navCols.map((col) => (
            <div key={col.title} className="md:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.external ? "_blank" : undefined}
                      rel={l.external ? "noopener noreferrer external" : undefined}
                      className="text-porcelain/75 transition hover:text-caramel"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1" />
        </div>

        <div className="mt-14 grid gap-10 border-t border-porcelain/10 pt-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
              {t.footerHours}
            </p>
            <dl className="mt-5 divide-y divide-porcelain/10 text-sm">
              {[
                [t.dayMonFri, "08:00 — 20:00"],
                [t.daySat, "09:00 — 20:00"],
                [t.daySun, "09:00 — 18:00"],
              ].map(([day, hrs]) => (
                <div
                  key={day}
                  className="flex items-center justify-between py-3"
                >
                  <dt className="text-porcelain/60">{day}</dt>
                  <dd className="font-display tabular-nums">{hrs}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="md:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
              {t.navContact}
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-porcelain/10 shadow-ring">
              <iframe
                src={MAP_EMBED}
                width="100%"
                height="240"
                style={{ border: 0, display: "block", filter: "saturate(0.9)" }}
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title={t.mapAria}
                aria-label={t.mapAria}
              />
            </div>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noopener noreferrer external"
              className="mt-3 inline-flex items-center gap-2 text-sm text-porcelain/70 hover:text-caramel"
            >
              {t.footerAddr} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden border-t border-porcelain/10">
        <p
          aria-hidden="true"
          className="pointer-events-none whitespace-nowrap py-8 text-center font-display font-bold leading-none tracking-[-0.05em] text-porcelain/[0.06] sm:py-10"
          style={{ fontSize: "clamp(7rem, 22vw, 22rem)" }}
        >
          Cakery
          <span className="font-light italic text-caramel/30">.</span>
        </p>
      </div>

      <div className="relative border-t border-porcelain/10 bg-ink/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-porcelain/50 sm:flex-row sm:px-8 lg:px-12">
          <p>
            © {new Date().getFullYear()} Cakery · Кейкъри. {t.footerRights}
          </p>
          <p className="font-display italic text-porcelain/65">
            ✦ {t.footerMade}
          </p>
        </div>
      </div>
    </footer>
  );
}
