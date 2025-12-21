// src/pages/PatientsPageUnified.tsx
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import Section from "../components/Section";
import PatientForm from "../components/PatientForm";
import SessionsTable from "../components/sessions/SessionsTable";
import Attachments from "../components/Attachments";
import PatientSearchDialog from "../components/PatientSearchDialog";
import PendingPaymentsDialog from "../components/PendingPaymentsDialog";
import { MacOSDock } from "../components/MacOSDock";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/Tabs";
import {
  Plus,
  Save,
  FileDown,
  User,
  Activity,
  Paperclip,
  Search,
  Wallet,
  AlertTriangle,
  Stethoscope,
  Printer,
} from "lucide-react";

import { FinancialHistoryBlock } from "../components/FinancialHistoryBlock";
import { QuickPaymentModal } from "../components/QuickPaymentModal";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

// Custom hooks
import { usePatientRecord } from "../hooks/usePatientRecord";
import { usePatientFromURL } from "../hooks/usePatientFromURL";
import { useMasterData } from "../hooks/useMasterData";
// useScrollVisibility hook removed - no longer needed without Quick Actions section
import { useAppStore } from "../stores";
import type { Patient, SessionItem } from "../lib/types";
import OdontogramDiagnosisSection from "../components/OdontogramDiagnosisSection";

interface PatientsPageUnifiedProps {
  layoutMode: "tabs" | "vertical";
}

export function PatientsPageUnified({ layoutMode }: PatientsPageUnifiedProps) {
  // Patient record management
  const {
    patient,
    setPatient,
    sessions,
    setSessions,
    activeSessionId,
    toothDx,
    manualDiagnosis,
    setManualDiagnosis,
    attachments,
    setAttachments,
    diagnosisFromTeeth,
    fullDiagnosis,
    hasPatientData,
    canSave,
    hasAllergy,
    hasPatientChanges,
    hasOdontogramChanges,
    hasNewAttachments,
    hasDraftSessionChanges,
    draftSessionChangesCount,
    onToothDxChange,
    createDraftSession,
    handleSessionChange,
    handleNew,
    handleSave,
    handleDeleteAttachment,
    handleSelectPatient,
    handleQuickPayment,
  } = usePatientRecord();

  // Master data
  const {
    procedureTemplates,
    signers,
    reasonTypes,
    paymentMethods,
    updateProcedureTemplates,
    reloadSigners,
    handleReasonTypesChange,
  } = useMasterData();

  // URL parameter handling
  const { clearPatientURL } = usePatientFromURL({
    onPatientLoaded: handleSelectPatient,
  });

  // Local UI state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [patientsForDialogs, setPatientsForDialogs] = useState<
    Array<Patient & { id: number }>
  >([]);
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("odontogram");
  const [snapshotSessionId, setSnapshotSessionId] = useState<number | null>(null);
  const [hasManuallyExited, setHasManuallyExited] = useState(false);

  // Quick actions visibility removed - using MacOSDock only

  // Calculate total changes for badge
  const changesCount =
    (hasPatientChanges ? 1 : 0) +
    (hasOdontogramChanges ? 1 : 0) +
    (hasNewAttachments ? 1 : 0) +
    draftSessionChangesCount;

  const hasAnyChanges =
    hasPatientChanges ||
    hasOdontogramChanges ||
    hasNewAttachments ||
    hasDraftSessionChanges;

  // Snapshot helpers
  const isSnapshotMode = snapshotSessionId !== null;

  const latestSavedSessionId = useMemo(() => {
    const saved = sessions.filter((s) => s.session.is_saved);
    if (saved.length === 0) return null;
    return saved
      .sort((a, b) => (b.session.date || "").localeCompare(a.session.date || ""))
      .map((s) => s.session.id!)
      .find(Boolean) as number | null;
  }, [sessions]);

  const latestSavedSession = useMemo(() => {
    const saved = sessions.filter((s) => s.session.is_saved);
    if (saved.length === 0) return null;
    const sorted = [...saved].sort((a, b) =>
      (b.session.date || "").localeCompare(a.session.date || ""),
    );
    return sorted[0] || null;
  }, [sessions]);

  const activeSavedSessionId = useMemo(() => {
    if (!activeSessionId) return null;
    const active = sessions.find((s) => s.session.id === activeSessionId);
    if (!active?.session?.is_saved) return null;
    return active.session.id ?? null;
  }, [activeSessionId, sessions]);

  const sessionsToRender = useMemo(() => {
    if (!snapshotSessionId) return sessions;
    const target = sessions.find((s) => s.session.id === snapshotSessionId);
    if (!target?.session.date) return sessions;
    const targetDate = target.session.date;
    const targetId = target.session.id || 0;

    return sessions
      .filter((s) => {
        const d = s.session.date || "";
        const id = s.session.id || 0;
        if (d < targetDate) return true;
        if (d > targetDate) return false;
        return id <= targetId;
      })
      .sort((a, b) => (a.session.date || "").localeCompare(b.session.date || ""));
  }, [sessions, snapshotSessionId]);

  const odontogramSessions = isSnapshotMode ? sessionsToRender : sessions;
  const odontogramActiveSessionId = isSnapshotMode
    ? snapshotSessionId
    : activeSessionId;

  // Handlers
  const handlePreview = useCallback(() => window.print(), []);

  const handleNewWrapper = useCallback(() => {
    const result = handleNew();
    if (result) {
      clearPatientURL();
    }
  }, [handleNew, clearPatientURL]);

  const handleSaveWrapper = useCallback(async () => {
    if (isSnapshotMode) return;
    await handleSave();
  }, [handleSave, isSnapshotMode]);

  const handleSelectPatientWrapper = useCallback(
    async (selectedPatient: Patient) => {
      const result = await handleSelectPatient(selectedPatient);
      if (result) {
        setHasManuallyExited(false); // Reset manual exit flag when selecting new patient
      }
    },
    [handleSelectPatient],
  );

  const handleQuickPaymentWrapper = useCallback(
    async (payment: {
      date: string;
      amount: number;
      payment_method_id?: number;
      payment_notes?: string;
    }) => {
      const result = await handleQuickPayment(payment);
      if (result) {
        setQuickPaymentOpen(false);
      }
    },
    [handleQuickPayment],
  );

  const handleToothDxChange = useCallback(
    (next: typeof toothDx) => {
      if (isSnapshotMode) return;
      onToothDxChange(next);
    },
    [isSnapshotMode, onToothDxChange],
  );

  const handleManualDiagnosisChange = useCallback(
    (next: string) => {
      if (isSnapshotMode) return;
      setManualDiagnosis(next);
    },
    [isSnapshotMode, setManualDiagnosis],
  );

  const handleOdontogramSessionChange = useCallback(
    (sessionId: number | null) => {
      if (isSnapshotMode) return;
      handleSessionChange(sessionId);
    },
    [handleSessionChange, isSnapshotMode],
  );

  const buildDraftSessionItems = useCallback((): SessionItem[] => {
    const timestamp = Date.now();
    const baseItems: SessionItem[] = procedureTemplates.map(
      (template, index) => ({
        id: timestamp + index,
        name: template.name,
        unit_price: template.default_price,
        quantity: 0,
        subtotal: 0,
        is_active: false,
        procedure_template_id: template.id,
      }),
    );

    let previousSession = null;
    const validSessions = sessions.filter((s) => s.session);
    if (validSessions.length > 0) {
      previousSession = validSessions[0];
      for (const session of validSessions) {
        if ((session.session?.date ?? "") > (previousSession.session?.date ?? "")) {
          previousSession = session;
        }
      }
    }

    if (!previousSession) return baseItems;

    const prevQtyMap = new Map(
      previousSession.items.map((item) => [item.name, item.quantity]),
    );

    return baseItems.map((item, index) => {
      const quantity = prevQtyMap.get(item.name) || 0;
      return {
        ...item,
        id: -(timestamp + index + 1000),
        quantity,
        subtotal: item.unit_price * quantity,
      };
    });
  }, [procedureTemplates, sessions]);

  const handleOpenSnapshot = useCallback((sessionId: number) => {
    setSnapshotSessionId(sessionId);
  }, []);

  const handleCloseSnapshot = useCallback(() => {
    setSnapshotSessionId(null);
    setHasManuallyExited(true); // Mark that user manually exited
  }, []);

  const handleCreateDraftSession = useCallback(() => {
    const items = buildDraftSessionItems();
    createDraftSession(items);
  }, [buildDraftSessionItems, createDraftSession]);

  const handleNewSessionFromDock = useCallback(() => {
    handleCreateDraftSession();
    handleCloseSnapshot();
  }, [handleCloseSnapshot, handleCreateDraftSession]);

  // Auto snapshot to última sesión guardada cuando se carga un paciente
  // But only if user hasn't manually exited snapshot mode
  useEffect(() => {
    if (!hasManuallyExited && snapshotSessionId === null && latestSavedSessionId) {
      setSnapshotSessionId(latestSavedSessionId);
    }
  }, [latestSavedSessionId, snapshotSessionId, hasManuallyExited]);

  // Load patients for dialogs (with debounce)
  useEffect(() => {
    if (!searchDialogOpen) return;

    const timeoutId = setTimeout(async () => {
      try {
        const repo = await getRepository();
        const all = await repo.searchPatients("");
        setPatientsForDialogs(all);
      } catch (e) {
        console.error("Error cargando pacientes para búsqueda:", e);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchDialogOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const cmd = e.ctrlKey || e.metaKey;
      if (!cmd) return;

      if (k === "s") {
        e.preventDefault();
        handleSaveWrapper();
      } else if (k === "p") {
        e.preventDefault();
        handlePreview();
      } else if (k === "k") {
        e.preventDefault();
        setSearchDialogOpen(true);
      } else if (k === "n") {
        e.preventDefault();
        handleNewWrapper();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSaveWrapper, handlePreview, handleNewWrapper]);

  // Data loss prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasAnyChanges]);

  // Render vertical layout
  if (layoutMode === "vertical") {
    return (
      <>
        {/* Dialogs */}
        <PatientSearchDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          patients={patientsForDialogs}
          onSelectPatient={handleSelectPatientWrapper}
        />
        <PendingPaymentsDialog
          open={paymentsDialogOpen}
          onOpenChange={setPaymentsDialogOpen}
          onSelectPatient={handleSelectPatientWrapper}
        />

        {/* Quick actions section removed - all actions now in MacOSDock only */}

        {/* Snapshot banner */}
        {isSnapshotMode && (
          <Alert variant="info" className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">
                Modo histórico: sesión #{snapshotSessionId ?? ""}
              </div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                Vista solo lectura. Los campos están deshabilitados hasta salir.
              </div>
            </div>
          </Alert>
        )}

        {/* Patient data */}
        <Section
          title="Datos del Paciente"
          icon={<User size={20} />}
          right={
            hasAllergy && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-base font-bold shadow-lg sticky top-4 z-40">
                <AlertTriangle size={20} className="animate-pulse" />
                ALERGIA
              </div>
            )
          }
        >
        <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
          <PatientForm value={patient} onChange={setPatient} />
          {!hasPatientData && (
            <Alert variant="warning" className="mt-4">
              Por favor completa al menos el nombre y cédula del paciente para
              poder guardar.
            </Alert>
          )}
        </div>
      </Section>

      {/* Odontogram */}
      <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
        <OdontogramDiagnosisSection
          toothDx={toothDx}
          onToothDxChange={handleToothDxChange}
          diagnosisFromTeeth={diagnosisFromTeeth}
          manualDiagnosis={manualDiagnosis}
          onManualDiagnosisChange={handleManualDiagnosisChange}
          readOnly={isSnapshotMode}
          activeSessionId={odontogramActiveSessionId}
          sessions={odontogramSessions}
          onSessionChange={handleOdontogramSessionChange}
          lastSavedSession={latestSavedSession}
        />
      </div>
      {/* Sessions */}
      <Section
        title="Evolución y Procedimientos"
        icon={<Activity size={20} />}
      >
        <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
          <SessionsTable
            sessions={sessionsToRender}
            onSessionsChange={isSnapshotMode ? () => {} : setSessions}
            procedureTemplates={procedureTemplates}
            onUpdateTemplates={updateProcedureTemplates}
            signers={signers}
            onSignersChange={reloadSigners}
            reasonTypes={reasonTypes}
            paymentMethods={paymentMethods}
            onReasonTypesChange={handleReasonTypesChange}
            onCreateSession={handleCreateDraftSession}
            activeId={activeSessionId}
            onOpenSession={isSnapshotMode ? undefined : handleSessionChange}
            onViewReadOnly={handleOpenSnapshot}
          />
        </div>
      </Section>

      {/* Financial history */}
      {(() => {
        const savedSessions = sessionsToRender.filter(
          (s) => s.session.is_saved === true,
        );

        return patient.id && savedSessions.length > 0 ? (
          <Section icon={<Wallet size={20} />} title="Historial Financiero">
            <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
              <FinancialHistoryBlock
                sessions={savedSessions}
                onQuickPayment={() => {
                  if (isSnapshotMode) return;
                  setQuickPaymentOpen(true);
                }}
              />
            </div>
          </Section>
        ) : null;
      })()}

        {/* Quick Payment Modal */}
        {patient.id && (
          <QuickPaymentModal
            open={quickPaymentOpen}
            onOpenChange={setQuickPaymentOpen}
            patientId={patient.id}
            paymentMethods={paymentMethods}
            onSave={handleQuickPaymentWrapper}
          />
        )}

      {/* Attachments */}
      <Section
        title="Adjuntos (Radiografías, Fotos, Documentos)"
        icon={<Paperclip size={20} />}
      >
        <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
          <Attachments
            files={attachments}
            onFilesChange={isSnapshotMode ? () => {} : setAttachments}
            onFileDelete={isSnapshotMode ? () => Promise.resolve() : handleDeleteAttachment}
            patientName={patient.full_name}
            defaultSessionId={activeSavedSessionId}
          />
        </div>
      </Section>

        {/* Action buttons removed - all actions now via MacOSDock only */}

        {/* macOS Dock */}
        <MacOSDock
          visible={true}
          onNewRecord={handleNewWrapper}
          onSearch={() => setSearchDialogOpen(true)}
          onNewSession={handleNewSessionFromDock}
          onPrint={handlePreview}
          onSave={handleSaveWrapper}
          onPendingPayments={() => setPaymentsDialogOpen(true)}
          hasChanges={hasAnyChanges}
          changesCount={changesCount}
          saveDisabled={!canSave}
          isSnapshotMode={isSnapshotMode}
        />
      </>
    );
  }

  // Render tabbed layout
  return (
    <>
      {/* Dialogs */}
      <PatientSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        patients={patientsForDialogs}
        onSelectPatient={handleSelectPatientWrapper}
      />
      <PendingPaymentsDialog
        open={paymentsDialogOpen}
        onOpenChange={setPaymentsDialogOpen}
        onSelectPatient={handleSelectPatientWrapper}
      />

      {/* Quick actions section removed - all actions now in MacOSDock only */}

      {/* Snapshot banner */}
      {isSnapshotMode && (
        <Alert variant="info" className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">
              Modo histórico: sesión #{snapshotSessionId ?? ""}
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Vista solo lectura. Los campos están deshabilitados hasta salir.
            </div>
          </div>
        </Alert>
      )}

      {/* Patient data or card */}
      <Section
        title="Datos del Paciente"
        icon={<User size={20} />}
        right={
          hasAllergy && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-base font-bold shadow-lg">
              <AlertTriangle size={20} className="animate-pulse" />
              ALERGIA
            </div>
          )
        }
      >
        <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
          {/* Always show PatientForm for consistency with vertical layout */}
          <PatientForm value={patient} onChange={setPatient} />
          {!hasPatientData && (
            <Alert variant="warning" className="mt-4">
              Por favor completa al menos el nombre y cédula del paciente para
              poder guardar.
            </Alert>
          )}
        </div>
      </Section>

      {/* Tabs system */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-6 bg-[hsl(var(--surface))] p-2">
          <TabsTrigger value="odontogram" className="flex items-center gap-2">
            <Activity size={18} />
            Odontograma
          </TabsTrigger>
          <TabsTrigger value="procedures" className="flex items-center gap-2">
            <Stethoscope size={18} />
            Procedimientos
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <Wallet size={18} />
            Historial Financiero
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <Paperclip size={18} />
            Adjuntos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Odontogram + Diagnosis */}
        <TabsContent value="odontogram">
          <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
            <OdontogramDiagnosisSection
              toothDx={toothDx}
              onToothDxChange={handleToothDxChange}
              diagnosisFromTeeth={diagnosisFromTeeth}
              manualDiagnosis={manualDiagnosis}
              onManualDiagnosisChange={handleManualDiagnosisChange}
              readOnly={isSnapshotMode}
              activeSessionId={odontogramActiveSessionId}
              sessions={odontogramSessions}
              onSessionChange={handleOdontogramSessionChange}
              lastSavedSession={latestSavedSession}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Sessions */}
        <TabsContent value="procedures">
          <Section
            title="Evolución y Procedimientos"
            icon={<Activity size={20} />}
          >
            <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
              <SessionsTable
                sessions={sessionsToRender}
                onSessionsChange={isSnapshotMode ? () => {} : setSessions}
                procedureTemplates={procedureTemplates}
                onUpdateTemplates={updateProcedureTemplates}
                signers={signers}
                onSignersChange={reloadSigners}
                reasonTypes={reasonTypes}
                paymentMethods={paymentMethods}
                onReasonTypesChange={handleReasonTypesChange}
                onCreateSession={handleCreateDraftSession}
                activeId={activeSessionId}
                onOpenSession={isSnapshotMode ? undefined : handleSessionChange}
                onViewReadOnly={handleOpenSnapshot}
              />
            </div>
          </Section>
        </TabsContent>

        {/* Tab 3: Financial history */}
        <TabsContent value="financial">
          {(() => {
            const savedSessions = sessionsToRender.filter(
              (s) => s.session.is_saved === true,
            );

            return patient.id && savedSessions.length > 0 ? (
              <Section icon={<Wallet size={20} />} title="Historial Financiero">
                <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
                  <FinancialHistoryBlock
                    sessions={savedSessions}
                    onQuickPayment={() => {
                      if (isSnapshotMode) return;
                      setQuickPaymentOpen(true);
                    }}
                  />
                </div>
              </Section>
            ) : (
              <Section icon={<Wallet size={20} />} title="Historial Financiero">
                <Alert variant="info">
                  No hay historial financiero disponible. Guarda al menos una
                  sesión para ver el historial.
                </Alert>
              </Section>
            );
          })()}

          {/* Quick Payment Modal */}
          {patient.id && (
            <QuickPaymentModal
              open={quickPaymentOpen}
              onOpenChange={setQuickPaymentOpen}
              patientId={patient.id}
              paymentMethods={paymentMethods}
              onSave={handleQuickPaymentWrapper}
            />
          )}
        </TabsContent>

        {/* Tab 4: Attachments */}
        <TabsContent value="attachments">
          <Section
            title="Adjuntos (Radiografías, Fotos, Documentos)"
            icon={<Paperclip size={20} />}
          >
            <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
              <Attachments
                files={attachments}
                onFilesChange={isSnapshotMode ? () => {} : setAttachments}
                onFileDelete={isSnapshotMode ? () => Promise.resolve() : handleDeleteAttachment}
                patientName={patient.full_name}
                defaultSessionId={activeSavedSessionId}
              />
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      {/* Action buttons removed - all actions now via MacOSDock only */}

      {/* macOS Dock */}
      <MacOSDock
        visible={true}
        onNewRecord={handleNewWrapper}
        onSearch={() => setSearchDialogOpen(true)}
        onNewSession={handleNewSessionFromDock}
        onPrint={handlePreview}
        onSave={handleSaveWrapper}
        onPendingPayments={() => setPaymentsDialogOpen(true)}
        hasChanges={hasAnyChanges}
        changesCount={changesCount}
        saveDisabled={!canSave}
        isSnapshotMode={isSnapshotMode}
      />
    </>
  );
}
