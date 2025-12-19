// src/components/FinancialHistoryBlock.tsx
import { DollarSign } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/Table";
import type { SessionWithItems } from "../lib/types";
import { cn } from "../lib/cn";

interface FinancialHistoryBlockProps {
  sessions: SessionWithItems[]; // Solo sesiones guardadas (is_saved = true)
  allSessions?: SessionWithItems[]; // Todas las sesiones (para calcular totales)
  onQuickPayment: () => void; // Callback para abrir modal de abono rápido

  // NEW PROPS: Session filtering
  activeSessionId?: number | null;
  filterMode?: "all" | "session";
  onFilterModeChange?: (mode: "all" | "session") => void;
}

/**
 * FinancialHistoryBlock Component
 *
 * Displays patient's financial history in a table format.
 * Shows all saved sessions with budget, discount, payment, and balance information.
 *
 * Usage:
 * ```tsx
 * <FinancialHistoryBlock
 *   sessions={savedSessions}
 *   onQuickPayment={() => setQuickPaymentOpen(true)}
 * />
 * ```
 */
export function FinancialHistoryBlock({
  sessions,
  allSessions,
  onQuickPayment,
  activeSessionId,
  filterMode = "all",
  onFilterModeChange,
}: FinancialHistoryBlockProps) {
  // NOTA: sessions ya viene filtrado desde el padre (App.tsx) para incluir solo is_saved === true
  // Por lo tanto, NO necesitamos filtrar nuevamente aquí

  // NEW: Filter by session if needed
  const filteredSessions =
    filterMode === "session" && activeSessionId
      ? sessions.filter((s) => s.session.id === activeSessionId)
      : sessions;

  // Sort by date DESC (most recent first)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const dateA = new Date(a.session.date).getTime();
    const dateB = new Date(b.session.date).getTime();
    return dateB - dateA;
  });

  // Calculate totals from ALL sessions (including drafts)
  const sessionsForTotals = allSessions || sessions;
  const totalBudget = sessionsForTotals.reduce(
    (sum, s) => sum + (s.session.budget || 0),
    0,
  );
  const totalDiscount = sessionsForTotals.reduce(
    (sum, s) => sum + (s.session.discount || 0),
    0,
  );
  const totalPayment = sessionsForTotals.reduce(
    (sum, s) => sum + (s.session.payment || 0),
    0,
  );
  const totalBalance = sessionsForTotals.reduce(
    (sum, s) => sum + (s.session.balance || 0),
    0,
  );

  // Format date as DD/MM/YYYY
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
      {/* Session Filter Toggle */}
      {activeSessionId !== undefined && onFilterModeChange && (
        <div className="px-6 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onFilterModeChange("all")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                filterMode === "all"
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]",
              )}
            >
              Todo el paciente
            </button>
            <button
              onClick={() => onFilterModeChange("session")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                filterMode === "session"
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]",
              )}
              disabled={!activeSessionId}
            >
              Sesión activa
              {activeSessionId && filterMode === "session" && (
                <span className="ml-1 opacity-75">({activeSessionId})</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Patient Summary Section */}
      <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
        <h4 className="font-semibold mb-3 text-[hsl(var(--foreground))] flex items-center gap-2">
          <span>Resumen general del paciente</span>
          {filterMode === "session" && (
            <Badge variant="info" className="text-xs">
              Mostrando transacciones de sesión activa
            </Badge>
          )}
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-md badge-info">
            <div className="text-sm mb-1">Total presupuestado</div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudget)}
            </div>
          </div>
          <div className="text-center p-3 rounded-md badge-success">
            <div className="text-sm mb-1">Total abonado</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPayment)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg badge-danger">
            <div className="text-sm mb-1">Saldo total</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
            Transacciones Financieras
          </h3>
          <Badge
            variant={totalBalance === 0 ? "success" : "danger"}
            className="text-xs"
          >
            Saldo: {formatCurrency(totalBalance)}
          </Badge>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onQuickPayment}
          className="flex items-center gap-2"
        >
          <DollarSign size={16} />
          Abono Rápido
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <DollarSign
              size={48}
              className="text-[hsl(var(--muted-foreground))] mb-4"
            />
            <p className="text-base font-semibold text-[hsl(var(--foreground))] mb-2">
              No hay transacciones financieras guardadas
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center max-w-md">
              Para registrar transacciones financieras, crea una nueva sesión de
              tratamiento en el Historial Clínico y guárdala. También puedes
              usar el botón "Abono Rápido" para registrar pagos sin
              procedimientos clínicos.
            </p>
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-[hsl(var(--muted))]">
                <TableHead className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Fecha
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Motivo
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Presupuesto
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Descuento
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Abono
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Saldo Sesión
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Saldo Acumulado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.map((sessionWithItems, idx) => {
                const session = sessionWithItems.session;
                const cumulativeBalance = session.cumulative_balance || 0;

                return (
                  <TableRow
                    key={session.id || idx}
                    className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <TableCell className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                      {formatDate(session.date)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                      {session.reason_type || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-right text-[hsl(var(--foreground))]">
                      {formatCurrency(session.budget || 0)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-right text-[hsl(var(--foreground))]">
                      {formatCurrency(session.discount || 0)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-right text-[hsl(var(--foreground))]">
                      {formatCurrency(session.payment || 0)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-right text-[hsl(var(--foreground))]">
                      {formatCurrency(session.balance || 0)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3 text-sm text-right font-semibold",
                        cumulativeBalance === 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {formatCurrency(cumulativeBalance)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer with totals */}
      {sortedSessions.length > 0 && (
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <div className="flex items-center justify-end gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[hsl(var(--muted-foreground))]">
                Total Presupuestos:
              </span>
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {formatCurrency(totalBudget)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[hsl(var(--muted-foreground))]">
                Total Descuentos:
              </span>
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {formatCurrency(totalDiscount)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[hsl(var(--muted-foreground))]">
                Total Abonos:
              </span>
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {formatCurrency(totalPayment)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
