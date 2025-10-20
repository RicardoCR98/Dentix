import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        brand: "hsl(var(--brand))",
        border: "hsl(var(--border))",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "calc(var(--radius) + 2px)",
        xl: "calc(var(--radius) + 6px)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      fontSize: {
        base: "var(--font-size-base)",
        sm: "calc(var(--font-size-base) * 0.875)",
        lg: "calc(var(--font-size-base) * 1.125)",
        xl: "calc(var(--font-size-base) * 1.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
