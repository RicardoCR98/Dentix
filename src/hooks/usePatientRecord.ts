// src/hooks/usePatientRecord.ts
import { useCallback, useMemo, useState, useEffect } from "react";
import type {
  AttachmentFile,
  Patient,
  Session,
  SessionItem,
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

const normalizeString = (value?: string | null) => value?.trim() ?? "";

const normalizeNumber = (value?: number | null) => Number(value ?? 0);

const normalizeBoolean = (value?: boolean | null) => Boolean(value);

const serializeSessionForCompare = (row: SessionWithItems) =>
  JSON.stringify({
    session: {
      date: row.session.date || "",
      reason_type: normalizeString(row.session.reason_type),
      reason_detail: normalizeString(row.session.reason_detail),
      signer: normalizeString(row.session.signer),
      clinical_notes: normalizeString(row.session.clinical_notes),
      budget: normalizeNumber(row.session.budget),
      discount: normalizeNumber(row.session.discount),
      payment: normalizeNumber(row.session.payment),
      payment_method_id: row.session.payment_method_id ?? null,
      payment_notes: normalizeString(row.session.payment_notes),
    },
    items: row.items.map((item) => ({
      name: normalizeString(item.name),
      unit_price: normalizeNumber(item.unit_price),
      quantity: normalizeNumber(item.quantity),
      is_active: normalizeBoolean(item.is_active),
      tooth_number: normalizeString(item.tooth_number),
      procedure_notes: normalizeString(item.procedure_notes),
      procedure_template_id: item.procedure_template_id ?? null,
    })),
  });

const normalizeSavedFlag = (session: Session) => {
  if (session.is_saved === undefined || session.is_saved === null) {
    return Boolean(session.id);
  }
  if (session.is_saved === false && (session.id ?? 0) > 0) {
    return true;
  }
  return session.is_saved;
};

const normalizeFetchedSessions = (rows: SessionWithItems[]) =>
  rows.map((row) => ({
    ...row,
    session: {
      ...row.session,
      is_saved: normalizeSavedFlag(row.session),
    },
  }));

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
  const [originalManualDiagnosis, setOriginalManualDiagnosis] = useState("");
  const [originalSessionOdontograms, setOriginalSessionOdontograms] = useState<Map<number, ToothDx>>(new Map());
  const [originalDraftSessions, setOriginalDraftSessions] = useState<Map<number, string>>(new Map());

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

  const hasManualDiagnosisChanges = useMemo(
    () => normalizeString(manualDiagnosis) !== normalizeString(originalManualDiagnosis),
    [manualDiagnosis, originalManualDiagnosis],
  );

  const hasToothDxChanges = useMemo(() => {
    if (!activeSessionId) return false;

    const current = JSON.stringify(sessionOdontograms.get(activeSessionId) || {});
    const original = JSON.stringify(originalSessionOdontograms.get(activeSessionId) || {});
    return current !== original;
  }, [activeSessionId, sessionOdontograms, originalSessionOdontograms]);

  const hasOdontogramChanges = hasToothDxChanges || hasManualDiagnosisChanges;

  const hasNewAttachments = useMemo(() => {
    return attachments.some(a => a.file && !a.db_id);
  }, [attachments]);

  const draftSessionChanges = useMemo(() => {
    return sessions.filter((s) => {
      if (s.session.is_saved || !s.session.id) return false;
      const baseline = originalDraftSessions.get(s.session.id);
      if (!baseline) return false;
      return serializeSessionForCompare(s) !== baseline;
    });
  }, [sessions, originalDraftSessions]);

  const draftSessionChangesCount = draftSessionChanges.length;
  const hasDraftSessionChanges = draftSessionChangesCount > 0;

  useEffect(() => {
    setOriginalDraftSessions((prev) => {
      let changed = false;
      const next = new Map(prev);
      const draftIds = new Set<number>();

      for (const s of sessions) {
        if (s.session.is_saved || !s.session.id) continue;
        const id = s.session.id;
        draftIds.add(id);
        if (!next.has(id)) {
          next.set(id, serializeSessionForCompare(s));
          changed = true;
        }
      }

      for (const id of next.keys()) {
        if (!draftIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [sessions]);

  // Final canSave flag:
  // - New patients (no id): require session edits or odontogram changes.
  // - Existing patients: allow saving any change (patient data, odontogram, attachments, or sessions).
  const hasExistingPatient = Boolean(patient.id);
  const canSave =
    hasPatientData &&
    (hasExistingPatient
      ? hasDraftSessionChanges ||
        hasOdontogramChanges ||
        hasNewAttachments ||
        hasPatientChanges
      : hasDraftSessionChanges || hasOdontogramChanges);

  // Handler: Update tooth diagnosis (per-session)
  const onToothDxChange = useCallback(
    (next: ToothDx, sessionIdOverride?: number | null) => {
      const targetSessionId = sessionIdOverride ?? activeSessionId;
      if (!targetSessionId) {
        console.warn('onToothDxChange called without active session');
        return;
      }

      setSessionOdontograms((prev) => {
        const updated = new Map(prev);
        updated.set(targetSessionId, next);
        return updated;
      });
      setCurrentToothDx(next);
    },
    [activeSessionId],
  );

  type DraftSessionOptions = {
    reasonType?: string;
    reasonDetail?: string;
    copyLatestOdontogram?: boolean;
  };

  const createDraftSession = useCallback((
    items: SessionItem[],
    options?: DraftSessionOptions,
  ) => {
    const newSessionId = -Date.now();
    const today = new Date().toISOString().slice(0, 10);

    const savedSessions = sessions.filter(
      (s) => s.session.is_saved && s.session.id,
    );

    let latestSaved: SessionWithItems | null = null;
    for (const candidate of savedSessions) {
      if (!latestSaved) {
        latestSaved = candidate;
        continue;
      }

      const latestDate = latestSaved.session.date || "";
      const candidateDate = candidate.session.date || "";

      if (candidateDate > latestDate) {
        latestSaved = candidate;
      } else if (
        candidateDate === latestDate &&
        (candidate.session.id || 0) > (latestSaved.session.id || 0)
      ) {
        latestSaved = candidate;
      }
    }

    const shouldCopyOdontogram = options?.copyLatestOdontogram !== false;
    const latestSavedId = latestSaved?.session.id;
    const latestOdontogram =
      shouldCopyOdontogram && latestSavedId
        ? originalSessionOdontograms.get(latestSavedId) ??
          sessionOdontograms.get(latestSavedId)
        : undefined;
    const nextOdontogram: ToothDx = {};

    if (latestOdontogram) {
      for (const [tooth, diagnoses] of Object.entries(latestOdontogram)) {
        nextOdontogram[tooth] = [...diagnoses];
      }
    }

    const newSession: SessionWithItems = {
      session: {
        id: newSessionId,
        date: today,
        reason_type: options?.reasonType,
        reason_detail: options?.reasonDetail,
        budget: 0,
        discount: 0,
        payment: 0,
        balance: 0,
        cumulative_balance: 0,
        signer: "",
        clinical_notes: "",
        is_saved: false,
      },
      items,
    };

    setSessions((prev) => [newSession, ...prev]);
    setSessionOdontograms((prev) => {
      const updated = new Map(prev);
      updated.set(newSessionId, nextOdontogram);
      return updated;
    });
    setOriginalSessionOdontograms((prev) => {
      const updated = new Map(prev);
      updated.set(newSessionId, nextOdontogram);
      return updated;
    });
    setOriginalDraftSessions((prev) => {
      const updated = new Map(prev);
      updated.set(newSessionId, serializeSessionForCompare(newSession));
      return updated;
    });
    setCurrentToothDx(nextOdontogram);
    setActiveSessionId(newSessionId);

    return newSessionId;
  }, [sessions, sessionOdontograms, originalSessionOdontograms]);

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
    setOriginalManualDiagnosis("");
    setOriginalSessionOdontograms(new Map());
    setOriginalDraftSessions(new Map());

    return true; // Return true to indicate success (for URL clearing in caller)
  }, [sessions]);

  // Handler: Save patient record (NEW: Granular Save)
  const handleSave = useCallback(async () => {
    if (!hasPatientData) {
      toast.warning(
        "Datos incompletos",
        "Completa al menos nombre y cedula del paciente para guardar.",
      );
      return false;
    }

    const hasAllowedChanges = hasExistingPatient
      ? hasDraftSessionChanges || hasOdontogramChanges || hasNewAttachments || hasPatientChanges
      : hasDraftSessionChanges || hasOdontogramChanges;

    if (!hasAllowedChanges) {
      toast.info(
        "Sin cambios",
        hasExistingPatient
          ? "No hay cambios para guardar."
          : "Agrega al menos una sesion o un odontograma para guardar un paciente nuevo.",
      );
      return false;
    }

    try {
      const repo = await getRepository();

      // ============================================================
      // CASE 1: FULL SAVE (with draft sessions)
      // ============================================================
      if (hasDraftSessionChanges) {
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
        const sessionAttachmentFiles = newAttachments.filter((a) => a.session_id != null);
        const generalAttachmentFiles = newAttachments.filter((a) => a.session_id == null);
        const sessionAttachmentMeta: Array<{
          tempId: string;
          session_id: number | null;
          filename: string;
          mime_type: string;
          bytes: number;
          storage_key: string;
        }> = [];
        const generalAttachmentMeta: Array<{
          tempId: string;
          filename: string;
          mime_type: string;
          bytes: number;
          storage_key: string;
        }> = [];

        for (const a of sessionAttachmentFiles) {
          const { storage_key, bytes } = await saveAttachmentFile(
            a.file!,
            patient.id || 0,
            session.date,
          );
          sessionAttachmentMeta.push({
            tempId: a.id,
            session_id: a.session_id ?? null,
            filename: a.name,
            mime_type: a.type || "application/octet-stream",
            bytes,
            storage_key,
          });
        }

        for (const a of generalAttachmentFiles) {
          const { storage_key, bytes } = await saveAttachmentFile(
            a.file!,
            patient.id || 0,
            session.date,
          );
          generalAttachmentMeta.push({
            tempId: a.id,
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

        const savedAttachmentIds = new Map<string, number>();

        for (const meta of sessionAttachmentMeta) {
          const attachmentId = await repo.createAttachment({
            patient_id: patient_id,
            session_id: meta.session_id,
            filename: meta.filename,
            mime_type: meta.mime_type,
            bytes: meta.bytes,
            storage_key: meta.storage_key,
          });
          savedAttachmentIds.set(meta.tempId, attachmentId);
        }

        if (generalAttachmentMeta.length > 0) {
          const attachmentIds = await repo.saveAttachmentsWithoutSession(
            patient_id,
            generalAttachmentMeta.map(({ tempId, ...meta }) => meta)
          );
          toast.info(
            "Adjuntos guardados (sin sesion)",
            "Se guardaron adjuntos generales del paciente.",
          );
          attachmentIds.forEach((id, idx) => {
            const tempId = generalAttachmentMeta[idx]?.tempId;
            if (tempId) savedAttachmentIds.set(tempId, id);
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
        if (savedAttachmentIds.size > 0) {
          setAttachments((prev) =>
            prev.map((att) => {
              if (!att.file) return att;
              const savedId = savedAttachmentIds.get(att.id);
              if (!savedId) return att;
              return {
                ...att,
                file: undefined,
                db_id: savedId,
                isRecent: true,
              };
            }),
          );
        }

        toast.success(
          "Guardado exitoso",
          "La historia clinica se ha guardado correctamente",
        );

        // Snapshot saved odontograms
        setOriginalSessionOdontograms(new Map(sessionOdontograms));
        setOriginalManualDiagnosis(manualDiagnosis);

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
      let patientId = patient.id ?? null;

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
        patientId = newPatientId;
        savedCount++;
      }

      // 2B. Save new attachments (session-specific or general)
      if (hasNewAttachments && patientId != null) {
        const newAttachments = attachments.filter((a) => a.file);
        const withSession = newAttachments.filter((a) => a.session_id != null);
        const withoutSession = newAttachments.filter((a) => a.session_id == null);
        const savedIds = new Map<string, number>();

        for (const a of withSession) {
          const { storage_key, bytes } = await saveAttachmentFile(
            a.file!,
            patientId,
            new Date().toISOString().slice(0, 10),
          );
          const attachmentId = await repo.createAttachment({
            patient_id: patientId,
            session_id: a.session_id ?? null,
            filename: a.name,
            mime_type: a.type || "application/octet-stream",
            bytes,
            storage_key,
          });
          savedIds.set(a.id, attachmentId);
        }

        if (withoutSession.length > 0) {
          const attachmentMetadata: Array<{
            filename: string;
            mime_type: string;
            bytes: number;
            storage_key: string;
          }> = [];
          const generalIds: string[] = [];

          for (const a of withoutSession) {
            const { storage_key, bytes } = await saveAttachmentFile(
              a.file!,
              patientId,
              new Date().toISOString().slice(0, 10),
            );
            attachmentMetadata.push({
              filename: a.name,
              mime_type: a.type || "application/octet-stream",
              bytes,
              storage_key,
            });
            generalIds.push(a.id);
          }

          const attachmentIds = await repo.saveAttachmentsWithoutSession(
            patientId,
            attachmentMetadata
          );
          toast.info(
            "Adjuntos guardados (sin sesion)",
            "Se guardaron adjuntos generales del paciente.",
          );

          attachmentIds.forEach((id, idx) => {
            const tempId = generalIds[idx];
            if (tempId) savedIds.set(tempId, id);
          });
        }

        if (savedIds.size > 0) {
          setAttachments((prev) =>
            prev.map((att) => {
              if (att.file) {
                const savedId = savedIds.get(att.id);
                if (!savedId) {
                  return att;
                }
                return {
                  ...att,
                  file: undefined,
                  db_id: savedId,
                  isRecent: true,
                };
              }
              return att;
            }),
          );
          savedCount++;
        }
      }

      // 2C. Save odontogram as "Diagnostic Update" session
      if (hasOdontogramChanges && patientId != null && activeSessionId) {
        const activeOdonto = sessionOdontograms.get(activeSessionId);
        const toothDxJson = activeOdonto && Object.keys(activeOdonto).length > 0
          ? JSON.stringify(activeOdonto)
          : null;
        const activeSession = sessions.find(
          (s) => s.session.id === activeSessionId,
        );
        const isActiveDraft = activeSession
          ? !activeSession.session.is_saved
          : activeSessionId < 0;

        const { session_id } = await repo.createDiagnosticUpdateSession(
          patientId,
          toothDxJson,
          diagnosisFromTeeth || null,
          fullDiagnosis || null
        );

        setSession((prev) => ({ ...prev, id: session_id }));
        setActiveSessionId(session_id);

        const sessionDate = new Date().toISOString().slice(0, 10);
        setSessions((prev) => {
          const next = [...prev];
          if (isActiveDraft) {
            const idx = next.findIndex((s) => s.session.id === activeSessionId);
            if (idx >= 0) {
              const existing = next[idx];
              next[idx] = {
                ...existing,
                session: {
                  ...existing.session,
                  id: session_id,
                  patient_id: patientId,
                  reason_type: existing.session.reason_type || "Otro",
                  reason_detail:
                    existing.session.reason_detail || "Sistema: Odontograma",
                  date: existing.session.date || sessionDate,
                  is_saved: true,
                },
              };
              return next;
            }
          }

          const newSession: SessionWithItems = {
            session: {
              id: session_id,
              patient_id: patientId,
              date: sessionDate,
              reason_type: "Otro",
              reason_detail: "Sistema: Odontograma",
              budget: 0,
              discount: 0,
              payment: 0,
              balance: 0,
              cumulative_balance: 0,
              is_saved: true,
            },
            items: [],
          };
          return [newSession, ...next];
        });

        setSessionOdontograms((prev) => {
          const next = new Map(prev);
          if (activeOdonto) {
            next.set(session_id, activeOdonto);
            if (isActiveDraft && activeSessionId !== session_id) {
              next.delete(activeSessionId);
            }
          }
          return next;
        });

        // Snapshot saved odontogram for active session
        if (activeOdonto) {
          setOriginalSessionOdontograms(prev => {
            const updated = new Map(prev);
            updated.set(session_id, { ...activeOdonto });
            if (isActiveDraft && activeSessionId !== session_id) {
              updated.delete(activeSessionId);
            }
            return updated;
          });
        }
        setOriginalManualDiagnosis(manualDiagnosis);

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
    hasDraftSessionChanges,
    activeSessionId,
    sessionOdontograms,
    manualDiagnosis,
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
      const [allSessRaw, savedAttachments] = await Promise.all([
        repo.getSessionsByPatient(p.id!),
        repo.getAttachmentsByPatient(p.id!),
      ]);

      const allSess = normalizeFetchedSessions(allSessRaw);
      setSessions(allSess);
      setManualDiagnosis("");
      setOriginalManualDiagnosis("");
      setOriginalDraftSessions(
        new Map(
          allSess
            .filter((s) => s.session.is_saved === false && s.session.id)
            .map((s) => [s.session.id as number, serializeSessionForCompare(s)]),
        ),
      );

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
      const drafts = allSess.filter((s) => s.session.is_saved === false);
      let selectedSession: SessionWithItems | null = null;

      if (drafts.length > 0) {
        selectedSession = drafts.reduce((prev, curr) =>
          (curr.session.date || "") > (prev.session.date || "") ? curr : prev
        );
      } else {
        // Priority 2: Most recent saved
        const saved = allSess.filter((s) => s.session.is_saved === true);
        if (saved.length > 0) {
          selectedSession = saved.reduce((prev, curr) =>
            (curr.session.date || "") > (prev.session.date || "") ? curr : prev
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
        session_id: att.session_id ?? null,
        db_id: att.id,
        isRecent: false,
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

        const reasonDetail = `Sistema: Abono de ${payment.amount} a cuenta`;

        const session: Session = {
          date: payment.date,
          reason_type: "Otro",
          reason_detail: reasonDetail,
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
        setSessions(normalizeFetchedSessions(updatedSessions));

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
    toothDx: currentToothDx,
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
    hasDraftSessionChanges,
    draftSessionChangesCount,

    // Handlers
    onToothDxChange,
    handleNew,
    handleSave,
    handleDeleteAttachment,
    handleSelectPatient,
    handleQuickPayment,
    handleSessionChange, // NEW: Switch active session
    createDraftSession,
  };
}
