export type MenuItem = {
  id: string;
  name: { bg: string; en: string };
  desc: { bg: string; en: string };
  price: number;
  img: string;
};

export const MENU: Record<"cakes" | "pastries" | "bakery", MenuItem[]> = {
  cakes: [
    {
      id: "garash",
      name: { bg: "Гараш торта", en: "Garash Cake" },
      desc: {
        bg: "Класически шест-слоен шоколадов торт с орехи и тъмна шоколадова глазура.",
        en: "Classic six-layer chocolate walnut cake with dark chocolate glaze.",
      },
      price: 38,
      img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=720&q=80",
    },
    {
      id: "cheesecake",
      name: { bg: "Чийзкейк Ню Йорк", en: "New York Cheesecake" },
      desc: {
        bg: "Нежен крем сирене на хрупкава бисквитена основа с ягодов сос.",
        en: "Velvety cream cheese filling on a buttery biscuit base with strawberry coulis.",
      },
      price: 34,
      img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=720&q=80",
    },
    {
      id: "strawberry",
      name: { bg: "Ягодов торт", en: "Strawberry Layer Cake" },
      desc: {
        bg: "Ванилови блатове, маскарпоне крем и пресни ягоди.",
        en: "Vanilla sponge layers with mascarpone cream and fresh strawberries.",
      },
      price: 36,
      img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=720&q=80",
    },
    {
      id: "choco-mousse",
      name: { bg: "Шоколадов мус торт", en: "Chocolate Mousse Cake" },
      desc: {
        bg: "Въздушен белгийски шоколадов мус на плътна брауни основа.",
        en: "Airy Belgian chocolate mousse over a fudgy brownie base.",
      },
      price: 40,
      img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=720&q=80",
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
      img: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=720&q=80",
    },
    {
      id: "macaron",
      name: { bg: "Макарон", en: "Macaron" },
      desc: {
        bg: "Хрупкаво-меки бадемови бисквити с разнообразни пълнежи.",
        en: "Crisp-chewy almond meringue shells with assorted fillings.",
      },
      price: 3,
      img: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=720&q=80",
    },
    {
      id: "tartlet",
      name: { bg: "Плодова тарталета", en: "Fruit Tartlet" },
      desc: {
        bg: "Крехко тесто, ванилов крем и пресни сезонни плодове.",
        en: "Buttery pastry shell, vanilla custard and fresh seasonal fruit.",
      },
      price: 5.5,
      img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=720&q=80",
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
      img: "https://images.unsplash.com/photo-1555507036-ab794f4ade4d?w=720&q=80",
    },
    {
      id: "croissant",
      name: { bg: "Маслен кроасан", en: "Butter Croissant" },
      desc: {
        bg: "Многослоен кроасан с истинско масло — хрупкав отвън, мек отвътре.",
        en: "All-butter laminated croissant — flaky outside, soft and pillowy inside.",
      },
      price: 3.5,
      img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=720&q=80",
    },
    {
      id: "kozunak",
      name: { bg: "Козунак с стафиди", en: "Raisin Kozunak" },
      desc: {
        bg: "Домашен козунак с ванилия, стафиди и лимонова кора.",
        en: "Homestyle Bulgarian sweet bread with vanilla, raisins and lemon zest.",
      },
      price: 12,
      img: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=720&q=80",
    },
  ],
};
