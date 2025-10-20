// src/lib/files/attachments.ts
import { mkdir, writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { documentDir, join } from "@tauri-apps/api/path";

function safeName(name: string) { return name.replace(/[^\w.-]/g, "_"); }
function pad(n: number) { return String(n).padStart(2, "0"); }
function ts(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function rand8(){ return Math.random().toString(16).slice(2,10); }

export function getAttachmentsRoot(): string {
  return "GreenAppleDental/attachments"; // relativo a $DOCUMENTS
}

export async function saveAttachmentFile(
  file: File,
  patientId: number,
  visitDateISO?: string
): Promise<{ storage_key: string; bytes: number }> {
  const root = getAttachmentsRoot();
  const d = visitDateISO ? new Date(visitDateISO) : new Date();
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);

  const baseFolder = `${root}/p_${patientId}/${yyyy}/${mm}`;
  await mkdir(baseFolder, { recursive: true, baseDir: BaseDirectory.Document });

  const key = `p_${patientId}/${yyyy}/${mm}/${ts(d)}_${rand8()}_${safeName(file.name)}`;
  const targetPath = `${root}/${key}`;
  const buf = new Uint8Array(await file.arrayBuffer());

  await writeFile(targetPath, buf, { baseDir: BaseDirectory.Document, create: true });
  return { storage_key: key, bytes: buf.byteLength };
}

/** Devuelve la ruta absoluta de un storage_key tal como lo guardamos */
export async function resolveAttachmentPath(storage_key: string) {
  // guardamos: attachments/p_{id}/YYYY/MM/filename
  // base: Documents/GreenAppleDental
  const base = await documentDir(); // p.ej. C:\Users\...\Documents\
  const abs = await join(base, "GreenAppleDental", storage_key);
  return abs;
}

/** Abre archivo o URL con la app por defecto del SO (Tauri) y, si falla / Web, copia la ruta */
export async function openWithOS(path: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTauri = typeof (window as any).__TAURI__ !== "undefined";

  if (isTauri) {
    try {
      // Tipamos explícitamente el módulo para que TS “vea” .open
      type Opener = typeof import("@tauri-apps/plugin-opener");
      const mod = (await import("@tauri-apps/plugin-opener")) as Opener;
      await mod.open(path);
      return;
    } catch (err) {
      console.error("opener plugin failed:", err);
      // seguimos al fallback
    }
  }

  // Fallback: copiamos al portapapeles
  try {
    await navigator.clipboard.writeText(path);
    alert("No se pudo abrir directamente. La ruta se copió al portapapeles:\n" + path);
  } catch {
    alert("No se pudo abrir ni copiar la ruta:\n" + path);
  }
}

/** Opcional: mostrar el archivo dentro de su carpeta (Explorer/Finder) */
export async function revealInOS(path: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTauri = typeof (window as any).__TAURI__ !== "undefined";
  if (isTauri) {
    try {
      type Opener = typeof import("@tauri-apps/plugin-opener");
      const mod = (await import("@tauri-apps/plugin-opener")) as Opener;
      if (typeof mod.reveal === "function") {
        await mod.reveal(path);
        return;
      }
    } catch (err) {
      console.error("opener reveal failed:", err);
    }
  }
  // si no existe reveal, intentamos abrir
  await openWithOS(path);
}
