// src/components/Odontogram.tsx
import { useMemo, useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { ToothDx, DiagnosisOption } from "../lib/types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { CheckboxRoot } from "./ui/Checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";
import { X, Check, Trash2, Plus, Save, Edit3 } from "lucide-react";
import { cn } from "../lib/cn";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

type Props = {
  value: ToothDx;
  onChange: (next: ToothDx) => void;
};

export default function Odontogram({ value, onChange }: Props) {
  const [openTooth, setOpenTooth] = useState<string | null>(null);
  const [diagOptions, setDiagOptions] = useState<DiagnosisOption[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOptions, setEditingOptions] = useState<DiagnosisOption[]>([]);
  const [activeTab, setActiveTab] = useState<"adult" | "child">("adult");

  // Cargar opciones de diagnóstico desde la base de datos
  useEffect(() => {
    loadDiagnosisOptions();
  }, []);

  const loadDiagnosisOptions = async () => {
    try {
      const repo = await getRepository();
      const options = await repo.getDiagnosisOptions();

      // Si no hay opciones en la BD (primera vez), usar las por defecto
      if (options.length === 0) {
        const defaultOptions: DiagnosisOption[] = [
          { label: "Caries", color: "info", sort_order: 1 },
          { label: "Gingivitis", color: "info", sort_order: 2 },
          { label: "Fractura", color: "info", sort_order: 3 },
          { label: "Pérdida", color: "info", sort_order: 4 },
          { label: "Obturación", color: "info", sort_order: 5 },
          { label: "Endodoncia", color: "info", sort_order: 6 },
        ];
        setDiagOptions(defaultOptions);

        // Guardar las opciones por defecto en la BD para la próxima vez
        await repo.saveDiagnosisOptions(
          defaultOptions.map((opt, idx) => ({
            label: opt.label,
            color: opt.color,
            sort_order: idx + 1,
          })),
        );
      } else {
        setDiagOptions(options);
      }
    } catch (error) {
      console.error("Error cargando opciones de diagnóstico:", error);
      // En caso de error, cargar opciones por defecto
      const fallbackOptions: DiagnosisOption[] = [
        { label: "Caries", color: "info", sort_order: 1 },
        { label: "Gingivitis", color: "info", sort_order: 2 },
        { label: "Fractura", color: "info", sort_order: 3 },
        { label: "Pérdida", color: "info", sort_order: 4 },
        { label: "Obturación", color: "info", sort_order: 5 },
        { label: "Endodoncia", color: "info", sort_order: 6 },
      ];
      setDiagOptions(fallbackOptions);
    }
  };

  const handleEditMode = () => {
    setIsEditMode(true);
    setEditingOptions(JSON.parse(JSON.stringify(diagOptions)));
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingOptions([]);
  };

  const handleSaveOptions = async () => {
    try {
      const repo = await getRepository();
      await repo.saveDiagnosisOptions(
        editingOptions.map((opt, idx) => ({
          label: opt.label,
          color: "info",
          sort_order: idx + 1,
        })),
      );
      await loadDiagnosisOptions();
      setIsEditMode(false);
      setEditingOptions([]);
    } catch (error) {
      console.error("Error guardando opciones:", error);
      alert("Error al guardar las opciones");
    }
  };

  const handleAddOption = () => {
    const newOption: DiagnosisOption = {
      label: " ",
      color: "info",
      sort_order: editingOptions.length + 1,
    };
    setEditingOptions([...editingOptions, newOption]);
  };

  const handleDeleteOption = (index: number) => {
    setEditingOptions(editingOptions.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (
    index: number,
    field: keyof DiagnosisOption,
    value: string,
  ) => {
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
    const prev = value[tooth] || [];
    const exists = prev.includes(label);
    const nextList = exists
      ? prev.filter((d) => d !== label)
      : [...prev, label];
    onChange({ ...value, [tooth]: nextList });
  };

  const clearTooth = (tooth: string) => {
    onChange({ ...value, [tooth]: [] });
    setOpenTooth(null);
  };

  const getDiagnosisCount = () => {
    return Object.values(value).flat().length;
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

            {/* Grid de dientes (ligeramente más compacto) */}
            <div className="grid grid-cols-8 gap-2">
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
                          "relative h-12 rounded-lg text-center border-2 transition-all",
                          "flex flex-col items-center justify-center gap-1",
                          "hover:scale-110 hover:shadow-md cursor-pointer",
                          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:ring-offset-2",
                          hasDiagnoses
                            ? "border-[hsl(var(--brand))] bg-[color-mix(in_oklab,hsl(var(--brand))_15%,transparent)] font-semibold"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--brand))]",
                        )}
                        title={
                          hasDiagnoses
                            ? `Diente ${toothNum}: ${diagnoses.join(", ")}`
                            : `Diente ${toothNum}`
                        }
                      >
                        <span
                          className={cn(
                            "text-sm font-bold leading-none",
                            hasDiagnoses
                              ? "text-[hsl(var(--brand))]"
                              : "text-[hsl(var(--foreground))]",
                          )}
                        >
                          {toothNum}
                        </span>
                        {hasDiagnoses && (
                          <div className="flex gap-0.5">
                            {diagnoses.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 h-1 rounded-full bg-[hsl(var(--brand))]"
                              />
                            ))}
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
                              >
                                <Edit3 size={14} />
                                Editar
                              </Button>
                            )}
                            <Popover.Close asChild>
                              <button
                                className="cursor-pointer w-6 h-6 rounded hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors"
                                aria-label="Cerrar"
                              >
                                <X size={14} />
                              </button>
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
                              >
                                <Plus size={14} />
                                Añadir
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="flex-1"
                              >
                                <X size={14} />
                                Cancelar
                              </Button>

                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveOptions}
                                className="flex-1 cursor-pointer"
                              >
                                <Save size={14} />
                                Guardar
                              </Button>
                            </div>

                            {/* Lista de opciones editables */}
                            <div className="space-y-2 mb-3 max-h-[300px] overflow-y-auto">
                              {editingOptions.map((opt, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-2 rounded-md bg-[hsl(var(--muted))]"
                                >
                                  <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) =>
                                      handleUpdateOption(
                                        idx,
                                        "label",
                                        e.target.value,
                                      )
                                    }
                                    className="flex-1 px-2 py-1 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded"
                                    placeholder="Nombre de la opción"
                                  />
                                  <button
                                    onClick={() => handleDeleteOption(idx)}
                                    className="cursor-pointer w-7 h-7 rounded hover:bg-[hsl(var(--surface))] flex items-center justify-center transition-colors text-red-500"
                                    aria-label="Eliminar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          /* Lista de diagnósticos - Modo normal */
                          <div className="space-y-2 mb-3">
                            {diagOptions.map((diag) => {
                              const checked = diagnoses.includes(diag.label);
                              return (
                                <label
                                  key={diag.id || diag.label}
                                  className={cn(
                                    "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                    "hover:bg-[hsl(var(--muted))]",
                                    checked && "bg-[hsl(var(--muted))]",
                                  )}
                                >
                                  <CheckboxRoot
                                    checked={checked}
                                    onCheckedChange={() =>
                                      toggleDx(toothNum, diag.label)
                                    }
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
                        {!isEditMode && (
                          <div className="flex gap-2 pt-3 border-t border-[hsl(var(--border))]">
                            {hasDiagnoses && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => clearTooth(toothNum)}
                                className="flex-1"
                              >
                                <X size={14} />
                                Limpiar
                              </Button>
                            )}
                            <Popover.Close asChild>
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex-1"
                              >
                                <Check size={14} />
                                Confirmar
                              </Button>
                            </Popover.Close>
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
}
