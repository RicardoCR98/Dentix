// src/pages/FinancesPage.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Phone,
  CalendarClock,
  ChevronRight,
  PieChart,
  ChevronLeft,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import Section from "../components/Section";
import PendingPaymentsDialog from "../components/PendingPaymentsDialog";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/cn";
import type { Patient, PatientDebtSummary } from "../lib/types";

type FilterStatus = "all" | "overdue" | "recent";

const columnHelper = createColumnHelper<PatientDebtSummary>();

export function FinancesPage() {
  const [patientsWithDebt, setPatientsWithDebt] = useState<
    PatientDebtSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "total_debt", desc: true },
  ]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const repo = await getRepository();
      const debtData = await repo.getPatientsWithDebt();
      setPatientsWithDebt(debtData);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  // Financial calculations
  const totalDebt = patientsWithDebt.reduce((sum, p) => sum + p.total_debt, 0);
  const totalPaid = patientsWithDebt.reduce((sum, p) => sum + p.total_paid, 0);
  const totalBudget = patientsWithDebt.reduce(
    (sum, p) => sum + p.total_budget,
    0,
  );

  // Collection rate (percentage of budget that has been collected)
  const collectionRate = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  // Overdue patients (>90 days)
  const overduePatients = patientsWithDebt.filter((p) => p.is_overdue);
  const overdueAmount = overduePatients.reduce(
    (sum, p) => sum + p.total_debt,
    0,
  );

  // Recent debt (<30 days)
  const recentDebt = patientsWithDebt.filter((p) => p.days_since_last <= 30);

  // Apply filters
  const filteredData = useMemo(() => {
    if (filterStatus === "overdue") {
      return patientsWithDebt.filter((p) => p.is_overdue);
    } else if (filterStatus === "recent") {
      return patientsWithDebt.filter((p) => p.days_since_last <= 30);
    }
    return patientsWithDebt;
  }, [patientsWithDebt, filterStatus]);

  const handleSelectPatient = async (patient: Patient) => {
    // Navigate to patients page with this patient selected
    console.log("Selected patient:", patient);
    // TODO: Navigate to /pacientes with patient ID
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Column definitions
  const columns = useMemo<ColumnDef<PatientDebtSummary, any>[]>(
    () => [
      columnHelper.accessor("full_name", {
        id: "full_name",
        enableSorting: true,
        header: () => <span>Paciente</span>,
        cell: (info) => {
          const patient = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                  patient.is_overdue
                    ? "bg-red-500/20 text-red-600"
                    : "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]",
                )}
              >
                {info.getValue().charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[hsl(var(--foreground))]">
                  {info.getValue()}
                </p>
                {patient.phone && (
                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <Phone size={10} />
                    {patient.phone}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("total_budget", {
        id: "total_budget",
        enableSorting: true,
        header: () => <span>Presupuesto</span>,
        cell: (info) => (
          <span className="font-medium text-[hsl(var(--foreground))]">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("total_paid", {
        id: "total_paid",
        enableSorting: false,
        header: () => <span>Pagado</span>,
        cell: (info) => {
          const patient = info.row.original;
          const paymentProgress =
            (patient.total_paid / patient.total_budget) * 100;
          return (
            <div className="flex flex-col items-end gap-1">
              <span className="font-medium text-green-600">
                {formatCurrency(info.getValue())}
              </span>
              <div className="w-20 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("total_debt", {
        id: "total_debt",
        enableSorting: true,
        header: () => <span>Saldo</span>,
        cell: (info) => {
          const patient = info.row.original;
          return (
            <span
              className={cn(
                "font-bold text-lg",
                patient.is_overdue ? "text-red-600" : "text-orange-600",
              )}
            >
              {formatCurrency(info.getValue())}
            </span>
          );
        },
      }),
      columnHelper.accessor("last_session_date", {
        id: "last_session_date",
        enableSorting: true,
        header: () => <span>Última Sesión</span>,
        cell: (info) => {
          const patient = info.row.original;
          return (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-sm text-[hsl(var(--foreground))]">
                <CalendarClock
                  size={14}
                  className="text-[hsl(var(--muted-foreground))]"
                />
                {formatDate(info.getValue())}
              </div>
              <span
                className={cn(
                  "text-xs",
                  patient.is_overdue
                    ? "text-red-600 font-medium"
                    : "text-[hsl(var(--muted-foreground))]",
                )}
              >
                Hace {patient.days_since_last} días
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "status",
        header: () => <span>Estado</span>,
        cell: (info) => {
          const patient = info.row.original;
          if (patient.is_overdue) {
            return (
              <Badge
                variant="danger"
                className="inline-flex items-center gap-1"
              >
                <AlertTriangle size={12} />
                Mora
              </Badge>
            );
          } else if (patient.days_since_last <= 30) {
            return (
              <Badge
                variant="success"
                className="inline-flex items-center gap-1"
              >
                <Clock size={12} />
                Reciente
              </Badge>
            );
          } else {
            return (
              <Badge
                variant="warning"
                className="inline-flex items-center gap-1"
              >
                <Clock size={12} />
                Pendiente
              </Badge>
            );
          }
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: () => (
          <button
            onClick={() => setPaymentsDialogOpen(true)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Ver detalles"
          >
            <ChevronRight
              size={18}
              className="text-[hsl(var(--muted-foreground))]"
            />
          </button>
        ),
      }),
    ],
    [formatCurrency, formatDate],
  );

  // Configure table with pagination
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-pulse">
          <PieChart size={48} className="text-[hsl(var(--brand))]" />
        </div>
        <p className="text-[hsl(var(--muted-foreground))]">
          Cargando datos financieros...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Finanzas
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Resumen financiero y gestión de cuentas por cobrar
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Budgeted */}
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <Badge variant="info" className="text-xs">
              Total
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Presupuestado
            </p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              {formatCurrency(totalBudget)}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Users size={12} />
              {patientsWithDebt.length} paciente
              {patientsWithDebt.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <Badge variant="success" className="text-xs">
              {collectionRate.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Cobrado
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Tasa de cobranza efectiva
            </p>
          </div>
        </div>

        {/* Total Owed */}
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
              <Wallet className="text-orange-600" size={24} />
            </div>
            <Badge variant="warning" className="text-xs">
              Pendiente
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Por Cobrar
            </p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalDebt)}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {recentDebt.length} cuenta{recentDebt.length !== 1 ? "s" : ""}{" "}
              reciente{recentDebt.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div className="card p-6 hover:shadow-lg transition-shadow border-red-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <Badge variant="danger" className="text-xs animate-pulse">
              Urgente
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              En Mora +90 días
            </p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(overdueAmount)}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Clock size={12} />
              {overduePatients.length} paciente
              {overduePatients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Collection Progress Bar */}
      {totalBudget > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-[hsl(var(--brand))]" />
              <h3 className="font-semibold text-[hsl(var(--foreground))]">
                Progreso de Cobranza
              </h3>
            </div>
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              {collectionRate.toFixed(1)}% completado
            </span>
          </div>

          <div className="relative h-4 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
              aria-label={`${collectionRate.toFixed(1)}% cobrado`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
                Cobrado
              </p>
              <p className="font-semibold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
                Pendiente
              </p>
              <p className="font-semibold text-orange-600">
                {formatCurrency(totalDebt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
                Total
              </p>
              <p className="font-semibold text-[hsl(var(--foreground))]">
                {formatCurrency(totalBudget)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Receivable Table */}
      <Section
        title="Cartera de Cuentas por Cobrar"
        icon={<Users size={20} />}
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPaymentsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Phone size={16} />
              Gestionar Cobros
            </Button>
          </div>
        }
      >
        {patientsWithDebt.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
              ¡Excelente! No hay cuentas pendientes
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
              Todos los pacientes están al día con sus pagos. La salud
              financiera de tu consultorio está en óptimas condiciones.
            </p>
          </div>
        ) : (
          <>
            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 pb-4 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-2 flex-1">
                <Filter
                  size={16}
                  className="text-[hsl(var(--muted-foreground))]"
                />
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Filtrar:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      filterStatus === "all"
                        ? "bg-[hsl(var(--brand))] text-white"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80",
                    )}
                  >
                    Todos ({patientsWithDebt.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus("overdue")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      filterStatus === "overdue"
                        ? "bg-red-600 text-white"
                        : "bg-red-500/10 text-red-600 hover:bg-red-500/20",
                    )}
                  >
                    En Mora ({overduePatients.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus("recent")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      filterStatus === "recent"
                        ? "bg-green-600 text-white"
                        : "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                    )}
                  >
                    Recientes ({recentDebt.length})
                  </button>
                </div>
              </div>

              <div className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                <ArrowUpDown size={14} />
                Mostrando {table.getRowModel().rows.length} de{" "}
                {filteredData.length}
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="border-b border-[hsl(var(--border))]"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={cn(
                            "p-3 font-semibold text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-wide",
                            header.column.getCanSort()
                              ? "cursor-pointer select-none hover:text-[hsl(var(--foreground))]"
                              : "",
                            ["full_name"].includes(header.id)
                              ? "text-left"
                              : "text-right",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              ["full_name"].includes(header.id)
                                ? "justify-start"
                                : "justify-end",
                            )}
                          >
                            {typeof header.column.columnDef.header ===
                            "function"
                              ? header.column.columnDef.header(
                                  header.getContext(),
                                )
                              : header.column.columnDef.header}
                            {header.column.getCanSort() && (
                              <ArrowUpDown
                                size={14}
                                className={cn(
                                  "transition-colors",
                                  header.column.getIsSorted()
                                    ? "text-[hsl(var(--brand))]"
                                    : "",
                                )}
                              />
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, index) => {
                    const patient = row.original;
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition-colors group",
                          patient.is_overdue && "bg-red-500/5",
                        )}
                        style={{
                          animation: `fadeIn 300ms ease-out ${index * 50}ms both`,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              "p-3",
                              ["full_name"].includes(cell.column.id)
                                ? "text-left"
                                : "text-right",
                            )}
                          >
                            {typeof cell.column.columnDef.cell === "function"
                              ? cell.column.columnDef.cell(cell.getContext())
                              : (cell.getValue() as any)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {table.getRowModel().rows.length === 0 && (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                <Filter size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  No hay pacientes en esta categoría
                </p>
                <p className="text-sm mt-1">Prueba con otro filtro</p>
              </div>
            )}

            {/* Pagination Controls */}
            {table.getPageCount() > 1 && (
              <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Pagination Info */}
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    Mostrando{" "}
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}
                    </span>{" "}
                    a{" "}
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        filteredData.length,
                      )}
                    </span>{" "}
                    de{" "}
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      {filteredData.length}
                    </span>{" "}
                    pacientes
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="gap-2"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1 px-3 py-1.5 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))]">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {table.getState().pagination.pageIndex + 1}
                      </span>
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        / {table.getPageCount()}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="gap-2"
                    >
                      Siguiente
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      <PendingPaymentsDialog
        open={paymentsDialogOpen}
        onOpenChange={setPaymentsDialogOpen}
        onSelectPatient={handleSelectPatient}
      />
    </div>
  );
}
