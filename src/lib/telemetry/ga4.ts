// src/lib/telemetry/ga4.ts

/**
 * Google Analytics 4 Integration
 * Usa Measurement Protocol API para enviar eventos desde Tauri
 *
 * Documentación:
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

import type {
  TelemetryEventType,
  TelemetryEventParams,
  GA4SendResult,
} from "./types";

/**
 * Configuración de GA4
 */
interface GA4Config {
  measurement_id: string; // Format: G-XXXXXXXXXX
  api_secret: string; // Generado en GA4 Admin > Data Streams > Measurement Protocol API secrets
}

/**
 * Estructura de evento para GA4 Measurement Protocol
 */
interface GA4Event {
  name: string; // Event name (max 40 chars)
  params: Record<string, string | number | boolean>; // Event parameters
}

/**
 * Payload para GA4 Measurement Protocol API
 */
interface GA4Payload {
  client_id: string; // installation_id
  events: GA4Event[];
  user_properties?: Record<string, { value: string | number | boolean }>;
}

/**
 * GA4Client - Cliente para enviar eventos a Google Analytics 4
 */
export class GA4Client {
  private config: GA4Config | null = null;
  private endpoint = "https://www.google-analytics.com/mp/collect";

  /**
   * Configurar credenciales de GA4
   */
  public configure(config: GA4Config): void {
    this.config = config;
  }

  /**
   * Verificar si el cliente está configurado
   */
  public isConfigured(): boolean {
    return this.config !== null &&
           this.config.measurement_id.length > 0 &&
           this.config.api_secret.length > 0;
  }

  /**
   * Enviar evento a GA4
   */
  public async sendEvent(
    eventType: TelemetryEventType,
    params: TelemetryEventParams
  ): Promise<GA4SendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "GA4 no configurado (measurement_id o api_secret faltantes)",
      };
    }

    try {
      // Construir payload
      const payload = this.buildPayload(eventType, params);

      // Construir URL con parámetros
      const url = this.buildUrl();

      // Enviar a GA4
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `GA4 API error: ${response.status} - ${errorText}`,
        };
      }
    } catch (error) {
      // Error de red (offline, timeout, etc.)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Construir URL del endpoint con parámetros
   */
  private buildUrl(): string {
    const params = new URLSearchParams({
      measurement_id: this.config!.measurement_id,
      api_secret: this.config!.api_secret,
    });

    return `${this.endpoint}?${params.toString()}`;
  }

  /**
   * Construir payload de evento para GA4
   */
  private buildPayload(
    eventType: TelemetryEventType,
    params: TelemetryEventParams
  ): GA4Payload {
    // Mapear event_type a nombre de evento GA4
    const eventName = this.mapEventName(eventType);

    // Extraer parámetros base
    const { installation_id, app_version, platform, timestamp, ...eventParams } =
      params;

    // Construir evento
    const event: GA4Event = {
      name: eventName,
      params: {
        // Parámetros estándar
        app_version,
        platform,
        timestamp,
        // Parámetros específicos del evento
        ...this.sanitizeParams(eventParams),
      },
    };

    // Construir payload
    const payload: GA4Payload = {
      client_id: installation_id,
      events: [event],
      user_properties: {
        app_version: { value: app_version },
        platform: { value: platform },
      },
    };

    return payload;
  }

  /**
   * Mapear TelemetryEventType a nombre de evento GA4
   */
  private mapEventName(eventType: TelemetryEventType): string {
    const mapping: Record<TelemetryEventType, string> = {
      installation_completed: "installation_completed",
      monthly_heartbeat: "monthly_heartbeat",
      error_occurred: "error_occurred",
      feature_used: "feature_used",
      app_updated: "app_updated",
    };

    return mapping[eventType] || eventType;
  }

  /**
   * Sanitizar parámetros de evento
   * - Limitar longitud de strings
   * - Convertir valores complejos a strings
   * - Remover valores undefined/null
   */
  private sanitizeParams(
    params: Record<string, any>
  ): Record<string, string | number | boolean> {
    const sanitized: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(params)) {
      // Skip undefined/null
      if (value === undefined || value === null) {
        continue;
      }

      // Limitar longitud de key (max 40 chars para GA4)
      const sanitizedKey = key.substring(0, 40);

      // Sanitizar value
      if (typeof value === "string") {
        // Limitar longitud de string (max 100 chars para GA4)
        sanitized[sanitizedKey] = value.substring(0, 100);
      } else if (typeof value === "number" || typeof value === "boolean") {
        sanitized[sanitizedKey] = value;
      } else {
        // Convertir objetos/arrays a JSON string
        sanitized[sanitizedKey] = JSON.stringify(value).substring(0, 100);
      }
    }

    return sanitized;
  }

  /**
   * Validar evento antes de enviar (debug mode)
   * Retorna URL para validación en GA4
   */
  public getValidationUrl(): string {
    if (!this.isConfigured()) {
      throw new Error("GA4 no configurado");
    }

    const params = new URLSearchParams({
      measurement_id: this.config!.measurement_id,
      api_secret: this.config!.api_secret,
    });

    return `https://www.google-analytics.com/debug/mp/collect?${params.toString()}`;
  }

  /**
   * Enviar evento en modo validación (para testing)
   * Retorna información detallada de validación
   */
  public async validateEvent(
    eventType: TelemetryEventType,
    params: TelemetryEventParams
  ): Promise<{ valid: boolean; validationMessages: any[] }> {
    if (!this.isConfigured()) {
      throw new Error("GA4 no configurado");
    }

    try {
      const payload = this.buildPayload(eventType, params);
      const url = this.getValidationUrl();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const validationResult = await response.json();
        return {
          valid: validationResult.validationMessages?.length === 0,
          validationMessages: validationResult.validationMessages || [],
        };
      } else {
        throw new Error(`Validation failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error validating event:", error);
      throw error;
    }
  }
}

/**
 * Export singleton instance
 */
export const ga4Client = new GA4Client();
