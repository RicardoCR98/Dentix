import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fontMap, presets, type FontName, type ThemeName } from "./presets";

type ThemeContextType = {
  theme: ThemeName;
  brandHsl: string;
  font: FontName;
  size: 14 | 16 | 18 | 20 | 22 | 24;
  setTheme: (t: ThemeName) => void;
  setBrand: (brandHslOrHex: string) => void;
  setFont: (f: FontName) => void;
  setSize: (s: 14 | 16 | 18 | 20 | 22 | 24) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = "odonto.theme.v1";

function hexToHsl(hex: string): string {
  const m = hex.replace("#", "");
  const bigint = parseInt(m, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  // rgb -> hsl (0-360,0-100,0-100)
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("light");
  const [brandHsl, setBrandHsl] = useState<string>("172 49% 56%"); // default
  const [font, setFontState] = useState<FontName>("Inter");
  const [size, setSizeState] = useState<14 | 16 | 18 | 20 | 22 | 24>(16); // Tamaño base balanceado

  // load
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { theme, brandHsl, font, size } = JSON.parse(raw);
      if (theme && (presets as string[]).includes(theme)) setThemeState(theme);
      if (brandHsl) setBrandHsl(brandHsl);
      if (font) setFontState(font);
      if (size) setSizeState(size);
    }
    // NO detectar preferencia del SO - siempre usar 'light' por defecto
  }, []);

  // apply to document
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", theme);
    r.style.setProperty("--brand", brandHsl);
    r.style.setProperty("--font-sans", fontMap[font]);
    r.style.setProperty("--font-size-base", `${size}px`);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme, brandHsl, font, size }),
    );
  }, [theme, brandHsl, font, size]);

  const api = useMemo<ThemeContextType>(
    () => ({
      theme,
      brandHsl,
      font,
      size,
      setTheme: (t) => setThemeState(t),
      setBrand: (value) => {
        if (value.startsWith("#")) setBrandHsl(hexToHsl(value));
        else setBrandHsl(value); // permitir "217 91% 60%"
      },
      setFont: (f) => setFontState(f),
      setSize: (s) => setSizeState(s),
    }),
    [theme, brandHsl, font, size],
  );

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
