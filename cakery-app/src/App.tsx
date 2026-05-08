import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MenuSection from "./components/MenuSection";
import GallerySection from "./components/GallerySection";
import ReviewsSection from "./components/ReviewsSection";
import AboutSection from "./components/AboutSection";
import ContactSection from "./components/ContactSection";
import CakeConstructor from "./components/CakeConstructor";
import Footer from "./components/Footer";
import MobileCallBar from "./components/MobileCallBar";

import { useLanguage } from "./hooks/useLanguage";
import { useReveal } from "./hooks/useReveal";
import { COPY } from "./lib/i18n";

export default function App() {
  const { lang, setLang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = lang === "en" ? COPY.en : COPY.bg;

  useReveal();

  return (
    <>
      <Header
        lang={lang}
        setLang={setLang}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        t={t}
      />
      <main className="pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Hero t={t} />
        <MenuSection lang={lang} t={t} />
        <AboutSection t={t} />
        <ReviewsSection lang={lang} t={t} />
        <GallerySection t={t} />
        <ContactSection t={t} />
        <CakeConstructor lang={lang} t={t} />
      </main>
      <Footer t={t} />
      <MobileCallBar t={t} />
    </>
  );
}
