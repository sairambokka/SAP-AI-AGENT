import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sap: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#b3d6ff",
          300: "#7db8ff",
          400: "#4296ff",
          500: "#0b74de",
          600: "#005db6",
          700: "#00488b",
          800: "#003564",
          900: "#002546"
        }
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
      }
    },
  },
  plugins: [],
};

export default config;
