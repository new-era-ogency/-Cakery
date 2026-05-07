const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── Reveal-on-scroll hook ──────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".reveal").forEach((el) =>
        el.classList.add("is-visible"),
      );
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) =>
      io.observe(el),
    );
    return () => io.disconnect();
  });
}

// ─── prefers-reduced-motion hook ─────────────────────────────────────────────
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return reduced;
}

// ─── Magnetic button: лек pull към курсора ──────────────────────────────────
function MagneticButton({ as: Tag = "a", className = "", children, ...rest }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const onMove = (e) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const strength = 0.18;
    ref.current.style.transform = `translate3d(${x * strength}px, ${
      y * strength
    }px, 0)`;
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate3d(0,0,0)";
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`magnetic inline-block ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ─── Configuration ───────────────────────────────────────────────────────────
// Replace with the real Formspree endpoint before deploying. The form refuses
// to submit while this still contains "your-form-id". Configure server-side
// reCAPTCHA, allowed-domains and rate limiting in the Formspree dashboard —
// browser validation is defence-in-depth only.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/your-form-id";
const FORMSPREE_PLACEHOLDER = "your-form-id";

const PHONE_DISPLAY = "088 884 9908";
const PHONE_TEL = "+359888849908";
const PHONE_WA = "359888849908";
const ADDRESS_QUERY = "Sv. Kipriyan 260B, Mladost 2, Sofia";
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_QUERY)}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_QUERY)}`;

// Field length limits — duplicated in Zod schema; ALSO enforce server-side.
const LIMITS = {
  decor: 1000,
  notes: 1000,
  name: 100,
  phone: 30,
  email: 200,
};
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// ─── i18n ───────────────────────────────────────────────────────────────────
const COPY = {
  bg: {
    navMenu: "Меню",
    navAbout: "За нас",
    navGallery: "Галерия",
    navReviews: "Отзиви",
    navContact: "Контакти",
    orderCake: "Поръчай торта",
    langBg: "БГ",
    langEn: "EN",
    menuAria: "Отвори навигацията",
    closeMenuAria: "Затвори навигацията",
    prevAria: "Предишен",
    nextAria: "Следващ",
    heroEyebrow: "Сладкарница · Младост 2, София",
    heroTitle: "Cakery · Кейкъри",
    heroH1Line1: "Торти,",
    heroH1Line2: "правени с ръка.",
    heroLede:
      "Малка, авторска сладкарница в сърцето на Младост. Пресни блатове всеки ден, торти по поръчка и десерти, които заслужават масата ви.",
    heroBadge: "Поръчка с фото-референс",
    heroChip: "Тортата на месеца",
    heroStat1Label: "Google Maps",
    heroStat2Label: "Доволни клиенти",
    heroStat3Label: "Ръчна изработка",
    marquee1: "Торти по поръчка",
    marquee2: "Пресни круасани",
    marquee3: "Баница всяка сутрин",
    marquee4: "Корпоративни поръчки",
    marquee5: "Десерти от шефа",
    ctaMenu: "Виж менюто",
    ctaOrder: "Поръчай торта",
    aboutEyebrow: "За нас",
    aboutTitle: "Малка сладкарница, голямо внимание.",
    aboutText:
      "Cakery / Кейкъри е авторска сладкарница със собствено производство в Младост 2. Работим с пресни български продукти, печем по класически рецепти и държим менюто малко — защото предпочитаме да бъдем добри в няколко неща, отколкото средни в много.",
    aboutBadge1: "Ръчна изработка",
    aboutBadge2: "Пресни продукти",
    aboutBadge3: "Торти по поръчка",
    reviewsEyebrow: "Гласове",
    ratingTitle: "Доверие",
    ratingCaption: "Натрупан от клиенти средно за всички наши гости в Google Maps.",
    ratingCount: "отзива",
    contactCtaTitle: "Готови сме за вашия рожден ден.",
    contactCtaText:
      "Изпратете заявка с дата, тема и фото референс — отговаряме до 2 часа в работно време.",
    menuEyebrow: "Меню",
    menuTitle: "Любими вкусове,\nпечени всеки ден.",
    menuSub:
      "Малък, но грижливо подбран асортимент: тортите ни се правят сутрин, по класически рецепти, без съкращения.",
    menuFeatured: "Топ избор · сезонна",
    tabCakes: "Торти",
    tabPastries: "Пирожни",
    tabBakery: "Тестени",
    currency: "лв.",
    galleryEyebrow: "Галерия",
    galleryTitle: "Малки изкушения, премислени до детайл.",
    gallerySub:
      "Кадри от ежедневието на сладкарницата — снимки на работите ни, които правим за рождени дни, сватби и кафе паузи.",
    galleryOpenAria: "Отвори снимка",
    reviewsTitle: "Какво казват клиентите",
    reviewsSub: "Истински отзиви от Google Maps",
    footerAddr: "ул. Св. Киприян 260Б, Младост 2, София",
    footerPhone: "088 884 9908",
    footerHours: "Работно време",
    dayMonFri: "Понеделник — Петък",
    daySat: "Събота",
    daySun: "Неделя",
    footerNavCakery: "За Cakery",
    footerNavOrder: "Поръчки",
    footerHeadline1: "Сладко начало",
    footerHeadline2: "за всеки повод.",
    footerAbout:
      "Авторска сладкарница в Младост 2, София. Свежи блатове, ръчна работа и торти по поръчка.",
    footerRights: "Всички права запазени.",
    footerMade: "Печем с любов на ул. Св. Киприян 260Б.",
    mapAria: "Карта на Google към Cakery",
    routeBtn: "Покажи маршрут",
    callBtn: "Обади се",
    waBtn: "WhatsApp",
    orderHero: "Поръчай своята торта",
    orderHeroSub: "Шест бързи стъпки — ще се свържем за потвърждение в рамките на 2 часа.",
    stepLabel: "Стъпка",
    of: "от",
    next: "Напред",
    back: "Назад",
    submit: "Изпрати поръчката",
    sending: "Изпращане…",
    successTitle: "Благодарим Ви!",
    successText: "Вашата поръчка е приета. Ще се свържем с Вас на номер +359 88 884 9908 за потвърждение.",
    errorTitle: "Нещо се обърка",
    errorText: "Моля, опитайте отново или ни се обадете директно.",
    tryAgain: "Опитай отново",
    s1Title: "Размер на тортата",
    s1Sub: "Изберете броя на порциите.",
    s2Title: "Вкус на блатовете",
    s3Title: "Крем (изберете един или повече)",
    s4Title: "Декор и тема",
    s4Decor: "Опишете темата, цветовете и декорацията",
    s4Photo: "Прикачете референс снимка (по избор, до 5MB)",
    s4Hint: "JPG или PNG · до 5MB",
    s5Title: "Дата и час за вземане",
    s5Date: "Дата (минимум 3 дни напред)",
    s5Time: "Час за вземане",
    s6Title: "Контактни данни",
    s6Name: "Име",
    s6Phone: "Телефон",
    s6Email: "Имейл (по избор)",
    s6Notes: "Допълнително (по избор)",
    s6Gdpr: "Съгласен/-на съм с обработката на личните ми данни съгласно GDPR.",
    privacyLink: "Политика за поверителност",
    privacyTitle: "Как обработваме данните Ви",
    privacyBullets: [
      "Имената, телефонът и имейлът се използват само за обработка на тази поръчка.",
      "Данните се съхраняват до 12 месеца и след това се изтриват.",
      "Изпратените данни се обработват от Formspree LLC (САЩ) като подизпълнител — DPA по GDPR.",
      "Можете да поискате достъп, корекция или изтриване по всяко време чрез контактите ни.",
    ],
    required: "Задължително поле",
    invalid: "Невалидна стойност",
    invalidPhone: "Въведете валиден телефонен номер",
    invalidEmail: "Въведете валиден имейл",
    invalidDate: "Изберете дата минимум 3 дни напред",
    tooLong: "Текстът е твърде дълъг",
    fileTooBig: "Файлът е твърде голям (макс. 5MB)",
    fileWrongType: "Поддържат се само JPG и PNG",
    fileCorrupt: "Файлът не изглежда като валидно изображение",
    zodLoading: "Зареждане на валидатора…",
    zodFailed: "Не успяхме да заредим валидатора. Натиснете „Опитай отново“ или презаредете страницата.",
    retryValidator: "Опитай отново",
    formNotConfigured: "Формата все още не е свързана. Моля, обадете се на",
    sizeOptions: [
      { id: "6", label: "6 порции · 18 см", priceFrom: 60 },
      { id: "10", label: "10 порции · 22 см", priceFrom: 90 },
      { id: "16", label: "16 порции · 26 см", priceFrom: 130 },
      { id: "20", label: "20+ порции · 30 см", priceFrom: 170 },
    ],
    flavorOptions: [
      { id: "vanilla", label: "Ванилия" },
      { id: "chocolate", label: "Шоколад" },
      { id: "red-velvet", label: "Червено кадифе" },
      { id: "lemon", label: "Лимон" },
      { id: "caramel", label: "Карамел" },
      { id: "other", label: "Друго" },
    ],
    creamOptions: [
      { id: "mascarpone", label: "Маскарпоне" },
      { id: "buttercream", label: "Сметанов" },
      { id: "ganache", label: "Шоколадов ганаш" },
      { id: "fruit", label: "Плодов" },
    ],
    fromShort: "от",
  },
  en: {
    navMenu: "Menu",
    navAbout: "About",
    navGallery: "Gallery",
    navReviews: "Reviews",
    navContact: "Contact",
    orderCake: "Order a cake",
    langBg: "BG",
    langEn: "EN",
    menuAria: "Open navigation",
    closeMenuAria: "Close navigation",
    prevAria: "Previous",
    nextAria: "Next",
    heroEyebrow: "Bakery · Mladost 2, Sofia",
    heroTitle: "Cakery · Кейкъри",
    heroH1Line1: "Cakes",
    heroH1Line2: "made by hand.",
    heroLede:
      "A small, author-driven bakery in the heart of Mladost. Sponges baked daily, custom cakes, and desserts that earn a seat at your table.",
    heroBadge: "Order with reference photo",
    heroChip: "Cake of the month",
    heroStat1Label: "Google Maps",
    heroStat2Label: "Happy guests",
    heroStat3Label: "Handcrafted",
    marquee1: "Custom cakes",
    marquee2: "Fresh croissants",
    marquee3: "Daily banitsa",
    marquee4: "Corporate orders",
    marquee5: "Chef's desserts",
    ctaMenu: "See the menu",
    ctaOrder: "Order a cake",
    aboutEyebrow: "About",
    aboutTitle: "A small bakery with big attention.",
    aboutText:
      "Cakery / Кейкъри is an author-driven bakery with its own kitchen in Mladost 2. We use fresh Bulgarian ingredients, bake to classic recipes, and keep the menu small — we'd rather be great at a few things than average at many.",
    aboutBadge1: "Handmade",
    aboutBadge2: "Fresh daily",
    aboutBadge3: "Custom cakes",
    reviewsEyebrow: "Voices",
    ratingTitle: "Trust",
    ratingCaption: "Average rating across all our guests on Google Maps.",
    ratingCount: "reviews",
    contactCtaTitle: "We're ready for your celebration.",
    contactCtaText:
      "Send a request with date, theme and a reference photo — we reply within 2 hours during business hours.",
    menuEyebrow: "Menu",
    menuTitle: "Favourites,\nbaked daily.",
    menuSub:
      "A small, carefully edited menu: cakes are made every morning to classic recipes, no shortcuts.",
    menuFeatured: "House favourite · seasonal",
    tabCakes: "Cakes",
    tabPastries: "Pastries",
    tabBakery: "Bakery",
    currency: "BGN",
    galleryEyebrow: "Gallery",
    galleryTitle: "Small temptations, considered to the detail.",
    gallerySub:
      "A glimpse of daily life at the bakery — pieces we've made for birthdays, weddings, and slow coffee mornings.",
    galleryOpenAria: "Open photo",
    reviewsTitle: "What guests say",
    reviewsSub: "Real reviews from Google Maps",
    footerAddr: "260B Sv. Kipriyan St, Mladost 2, Sofia",
    footerPhone: "088 884 9908",
    footerHours: "Opening hours",
    dayMonFri: "Monday — Friday",
    daySat: "Saturday",
    daySun: "Sunday",
    footerNavCakery: "About Cakery",
    footerNavOrder: "Orders",
    footerHeadline1: "Sweet beginnings",
    footerHeadline2: "for every occasion.",
    footerAbout:
      "Author-driven bakery in Mladost 2, Sofia. Fresh sponges, handmade craftsmanship and made-to-order cakes.",
    footerRights: "All rights reserved.",
    footerMade: "Baked with love at 260B Sv. Kipriyan.",
    mapAria: "Google map to Cakery",
    routeBtn: "Get directions",
    callBtn: "Call",
    waBtn: "WhatsApp",
    orderHero: "Order your custom cake",
    orderHeroSub: "Six quick steps — we will contact you within 2 hours to confirm.",
    stepLabel: "Step",
    of: "of",
    next: "Next",
    back: "Back",
    submit: "Submit order",
    sending: "Sending…",
    successTitle: "Thank you!",
    successText: "Your order has been received. We will contact you on +359 88 884 9908 to confirm.",
    errorTitle: "Something went wrong",
    errorText: "Please try again or call us directly.",
    tryAgain: "Try again",
    s1Title: "Cake size",
    s1Sub: "Pick the number of servings.",
    s2Title: "Sponge flavour",
    s3Title: "Cream (pick one or more)",
    s4Title: "Decoration & theme",
    s4Decor: "Describe the theme, colours and decorations",
    s4Photo: "Attach a reference photo (optional, up to 5MB)",
    s4Hint: "JPG or PNG · up to 5MB",
    s5Title: "Pickup date & time",
    s5Date: "Date (minimum 3 days ahead)",
    s5Time: "Pickup time",
    s6Title: "Contact details",
    s6Name: "Name",
    s6Phone: "Phone",
    s6Email: "Email (optional)",
    s6Notes: "Additional notes (optional)",
    s6Gdpr: "I consent to the processing of my personal data under GDPR.",
    privacyLink: "Privacy policy",
    privacyTitle: "How we handle your data",
    privacyBullets: [
      "Your name, phone and email are used only to process this order.",
      "We keep this data for up to 12 months, then delete it.",
      "Submissions are processed by Formspree LLC (USA) as a sub-processor under GDPR.",
      "You can request access, correction or deletion at any time via our contacts.",
    ],
    required: "Required field",
    invalid: "Invalid value",
    invalidPhone: "Please enter a valid phone number",
    invalidEmail: "Please enter a valid email",
    invalidDate: "Pick a date at least 3 days ahead",
    tooLong: "Text is too long",
    fileTooBig: "File is too large (max. 5MB)",
    fileWrongType: "Only JPG and PNG are supported",
    fileCorrupt: "The file does not look like a valid image",
    zodLoading: "Loading validator…",
    zodFailed: "Could not load the validator. Tap “Try again” or reload the page.",
    retryValidator: "Try again",
    formNotConfigured: "The form is not connected yet. Please call",
    sizeOptions: [
      { id: "6", label: "6 servings · 18 cm", priceFrom: 60 },
      { id: "10", label: "10 servings · 22 cm", priceFrom: 90 },
      { id: "16", label: "16 servings · 26 cm", priceFrom: 130 },
      { id: "20", label: "20+ servings · 30 cm", priceFrom: 170 },
    ],
    flavorOptions: [
      { id: "vanilla", label: "Vanilla" },
      { id: "chocolate", label: "Chocolate" },
      { id: "red-velvet", label: "Red velvet" },
      { id: "lemon", label: "Lemon" },
      { id: "caramel", label: "Caramel" },
      { id: "other", label: "Other" },
    ],
    creamOptions: [
      { id: "mascarpone", label: "Mascarpone" },
      { id: "buttercream", label: "Buttercream" },
      { id: "ganache", label: "Chocolate ganache" },
      { id: "fruit", label: "Fruit" },
    ],
    fromShort: "from",
  },
};

// ─── Menu data ───────────────────────────────────────────────────────────────
const MENU = {
  cakes: [
    {
      id: "garash",
      name: { bg: "Гараш торта", en: "Garash Cake" },
      desc: {
        bg: "Класически шест-слоен шоколадов торт с орехи и тъмна шоколадова глазура.",
        en: "Classic six-layer chocolate walnut cake with dark chocolate glaze.",
      },
      price: 38,
      img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=480&q=80",
    },
    {
      id: "cheesecake",
      name: { bg: "Чийзкейк Ню Йорк", en: "New York Cheesecake" },
      desc: {
        bg: "Нежен крем сирене на хрупкава бисквитена основа с ягодов сос.",
        en: "Velvety cream cheese filling on a buttery biscuit base with strawberry coulis.",
      },
      price: 34,
      img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=480&q=80",
    },
    {
      id: "strawberry",
      name: { bg: "Ягодов торт", en: "Strawberry Layer Cake" },
      desc: {
        bg: "Ванилови блатове, маскарпоне крем и пресни ягоди.",
        en: "Vanilla sponge layers with mascarpone cream and fresh strawberries.",
      },
      price: 36,
      img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=480&q=80",
    },
    {
      id: "choco-mousse",
      name: { bg: "Шоколадов мус торт", en: "Chocolate Mousse Cake" },
      desc: {
        bg: "Въздушен белгийски шоколадов мус на плътна брауни основа.",
        en: "Airy Belgian chocolate mousse over a fudgy brownie base.",
      },
      price: 40,
      img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=480&q=80",
    },
  ],
  pastries: [
    {
      id: "eclair",
      name: { bg: "Еклер", en: "Éclair" },
      desc: {
        bg: "Класически еклер с ванилов или шоколадов крем патисие.",
        en: "Classic French éclair with vanilla or chocolate pastry cream.",
      },
      price: 4.5,
      img: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=480&q=80",
    },
    {
      id: "macaron",
      name: { bg: "Макарон", en: "Macaron" },
      desc: {
        bg: "Хрупкаво-меки бадемови бисквити с разнообразни пълнежи.",
        en: "Crisp-chewy almond meringue shells with assorted fillings.",
      },
      price: 3,
      img: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=480&q=80",
    },
    {
      id: "tartlet",
      name: { bg: "Плодова тарталета", en: "Fruit Tartlet" },
      desc: {
        bg: "Крехко тесто, ванилов крем и пресни сезонни плодове.",
        en: "Buttery pastry shell, vanilla custard and fresh seasonal fruit.",
      },
      price: 5.5,
      img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=480&q=80",
    },
  ],
  bakery: [
    {
      id: "banitsa",
      name: { bg: "Баница с сирене", en: "Cheese Banitsa" },
      desc: {
        bg: "Традиционна баница с бяло сирене, печена всеки ден сутрин.",
        en: "Traditional filo pastry with white cheese, baked fresh every morning.",
      },
      price: 2.5,
      img: "https://images.unsplash.com/photo-1555507036-ab794f4ade4d?w=480&q=80",
    },
    {
      id: "croissant",
      name: { bg: "Масlen кроасан", en: "Butter Croissant" },
      desc: {
        bg: "Многослоен кроасан с истинско масло — хрупкав отвън, мек отвътре.",
        en: "All-butter laminated croissant — flaky outside, soft and pillowy inside.",
      },
      price: 3.5,
      img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&q=80",
    },
    {
      id: "kozunak",
      name: { bg: "Козунак с стафиди", en: "Raisin Kozunak" },
      desc: {
        bg: "Домашен козунак с ванилия, стафиди и лимонова кора.",
        en: "Homestyle Bulgarian sweet bread with vanilla, raisins and lemon zest.",
      },
      price: 12,
      img: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=480&q=80",
    },
  ],
};

// ─── Gallery ─────────────────────────────────────────────────────────────────
// Curated bakery editorial photography (Unsplash). Replace with own shoots in
// production; keep aspect variation so the masonry breathes.
const GALLERY = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=720&q=80",
    alt: "Слоеста торта с ягоди",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=720&q=80",
    alt: "Декорирана сватбена торта",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=720&q=80",
    alt: "Шоколадов десерт",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=720&q=80",
    alt: "Макарони",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=720&q=80",
    alt: "Шоколадов мус",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=720&q=80",
    alt: "Ягодова торта",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=720&q=80",
    alt: "Класически чийзкейк",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=720&q=80",
    alt: "Френски еклери",
  },
];

// ─── Reviews ──────────────────────────────────────────────────────────────────
const REVIEWS = [
  {
    id: 1,
    author: "Мария К.",
    stars: 5,
    date: { bg: "Октомври 2024", en: "October 2024" },
    text: {
      bg: "Поръчах торта за рождения ден на дъщеря ми — всички останаха възхитени! Декорацията беше перфектна, вкусът — фантастичен. Определено ще поръчам пак!",
      en: "I ordered a cake for my daughter's birthday — everyone was amazed! The decoration was perfect, the taste fantastic. Will definitely order again!",
    },
  },
  {
    id: 2,
    author: "Иван П.",
    stars: 5,
    date: { bg: "Ноември 2024", en: "November 2024" },
    text: {
      bg: "Намерих ги случайно в Google Maps и не съжалявам. Баниците са като домашно приготвени, а персоналът е много мил. Редовен клиент вече.",
      en: "Found them by chance on Google Maps and I'm not sorry. The banitsa tastes homemade and the staff are so kind. A regular customer now.",
    },
  },
  {
    id: 3,
    author: "Елена Д.",
    stars: 5,
    date: { bg: "Декември 2024", en: "December 2024" },
    text: {
      bg: "Заказах корпоративен десертен пакет за офис събитие. Бяха точни, всичко беше невероятно, а представянето — на ниво. Препоръчвам на всеки!",
      en: "Ordered a corporate dessert package for an office event. Punctual, everything was incredible, presentation on point. Highly recommended!",
    },
  },
  {
    id: 4,
    author: "Стефан М.",
    stars: 5,
    date: { bg: "Януари 2025", en: "January 2025" },
    text: {
      bg: "Гараш тортата е абсолютно невероятна — точно като на баба. Кроасаните са хрупкави и маслени. Идеалното място за закуска в Младост!",
      en: "The Garash cake is absolutely incredible — just like grandma's. Croissants are flaky and buttery. The perfect breakfast spot in Mladost!",
    },
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMenu({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
function IconX({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
function IconStar({ filled, className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        d="M12 2.5l2.8 5.7 6.3.9-4.5 4.4 1.1 6.3L12 16.9 6.3 19.8l1.1-6.3L2.9 9.1l6.3-.9z"
      />
    </svg>
  );
}
function IconChevronLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function IconChevronRight({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function IconUpload({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconPhone({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconWhatsApp({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
    </svg>
  );
}
function IconCheck({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5 text-caramel">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} filled={i < count} />
      ))}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ lang, setLang, mobileOpen, setMobileOpen, t }) {
  const menuBtnRef = useRef(null);
  const panelRef = useRef(null);

  const links = [
    { href: "#menu-section", label: t.navMenu },
    { href: "#gallery-section", label: t.navGallery },
    { href: "#reviews-section", label: t.navReviews },
    { href: "#about", label: t.navAbout },
    { href: "#contact", label: t.navContact },
  ];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);

    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector(
        "a[href], button",
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      menuBtnRef.current?.focus();
    };
  }, [mobileOpen, setMobileOpen]);

  const trapFocus = useCallback((e) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = panelRef.current.querySelectorAll(
      'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])',
    );
    if (!nodes.length) return;
    const list = Array.from(nodes);
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-espresso/10 bg-porcelain/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-12">
        <a
          href="#"
          className="font-display text-2xl font-semibold tracking-tight text-espresso"
        >
          Cakery
          <span className="ml-1 text-caramel">.</span>
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
            {["bg", "en"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`min-h-[40px] min-w-[40px] rounded-full px-3 text-xs font-semibold uppercase tracking-widest transition ${
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
            <IconMenu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-nav" className="fixed inset-0 z-50 md:hidden" role="presentation">
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
                <IconX className="h-6 w-6" />
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
                href={`tel:${PHONE_TEL}`}
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

// ─── Hero ─────────────────────────────────────────────────────────────────────
const HERO_IMG =
  "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1400&q=85";

function Hero({ t }) {
  const imgRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;
    const onScroll = () => {
      if (!imgRef.current) return;
      const y = Math.min(window.scrollY, 400);
      imgRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(${
        1 + y * 0.0004
      })`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);

  return (
    <section
      className="relative isolate overflow-hidden bg-porcelain"
      aria-labelledby="hero-title"
    >
      {/* Soft warm aura */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-caramel/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full bg-chocolate/15 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pt-16">
        {/* Copy */}
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
            <span className="italic font-light text-chocolate">{t.heroH1Line2}</span>
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

          {/* Trust strip */}
          <dl className="reveal mt-12 grid grid-cols-3 gap-6 border-t border-espresso/10 pt-6 text-sm sm:max-w-md">
            <div>
              <dt className="text-xs uppercase tracking-widest text-espresso/50">{t.heroStat1Label}</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-espresso">4.8★</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-espresso/50">{t.heroStat2Label}</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-espresso">200+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-espresso/50">{t.heroStat3Label}</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-espresso">100%</dd>
            </div>
          </dl>
        </div>

        {/* Image */}
        <div className="reveal relative lg:col-span-5">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[28px] shadow-ring lg:max-w-none">
            <img
              ref={imgRef}
              src={HERO_IMG}
              alt="Pastel handcrafted layer cake"
              className="parallax-img h-full w-full object-cover"
              fetchpriority="high"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/35 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-xs text-white backdrop-blur-md">
              <span className="font-semibold uppercase tracking-widest">{t.heroBadge}</span>
              <span className="opacity-80">от 60 BGN</span>
            </div>
          </div>

          {/* Floating chip */}
          <div className="absolute -left-5 top-10 hidden items-center gap-2 rounded-full border border-espresso/10 bg-white/85 px-4 py-2 text-xs font-semibold text-espresso shadow-soft backdrop-blur-md sm:flex">
            <span aria-hidden="true">✦</span>
            {t.heroChip}
          </div>
        </div>
      </div>

      {/* Marquee strip */}
      <div className="relative mt-16 overflow-hidden border-y border-espresso/10 bg-cream/40 py-4">
        <div className="marquee-track flex shrink-0 items-center gap-12 whitespace-nowrap font-display text-2xl italic text-espresso/55 sm:text-3xl">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex items-center gap-12 pr-12">
              {[t.marquee1, t.marquee2, t.marquee3, t.marquee4, t.marquee5].map(
                (m, i) => (
                  <span key={`${dup}-${i}`} className="flex items-center gap-12">
                    {m}
                    <span aria-hidden="true" className="text-caramel">✦</span>
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Menu Section ─────────────────────────────────────────────────────────────
const TAB_KEYS = ["cakes", "pastries", "bakery"];

function MenuSection({ lang, t }) {
  const [activeTab, setActiveTab] = useState("cakes");
  const tabLabels = {
    cakes: t.tabCakes,
    pastries: t.tabPastries,
    bakery: t.tabBakery,
  };
  const items = MENU[activeTab];

  const [featured, ...rest] = items;

  return (
    <section
      id="menu-section"
      className="relative scroll-mt-24 overflow-hidden bg-porcelain pb-20 pt-24 sm:pb-28 sm:pt-32"
    >
      {/* Decorative aura */}
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-caramel/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-10 h-[280px] w-[280px] rounded-full bg-chocolate/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="reveal flex items-end justify-between gap-8 pb-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
              · {t.menuEyebrow}
            </p>
            <h2 className="mt-3 whitespace-pre-line font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-espresso sm:text-6xl">
              {t.menuTitle}
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-relaxed text-espresso/60 md:block">
            {t.menuSub}
          </p>
        </div>

        {/* Tabs */}
        <div className="reveal mb-12 flex justify-center">
          <div
            className="inline-flex rounded-full border border-espresso/10 bg-white/70 p-1 shadow-soft backdrop-blur-md"
            role="tablist"
          >
            {TAB_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`min-h-[44px] rounded-full px-6 text-sm font-semibold transition-all duration-500 ease-silk ${
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

        {/* Asymmetric grid: 1 large featured + 3 small */}
        <div className="grid gap-6 lg:grid-cols-3 lg:auto-rows-[260px]">
          {/* Featured card */}
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
                    className="btn-premium inline-flex min-h-[42px] items-center gap-2 rounded-full bg-caramel px-5 text-xs font-semibold uppercase tracking-widest text-espresso shadow-soft hover:bg-porcelain"
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cream text-espresso transition group-hover:bg-espresso group-hover:text-porcelain"
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

// ─── Gallery ──────────────────────────────────────────────────────────────────
function GallerySection({ t }) {
  const [lightbox, setLightbox] = useState(null);

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, close]);

  return (
    <section
      id="gallery-section"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-porcelain via-cream/30 to-porcelain py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute -left-24 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-caramel/15 blur-[140px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-[340px] w-[340px] rounded-full bg-chocolate/12 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="reveal mb-14 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.galleryEyebrow}
          </p>
          <h2 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-[-0.035em] text-espresso sm:text-6xl">
            {t.galleryTitle}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-espresso/65">
            {t.gallerySub}
          </p>
        </div>

        {/* Masonry via CSS columns */}
        <div
          style={{ columnCount: "auto", columnWidth: "260px", columnGap: "16px" }}
        >
          {GALLERY.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              className="reveal group relative mb-4 w-full cursor-zoom-in overflow-hidden rounded-2xl bg-cream shadow-soft transition-all duration-500 ease-silk hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-espresso"
              style={{ breakInside: "avoid", transitionDelay: `${idx * 40}ms` }}
              onClick={() => setLightbox(img)}
              aria-label={`${t.galleryOpenAria}: ${img.alt}`}
            >
              <img
                src={img.src}
                alt=""
                loading="lazy"
                className="pointer-events-none block h-auto w-full object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-110"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-espresso/85 to-transparent p-4 text-left text-xs font-medium uppercase tracking-widest text-porcelain opacity-0 transition-all duration-500 ease-silk group-hover:translate-y-0 group-hover:opacity-100">
                {img.alt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="pop-in fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src.replace("w=720", "w=1400")}
              alt={lightbox.alt}
              className="h-auto max-h-[80vh] w-full rounded-3xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={close}
              className="absolute -right-3 -top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-espresso shadow-lift transition hover:scale-105"
              aria-label="Затвори"
            >
              <IconX className="h-5 w-5" />
            </button>
            <p className="mt-4 text-center text-sm text-cream/80">{lightbox.alt}</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Reviews Carousel ─────────────────────────────────────────────────────────
function ReviewsSection({ lang, t }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const total = REVIEWS.length;

  const go = useCallback((idx) => {
    setCurrent((idx + total) % total);
  }, [total]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const fn = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion) return undefined;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, prefersReducedMotion, total]);

  const review = REVIEWS[current];

  return (
    <section
      id="reviews-section"
      className="relative scroll-mt-24 overflow-hidden bg-espresso py-24 text-porcelain sm:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
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
            <span aria-hidden="true" className="font-display text-7xl leading-none text-caramel/70">
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
                  <p className="text-xs text-porcelain/50">{review.date[lang]}</p>
                </div>
              </div>
              <Stars count={review.stars} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label={t.prevAria}
            className="absolute -left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-porcelain/20 bg-porcelain/10 text-porcelain shadow-soft backdrop-blur transition hover:bg-porcelain hover:text-espresso sm:-left-8"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label={t.nextAria}
            className="absolute -right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-porcelain/20 bg-porcelain/10 text-porcelain shadow-soft backdrop-blur transition hover:bg-porcelain hover:text-espresso sm:-right-8"
          >
            <IconChevronRight className="h-5 w-5" />
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
                i === current ? "w-8 bg-caramel" : "w-1.5 bg-porcelain/30 hover:bg-porcelain/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutSection({ t }) {
  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden bg-cream/30 py-24 sm:py-32">
      <div className="pointer-events-none absolute right-0 top-1/4 h-[440px] w-[440px] rounded-full bg-caramel/15 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-chocolate/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-20">
          {/* Image with offset gallery accent */}
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

          {/* Copy */}
          <div className="reveal order-1 lg:order-2 lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
              · {t.aboutEyebrow}
            </p>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-[-0.035em] text-espresso sm:text-6xl lg:text-7xl">
              {t.aboutTitle}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-espresso/70 sm:text-xl">
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
                  <dt className="font-display text-3xl font-bold text-caramel">{k}</dt>
                  <dd className="mt-2 text-sm font-medium uppercase tracking-widest text-espresso">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Rating + Contact ─────────────────────────────────────────────────────────
function ContactSection({ t }) {
  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-cream/40 py-24 sm:py-32"
    >
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
                  <IconStar key={i} filled />
                ))}
                <span className="relative h-5 w-5 overflow-hidden">
                  <IconStar filled={false} />
                  <span
                    className="absolute left-0 top-0 h-full overflow-hidden"
                    style={{ width: "80%" }}
                  >
                    <IconStar filled />
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-widest text-espresso/45">
                200+ {t.ratingCount}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-espresso/65">{t.ratingCaption}</p>
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
                href={`tel:${PHONE_TEL}`}
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

// ─── Order Form (multi-step) ─────────────────────────────────────────────────
const TOTAL_STEPS = 6;

// Local-time date helpers — avoid timezone bypass via toISOString()/Date.parse().
function todayLocalMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function localISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function minPickupDate() {
  const d = todayLocalMidnight();
  d.setDate(d.getDate() + 3);
  return d;
}

function buildSchemas(z, t) {
  const allowedSizes = t.sizeOptions.map((o) => o.id);
  const allowedFlavors = t.flavorOptions.map((o) => o.id);
  const allowedCreams = t.creamOptions.map((o) => o.id);

  // Phone: digits/spaces/+/()/- only, 7..30 chars (LIMITS.phone). E.164-friendly.
  // Name: letters (incl. Cyrillic), spaces, hyphen, apostrophe — strict to deny
  // injection of control chars and reduce abuse surface.
  const phoneRe = /^\+?[\d\s().-]{7,30}$/;
  const nameRe = /^[\p{L}\p{M}'\-.\s]{2,100}$/u;

  return [
    z.object({
      size: z.enum(allowedSizes, { errorMap: () => ({ message: t.required }) }),
    }),
    z.object({
      flavor: z.enum(allowedFlavors, { errorMap: () => ({ message: t.required }) }),
    }),
    z.object({
      creams: z
        .array(z.enum(allowedCreams))
        .min(1, t.required)
        .max(allowedCreams.length, t.invalid),
    }),
    z.object({
      decor: z.string().max(LIMITS.decor, t.tooLong).optional(),
    }),
    z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, t.invalidDate)
        .refine((v) => {
          const [y, m, d] = v.split("-").map(Number);
          if (!y || !m || !d) return false;
          const picked = new Date(y, m - 1, d, 0, 0, 0, 0);
          if (Number.isNaN(picked.getTime())) return false;
          return picked.getTime() >= minPickupDate().getTime();
        }, t.invalidDate),
      time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, t.invalid),
    }),
    z.object({
      name: z
        .string()
        .min(2, t.required)
        .max(LIMITS.name, t.tooLong)
        .regex(nameRe, t.invalid),
      phone: z
        .string()
        .min(7, t.invalidPhone)
        .max(LIMITS.phone, t.tooLong)
        .regex(phoneRe, t.invalidPhone),
      email: z
        .string()
        .max(LIMITS.email, t.tooLong)
        .email(t.invalidEmail)
        .or(z.literal(""))
        .optional(),
      notes: z.string().max(LIMITS.notes, t.tooLong).optional(),
      gdpr: z.literal(true, {
        errorMap: () => ({ message: t.required }),
      }),
    }),
  ];
}

function ProgressBar({ step }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i <= step ? "bg-caramel" : "bg-chocolate/15"
          }`}
        />
      ))}
    </div>
  );
}

function Field({ label, error, children, htmlFor }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-chocolate"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

// Inspect the first bytes of an image to verify it really is JPEG / PNG.
// This is a defence-in-depth check — MIME types and magic bytes are both
// trivially spoofable, so the server MUST repeat this (re-encode through an
// image library, scan with antivirus, enforce size at the edge).
function checkImageMagic(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(false);
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result).slice(0, 8);
      const isJpeg =
        bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng =
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a;
      resolve(isJpeg || isPng);
    };
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
}

function OrderForm({ lang, t }) {
  const [zod, setZod] = useState(null);
  const [zodFailed, setZodFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    size: "",
    flavor: "",
    creams: [],
    decor: "",
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
    notes: "",
    gdpr: false,
    _gotcha: "",
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  // Time-trap: humans rarely fill 6-step form in <2 seconds.
  const formMountedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!window.zodPromise) {
      setZodFailed(true);
      return;
    }
    window.zodPromise
      .then((z) => {
        if (z) setZod(() => z);
        else setZodFailed(true);
      })
      .catch(() => setZodFailed(true));
  }, []);

  // Local-time min date to avoid TZ off-by-one bypass.
  const minDateISO = useMemo(() => localISODate(minPickupDate()), []);

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));
  const toggleCream = (id) =>
    setData((prev) => ({
      ...prev,
      creams: prev.creams.includes(id)
        ? prev.creams.filter((c) => c !== id)
        : [...prev.creams, id],
    }));

  const onFile = async (e) => {
    const input = e.target;
    const f = input.files && input.files[0];
    if (!f) {
      setFile(null);
      setErrors((prev) => ({ ...prev, photo: undefined }));
      return;
    }
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setErrors((prev) => ({ ...prev, photo: t.fileWrongType }));
      setFile(null);
      input.value = "";
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setErrors((prev) => ({ ...prev, photo: t.fileTooBig }));
      setFile(null);
      input.value = "";
      return;
    }
    const looksLikeImage = await checkImageMagic(f);
    if (!looksLikeImage) {
      setErrors((prev) => ({ ...prev, photo: t.fileCorrupt }));
      setFile(null);
      input.value = "";
      return;
    }
    setErrors((prev) => ({ ...prev, photo: undefined }));
    setFile(f);
  };

  const retryLoadZod = () => {
    setZodFailed(false);
    setZod(null);
    window.zodLoadFailed = false;
    window.zodPromise = import("https://esm.sh/zod@3.23.8")
      .then((m) => m.z)
      .catch(() => null);
    window.zodPromise.then((z) => {
      if (z) setZod(() => z);
      else setZodFailed(true);
    });
  };

  const validateStep = () => {
    if (!zod) {
      setErrors({ _global: zodFailed ? t.zodFailed : t.zodLoading });
      return false;
    }
    const schemas = buildSchemas(zod, t);
    const slice = pickSliceForStep(data, step);
    const result = schemas[step].safeParse(slice);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors = {};
    result.error.issues.forEach((iss) => {
      fieldErrors[iss.path[0]] = iss.message;
    });
    setErrors(fieldErrors);
    return false;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  // Validate ALL steps against current data — protects against step-bypass via
  // dev tools / state manipulation. Returns true only if every schema passes.
  const validateAll = () => {
    if (!zod) return false;
    const schemas = buildSchemas(zod, t);
    for (let i = 0; i < schemas.length; i += 1) {
      const r = schemas[i].safeParse(pickSliceForStep(data, i));
      if (!r.success) {
        const fieldErrors = {};
        r.error.issues.forEach((iss) => {
          fieldErrors[iss.path[0]] = iss.message;
        });
        setStep(i);
        setErrors(fieldErrors);
        return false;
      }
    }
    return true;
  };

  const submit = async () => {
    // 1. Zod must be loaded
    if (!zod) {
      setErrors({ _global: zodFailed ? t.zodFailed : t.zodLoading });
      return;
    }

    // 2. Validate every step, not just the current one
    if (!validateAll()) return;

    // 3. Hard GDPR guard (defence in depth on top of Zod)
    if (data.gdpr !== true) {
      setStep(5);
      setErrors({ gdpr: t.required });
      return;
    }

    // 4. Time-trap: humans don't fill 6 steps in <2s
    if (Date.now() - formMountedAtRef.current < 2000) {
      setStatus("success"); // silent block — looks normal to bot
      return;
    }

    // 5. Honeypot
    if (data._gotcha) {
      setStatus("success");
      return;
    }

    // 6. Refuse to POST while endpoint is still placeholder
    if (FORMSPREE_ENDPOINT.includes(FORMSPREE_PLACEHOLDER)) {
      setErrors({ _global: `${t.formNotConfigured} ${PHONE_DISPLAY}.` });
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const fd = new FormData();
      fd.append("size", data.size);
      fd.append("flavor", data.flavor);
      fd.append("creams", data.creams.join(", "));
      fd.append("decor", data.decor);
      fd.append("date", data.date);
      fd.append("time", data.time);
      fd.append("name", data.name);
      fd.append("phone", data.phone);
      fd.append("email", data.email);
      fd.append("notes", data.notes);
      fd.append("gdpr", "yes");
      fd.append("language", lang);
      fd.append("_subject", `Cakery — нова поръчка`);
      fd.append("_gotcha", data._gotcha);
      if (file) fd.append("photo", file);

      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: fd,
        // No Cookies; Formspree uses Bearer-less HTTPS POST.
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Formspree error");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setStep(0);
    setData({
      size: "", flavor: "", creams: [], decor: "", date: "", time: "",
      name: "", phone: "", email: "", notes: "", gdpr: false, _gotcha: "",
    });
    setFile(null);
    setErrors({});
  };

  return (
    <section
      id="order-section"
      className="scroll-mt-24 bg-gradient-to-b from-cream/40 via-porcelain to-cream/30 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
        <div className="reveal mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
            · {t.orderCake}
          </p>
          <h2 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-[-0.035em] text-espresso sm:text-6xl">
            {t.orderHero}
          </h2>
          <p className="mt-4 text-base text-espresso/65 sm:text-lg">{t.orderHeroSub}</p>
        </div>

        {status === "success" ? (
          <SuccessCard t={t} onReset={reset} />
        ) : status === "error" ? (
          <ErrorCard
            t={t}
            message={errors._global}
            onRetry={() => {
              setErrors({});
              setStatus("idle");
            }}
          />
        ) : (
          <div className="rounded-2xl border border-caramel/25 bg-white/80 p-5 shadow-md sm:p-8">
            <ProgressBar step={step} />
            <p className="mb-4 text-sm font-medium text-chocolate/60">
              {t.stepLabel} {step + 1} {t.of} {TOTAL_STEPS}
            </p>

            {!zod && (
              <div
                role="status"
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                  zodFailed
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-caramel/30 bg-cream/40 text-chocolate/80"
                }`}
              >
                <p>{zodFailed ? t.zodFailed : t.zodLoading}</p>
                {zodFailed ? (
                  <button
                    type="button"
                    onClick={retryLoadZod}
                    className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-full bg-chocolate px-5 text-sm font-semibold text-white hover:bg-[#5c3d28]"
                  >
                    {t.retryValidator}
                  </button>
                ) : null}
              </div>
            )}
            {errors._global && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {errors._global}
              </div>
            )}

            {/*
              Honeypot. Hidden from real users (offscreen + aria-hidden +
              tabIndex=-1 + autocomplete off). Bots that auto-fill all inputs
              will fill this and the form silently fakes success. Combined
              with the time-trap and Formspree-side _gotcha handling.
            */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-10000px",
                top: "auto",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="cakery-website-field">
                Leave this field empty
              </label>
              <input
                id="cakery-website-field"
                type="text"
                name="_gotcha"
                tabIndex={-1}
                autoComplete="off"
                value={data._gotcha}
                onChange={(e) => update({ _gotcha: e.target.value })}
              />
            </div>

            {step === 0 && (
              <Step1 t={t} data={data} update={update} errors={errors} />
            )}
            {step === 1 && (
              <Step2 t={t} data={data} update={update} errors={errors} />
            )}
            {step === 2 && (
              <Step3 t={t} data={data} toggle={toggleCream} errors={errors} />
            )}
            {step === 3 && (
              <Step4
                t={t}
                data={data}
                update={update}
                file={file}
                onFile={onFile}
                errors={errors}
              />
            )}
            {step === 4 && (
              <Step5
                t={t}
                data={data}
                update={update}
                errors={errors}
                minDate={minDateISO}
              />
            )}
            {step === 5 && (
              <Step6 t={t} data={data} update={update} errors={errors} />
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || status === "submitting"}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-chocolate/20 px-6 text-sm font-semibold text-chocolate transition hover:border-chocolate disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.back}
              </button>

              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!zod}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-chocolate px-8 text-sm font-semibold text-white shadow transition hover:bg-[#5c3d28] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.next}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!zod || status === "submitting"}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-chocolate px-8 text-sm font-semibold text-white shadow transition hover:bg-[#5c3d28] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting" ? t.sending : t.submit}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function pickSliceForStep(data, step) {
  switch (step) {
    case 0: return { size: data.size };
    case 1: return { flavor: data.flavor };
    case 2: return { creams: data.creams };
    case 3: return { decor: data.decor };
    case 4: return { date: data.date, time: data.time };
    case 5: return {
      name: data.name, phone: data.phone, email: data.email,
      notes: data.notes, gdpr: data.gdpr,
    };
    default: return data;
  }
}

function Step1({ t, data, update, errors }) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold text-chocolate">{t.s1Title}</h3>
      <p className="mt-1 text-sm text-chocolate/60">{t.s1Sub}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {t.sizeOptions.map((opt) => (
          <label
            key={opt.id}
            className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition ${
              data.size === opt.id
                ? "border-caramel bg-caramel/10"
                : "border-chocolate/15 hover:border-caramel/60"
            }`}
          >
            <input
              type="radio" name="size" value={opt.id}
              checked={data.size === opt.id}
              onChange={() => update({ size: opt.id })}
              className="sr-only"
            />
            <span className="font-display text-lg font-semibold text-chocolate">
              {opt.label}
            </span>
            <span className="mt-1 text-sm text-chocolate/60">
              {t.fromShort} {opt.priceFrom} {t.currency}
            </span>
          </label>
        ))}
      </div>
      {errors.size && <p className="mt-2 text-xs font-medium text-red-700">{errors.size}</p>}
    </div>
  );
}

function Step2({ t, data, update, errors }) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold text-chocolate">{t.s2Title}</h3>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {t.flavorOptions.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
              data.flavor === opt.id
                ? "border-caramel bg-caramel/10"
                : "border-chocolate/15 hover:border-caramel/60"
            }`}
          >
            <input
              type="radio" name="flavor" value={opt.id}
              checked={data.flavor === opt.id}
              onChange={() => update({ flavor: opt.id })}
              className="h-4 w-4 accent-chocolate"
            />
            <span className="text-sm font-medium text-chocolate">{opt.label}</span>
          </label>
        ))}
      </div>
      {errors.flavor && <p className="mt-2 text-xs font-medium text-red-700">{errors.flavor}</p>}
    </div>
  );
}

function Step3({ t, data, toggle, errors }) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold text-chocolate">{t.s3Title}</h3>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {t.creamOptions.map((opt) => {
          const active = data.creams.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                active
                  ? "border-caramel bg-caramel/10"
                  : "border-chocolate/15 hover:border-caramel/60"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(opt.id)}
                className="h-4 w-4 accent-chocolate"
              />
              <span className="text-sm font-medium text-chocolate">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {errors.creams && <p className="mt-2 text-xs font-medium text-red-700">{errors.creams}</p>}
    </div>
  );
}

function Step4({ t, data, update, file, onFile, errors }) {
  return (
    <div className="space-y-5">
      <h3 className="font-display text-xl font-semibold text-chocolate">{t.s4Title}</h3>
      <Field label={t.s4Decor} error={errors.decor} htmlFor="decor">
        <textarea
          id="decor"
          rows={4}
          maxLength={LIMITS.decor}
          value={data.decor}
          onChange={(e) => update({ decor: e.target.value })}
          className="w-full rounded-xl border-2 border-chocolate/15 bg-white px-4 py-3 text-sm text-chocolate outline-none transition focus:border-caramel"
        />
        <p className="mt-1 text-right text-xs text-chocolate/50">
          {(data.decor || "").length} / {LIMITS.decor}
        </p>
      </Field>
      <Field label={t.s4Photo} error={errors.photo} htmlFor="photo">
        <label
          htmlFor="photo"
          className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-chocolate/25 bg-cream/40 px-4 py-4 text-sm text-chocolate/70 transition hover:border-caramel hover:bg-caramel/10"
        >
          <IconUpload className="h-5 w-5 shrink-0" />
          <span className="truncate">
            {file ? file.name : t.s4Hint}
          </span>
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png"
          onChange={onFile}
          className="hidden"
        />
      </Field>
    </div>
  );
}

function Step5({ t, data, update, errors, minDate }) {
  return (
    <div className="space-y-5">
      <h3 className="font-display text-xl font-semibold text-chocolate">{t.s5Title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.s5Date} error={errors.date} htmlFor="date">
          <input
            id="date"
            type="date"
            min={minDate}
            value={data.date}
            onChange={(e) => update({ date: e.target.value })}
            className="w-full rounded-xl border-2 border-chocolate/15 bg-white px-4 py-3 text-sm text-chocolate outline-none transition focus:border-caramel"
          />
        </Field>
        <Field label={t.s5Time} error={errors.time} htmlFor="time">
          <input
            id="time"
            type="time"
            value={data.time}
            onChange={(e) => update({ time: e.target.value })}
            className="w-full rounded-xl border-2 border-chocolate/15 bg-white px-4 py-3 text-sm text-chocolate outline-none transition focus:border-caramel"
          />
        </Field>
      </div>
    </div>
  );
}

function Step6({ t, data, update, errors }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl font-semibold text-chocolate">{t.s6Title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.s6Name} error={errors.name} htmlFor="name">
          <input
            id="name" type="text" autoComplete="name" maxLength={LIMITS.name}
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full rounded-xl border-2 border-chocolate/15 bg-white px-4 py-3 text-sm text-chocolate outline-none transition focus:border-caramel"
          />
        </Field>
        <Field label={t.s6Phone} error={errors.phone} htmlFor="phone">
          <input
            id="phone" type="tel" autoComplete="tel" maxLength={LIMITS.phone}
            placeholder="+359 88 884 9908"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className="w-full rounded-xl border-2 border-chocolate/15 bg-white px-4 py-3 text-sm text-chocolate outline-none transition focus:border-caramel"
          />
        </Field>
      </div>
      <Field label={t.s6Email} error={errors.email} htmlFor="email">
        <input
          id="email" type="email" autoComplete="email" maxLength={LIMITS.email}
          value={data.email}
          onChange={(e) => update({ email: e.target.value })}
          className="w-full rounded-xl border-2 border-chocolate/15 bg-white px-4 py-3 text-sm text-chocolate outline-none transition focus:border-caramel"
        />
      </Field>
      <Field label={t.s6Notes} error={errors.notes} htmlFor="notes">
        <textarea
          id="notes" rows={3} maxLength={LIMITS.notes}
          value={data.notes}
          onChange={(e) => update({ notes: e.target.value })}
          className="w-full rounded-xl border-2 border-chocolate/15 bg-white px-4 py-3 text-sm text-chocolate outline-none transition focus:border-caramel"
        />
        <p className="mt-1 text-right text-xs text-chocolate/50">
          {(data.notes || "").length} / {LIMITS.notes}
        </p>
      </Field>

      <div className="rounded-xl border border-chocolate/15 bg-cream/30 p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={data.gdpr}
            onChange={(e) => update({ gdpr: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-chocolate"
          />
          <span className="text-xs leading-relaxed text-chocolate/80">
            {t.s6Gdpr}{" "}
            <a
              href="#privacy"
              className="font-semibold text-chocolate underline decoration-caramel/60 underline-offset-2 hover:decoration-chocolate"
            >
              {t.privacyLink}
            </a>
            .
          </span>
        </label>
        <details id="privacy" className="mt-3 scroll-mt-24 text-xs text-chocolate/80">
          <summary className="cursor-pointer font-semibold text-chocolate/80">
            {t.privacyTitle}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {t.privacyBullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </details>
      </div>
      {errors.gdpr && <p className="text-xs font-medium text-red-700">{errors.gdpr}</p>}
    </div>
  );
}

function SuccessCard({ t, onReset }) {
  return (
    <div
      className="rounded-2xl border border-caramel/30 bg-white/90 p-8 text-center shadow-lg"
      style={{ animation: "cakery-pop 0.45s ease-out" }}
    >
      <style>{`@keyframes cakery-pop {
        0% { opacity: 0; transform: scale(0.92) translateY(8px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }`}</style>
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chocolate text-white"
        style={{ animation: "cakery-pop 0.6s ease-out 0.1s both" }}
      >
        <IconCheck className="h-8 w-8" />
      </div>
      <h3 className="mt-5 font-display text-2xl font-semibold text-chocolate sm:text-3xl">
        {t.successTitle}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-chocolate/75">{t.successText}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-chocolate px-6 text-sm font-semibold text-chocolate transition hover:bg-chocolate hover:text-white"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}

function ErrorCard({ t, message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-md">
      <h3 className="font-display text-2xl font-semibold text-red-800">
        {t.errorTitle}
      </h3>
      <p className="mt-3 text-red-700/80">{message || t.errorText}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-chocolate px-6 text-sm font-semibold text-white hover:bg-[#5c3d28]"
      >
        {t.tryAgain}
      </button>
    </div>
  );
}

// ─── Mobile sticky call bar ──────────────────────────────────────────────────
function MobileCallBar({ t }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-espresso/10 bg-porcelain/95 px-3 py-2 shadow-[0_-4px_30px_rgba(58,36,24,0.18)] backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <a
          href={`tel:${PHONE_TEL}`}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-espresso px-4 text-sm font-semibold text-porcelain shadow-soft"
          aria-label={`${t.callBtn} ${PHONE_DISPLAY}`}
        >
          <IconPhone className="h-4 w-4" />
          {t.callBtn}
        </a>
        <a
          href={`https://wa.me/${PHONE_WA}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-emerald-900 px-4 text-sm font-semibold text-white shadow-soft hover:bg-emerald-950"
          aria-label="WhatsApp"
        >
          <IconWhatsApp className="h-4 w-4" />
          {t.waBtn}
        </a>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function IconInstagram({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function IconFacebook({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Footer({ t }) {
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
        { href: `tel:${PHONE_TEL}`, label: PHONE_DISPLAY },
        { href: `https://wa.me/${PHONE_WA}`, label: "WhatsApp", external: true },
      ],
    },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-espresso text-porcelain">
      {/* Decorative layer */}
      <div className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-caramel/20 blur-[180px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-[460px] w-[460px] rounded-full bg-chocolate/30 blur-[180px]" />

      {/* Top: marquee headline */}
      <div className="relative border-b border-porcelain/10 bg-ink/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              {t.footerHeadline1}
              <br />
              <span className="italic font-light text-caramel">{t.footerHeadline2}</span>
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

      {/* Main: 4-column */}
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

            <div className="mt-6 flex items-center gap-3">
              {/*
                TODO: replace these with your real, owned profile URLs before
                going live (e.g. https://www.instagram.com/cakery.bg/). Pointing
                to the bare domain is a phishing risk if an impostor claims it.
              */}
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer external"
                aria-label="Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-porcelain/15 text-porcelain transition hover:border-caramel hover:text-caramel"
              >
                <IconInstagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer external"
                aria-label="Facebook"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-porcelain/15 text-porcelain transition hover:border-caramel hover:text-caramel"
              >
                <IconFacebook className="h-5 w-5" />
              </a>
              <a
                href={`https://wa.me/${PHONE_WA}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-porcelain/15 text-porcelain transition hover:border-caramel hover:text-caramel"
              >
                <IconWhatsApp className="h-4 w-4" />
              </a>
            </div>
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
                      rel={l.external ? "noopener noreferrer" : undefined}
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

        {/* Hours + map line */}
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
                referrerPolicy="no-referrer-when-downgrade"
                title={t.mapAria}
                aria-label={t.mapAria}
              />
            </div>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-porcelain/70 hover:text-caramel"
            >
              {t.footerAddr} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Giant monogram band */}
      <div className="relative overflow-hidden border-t border-porcelain/10">
        <p
          aria-hidden="true"
          className="pointer-events-none whitespace-nowrap py-8 text-center font-display font-bold leading-none tracking-[-0.05em] text-porcelain/[0.06] sm:py-10"
          style={{ fontSize: "clamp(7rem, 22vw, 22rem)" }}
        >
          Cakery<span className="italic font-light text-caramel/30">.</span>
        </p>
      </div>

      {/* Bottom strip */}
      <div className="relative border-t border-porcelain/10 bg-ink/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-porcelain/50 sm:flex-row sm:px-8 lg:px-12">
          <p>© {new Date().getFullYear()} Cakery · Кейкъри. {t.footerRights}</p>
          <p className="font-display italic text-porcelain/65">
            ✦ {t.footerMade}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [lang, setLang] = useState(() => {
    try {
      const s = localStorage.getItem("cakery-lang");
      return s === "en" || s === "bg" ? s : "bg";
    } catch { return "bg"; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSetLang = useCallback((l) => {
    setLang(l);
    try { localStorage.setItem("cakery-lang", l); } catch { /* ignore */ }
  }, []);

  const t = COPY[lang];

  useReveal();

  return (
    <>
      <Header lang={lang} setLang={handleSetLang}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} t={t} />
      <main className="pb-20 md:pb-0">
        <Hero t={t} />
        <MenuSection lang={lang} t={t} />
        <AboutSection t={t} />
        <ReviewsSection lang={lang} t={t} />
        <GallerySection t={t} />
        <ContactSection t={t} />
        <OrderForm lang={lang} t={t} />
      </main>
      <Footer t={t} />
      <MobileCallBar t={t} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
