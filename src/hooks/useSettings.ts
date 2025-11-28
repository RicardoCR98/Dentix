// src/hooks/useSettings.ts
import { useState, useEffect, useCallback } from "react";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

/**
 * Hook para gestionar la configuración del usuario
 *
 * Uso:
 * const { settings, updateSetting, resetSettings, loading } = useSettings();
 *
 * // Leer un valor
 * const theme = settings.theme || 'light';
 *
 * // Actualizabr un valor
 * await updateSetting('theme', 'dark', 'appearance');
 *
 * // Restaurar valores por defecto
 * await resetSettings();
 */
export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar configuración inicial
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const repo = await getRepository();
      const allSettings = await repo.getAllSettings();
      setSettings(allSettings);
      setError(null);
    } catch (err) {
      console.error("Error cargando settings:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar el componente
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Actualiza una configuración específica
   */
  const updateSetting = useCallback(
    async (key: string, value: string, category: string = "general") => {
      try {
        const repo = await getRepository();
        await repo.setSetting(key, value, category);

        // Actualización optimista del estado local
        setSettings((prev) => ({
          ...prev,
          [key]: value,
        }));
      } catch (err) {
        console.error(`Error actualizando setting ${key}:`, err);
        // Recargar desde DB si falla
        await loadSettings();
        throw err;
      }
    },
    [loadSettings],
  );

  /**
   * Actualiza múltiples configuraciones a la vez
   */
  const updateSettings = useCallback(
    async (
      newSettings: Record<string, { value: string; category?: string }>,
    ) => {
      try {
        const repo = await getRepository();
        await repo.setSettings(newSettings);

        // Actualización optimista del estado local
        setSettings((prev) => {
          const updated = { ...prev };
          for (const [key, config] of Object.entries(newSettings)) {
            updated[key] = config.value;
          }
          return updated;
        });
      } catch (err) {
        console.error("Error actualizando settings:", err);
        // Recargar desde DB si falla
        await loadSettings();
        throw err;
      }
    },
    [loadSettings],
  );

  /**
   * Elimina una configuración (se restaurará al default en próximo inicio)
   */
  const deleteSetting = useCallback(
    async (key: string) => {
      try {
        const repo = await getRepository();
        await repo.deleteSetting(key);

        // Remover del estado local
        setSettings((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      } catch (err) {
        console.error(`Error eliminando setting ${key}:`, err);
        await loadSettings();
        throw err;
      }
    },
    [loadSettings],
  );

  /**
   * Restaura todas las configuraciones a los valores por defecto
   */
  const resetSettings = useCallback(async () => {
    try {
      const repo = await getRepository();
      await repo.resetAllSettings();
      await loadSettings();
    } catch (err) {
      console.error("Error reseteando settings:", err);
      throw err;
    }
  }, [loadSettings]);

  /**
   * Obtiene una configuración por categoría
   */
  const getByCategory = useCallback(
    (category: string): Record<string, string> => {
      const result: Record<string, string> = {};

      // Mapeo de categorías a sus keys
      const categoryKeys: Record<string, string[]> = {
        appearance: ["theme", "accentColor", "fontSize", "fontFamily"],
        behavior: ["autoSave", "confirmDelete"],
        odontogram: ["odontogramSize", "showToothNumbers"],
      };

      const keys = categoryKeys[category] || [];
      for (const key of keys) {
        if (settings[key] !== undefined) {
          result[key] = settings[key];
        }
      }

      return result;
    },
    [settings],
  );

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateSettings,
    deleteSetting,
    resetSettings,
    getByCategory,
    reload: loadSettings,
  };
}

/**
 * Hook simplificado para obtener un único valor de configuración
 */
export function useSetting(
  key: string,
  defaultValue: string = "",
): [string, (value: string) => Promise<void>] {
  const { settings, updateSetting } = useSettings();

  const value = settings[key] ?? defaultValue;

  const setValue = useCallback(
    async (newValue: string) => {
      // Inferir categoría del key
      const categoryMap: Record<string, string> = {
        theme: "appearance",
        accentColor: "appearance",
        fontSize: "appearance",
        fontFamily: "appearance",
        autoSave: "behavior",
        confirmDelete: "behavior",
        odontogramSize: "odontogram",
        showToothNumbers: "odontogram",
      };

      const category = categoryMap[key] || "general";
      await updateSetting(key, newValue, category);
    },
    [key, updateSetting],
  );

  return [value, setValue];
}
