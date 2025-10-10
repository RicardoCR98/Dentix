// src/components/Odontogram.tsx
import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { ToothDx } from "../lib/types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { CheckboxRoot } from "./ui/Checkbox";
import { X, Check } from "lucide-react";
import { cn } from "../lib/cn";

const DIAG_LIST = [
  { id: "Caries", label: "Caries", color: "success" },
  { id: "Gingivitis", label: "Gingivitis", color: "success" },
  { id: "Fractura", label: "Fractura", color: "success" },
  { id: "Pérdida", label: "Pérdida", color: "success" },
  { id: "Obturación", label: "Obturación", color: "success" },
  { id: "Endodoncia", label: "Endodoncia", color: "success" },
] as const;

type Props = {
  value: ToothDx;
  onChange: (next: ToothDx) => void;
};

export default function Odontogram({ value, onChange }: Props) {
  const [openTooth, setOpenTooth] = useState<string | null>(null);

  const arches = useMemo(
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
        title: "Cuadrante Inferior Izquierdo",
        range: "38 → 31",
        teeth: Array.from({ length: 8 }, (_, i) => (38 - i).toString()),
      },
      {
        title: "Cuadrante Inferior Derecho",
        range: "41 → 48",
        teeth: Array.from({ length: 8 }, (_, i) => (41 + i).toString()),
      },
    ],
    []
  );

  const toggleDx = (tooth: string, dx: string) => {
    const prev = value[tooth] || [];
    const exists = prev.includes(dx);
    const nextList = exists ? prev.filter((d) => d !== dx) : [...prev, dx];
    onChange({ ...value, [tooth]: nextList });
  };

  const clearTooth = (tooth: string) => {
    onChange({ ...value, [tooth]: [] });
    setOpenTooth(null);
  };

  const getDiagnosisCount = () => {
    return Object.values(value).flat().length;
  };

  return (
    <div className='space-y-6'>
      {/* Resumen */}
      <div className='flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))]'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold'>
            {getDiagnosisCount()}
          </div>
          <div>
            <div className='font-semibold text-[hsl(var(--foreground))]'>
              Diagnósticos registrados
            </div>
            <div className='text-sm text-[hsl(var(--muted-foreground))]'>
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
            className="cursor-pointer border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface))]"
          >
            <X size={14} />
            Limpiar todo
          </Button>
        )}
        
      </div>

      {/* Odontograma por cuadrantes */}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {arches.map((arch) => {
          const affectedTeeth = arch.teeth.filter(
            (n) => (value[n] || []).length > 0
          );

          return (
            <div key={arch.title} className='card p-3 sm:p-4'>
              {/* Header del cuadrante (compacto) */}
              <div className='flex items-center justify-between mb-2 pb-2 border-b border-[hsl(var(--border))]'>
                <div>
                  <h3 className='font-semibold text-sm text-[hsl(var(--foreground))]'>
                    {arch.title}
                  </h3>
                  <p className='text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5'>
                    Piezas {arch.range}
                  </p>
                </div>
                {affectedTeeth.length > 0 && (
                  <Badge variant='info'>
                    {affectedTeeth.length} afectada
                    {affectedTeeth.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Grid de dientes (ligeramente más compacto) */}
              <div className='grid grid-cols-8 gap-2 '>
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
                          type='button'
                          className={cn(
                            "relative h-12 rounded-lg text-center border-2 transition-all",
                            "flex flex-col items-center justify-center gap-1",
                            "hover:scale-105 hover:shadow-md cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:ring-offset-2",
                            hasDiagnoses
                              ? "border-[hsl(var(--brand))] bg-[color-mix(in_oklab,hsl(var(--brand))_15%,transparent)] font-semibold"
                              : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--brand))]"
                          )}
                          title={
                            hasDiagnoses
                              ? `Diente ${toothNum}: ${diagnoses.join(", ")}`
                              : `Diente ${toothNum}`
                          }
                        >
                          <span
                            className={cn(
                              "text-[11px] font-bold leading-none",
                              hasDiagnoses
                                ? "text-[hsl(var(--brand))]"
                                : "text-[hsl(var(--foreground))]"
                            )}
                          >
                            {toothNum}
                          </span>
                          {hasDiagnoses && (
                            <div className='flex gap-0.5'>
                              {diagnoses.slice(0, 3).map((_, i) => (
                                <div
                                  key={i}
                                  className='w-1 h-1 rounded-full bg-[hsl(var(--brand))]'
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
                          "w-[320px] p-4 z-50",
                          "data-[state=open]:animate-[scaleIn_150ms_ease-out] "
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[hsl(var(--border))]">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold text-sm">
                              {toothNum}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">Pieza {toothNum}</div>
                              {hasDiagnoses && (
                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {diagnoses.length} diagnóstico{diagnoses.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <Popover.Close asChild>
                            <button 
                              className="w-6 h-6 rounded hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors"
                              aria-label="Cerrar"
                            >
                              <X size={14} />
                            </button>
                          </Popover.Close>
                        </div>

                        {/* Lista de diagnósticos */}
                        <div className="space-y-2 mb-3">
                          {DIAG_LIST.map(diag => {
                            const checked = diagnoses.includes(diag.id);
                            return (
                              <label 
                                key={diag.id} 
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                  "hover:bg-[hsl(var(--muted))]",
                                  checked && "bg-[hsl(var(--muted))]"
                                )}
                              >
                                <CheckboxRoot
                                  checked={checked}
                                  onCheckedChange={() => toggleDx(toothNum, diag.id)}
                                />
                                <span className="flex-1 text-sm">{diag.label}</span>
                                {checked && (
                                  <Badge variant={diag.color as "danger" | "warning" | "success" | "info" | "default"} className="text-xs">
                                    Activo
                                  </Badge>
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Acciones */}
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
    </div>
  );
}
