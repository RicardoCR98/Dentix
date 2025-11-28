// src/lib/storage/TauriSqliteRepository.ts
import { invoke } from "@tauri-apps/api/core";
import type {
  Patient,
  Visit,
  SessionRow,
  ProcItem,
  ProcedureTemplate,
  DiagnosisOption,
} from "../types";

/** Fila reducida para listar visitas de un paciente (histórico) */
export type VisitListRow = {
  id: number;
  date: string;
  reason_type: string | null;
  reason_detail: string | null;
  diagnosis: string | null;
  full_dx_text: string | null;
  tooth_dx_json: string | null;
};

/**
 * Repositorio que usa comandos Tauri (Rust backend) para todas las operaciones de base de datos.
 * Todas las operaciones ahora se manejan en el backend de Rust para evitar problemas de bloqueo.
 */
export class TauriSqliteRepository {
  /**
   * Inicializa el repositorio.
   * Nota: La base de datos se inicializa automáticamente en el backend de Rust al arrancar la app.
   */
  async initialize() {
    // No se necesita inicialización - el backend de Rust maneja todo
    console.log("TauriSqliteRepository: Using Rust backend commands");
  }

  // ============================================================================
  // PATIENT OPERATIONS
  // ============================================================================

  async searchPatients(q: string): Promise<Patient[]> {
    try {
      return await invoke<Patient[]>("search_patients", { query: q });
    } catch (error) {
      console.error("Error en searchPatients:", error);
      throw error;
    }
  }

  async findPatientById(id: number): Promise<Patient | null> {
    try {
      return await invoke<Patient | null>("find_patient_by_id", { id });
    } catch (error) {
      console.error("Error en findPatientById:", error);
      throw error;
    }
  }

  async upsertPatient(patient: Patient): Promise<number> {
    try {
      return await invoke<number>("upsert_patient", { patient });
    } catch (error) {
      console.error("Error en upsertPatient:", error);
      throw error;
    }
  }

  // ============================================================================
  // VISIT OPERATIONS
  // ============================================================================

  async getVisitsByPatient(patientId: number): Promise<VisitListRow[]> {
    try {
      const visits = await invoke<Visit[]>("get_visits_by_patient", { patientId });
      // Mapear a VisitListRow (el formato esperado por el frontend)
      return visits.map((v) => ({
        id: v.id!,
        date: v.date || "",
        reason_type: v.reason_type || null,
        reason_detail: v.reason_detail || null,
        diagnosis: v.diagnosis || null,
        full_dx_text: v.full_dx_text || null,
        tooth_dx_json: v.tooth_dx_json || null,
      }));
    } catch (error) {
      console.error("Error en getVisitsByPatient:", error);
      throw error;
    }
  }

  async getVisitDetail(visitId: number): Promise<Visit | null> {
    try {
      // Usamos get_visits_by_patient y filtramos (no muy eficiente pero funciona)
      // En una implementación real, podríamos añadir un comando get_visit_by_id en Rust
      const visits = await invoke<Visit[]>("get_visits_by_patient", { patientId: 0 });
      return visits.find((v) => v.id === visitId) || null;
    } catch (error) {
      console.error("Error en getVisitDetail:", error);
      return null;
    }
  }

  async deleteVisit(visitId: number): Promise<void> {
    try {
      await invoke("delete_visit", { visitId });
    } catch (error) {
      console.error("Error en deleteVisit:", error);
      throw error;
    }
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  async getSessionsByVisit(visitId: number): Promise<SessionRow[]> {
    try {
      const rustSessions = await invoke<Array<{ visit: any; items: any[] }>>(
        "get_sessions_by_visit",
        { visitId }
      );

      // Transformar de formato Rust a formato frontend
      return rustSessions.map((rustSession) => ({
        id: String(rustSession.visit.id),
        visitId: rustSession.visit.id,
        date: rustSession.visit.date,
        auto: true,  // Asumir automático por defecto
        items: rustSession.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          unit: item.unit_price,
          qty: item.quantity,
          sub: item.subtotal,
          procedure_template_id: item.procedure_template_id,
        })),
        budget: rustSession.visit.budget,
        discount: rustSession.visit.discount,
        payment: rustSession.visit.payment,
        balance: rustSession.visit.balance,
        signer: rustSession.visit.signer || "",
        observations: rustSession.visit.observations || "",
      }));
    } catch (error) {
      console.error("Error en getSessionsByVisit:", error);
      throw error;
    }
  }

  // ============================================================================
  // COMPLEX OPERATION: Save Visit with Sessions
  // ============================================================================

  async saveVisitWithSessions(payload: {
    patient: Patient;
    visit: Visit;
    sessions: SessionRow[];
  }): Promise<{ patient_id: number; visit_id: number }> {
    try {
      // Transformar SessionRow[] del frontend al formato que espera Rust
      // Rust espera: { visit: Visit, items: VisitProcedure[] }[]
      const rustSessions = payload.sessions.map((session) => ({
        visit: {
          id: session.visitId,  // ID de la visita en BD (si existe)
          patient_id: payload.patient.id,
          date: session.date,
          reason_type: payload.visit.reason_type,
          reason_detail: payload.visit.reason_detail,
          diagnosis_text: payload.visit.diagnosis_text,
          auto_dx_text: payload.visit.auto_dx_text,
          full_dx_text: payload.visit.full_dx_text,
          tooth_dx_json: payload.visit.tooth_dx_json,
          budget: session.budget,
          discount: session.discount,
          payment: session.payment,
          balance: session.balance,
          cumulative_balance: 0,  // Se calcula en Rust
          signer: session.signer || null,
          observations: session.observations || null,
          is_saved: true,
        },
        items: session.items.map((item) => ({
          id: item.id,
          visit_id: session.visitId,
          name: item.name,
          unit_price: item.unit,
          quantity: item.qty,
          subtotal: item.sub,
          procedure_template_id: item.procedure_template_id,
          sort_order: 0,  // Se asigna en Rust
        })),
      }));

      const rustPayload = {
        patient: payload.patient,
        visit: payload.visit,
        sessions: rustSessions,
      };

      return await invoke<{ patient_id: number; visit_id: number }>(
        "save_visit_with_sessions",
        { payload: rustPayload }
      );
    } catch (error) {
      console.error("Error en saveVisitWithSessions:", error);
      throw error;
    }
  }

  // ============================================================================
  // PROCEDURE TEMPLATE OPERATIONS
  // ============================================================================

  async getProcedureTemplates(): Promise<ProcedureTemplate[]> {
    try {
      return await invoke<ProcedureTemplate[]>("get_procedure_templates");
    } catch (error) {
      console.error("Error en getProcedureTemplates:", error);
      throw error;
    }
  }

  async saveProcedureTemplates(templates: ProcedureTemplate[]): Promise<void> {
    try {
      await invoke("save_procedure_templates", { templates });
    } catch (error) {
      console.error("Error en saveProcedureTemplates:", error);
      throw error;
    }
  }

  // ============================================================================
  // DIAGNOSIS OPTIONS OPERATIONS
  // ============================================================================

  async getDiagnosisOptions(): Promise<DiagnosisOption[]> {
    try {
      return await invoke<DiagnosisOption[]>("get_diagnosis_options");
    } catch (error) {
      console.error("Error en getDiagnosisOptions:", error);
      throw error;
    }
  }

  async saveDiagnosisOptions(options: DiagnosisOption[]): Promise<void> {
    try {
      await invoke("save_diagnosis_options", { options });
    } catch (error) {
      console.error("Error en saveDiagnosisOptions:", error);
      throw error;
    }
  }

  // Métodos legacy que ahora usan saveDiagnosisOptions internamente
  async createDiagnosisOption(option: {
    label: string;
    color: string;
  }): Promise<number> {
    try {
      const current = await this.getDiagnosisOptions();
      const newOption: DiagnosisOption = {
        label: option.label,
        color: option.color,
        active: true,
        sort_order: current.length + 1,
      };
      await this.saveDiagnosisOptions([...current, newOption]);
      const updated = await this.getDiagnosisOptions();
      return updated[updated.length - 1]?.id || 0;
    } catch (error) {
      console.error("Error en createDiagnosisOption:", error);
      throw error;
    }
  }

  async updateDiagnosisOption(
    id: number,
    updates: { label?: string; color?: string }
  ): Promise<void> {
    try {
      const current = await this.getDiagnosisOptions();
      const updated = current.map((opt) =>
        opt.id === id ? { ...opt, ...updates } : opt
      );
      await this.saveDiagnosisOptions(updated);
    } catch (error) {
      console.error("Error en updateDiagnosisOption:", error);
      throw error;
    }
  }

  async deleteDiagnosisOption(id: number): Promise<void> {
    try {
      const current = await this.getDiagnosisOptions();
      const filtered = current.filter((opt) => opt.id !== id);
      await this.saveDiagnosisOptions(filtered);
    } catch (error) {
      console.error("Error en deleteDiagnosisOption:", error);
      throw error;
    }
  }

  // ============================================================================
  // SIGNER OPERATIONS
  // ============================================================================

  async getSigners(): Promise<Array<{ id: number; name: string }>> {
    try {
      return await invoke<Array<{ id: number; name: string }>>("get_signers");
    } catch (error) {
      console.error("Error en getSigners:", error);
      throw error;
    }
  }

  async createSigner(name: string): Promise<number> {
    try {
      return await invoke<number>("create_signer", { name });
    } catch (error) {
      console.error("Error en createSigner:", error);
      throw error;
    }
  }

  // ============================================================================
  // REASON TYPE OPERATIONS
  // ============================================================================

  async getReasonTypes(): Promise<
    Array<{
      id: number;
      name: string;
      active: boolean;
      sort_order: number;
    }>
  > {
    try {
      const result = await invoke<
        Array<{
          id: number;
          name: string;
          active: boolean | null;
          sort_order: number | null;
        }>
      >("get_reason_types");

      // Mapear valores null a valores por defecto
      return result.map((rt) => ({
        id: rt.id,
        name: rt.name,
        active: rt.active ?? true,
        sort_order: rt.sort_order ?? 0,
      }));
    } catch (error) {
      console.error("Error en getReasonTypes:", error);
      throw error;
    }
  }

  async createReasonType(name: string): Promise<number> {
    try {
      return await invoke<number>("create_reason_type", { name });
    } catch (error) {
      console.error("Error en createReasonType:", error);
      throw error;
    }
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  async getAllSettings(): Promise<Record<string, string>> {
    try {
      return await invoke<Record<string, string>>("get_all_settings");
    } catch (error) {
      console.error("Error en getAllSettings:", error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<string | null> {
    try {
      const all = await this.getAllSettings();
      return all[key] || null;
    } catch (error) {
      console.error("Error en getSetting:", error);
      return null;
    }
  }

  async getSettingsByCategory(category: string): Promise<Record<string, string>> {
    try {
      // No hay filtrado por categoría en el backend, así que devolvemos todas
      // En una implementación real, se podría añadir soporte para categorías
      return await this.getAllSettings();
    } catch (error) {
      console.error("Error en getSettingsByCategory:", error);
      return {};
    }
  }

  async setSetting(
    key: string,
    value: string,
    category: string = "general"
  ): Promise<void> {
    try {
      await invoke("save_setting", { key, value, category });
    } catch (error) {
      console.error("Error en setSetting:", error);
      throw error;
    }
  }

  async setSettings(
    settings: Record<string, { value: string; category?: string }>
  ): Promise<void> {
    try {
      // Guardar cada configuración individualmente
      for (const [key, { value, category }] of Object.entries(settings)) {
        await this.setSetting(key, value, category || "general");
      }
    } catch (error) {
      console.error("Error en setSettings:", error);
      throw error;
    }
  }

  // ============================================================================
  // ATTACHMENT OPERATIONS (No implementados en Rust aún - devuelven arrays vacíos)
  // ============================================================================

  async getAttachmentsByVisit(visitId: number) {
    console.warn("getAttachmentsByVisit: Not implemented in Rust backend yet");
    return [];
  }

  async getAttachmentsByPatient(patientId: number) {
    console.warn("getAttachmentsByPatient: Not implemented in Rust backend yet");
    return [];
  }

  async createAttachment(meta: {
    visit_id: number | null;
    patient_id: number | null;
    filename: string;
    mime_type: string;
    bytes: number;
    storage_key: string;
  }) {
    console.warn("createAttachment: Not implemented in Rust backend yet");
    throw new Error("Attachments not implemented yet");
  }

  async moveAttachmentToVisit(attachmentId: number, visitId: number | null) {
    console.warn("moveAttachmentToVisit: Not implemented in Rust backend yet");
    throw new Error("Attachments not implemented yet");
  }

  async deleteAttachment(attachmentId: number) {
    console.warn("deleteAttachment: Not implemented in Rust backend yet");
    throw new Error("Attachments not implemented yet");
  }

  // ============================================================================
  // MÉTODOS LEGACY/NO UTILIZADOS
  // ============================================================================

  async getVisitsByPatientPaged(
    patientId: number,
    limit: number = 10,
    offset: number = 0
  ) {
    // Implementación simple usando getVisitsByPatient
    const all = await this.getVisitsByPatient(patientId);
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
      hasMore: offset + limit < all.length,
    };
  }

  async getSessionsByPatient(patientId: number): Promise<SessionRow[]> {
    try {
      const rustSessions = await invoke<Array<{ visit: any; items: any[] }>>(
        "get_sessions_by_patient",
        { patientId }
      );

      // Transformar de formato Rust a formato frontend
      return rustSessions.map((rustSession) => ({
        id: String(rustSession.visit.id),
        visitId: rustSession.visit.id,
        date: rustSession.visit.date,
        auto: true,  // Asumir automático por defecto
        items: rustSession.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          unit: item.unit_price,
          qty: item.quantity,
          sub: item.subtotal,
          procedure_template_id: item.procedure_template_id,
        })),
        budget: rustSession.visit.budget,
        discount: rustSession.visit.discount,
        payment: rustSession.visit.payment,
        balance: rustSession.visit.balance,
        signer: rustSession.visit.signer || "",
        observations: rustSession.visit.observations || "",
      }));
    } catch (error) {
      console.error("Error en getSessionsByPatient:", error);
      throw error;
    }
  }

  async updateSigner(id: number, name: string): Promise<void> {
    console.warn("updateSigner: Not implemented in Rust backend yet");
  }

  async deleteSigner(id: number): Promise<void> {
    console.warn("deleteSigner: Not implemented in Rust backend yet");
  }

  async updateReasonType(id: number, name: string): Promise<void> {
    console.warn("updateReasonType: Not implemented in Rust backend yet");
  }

  async deleteReasonType(id: number): Promise<void> {
    console.warn("deleteReasonType: Not implemented in Rust backend yet");
  }

  async deleteSetting(key: string): Promise<void> {
    console.warn("deleteSetting: Not implemented in Rust backend yet");
  }

  async resetAllSettings(): Promise<void> {
    console.warn("resetAllSettings: Not implemented in Rust backend yet");
  }
}

// Singleton instance
export const tauriSqliteRepository = new TauriSqliteRepository();

/**
 * Función legacy para obtener la instancia del repositorio
 * @deprecated Usa tauriSqliteRepository directamente en su lugar
 */
export async function getRepository(): Promise<TauriSqliteRepository> {
  return tauriSqliteRepository;
}
