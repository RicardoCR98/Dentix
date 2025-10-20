// src/types/tauri-plugin-opener.d.ts
declare module "@tauri-apps/plugin-opener" {
  /** Abre un archivo/directorio/URL con la app por defecto */
  export function open(target: string): Promise<void>;

  /** Revela un archivo en el explorador del sistema si la plataforma lo soporta */
  export function reveal(path: string): Promise<void>;
}
