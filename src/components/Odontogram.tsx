// src/components/Odontogram.tsx
import { useMemo, useState, useEffect, memo } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { ToothDx, DiagnosisOption } from "../lib/types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { CheckboxRoot } from "./ui/Checkbox";
import { Input } from "./ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";
import { X, Trash2, Plus, Save, Edit3 } from "lucide-react";
import { cn } from "../lib/cn";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

type Props = {
  value?: ToothDx;
  onChange: (next: ToothDx) => void;
  readOnly?: boolean;
};

const Odontogram = memo(function Odontogram({
  value = {},
  onChange,
  readOnly = false,
}: Props) {
  const [openTooth, setOpenTooth] = useState<string | null>(null);
  const [diagOptions, setDiagOptions] = useState<DiagnosisOption[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOptions, setEditingOptions] = useState<DiagnosisOption[]>([]);
  const [activeTab, setActiveTab] = useState<"adult" | "child">("adult");
  const [isSaving, setIsSaving] = useState(false);
  const isReadOnly = readOnly;

  // Cargar opciones de diagnóstico desde la base de datos
  useEffect(() => {
    // OPTIMIZACIÓN: Evitar múltiples cargas simultáneas con debounce
    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      if (isMounted) {
        await loadDiagnosisOptions();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const loadDiagnosisOptions = async () => {
    try {
      const repo = await getRepository();
      const options = await repo.getDiagnosisOptions();

      // OPTIMIZACIÓN: Los datos por defecto ya están en la BD (migración 003)
      // Solo cargar y usar lo que viene de la BD
      setDiagOptions(options);
    } catch (error) {
      console.error("Error cargando opciones de diagnóstico:", error);
      // En caso de error de BD, mostrar al usuario pero no insertar nada
      alert(
        "Error al cargar opciones de diagnóstico. Por favor recarga la aplicación.",
      );
    }
  };

  const handleEditMode = () => {
    if (isReadOnly) return;
    setIsEditMode(true);
    setEditingOptions(JSON.parse(JSON.stringify(diagOptions)));
  };

  const handleCancelEdit = () => {
    if (isReadOnly) return;
    setIsEditMode(false);
    setEditingOptions([]);
  };

  const handleSaveOptions = async () => {
    // Prevenir múltiples clics
    if (isSaving) return;

    setIsSaving(true);
    try {
      const repo = await getRepository();
      await repo.saveDiagnosisOptions(
        editingOptions.map((opt, idx) => ({
          label: opt.label,
          color: "info",
          sort_order: idx + 1,
        })),
      );

      // OPTIMIZACIÓN: Actualizar estado local SIN recargar desde BD
      // para evitar race condition entre WRITE y READ
      setDiagOptions(editingOptions);
      setIsEditMode(false);
      setEditingOptions([]);
    } catch (error) {
      console.error("Error guardando opciones:", error);
      alert("Error al guardar las opciones. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOption = () => {
    if (isReadOnly) return;
    const newOption: DiagnosisOption = {
      label: " ",
      color: "info",
      sort_order: editingOptions.length + 1,
    };
    setEditingOptions([...editingOptions, newOption]);
  };

  const handleDeleteOption = (index: number) => {
    if (isReadOnly) return;
    setEditingOptions(editingOptions.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (
    index: number,
    field: keyof DiagnosisOption,
    value: string,
  ) => {
    if (isReadOnly) return;
    const updated = [...editingOptions];
    updated[index] = { ...updated[index], [field]: value };
    setEditingOptions(updated);
  };

  // Configuración de dientes adultos (permanentes)
  const adultArches = useMemo(
    () => [
      {
        title: "Cuadrante Superior Derecho",
        range: "18 → 11",
        teeth: Array.from({ length: 8 }, (_, i) => (18 - i).toString()),
      },
      {
        title: "Cuadrante Superior Izquierdo",
        range: "21 → 28",
        teeth: Array.from({ length: 8 }, (_, i) => (21 + i).toString()),
      },
      {
        title: "Cuadrante Inferior Derecho",
        range: "48 → 41",
        teeth: Array.from({ length: 8 }, (_, i) => (48 - i).toString()),
      },
      {
        title: "Cuadrante Inferior Izquierdo",
        range: "31 → 38",
        teeth: Array.from({ length: 8 }, (_, i) => (31 + i).toString()),
      },
    ],
    [],
  );

  // Configuración de dientes infantiles (temporales/de leche)
  const childArches = useMemo(
    () => [
      {
        title: "Cuadrante Superior Derecho",
        range: "55 → 51",
        teeth: Array.from({ length: 5 }, (_, i) => (55 - i).toString()),
      },
      {
        title: "Cuadrante Superior Izquierdo",
        range: "61 → 65",
        teeth: Array.from({ length: 5 }, (_, i) => (61 + i).toString()),
      },
      {
        title: "Cuadrante Inferior Derecho",
        range: "85 → 81",
        teeth: Array.from({ length: 5 }, (_, i) => (85 - i).toString()),
      },
      {
        title: "Cuadrante Inferior Izquierdo",
        range: "71 → 75",
        teeth: Array.from({ length: 5 }, (_, i) => (71 + i).toString()),
      },
    ],
    [],
  );

  const arches = activeTab === "adult" ? adultArches : childArches;

  const toggleDx = (tooth: string, label: string) => {
    if (isReadOnly) return;
    const prev = value[tooth] || [];
    const exists = prev.includes(label);
    const nextList = exists
      ? prev.filter((d) => d !== label)
      : [...prev, label];
    onChange({ ...value, [tooth]: nextList });
  };

  const clearTooth = (tooth: string) => {
    if (isReadOnly) return;
    onChange({ ...value, [tooth]: [] });
    setOpenTooth(null);
  };

  const getDiagnosisCount = () => {
    return Object.values(value || {}).flat().length;
  };

  const renderOdontogramGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {arches.map((arch) => {
        const affectedTeeth = arch.teeth.filter(
          (n) => (value[n] || []).length > 0,
        );

        return (
          <div key={arch.title} className="card p-3 sm:p-4">
            {/* Header del cuadrante (compacto) */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[hsl(var(--border))]">
              <div>
                <h3 className="font-semibold text-sm text-[hsl(var(--foreground))]">
                  {arch.title}
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                  Piezas {arch.range}
                </p>
              </div>
              {affectedTeeth.length > 0 && (
                <Badge variant="info">
                  {affectedTeeth.length} afectada
                  {affectedTeeth.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Grid de dientes (optimizado para mejor usabilidad) */}
            <div className="grid grid-cols-8 gap-3">
              {arch.teeth.map((toothNum) => {
                const diagnoses = value[toothNum] || [];
                const hasDiagnoses = diagnoses.length > 0;
                const isOpen = openTooth === toothNum;

                return (
                  <Popover.Root
                    key={toothNum}
                    open={isOpen}
                    onOpenChange={(open) =>
                      setOpenTooth(open ? toothNum : null)
                    }
                  >
                    <Popover.Trigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "relative h-16 rounded-lg text-center transition-all duration-200",
                          "flex flex-col items-center justify-center gap-1",
                          "hover:scale-110 hover:shadow-xl cursor-pointer",
                          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:ring-offset-2",
                          isOpen && "ring-2 ring-[hsl(var(--brand))] ring-offset-2",
                          hasDiagnoses
                            ? [
                                "border-[3px] border-[hsl(var(--brand))]",
                                "bg-[color-mix(in_oklab,hsl(var(--brand))_25%,transparent)]",
                                "shadow-[0_8px_20px_hsl(var(--brand)/0.25)]",
                                "font-semibold",
                              ]
                            : [
                                "border-2 border-[hsl(var(--border))]",
                                "bg-[hsl(var(--surface))]",
                                "hover:border-[hsl(var(--brand))]",
                              ],
                        )}
                        title={
                          hasDiagnoses
                            ? `Diente ${toothNum}: ${diagnoses.join(", ")}`
                            : `Diente ${toothNum}`
                        }
                      >
                        <span
                          className={cn(
                            "text-base font-bold leading-none",
                            hasDiagnoses
                              ? "text-[hsl(var(--brand))]"
                              : "text-[hsl(var(--foreground))]",
                          )}
                        >
                          {toothNum}
                        </span>
                        {hasDiagnoses && (
                          <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-[hsl(var(--brand))] text-white text-xs font-bold flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse-subtle">
                            {diagnoses.length}
                          </div>
                        )}
                      </button>
                    </Popover.Trigger>

                    <Popover.Portal>
                      <Popover.Content
                        align="center"
                        side="top"
                        sideOffset={8}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        className={cn(
                          "rounded-lg border border-[hsl(var(--border))]",
                          "bg-[hsl(var(--surface))] shadow-lg",
                          "w-auto  p-4 z-50",
                          "data-[state=open]:animate-[scaleIn_150ms_ease-out] ",
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[hsl(var(--border))]">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold text-sm">
                              {toothNum}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                Pieza {toothNum}
                              </div>
                              {hasDiagnoses && !isEditMode && (
                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {diagnoses.length} diagnóstico
                                  {diagnoses.length !== 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isEditMode && (
                              <Button
                                variant="ghost"
                                onClick={handleEditMode}
                                size="sm"
                                className="flex-1 cursor-pointer"
                                disabled={isReadOnly}
                              >
                                <Edit3 size={14} />
                                Editar plantillas
                              </Button>
                            )}
                            <Popover.Close asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0"
                                title="Cerrar"
                              >
                                <X size={14} />
                              </Button>
                            </Popover.Close>
                          </div>
                        </div>

                        {/* Modo Edición */}
                        {isEditMode ? (
                          <>
                            {/* Botones superiores en modo edición */}
                            <div className="flex gap-2 mb-3 cursor-pointer">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleAddOption}
                                className="flex-1 cursor-pointer"
                                disabled={isReadOnly}
                              >
                                <Plus size={14} />
                                Añadir
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="flex-1"
                                disabled={isReadOnly}
                              >
                                <X size={14} />
                                Cancelar
                              </Button>

                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveOptions}
                                disabled={isSaving || isReadOnly}
                                className="flex-1 cursor-pointer"
                              >
                                <Save size={14} />
                                {isSaving ? "Guardando..." : "Guardar"}
                              </Button>
                            </div>

                            {/* Lista de opciones editables */}
                            <div className="space-y-2 mb-3 max-h-[300px] overflow-y-auto">
                              {editingOptions.map((opt, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-2 rounded-md bg-[hsl(var(--muted))]"
                                >
                                  <Input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) =>
                                      handleUpdateOption(
                                        idx,
                                        "label",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Nombre de la opción"
                                    className="flex-1 h-9 text-sm"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteOption(idx)}
                                    className="w-9 h-9 p-0 hover:bg-red-500/20 hover:text-red-600"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          /* Lista de diagnósticos - Modo normal */
                          <div className="space-y-2 mb-3">
                            {diagOptions.map((diag) => {
                              const checked = diagnoses.includes(diag.label);
                              const handleToggle = () => {
                                if (isReadOnly) return;
                                toggleDx(toothNum, diag.label);
                              };
                              return (
                                <label
                                  key={diag.id || diag.label}
                                  className={cn(
                                    "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                    "hover:bg-[hsl(var(--muted))]",
                                    checked && "bg-[hsl(var(--muted))]",
                                  )}
                                  role="checkbox"
                                  aria-checked={checked}
                                  aria-disabled={isReadOnly}
                                  tabIndex={isReadOnly ? -1 : 0}
                                  onClick={handleToggle}
                                  onKeyDown={(e) => {
                                    if (isReadOnly) return;
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleToggle();
                                    }
                                  }}
                                >
                                  <CheckboxRoot
                                    checked={checked}
                                    disabled={isReadOnly}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                  />
                                  <span className="flex-1 text-sm">
                                    {diag.label}
                                  </span>
                                  {checked && (
                                    <Badge
                                      variant={
                                        diag.color as
                                          | "danger"
                                          | "warning"
                                          | "success"
                                          | "info"
                                          | "default"
                                      }
                                      className="text-xs"
                                    >
                                      Activo
                                    </Badge>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Acciones - Solo en modo normal */}
                        {!isEditMode && hasDiagnoses && (
                          <div className="flex gap-2 pt-3 border-t border-[hsl(var(--border))]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearTooth(toothNum)}
                              className="w-full"
                              disabled={isReadOnly}
                            >
                              <X size={14} />
                              Limpiar todo
                            </Button>
                          </div>
                        )}

                        {/* Arrow */}
                        <Popover.Arrow className="fill-[hsl(var(--border))]" />
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold">
            {getDiagnosisCount()}
          </div>
          <div>
            <div className="font-semibold text-[hsl(var(--foreground))]">
              Diagnósticos registrados
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              {Object.keys(value).filter((k) => value[k]?.length).length} piezas
              dentales afectadas
            </div>
          </div>
        </div>

        {getDiagnosisCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({})}
            className="cursor-pointer text-red-600 hover:bg-red-500/10 hover:text-red-700"
          >
            <X size={14} />
            Limpiar todo
          </Button>
        )}
      </div>

      {/* Tabs: Odontograma Adulto / Infantil */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "adult" | "child")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adult">Adulto</TabsTrigger>
          <TabsTrigger value="child">Infantil</TabsTrigger>
        </TabsList>

        <TabsContent value="adult" className="mt-6">
          {renderOdontogramGrid()}
        </TabsContent>

        <TabsContent value="child" className="mt-6">
          {renderOdontogramGrid()}
        </TabsContent>
      </Tabs>
    </div>
  );
});

Odontogram.displayName = "Odontogram";

export default Odontogram;
