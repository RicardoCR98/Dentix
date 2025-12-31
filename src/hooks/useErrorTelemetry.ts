// src/hooks/useErrorTelemetry.ts
import { useEffect } from "react";
import { telemetryService } from "../lib/telemetry";

/**
 * Hook para capturar y reportar errores críticos a telemetría
 *
 * Captura:
 * - Errores de JavaScript no manejados (window.onerror)
 * - Promesas rechazadas no manejadas (window.onunhandledrejection)
 *
 * NO captura:
 * - Errores de renderizado de React (usar Error Boundary para eso)
 * - Errores manejados con try/catch
 *
 * Uso:
 * ```tsx
 * function App() {
 *   useErrorTelemetry();
 *   // ... resto del componente
 * }
 * ```
 */
export function useErrorTelemetry() {
  useEffect(() => {
    // Handler para errores de JavaScript
    const handleError = (event: ErrorEvent) => {
      const { message, filename, lineno, colno, error } = event;

      console.error("❌ Error global capturado:", {
        message,
        filename,
        lineno,
        colno,
        stack: error?.stack,
      });

      // Enviar a telemetría
      sendErrorTelemetry({
        error_message: message,
        error_stack: error?.stack,
        error_context: "javascript",
        filename,
        lineno,
        colno,
      });

      // No prevenir el comportamiento por defecto (el error seguirá en consola)
      return false;
    };

    // Handler para promesas rechazadas no manejadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const { reason } = event;

      console.error("❌ Promise rejection no manejada:", reason);

      // Determinar mensaje de error
      let errorMessage = "Unhandled promise rejection";
      let errorStack: string | undefined;

      if (reason instanceof Error) {
        errorMessage = reason.message;
        errorStack = reason.stack;
      } else if (typeof reason === "string") {
        errorMessage = reason;
      } else {
        errorMessage = JSON.stringify(reason);
      }

      // Enviar a telemetría
      sendErrorTelemetry({
        error_message: errorMessage,
        error_stack: errorStack,
        error_context: "promise",
      });
    };

    // Registrar listeners
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    console.log("🛡️ Error telemetry listeners registrados");

    // Cleanup
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      console.log("🛡️ Error telemetry listeners removidos");
    };
  }, []);
}

/**
 * Enviar evento error_occurred a telemetría
 */
async function sendErrorTelemetry(errorData: {
  error_message: string;
  error_stack?: string;
  error_context: "javascript" | "promise" | "database" | "ui" | "file_system" | "unknown";
  filename?: string;
  lineno?: number;
  colno?: number;
}) {
  try {
    // Inicializar telemetry si no está inicializado
    await telemetryService.initialize();

    // Verificar si está habilitado
    if (!telemetryService.isEnabled()) {
      return;
    }

    // Truncar stack trace si es muy largo (max 500 chars)
    const truncatedStack = errorData.error_stack?.substring(0, 500);

    // Enviar evento
    await telemetryService.trackEvent("error_occurred", {
      error_message: errorData.error_message.substring(0, 200), // Truncar mensaje
      error_stack: truncatedStack,
      error_context: errorData.error_context,
    });

    console.log("📊 Error enviado a telemetría");
  } catch (error) {
    // No queremos que el telemetry falle y cause más errores
    console.error("⚠️ Error enviando telemetría de error:", error);
  }
}

/**
 * Función helper para reportar errores manualmente
 *
 * Uso:
 * ```tsx
 * try {
 *   await someOperation();
 * } catch (error) {
 *   reportError(error, "database");
 *   // manejar el error...
 * }
 * ```
 */
export function reportError(
  error: unknown,
  context: "database" | "ui" | "file_system" | "unknown" = "unknown"
) {
  let errorMessage = "Unknown error";
  let errorStack: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = JSON.stringify(error);
  }

  sendErrorTelemetry({
    error_message: errorMessage,
    error_stack: errorStack,
    error_context: context,
  });
}
