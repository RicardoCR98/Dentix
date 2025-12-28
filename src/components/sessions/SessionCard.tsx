// src/components/sessions/SessionCard.tsx
// Version: 4.1 - UX optimized with container queries
import { memo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  FileText,
  Edit3,
  Plus,
  Save,
  X,
  Stethoscope,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { DatePicker } from "../ui/DatePicker";
import SignerSelect from "../SignerSelect";
import ReasonTypeSelect from "../ReasonTypeSelect";
import { ProceduresSection } from "./ProceduresSection";
import { FinancialSection } from "./FinancialSection";
import { ObservationsTextarea } from "./ObservationsTextarea";
import type {
  SessionWithItems,
  ReasonType,
  PaymentMethod,
} from "../../lib/types";
import { DebouncedReasonTextarea } from "./DebouncedReasonTextarea";
import type { TemplateContext } from "../../lib/templates/templateProcessor";

interface SessionCardProps {
  session: SessionWithItems;
  displayIndex: number;
  isExpanded: boolean;
  isEditable: boolean;
  inEditMode: boolean;
  isActive?: boolean; // NEW: Visual indicator for active session
  manualBudgetEnabled: boolean;
  signers: Array<{ id: number; name: string }>;
  reasonTypes: ReasonType[];
  paymentMethods: PaymentMethod[];
  previousBalance: number;

  onToggle: () => void;
  onDateChange: (date: string) => void;
  onDelete: () => void;
  onViewReadOnly: () => void;

  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  onCancelEditMode: () => void;

  onAddProcedure: () => void;

  onManualBudgetToggle: (enabled: boolean) => void;
  onBudgetChange: (value: number) => void;
  onDiscountChange: (value: number) => void;
  onPaymentChange: (value: number) => void;
  onPaymentMethodChange: (value: number | undefined) => void;
  onPaymentNotesChange: (value: string) => void;
  onSignerChange: (value: string) => void;
  onClinicalNotesChange: (value: string) => void;
  onReasonTypeChange: (value: string) => void;
  onReasonDetailChange: (value: string) => void;
  onSignersChange: () => Promise<void>;
  onReasonTypesChange: () => Promise<void>;

  onProcedureNameChange: (itemIdx: number, value: string) => void;
  onProcedureUnitChange: (itemIdx: number, value: string) => void;
  onProcedureQtyChange: (itemIdx: number, value: string) => void;
  onProcedureActiveChange: (itemIdx: number, value: boolean) => void;
  onProcedureRemove: (itemIdx: number) => void;

  templateContext?: TemplateContext;
}

export const SessionCard = memo(
  ({
    session,
    displayIndex,
    isExpanded,
    isEditable,
    inEditMode,
    isActive = false, // NEW: Destructure isActive with default
    previousBalance,
    signers,
    reasonTypes,
    paymentMethods,

    onToggle,
    onDateChange,
    onDelete,
    onViewReadOnly,

    onEnterEditMode,
    onExitEditMode,
    onCancelEditMode,

    onAddProcedure,
    onBudgetChange,
    onDiscountChange,
    onPaymentChange,
    onPaymentMethodChange,
    onPaymentNotesChange,
    onSignerChange,
    onClinicalNotesChange,
    onReasonTypeChange,
    onReasonDetailChange,
    onSignersChange,
    onReasonTypesChange,

    onProcedureNameChange,
    onProcedureUnitChange,
    onProcedureQtyChange,
    onProcedureActiveChange,
    onProcedureRemove,

    templateContext,
  }: SessionCardProps) => {
    const activeProcs = session.items.filter((it) => it.quantity > 0);

    // Determine what to show based on state
    const reasonDetail = session.session.reason_detail?.trim() || "";
    const isSystemPayment = reasonDetail
      .toLowerCase()
      .startsWith("sistema: abono");
    const isPaymentOnly =
      session.session.reason_type === "Abono a cuenta" || isSystemPayment;
    const showFinancial = !session.session.is_saved;
    const showProcedures = !isPaymentOnly;

    // Format date for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    };

    return (
      <div
        className={cn(
          "card cardh overflow-hidden transition-all duration-200",
          isExpanded && "ring-2 ring-[hsl(var(--brand)/0.3)]",
          !isExpanded && "hover:border-[hsl(var(--brand))]",
          isActive && "border-l-4 border-l-[hsl(var(--brand))]", // NEW: Active session indicator
        )}
      >
        {/* ============================================
            RESUMEN COLAPSADO - Vista previa optimizada
            ============================================ */}
        <div className="p-4 cursor-pointer" onClick={onToggle}>
          <div className="flex items-start justify-between gap-4">
            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-1 min-w-0">
              {/* Header con número de sesión y tipo */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand))]/80 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {displayIndex}
                </div>

                <div className="flex flex-col gap-1">
                  <Badge
                    variant="info"
                    className="rounded-md px-2.5 py-0.5 text-xs font-semibold w-fit"
                  >
                    {session.session.reason_type || "Desconocido"}
                  </Badge>

                  {/* Fecha en formato legible */}
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Calendar size={12} />
                    <span>{formatDate(session.session.date)}</span>
                  </div>
                </div>
              </div>

              {/* Título principal - Motivo/Diagnóstico */}
              <h3 className="font-semibold text-base mb-2 text-[hsl(var(--foreground))] line-clamp-2">
                {session.session.reason_detail?.trim() ||
                  "Sesión sin motivo especificado"}
              </h3>

              {/* Procedimientos realizados - Vista compacta */}
              {activeProcs.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <FileText
                    size={14}
                    className="text-[hsl(var(--muted-foreground))] flex-shrink-0"
                  />
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">
                    {activeProcs
                      .map((p) => p.name)
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
              )}

              {/* Nota clínica - Vista previa */}
              {session.session.clinical_notes && (
                <p className="text-xs italic text-[hsl(var(--muted-foreground))]/80 line-clamp-1 mt-1">
                  "{session.session.clinical_notes}"
                </p>
              )}

              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {session.session.signer && (
                  <Badge
                    variant="default"
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-medium flex items-center gap-1"
                  >
                    <User size={10} />
                    {session.session.signer}
                  </Badge>
                )}

                {session.session.is_saved && (
                  <Badge
                    variant="success"
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                  >
                    Guardada
                  </Badge>
                )}
              </div>
            </div>

            {/* ACCIONES */}
            <div className="flex flex-col flex-shrink-0 self-center border-l-2 border-[hsl(var(--brand))] p-4 border-dashed ">
              <div className="flex gap-1">
                {/* Solo lectura (solo guardado) */}
                {session.session.is_saved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReadOnly();
                    }}
                    title="Ver en modo lectura"
                  >
                    <Eye size={16} />
                  </Button>
                )}

                {/* Eliminar (solo borrador) */}
                {!session.session.is_saved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="hover:bg-red-500/20 hover:text-red-600"
                    title="Eliminar sesión"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}

                {/* Expandir/contraer */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  title={isExpanded ? "Contraer" : "Expandir detalles"}
                >
                  {isExpanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            DETALLE EXPANDIDO - Información completa
            ============================================ */}
        {isExpanded && (
          <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            <div className="p-4 space-y-4">
              {/* CLINICAL SECTION - Información de la sesión */}
              <div className="p-4 card2">
                <h4 className="font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--foreground))]">
                  <Stethoscope size={18} className="text-[hsl(var(--brand))]" />
                  Información de la Sesión
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha de la sesión */}
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">
                      Fecha de la sesión *
                    </label>
                    <DatePicker
                      value={session.session.date}
                      onChange={onDateChange}
                      disabled={!isEditable}
                      className="w-full"
                    />
                  </div>

                  {/* Tipo de Motivo */}
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">
                      Tipo de Motivo *
                    </label>
                    <ReasonTypeSelect
                      value={session.session.reason_type || ""}
                      onChange={onReasonTypeChange}
                      disabled={!isEditable}
                      reasonTypes={reasonTypes}
                      onReasonTypesChange={onReasonTypesChange}
                    />
                  </div>

                  {/* Detalle del Motivo - Ocupa toda la fila */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">
                      Detalle del Motivo / Diagnóstico
                    </label>
                    <DebouncedReasonTextarea
                      value={session.session.reason_detail || ""}
                      onChange={onReasonDetailChange}
                      disabled={!isEditable}
                      templateContext={templateContext}
                    />
                  </div>
                </div>
              </div>

              {/* PROCEDIMIENTOS Y DATOS FINANCIEROS */}
              <div className="card2 p-4 @container">
                {/* HEADER PROCS */}
                {showProcedures && (
                  <div className="flex flex-col sm:flex-row mb-3 gap-3 sm:justify-between sm:items-center">
                    <h4 className="font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
                      <FileText
                        size={18}
                        className="text-[hsl(var(--brand))]"
                      />
                      Procedimientos realizados
                      {!isEditable && (
                        <Badge variant="info" className="text-xs ml-2">
                          Solo lectura
                        </Badge>
                      )}
                    </h4>
                    {isEditable && (
                      <div className="flex gap-2 flex-wrap">
                        {inEditMode ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={onAddProcedure}
                            >
                              <Plus size={16} /> Añadir
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={onCancelEditMode}
                            >
                              <X size={16} /> Cancelar
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={onExitEditMode}
                            >
                              <Save size={16} /> Guardar
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={onEnterEditMode}
                          >
                            <Edit3 size={16} /> Editar plantilla
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* LAYOUT RESPONSIVE CON CONTAINER QUERIES */}
                <div className="@[1000px]:overflow-x-auto">
                  <div
                    className={cn(
                      "flex gap-4",
                      // Layout responsive normal cuando hay procedimientos
                      showProcedures &&
                        "flex-col @[1000px]:flex-row @[1000px]:gap-0 @[1000px]:min-w-[1000px]",
                      // Columna única cuando NO hay procedimientos
                      !showProcedures && !showFinancial && "flex-col",
                    )}
                  >
                    {/* COLUMNA IZQUIERDA - Procedures */}
                    {showProcedures && (
                      <div className="flex-1  @[1000px]:min-w-0">
                        <ProceduresSection
                          items={session.items}
                          isEditable={isEditable}
                          inEditMode={inEditMode}
                          onNameChange={onProcedureNameChange}
                          onUnitChange={onProcedureUnitChange}
                          onQtyChange={onProcedureQtyChange}
                          onActiveChange={onProcedureActiveChange}
                          onRemove={onProcedureRemove}
                        />
                      </div>
                    )}

                    {/* COLUMNA DERECHA */}
                    <div
                      className={cn(
                        "flex",
                        // Si hay múltiples columnas en la derecha, layout responsive
                        (showProcedures || showFinancial) &&
                          "flex-col @[1000px]:flex-row gap-4 @[1000px]:gap-0",
                        // Si es columna única, ocupar todo el ancho
                        !showProcedures && !showFinancial && "w-full",
                      )}
                    >
                      {/* Financial Section */}
                      {showFinancial && (
                        <FinancialSection
                          visit={session.session}
                          isEditable={isEditable}
                          previousBalance={previousBalance}
                          paymentMethods={paymentMethods}
                          onBudgetChange={onBudgetChange}
                          onDiscountChange={onDiscountChange}
                          onPaymentChange={onPaymentChange}
                          onPaymentMethodChange={onPaymentMethodChange}
                          onPaymentNotesChange={onPaymentNotesChange}
                          templateContext={templateContext}
                        />
                      )}

                      {/* Signer and Clinical Notes */}
                      <div
                        className={cn(
                          "flex flex-col",
                          // Si hay otras columnas, usar bordes laterales responsivos
                          (showProcedures || showFinancial) &&
                            "border-t-2 @[1000px]:border-t-0 @[1000px]:border-l-2 border-blue-200",
                          // Si es la única columna, usar borde superior siempre
                          !showProcedures &&
                            !showFinancial &&
                            "border-t-2 border-blue-200 w-full",
                        )}
                      >
                        <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide px-3 py-2.5 border-b-2 border-blue-200 text-center">
                          Firma y Notas Clínicas
                        </div>
                        <div className="flex-1 flex items-center">
                          <div className="w-full px-3 py-3 space-y-3">
                            {/* Firma */}
                            <div>
                              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">
                                Firma del responsable
                              </label>
                              <SignerSelect
                                value={session.session.signer || ""}
                                onChange={onSignerChange}
                                disabled={!isEditable}
                                signers={signers}
                                onSignersChange={onSignersChange}
                              />
                            </div>
                            {/* Clinical Notes */}
                            <div>
                              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">
                                Notas Clínicas
                              </label>
                              <ObservationsTextarea
                                value={session.session.clinical_notes || ""}
                                onChange={onClinicalNotesChange}
                                disabled={!isEditable}
                                templateContext={templateContext}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

SessionCard.displayName = "SessionCard";
