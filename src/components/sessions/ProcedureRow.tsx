// src/components/sessions/ProcedureRow.tsx
import { memo } from "react";
import { DollarSign, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { CheckboxRoot } from "../ui/Checkbox";
import type { VisitProcedure } from "../../lib/types";

interface ProcedureRowProps {
  item: VisitProcedure;
  inEditMode: boolean;
  isEditable: boolean;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onQtyChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;  // NEW: Checkbox handler
  onRemove: () => void;
}

/**
 * Componente memoizado para las filas de procedimientos (evita re-renders innecesarios)
 */
export const ProcedureRow = memo(
  ({
    item,
    inEditMode,
    isEditable,
    onNameChange,
    onUnitChange,
    onQtyChange,
    onActiveChange,
    onRemove,
  }: ProcedureRowProps) => {
    // Determinar si está activo (usar is_active o inferir de quantity)
    const isActive = item.is_active ?? (item.quantity > 0);

    return (
      <div
        className={cn(
          "grid gap-2 items-center p-2 rounded-md cursor-pointer transition-colors",
          inEditMode
            ? "grid-cols-[50px_2fr_110px_90px_100px_50px] min-w-[550px]"
            : "grid-cols-[50px_2fr_110px_90px_100px] min-w-[500px]",
          isActive && "bg-[hsl(var(--muted))]",
          isEditable && "hover:bg-[hsl(var(--muted))]/50",
        )}
        onClick={() => {
          if (isEditable) {
            onActiveChange(!isActive);
          }
        }}
      >
        {/* Checkbox de activación */}
        <div
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <CheckboxRoot
            checked={isActive}
            onCheckedChange={(checked) => onActiveChange(checked === true)}
            disabled={!isEditable}
            title="Activar procedimiento para esta sesión"
            className="shrink-0"
          />
        </div>

        {/* Nombre del procedimiento */}
        {inEditMode ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Input
              type="text"
              value={item.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nombre del procedimiento"
              className="h-9"
            />
          </div>
        ) : (
          <div className="text-sm font-medium px-2 py-1.5">{item.name}</div>
        )}

        {/* Precio unitario */}
        <div onClick={(e) => e.stopPropagation()}>
          <Input
            type="number"
            min={0}
            step={1}
            value={item.unit_price || ""}
            onChange={(e) => onUnitChange(e.target.value)}
            icon={<DollarSign size={14} />}
            className="h-9 text-center text-sm"
            placeholder="0"
            disabled={!isEditable || !inEditMode}  // Solo editable en modo edición
          />
        </div>

        {/* Cantidad */}
        <div onClick={(e) => e.stopPropagation()}>
          <Input
            type="number"
            min={0}
            step={1}
            value={item.quantity || ""}
            onChange={(e) => {
              const newQty = parseInt(e.target.value) || 0;
              onQtyChange(e.target.value);
              // Auto-activar checkbox si la cantidad es mayor a 0
              if (newQty > 0 && !isActive) {
                onActiveChange(true);
              }
            }}
            className="h-9 text-center font-semibold text-sm"
            placeholder="0"
            disabled={!isEditable || inEditMode}  // Solo editable cuando NO está en modo edición
          />
        </div>

        {/* Subtotal */}
        <div className="text-center font-semibold rounded-md h-9 flex items-center justify-center text-sm">
          ${item.subtotal}
        </div>

        {/* Botón eliminar (solo en modo edición) */}
        {inEditMode && (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              title="Eliminar procedimiento"
              className="h-9 w-9 p-0 hover:bg-red-500/20 hover:text-red-600"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>
    );
  },
);

ProcedureRow.displayName = "ProcedureRow";
