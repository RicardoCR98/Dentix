import { useMemo, useState } from "react";
import { toInt } from "../lib/utils";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Alert } from "./ui/Alert";
import {
  Plus,
  Trash2,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../lib/cn";
import type { SessionRow, ProcItem } from "../lib/types";

interface SessionsTableProps {
  sessions: SessionRow[];
  onSessionsChange: (sessions: SessionRow[]) => void;
}

const DEFAULT_PROCS = [
  "Curación",
  "Resinas simples",
  "Resinas compuestas",
  "Extracciones simples",
  "Extracciones complejas",
  "Correctivo inicial",
  "Control mensual",
  "Prótesis total",
  "Prótesis removible",
  "Prótesis fija",
  "Retenedor",
  "Endodoncia simple",
  "Endodoncia compleja",
  "Limpieza simple",
  "Limpieza compleja",
  "Reposición",
  "Pegada",
];

const PAGE_SIZE = 5;

export default function SessionsTable({
  sessions,
  onSessionsChange,
}: SessionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedProcs, setExpandedProcs] = useState<Set<string>>(new Set());

  // Orden y paginado
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // desc = más reciente primero
  const [page, setPage] = useState(0); // 0-based

  const totals = useMemo(() => {
    const p = sessions.reduce((acc, r) => acc + toInt(r.budget), 0);
    const a = sessions.reduce((acc, r) => acc + toInt(r.payment), 0);
    const s = sessions.reduce((acc, r) => acc + toInt(r.balance), 0);
    return { p, a, s };
  }, [sessions]);

  const newRow = (): SessionRow => {
    const baseItems: ProcItem[] = DEFAULT_PROCS.map((name) => ({
      name,
      unit: 0,
      qty: 0,
      sub: 0,
    }));
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: crypto.randomUUID(),
      date: today,
      items: baseItems,
      auto: true,
      budget: 0,
      payment: 0,
      balance: 0,
      signer: "",
    };
  };

  // Lista ordenada por fecha (YYYY-MM-DD compara bien como string)
  const sortedSessions = useMemo(() => {
    const copy = [...sessions];
    copy.sort((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      return sortOrder === "desc" ? db.localeCompare(da) : da.localeCompare(db);
    });
    return copy;
  }, [sessions, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedSessions.length / PAGE_SIZE));

  // Asegurar que la página actual siempre esté en rango
  const safePage = Math.min(page, totalPages - 1);

  // Ventana visible por página
  const start = safePage * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleSessions = useMemo(
    () => sortedSessions.slice(start, end),
    [sortedSessions, start, end]
  );

  // Agregar: respeta orden, expande y navega a la página donde cae la nueva
  const addRow = () => {
    const row = newRow();
    let next: SessionRow[];
    if (sortOrder === "desc") next = [row, ...sessions]; // nueva arriba
    else next = [...sessions, row]; // nueva al final

    onSessionsChange(next);

    // Expandir la nueva
    setExpandedRows((prev) => {
      const n = new Set(prev);
      n.add(row.id!);
      return n;
    });

    // Ir a la página donde quedó la nueva
    if (sortOrder === "desc") {
      // Siempre cae al inicio, vamos a la página 0
      setPage(0);
    } else {
      // Cae al final: calcular última página tras añadir
      const nextTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage(nextTotalPages - 1);
    }
  };

  // Eliminar "última" según el orden actual
  const delLast = () => {
    if (sortedSessions.length === 0) return;
    const lastId = sortedSessions[sortedSessions.length - 1].id!;
    const next = sessions.filter((r) => r.id !== lastId);
    onSessionsChange(next);
    // Ajustar página si quedó fuera de rango
    const nextTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
    setPage((p) => Math.min(p, nextTotalPages - 1));
  };

  const delRow = (id: string) => {
    const next = sessions.filter((r) => r.id !== id);
    onSessionsChange(next);
    const nextTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
    setPage((p) => Math.min(p, nextTotalPages - 1));
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleProcs = (id: string) => {
    setExpandedProcs((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Recalcular MONTOS (no toca fecha)
  const recalcRow = (idxOriginal: number, mutate?: (r: SessionRow) => void) => {
    // idxOriginal corresponde al array "sessions" (fuente de verdad)
    const next = [...sessions];
    const r = { ...next[idxOriginal] };
    mutate?.(r);
    r.items = r.items.map((it) => ({
      ...it,
      sub: toInt(it.unit) * toInt(it.qty),
    }));
    const totalProcs = r.items.reduce((sum, it) => sum + it.sub, 0);
    r.budget = r.auto ? totalProcs : toInt(r.budget);
    r.payment = Math.min(toInt(r.payment), r.budget);
    r.balance = Math.max(r.budget - r.payment, 0);
    next[idxOriginal] = r;
    onSessionsChange(next);
  };

  const goFirst = () => setPage(0);
  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goLast = () => setPage(totalPages - 1);

  const toggleSort = () => {
    setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    // Para mantener simpleza y que siempre veas el inicio tras cambiar orden
    setPage(0);
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

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleSort}
            title={sortOrder === "desc" ? "Más reciente arriba" : "Más reciente abajo"}
          >
            {sortOrder === "desc" ? "Últimas arriba" : "Últimas abajo"}
          </Button>

          {sessions.length > 0 && (
            <Button variant="secondary" onClick={delLast} size="sm">
              <Trash2 size={16} />
              Eliminar última
            </Button>
          )}
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
            const isExpanded = expandedRows.has(row.id!);
            const isProcsExpanded = expandedProcs.has(row.id!);
            const activeProcs = row.items.filter((it) => it.qty > 0);
            const totalProcs = row.items.reduce((sum, it) => sum + it.sub, 0);

            // índice mostrado según posición global en la lista ORDENADA
            const displayIndex =
              sortedSessions.findIndex((s) => s.id === row.id) + 1;

            // idxReal para recalc: índice en "sessions" (fuente de verdad)
            const idxReal = sessions.findIndex((s) => s.id === row.id);

            return (
              <div
                key={row.id}
                className="card p-4 pt-6 hover:border-[hsl(var(--brand))]"
              >
                {/* Resumen de la sesión */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex w-full items-center justify-between gap-4 flex-wrap sm:flex-nowrap text-center">
                    {/* índice */}
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold shrink-0">
                      {displayIndex}
                    </div>
                    <div>
                      {/* fecha (NO recalcula) */}
                      <Input
                        type="date"
                        value={row.date}
                        onChange={(e) => {
                          const next = [...sessions];
                          next[idxReal] = { ...next[idxReal], date: e.target.value };
                          onSessionsChange(next);
                        }}
                        className="h-9 w-[160px]"
                      />
                    </div>
                    {/* lista de procedimientos */}
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
                        ? activeProcs.map((p) => `${p.name} (${p.qty})`).join(", ")
                        : "Sin procedimientos"}
                    </p>

                    {/* badge de estado */}
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
                      onClick={() => toggleRow(row.id!)}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => delRow(row.id!)}
                      className="hover:bg-red-400 dark:bg-red-400/50 dark:hover:bg-red-600/70"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && (
                  <div className="pt-3 mt-3 border-t border-[hsl(var(--border))] space-y-4">
                    {/* Procedimientos */}
                    <div className="space-y-3">
                      <button
                        onClick={() => toggleProcs(row.id!)}
                        className="w-full flex items-center justify-between rounded-md dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                      >
                        <h4 className="font-semibold p-3 flex items-center gap-2">
                          <FileText
                            size={18}
                            className="text-[hsl(var(--brand))]"
                          />
                          Procedimientos realizados
                        </h4>

                        {isProcsExpanded ? (
                          <ChevronUp
                            size={18}
                            className="text-blue-600 dark:text-blue-400 me-2"
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            className="text-blue-600 dark:text-blue-400 me-2"
                          />
                        )}
                      </button>

                      {/* Tabla de procedimientos (colapsable) */}
                      {isProcsExpanded && (
                        <>
                          {/* Encabezados de columna */}
                          <div className="grid grid-cols-[1fr_0.5fr_0.5fr_110px] gap-3 px-3 pb-2 mb-2 border-b-2 border-blue-200 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                            <div>Procedimiento</div>
                            <div className="text-center">Precio Unit.</div>
                            <div className="text-center">Cantidad</div>
                            <div className="text-center">Subtotal</div>
                          </div>

                          <div className="space-y-1">
                            {row.items.map((item, itemIdx) => (
                              <div
                                key={item.name}
                                className={cn(
                                  "grid grid-cols-[1fr_0.5fr_0.5fr_110px] gap-3 items-center p-2 rounded-md",
                                  item.qty > 0 && "bg-[hsl(var(--muted))]"
                                )}
                              >
                                <div className="text-sm font-medium">
                                  {item.name}
                                </div>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={item.unit || ""}
                                  onChange={(e) =>
                                    recalcRow(idxReal, (r) => {
                                      r.items[itemIdx].unit = toInt(
                                        e.target.value
                                      );
                                    })
                                  }
                                  icon={<DollarSign size={14} />}
                                  className="h-9 text-center"
                                  placeholder="Precio"
                                />
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={item.qty || ""}
                                  onChange={(e) =>
                                    recalcRow(idxReal, (r) => {
                                      r.items[itemIdx].qty = toInt(
                                        e.target.value
                                      );
                                    })
                                  }
                                  className="h-9 text-center font-semibold"
                                  placeholder="Cantidad"
                                />
                                <div
                                  className={cn(
                                    "text-center font-semibold rounded-md h-9 flex items-center justify-center",
                                    (item.unit ?? 0) > 0 &&
                                      (item.qty ?? 0) > 0 &&
                                      "dark:bg-amber-500/20 dark:ring-amber-400/40"
                                  )}
                                >
                                  ${item.sub}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 pe-9 border-t border-dashed border-[hsl(var(--border))]">
                            <span className="font-semibold">
                              Total de procedimientos
                            </span>
                            <span className="font-bold text-lg px-3 py-1 rounded-md dark:bg-amber-500/20 dark:ring-amber-400/40">
                              ${totalProcs}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Pagos */}
                    <div className="grid md:grid-cols-3 gap-15">
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <Input
                          label="Presupuesto total"
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
                          disabled={row.auto}
                          icon={<DollarSign size={14} />}
                          className="h-9"
                        />

                        <label className="inline-flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            className="h-4 w-4 align-middle"
                            checked={row.auto}
                            onChange={(e) =>
                              recalcRow(idxReal, (r) => {
                                r.auto = e.target.checked;
                              })
                            }
                          />
                          <span className="text-sm leading-none">
                            Auto-calcular
                          </span>
                        </label>
                      </div>

                      <Input
                        label="Abono realizado"
                        type="number"
                        min={0}
                        max={row.budget}
                        step={1}
                        value={row.payment || ""}
                        onChange={(e) =>
                          recalcRow(idxReal, (r) => {
                            r.payment = toInt(e.target.value);
                          })
                        }
                        icon={<DollarSign size={14} />}
                      />

                      <Input
                        label="Saldo pendiente"
                        type="number"
                        value={row.balance}
                        readOnly
                        className="bg-[hsl(var(--muted))] cursor-not-allowed"
                        icon={<DollarSign size={14} />}
                      />
                    </div>

                    {/* Firma */}
                    <Input
                      label="Firma del responsable"
                      type="text"
                      value={row.signer || ""}
                      onChange={(e) =>
                        recalcRow(idxReal, (r) => {
                          r.signer = e.target.value;
                        })
                      }
                      placeholder="Nombre de quien firma"
                    />
                  </div>
                )}
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
            <div className="text-center p-3 rounded-lg bg-[hsl(var(--surface))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                Total presupuestado
              </div>
              <div className="text-2xl font-bold">${totals.p}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[hsl(var(--surface))]">
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
              <div className="text-2xl font-bold text-red-600">
                ${totals.s}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
