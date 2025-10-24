// src/components/SessionsTable.tsx
import { useMemo, useState, memo } from "react";
import { toInt } from "../lib/utils";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Alert } from "./ui/Alert";
import {
  Plus,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { cn } from "../lib/cn";
import type { SessionRow, ProcItem, ProcedureTemplate } from "../lib/types";
import { DatePicker } from "./ui/DatePicker";
import SignerSelect from "./SignerSelect";

interface SessionsTableProps {
  sessions: SessionRow[];
  onSessionsChange: (sessions: SessionRow[]) => void;
  procedureTemplates: ProcedureTemplate[];
  onUpdateTemplates: (
    items: Array<{ name: string; unit: number }>,
  ) => Promise<void>;
  signers: Array<{ id: number; name: string }>;
  onSignersChange: () => Promise<void>;

  /** NUEVO — control externo de qué sesión está expandida (opcional) */
  activeId?: string | null;
  /** NUEVO — cuando el usuario abre una sesión (opcional) */
  onOpenSession?: (sessionId: string) => void;
  /** NUEVO — al pulsar el "ojo" para ver en modo lectura (opcional) */
  onViewReadOnly?: (sessionId: string, visitId?: number) => void;
}

const PAGE_SIZE = 5;

// Componente memoizado para las filas de procedimientos (evita re-renders innecesarios)
const ProcedureRow = memo(
  ({
    item,
    inEditMode,
    isEditable,
    onNameChange,
    onUnitChange,
    onQtyChange,
    onRemove,
  }: {
    item: ProcItem;
    inEditMode: boolean;
    isEditable: boolean;
    onNameChange: (value: string) => void;
    onUnitChange: (value: string) => void;
    onQtyChange: (value: string) => void;
    onRemove: () => void;
  }) => {
    return (
      <div
        className={cn(
          "grid gap-2 items-center p-2 rounded-md",
          inEditMode
            ? "grid-cols-[1fr_90px_80px_90px_50px] min-w-[400px]"
            : "grid-cols-[1fr_90px_80px_90px] min-w-[350px]",
          item.qty > 0 && "bg-[hsl(var(--muted))]",
        )}
      >
        {/* Nombre del procedimiento */}
        {inEditMode ? (
          <Input
            type="text"
            value={item.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nombre del procedimiento"
            className="h-9"
          />
        ) : (
          <div className="text-sm font-medium px-2 py-1.5">{item.name}</div>
        )}

        {/* Precio unitario */}
        <Input
          type="number"
          min={0}
          step={1}
          value={item.unit || ""}
          onChange={(e) => onUnitChange(e.target.value)}
          icon={<DollarSign size={14} />}
          className="h-9 text-center text-xs"
          placeholder="0"
          disabled={!isEditable}
        />

        {/* Cantidad */}
        <Input
          type="number"
          min={0}
          step={1}
          value={item.qty || ""}
          onChange={(e) => onQtyChange(e.target.value)}
          className="h-9 text-center font-semibold text-xs"
          placeholder="0"
          disabled={!isEditable}
        />

        {/* Subtotal */}
        <div className="text-center font-semibold rounded-md h-9 flex items-center justify-center text-xs">
          ${item.sub}
        </div>

        {/* Botón eliminar (solo en modo edición) */}
        {inEditMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            title="Eliminar procedimiento"
            className="h-9 w-9 p-0 hover:bg-red-500/20 hover:text-red-600"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    );
  },
);

ProcedureRow.displayName = "ProcedureRow";

export default function SessionsTable({
  sessions,
  onSessionsChange,
  procedureTemplates,
  onUpdateTemplates,
  signers,
  onSignersChange,
  activeId,
  onOpenSession,
  onViewReadOnly,
}: SessionsTableProps) {
  // —— Estado interno para "activa" SOLO si el padre no lo controla —— //
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const currentActiveId = activeId ?? internalActiveId;

  // Estado para modo edición de plantilla de procedimientos
  const [editModeSessionId, setEditModeSessionId] = useState<string | null>(
    null,
  );

  // Estado para guardar snapshot de items originales (para poder cancelar cambios)
  const [itemsSnapshot, setItemsSnapshot] = useState<Map<string, ProcItem[]>>(
    new Map(),
  );

  // Paginado
  const [page, setPage] = useState(0); // 0-based

  const totals = useMemo(() => {
    const p = sessions.reduce((acc, r) => acc + toInt(r.budget), 0);
    const a = sessions.reduce((acc, r) => acc + toInt(r.payment), 0);
    const s = sessions.reduce((acc, r) => acc + toInt(r.balance), 0);
    return { p, a, s };
  }, [sessions]);

  // Determinar cuál es la sesión más reciente (la única editable)
  const mostRecentSessionId = useMemo(() => {
    if (sessions.length === 0) return null;

    // Encontrar la sesión con la fecha más reciente
    let mostRecent = sessions[0];
    for (const session of sessions) {
      if ((session.date ?? "") > (mostRecent.date ?? "")) {
        mostRecent = session;
      }
    }
    return mostRecent.id;
  }, [sessions]);

  const newRow = (): SessionRow => {
    // Usar plantilla global de procedimientos
    console.log("🆕 Creando nueva sesión con plantillas:", procedureTemplates);
    const baseItems: ProcItem[] = procedureTemplates.map((template) => ({
      id: crypto.randomUUID(),
      name: template.name,
      unit: template.default_price,
      qty: 0,
      sub: 0,
    }));

    console.log("📦 Items generados:", baseItems);

    const today = new Date().toISOString().slice(0, 10);
    return {
      id: crypto.randomUUID(),
      date: today,
      items: baseItems,
      auto: true,
      budget: 0,
      discount: 0,
      payment: 0,
      balance: 0,
      signer: "",
    };
  };

  // Lista ordenada por fecha (YYYY-MM-DD compara bien como string)
  // Siempre descendente: más reciente arriba
  const sortedSessions = useMemo(() => {
    const copy = [...sessions];
    copy.sort((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      return db.localeCompare(da); // desc: más reciente primero
    });
    return copy;
  }, [sessions]);

  const totalPages = Math.max(1, Math.ceil(sortedSessions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleSessions = useMemo(
    () => sortedSessions.slice(start, end),
    [sortedSessions, start, end],
  );

  // Agregar: respeta orden, y deja la NUEVA como activa
  const addRow = () => {
    // Encontrar la sesión más reciente (para copiar cantidades)
    let previousSession: SessionRow | null = null;
    if (sessions.length > 0) {
      previousSession = sessions[0];
      for (const session of sessions) {
        if ((session.date ?? "") > (previousSession.date ?? "")) {
          previousSession = session;
        }
      }
    }

    // Crear nueva sesión usando plantilla global
    const row = newRow();

    // Si existe sesión anterior, copiar las cantidades (qty) de sus procedimientos
    if (previousSession) {
      // Crear mapa de cantidades de la sesión anterior por nombre de procedimiento
      const prevQtyMap = new Map(
        previousSession.items.map((item) => [item.name, item.qty]),
      );

      // Aplicar las cantidades de la sesión anterior a los procedimientos de la nueva sesión
      row.items = row.items.map((item) => ({
        ...item,
        qty: prevQtyMap.get(item.name) || 0, // Copiar qty si existe, sino 0
        sub: item.unit * (prevQtyMap.get(item.name) || 0), // Recalcular subtotal
      }));

      // Recalcular presupuesto automático si está en modo auto
      if (row.auto) {
        row.budget = row.items.reduce((sum, it) => sum + it.sub, 0);
      }
    }

    // Siempre agregar al inicio (orden descendente fijo)
    const next = [row, ...sessions];

    onSessionsChange(next);

    // Expandir/activar la nueva (controlado o no)
    if (onOpenSession) onOpenSession(row.id!);
    else setInternalActiveId(row.id!);

    // La nueva sesión siempre queda en la primera página
    setPage(0);
  };

  // —— Ya no se elimina por requerimiento legal; quitamos UI de borrado —— //

  // Recalcular montos (no toca fecha)
  const recalcRow = (idxOriginal: number, mutate?: (r: SessionRow) => void) => {
    const next = [...sessions];
    const r = { ...next[idxOriginal] };
    mutate?.(r);
    r.items = r.items.map((it) => ({
      ...it,
      sub: toInt(it.unit) * toInt(it.qty),
    }));
    const totalProcs = r.items.reduce((sum, it) => sum + it.sub, 0);
    r.budget = r.auto ? totalProcs : toInt(r.budget);
    const maxPayment = Math.max(r.budget - toInt(r.discount), 0);
    r.payment = Math.min(toInt(r.payment), maxPayment);
    r.balance = Math.max(r.budget - toInt(r.discount) - r.payment, 0);
    next[idxOriginal] = r;
    onSessionsChange(next);
  };

  const goFirst = () => setPage(0);
  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goLast = () => setPage(totalPages - 1);

  const handleToggleRow = (id: string) => {
    // Si ya está activa → la colapsamos (solo en modo no-controlado)
    if (activeId !== undefined) {
      // controlado por el padre
      if (onOpenSession) onOpenSession(id);
      return;
    }
    setInternalActiveId((cur) => (cur === id ? null : id));
  };

  // Agregar un procedimiento vacío a una sesión
  const addProcedure = (idxOriginal: number) => {
    const next = [...sessions];
    const r = { ...next[idxOriginal] };
    r.items = [
      ...r.items,
      {
        id: crypto.randomUUID(),
        name: "",
        unit: 0,
        qty: 0,
        sub: 0,
      },
    ];
    next[idxOriginal] = r;
    onSessionsChange(next);
  };

  // Eliminar un procedimiento de una sesión
  const removeProcedure = (idxOriginal: number, procId: string) => {
    recalcRow(idxOriginal, (r) => {
      r.items = r.items.filter((it) => it.id !== procId);
    });
  };

  // Entrar al modo edición de plantilla
  const enterEditMode = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      // Guardar snapshot profundo de los items originales
      const snapshot = JSON.parse(JSON.stringify(session.items)) as ProcItem[];
      setItemsSnapshot((prev) => new Map(prev).set(sessionId, snapshot));
    }
    setEditModeSessionId(sessionId);
  };

  // Salir del modo edición de plantilla
  const exitEditMode = async () => {
    if (!editModeSessionId) return;

    // Buscar la sesión que está en modo edición
    const sessionIdx = sessions.findIndex((s) => s.id === editModeSessionId);
    if (sessionIdx === -1) {
      setEditModeSessionId(null);
      return;
    }

    const session = sessions[sessionIdx];

    // Guardar los items de esta sesión como la nueva plantilla global
    // La función onUpdateTemplates ya filtra items vacíos y actualiza el estado procedureTemplates
    await onUpdateTemplates(session.items);

    // No necesitamos actualizar la sesión aquí porque los items ya están correctos
    // en session.items (son los que el usuario acaba de editar)

    setEditModeSessionId(null);
  };

  // Cancelar la edición de plantilla y restaurar items originales
  const cancelEditMode = () => {
    if (!editModeSessionId) return;

    const snapshot = itemsSnapshot.get(editModeSessionId);
    if (snapshot) {
      // Restaurar los items originales
      const sessionIdx = sessions.findIndex((s) => s.id === editModeSessionId);
      if (sessionIdx !== -1) {
        const next = [...sessions];
        next[sessionIdx] = {
          ...next[sessionIdx],
          items: JSON.parse(JSON.stringify(snapshot)), // Copia profunda
        };
        onSessionsChange(next);
      }

      // Limpiar snapshot
      setItemsSnapshot((prev) => {
        const newMap = new Map(prev);
        newMap.delete(editModeSessionId);
        return newMap;
      });
    }

    setEditModeSessionId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">Sesiones de tratamiento</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {sessions.length} sesión{sessions.length !== 1 ? "es" : ""}{" "}
            registrada{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={addRow} size="sm">
            <Plus size={16} />
            Nueva sesión
          </Button>
        </div>
      </div>

      {/* Tabla de sesiones */}
      {sessions.length === 0 ? (
        <Alert variant="info">
          <div className="text-center py-4">
            <FileText
              size={48}
              className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]"
            />
            <p className="font-medium mb-1">No hay sesiones registradas</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Haz clic en "Nueva sesión" para comenzar
            </p>
          </div>
        </Alert>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((row) => {
            const isExpanded = currentActiveId === row.id;
            const activeProcs = row.items.filter((it) => it.qty > 0);

            // displayIndex representa el orden cronológico (1 = primera sesión, n = última sesión)
            // sortedSessions está ordenado descendente (más reciente primero)
            // Por lo tanto, invertimos el índice
            const displayIndex =
              sortedSessions.length -
              sortedSessions.findIndex((s) => s.id === row.id);

            const idxReal = sessions.findIndex((s) => s.id === row.id);
            const isEditable = row.id === mostRecentSessionId; // Solo la sesión más reciente es editable

            return (
              <div
                key={row.id}
                className={cn(
                  "card p-4 pt-6 hover:border-[hsl(var(--brand))] transition-all",
                  isExpanded && "ring-2 ring-[hsl(var(--brand))]",
                )}
              >
                {/* Resumen - CLICKEABLE para expandir/colapsar */}
                <div
                  className="flex items-center justify-between gap-4 mb-3 cursor-pointer"
                  onClick={() => handleToggleRow(row.id!)}
                >
                  <div className="flex w-full items-center justify-between gap-4 flex-wrap sm:flex-nowrap text-center">
                    <div className="w-10 h-10 rounded-md bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold shrink-0">
                      {displayIndex}
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <DatePicker
                        value={row.date}
                        onChange={(date) => {
                          const next = [...sessions];
                          next[idxReal] = {
                            ...next[idxReal],
                            date: date,
                          };
                          onSessionsChange(next);
                        }}
                        disabled={!isEditable}
                        className="w-[150px]"
                        placeholder="Seleccionar fecha"
                      />
                    </div>

                    <p
                      className="text-xs text-[hsl(var(--muted-foreground))] min-w-0 sm:max-w-[420px] px-2"
                      title={
                        activeProcs.length > 0
                          ? activeProcs
                              .map((p) => `${p.name} (${p.qty})`)
                              .join(", ")
                          : "Sin procedimientos"
                      }
                    >
                      {activeProcs.length > 0
                        ? activeProcs
                            .map((p) => `${p.name} (${p.qty})`)
                            .join(", ")
                        : "Sin procedimientos"}
                    </p>

                    <Badge
                      className="shrink-0"
                      variant={
                        row.balance === 0
                          ? "success"
                          : row.payment > 0
                            ? "warning"
                            : "danger"
                      }
                    >
                      {row.balance === 0
                        ? "Pagado"
                        : row.payment > 0
                          ? "Abonado"
                          : "Pendiente"}
                    </Badge>
                  </div>

                  {/* Resumen financiero */}
                  <div className="flex gap-8 text-sm flex-shrink-0">
                    <div className="text-right">
                      <div className="text-[hsl(var(--muted-foreground))] text-xs">
                        Presupuesto
                      </div>
                      <div className="font-semibold">${row.budget}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[hsl(var(--muted-foreground))] text-xs">
                        Abono
                      </div>
                      <div className="font-semibold text-green-600">
                        ${row.payment}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[hsl(var(--muted-foreground))] text-xs">
                        Saldo
                      </div>
                      <div className="font-semibold text-red-600">
                        ${row.balance}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRow(row.id!);
                      }}
                      title={isExpanded ? "Contraer" : "Expandir"}
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Button>

                    {/* Ver sesión en modo lectura */}
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Ver esta sesión (solo lectura)"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewReadOnly?.(row.id!, row.visitId);
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded &&
                  (() => {
                    const inEditMode = editModeSessionId === row.id;
                    const displayItems = row.items; // Mostrar todos los procedimientos siempre

                    return (
                      <div className="pt-3 mt-3 border-t border-[hsl(var(--border))] space-y-4">
                        {/* Tabla de Procedimientos */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <FileText
                                size={18}
                                className="text-[hsl(var(--brand))]"
                              />
                              Procedimientos realizados
                              {!isEditable && (
                                <Badge variant="info" className="text-xs">
                                  Solo lectura
                                </Badge>
                              )}
                            </h4>

                            {/* Botones contextuales según modo */}
                            {isEditable && (
                              <div className="flex gap-2">
                                {inEditMode ? (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => addProcedure(idxReal)}
                                    >
                                      <Plus size={16} />
                                      Añadir procedimiento
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={cancelEditMode}
                                    >
                                      <X size={16} />
                                      Cancelar
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={exitEditMode}
                                    >
                                      <Save size={16} />
                                      Guardar cambios
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => enterEditMode(row.id!)}
                                    title="Editar plantilla de procedimientos"
                                  >
                                    <Edit3 size={16} />
                                    Editar plantilla
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Contenedor flex con tabla de procedimientos a la izquierda y campos financieros a la derecha */}
                          <div className="flex gap-4">
                            {/* Tabla de procedimientos - lado izquierdo */}
                            <div className="flex-1">
                              <div className="overflow-x-auto">
                                <div
                                  className={cn(
                                    "grid gap-2 px-3 pb-2 mb-2 border-b-2 border-blue-200 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide",
                                    inEditMode
                                      ? "grid-cols-[1fr_90px_80px_90px_50px] min-w-[400px]"
                                      : "grid-cols-[1fr_90px_80px_90px] min-w-[350px]",
                                  )}
                                >
                                  <div>Procedimiento</div>
                                  <div className="text-center">Precio U.</div>
                                  <div className="text-center">Cant.</div>
                                  <div className="text-center">Subtotal</div>
                                  {inEditMode && <div></div>}
                                </div>

                                {/* Filas de procedimientos */}
                                {displayItems.length === 0 && !inEditMode ? (
                                  <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                                    <FileText
                                      size={32}
                                      className="mx-auto mb-2 opacity-50"
                                    />
                                    <p className="text-sm">
                                      No hay procedimientos registrados
                                    </p>
                                    <p className="text-xs mt-1">
                                      Haz clic en "Editar plantilla" para
                                      agregar
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {displayItems.map((item) => {
                                      const fullIdx = row.items.findIndex(
                                        (it) => it.id === item.id,
                                      );

                                      return (
                                        <ProcedureRow
                                          key={item.id}
                                          item={item}
                                          inEditMode={inEditMode}
                                          isEditable={isEditable}
                                          onNameChange={(value) =>
                                            recalcRow(idxReal, (r) => {
                                              r.items[fullIdx].name = value;
                                            })
                                          }
                                          onUnitChange={(value) =>
                                            recalcRow(idxReal, (r) => {
                                              r.items[fullIdx].unit =
                                                toInt(value);
                                            })
                                          }
                                          onQtyChange={(value) =>
                                            recalcRow(idxReal, (r) => {
                                              r.items[fullIdx].qty =
                                                toInt(value);
                                            })
                                          }
                                          onRemove={() =>
                                            removeProcedure(idxReal, item.id!)
                                          }
                                        />
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Total de procedimientos */}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-[hsl(var(--border))]"></div>
                              </div>
                            </div>

                            {/* Campos financieros - lado derecho, centrados verticalmente */}
                            <div className="w-[280px] flex flex-col justify-center">
                              <div className="bg-[hsl(var(--muted))] border-l-4 border-blue-500 p-4 rounded-md space-y-3">
                                <h5 className="font-semibold text-sm mb-3">
                                  Información financiera
                                </h5>

                                {/* Presupuesto */}
                                <div>
                                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                                    Presupuesto
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={row.budget}
                                      onChange={(e) =>
                                        recalcRow(idxReal, (r) => {
                                          r.auto = false;
                                          r.budget = toInt(e.target.value);
                                        })
                                      }
                                      disabled={row.auto || !isEditable}
                                      icon={<DollarSign size={12} />}
                                      className="h-9 text-xs"
                                    />
                                    <label
                                      className="inline-flex items-center gap-1"
                                      title="Presupuesto automático"
                                    >
                                      <input
                                        type="checkbox"
                                        className="h-3 w-3"
                                        checked={row.auto}
                                        onChange={(e) =>
                                          recalcRow(idxReal, (r) => {
                                            r.auto = e.target.checked;
                                          })
                                        }
                                        disabled={!isEditable}
                                      />
                                    </label>
                                  </div>
                                </div>

                                {/* Descuento */}
                                <div>
                                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                                    Descuento
                                  </label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={row.discount || ""}
                                    onChange={(e) =>
                                      recalcRow(idxReal, (r) => {
                                        r.discount = toInt(e.target.value);
                                      })
                                    }
                                    icon={<DollarSign size={12} />}
                                    placeholder="0"
                                    disabled={!isEditable}
                                    className="h-9 text-xs"
                                  />
                                </div>

                                {/* Abono */}
                                <div>
                                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                                    Abono
                                  </label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={row.payment || ""}
                                    onChange={(e) =>
                                      recalcRow(idxReal, (r) => {
                                        r.payment = toInt(e.target.value);
                                      })
                                    }
                                    icon={<DollarSign size={12} />}
                                    placeholder="0"
                                    disabled={!isEditable}
                                    className="h-9 text-xs"
                                  />
                                </div>

                                {/* Saldo */}
                                <div>
                                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">
                                    Saldo
                                  </label>
                                  <div className="text-center font-bold rounded-md h-9 flex items-center justify-center text-sm bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                    ${row.balance}
                                  </div>
                                </div>

                                {/* Campo de firma del responsable */}
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Firma del responsable
                                  </label>
                                  <SignerSelect
                                    value={row.signer || ""}
                                    onChange={(value) =>
                                      recalcRow(idxReal, (r) => {
                                        r.signer = value;
                                      })
                                    }
                                    disabled={!isEditable}
                                    signers={signers}
                                    onSignersChange={onSignersChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Página {safePage + 1} de {totalPages} · {PAGE_SIZE} por página
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goFirst}
              disabled={safePage === 0}
              title="Primera página"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={safePage === 0}
              title="Anterior"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              disabled={safePage >= totalPages - 1}
              title="Siguiente"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goLast}
              disabled={safePage >= totalPages - 1}
              title="Última página"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Resumen de totales */}
      {sessions.length > 0 && (
        <div className="card p-4 bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--muted))]">
          <h4 className="font-semibold mb-3">Resumen general</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-md bg-[hsl(var(--surface))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                Total presupuestado
              </div>
              <div className="text-2xl font-bold">${totals.p}</div>
            </div>
            <div className="text-center p-3 rounded-md bg-[hsl(var(--surface))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                Total abonado
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${totals.a}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[hsl(var(--surface))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                Saldo total
              </div>
              <div className="text-2xl font-bold text-red-600">${totals.s}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
