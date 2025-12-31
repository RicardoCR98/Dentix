// src/lib/files/attachments.ts
import { mkdir, writeFile, exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import { documentDir, join } from "@tauri-apps/api/path";

function safeName(name: string) {
  return name.replace(/[^\w.-]/g, "_");
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ts(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function rand8() {
  return Math.random().toString(16).slice(2, 10);
}

// Stable, clinic-name-independent root to make syncing/migration easier
const ATTACHMENTS_ROOT = "odonto_data/attachments"; // relative to Documents
const LEGACY_ROOTS = ["GreenAppleDental/attachments"];

export function getAttachmentsRoot(): string {
  return ATTACHMENTS_ROOT;
}

const getAllRoots = () => [ATTACHMENTS_ROOT, ...LEGACY_ROOTS];
const isTauri = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof (window as any).__TAURI_INTERNALS__ !== "undefined";

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
  const base = await documentDir(); // e.g. C:\Users\...\Documents\

  for (const root of getAllRoots()) {
    const candidateRelative = `${root}/${storage_key}`;
    try {
      const existsHere = await exists(candidateRelative, {
        baseDir: BaseDirectory.Document,
      });
      if (existsHere) {
        return await join(base, root, storage_key);
      }
    } catch {
      // ignore and try next root
    }
  }

  // Fallback: assume current root even if exists() failed (e.g., permission issue)
  return await join(base, getAttachmentsRoot(), storage_key);
}

/** Abre archivo o URL con la app por defecto del SO (Tauri); en web solo informa */
export async function openWithOS(path: string) {
  if (isTauri()) {
    try {
      const { openPath } = await import("@tauri-apps/plugin-opener");
      console.log("Opening path:", path);
      await openPath(path);
      console.log("Path opened successfully");
      return;
    } catch (err) {
      console.error("openPath failed:", err);
      // seguimos al fallback
    }
  }

  // Web: no intentar abrir rutas locales; mostrar mensaje
  alert("Abrir en el explorador está disponible solo en la app de escritorio. Usa la vista previa.");
}

/** Opcional: mostrar el archivo dentro de su carpeta (Explorer/Finder) */
export async function revealInOS(path: string) {
  if (isTauri()) {
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

  // Web: mismo mensaje que openWithOS
  alert("Abrir la carpeta está disponible solo en la app de escritorio. Usa la vista previa.");
}
