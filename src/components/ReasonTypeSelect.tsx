// src/components/ReasonTypeSelect.tsx
import { useState, useRef, useEffect } from "react";
import * as RSelect from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check, Plus, Save, X } from "lucide-react";
import { cn } from "../lib/cn";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import type { ReasonType } from "../lib/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface ReasonTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  reasonTypes: ReasonType[];
  onReasonTypesChange: () => Promise<void>;
  onError?: (title: string, message: string) => void;
}

export default function ReasonTypeSelect({
  value,
  onChange,
  disabled = false,
  reasonTypes,
  onReasonTypesChange,
  onError,
}: ReasonTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input cuando entra en modo añadir
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Mantener el foco en el input mientras estamos en modo añadir
  useEffect(() => {
    if (!isAdding || !inputRef.current) return;

    const keepFocus = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    const interval = setInterval(keepFocus, 50);
    return () => clearInterval(interval);
  }, [isAdding]);

  const handleAdd = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    try {
      const repo = await getRepository();
      await repo.createReasonType(trimmedName);
      await onReasonTypesChange();

      // Seleccionar automáticamente el tipo recién creado
      onChange(trimmedName);

      // Resetear estado
      setNewName("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error añadiendo tipo de motivo:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Error al añadir el tipo de motivo";
      if (onError) {
        onError("Error al añadir", message);
      }
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;

    try {
      const repo = await getRepository();
      await repo.deleteReasonType(id);
      await onReasonTypesChange();

      // Si el tipo eliminado era el seleccionado, limpiar selección
      if (value === name) {
        onChange("");
      }
    } catch (error) {
      console.error("Error eliminando tipo de motivo:", error);
      if (onError) {
        onError("Error al eliminar", "No se pudo eliminar el tipo de motivo.");
      }
    }
  };

  const handleValueChange = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const handleCancelAdd = () => {
    setNewName("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleAdd();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleCancelAdd();
      setOpen(false);
    } else {
      e.stopPropagation();
    }
  };

  return (
    <RSelect.Root
      value={value || "Dolor"}
      onValueChange={handleValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={(newOpen) => {
        if (isAdding && !newOpen) return;
        setOpen(newOpen);
        if (!newOpen) handleCancelAdd();
      }}
    >
      <RSelect.Trigger className="select-trigger">
        <RSelect.Value placeholder="Selecciona un tipo…" />
        <RSelect.Icon className="ml-2 opacity-80">
          <ChevronDown size={16} />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          className={cn(
            "z-50 min-w-[var(--radix-select-trigger-width)] rounded-lg",
            "border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
            "shadow-lg overflow-hidden",
          )}
          position="popper"
          sideOffset={6}
          onPointerDownOutside={(e) => {
            if (isAdding) e.preventDefault();
          }}
        >
          <RSelect.ScrollUpButton className="flex items-center justify-center py-1 text-[hsl(var(--muted-foreground))]">
            <ChevronUp size={16} />
          </RSelect.ScrollUpButton>

          <RSelect.Viewport className="p-1 max-h-[300px] overflow-y-auto">
            {/* Lista de tipos de motivos */}
            {reasonTypes.map((type) => (
              <RSelect.Item
                key={type.id}
                value={type.name}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center gap-2",
                  "rounded-md py-2 pl-8 pr-8 text-sm outline-none",
                  "text-[hsl(var(--foreground))]",
                  "data-[highlighted]:bg-[hsl(var(--muted))]",
                  "data-[state=checked]:font-medium",
                  "transition-colors group",
                )}
              >
                <span className="absolute left-2 top-1/2 -translate-y-1/2">
                  <RSelect.ItemIndicator className="text-[hsl(var(--brand))]">
                    <Check size={16} />
                  </RSelect.ItemIndicator>
                </span>
                <RSelect.ItemText>{type.name}</RSelect.ItemText>

                {/* Botón eliminar */}
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(type.id!, type.name);
                    }}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 z-10",
                      "w-7 h-7 p-0 hover:bg-red-500/20",
                      "hover:text-red-600",
                      "opacity-0 group-hover:opacity-100",
                    )}
                    title="Eliminar tipo"
                    tabIndex={-1}
                  >
                    <X size={14} />
                  </Button>
                )}
              </RSelect.Item>
            ))}

            {/* Separador antes de "Añadir" */}
            <div className="h-px bg-[hsl(var(--border))] my-1" />

            {/* Formulario inline para añadir */}
            {isAdding ? (
              <div
                className="p-2 bg-[hsl(var(--muted))] rounded-md mb-1"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex gap-3 align-items-center">
                  <Input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nombre del tipo"
                    className={cn(" h-9")}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAdd();
                    }}
                    title="Guardar"
                  >
                    <Save size={18} />
                    Guardar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCancelAdd();
                    }}
                    title="Cancelar"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              !disabled && (
                <div
                  role="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsAdding(true);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center gap-2",
                    "rounded-md py-2 pl-8 pr-3 text-sm outline-none",
                    "text-[hsl(var(--brand))] font-medium",
                    "hover:bg-[hsl(var(--muted))]",
                    "transition-colors",
                  )}
                >
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">
                    <Plus size={16} />
                  </span>
                  <span>Añadir nuevo tipo</span>
                </div>
              )
            )}
          </RSelect.Viewport>

          <RSelect.ScrollDownButton className="flex items-center justify-center py-1 text-[hsl(var(--muted-foreground))]">
            <ChevronDown size={16} />
          </RSelect.ScrollDownButton>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
