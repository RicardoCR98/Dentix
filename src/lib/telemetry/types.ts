// src/lib/telemetry/types.ts

/**
 * Telemetry Event Types
 * Define todos los eventos que el sistema puede rastrear
 */
export type TelemetryEventType =
  | "installation_completed"
  | "monthly_heartbeat"
  | "error_occurred"
  | "feature_used"
  | "app_updated";

/**
 * Parámetros base para todos los eventos
 */
export interface BaseTelemetryParams {
  installation_id: string;
  app_version: string;
  platform: string; // "windows" | "macos" | "linux"
  timestamp: string; // ISO 8601
}

/**
 * Parámetros específicos para installation_completed
 */
export interface InstallationCompletedParams extends BaseTelemetryParams {
  doctor_name: string;
  clinic_name: string;
  country: string;
}

/**
 * Parámetros específicos para monthly_heartbeat
 */
export interface MonthlyHeartbeatParams extends BaseTelemetryParams {
  days_since_install: number;
  total_patients: number;
  total_visits: number;
  total_sessions: number;
}

/**
 * Parámetros específicos para error_occurred
 */
export interface ErrorOccurredParams extends BaseTelemetryParams {
  error_message: string;
  error_stack?: string;
  error_context: string; // "database" | "ui" | "file_system" | "unknown"
}

/**
 * Parámetros específicos para feature_used
 */
export interface FeatureUsedParams extends BaseTelemetryParams {
  feature_name: string;
  feature_context?: string;
}

/**
 * Parámetros específicos para app_updated
 */
export interface AppUpdatedParams extends BaseTelemetryParams {
  previous_version: string;
  new_version: string;
}

/**
 * Union type de todos los parámetros posibles
 */
export type TelemetryEventParams =
  | InstallationCompletedParams
  | MonthlyHeartbeatParams
  | ErrorOccurredParams
  | FeatureUsedParams
  | AppUpdatedParams;

/**
 * Estructura de un evento de telemetría
 */
export interface TelemetryEvent {
  event_type: TelemetryEventType;
  event_data: TelemetryEventParams;
  timestamp: string;
  sent: boolean;
  sent_at?: string;
}

/**
 * Configuración del servicio de telemetría
 */
export interface TelemetryConfig {
  enabled: boolean;
  ga4_measurement_id: string;
  ga4_api_secret?: string; // Para Measurement Protocol API
  installation_id?: string;
  last_heartbeat_sent?: string;
}

/**
 * Resultado de envío de evento a GA4
 */
export interface GA4SendResult {
  success: boolean;
  error?: string;
}
