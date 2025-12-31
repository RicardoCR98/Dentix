// src/lib/os/openWithOS.ts
export async function openWithOS(path: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTauri = typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

  if (isTauri) {
    try {
      const { openPath } = await import("@tauri-apps/plugin-opener");
      console.log("Opening path:", path);
      await openPath(path);
      console.log("Path opened successfully");
      return;
    } catch (err) {
      console.error("openPath failed:", err);
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
  const isTauri = typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

  if (isTauri) {
    try {
      const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
      console.log("Revealing path:", path);
      await revealItemInDir(path);
      console.log("Path revealed successfully");
      return;
    } catch (err) {
      console.error("revealItemInDir failed:", err);
    }
  }
  // Fallback
  await openWithOS(path);
}
