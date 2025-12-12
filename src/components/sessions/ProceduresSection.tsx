// src/components/sessions/ProceduresSection.tsx
import { useMemo, memo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { FileText, DollarSign, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { CheckboxRoot } from "../ui/Checkbox";
import type { VisitProcedure } from "../../lib/types";

interface ProceduresSectionProps {
  items: VisitProcedure[];
  isEditable: boolean;
  inEditMode: boolean;

  onNameChange: (itemIdx: number, value: string) => void;
  onUnitChange: (itemIdx: number, value: string) => void;
  onQtyChange: (itemIdx: number, value: string) => void;
  onActiveChange: (itemIdx: number, value: boolean) => void;
  onRemove: (itemIdx: number) => void;
}

// Tipo extendido para poder pasar el índice a los handlers
type ProcedureRow = VisitProcedure & { _index: number };

const columnHelper = createColumnHelper<ProcedureRow>();

export const ProceduresSection = memo(
  ({
    items,
    isEditable,
    inEditMode,
    onNameChange,
    onUnitChange,
    onQtyChange,
    onActiveChange,
    onRemove,
  }: ProceduresSectionProps) => {
    // Añadimos _index para saber qué elemento del array tocar
    const data = useMemo<ProcedureRow[]>(
      () => items.map((item, idx) => ({ ...item, _index: idx })),
      [items],
    );

    // Handlers memoizados
    const handleActiveChange = useCallback(
      (idx: number, value: boolean) => onActiveChange(idx, value),
      [onActiveChange],
    );

    const handleNameChange = useCallback(
      (idx: number, value: string) => onNameChange(idx, value),
      [onNameChange],
    );

    const handleUnitChange = useCallback(
      (idx: number, value: string) => onUnitChange(idx, value),
      [onUnitChange],
    );

    const handleQtyChange = useCallback(
      (idx: number, value: string, isActive: boolean) => {
        const newQty = parseInt(value) || 0;
        onQtyChange(idx, value);
        // Auto-activar checkbox si cantidad > 0
        if (newQty > 0 && !isActive) {
          onActiveChange(idx, true);
        }
      },
      [onQtyChange, onActiveChange],
    );

    const handleRemove = useCallback(
      (idx: number) => onRemove(idx),
      [onRemove],
    );

    const columns = useMemo(
      () =>
        [
          // Checkbox
          columnHelper.accessor((row) => row.is_active ?? row.quantity > 0, {
            id: "is_active",
            header: () => (
              <div className="text-center text-xs font-semibold uppercase tracking-wide">
                Activar
              </div>
            ),
            cell: ({ row, getValue }) => {
              const isActive = getValue() as boolean;
              return (
                <div
                  className="flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CheckboxRoot
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      handleActiveChange(row.original._index, checked === true)
                    }
                    disabled={!isEditable}
                    title="Activar procedimiento para esta sesión"
                    className="shrink-0"
                  />
                </div>
              );
            },
            size: 50,
          }),

          // Nombre
          columnHelper.accessor("name", {
            header: () => (
              <div className="text-xs font-semibold uppercase tracking-wide">
                Procedimiento
              </div>
            ),
            cell: ({ row, getValue }) =>
              inEditMode ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="text"
                    value={getValue() as string}
                    onChange={(e) =>
                      handleNameChange(row.original._index, e.target.value)
                    }
                    placeholder="Nombre del procedimiento"
                    className="h-9"
                  />
                </div>
              ) : (
                <div className="text-sm font-medium px-2 py-1.5">
                  {getValue() as string}
                </div>
              ),
            size: 200,
          }),

          // Precio unitario
          columnHelper.accessor("unit_price", {
            header: () => (
              <div className="text-center text-xs font-semibold uppercase tracking-wide">
                Precio Unit
              </div>
            ),
            cell: ({ row, getValue }) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={(getValue() as number) || ""}
                  onChange={(e) =>
                    handleUnitChange(row.original._index, e.target.value)
                  }
                  icon={<DollarSign size={14} />}
                  className="h-9 text-center text-sm"
                  placeholder="0"
                  disabled={!isEditable || !inEditMode}
                />
              </div>
            ),
            size: 110,
          }),

          // Cantidad
          columnHelper.accessor("quantity", {
            header: () => (
              <div className="text-center text-xs font-semibold uppercase tracking-wide">
                Cantidad
              </div>
            ),
            cell: ({ row, getValue }) => {
              const isActive =
                row.original.is_active ?? row.original.quantity > 0;
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={(getValue() as number) || ""}
                    onChange={(e) =>
                      handleQtyChange(
                        row.original._index,
                        e.target.value,
                        isActive,
                      )
                    }
                    className="h-9 text-center font-semibold text-sm"
                    placeholder="0"
                    disabled={!isEditable || inEditMode}
                  />
                </div>
              );
            },
            size: 90,
          }),

          // Subtotal
          columnHelper.accessor("subtotal", {
            header: () => (
              <div className="text-center text-xs font-semibold uppercase tracking-wide">
                Total
              </div>
            ),
            cell: ({ getValue }) => (
              <div className="text-center font-semibold rounded-md h-9 flex items-center justify-center text-sm">
                ${getValue() as number}
              </div>
            ),
            size: 100,
          }),

          // Columna eliminar (solo en modo edición)
          ...(inEditMode
            ? [
                columnHelper.display({
                  id: "actions",
                  header: () => null,
                  cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(row.original._index)}
                        title="Eliminar procedimiento"
                        className="h-9 w-9 p-0 hover:bg-red-500/20 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ),
                  size: 50,
                }),
              ]
            : []),
        ] as unknown as ColumnDef<ProcedureRow, unknown>[],
      [
        inEditMode,
        isEditable,
        handleActiveChange,
        handleNameChange,
        handleUnitChange,
        handleQtyChange,
        handleRemove,
      ],
    );

    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) => row.id?.toString() || `item-${row._index}`,
    });

    // Estado vacío (sin items y no estás editando plantilla)
    if (items.length === 0 && !inEditMode) {
      return (
        <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay procedimientos registrados</p>
          <p className="text-xs mt-1">
            Haz clic en &quot;Editar plantilla&quot; para agregar
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto py-3">
        <div className="w-full min-w-[500px] ">
          {/* Header */}
          <div className="border-b-2 border-blue-200 pb-2 mb-2">
            {table.getHeaderGroups().map((headerGroup) => (
              <div
                key={headerGroup.id}
                className={cn(
                  "grid gap-2 px-3 text-[hsl(var(--muted-foreground))]",
                  inEditMode
                    ? "grid-cols-[50px_2fr_110px_90px_100px_50px]"
                    : "grid-cols-[50px_2fr_110px_90px_100px]",
                )}
              >
                {headerGroup.headers.map((header) => (
                  <div key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="space-y-1">
            {table.getRowModel().rows.map((row) => {
              const isActive =
                row.original.is_active ?? row.original.quantity > 0;
              return (
                <div
                  key={row.id}
                  className={cn(
                    "grid gap-2 items-center p-2 rounded-md cursor-pointer transition-colors",
                    inEditMode
                      ? "grid-cols-[50px_2fr_110px_90px_100px_50px]"
                      : "grid-cols-[50px_2fr_110px_90px_100px]",
                    isActive && "bg-[hsl(var(--muted))]",
                    isEditable && "hover:bg-[hsl(var(--muted))]/50",
                  )}
                  onClick={() => {
                    if (isEditable) {
                      handleActiveChange(row.original._index, !isActive);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);

ProceduresSection.displayName = "ProceduresSection";
