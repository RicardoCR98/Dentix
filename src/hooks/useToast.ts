import { useContext } from "react";
import { ToastContext } from "../components/ToastProvider";

/**
 * Hook para usar el sistema de notificaciones Toast
 *
 * @example
 * const toast = useToast();
 * toast.success("Guardado", "Los cambios se guardaron correctamente");
 * toast.error("Error", "No se pudo conectar al servidor");
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
