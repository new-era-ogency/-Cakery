export type Review = {
  id: number;
  author: string;
  stars: number;
  date: { bg: string; en: string };
  text: { bg: string; en: string };
};

export const REVIEWS: Review[] = [
  {
    id: 1,
    author: "Мария К.",
    stars: 5,
    date: { bg: "Октомври 2024", en: "October 2024" },
    text: {
      bg: "Поръчах торта за рождения ден на дъщеря ми — всички останаха възхитени! Декорацията беше перфектна, вкусът — фантастичен.",
      en: "I ordered a cake for my daughter's birthday — everyone was amazed! The decoration was perfect, the taste fantastic.",
    },
  },
  {
    id: 2,
    author: "Иван П.",
    stars: 5,
    date: { bg: "Ноември 2024", en: "November 2024" },
    text: {
      bg: "Намерих ги случайно в Google Maps и не съжалявам. Баниците са като домашно приготвени, а персоналът е много мил.",
      en: "Found them by chance on Google Maps and I'm not sorry. The banitsa tastes homemade and the staff are so kind.",
    },
  },
  {
    id: 3,
    author: "Елена Д.",
    stars: 5,
    date: { bg: "Декември 2024", en: "December 2024" },
    text: {
      bg: "Заказах корпоративен десертен пакет за офис събитие. Бяха точни, всичко беше невероятно, а представянето — на ниво.",
      en: "Ordered a corporate dessert package for an office event. Punctual, everything was incredible, presentation on point.",
    },
  },
  {
    id: 4,
    author: "Стефан М.",
    stars: 5,
    date: { bg: "Януари 2025", en: "January 2025" },
    text: {
      bg: "Гараш тортата е абсолютно невероятна — точно като на баба. Кроасаните са хрупкави и маслени.",
      en: "The Garash cake is absolutely incredible — just like grandma's. Croissants are flaky and buttery.",
    },
  },
];
