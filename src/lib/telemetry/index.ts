// src/lib/telemetry/index.ts

/**
 * Telemetry Module
 * Exporta el servicio de telemetría y tipos relacionados
 */

export { TelemetryService, telemetryService } from "./TelemetryService";
export { GA4Client, ga4Client } from "./ga4";
export type {
  TelemetryEventType,
  TelemetryEventParams,
  BaseTelemetryParams,
  InstallationCompletedParams,
  MonthlyHeartbeatParams,
  ErrorOccurredParams,
  FeatureUsedParams,
  AppUpdatedParams,
  TelemetryEvent,
  TelemetryConfig,
  GA4SendResult,
} from "./types";
