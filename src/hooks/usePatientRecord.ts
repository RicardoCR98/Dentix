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

  // NEW: Per-session odontogram state (Map-based)
  const [sessionOdontograms, setSessionOdontograms] = useState<Map<number, ToothDx>>(new Map());
  const [currentToothDx, setCurrentToothDx] = useState<ToothDx>({}); // Derived from active session
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const [manualDiagnosis, setManualDiagnosis] = useState("");
  const [sessions, setSessions] = useState<VisitWithProcedures[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // NEW: Original state for change detection
  const [originalPatient, setOriginalPatient] = useState<Patient | null>(null);
  const [originalSessionOdontograms, setOriginalSessionOdontograms] = useState<Map<number, ToothDx>>(new Map());

  // Computed diagnosis from teeth (based on active session's odontogram)
  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(currentToothDx)
      .sort((a, b) => +a - +b)
      .map((n) =>
        currentToothDx[n]?.length ? `Diente ${n}: ${currentToothDx[n].join(", ")}` : "",
      )
      .filter(Boolean);
    return lines.join("\n");
  }, [currentToothDx]);

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
    if (!activeSessionId) return false;

    const current = JSON.stringify(sessionOdontograms.get(activeSessionId) || {});
    const original = JSON.stringify(originalSessionOdontograms.get(activeSessionId) || {});
    return current !== original;
  }, [activeSessionId, sessionOdontograms, originalSessionOdontograms]);

  const hasNewAttachments = useMemo(() => {
    return attachments.some(a => a.file && !a.db_id);
  }, [attachments]);

  const hasDraftSessions = useMemo(() => {
    return sessions.some(s => !s.session.is_saved);
  }, [sessions]);

  // Final canSave flag:
  // - New patients (no id): require at least one draft session (business rule: no patient without a session).
  // - Existing patients: allow saving any change (patient data, odontogram, attachments, or sessions).
  const hasExistingPatient = Boolean(patient.id);
  const canSave =
    hasPatientData &&
    (hasExistingPatient
      ? hasDraftSessions ||
        hasOdontogramChanges ||
        hasNewAttachments ||
        hasPatientChanges
      : hasDraftSessions);

  // Handler: Update tooth diagnosis (per-session)
  const onToothDxChange = useCallback((next: ToothDx) => {
    if (!activeSessionId) {
      const newSessionId = -Date.now();
      const today = new Date().toISOString().slice(0, 10);

      const newSession: VisitWithProcedures = {
        session: {
          id: newSessionId,
          date: today,
          reason_type: "Control",
          reason_detail: "Actualizacion de diagnostico",
          budget: 0,
          discount: 0,
          payment: 0,
          balance: 0,
          cumulative_balance: 0,
          is_saved: false,
        },
        items: [],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSessionId);
      setSession((prev) => ({
        ...prev,
        id: newSessionId,
        date: today,
        reason_type: "Control",
        reason_detail: "Actualizacion de diagnostico",
        budget: 0,
        discount: 0,
        payment: 0,
        balance: 0,
        cumulative_balance: 0,
        is_saved: false,
      }));

      setSessionOdontograms((prev) => {
        const updated = new Map(prev);
        updated.set(newSessionId, next);
        return updated;
      });
      setCurrentToothDx(next);
      toast.info(
        "Nueva sesion creada",
        "Se creo una sesion automaticamente para este diagnostico",
      );
      return;
    }

    setSessionOdontograms(prev => {
      const updated = new Map(prev);
      updated.set(activeSessionId, next);
      return updated;
    });
    setCurrentToothDx(next);
  }, [activeSessionId, toast]);

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

    // NEW: Reset per-session odontogram state
    setSessionOdontograms(new Map());
    setCurrentToothDx({});
    setActiveSessionId(null);

    setManualDiagnosis("");
    setSessions([]);
    setAttachments([]);

    // NEW: Reset original state
    setOriginalPatient(null);
    setOriginalSessionOdontograms(new Map());

    return true; // Return true to indicate success (for URL clearing in caller)
  }, [sessions]);

  // Handler: Save patient record (NEW: Granular Save)
  const handleSave = useCallback(async () => {
    if (!hasPatientData) {
      toast.warning(
        "Datos incompletos",
        "Completa al menos nombre y cédula del paciente para guardar.",
      );
      return false;
    }

    const hasAllowedChanges = hasExistingPatient
      ? hasDraftSessions || hasOdontogramChanges || hasNewAttachments || hasPatientChanges
      : hasDraftSessions;

    if (!hasAllowedChanges) {
      toast.info(
        "Sin cambios válidos",
        hasExistingPatient
          ? "Agrega sesiones, odontograma, adjuntos o modifica datos antes de guardar."
          : "Agrega al menos una sesión para guardar un paciente nuevo.",
      );
      return false;
    }

    try {
      const repo = await getRepository();

      // ============================================================
      // CASE 1: FULL SAVE (with draft sessions)
      // ============================================================
      if (hasDraftSessions) {
        const safeReasonType: Session["reason_type"] =
          session.reason_type ?? ("Otro" as Session["reason_type"]);

        // NOTE: sessionPayload is legacy - we now save per-session odontogram
        // Keep this for backward compatibility with saveVisitWithSessions
        const toothDxJson = activeSessionId && sessionOdontograms.get(activeSessionId)
          ? JSON.stringify(sessionOdontograms.get(activeSessionId))
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

        // Prepare draft sessions with their respective odontograms
        const draftSessions = sessions
          .filter((s) => !s.session.is_saved)
          .map((s) => {
            const sessionId = s.session.id!;
            const sessionOdonto = sessionOdontograms.get(sessionId);
            const toothDxJsonForSession = sessionOdonto && Object.keys(sessionOdonto).length > 0
              ? JSON.stringify(sessionOdonto)
              : undefined;

            return {
              ...s,
              session: {
                ...s.session,
                tooth_dx_json: toothDxJsonForSession,
              },
            };
          });

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
        setOriginalPatient({ ...patient, id: patient_id });
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

        // Snapshot saved odontograms
        setOriginalSessionOdontograms(new Map(sessionOdontograms));

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
      if (hasOdontogramChanges && patient.id && activeSessionId) {
        const activeOdonto = sessionOdontograms.get(activeSessionId);
        const toothDxJson = activeOdonto && Object.keys(activeOdonto).length > 0
          ? JSON.stringify(activeOdonto)
          : null;

        const { session_id } = await repo.createDiagnosticUpdateSession(
          patient.id,
          toothDxJson,
          diagnosisFromTeeth || null,
          fullDiagnosis || null
        );

        setSession((prev) => ({ ...prev, id: session_id }));

        // Snapshot saved odontogram for active session
        if (activeOdonto) {
          setOriginalSessionOdontograms(prev => {
            const updated = new Map(prev);
            updated.set(activeSessionId, { ...activeOdonto });
            return updated;
          });
        }

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
    sessions,
    fullDiagnosis,
    diagnosisFromTeeth,
    attachments,
    hasPatientData,
    hasPatientChanges,
    hasOdontogramChanges,
    hasNewAttachments,
    hasDraftSessions,
    activeSessionId,
    sessionOdontograms,
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

      // Load sessions and attachments in parallel
      const [allSess, savedAttachments] = await Promise.all([
        repo.getSessionsByPatient(p.id!),
        repo.getAttachmentsByPatient(p.id!),
      ]);

      setSessions(allSess);

      // NEW: Load odontograms for ALL sessions into Map
      const odontogramMap = new Map<number, ToothDx>();
      allSess.forEach((s) => {
        if (s.session.id && s.session.tooth_dx_json) {
          try {
            const parsed = JSON.parse(s.session.tooth_dx_json) as ToothDx;
            odontogramMap.set(s.session.id, parsed);
          } catch (e) {
            console.warn(`Failed to parse tooth_dx_json for session ${s.session.id}:`, e);
            odontogramMap.set(s.session.id, {});
          }
        } else if (s.session.id) {
          odontogramMap.set(s.session.id, {});
        }
      });
      setSessionOdontograms(odontogramMap);
      setOriginalSessionOdontograms(new Map(odontogramMap)); // Snapshot for change detection

      // NEW: Auto-select active session
      // Priority 1: Most recent draft
      const drafts = allSess.filter((s) => !s.session.is_saved);
      let selectedSession: SessionWithItems | null = null;

      if (drafts.length > 0) {
        selectedSession = drafts.reduce((prev, curr) =>
          (curr.session.date || '') > (prev.session.date || '') ? curr : prev
        );
      } else {
        // Priority 2: Most recent saved
        const saved = allSess.filter((s) => s.session.is_saved);
        if (saved.length > 0) {
          selectedSession = saved.reduce((prev, curr) =>
            (curr.session.date || '') > (prev.session.date || '') ? curr : prev
          );
        }
      }

      if (selectedSession && selectedSession.session.id) {
        setActiveSessionId(selectedSession.session.id);
        const selectedOdonto = odontogramMap.get(selectedSession.session.id) || {};
        setCurrentToothDx(selectedOdonto);

        setSession({
          date: new Date().toISOString().slice(0, 10),
          reason_type: selectedSession.session.reason_type,
          reason_detail: selectedSession.session.reason_detail || "",
          diagnosis_text: selectedSession.session.diagnosis_text || "",
          tooth_dx_json: selectedSession.session.tooth_dx_json || "",
          budget: 0,
          discount: 0,
          payment: 0,
          balance: 0,
          cumulative_balance: 0,
        });
      } else {
        // No sessions exist
        setActiveSessionId(null);
        setCurrentToothDx({});
        setSession({
          ...initialSession,
          date: new Date().toISOString().slice(0, 10),
        });
      }

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

  // Handler: Switch active session
  const handleSessionChange = useCallback((newSessionId: number | null) => {
    // Check for unsaved changes
    if (activeSessionId && hasOdontogramChanges) {
      if (!confirm('Hay cambios sin guardar en el odontograma de esta sesión. ¿Cambiar de sesión sin guardar?')) {
        return false;
      }
    }

    setActiveSessionId(newSessionId);

    // Load odontogram for new session
    if (newSessionId) {
      const sessionOdonto = sessionOdontograms.get(newSessionId) || {};
      setCurrentToothDx(sessionOdonto);
    } else {
      setCurrentToothDx({});
    }

    return true;
  }, [activeSessionId, hasOdontogramChanges, sessionOdontograms]);

  return {
    // State
    patient,
    setPatient,
    session,
    setSession,
    currentToothDx, // NEW: Replaces toothDx (per-session odontogram)
    setToothDx: onToothDxChange, // Keep old name for backward compatibility
    manualDiagnosis,
    setManualDiagnosis,
    sessions,
    setSessions,
    attachments,
    setAttachments,
    activeSessionId, // NEW: Currently active session ID
    setActiveSessionId, // NEW: Direct state setter (use handleSessionChange instead)

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
    handleSessionChange, // NEW: Switch active session
  };
}
