// src/lib/storage/TauriSqliteRepository.ts
import { invoke } from "@tauri-apps/api/core";
import type {
  Patient,
  ProcedureTemplate,
  DiagnosisOption,
  Payment,
  PaymentMethod,
  Session,
  SessionWithItems,
} from "../types";

/** Fila reducida para listar sesiones de un paciente (histórico) */
export type SessionListRow = {
  id: number;
  date: string;
  reason_type: string | null;
  reason_detail: string | null;
  diagnosis_text: string | null;
  full_dx_text: string | null;
  tooth_dx_json: string | null;
};

/** @deprecated Use SessionListRow instead */
export type VisitListRow = SessionListRow;

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
  }

  // ============================================================================
  // PATIENT OPERATIONS
  // ============================================================================

  async getAllPatientsList(): Promise<
    import("../types").PatientListItem[]
  > {
    try {
      return await invoke<import("../types").PatientListItem[]>(
        "get_all_patients_list",
      );
    } catch (error) {
      console.error("Error en getAllPatientsList:", error);
      throw error;
    }
  }

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

  async getSessionsByPatientList(patientId: number): Promise<SessionListRow[]> {
    try {
      const sessions = await invoke<Session[]>("get_visits_by_patient", {
        patientId,
      });
      // Mapear a SessionListRow (el formato esperado por el frontend)
      return sessions.map((s) => ({
        id: s.id!,
        date: s.date || "",
        reason_type: s.reason_type || null,
        reason_detail: s.reason_detail || null,
        diagnosis_text: s.diagnosis_text || null,
        full_dx_text: s.full_dx_text || null,
        tooth_dx_json: s.tooth_dx_json || null,
      }));
    } catch (error) {
      console.error("Error en getSessionsByPatientList:", error);
      throw error;
    }
  }

  /** @deprecated Use getSessionsByPatientList instead */
  async getVisitsByPatient(patientId: number): Promise<SessionListRow[]> {
    return this.getSessionsByPatientList(patientId);
  }

  async getSessionDetail(sessionId: number): Promise<Session | null> {
    try {
      // TODO: Añadir comando get_session_by_id en Rust para mayor eficiencia
      const sessions = await invoke<Session[]>("get_visits_by_patient", {
        patientId: 0,
      });
      return sessions.find((s) => s.id === sessionId) || null;
    } catch (error) {
      console.error("Error en getSessionDetail:", error);
      return null;
    }
  }

  /** @deprecated Use getSessionDetail instead */
  async getVisitDetail(visitId: number): Promise<Session | null> {
    return this.getSessionDetail(visitId);
  }

  async deleteSession(sessionId: number): Promise<void> {
    try {
      await invoke("delete_visit", { visitId: sessionId });
    } catch (error) {
      console.error("Error en deleteSession:", error);
      throw error;
    }
  }

  /** @deprecated Use deleteSession instead */
  async deleteVisit(visitId: number): Promise<void> {
    return this.deleteSession(visitId);
  }

  // ============================================================================
  // SESSION WITH ITEMS OPERATIONS
  // ============================================================================

  async getSessionsWithItems(sessionId: number): Promise<SessionWithItems[]> {
    try {
      // Rust devuelve { visit: Session, items: SessionItem[] }[]
      // Frontend espera { session: Session, items: SessionItem[] }[]
      type RustSessionRow = {
        visit: Session;
        items: import("../types").SessionItem[];
      };
      const rustData = await invoke<RustSessionRow[]>("get_sessions_by_visit", {
        visitId: sessionId,
      });

      // Transformar: visit -> session
      return rustData.map((row) => ({
        session: row.visit,
        items: row.items,
      }));
    } catch (error) {
      console.error("Error en getSessionsWithItems:", error);
      throw error;
    }
  }

  /** @deprecated Use getSessionsWithItems instead */
  async getSessionsByVisit(visitId: number): Promise<SessionWithItems[]> {
    return this.getSessionsWithItems(visitId);
  }

  // ============================================================================
  // COMPLEX OPERATION: Save Visit with Sessions
  // ============================================================================

  async savePatientWithSessions(payload: {
    patient: Patient;
    session: Session;
    sessions: SessionWithItems[];
  }): Promise<{ patient_id: number; session_id: number }> {
    try {
      // sessions is already SessionWithItems[] which is { session: Session, items: SessionItem[] }[]

      // Convert undefined to null for proper serialization
      const serializeSession = (s: Session) => ({
        id: s.id ?? null,
        patient_id: s.patient_id ?? null,
        date: s.date,
        reason_type: s.reason_type ?? null,
        reason_detail: s.reason_detail ?? null,
        diagnosis_text: s.diagnosis_text ?? null,
        auto_dx_text: s.auto_dx_text ?? null,
        full_dx_text: s.full_dx_text ?? null,
        tooth_dx_json: s.tooth_dx_json ?? null,
        budget: s.budget ?? 0,
        discount: s.discount ?? 0,
        payment: s.payment ?? 0,
        balance: s.balance ?? 0,
        cumulative_balance: s.cumulative_balance ?? 0,
        payment_method_id: s.payment_method_id ?? null,
        payment_notes: s.payment_notes ?? null,
        signer: s.signer ?? null,
        clinical_notes: s.clinical_notes ?? null,
        is_saved: s.is_saved ?? null,
        created_at: s.created_at ?? null,
        updated_at: s.updated_at ?? null,
      });

      const serializedPayload = {
        patient: payload.patient,
        visit: serializeSession(payload.session), // Nota: Rust aún espera "visit" (pendiente actualizar)
        sessions: payload.sessions.map((s) => ({
          visit: serializeSession(s.session), // Nota: Rust aún espera "visit" (pendiente actualizar)
          items: s.items,
        })),
      };

      const result = await invoke<{ patient_id: number; visit_id: number }>(
        "save_visit_with_sessions", // Nota: Comando Rust aún se llama así (pendiente actualizar)
        {
          patient: serializedPayload.patient,
          visit: serializedPayload.visit,
          sessions: serializedPayload.sessions,
        },
      );

      // Mapear respuesta de Rust a nombres nuevos
      return {
        patient_id: result.patient_id,
        session_id: result.visit_id, // Rust aún devuelve visit_id
      };
    } catch (error) {
      console.error("❌ Error en savePatientWithSessions:", error);
      throw error;
    }
  }

  /** @deprecated Use savePatientWithSessions instead */
  async saveVisitWithSessions(payload: {
    patient: Patient;
    session: Session;
    sessions: SessionWithItems[];
  }): Promise<{ patient_id: number; session_id: number }> {
    // Map old structure to new
    const newPayload = {
      patient: payload.patient,
      session: payload.session as Session,
      sessions: payload.sessions as SessionWithItems[],
    };
    const result = await this.savePatientWithSessions(newPayload);
    return { patient_id: result.patient_id, session_id: result.session_id };
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
    color: "success" | "info" | "warning" | "danger" | "default";
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
    updates: {
      label?: string;
      color?: "success" | "info" | "warning" | "danger" | "default";
    },
  ): Promise<void> {
    try {
      const current = await this.getDiagnosisOptions();
      const updated = current.map((opt) =>
        opt.id === id ? { ...opt, ...updates } : opt,
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

  async deleteSigner(id: number): Promise<void> {
    try {
      await invoke<void>("delete_signer", { id });
    } catch (error) {
      console.error("Error en deleteSigner:", error);
      throw error;
    }
  }

  // ============================================================================
  // PAYMENT METHOD OPERATIONS
  // ============================================================================

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      return await invoke<PaymentMethod[]>("get_payment_methods");
    } catch (error) {
      console.error("Error en getPaymentMethods:", error);
      throw error;
    }
  }

  async createPaymentMethod(name: string): Promise<number> {
    try {
      return await invoke<number>("create_payment_method", { name });
    } catch (error) {
      console.error("Error en createPaymentMethod:", error);
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
  // DOCTOR PROFILE OPERATIONS
  // ============================================================================

  async getDoctorProfile(): Promise<import("../types").DoctorProfile | null> {
    try {
      return await invoke<import("../types").DoctorProfile | null>(
        "get_doctor_profile",
      );
    } catch (error) {
      console.error("Error en getDoctorProfile:", error);
      throw error;
    }
  }

  async upsertDoctorProfile(
    profile: import("../types").DoctorProfile,
  ): Promise<number> {
    try {
      return await invoke<number>("upsert_doctor_profile", { profile });
    } catch (error) {
      console.error("Error en upsertDoctorProfile:", error);
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

  async getSettingsByCategory(
    category: string,
  ): Promise<Record<string, string>> {
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
    category: string = "general",
  ): Promise<void> {
    try {
      await invoke("save_setting", { key, value, category });
    } catch (error) {
      console.error("Error en setSetting:", error);
      throw error;
    }
  }

  async setSettings(
    settings: Record<string, { value: string; category?: string }>,
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
  // PAYMENT OPERATIONS
  // ============================================================================

  async getPaymentsByPatient(patientId: number): Promise<Payment[]> {
    try {
      return await invoke<Payment[]>("get_payments_by_patient", { patientId });
    } catch (error) {
      console.error("Error en getPaymentsByPatient:", error);
      throw error;
    }
  }

  async createPayment(payment: Payment): Promise<number> {
    try {
      return await invoke<number>("create_payment", { payment });
    } catch (error) {
      console.error("Error en createPayment:", error);
      throw error;
    }
  }

  async updatePayment(payment: Payment): Promise<void> {
    try {
      await invoke<void>("update_payment", { payment });
    } catch (error) {
      console.error("Error en updatePayment:", error);
      throw error;
    }
  }

  async deletePayment(paymentId: number): Promise<void> {
    try {
      await invoke<void>("delete_payment", { paymentId });
    } catch (error) {
      console.error("Error en deletePayment:", error);
      throw error;
    }
  }

  // ============================================================================
  // ATTACHMENT OPERATIONS
  // ============================================================================

  async getAttachmentsBySession(sessionId: number): Promise<import("../types").Attachment[]> {
    try {
      // First, get the patient_id from the session
      const sessionRows = await invoke<Array<{ patient_id: number }>>(
        "get_sessions_by_visit",
        { visitId: sessionId }
      );

      if (sessionRows.length === 0) {
        return [];
      }

      const patientId = sessionRows[0].patient_id;

      // Get all patient attachments and filter by this session
      const all = await this.getAttachmentsByPatient(patientId);
      return all.filter((a) => a.session_id === sessionId);
    } catch (error) {
      console.error("Error en getAttachmentsBySession:", error);
      throw error;
    }
  }

  /** @deprecated Use getAttachmentsBySession instead */
  async getAttachmentsByVisit(visitId: number) {
    return this.getAttachmentsBySession(visitId);
  }

  async getAttachmentsByPatient(patientId: number): Promise<import("../types").Attachment[]> {
    try {
      type RustAttachment = {
        id: number;
        patient_id: number;
        session_id: number | null;
        kind: string;
        filename: string;
        mime_type: string | null;
        size_bytes: number | null;
        storage_key: string;
        note: string | null;
        created_at: string | null;
      };

      const rustData = await invoke<RustAttachment[]>(
        "get_attachments_by_patient",
        { patientId },
      );

      // Transform Rust data to frontend format
      return rustData.map((a) => ({
        id: a.id,
        patient_id: a.patient_id,
        session_id: a.session_id,
        kind: a.kind,
        filename: a.filename,
        mime_type: a.mime_type,
        size_bytes: a.size_bytes,
        storage_key: a.storage_key,
        note: a.note,
        created_at: a.created_at,
      }));
    } catch (error) {
      console.error("Error en getAttachmentsByPatient:", error);
      throw error;
    }
  }

  async createAttachment(meta: {
    session_id: number | null;
    patient_id: number;
    filename: string;
    mime_type: string;
    bytes: number;
    storage_key: string;
  }): Promise<number> {
    try {
      return await invoke<number>("create_attachment", {
        patientId: meta.patient_id,
        sessionId: meta.session_id,
        filename: meta.filename,
        mimeType: meta.mime_type,
        bytes: meta.bytes,
        storageKey: meta.storage_key,
      });
    } catch (error) {
      console.error("Error en createAttachment:", error);
      throw error;
    }
  }

  async moveAttachmentToSession(
    attachmentId: number,
    sessionId: number | null,
  ) {
    console.warn(
      "moveAttachmentToSession: Not implemented in Rust backend yet",
    );
    throw new Error("moveAttachmentToSession not implemented yet");
  }

  /** @deprecated Use moveAttachmentToSession instead */
  async moveAttachmentToVisit(attachmentId: number, visitId: number | null) {
    return this.moveAttachmentToSession(attachmentId, visitId);
  }

  async deleteAttachment(attachmentId: number): Promise<void> {
    try {
      await invoke("delete_attachment", { attachmentId });
    } catch (error) {
      console.error("Error en deleteAttachment:", error);
      throw error;
    }
  }

  // ============================================================================
  // NEW: GRANULAR SAVE OPERATIONS
  // ============================================================================

  /**
   * Updates ONLY patient demographic data (no sessions created)
   * Use this when you only want to update patient info like phone, email, etc.
   */
  async updatePatientOnly(patient: Patient): Promise<void> {
    try {
      await invoke("update_patient_only", { patient });
    } catch (error) {
      console.error("Error en updatePatientOnly:", error);
      throw error;
    }
  }

  /**
   * Saves attachments WITHOUT creating a session (session_id = NULL)
   * Use this for standalone attachments not tied to a specific visit
   */
  async saveAttachmentsWithoutSession(
    patientId: number,
    attachments: Array<{
      filename: string;
      mime_type: string;
      bytes: number;
      storage_key: string;
    }>
  ): Promise<number[]> {
    try {
      return await invoke<number[]>("save_attachments_without_session", {
        patientId,
        attachments,
      });
    } catch (error) {
      console.error("Error en saveAttachmentsWithoutSession:", error);
      throw error;
    }
  }

  /**
   * Creates a "Diagnostic Update" session for odontogram changes WITHOUT financial data
   * This preserves snapshots by creating a new session instead of modifying existing ones
   */
  async createDiagnosticUpdateSession(
    patientId: number,
    toothDxJson: string | null,
    autoDxText: string | null,
    fullDxText: string | null
  ): Promise<{ session_id: number }> {
    try {
      return await invoke<{ session_id: number }>(
        "create_diagnostic_update_session",
        {
          patientId,
          toothDxJson,
          autoDxText,
          fullDxText,
        }
      );
    } catch (error) {
      console.error("Error en createDiagnosticUpdateSession:", error);
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS LEGACY/NO UTILIZADOS
  // ============================================================================

  async getSessionsByPatientPaged(
    patientId: number,
    limit: number = 10,
    offset: number = 0,
  ) {
    // Implementación simple usando getSessionsByPatientList
    const all = await this.getSessionsByPatientList(patientId);
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
      hasMore: offset + limit < all.length,
    };
  }

  /** @deprecated Use getSessionsByPatientPaged instead */
  async getVisitsByPatientPaged(
    patientId: number,
    limit: number = 10,
    offset: number = 0,
  ) {
    return this.getSessionsByPatientPaged(patientId, limit, offset);
  }

  async getSessionsByPatient(patientId: number): Promise<SessionWithItems[]> {
    try {
      // Rust devuelve { visit: Session, items: SessionItem[] }[]
      // Frontend espera { session: Session, items: SessionItem[] }[]
      type RustSessionRow = {
        visit: Session;
        items: import("../types").SessionItem[];
      };
      const rustData = await invoke<RustSessionRow[]>(
        "get_sessions_by_patient",
        { patientId },
      );

      // Transformar: visit -> session
      return rustData.map((row) => ({
        session: row.visit,
        items: row.items,
      }));
    } catch (error) {
      console.error("Error en getSessionsByPatient:", error);
      throw error;
    }
  }

  // Métodos legacy/futuros - no implementados aún
  async updateSigner(id: number, name: string): Promise<void> {
    console.warn("updateSigner: Not implemented in Rust backend yet");
    throw new Error("updateSigner not implemented yet");
  }

  async updateReasonType(id: number, name: string): Promise<void> {
    console.warn("updateReasonType: Not implemented in Rust backend yet");
    throw new Error("updateReasonType not implemented yet");
  }

  async deleteReasonType(id: number): Promise<void> {
    console.warn("deleteReasonType: Not implemented in Rust backend yet");
    throw new Error("deleteReasonType not implemented yet");
  }

  async deleteSetting(key: string): Promise<void> {
    console.warn("deleteSetting: Not implemented in Rust backend yet");
    throw new Error("deleteSetting not implemented yet");
  }

  async resetAllSettings(): Promise<void> {
    try {
      await invoke("reset_all_settings");
    } catch (error) {
      console.error("Error en resetAllSettings:", error);
      throw error;
    }
  }

  /**
   * FASE 2: Get pending payments summary (optimized report)
   * Single IPC call replaces N+1 query pattern in frontend
   * All calculations done in backend for performance
   */
  async getPendingPaymentsSummary(): Promise<
    import("../types").PatientDebtSummary[]
  > {
    try {
      return await invoke<import("../types").PatientDebtSummary[]>(
        "get_pending_payments_summary",
      );
    } catch (error) {
      console.error("Error en getPendingPaymentsSummary:", error);
      throw error;
    }
  }

  /**
   * Alias for getPendingPaymentsSummary for backward compatibility
   */
  async getPatientsWithDebt(): Promise<
    import("../types").PatientDebtSummary[]
  > {
    return this.getPendingPaymentsSummary();
  }

  /**
   * Repair debt_opened_at for patients with positive balance (one-time fix)
   * Finds patients with debt but no debt_opened_at and sets it
   * @returns Number of patients fixed
   */
  async repairDebtOpenedDates(): Promise<number> {
    try {
      return await invoke<number>("repair_debt_opened_dates");
    } catch (error) {
      console.error("Error repairing debt dates:", error);
      throw error;
    }
  }

  /**
   * Archive debt for a patient (marks patient.debt_archived = 1)
   * Archived debts are excluded from financial reports (TRIADA)
   * @param patientId - Patient ID
   */
  async archiveDebt(patientId: number): Promise<void> {
    try {
      await invoke("archive_debt", {
        patientId,
      });
    } catch (error) {
      console.error("Error archiving debt:", error);
      throw error;
    }
  }

  /**
   * Unarchive debt for a patient (marks patient.debt_archived = 0)
   * Reactivates patient debt in financial reports (TRIADA)
   * @param patientId - Patient ID
   */
  async unarchiveDebt(patientId: number): Promise<void> {
    try {
      await invoke("unarchive_debt", {
        patientId,
      });
    } catch (error) {
      console.error("Error unarchiving debt:", error);
      throw error;
    }
  }

  /**
   * Mark patient as contacted (updates TRIADA fields)
   * Sets last_contact_at to NOW and last_contact_type
   * @param patientId - Patient ID
   * @param contactType - Type of contact: 'whatsapp' | 'call' | 'email' | 'in_person'
   */
  async markPatientContacted(
    patientId: number,
    contactType: 'whatsapp' | 'call' | 'email' | 'in_person'
  ): Promise<void> {
    try {
      await invoke("mark_patient_contacted", {
        patientId,
        contactType,
      });
    } catch (error) {
      console.error("Error marking patient contacted:", error);
      throw error;
    }
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
