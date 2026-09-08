import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070d",
        surface: "#0b0e17",
        line: "#1c2130",
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        aqua: {
          400: "#5eead4",
          500: "#2dd4bf",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at center, rgba(139,92,246,0.15), transparent 70%)",
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "spin-slow": "spin 14s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-delay": "float 6s ease-in-out 2s infinite",
        blob: "blob 18s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-25px, 25px) scale(0.95)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
