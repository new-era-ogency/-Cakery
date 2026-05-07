import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        caramel: "#C8845A",
        chocolate: "#8B5E3C",
        cream: "#F2D9C2",
        espresso: "#3A2418",
        ink: "#1A1410",
        porcelain: "#FBF6EE",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(58,36,24,0.04), 0 8px 30px rgba(58,36,24,0.08)",
        lift: "0 10px 40px -10px rgba(58,36,24,0.25), 0 2px 6px rgba(58,36,24,0.06)",
        ring: "0 0 0 1px rgba(58,36,24,0.06), 0 30px 60px -20px rgba(58,36,24,0.25)",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
