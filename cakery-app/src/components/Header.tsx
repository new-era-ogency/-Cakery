import { useEffect, useRef, useCallback } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import type { Lang, Messages } from "@/lib/i18n";

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
  const barRef = useRef<HTMLDivElement>(null);

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
      panelRef.current
        ?.querySelector<HTMLElement>('nav[aria-label="Mobile"] a')
        ?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      menuBtnRef.current?.focus();
    };
  }, [mobileOpen, setMobileOpen]);

  const trapFocus = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current || !barRef.current) return;
    const barEls = barRef.current.querySelectorAll<HTMLElement>(
      'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])',
    );
    const panelEls = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])',
    );
    const list = [...Array.from(barEls), ...Array.from(panelEls)];
    if (!list.length) return;
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
  }, []);

  return (
    <header className="sticky top-0 z-[60]">
      <div
        ref={barRef}
        className="relative z-[70] border-b border-espresso/10 bg-porcelain/95 backdrop-blur-xl"
      >
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
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-espresso/15 bg-white/80 text-espresso transition-colors md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileOpen ? t.closeMenuAria : t.menuAria}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <MenuIcon className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>
      </div>
      </div>

      {mobileOpen ? (
          <div
            ref={panelRef}
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            onKeyDown={trapFocus}
            className="pop-in fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col overflow-y-auto bg-porcelain md:hidden sm:top-16"
          >
            <nav
              className="flex flex-1 flex-col items-center justify-center px-6 py-10"
              aria-label="Mobile"
            >
              <div className="flex w-full max-w-sm flex-col items-center space-y-8">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="block w-full py-3 text-center font-display text-2xl font-semibold text-espresso transition duration-300 ease-out hover:text-caramel sm:text-3xl"
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="mt-10 w-full max-w-sm shrink-0 border-t border-espresso/10 pt-10">
                <a
                  href="#order-section"
                  className="btn-premium flex min-h-[52px] w-full items-center justify-center rounded-full bg-espresso px-6 text-base font-semibold text-porcelain shadow-lift transition hover:bg-ink"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.orderCake}
                </a>
              </div>
            </nav>
          </div>
      ) : null}
    </header>
  );
}
