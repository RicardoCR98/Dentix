# Implementación: Layout con Pestañas - Ejemplos de Código

**Documento complementario a:** `UX_TABBED_LAYOUT_DESIGN.md`
**Fecha:** 2025-12-10

Este documento contiene código listo para implementar el diseño de pestañas propuesto.

---

## 1. ESTRUCTURA DE COMPONENTES

### 1.1 PatientHeader.tsx (Sección Fija)

```tsx
// src/pages/PatientsPage/components/PatientHeader.tsx
import { memo } from "react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Alert } from "../../../components/ui/Alert";
import {
  Plus,
  Save,
  FileDown,
  Search,
  Wallet,
  User,
  CreditCard,
  Calendar,
  Phone,
  AlertTriangle,
} from "lucide-react";
import type { Patient } from "../../../lib/types";
import ThemePanel from "../../../components/ThemePanel";

interface PatientHeaderProps {
  patient: Patient | null;
  isNewPatient: boolean;
  isSaving: boolean;
  onNew: () => void;
  onSave: () => void;
  onExport: () => void;
  onSearch: () => void;
  onOpenCartera: () => void;
  onEditPatient: () => void;
}

export const PatientHeader = memo(function PatientHeader({
  patient,
  isNewPatient,
  isSaving,
  onNew,
  onSave,
  onExport,
  onSearch,
  onOpenCartera,
  onEditPatient,
}: PatientHeaderProps) {
  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  return (
    <div className="sticky top-0 z-20 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] backdrop-blur-sm bg-opacity-95">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={onNew}
            size="default"
            disabled={isSaving}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva Historia</span>
          </Button>

          <Button
            variant="secondary"
            onClick={onSave}
            size="default"
            disabled={isSaving || !patient}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                <span className="hidden sm:inline">Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span className="hidden sm:inline">Guardar</span>
                <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 text-xs rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
                  Ctrl+S
                </kbd>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onExport}
            size="default"
            disabled={!patient}
          >
            <FileDown size={16} />
            <span className="hidden md:inline">Imprimir</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onSearch}
            size="default"
          >
            <Search size={16} />
            <span className="hidden md:inline">Buscar</span>
            <kbd className="hidden lg:inline ml-2 px-1.5 py-0.5 text-xs rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
              Ctrl+K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            onClick={onOpenCartera}
            size="default"
          >
            <Wallet size={16} />
            <span className="hidden md:inline">Cartera</span>
          </Button>

          <ThemePanel />
        </div>
      </div>

      {/* Card de paciente */}
      <div className="px-6 py-3">
        {!patient ? (
          <Alert variant="info" className="py-3">
            <div className="flex items-center gap-3">
              <User size={18} />
              <span className="text-sm">
                No hay paciente seleccionado. Usa{" "}
                <kbd className="px-1.5 py-0.5 text-xs rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                  Ctrl+K
                </kbd>{" "}
                para buscar o crea uno nuevo.
              </span>
            </div>
          </Alert>
        ) : (
          <div
            className="p-4 rounded-lg border-2 border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand)/0.3)] flex items-center justify-center text-white font-bold text-xl shrink-0 border-2 border-[hsl(var(--brand))]">
                {patient.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate">
                  {patient.full_name?.toUpperCase() || "Sin nombre"}
                </h4>
                <div className="flex flex-wrap gap-3 text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {patient.doc_id && (
                    <span className="flex items-center gap-1">
                      <CreditCard size={10} /> {patient.doc_id}
                    </span>
                  )}
                  {patient.date_of_birth && calculateAge(patient.date_of_birth) !== null && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {calculateAge(patient.date_of_birth)} años
                    </span>
                  )}
                  {patient.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={10} /> {patient.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Alertas críticas */}
              {patient.allergy_detail && (
                <Badge variant="danger" className="animate-pulse">
                  <AlertTriangle size={12} />
                  <span className="ml-1">Alergia</span>
                </Badge>
              )}

              {/* Acción de editar */}
              {!isNewPatient && (
                <Button variant="ghost" size="sm" onClick={onEditPatient}>
                  Editar datos
                </Button>
              )}
            </div>

            {/* Anamnesis y alergias (colapsables) */}
            {(patient.anamnesis || patient.allergy_detail) && (
              <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] grid gap-2 md:grid-cols-2 text-sm">
                {patient.anamnesis && (
                  <div className="text-xs">
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      Anamnesis:
                    </span>{" "}
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {patient.anamnesis}
                    </span>
                  </div>
                )}
                {patient.allergy_detail && (
                  <div className="text-xs">
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      Detalle de alergia:
                    </span>{" "}
                    <span className="text-red-600 dark:text-red-300">
                      {patient.allergy_detail}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

PatientHeader.displayName = "PatientHeader";
```

---

### 1.2 PatientTabs.tsx (Sistema de Pestañas)

```tsx
// src/pages/PatientsPage/components/PatientTabs.tsx
import { memo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/Tabs";
import { Badge } from "../../../components/ui/Badge";
import {
  Stethoscope,
  Activity,
  Wallet,
  Paperclip,
  CheckCircle,
} from "lucide-react";
import { ClinicTab } from "./tabs/ClinicTab";
import { EvolutionTab } from "./tabs/EvolutionTab";
import { FinancesTab } from "./tabs/FinancesTab";
import { AttachmentsTab } from "./tabs/AttachmentsTab";
import type { PatientTabsProps } from "../types";

export const PatientTabs = memo(function PatientTabs(props: PatientTabsProps) {
  const {
    activeTab,
    onTabChange,
    // Indicators
    hasToothDx,
    hasDiagnosis,
    sessionsCount,
    totalBalance,
    attachmentsCount,
  } = props;

  // Indicadores de completitud
  const isClinicComplete = hasToothDx || hasDiagnosis;
  const hasEvolutionData = sessionsCount > 0;
  const hasFinancialData = sessionsCount > 0;
  const hasAttachments = attachmentsCount > 0;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="px-6 mt-4">
      <TabsList className="w-full grid grid-cols-4 border-b border-[hsl(var(--border))] rounded-none bg-transparent">
        {/* Tab 1: Clínico */}
        <TabsTrigger value="clinico" className="gap-2 data-[state=active]:text-[hsl(var(--info))]">
          <Stethoscope size={16} />
          <span className="hidden sm:inline">Clínico</span>
          {isClinicComplete && (
            <Badge variant="success" className="ml-auto sm:ml-2 h-5 w-5 p-0 flex items-center justify-center">
              <CheckCircle size={12} />
            </Badge>
          )}
        </TabsTrigger>

        {/* Tab 2: Evolución */}
        <TabsTrigger value="evolucion" className="gap-2 data-[state=active]:text-[hsl(var(--success))]">
          <Activity size={16} />
          <span className="hidden sm:inline">Evolución</span>
          {hasEvolutionData && (
            <Badge variant="info" className="ml-auto sm:ml-2 h-5 min-w-5 px-1.5 text-xs">
              {sessionsCount}
            </Badge>
          )}
        </TabsTrigger>

        {/* Tab 3: Finanzas */}
        <TabsTrigger value="finanzas" className="gap-2 data-[state=active]:text-[hsl(var(--warning))]">
          <Wallet size={16} />
          <span className="hidden sm:inline">Finanzas</span>
          {hasFinancialData && totalBalance > 0 && (
            <Badge variant="danger" className="ml-auto sm:ml-2 h-5 px-1.5 text-xs whitespace-nowrap">
              ${totalBalance}
            </Badge>
          )}
        </TabsTrigger>

        {/* Tab 4: Adjuntos */}
        <TabsTrigger value="adjuntos" className="gap-2 data-[state=active]:text-[hsl(var(--brand))]">
          <Paperclip size={16} />
          <span className="hidden sm:inline">Adjuntos</span>
          {hasAttachments && (
            <Badge variant="default" className="ml-auto sm:ml-2 h-5 min-w-5 px-1.5 text-xs">
              {attachmentsCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Contenido de tabs */}
      <TabsContent value="clinico" className="py-6">
        <ClinicTab {...props} />
      </TabsContent>

      <TabsContent value="evolucion" className="py-6">
        <EvolutionTab {...props} />
      </TabsContent>

      <TabsContent value="finanzas" className="py-6">
        <FinancesTab {...props} />
      </TabsContent>

      <TabsContent value="adjuntos" className="py-6">
        <AttachmentsTab {...props} />
      </TabsContent>
    </Tabs>
  );
});

PatientTabs.displayName = "PatientTabs";
```

---

### 1.3 ClinicTab.tsx

```tsx
// src/pages/PatientsPage/components/tabs/ClinicTab.tsx
import { memo } from "react";
import Section from "../../../../components/Section";
import ReasonTypeSelect from "../../../../components/ReasonTypeSelect";
import Odontogram from "../../../../components/Odontogram";
import DiagnosisArea from "../../../../components/DiagnosisArea";
import { Textarea } from "../../../../components/ui/Textarea";
import { FileText, Stethoscope } from "lucide-react";
import type { PatientTabsProps } from "../../types";

export const ClinicTab = memo(function ClinicTab({
  session,
  onSessionChange,
  reasonTypes,
  onReasonTypesChange,
  toothDx,
  onToothDxChange,
  diagnosisFromTeeth,
  manualDiagnosis,
  onManualDiagnosisChange,
  fullDiagnosis,
}: PatientTabsProps) {
  return (
    <div className="space-y-6">
      {/* Motivo de consulta */}
      <Section
        icon={<FileText size={20} />}
        title="Motivo de Consulta"
        collapsible
        defaultOpen
      >
        <div className="grid md:grid-cols-2 gap-4">
          <ReasonTypeSelect
            value={session.reason_type || ""}
            onChange={(val) => onSessionChange({ ...session, reason_type: val })}
            reasonTypes={reasonTypes}
            onReasonTypesChange={onReasonTypesChange}
          />
          <Textarea
            label="Detalle adicional"
            value={session.reason_detail || ""}
            onChange={(e) =>
              onSessionChange({ ...session, reason_detail: e.target.value })
            }
            placeholder="Ej: Dolor agudo en molar superior derecho hace 3 días"
            rows={2}
          />
        </div>
      </Section>

      {/* Odontograma */}
      <Section
        icon={<Stethoscope size={20} />}
        title="Odontograma"
        collapsible
        defaultOpen
      >
        <Odontogram
          value={toothDx}
          onChange={onToothDxChange}
          mode="permanent"
        />
      </Section>

      {/* Diagnóstico */}
      <Section
        icon={<FileText size={20} />}
        title="Diagnóstico Clínico"
        collapsible
        defaultOpen
      >
        <DiagnosisArea
          autoGenerated={diagnosisFromTeeth}
          manualDiagnosis={manualDiagnosis}
          onManualChange={onManualDiagnosisChange}
          fullDiagnosis={fullDiagnosis}
        />
      </Section>
    </div>
  );
});

ClinicTab.displayName = "ClinicTab";
```

---

### 1.4 EvolutionTab.tsx

```tsx
// src/pages/PatientsPage/components/tabs/EvolutionTab.tsx
import { memo } from "react";
import SessionsTable from "../../../../components/sessions/SessionsTable";
import type { PatientTabsProps } from "../../types";

export const EvolutionTab = memo(function EvolutionTab({
  sessions,
  onSessionsChange,
  procedureTemplates,
  onUpdateTemplates,
  signers,
  onSignersChange,
  reasonTypes,
  paymentMethods,
  onReasonTypesChange,
}: PatientTabsProps) {
  return (
    <div>
      <SessionsTable
        sessions={sessions}
        onSessionsChange={onSessionsChange}
        procedureTemplates={procedureTemplates}
        onUpdateTemplates={onUpdateTemplates}
        signers={signers}
        onSignersChange={onSignersChange}
        reasonTypes={reasonTypes}
        paymentMethods={paymentMethods}
        onReasonTypesChange={onReasonTypesChange}
      />
    </div>
  );
});

EvolutionTab.displayName = "EvolutionTab";
```

---

### 1.5 FinancesTab.tsx

```tsx
// src/pages/PatientsPage/components/tabs/FinancesTab.tsx
import { memo, useMemo } from "react";
import { FinancialHistoryBlock } from "../../../../components/FinancialHistoryBlock";
import { Button } from "../../../../components/ui/Button";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";
import type { PatientTabsProps } from "../../types";

export const FinancesTab = memo(function FinancesTab({
  sessions,
  onQuickPaymentOpen,
}: PatientTabsProps) {
  // Calcular totales
  const totals = useMemo(() => {
    const totalBudget = sessions.reduce((sum, s) => sum + (s.session.budget || 0), 0);
    const totalPayment = sessions.reduce((sum, s) => sum + (s.session.payment || 0), 0);
    const totalDiscount = sessions.reduce((sum, s) => sum + (s.session.discount || 0), 0);
    const totalBalance = sessions.reduce((sum, s) => sum + (s.session.balance || 0), 0);

    return { totalBudget, totalPayment, totalDiscount, totalBalance };
  }, [sessions]);

  // Filtrar sesiones guardadas
  const savedSessions = useMemo(
    () => sessions.filter((s) => s.session.is_saved),
    [sessions]
  );

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de totales */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total presupuestado */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Presupuestado
            </div>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(totals.totalBudget)}
          </div>
        </div>

        {/* Total abonado */}
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
              Abonado
            </div>
            <DollarSign size={16} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totals.totalPayment)}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {totals.totalBudget > 0
              ? `${Math.round((totals.totalPayment / totals.totalBudget) * 100)}% pagado`
              : "0% pagado"}
          </div>
        </div>

        {/* Saldo pendiente */}
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
              Saldo Pendiente
            </div>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totals.totalBalance)}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            {totals.totalBudget > 0
              ? `${Math.round((totals.totalBalance / totals.totalBudget) * 100)}% pendiente`
              : "0% pendiente"}
          </div>
        </div>

        {/* Total descuentos */}
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              Descuentos
            </div>
            <Percent size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {formatCurrency(totals.totalDiscount)}
          </div>
        </div>
      </div>

      {/* Botón de abono rápido */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={onQuickPaymentOpen}>
          <DollarSign size={16} />
          Registrar Abono Rápido
        </Button>
      </div>

      {/* Tabla de transacciones */}
      <FinancialHistoryBlock
        sessions={savedSessions}
        allSessions={sessions}
        onQuickPayment={onQuickPaymentOpen}
      />
    </div>
  );
});

FinancesTab.displayName = "FinancesTab";
```

---

### 1.6 AttachmentsTab.tsx

```tsx
// src/pages/PatientsPage/components/tabs/AttachmentsTab.tsx
import { memo } from "react";
import Attachments from "../../../../components/Attachments";
import type { PatientTabsProps } from "../../types";

export const AttachmentsTab = memo(function AttachmentsTab({
  attachments,
  onAttachmentsChange,
  onFileDelete,
  patientName,
}: PatientTabsProps) {
  return (
    <div>
      <Attachments
        files={attachments}
        onFilesChange={onAttachmentsChange}
        onFileDelete={onFileDelete}
        patientName={patientName}
        readOnly={false}
      />
    </div>
  );
});

AttachmentsTab.displayName = "AttachmentsTab";
```

---

## 2. TIPOS Y INTERFACES

```tsx
// src/pages/PatientsPage/types.ts
import type {
  Patient,
  Session,
  ToothDx,
  VisitWithProcedures,
  AttachmentFile,
  ProcedureTemplate,
  ReasonType,
  PaymentMethod,
} from "../../lib/types";

export interface PatientTabsProps {
  // Estado principal
  patient: Patient | null;
  session: Session;
  toothDx: ToothDx;
  sessions: VisitWithProcedures[];
  attachments: AttachmentFile[];

  // Datos auxiliares
  procedureTemplates: ProcedureTemplate[];
  signers: Array<{ id: number; name: string }>;
  reasonTypes: ReasonType[];
  paymentMethods: PaymentMethod[];

  // Diagnóstico
  diagnosisFromTeeth: string;
  manualDiagnosis: string;
  fullDiagnosis: string;

  // Tab activo
  activeTab: string;

  // Indicadores
  hasToothDx: boolean;
  hasDiagnosis: boolean;
  sessionsCount: number;
  totalBalance: number;
  attachmentsCount: number;

  // Callbacks
  onTabChange: (tab: string) => void;
  onSessionChange: (session: Session) => void;
  onToothDxChange: (toothDx: ToothDx) => void;
  onManualDiagnosisChange: (text: string) => void;
  onSessionsChange: (sessions: VisitWithProcedures[]) => void;
  onAttachmentsChange: (files: AttachmentFile[]) => void;
  onUpdateTemplates: (items: Array<{
    name: string;
    unit_price: number;
    procedure_template_id?: number;
  }>) => Promise<void>;
  onSignersChange: () => Promise<void>;
  onReasonTypesChange: () => Promise<void>;
  onFileDelete?: (file: AttachmentFile) => Promise<void>;
  onQuickPaymentOpen: () => void;

  // Info adicional
  patientName?: string;
}
```

---

## 3. CUSTOM HOOKS

### 3.1 usePatientsKeyboard

```tsx
// src/pages/PatientsPage/hooks/usePatientsKeyboard.ts
import { useEffect } from "react";

interface KeyboardHandlers {
  onSearch: () => void;
  onSave: () => void;
  onNew: () => void;
  onTabChange: (tab: string) => void;
}

export function usePatientsKeyboard(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // No ejecutar shortcuts si está escribiendo en input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Permitir Ctrl+S incluso en inputs
        if (!(mod && e.key === "s")) {
          return;
        }
      }

      // Buscar paciente
      if (mod && e.key === "k") {
        e.preventDefault();
        handlers.onSearch();
      }

      // Guardar
      if (mod && e.key === "s") {
        e.preventDefault();
        handlers.onSave();
      }

      // Nueva historia
      if (mod && e.key === "n") {
        e.preventDefault();
        handlers.onNew();
      }

      // Tab shortcuts
      if (mod && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const tabMap = {
          "1": "clinico",
          "2": "evolucion",
          "3": "finanzas",
          "4": "adjuntos",
        };
        handlers.onTabChange(tabMap[e.key as keyof typeof tabMap]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
```

---

## 4. INTEGRACIÓN EN PatientsPage.tsx

```tsx
// src/pages/PatientsPage.tsx (versión refactorizada)
import { useState, useCallback, useMemo, useEffect } from "react";
import { PatientHeader } from "./components/PatientHeader";
import { PatientTabs } from "./components/PatientTabs";
import PatientForm from "../../components/PatientForm";
import { usePatientsKeyboard } from "./hooks/usePatientsKeyboard";
import type { Patient, Session, ToothDx, VisitWithProcedures, AttachmentFile } from "../../lib/types";
// ... otros imports

export function PatientsPage() {
  // Estado principal
  const [patient, setPatient] = useState<Patient | null>(null);
  const [session, setSession] = useState<Session>(initialSession);
  const [toothDx, setToothDx] = useState<ToothDx>({});
  const [sessions, setSessions] = useState<VisitWithProcedures[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [manualDiagnosis, setManualDiagnosis] = useState("");

  // UI State
  const [activeTab, setActiveTab] = useState("clinico");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ... otros estados

  // Diagnóstico generado
  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(toothDx)
      .sort((a, b) => +a - +b)
      .map((n) =>
        toothDx[n]?.length ? `Diente ${n}: ${toothDx[n].join(", ")}` : ""
      )
      .filter(Boolean);
    return lines.join("\n");
  }, [toothDx]);

  const fullDiagnosis = useMemo(() => {
    const parts: string[] = [];
    if (diagnosisFromTeeth) parts.push(diagnosisFromTeeth);
    if (manualDiagnosis.trim()) parts.push(manualDiagnosis.trim());
    return parts.join("\n\n");
  }, [diagnosisFromTeeth, manualDiagnosis]);

  // Indicadores para tabs
  const hasToothDx = Object.keys(toothDx).length > 0;
  const hasDiagnosis = Boolean(diagnosisFromTeeth || manualDiagnosis);
  const sessionsCount = sessions.length;
  const totalBalance = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.session.balance || 0), 0),
    [sessions]
  );
  const attachmentsCount = attachments.length;

  // Handlers
  const handleNew = useCallback(() => {
    // ... lógica existente
    setActiveTab("clinico");
    setIsNewPatient(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // ... lógica existente de guardado
      toast.success("Guardado exitoso", "Historia clínica guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar", error.message);
    } finally {
      setIsSaving(false);
    }
  }, [patient, session, sessions, attachments]);

  const handleSearch = useCallback(() => {
    setSearchDialogOpen(true);
  }, []);

  const handleOpenCartera = useCallback(() => {
    setPaymentsDialogOpen(true);
    setActiveTab("finanzas");
  }, []);

  // Keyboard shortcuts
  usePatientsKeyboard({
    onSearch: handleSearch,
    onSave: handleSave,
    onNew: handleNew,
    onTabChange: setActiveTab,
  });

  // Persistir tab activo
  useEffect(() => {
    localStorage.setItem("dentix_active_tab", activeTab);
  }, [activeTab]);

  // Restaurar tab al montar
  useEffect(() => {
    const savedTab = localStorage.getItem("dentix_active_tab");
    if (savedTab && ["clinico", "evolucion", "finanzas", "adjuntos"].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header fijo */}
      <PatientHeader
        patient={patient}
        isNewPatient={isNewPatient}
        isSaving={isSaving}
        onNew={handleNew}
        onSave={handleSave}
        onExport={handleExport}
        onSearch={handleSearch}
        onOpenCartera={handleOpenCartera}
        onEditPatient={() => setIsNewPatient(true)}
      />

      {/* Formulario de paciente nuevo (inline) */}
      {isNewPatient && (
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
          <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
          <PatientForm
            value={patient || initialPatient}
            onChange={setPatient}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsNewPatient(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsNewPatient(false);
                setActiveTab("clinico");
              }}
            >
              Continuar con historia clínica
            </Button>
          </div>
        </div>
      )}

      {/* Sistema de tabs */}
      <PatientTabs
        // Estado
        patient={patient}
        session={session}
        toothDx={toothDx}
        sessions={sessions}
        attachments={attachments}
        // Datos auxiliares
        procedureTemplates={procedureTemplates}
        signers={signers}
        reasonTypes={reasonTypes}
        paymentMethods={paymentMethods}
        // Diagnóstico
        diagnosisFromTeeth={diagnosisFromTeeth}
        manualDiagnosis={manualDiagnosis}
        fullDiagnosis={fullDiagnosis}
        // Tab activo
        activeTab={activeTab}
        // Indicadores
        hasToothDx={hasToothDx}
        hasDiagnosis={hasDiagnosis}
        sessionsCount={sessionsCount}
        totalBalance={totalBalance}
        attachmentsCount={attachmentsCount}
        // Callbacks
        onTabChange={setActiveTab}
        onSessionChange={setSession}
        onToothDxChange={setToothDx}
        onManualDiagnosisChange={setManualDiagnosis}
        onSessionsChange={setSessions}
        onAttachmentsChange={setAttachments}
        onUpdateTemplates={updateProcedureTemplates}
        onSignersChange={loadSigners}
        onReasonTypesChange={loadReasonTypes}
        onFileDelete={deleteAttachment}
        onQuickPaymentOpen={() => setQuickPaymentOpen(true)}
        patientName={patient?.full_name}
      />

      {/* Diálogos existentes */}
      {/* ... PatientSearchDialog, PendingPaymentsDialog, etc. */}
    </div>
  );
}
```

---

## 5. ESTILOS ADICIONALES

```css
/* src/pages/PatientsPage/styles.css */

/* Smooth scroll behavior dentro de tabs */
.tab-content {
  scroll-behavior: smooth;
}

/* Animación de entrada de tab content */
@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

[role="tabpanel"] {
  animation: tabFadeIn 200ms ease-out;
}

/* Sticky header con backdrop blur */
.patient-header {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Mobile: tabs con scroll horizontal */
@media (max-width: 767px) {
  [role="tablist"] {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  [role="tablist"]::-webkit-scrollbar {
    display: none;
  }

  [role="tab"] {
    flex-shrink: 0;
    min-width: 120px;
  }
}

/* Indicador de tab activo (mejora visual) */
[role="tab"][data-state="active"]::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: currentColor;
  border-radius: 2px 2px 0 0;
  animation: slideIn 200ms ease-out;
}

@keyframes slideIn {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* Reducir movimiento para usuarios con preferencia */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. TESTING

```tsx
// src/pages/PatientsPage/__tests__/PatientTabs.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { PatientTabs } from "../components/PatientTabs";

describe("PatientTabs", () => {
  const mockProps = {
    activeTab: "clinico",
    onTabChange: jest.fn(),
    hasToothDx: false,
    hasDiagnosis: false,
    sessionsCount: 0,
    totalBalance: 0,
    attachmentsCount: 0,
    // ... otros props mínimos
  };

  it("renders all 4 tabs", () => {
    render(<PatientTabs {...mockProps} />);

    expect(screen.getByText("Clínico")).toBeInTheDocument();
    expect(screen.getByText("Evolución")).toBeInTheDocument();
    expect(screen.getByText("Finanzas")).toBeInTheDocument();
    expect(screen.getByText("Adjuntos")).toBeInTheDocument();
  });

  it("shows badge when there are sessions", () => {
    render(<PatientTabs {...mockProps} sessionsCount={3} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onTabChange when clicking a tab", () => {
    render(<PatientTabs {...mockProps} />);

    fireEvent.click(screen.getByText("Finanzas"));

    expect(mockProps.onTabChange).toHaveBeenCalledWith("finanzas");
  });

  it("shows check icon when clinic data is complete", () => {
    render(<PatientTabs {...mockProps} hasToothDx={true} />);

    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });
});
```

---

## CONCLUSIÓN

Este código está listo para implementar. Los pasos recomendados son:

1. Crear estructura de carpetas en `src/pages/PatientsPage/`
2. Copiar componentes en orden: PatientHeader → PatientTabs → Tabs individuales
3. Crear tipos en `types.ts`
4. Implementar custom hook de keyboard
5. Refactorizar `PatientsPage.tsx` principal
6. Agregar estilos CSS
7. Testing manual y automático

**Tiempo estimado:** 4-5 días de desarrollo completo
