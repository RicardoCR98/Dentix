// src/hooks/useMonthlyHeartbeat.ts
import { useEffect } from "react";
import { telemetryService } from "../lib/telemetry";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

/**
 * Hook para enviar heartbeat mensual automático
 *
 * Comportamiento:
 * - Se ejecuta una vez al montar el componente (app startup)
 * - Verifica si han pasado 30 días desde el último heartbeat
 * - Si sí, envía evento monthly_heartbeat con estadísticas de uso
 * - Actualiza last_heartbeat_sent
 *
 * Uso:
 * ```tsx
 * function App() {
 *   useMonthlyHeartbeat();
 *   // ... resto del componente
 * }
 * ```
 */
export function useMonthlyHeartbeat() {
  useEffect(() => {
    let isMounted = true;

    const checkAndSendHeartbeat = async () => {
      try {
        // 1. Inicializar telemetry service
        await telemetryService.initialize();

        // 2. Verificar si está habilitado
        if (!telemetryService.isEnabled()) {
          console.log("📊 Telemetría deshabilitada. Heartbeat omitido.");
          return;
        }

        // 3. Obtener última fecha de heartbeat
        const lastHeartbeat = telemetryService.getLastHeartbeat();

        // 4. Verificar si han pasado 30 días
        const shouldSendHeartbeat = shouldSendMonthlyHeartbeat(lastHeartbeat);

        if (!shouldSendHeartbeat) {
          if (lastHeartbeat) {
            const daysSince = getDaysSince(new Date(lastHeartbeat));
            console.log(
              `📊 Heartbeat no necesario. Último envío hace ${daysSince} días.`
            );
          } else {
            console.log("📊 Heartbeat no necesario. Primera instalación.");
          }
          return;
        }

        // 5. Recolectar estadísticas de uso
        const stats = await collectUsageStats();

        // 6. Enviar heartbeat
        if (isMounted) {
          await telemetryService.trackEvent("monthly_heartbeat", stats);
          await telemetryService.updateLastHeartbeat();
          console.log("✅ monthly_heartbeat enviado", stats);
        }
      } catch (error) {
        console.error("❌ Error enviando heartbeat mensual:", error);
      }
    };

    // Ejecutar después de 10 segundos del startup (evitar bloquear inicialización)
    const timeout = setTimeout(() => {
      checkAndSendHeartbeat();
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []); // Solo ejecutar una vez al montar
}

/**
 * Verificar si deben enviar heartbeat
 * - Si no hay lastHeartbeat, NO enviar (es primera instalación, ya se envió installation_completed)
 * - Si han pasado 30+ días, enviar
 */
function shouldSendMonthlyHeartbeat(lastHeartbeat?: string): boolean {
  if (!lastHeartbeat) {
    // Primera instalación - no enviar heartbeat aún
    // El installation_completed ya se envió
    return false;
  }

  const daysSince = getDaysSince(new Date(lastHeartbeat));
  return daysSince >= 30;
}

/**
 * Calcular días desde una fecha
 */
function getDaysSince(date: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Recolectar estadísticas de uso del sistema
 */
async function collectUsageStats() {
  const { invoke } = await import("@tauri-apps/api/core");
  const repo = await getRepository();

  // Calcular días desde instalación
  const doctorProfile = await repo.getDoctorProfile();
  const installDate = doctorProfile?.created_at
    ? new Date(doctorProfile.created_at)
    : new Date();
  const daysSinceInstall = getDaysSince(installDate);

  // Obtener estadísticas usando comando Tauri
  const stats = await invoke<{
    total_patients: number;
    total_visits: number;
    total_sessions: number;
  }>("get_telemetry_stats");

  return {
    days_since_install: daysSinceInstall,
    total_patients: stats.total_patients,
    total_visits: stats.total_visits,
    total_sessions: stats.total_sessions,
  };
}
