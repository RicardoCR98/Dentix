// src/hooks/usePatientRecord.ts
import { useCallback, useMemo, useState } from "react";
import type {
  AttachmentFile,
  Patient,
  Session,
  ToothDx,
  VisitWithProcedures,
  SessionWithItems,
} from "../lib/types";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { saveAttachmentFile } from "../lib/files/attachments";
import { useToast } from "./useToast";

// Initial states
const initialPatient: Patient = {
  full_name: "",
  doc_id: "",
  phone: "",
  date_of_birth: "",
  email: "",
  emergency_phone: "",
};

const initialSession: Session = {
  date: new Date().toISOString().slice(0, 10),
  reason_type: "Dolor",
  reason_detail: "",
  diagnosis_text: "",
  budget: 0,
  discount: 0,
  payment: 0,
  balance: 0,
  cumulative_balance: 0,
};

export function usePatientRecord() {
  const toast = useToast();

  // Core state
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [session, setSession] = useState<Session>(initialSession);
  const [toothDx, setToothDx] = useState<ToothDx>({});
  const [manualDiagnosis, setManualDiagnosis] = useState("");
  const [sessions, setSessions] = useState<VisitWithProcedures[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // NEW: Original state for change detection
  const [originalPatient, setOriginalPatient] = useState<Patient | null>(null);
  const [lastSavedToothDx, setLastSavedToothDx] = useState<ToothDx>({});

  // Computed diagnosis from teeth
  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(toothDx)
      .sort((a, b) => +a - +b)
      .map((n) =>
        toothDx[n]?.length ? `Diente ${n}: ${toothDx[n].join(", ")}` : "",
      )
      .filter(Boolean);
    return lines.join("\n");
  }, [toothDx]);

  // Full diagnosis (auto + manual)
  const fullDiagnosis = useMemo(() => {
    const parts: string[] = [];
    if (diagnosisFromTeeth) parts.push(diagnosisFromTeeth);
    if (manualDiagnosis.trim()) parts.push(manualDiagnosis.trim());
    return parts.join("\n\n");
  }, [diagnosisFromTeeth, manualDiagnosis]);

  // UI flags
  const hasPatientData = Boolean(patient.full_name && patient.doc_id);
  const hasAllergy = Boolean(patient.allergy_detail?.trim());

  // NEW: Change detection flags
  const hasPatientChanges = useMemo(() => {
    if (!originalPatient) return patient.id ? false : hasPatientData;

    const keys: (keyof Patient)[] = [
      'full_name', 'doc_id', 'phone', 'email',
      'emergency_phone', 'date_of_birth', 'anamnesis', 'allergy_detail'
    ];

    return keys.some(key => patient[key] !== originalPatient[key]);
  }, [patient, originalPatient, hasPatientData]);

  const hasOdontogramChanges = useMemo(() => {
    const currentJson = JSON.stringify(toothDx);
    const originalJson = JSON.stringify(lastSavedToothDx);
    return currentJson !== originalJson;
  }, [toothDx, lastSavedToothDx]);

  const hasNewAttachments = useMemo(() => {
    return attachments.some(a => a.file && !a.db_id);
  }, [attachments]);

  const hasDraftSessions = useMemo(() => {
    return sessions.some(s => !s.session.is_saved);
  }, [sessions]);

  // Final canSave flag: can save if there's patient data AND any changes
  const canSave = hasPatientData && (hasPatientChanges || hasOdontogramChanges || hasNewAttachments || hasDraftSessions);

  // Handler: Update tooth diagnosis
  const onToothDxChange = useCallback((next: ToothDx) => {
    setToothDx(next);
  }, []);

  // Handler: Create new patient record
  const handleNew = useCallback(() => {
    const draftSessions = sessions.filter((s) => !s.session.is_saved);
    const hasDrafts = draftSessions.length > 0;

    let confirmMessage =
      "¿Crear una nueva historia? Se perderán cambios no guardados.";
    if (hasDrafts) {
      confirmMessage = `⚠️ Tienes ${draftSessions.length} sesión(es) en BORRADOR sin guardar.\n\n¿Estás seguro de crear una nueva historia? Se perderán todos los borradores.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setPatient(initialPatient);
    setSession({
      ...initialSession,
      date: new Date().toISOString().slice(0, 10),
    });
    setToothDx({});
    setManualDiagnosis("");
    setSessions([]);
    setAttachments([]);

    // NEW: Reset original state
    setOriginalPatient(null);
    setLastSavedToothDx({});

    return true; // Return true to indicate success (for URL clearing in caller)
  }, [sessions]);

  // Handler: Save patient record (NEW: Granular Save)
  const handleSave = useCallback(async () => {
    if (!hasPatientData) {
      toast.warning(
        "Datos incompletos",
        "Completa al menos nombre y cédula del paciente para guardar.",
      );
      return;
    }

    try {
      const repo = await getRepository();

      // ============================================================
      // CASE 1: FULL SAVE (with draft sessions)
      // ============================================================
      if (hasDraftSessions) {
        const safeReasonType: Session["reason_type"] =
          session.reason_type ?? ("Otro" as Session["reason_type"]);

        const toothDxJson = Object.keys(toothDx).length
          ? JSON.stringify(toothDx)
          : undefined;

        const sessionPayload: Session = {
          id: session.id,
          patient_id: patient.id,
          date: session.date!,
          reason_type: safeReasonType,
          reason_detail: session.reason_detail ?? "",
          tooth_dx_json: toothDxJson,
          diagnosis_text: fullDiagnosis || undefined,
          auto_dx_text: diagnosisFromTeeth || undefined,
          full_dx_text: fullDiagnosis || undefined,
          budget: 0,
          discount: 0,
          payment: 0,
          balance: 0,
          cumulative_balance: 0,
          signer: undefined,
          clinical_notes: undefined,
          is_saved: undefined,
          created_at: undefined,
          updated_at: undefined,
        };

        // Save files to disk BEFORE database transaction
        const newAttachments = attachments.filter((a) => a.file);
        const attachmentMetadata: Array<{
          filename: string;
          mime_type: string;
          bytes: number;
          storage_key: string;
        }> = [];

        for (const a of newAttachments) {
          const { storage_key, bytes } = await saveAttachmentFile(
            a.file!,
            patient.id || 0,
            session.date,
          );
          attachmentMetadata.push({
            filename: a.name,
            mime_type: a.type || "application/octet-stream",
            bytes,
            storage_key,
          });
        }

        const draftSessions = sessions.filter((s) => !s.session.is_saved);
        const { patient_id, session_id } = await repo.saveVisitWithSessions({
          patient,
          session: sessionPayload,
          sessions: draftSessions,
        });

        // Save attachment metadata
        for (const meta of attachmentMetadata) {
          await repo.createAttachment({
            patient_id: patient_id,
            session_id: session_id,
            ...meta,
          });
        }

        // Update local state
        setPatient((prev) => ({ ...prev, id: patient_id }));
        setOriginalPatient((prev) => prev ? { ...prev, id: patient_id } : null);
        setSession((prev) => ({
          ...prev,
          id: session_id,
          patient_id: patient_id,
        }));

        // Mark saved sessions
        setSessions((prevSessions) =>
          prevSessions.map((s) => {
            if (!s.session.is_saved) {
              return {
                ...s,
                session: {
                  ...s.session,
                  is_saved: true,
                  id: session_id,
                  patient_id: patient_id,
                },
              };
            }
            return s;
          }),
        );

        // Mark attachments as saved
        setAttachments((prev) =>
          prev.map((att) => {
            if (att.file) {
              return {
                ...att,
                file: undefined,
                db_id: att.id ? parseInt(att.id) : undefined,
              };
            }
            return att;
          }),
        );

        toast.success(
          "Guardado exitoso",
          "La historia clínica se ha guardado correctamente",
        );

        return true;
      }

      // ============================================================
      // CASE 2: GRANULAR SAVE (no draft sessions)
      // ============================================================
      const hasAnyChanges = hasPatientChanges || hasOdontogramChanges || hasNewAttachments;

      if (!hasAnyChanges) {
        toast.info("Sin cambios", "No hay modificaciones para guardar");
        return false;
      }

      let savedCount = 0;

      // 2A. Save patient data if changed
      if (hasPatientChanges && patient.id) {
        await repo.updatePatientOnly(patient);
        setOriginalPatient({ ...patient });
        savedCount++;
      } else if (!patient.id && hasPatientData) {
        // New patient without ID - create it
        const newPatientId = await repo.upsertPatient(patient);
        setPatient((prev) => ({ ...prev, id: newPatientId }));
        setOriginalPatient({ ...patient, id: newPatientId });
        savedCount++;
      }

      // 2B. Save new attachments WITHOUT session
      if (hasNewAttachments && patient.id) {
        const newAttachments = attachments.filter((a) => a.file);
        const attachmentMetadata: Array<{
          filename: string;
          mime_type: string;
          bytes: number;
          storage_key: string;
        }> = [];

        // Save files to disk
        for (const a of newAttachments) {
          const { storage_key, bytes } = await saveAttachmentFile(
            a.file!,
            patient.id,
            new Date().toISOString().slice(0, 10),
          );
          attachmentMetadata.push({
            filename: a.name,
            mime_type: a.type || "application/octet-stream",
            bytes,
            storage_key,
          });
        }

        // Save metadata with session_id = NULL
        const attachmentIds = await repo.saveAttachmentsWithoutSession(
          patient.id,
          attachmentMetadata
        );

        // Update local state
        setAttachments((prev) =>
          prev.map((att, idx) => {
            if (att.file) {
              return {
                ...att,
                file: undefined,
                db_id: attachmentIds[idx],
              };
            }
            return att;
          }),
        );

        savedCount++;
      }

      // 2C. Save odontogram as "Diagnostic Update" session
      if (hasOdontogramChanges && patient.id) {
        const toothDxJson = Object.keys(toothDx).length
          ? JSON.stringify(toothDx)
          : null;

        const { session_id } = await repo.createDiagnosticUpdateSession(
          patient.id,
          toothDxJson,
          diagnosisFromTeeth || null,
          fullDiagnosis || null
        );

        setSession((prev) => ({ ...prev, id: session_id }));
        setLastSavedToothDx({ ...toothDx });

        savedCount++;
      }

      if (savedCount > 0) {
        toast.success(
          "Guardado exitoso",
          `Se guardaron ${savedCount} cambio(s) correctamente`,
        );
        return true;
      }

      return false;
    } catch (e) {
      console.error("Error al guardar:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error(
        "Error al guardar",
        `No se pudo guardar: ${errorMessage}`,
      );
      return false;
    }
  }, [
    toast,
    patient,
    session,
    toothDx,
    sessions,
    fullDiagnosis,
    diagnosisFromTeeth,
    attachments,
    hasPatientData,
    hasPatientChanges,
    hasOdontogramChanges,
    hasNewAttachments,
    hasDraftSessions,
  ]);

  // Handler: Delete attachment
  const handleDeleteAttachment = useCallback(async (file: AttachmentFile) => {
    if (!file.db_id) return;

    try {
      const repo = await getRepository();
      await repo.deleteAttachment(file.db_id);
    } catch (e) {
      console.error("Error al eliminar attachment:", e);
      throw e;
    }
  }, []);

  // Handler: Select patient
  const handleSelectPatient = useCallback(async (selectedPatient: Patient) => {
    if (!selectedPatient?.id) return;

    try {
      const repo = await getRepository();

      const p = await repo.findPatientById(selectedPatient.id);
      if (!p) return;
      setPatient(p);

      // NEW: Save original patient state for change detection
      setOriginalPatient(p);

      const list = await repo.getVisitsByPatient(p.id!);
      const today = new Date().toISOString().slice(0, 10);

      if (list.length > 0) {
        const last = list[0];
        const lastToothDx = last.tooth_dx_json
          ? (JSON.parse(last.tooth_dx_json) as ToothDx)
          : {};

        setSession({
          date: today,
          reason_type: undefined,
          reason_detail: "",
          diagnosis_text: "",
          tooth_dx_json: last.tooth_dx_json || "",
          budget: 0,
          discount: 0,
          payment: 0,
          balance: 0,
          cumulative_balance: 0,
        });

        setToothDx(lastToothDx);

        // NEW: Save original odontogram state for change detection
        setLastSavedToothDx(lastToothDx);
      } else {
        setSession({ ...initialSession, date: today });
        setToothDx({});

        // NEW: Reset original odontogram state (no previous visits)
        setLastSavedToothDx({});
      }

      // Load sessions and attachments in parallel
      const [allSess, savedAttachments] = await Promise.all([
        repo.getSessionsByPatient(p.id!),
        repo.getAttachmentsByPatient(p.id!),
      ]);

      setSessions(allSess);

      const attachmentFiles: AttachmentFile[] = savedAttachments.map((att) => ({
        id: `saved-${att.id}`,
        name: att.filename,
        size: att.size_bytes || 0,
        type: att.mime_type || "",
        url: "",
        uploadDate: att.created_at || "",
        storage_key: att.storage_key,
        db_id: att.id,
      }));
      setAttachments(attachmentFiles);

      return true; // Return true to indicate successful selection
    } catch (e) {
      console.error("Error al seleccionar paciente:", e);
      alert("Error al cargar los datos del paciente");
      return false;
    }
  }, []);

  // Handler: Quick payment
  const handleQuickPayment = useCallback(
    async (payment: {
      date: string;
      amount: number;
      payment_method_id?: number;
      payment_notes?: string;
    }) => {
      if (!patient.id) {
        toast.warning("Sin paciente", "Selecciona un paciente primero");
        return;
      }

      try {
        const repo = await getRepository();

        const session: Session = {
          date: payment.date,
          reason_type: "Abono a cuenta",
          reason_detail: payment.payment_notes || "Abono rápido a cuenta",
          budget: 0,
          discount: 0,
          payment: payment.amount,
          balance: -payment.amount,
          cumulative_balance: 0,
          payment_method_id: payment.payment_method_id,
          payment_notes: payment.payment_notes,
        };

        const sessionWithItems: SessionWithItems = {
          session: session,
          items: [],
        };

        await repo.saveVisitWithSessions({
          patient,
          session: session,
          sessions: [sessionWithItems],
        });

        // Reload patient sessions
        const updatedSessions = await repo.getSessionsByPatient(patient.id);
        setSessions(updatedSessions);

        toast.success(
          "Abono registrado",
          "El abono se ha guardado correctamente",
        );
        return true;
      } catch (e) {
        console.error("Error al guardar abono:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        toast.error(
          "Error al guardar",
          `No se pudo guardar el abono: ${errorMessage}`,
        );
        return false;
      }
    },
    [patient, toast],
  );

  return {
    // State
    patient,
    setPatient,
    session,
    setSession,
    toothDx,
    setToothDx,
    manualDiagnosis,
    setManualDiagnosis,
    sessions,
    setSessions,
    attachments,
    setAttachments,

    // Computed
    diagnosisFromTeeth,
    fullDiagnosis,
    hasPatientData,
    canSave,
    hasAllergy,

    // NEW: Change detection flags
    hasPatientChanges,
    hasOdontogramChanges,
    hasNewAttachments,
    hasDraftSessions,

    // Handlers
    onToothDxChange,
    handleNew,
    handleSave,
    handleDeleteAttachment,
    handleSelectPatient,
    handleQuickPayment,
  };
}
