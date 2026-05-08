import { useEffect, useRef, useCallback } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import type { Lang, Messages } from "@/lib/i18n";
import { PHONE_DISPLAY, PHONE_E164 } from "@/lib/constants";

type Props = {
  lang: Lang;
  setLang: (l: Lang) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  t: Messages;
};

export default function Header({
  lang,
  setLang,
  mobileOpen,
  setMobileOpen,
  t,
}: Props) {
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "#menu-section", label: t.navMenu },
    { href: "#gallery-section", label: t.navGallery },
    { href: "#reviews-section", label: t.navReviews },
    { href: "#about", label: t.navAbout },
    { href: "#contact", label: t.navContact },
  ];

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      menuBtnRef.current?.focus();
    };
  }, [mobileOpen, setMobileOpen]);

  const trapFocus = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])',
      );
      if (!nodes.length) return;
      const list = Array.from(nodes);
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [],
  );

  return (
    <header className="sticky top-0 z-40 border-b border-espresso/10 bg-porcelain/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-8 lg:px-12">
        <a
          href="#"
          className="font-display text-xl font-semibold tracking-tight text-espresso sm:text-2xl"
        >
          Cakery<span className="ml-1 text-caramel">.</span>
        </a>

        <nav
          className="hidden flex-1 items-center justify-center gap-8 md:flex"
          aria-label="Main"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-sm font-medium text-espresso/70 transition hover:text-espresso"
            >
              {l.label}
              <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 bg-caramel transition-all duration-500 ease-silk group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="flex rounded-full border border-espresso/10 bg-white/70 p-0.5 shadow-soft"
            role="group"
            aria-label="Language"
          >
            {(["bg", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`min-h-[44px] min-w-[44px] rounded-full px-3 text-xs font-semibold uppercase tracking-widest transition ${
                  lang === l
                    ? "bg-espresso text-porcelain"
                    : "text-espresso/55 hover:text-espresso"
                }`}
              >
                {l === "bg" ? t.langBg : t.langEn}
              </button>
            ))}
          </div>

          <a
            href="#order-section"
            className="hidden rounded-full bg-espresso px-5 text-xs font-semibold uppercase tracking-widest text-porcelain shadow-soft transition hover:bg-ink md:inline-flex md:min-h-[40px] md:items-center"
          >
            {t.orderCake}
          </a>

          <button
            ref={menuBtnRef}
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-espresso/15 bg-white/80 text-espresso md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            aria-label={t.menuAria}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-50 md:hidden"
          role="presentation"
        >
          <div
            className="pop-in absolute inset-0 bg-ink/60 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            onKeyDown={trapFocus}
            className="pop-in absolute right-0 top-0 flex h-full w-[min(100%,340px)] flex-col bg-espresso text-porcelain shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between border-b border-porcelain/10 px-5 py-4">
              <span className="font-display text-xl font-semibold">
                Cakery<span className="text-caramel">.</span>
              </span>
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-porcelain/10 text-porcelain hover:bg-porcelain/20"
                onClick={() => setMobileOpen(false)}
                aria-label={t.closeMenuAria}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav
              className="flex flex-1 flex-col gap-1 px-5 pt-6"
              aria-label="Mobile"
            >
              {links.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="border-b border-porcelain/5 py-4 font-display text-2xl font-semibold text-porcelain transition hover:translate-x-1 hover:text-caramel"
                  onClick={() => setMobileOpen(false)}
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#order-section"
                className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-caramel px-6 text-base font-semibold text-espresso shadow-lift hover:bg-porcelain"
                onClick={() => setMobileOpen(false)}
              >
                {t.orderCake} →
              </a>
            </nav>
            <div className="border-t border-porcelain/10 p-5 text-xs text-porcelain/60">
              <p className="font-semibold uppercase tracking-widest text-porcelain/80">
                {t.navContact}
              </p>
              <p className="mt-2">{t.footerAddr}</p>
              <a
                href={`tel:${PHONE_E164}`}
                className="mt-2 inline-block font-semibold text-porcelain hover:text-caramel"
              >
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
