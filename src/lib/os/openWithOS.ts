// src/lib/os/openWithOS.ts
export async function openWithOS(path: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTauri = typeof (window as any).__TAURI__ !== "undefined";

  if (isTauri) {
    try {
      // IMPORTACIÓN ESTÁTICA (evita el error de tipos)
      // Si te da warning de "import is unused" en web, ignóralo: este bloque sólo corre en Tauri.
      const mod = await import("@tauri-apps/plugin-opener");
      // Cast suave para contentar a TS si no detecta los tipos
      const { open } = mod as unknown as {
        open: (target: string, opts?: { application?: string; withArguments?: string[] }) => Promise<void>;
      };
      await open(path);
      return;
    } catch (err) {
      console.error("opener plugin failed:", err);
      // continúa al fallback
    }
  }

  // Fallback (web o fallo del plugin): copiar la ruta
  try {
    await navigator.clipboard.writeText(path);
    alert("No se pudo abrir directamente. La ruta se copió al portapapeles:\n" + path);
  } catch {
    alert("No se pudo abrir ni copiar la ruta:\n" + path);
  }
}

/** Opcional: revelar en el explorador (si quieres mostrar la carpeta contenedora) */
export async function revealInOS(path: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTauri = typeof (window as any).__TAURI__ !== "undefined";

  if (isTauri) {
    try {
      const mod = await import("@tauri-apps/plugin-opener");
      const { reveal } = mod as unknown as {
        reveal: (target: string) => Promise<void>;
      };
      await reveal(path);
      return;
    } catch (err) {
      console.error("opener reveal failed:", err);
    }
  }
  // Fallback
  await openWithOS(path);
}
