# Example: Unified Patient Page Component

This document shows the refactored unified component that replaces both `PatientsPage.tsx` and `PatientsPageTabbed.tsx`.

## Custom Hooks

### useInitializeMasterData.ts

```typescript
// src/hooks/useInitializeMasterData.ts
import { useEffect } from "react";
import { useAppStore } from "../stores";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

/**
 * Hook to load master data on component mount
 * This replaces the duplicate initialization code in both page components
 */
export function useInitializeMasterData() {
  const loadAllMasterData = useAppStore(state => state.loadAllMasterData);
  const setIsLoading = useAppStore(state => state.setIsLoadingMasterData);
  const isLoading = useAppStore(state => state.isLoadingMasterData);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const repo = await getRepository();

        // Load all master data in parallel
        const [templates, signers, reasonTypes, paymentMethods] = await Promise.all([
          repo.getProcedureTemplates(),
          repo.getSigners(),
          repo.getReasonTypes(),
          repo.getPaymentMethods(),
        ]);

        loadAllMasterData({
          procedureTemplates: templates,
          signers: signers,
          reasonTypes: reasonTypes,
          paymentMethods: paymentMethods,
        });
      } catch (error) {
        console.error("Error loading master data:", error);
        alert("Error al cargar datos iniciales. Por favor recarga la aplicación.");
      }
    })();
  }, [loadAllMasterData, setIsLoading]);

  return { isLoading };
}
```

### usePatientLoader.ts

```typescript
// src/hooks/usePatientLoader.ts
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "../stores";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { useToast } from "./useToast";
import type { ToothDx, AttachmentFile } from "../lib/types";

/**
 * Hook to load patient from URL parameters
 * This handles the ?patientId=123 navigation from PatientsListPage
 */
export function usePatientLoader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const loadedFromUrl = useAppStore(state => state.loadedFromUrl);
  const setLoadedFromUrl = useAppStore(state => state.setLoadedFromUrl);
  const loadPatientData = useAppStore(state => state.loadPatientData);
  const setSessions = useAppStore(state => state.setSessions);

  useEffect(() => {
    // Only load once
    if (loadedFromUrl) return;

    const patientIdParam = searchParams.get("patientId");
    if (!patientIdParam) {
      setLoadedFromUrl(true);
      return;
    }

    const patientId = parseInt(patientIdParam, 10);
    if (isNaN(patientId)) {
      setLoadedFromUrl(true);
      return;
    }

    (async () => {
      try {
        const repo = await getRepository();
        const patient = await repo.findPatientById(patientId);

        if (!patient) {
          toast.warning(
            "Paciente no encontrado",
            "No se pudo cargar el paciente solicitado"
          );
          setSearchParams({});
          setLoadedFromUrl(true);
          return;
        }

        // Load patient visits and last odontogram
        const visits = await repo.getVisitsByPatient(patient.id!);
        const lastToothDx: ToothDx = visits.length > 0 && visits[0].tooth_dx_json
          ? JSON.parse(visits[0].tooth_dx_json)
          : {};

        // Load sessions and attachments in parallel
        const [sessions, savedAttachments] = await Promise.all([
          repo.getSessionsByPatient(patient.id!),
          repo.getAttachmentsByPatient(patient.id!),
        ]);

        // Map attachments to AttachmentFile format
        const attachmentFiles: AttachmentFile[] = savedAttachments.map(att => ({
          id: `saved-${att.id}`,
          name: att.filename,
          size: att.size_bytes || 0,
          type: att.mime_type || "",
          url: "",
          uploadDate: att.created_at || "",
          storage_key: att.storage_key,
          db_id: att.id,
        }));

        // Update store with all loaded data
        loadPatientData(patient, lastToothDx, attachmentFiles);
        setSessions(sessions);

        toast.success(
          "Paciente cargado",
          `Se cargó la historia clínica de ${patient.full_name}`
        );

        setLoadedFromUrl(true);
      } catch (error) {
        console.error("Error loading patient from URL:", error);
        toast.error(
          "Error al cargar",
          "No se pudo cargar el paciente desde la URL"
        );
        setLoadedFromUrl(true);
      }
    })();
  }, [loadedFromUrl, searchParams, toast, setSearchParams, setLoadedFromUrl, loadPatientData, setSessions]);
}
```

### usePatientOperations.ts

```typescript
// src/hooks/usePatientOperations.ts
import { useCallback } from "react";
import { useAppStore, selectFullDiagnosis, selectDiagnosisFromTeeth } from "../stores";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { saveAttachmentFile } from "../lib/files/attachments";
import { useToast } from "./useToast";
import type { Session } from "../lib/types";

/**
 * Hook for patient operations (save, new, select, etc.)
 * Encapsulates all complex business logic
 */
export function usePatientOperations() {
  const toast = useToast();

  // Selectors
  const patient = useAppStore(state => state.patient);
  const session = useAppStore(state => state.session);
  const toothDx = useAppStore(state => state.toothDx);
  const sessions = useAppStore(state => state.sessions);
  const attachments = useAppStore(state => state.attachments);
  const fullDiagnosis = useAppStore(selectFullDiagnosis);
  const diagnosisFromTeeth = useAppStore(selectDiagnosisFromTeeth);

  // Actions
  const resetPatientForm = useAppStore(state => state.resetPatientForm);
  const resetSessionData = useAppStore(state => state.resetSessionData);
  const loadPatientData = useAppStore(state => state.loadPatientData);
  const setSessions = useAppStore(state => state.setSessions);
  const setAttachments = useAppStore(state => state.setAttachments);
  const setPatient = useAppStore(state => state.setPatient);
  const setSession = useAppStore(state => state.setSession);
  const markSessionsAsSaved = useAppStore(state => state.markSessionsAsSaved);

  const handleNew = useCallback(() => {
    const draftSessions = sessions.filter(s => !s.session.is_saved);
    const hasDrafts = draftSessions.length > 0;

    let confirmMessage = "¿Crear una nueva historia? Se perderán cambios no guardados.";
    if (hasDrafts) {
      confirmMessage = `⚠️ Tienes ${draftSessions.length} sesión(es) en BORRADOR sin guardar.\n\n¿Estás seguro de crear una nueva historia? Se perderán todos los borradores.`;
    }

    if (!confirm(confirmMessage)) return;

    resetPatientForm();
    resetSessionData();
  }, [sessions, resetPatientForm, resetSessionData]);

  const handleSave = useCallback(async () => {
    const hasPatientData = Boolean(patient.full_name && patient.doc_id);
    if (!hasPatientData) {
      toast.warning(
        "Datos incompletos",
        "Completa al menos nombre y cédula del paciente para guardar."
      );
      return;
    }

    try {
      const repo = await getRepository();

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

      // Save attachment files to disk first
      const newAttachments = attachments.filter(a => a.file);
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

      // Filter draft sessions
      const draftSessions = sessions.filter(s => !s.session.is_saved);

      if (draftSessions.length === 0) {
        toast.warning("Sin cambios", "No hay sesiones nuevas para guardar");
        return;
      }

      // Save to database
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
      setPatient({ ...patient, id: patient_id });
      setSession({
        ...session,
        id: session_id,
        patient_id: patient_id,
      });

      // Mark sessions as saved
      markSessionsAsSaved();

      // Clear new attachments (they're now saved)
      setAttachments(attachments.map(att => {
        if (att.file) {
          return { ...att, file: undefined, db_id: att.db_id || 1 };
        }
        return att;
      }));

      toast.success(
        "Guardado exitoso",
        "La historia clínica se ha guardado correctamente"
      );
    } catch (e) {
      console.error("Error al guardar:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error(
        "Error al guardar",
        `No se pudo guardar la historia clínica: ${errorMessage}`
      );
    }
  }, [
    patient,
    session,
    toothDx,
    sessions,
    attachments,
    fullDiagnosis,
    diagnosisFromTeeth,
    toast,
    setPatient,
    setSession,
    markSessionsAsSaved,
    setAttachments,
  ]);

  const handleSelectPatient = useCallback(async (selectedPatient: any) => {
    if (!selectedPatient?.id) return;

    try {
      const repo = await getRepository();
      const p = await repo.findPatientById(selectedPatient.id);
      if (!p) return;

      const visits = await repo.getVisitsByPatient(p.id!);
      const today = new Date().toISOString().slice(0, 10);

      let lastToothDx = {};
      if (visits.length > 0 && visits[0].tooth_dx_json) {
        lastToothDx = JSON.parse(visits[0].tooth_dx_json);
      }

      const [allSess, savedAttachments] = await Promise.all([
        repo.getSessionsByPatient(p.id!),
        repo.getAttachmentsByPatient(p.id!),
      ]);

      const attachmentFiles = savedAttachments.map(att => ({
        id: `saved-${att.id}`,
        name: att.filename,
        size: att.size_bytes || 0,
        type: att.mime_type || "",
        url: "",
        uploadDate: att.created_at || "",
        storage_key: att.storage_key,
        db_id: att.id,
      }));

      loadPatientData(p, lastToothDx, attachmentFiles);
      setSessions(allSess);
      setSession({
        date: today,
        reason_type: undefined,
        reason_detail: "",
        diagnosis_text: "",
        budget: 0,
        discount: 0,
        payment: 0,
        balance: 0,
        cumulative_balance: 0,
      });
    } catch (e) {
      console.error("Error al seleccionar paciente:", e);
      alert("Error al cargar los datos del paciente");
    }
  }, [loadPatientData, setSessions, setSession]);

  return {
    handleNew,
    handleSave,
    handleSelectPatient,
    handlePreview: () => window.print(),
  };
}
```

## Unified Component

```typescript
// src/pages/PatientsPageUnified.tsx
import { useEffect, useMemo } from "react";
import { useAppStore, selectLayoutMode, selectActiveTab } from "../stores";
import { useInitializeMasterData } from "../hooks/useInitializeMasterData";
import { usePatientLoader } from "../hooks/usePatientLoader";
import { usePatientOperations } from "../hooks/usePatientOperations";
import { useToast } from "../hooks/useToast";

// Import all UI components (same as before)
import Section from "../components/Section";
import PatientForm from "../components/PatientForm";
import PatientCard from "../components/PatientCard";
import Odontogram from "../components/Odontogram";
import DiagnosisArea from "../components/DiagnosisArea";
import SessionsTable from "../components/sessions/SessionsTable";
import Attachments from "../components/Attachments";
// ... other imports

/**
 * Unified Patient Page Component
 *
 * This component replaces both PatientsPage.tsx and PatientsPageTabbed.tsx
 * It uses Zustand for state management and switches layouts dynamically
 */
export function PatientsPageUnified() {
  const toast = useToast();

  // Initialize master data
  const { isLoading } = useInitializeMasterData();

  // Load patient from URL if present
  usePatientLoader();

  // Get patient operations
  const { handleNew, handleSave, handleSelectPatient, handlePreview } = usePatientOperations();

  // UI state
  const layoutMode = useAppStore(selectLayoutMode);
  const activeTab = useAppStore(selectActiveTab);
  const setActiveTab = useAppStore(state => state.setActiveTab);

  // Patient state
  const patient = useAppStore(state => state.patient);
  const toothDx = useAppStore(state => state.toothDx);
  const manualDiagnosis = useAppStore(state => state.manualDiagnosis);
  const attachments = useAppStore(state => state.attachments);
  const isEditingPatient = useAppStore(state => state.isEditingPatient);

  // Session state
  const sessions = useAppStore(state => state.sessions);

  // Master data
  const procedureTemplates = useAppStore(state => state.procedureTemplates);
  const signers = useAppStore(state => state.signers);
  const reasonTypes = useAppStore(state => state.reasonTypes);
  const paymentMethods = useAppStore(state => state.paymentMethods);

  // Actions
  const setPatient = useAppStore(state => state.setPatient);
  const setToothDx = useAppStore(state => state.setToothDx);
  const setManualDiagnosis = useAppStore(state => state.setManualDiagnosis);
  const setAttachments = useAppStore(state => state.setAttachments);
  const setSessions = useAppStore(state => state.setSessions);
  const setIsEditingPatient = useAppStore(state => state.setIsEditingPatient);

  // Computed values
  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(toothDx)
      .sort((a, b) => +a - +b)
      .map(n => toothDx[n]?.length ? `Diente ${n}: ${toothDx[n].join(", ")}` : "")
      .filter(Boolean);
    return lines.join("\n");
  }, [toothDx]);

  const hasPatientData = Boolean(patient.full_name && patient.doc_id);
  const hasAllergy = Boolean(patient.allergy_detail?.trim());

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const cmd = e.ctrlKey || e.metaKey;
      if (!cmd) return;

      if (k === "s") {
        e.preventDefault();
        handleSave();
      } else if (k === "p") {
        e.preventDefault();
        handlePreview();
      } else if (k === "n") {
        e.preventDefault();
        handleNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, handlePreview, handleNew]);

  // Render loading state
  if (isLoading) {
    return <div>Cargando datos iniciales...</div>;
  }

  // Render vertical layout
  if (layoutMode === 'vertical') {
    return (
      <>
        {/* Quick Actions */}
        <Section title="Acciones Rápidas">
          {/* Same quick actions as before */}
        </Section>

        {/* Patient Form */}
        <Section title="Datos del Paciente">
          <PatientForm value={patient} onChange={setPatient} />
        </Section>

        {/* Odontogram */}
        <Section title="Odontograma">
          <Odontogram value={toothDx} onChange={setToothDx} />
        </Section>

        {/* Diagnosis */}
        <Section title="Diagnóstico">
          <DiagnosisArea
            value={manualDiagnosis}
            onChange={setManualDiagnosis}
            autoGenerated={Boolean(diagnosisFromTeeth)}
          />
        </Section>

        {/* Sessions */}
        <Section title="Evolución y Procedimientos">
          <SessionsTable
            sessions={sessions}
            onSessionsChange={setSessions}
            procedureTemplates={procedureTemplates}
            signers={signers}
            reasonTypes={reasonTypes}
            paymentMethods={paymentMethods}
          />
        </Section>

        {/* Attachments */}
        <Section title="Adjuntos">
          <Attachments
            files={attachments}
            onFilesChange={setAttachments}
            patientName={patient.full_name}
          />
        </Section>

        {/* Save Button */}
        <div className="flex justify-end gap-3 mt-8">
          <Button onClick={handleSave} disabled={!hasPatientData}>
            Guardar Historia
          </Button>
        </div>
      </>
    );
  }

  // Render tabbed layout
  return (
    <>
      {/* Quick Actions */}
      <Section title="Acciones Rápidas">
        {/* Same as vertical */}
      </Section>

      {/* Patient Card/Form */}
      <Section title="Datos del Paciente">
        {isEditingPatient ? (
          <PatientForm value={patient} onChange={setPatient} />
        ) : (
          <PatientCard
            patient={patient}
            onEdit={() => setIsEditingPatient(true)}
          />
        )}
      </Section>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="odontogram">Odontograma y Diagnóstico</TabsTrigger>
          <TabsTrigger value="procedures">Evolución y Procedimientos</TabsTrigger>
          <TabsTrigger value="financial">Historial Financiero</TabsTrigger>
          <TabsTrigger value="attachments">Adjuntos</TabsTrigger>
        </TabsList>

        <TabsContent value="odontogram">
          {/* Odontogram and Diagnosis */}
        </TabsContent>

        <TabsContent value="procedures">
          {/* Sessions Table */}
        </TabsContent>

        <TabsContent value="financial">
          {/* Financial History */}
        </TabsContent>

        <TabsContent value="attachments">
          {/* Attachments */}
        </TabsContent>
      </Tabs>
    </>
  );
}
```

## Key Benefits

1. **Single Component**: ~400 lines instead of 1700+ duplicated lines
2. **State Persistence**: Layout and tab state persist in localStorage
3. **No State Loss**: Switching layouts preserves all data
4. **Better Performance**: Optimized selectors reduce re-renders
5. **Type Safety**: Full TypeScript support with proper types
6. **Easier Testing**: Business logic in hooks, easy to test
7. **Maintainability**: Single source of truth for all state
