// src/pages/PatientsPageUnified.tsx
import { useCallback, useEffect, useState, useRef } from "react";
import Section from "../components/Section";
import PatientForm from "../components/PatientForm";
import PatientCard from "../components/PatientCard";
import SessionsTable from "../components/sessions/SessionsTable";
import Attachments from "../components/Attachments";
import PatientSearchDialog from "../components/PatientSearchDialog";
import PendingPaymentsDialog from "../components/PendingPaymentsDialog";
import ShortcutsHelp from "../components/ShortcutsHelp";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { SaveFloatingButton } from "../components/SaveFloatingButton";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/Popover";
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
  Info,
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
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import type { Patient } from "../lib/types";
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
    hasDraftSessions,
    onToothDxChange,
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
  const [isEditingPatient, setIsEditingPatient] = useState(true);

  // FAB scroll visibility
  const quickActionsRef = useRef<HTMLElement>(null);
  const showFAB = useScrollVisibility({ targetRef: quickActionsRef });

  // Calculate total changes for badge
  const changesCount =
    (hasPatientChanges ? 1 : 0) +
    (hasOdontogramChanges ? 1 : 0) +
    (hasNewAttachments ? 1 : 0) +
    (hasDraftSessions ? sessions.filter((s) => !s.session.is_saved).length : 0);

  const hasAnyChanges =
    hasPatientChanges ||
    hasOdontogramChanges ||
    hasNewAttachments ||
    hasDraftSessions;

  // Handlers
  const handlePreview = useCallback(() => window.print(), []);

  const handleNewWrapper = useCallback(() => {
    const result = handleNew();
    if (result) {
      clearPatientURL();
      setIsEditingPatient(true);
    }
  }, [handleNew, clearPatientURL]);

  const handleSaveWrapper = useCallback(async () => {
    const result = await handleSave();
    if (result && layoutMode === "tabs") {
      setIsEditingPatient(false);
    }
  }, [handleSave, layoutMode]);

  const handleSelectPatientWrapper = useCallback(
    async (selectedPatient: Patient) => {
      const result = await handleSelectPatient(selectedPatient);
      if (result && layoutMode === "tabs") {
        setIsEditingPatient(false);
      }
    },
    [handleSelectPatient, layoutMode],
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
      const draftSessions = sessions.filter((s) => !s.session.is_saved);
      if (draftSessions.length > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessions]);

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

        {/* Quick actions */}
        <Section
          ref={quickActionsRef}
          title="Acciones Rápidas"
          icon={
            <PopoverRoot>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Ver atajos de teclado"
                  className="cursor-pointer inline-flex items-center justify-center rounded-full p-1.5 hover:bg-[hsl(var(--muted))]/60 transition"
                >
                  <Info size={20} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-[320px] p-3"
              >
                <ShortcutsHelp />
              </PopoverContent>
            </PopoverRoot>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
            <button
              onClick={handleNewWrapper}
              className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-success font-semibold text-[15px] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(30,157,96,0.24)] active:scale-[0.97]"
            >
              <Plus size={28} />
              Nueva historia
            </button>

            <button
              onClick={handlePreview}
              className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-info font-semibold text-[15px] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(27,99,209,0.24)] active:scale-[0.97]"
            >
              <Printer size={28} />
              Imprimir
            </button>

            <button
              onClick={() => setSearchDialogOpen(true)}
              className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-purple font-semibold text-[15px] shadow-[0_2px_6px_rgba(214,69,69,0.16)] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(122,59,227,0.24)] active:scale-[0.97]"
            >
              <Search size={28} />
              Búsqueda de pacientes
            </button>

            <button
              onClick={() => setPaymentsDialogOpen(true)}
              className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-danger font-semibold text-[15px] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(214,69,69,0.24)] active:scale-[0.97]"
            >
              <Wallet size={28} />
              Cartera de pendientes
            </button>
          </div>
        </Section>

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
          <PatientForm value={patient} onChange={setPatient} />
          {!hasPatientData && (
            <Alert variant="warning" className="mt-4">
              Por favor completa al menos el nombre y cédula del paciente para
              poder guardar.
            </Alert>
          )}
        </Section>

        {/* Odontogram */}
        <OdontogramDiagnosisSection
          toothDx={toothDx}
          onToothDxChange={onToothDxChange}
          diagnosisFromTeeth={diagnosisFromTeeth}
          manualDiagnosis={manualDiagnosis}
          onManualDiagnosisChange={setManualDiagnosis}
        />
        {/* Sessions */}
        <Section
          title="Evolución y Procedimientos"
          icon={<Activity size={20} />}
        >
          <SessionsTable
            sessions={sessions}
            onSessionsChange={setSessions}
            procedureTemplates={procedureTemplates}
            onUpdateTemplates={updateProcedureTemplates}
            signers={signers}
            onSignersChange={reloadSigners}
            reasonTypes={reasonTypes}
            paymentMethods={paymentMethods}
            onReasonTypesChange={handleReasonTypesChange}
          />
        </Section>

        {/* Financial history */}
        {(() => {
          const savedSessions = sessions.filter(
            (s) => s.session.is_saved === true,
          );

          return patient.id && savedSessions.length > 0 ? (
            <Section icon={<Wallet size={20} />} title="Historial Financiero">
              <FinancialHistoryBlock
                sessions={savedSessions}
                onQuickPayment={() => setQuickPaymentOpen(true)}
              />
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
          <Attachments
            files={attachments}
            onFilesChange={setAttachments}
            onFileDelete={handleDeleteAttachment}
            patientName={patient.full_name}
          />
        </Section>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-8 p-6 bg-[hsl(var(--muted))] rounded-lg">
          <Button onClick={handleNewWrapper} variant="ghost" size="lg">
            <Plus size={18} />
            Nueva Historia
          </Button>
          <Button onClick={handlePreview} variant="secondary" size="lg">
            <FileDown size={18} />
            Vista previa/Imprimir
          </Button>
          <Button
            onClick={handleSaveWrapper}
            variant="primary"
            size="lg"
            disabled={!canSave}
            title="Guardar"
          >
            <Save size={18} />
            Guardar Historia
          </Button>
        </div>

        {/* Floating Action Buttons */}
        <SaveFloatingButton
          visible={showFAB}
          hasChanges={hasAnyChanges}
          changesCount={changesCount}
          onSave={handleSaveWrapper}
        />
        <FloatingActionButton
          visible={showFAB}
          onNewRecord={handleNewWrapper}
          onPrint={handlePreview}
          onSearch={() => setSearchDialogOpen(true)}
          onPendingPayments={() => setPaymentsDialogOpen(true)}
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

      {/* Quick actions */}
      <Section
        ref={quickActionsRef}
        title="Acciones Rápidas"
        icon={
          <PopoverRoot>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Ver atajos de teclado"
                className="cursor-pointer inline-flex items-center justify-center rounded-full p-1.5 hover:bg-[hsl(var(--muted))]/60 transition"
              >
                <Info size={20} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              className="w-[320px] p-3"
            >
              <ShortcutsHelp />
            </PopoverContent>
          </PopoverRoot>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          <button
            onClick={handleNewWrapper}
            className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-success font-semibold text-[15px] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(30,157,96,0.24)] active:scale-[0.97]"
          >
            <Plus size={28} />
            Nueva historia
          </button>

          <button
            onClick={handlePreview}
            className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-info font-semibold text-[15px] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(27,99,209,0.24)] active:scale-[0.97]"
          >
            <Printer size={28} />
            Imprimir
          </button>

          <button
            onClick={() => setSearchDialogOpen(true)}
            className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-purple font-semibold text-[15px] shadow-[0_2px_6px_rgba(214,69,69,0.16)] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(122,59,227,0.24)] active:scale-[0.97]"
          >
            <Search size={28} />
            Búsqueda de pacientes
          </button>

          <button
            onClick={() => setPaymentsDialogOpen(true)}
            className="group flex flex-col items-center justify-center gap-2 px-5 py-6 rounded-2xl border-2 badge-danger font-semibold text-[15px] transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(214,69,69,0.24)] active:scale-[0.97]"
          >
            <Wallet size={28} />
            Cartera de pendientes
          </button>
        </div>
      </Section>

      {/* Patient data or card */}
      <Section
        title="Datos del Paciente"
        icon={<User size={20} />}
        right={
          hasAllergy &&
          !isEditingPatient && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-base font-bold shadow-lg">
              <AlertTriangle size={20} className="animate-pulse" />
              ALERGIA
            </div>
          )
        }
      >
        {isEditingPatient ? (
          <>
            <PatientForm value={patient} onChange={setPatient} />
            {!hasPatientData && (
              <Alert variant="warning" className="mt-4">
                Por favor completa al menos el nombre y cédula del paciente para
                poder guardar.
              </Alert>
            )}
          </>
        ) : (
          <PatientCard
            patient={patient}
            onEdit={() => setIsEditingPatient(true)}
          />
        )}
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
          <OdontogramDiagnosisSection
            toothDx={toothDx}
            onToothDxChange={onToothDxChange}
            diagnosisFromTeeth={diagnosisFromTeeth}
            manualDiagnosis={manualDiagnosis}
            onManualDiagnosisChange={setManualDiagnosis}
          />
        </TabsContent>

        {/* Tab 2: Sessions */}
        <TabsContent value="procedures">
          <Section
            title="Evolución y Procedimientos"
            icon={<Activity size={20} />}
          >
            <SessionsTable
              sessions={sessions}
              onSessionsChange={setSessions}
              procedureTemplates={procedureTemplates}
              onUpdateTemplates={updateProcedureTemplates}
              signers={signers}
              onSignersChange={reloadSigners}
              reasonTypes={reasonTypes}
              paymentMethods={paymentMethods}
              onReasonTypesChange={handleReasonTypesChange}
            />
          </Section>
        </TabsContent>

        {/* Tab 3: Financial history */}
        <TabsContent value="financial">
          {(() => {
            const savedSessions = sessions.filter(
              (s) => s.session.is_saved === true,
            );

            return patient.id && savedSessions.length > 0 ? (
              <Section icon={<Wallet size={20} />} title="Historial Financiero">
                <FinancialHistoryBlock
                  sessions={savedSessions}
                  onQuickPayment={() => setQuickPaymentOpen(true)}
                />
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
            <Attachments
              files={attachments}
              onFilesChange={setAttachments}
              onFileDelete={handleDeleteAttachment}
              patientName={patient.full_name}
            />
          </Section>
        </TabsContent>
      </Tabs>

      {/* Floating Action Buttons */}
      <SaveFloatingButton
        visible={showFAB}
        hasChanges={hasAnyChanges}
        changesCount={changesCount}
        onSave={handleSaveWrapper}
      />
      <FloatingActionButton
        visible={showFAB}
        onNewRecord={handleNewWrapper}
        onPrint={handlePreview}
        onSearch={() => setSearchDialogOpen(true)}
        onPendingPayments={() => setPaymentsDialogOpen(true)}
      />
    </>
  );
}
