// src/components/SignerSelect.tsx
import { useState, useRef, useEffect } from "react";
import * as RSelect from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check, Plus, X } from "lucide-react";
import { cn } from "../lib/cn";
import { getRepository } from "../lib/storage/TauriSqliteRepository";

interface SignerSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  signers: Array<{ id: number; name: string }>;
  onSignersChange: () => Promise<void>;
}

export default function SignerSelect({
  value,
  onChange,
  disabled = false,
  signers,
  onSignersChange,
}: SignerSelectProps) {
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

    // Revisar el foco cada vez que cambia
    const interval = setInterval(keepFocus, 50);

    return () => clearInterval(interval);
  }, [isAdding]);

  const handleAdd = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    try {
      const repo = await getRepository();
      await repo.createSigner(trimmedName);
      await onSignersChange();

      // Seleccionar automáticamente el doctor recién creado
      onChange(trimmedName);

      // Resetear estado
      setNewName("");
      setIsAdding(false);
      // Mantener el select abierto para que el usuario vea el resultado
    } catch (error) {
      console.error("Error añadiendo doctor:", error);
      const message =
        error instanceof Error ? error.message : "Error al añadir el doctor";
      alert(message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;

    try {
      const repo = await getRepository();
      await repo.deleteSigner(id);
      await onSignersChange();

      // Si el doctor eliminado era el seleccionado, limpiar selección
      if (value === name) {
        onChange("");
      }
    } catch (error) {
      console.error("Error eliminando doctor:", error);
      alert("Error al eliminar el doctor.");
    }
  };

  const handleValueChange = (val: string) => {
    onChange(val === "__none__" ? "" : val);
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
    }
    // Para cualquier otra tecla, prevenir que el select capture el evento
    else {
      e.stopPropagation();
    }
  };

  return (
    <RSelect.Root
      value={value || "__none__"}
      onValueChange={handleValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={(newOpen) => {
        // Si estamos en modo añadir y se intenta cerrar, ignorar
        if (isAdding && !newOpen) {
          return;
        }
        setOpen(newOpen);
        if (!newOpen) {
          handleCancelAdd();
        }
      }}
    >
      <RSelect.Trigger className="select-trigger">
        <RSelect.Value placeholder="Selecciona un doctor…" />
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
            if (isAdding) {
              e.preventDefault();
            }
          }}
        >
          <RSelect.ScrollUpButton className="flex items-center justify-center py-1 text-[hsl(var(--muted-foreground))]">
            <ChevronUp size={16} />
          </RSelect.ScrollUpButton>

          <RSelect.Viewport className="p-1 max-h-[300px] overflow-y-auto">
            {/* Opción "Sin firma" */}
            <RSelect.Item
              value="__none__"
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center gap-2",
                "rounded-md py-2 pl-8 pr-3 text-sm outline-none",
                "text-[hsl(var(--foreground))]",
                "data-[highlighted]:bg-[hsl(var(--muted))]",
                "data-[state=checked]:font-medium",
                "transition-colors",
              )}
            >
              <span className="absolute left-2 top-1/2 -translate-y-1/2">
                <RSelect.ItemIndicator className="text-[hsl(var(--brand))]">
                  <Check size={16} />
                </RSelect.ItemIndicator>
              </span>
              <RSelect.ItemText>
                <span className="text-[hsl(var(--muted-foreground))] italic">
                  Sin firma
                </span>
              </RSelect.ItemText>
            </RSelect.Item>

            {/* Separador */}
            {signers.length > 0 && (
              <div className="h-px bg-[hsl(var(--border))] my-1" />
            )}

            {/* Lista de doctores */}
            {signers.map((signer) => (
              <RSelect.Item
                key={signer.id}
                value={signer.name}
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
                <RSelect.ItemText>{signer.name}</RSelect.ItemText>

                {/* Botón eliminar */}
                {!disabled && (
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      // Usar onPointerDown para capturar ANTES que cualquier otro evento
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(signer.id, signer.name);
                    }}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 z-10",
                      "p-1 rounded hover:bg-red-500/20 text-[hsl(var(--muted-foreground))]",
                      "hover:text-red-600 transition-colors",
                      "opacity-0 group-hover:opacity-100",
                    )}
                    title="Eliminar doctor"
                    tabIndex={-1}
                  >
                    <X size={14} />
                  </button>
                )}
              </RSelect.Item>
            ))}

            {/* Separador antes de "Añadir" */}
            <div className="h-px bg-[hsl(var(--border))] my-1" />

            {/* Formulario inline para añadir (si está en modo añadir) */}
            {isAdding ? (
              <div
                className="p-2 bg-[hsl(var(--muted))] rounded-md mb-1"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nombre del doctor"
                    className={cn(
                      "flex-1 h-8 px-2 text-sm rounded-md border",
                      "bg-[hsl(var(--surface))] border-[hsl(var(--border))]",
                      "text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]",
                      "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-transparent",
                    )}
                  />
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAdd();
                    }}
                    className={cn(
                      "h-8 px-2 rounded-md",
                      "bg-[hsl(var(--brand))] text-white",
                      "hover:opacity-90 transition-opacity",
                      "flex items-center justify-center",
                    )}
                    title="Guardar"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCancelAdd();
                    }}
                    className={cn(
                      "h-8 px-2 rounded-md",
                      "hover:bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
                      "transition-colors",
                      "flex items-center justify-center",
                    )}
                    title="Cancelar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Botón "Añadir nuevo" */
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
                  <span>Añadir nuevo doctor</span>
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
