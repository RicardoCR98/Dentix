// src/components/TelemetryWrapper.tsx
import { useMonthlyHeartbeat } from "../hooks/useMonthlyHeartbeat";
import { useErrorTelemetry } from "../hooks/useErrorTelemetry";

interface TelemetryWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component que inicializa telemetría
 * - Ejecuta el hook useMonthlyHeartbeat para enviar heartbeats mensuales
 * - Ejecuta el hook useErrorTelemetry para capturar errores globales
 * - No renderiza nada visible, solo ejecuta efectos
 */
export function TelemetryWrapper({ children }: TelemetryWrapperProps) {
  useMonthlyHeartbeat();
  useErrorTelemetry();
  return <>{children}</>;
}
