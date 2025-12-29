import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { fontMap, presets, type FontName, type ThemeName } from "./presets";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

export type LayoutMode = "vertical" | "tabs";

type ThemeContextType = {
  theme: ThemeName;
  brandHsl: string;
  font: FontName;
  size: 14 | 16 | 18 | 20 | 22 | 24;
  setTheme: (t: ThemeName) => void;
  setBrand: (brandHslOrHex: string) => void;
  setFont: (f: FontName) => void;
  setSize: (s: 14 | 16 | 18 | 20 | 22 | 24) => void;
  saveSettings: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

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
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [brandHsl, setBrandHsl] = useState<string>("172 49% 56%");
  const [font, setFontState] = useState<FontName>("Inter");
  const [size, setSizeState] = useState<14 | 16 | 18 | 20 | 22 | 24>(16);

  // Cargar configuración desde la base de datos
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const repo = await getRepository();
        const settings = await repo.getAllSettings();

        if (settings.theme && (presets as string[]).includes(settings.theme)) {
          setThemeState(settings.theme as ThemeName);
        }
        if (settings.brandHsl) {
          setBrandHsl(settings.brandHsl);
        }
        if (settings.font) {
          setFontState(settings.font as FontName);
        }
        if (settings.size) {
          setSizeState(Number(settings.size) as 14 | 16 | 18 | 20 | 22 | 24);
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };

    loadSettings();
  }, []);

  // Aplicar al documento (SOLO CSS, NO guardar automáticamente)
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", theme);
    r.style.setProperty("--brand", brandHsl);
    r.style.setProperty("--font-sans", fontMap[font]);
    r.style.setProperty("--font-size-base", `${size}px`);
  }, [theme, brandHsl, font, size]);

  // Función para guardar configuración manualmente (llamada desde ThemePanel)
  const saveSettings = useCallback(async () => {
    try {
      const repo = await getRepository();
      await repo.setSettings({
        theme: { value: theme, category: "appearance" },
        brandHsl: { value: brandHsl, category: "appearance" },
        font: { value: font, category: "appearance" },
        size: { value: String(size), category: "appearance" },
      });
    } catch (error) {
      console.error("Error guardando configuración:", error);
      throw error;
    }
  }, [theme, brandHsl, font, size]);

  const resetToDefaults = useCallback(async () => {
    try {
      const repo = await getRepository();
      await repo.resetAllSettings();

      // Aplicar valores por defecto localmente
      setThemeState("dark");
      setBrandHsl("172 49% 56%");
      setFontState("Inter");
      setSizeState(16);
    } catch (error) {
      console.error("Error restaurando configuración:", error);
      throw error;
    }
  }, []);

  const api = useMemo<ThemeContextType>(
    () => ({
      theme,
      brandHsl,
      font,
      size,
      setTheme: (t) => setThemeState(t),
      setBrand: (value) => {
        if (value.startsWith("#")) setBrandHsl(hexToHsl(value));
        else setBrandHsl(value);
      },
      setFont: (f) => setFontState(f),
      setSize: (s) => setSizeState(s),
      saveSettings,
      resetToDefaults,
    }),
    [theme, brandHsl, font, size, saveSettings, resetToDefaults],
  );

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
