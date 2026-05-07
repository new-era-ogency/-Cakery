import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const LS_KEY = "cakery-lang";

function readInitial(): Lang {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "bg" || v === "en") return v;
  } catch {
    /* localStorage may be unavailable (e.g. Safari private mode) */
  }
  // Default to Bulgarian (primary audience).
  return "bg";
}

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(() => readInitial());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return { lang, setLang };
}
