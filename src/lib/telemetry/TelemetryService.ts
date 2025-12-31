// src/lib/telemetry/TelemetryService.ts
import { getRepository } from "../storage/TauriSqliteRepository";
import { ga4Client } from "./ga4";
import type {
  TelemetryEventType,
  TelemetryEventParams,
  TelemetryConfig,
  GA4SendResult,
} from "./types";

/**
 * TelemetryService - Servicio de telemetría offline-first
 *
 * Características:
 * - Generación automática de installation_id (UUID)
 * - Cola de eventos offline (almacenados en SQLite)
 * - Sincronización automática cuando hay conexión
 * - Integración con Google Analytics 4
 * - Respetuoso con la privacidad (sin PII, sin datos médicos)
 */
export class TelemetryService {
  private static instance: TelemetryService | null = null;
  private installationId: string | null = null;
  private isInitialized = false;
  private config: TelemetryConfig | null = null;

  private constructor() {
    // Singleton pattern - usar getInstance()
  }

  /**
   * Obtener instancia única del servicio
   */
  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Inicializar el servicio de telemetría
   * - Carga o genera installation_id
   * - Carga configuración desde user_settings
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("📊 TelemetryService ya inicializado");
      return;
    }

    try {
      const repo = await getRepository();

      // 1. Cargar configuración de telemetría
      this.config = await this.loadConfig();

      // 2. Obtener o crear installation_id
      this.installationId = await this.getOrCreateInstallationId();

      // 3. Configurar GA4 client si tenemos credenciales
      if (this.config.ga4_measurement_id && this.config.ga4_api_secret) {
        ga4Client.configure({
          measurement_id: this.config.ga4_measurement_id,
          api_secret: this.config.ga4_api_secret,
        });
        console.log("✅ GA4 configurado");
      } else {
        console.warn("⚠️ GA4 no configurado (falta measurement_id o api_secret)");
      }

      this.isInitialized = true;
      console.log("✅ TelemetryService inicializado", {
        installationId: this.installationId,
        enabled: this.config.enabled,
        ga4Configured: ga4Client.isConfigured(),
      });

      // 3. Intentar sincronizar eventos pendientes si está habilitado
      if (this.config.enabled) {
        this.syncQueuedEvents().catch((err) => {
          console.warn("⚠️ No se pudieron sincronizar eventos pendientes:", err);
        });
      }
    } catch (error) {
      console.error("❌ Error inicializando TelemetryService:", error);
      throw error;
    }
  }

  /**
   * Cargar configuración de telemetría desde user_settings
   */
  private async loadConfig(): Promise<TelemetryConfig> {
    const repo = await getRepository();

    // Obtener todos los settings (TauriSqliteRepository usa comandos Tauri)
    const allSettings = await repo.getAllSettings();

    const config: TelemetryConfig = {
      enabled: true, // Por defecto habilitado (acordado en Terms & Conditions)
      ga4_measurement_id: "", // Se configurará en migración 004
      ga4_api_secret: undefined,
      installation_id: undefined,
      last_heartbeat_sent: undefined,
    };

    // Parsear settings de telemetría
    if (allSettings["telemetry.enabled"]) {
      config.enabled = allSettings["telemetry.enabled"] === "true";
    }
    if (allSettings["telemetry.installation_id"]) {
      config.installation_id = allSettings["telemetry.installation_id"];
    }
    if (allSettings["telemetry.last_heartbeat_sent"]) {
      config.last_heartbeat_sent = allSettings["telemetry.last_heartbeat_sent"];
    }
    if (allSettings["telemetry.ga4_measurement_id"]) {
      config.ga4_measurement_id = allSettings["telemetry.ga4_measurement_id"];
    }
    if (allSettings["telemetry.ga4_api_secret"]) {
      config.ga4_api_secret = allSettings["telemetry.ga4_api_secret"];
    }

    return config;
  }

  /**
   * Obtener o crear installation_id
   * - Si existe en user_settings, lo retorna
   * - Si no existe, genera un UUID y lo guarda
   */
  private async getOrCreateInstallationId(): Promise<string> {
    const repo = await getRepository();

    // Intentar cargar desde config
    if (this.config?.installation_id) {
      return this.config.installation_id;
    }

    // Intentar cargar desde BD
    const allSettings = await repo.getAllSettings();
    const existingId = allSettings["telemetry.installation_id"];

    if (existingId) {
      return existingId;
    }

    // Generar nuevo UUID
    const newInstallationId = crypto.randomUUID();

    // Guardar en BD usando setSetting
    await repo.setSetting("telemetry.installation_id", newInstallationId, "telemetry");

    console.log("🆔 Nuevo installation_id generado:", newInstallationId);

    return newInstallationId;
  }

  /**
   * Obtener installation_id actual
   */
  public getInstallationId(): string | null {
    return this.installationId;
  }

  /**
   * Verificar si la telemetría está habilitada
   */
  public isEnabled(): boolean {
    return this.config?.enabled ?? true;
  }

  /**
   * Habilitar o deshabilitar telemetría
   */
  public async setEnabled(enabled: boolean): Promise<void> {
    const repo = await getRepository();

    await repo.setSetting("telemetry.enabled", enabled ? "true" : "false", "telemetry");

    if (this.config) {
      this.config.enabled = enabled;
    }

    console.log(`📊 Telemetría ${enabled ? "habilitada" : "deshabilitada"}`);
  }

  /**
   * Trackear un evento de telemetría
   * - Si está online y habilitado: envía inmediatamente a GA4
   * - Si está offline: encola en telemetry_events
   */
  public async trackEvent(
    eventType: TelemetryEventType,
    params: Partial<TelemetryEventParams>
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn("⚠️ TelemetryService no inicializado. Inicializando...");
      await this.initialize();
    }

    if (!this.isEnabled()) {
      console.log("📊 Telemetría deshabilitada. Evento ignorado:", eventType);
      return;
    }

    try {
      // Enriquecer parámetros con datos base
      const enrichedParams = await this.enrichParams(params);

      // Intentar enviar a GA4
      const sendResult = await this.sendToGA4(eventType, enrichedParams);

      if (sendResult.success) {
        console.log("✅ Evento enviado a GA4:", eventType);
      } else {
        // Si falla, encolar para reintentar después
        await this.queueEvent(eventType, enrichedParams);
        console.log("📥 Evento encolado (offline):", eventType);
      }
    } catch (error) {
      console.error("❌ Error trackeando evento:", error);
      // En caso de error, encolar el evento
      const enrichedParams = await this.enrichParams(params);
      await this.queueEvent(eventType, enrichedParams);
    }
  }

  /**
   * Enriquecer parámetros del evento con datos base
   */
  private async enrichParams(
    params: Partial<TelemetryEventParams>
  ): Promise<TelemetryEventParams> {
    const platform = await this.detectPlatform();
    const appVersion = await this.getAppVersion();

    return {
      installation_id: this.installationId!,
      app_version: appVersion,
      platform,
      timestamp: new Date().toISOString(),
      ...params,
    } as TelemetryEventParams;
  }

  /**
   * Detectar plataforma del sistema
   */
  private async detectPlatform(): Promise<string> {
    // Usar navigator.userAgent para detectar plataforma en Tauri
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("win")) return "windows";
    if (userAgent.includes("mac")) return "macos";
    if (userAgent.includes("linux")) return "linux";

    return "unknown";
  }

  /**
   * Obtener versión de la aplicación
   */
  private async getAppVersion(): Promise<string> {
    // TODO: Leer desde package.json o Tauri config
    // Por ahora retornamos una versión hardcoded
    return "1.0.0-beta";
  }

  /**
   * Enviar evento a Google Analytics 4
   * - Usa Measurement Protocol API
   * - Retorna éxito/fracaso
   */
  private async sendToGA4(
    eventType: TelemetryEventType,
    params: TelemetryEventParams
  ): Promise<GA4SendResult> {
    // Verificar que GA4 esté configurado
    if (!ga4Client.isConfigured()) {
      return {
        success: false,
        error: "GA4 no configurado (measurement_id o api_secret faltantes)",
      };
    }

    // Enviar evento usando GA4 client
    return await ga4Client.sendEvent(eventType, params);
  }

  /**
   * Encolar evento en telemetry_events para envío posterior
   */
  private async queueEvent(
    eventType: TelemetryEventType,
    params: TelemetryEventParams
  ): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    const repo = await getRepository();

    // Obtener doctor_id del perfil
    const doctorProfile = await repo.getDoctorProfile();
    if (!doctorProfile) {
      console.warn("⚠️ No hay perfil de doctor. No se puede encolar evento.");
      return;
    }

    await invoke("queue_telemetry_event", {
      doctorId: doctorProfile.doctor_id,
      eventType,
      eventData: JSON.stringify(params),
    });
  }

  /**
   * Sincronizar eventos pendientes (sent = 0)
   * - Intenta reenviar eventos que fallaron anteriormente
   * - Marca como enviados los que tienen éxito
   */
  public async syncQueuedEvents(): Promise<void> {
    if (!this.isEnabled()) {
      console.log("📊 Telemetría deshabilitada. No se sincronizan eventos.");
      return;
    }

    const { invoke } = await import("@tauri-apps/api/core");

    // Obtener eventos pendientes
    const pendingEvents = await invoke<
      Array<{
        id: number;
        doctor_id: string;
        event_type: TelemetryEventType;
        event_data: string;
        timestamp: string;
        sent: boolean;
        sent_at?: string;
      }>
    >("get_pending_telemetry_events");

    if (pendingEvents.length === 0) {
      console.log("📊 No hay eventos pendientes para sincronizar");
      return;
    }

    console.log(`📤 Sincronizando ${pendingEvents.length} eventos pendientes...`);

    let successCount = 0;
    let failCount = 0;

    for (const event of pendingEvents) {
      try {
        const params = JSON.parse(event.event_data) as TelemetryEventParams;
        const result = await this.sendToGA4(event.event_type, params);

        if (result.success) {
          // Marcar como enviado
          await invoke("mark_telemetry_event_sent", { eventId: event.id });
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Error sincronizando evento ${event.id}:`, error);
        failCount++;
      }
    }

    console.log(
      `✅ Sincronización completada: ${successCount} enviados, ${failCount} pendientes`
    );
  }

  /**
   * Actualizar última fecha de heartbeat
   */
  public async updateLastHeartbeat(): Promise<void> {
    const repo = await getRepository();
    const now = new Date().toISOString();

    await repo.setSetting("telemetry.last_heartbeat_sent", now, "telemetry");

    if (this.config) {
      this.config.last_heartbeat_sent = now;
    }
  }

  /**
   * Obtener última fecha de heartbeat
   */
  public getLastHeartbeat(): string | undefined {
    return this.config?.last_heartbeat_sent;
  }
}

/**
 * Export singleton instance
 */
export const telemetryService = TelemetryService.getInstance();
