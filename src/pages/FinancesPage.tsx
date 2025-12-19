// src/pages/FinancesPage.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Phone,
  ChevronRight,
  Search,
  MessageCircle,
  MoreVertical,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import Section from "../components/Section";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/DropdownMenu";
import { QuickPaymentModal } from "../components/QuickPaymentModal";
import { cn } from "../lib/cn";
import type { PatientDebtSummary } from "../lib/types";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter } from "../components/ui/Dialog";
import { useMasterData } from "../hooks/useMasterData";

type FilterStatus = "all" | "not_contacted" | "recently_contacted" | "long_ago";

const columnHelper = createColumnHelper<PatientDebtSummary>();

export function FinancesPage() {
  const [patientsWithDebt, setPatientsWithDebt] = useState<
    PatientDebtSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPatient, setSelectedPatient] =
    useState<PatientDebtSummary | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "days_overdue", desc: true },
  ]);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState<PatientDebtSummary | null>(null);

  const navigate = useNavigate();
  const { paymentMethods } = useMasterData();

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const repo = await getRepository();
      const debtData = await repo.getPatientsWithDebt();
      console.log("📊 Patients with debt loaded:", debtData.length, debtData);
      setPatientsWithDebt(debtData);
    } catch (error) {
      console.error("❌ Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run repair on first load, then load data
    (async () => {
      try {
        const repo = await getRepository();
        const fixed = await repo.repairDebtOpenedDates();
        if (fixed > 0) {
          console.log(`🔧 Repaired debt_opened_at for ${fixed} patients`);
        }
      } catch (error) {
        console.error("Error running debt repair:", error);
      }
      loadFinancialData();
    })();
  }, []);

  // Financial calculations
  const totalDebt = patientsWithDebt.reduce((sum, p) => sum + p.current_balance, 0);

  // Urgent patients (+90 days overdue)
  const urgentPatients = patientsWithDebt.filter(
    (p) => p.days_overdue > 90,
  );

  // Not contacted patients
  const notContactedPatients = patientsWithDebt.filter(
    (p) => p.contact_status === "not_contacted",
  );

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = patientsWithDebt;

    // Filter by contact status
    if (filterStatus === "not_contacted") {
      filtered = filtered.filter((p) => p.contact_status === "not_contacted");
    } else if (filterStatus === "recently_contacted") {
      filtered = filtered.filter((p) => p.contact_status === "recently_contacted");
    } else if (filterStatus === "long_ago") {
      filtered = filtered.filter((p) => p.contact_status === "long_ago");
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.full_name.toLowerCase().includes(query) ||
          (p.phone && p.phone.includes(query)),
      );
    }

    return filtered;
  }, [patientsWithDebt, filterStatus, searchQuery]);

  // Helper functions
  const formatCurrency = useMemo(
    () => (amount: number) => {
      return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [],
  );

  const handleRowClick = (patientId: number) => {
    // Navegar a la ficha del paciente
    navigate(`/registro-clinico?patientId=${patientId}`);
  };

  // Column definitions
  const columns = useMemo<ColumnDef<PatientDebtSummary, any>[]>(
    () => [
      columnHelper.accessor("full_name", {
        id: "full_name",
        enableSorting: true,
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors uppercase"
          >
            Paciente
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: (info) => {
          const patient = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] flex items-center justify-center font-semibold text-sm">
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
      columnHelper.accessor("current_balance", {
        id: "current_balance",
        enableSorting: true,
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors uppercase"
          >
            Saldo pendiente
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: (info) => {
          const patient = info.row.original;
          return (
            <span
              className={cn(
                "font-bold text-lg",
                patient.days_overdue > 90
                  ? "text-red-600"
                  : "text-orange-600",
              )}
            >
              {formatCurrency(info.getValue())}
            </span>
          );
        },
      }),
      columnHelper.accessor("days_overdue", {
        id: "days_overdue",
        enableSorting: true,
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors uppercase"
          >
            Estado de cuenta
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: (info) => {
          const patient = info.row.original;
          const days = info.getValue();

          // Determinar color basado en antigüedad de la deuda
          let colorClass = "text-[hsl(var(--muted-foreground))]";
          if (days <= 7) {
            colorClass = "text-[hsl(var(--muted-foreground))]";
          } else if (days <= 30) {
            colorClass = "text-yellow-600";
          } else if (days <= 90) {
            colorClass = "text-orange-600";
          } else {
            colorClass = "text-red-600";
          }

          // Línea 1: "X días de mora"
          const mainText = days === 1 ? "1 día de mora" : `${days} días de mora`;

          // Línea 2: Estado de contacto (del backend)
          let contextText = "Aún no contactado";
          if (patient.contact_status === "recently_contacted") {
            contextText = "Contactado recientemente";
          } else if (patient.contact_status === "long_ago") {
            contextText = "Última vez contactado hace días";
          }

          return (
            <div className="flex flex-col gap-0.5">
              <span className={cn("text-sm font-medium", colorClass)}>
                {mainText}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {contextText}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: (info) => {
          const patient = info.row.original;

          const handleWhatsApp = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (patient.phone) {
              const phone = patient.phone.replace(/\D/g, ""); // Remove non-digits
              const message = `Hola ${patient.full_name}. Te escribo de la clínica por tu saldo pendiente de ${formatCurrency(patient.current_balance)}. Actualmente tiene ${patient.days_overdue} días de mora. ¿Podemos coordinar el pago hoy?`;
              const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
              window.open(url, "_blank");

              // Marcar como contactado inmediatamente
              try {
                const repo = await getRepository();
                await repo.markPatientContacted(patient.patient_id, "whatsapp");
                // Recargar datos para reflejar el cambio
                await loadFinancialData();
              } catch (error) {
                console.error("Error marcando contacto:", error);
              }
            }
          };

          const handleRegisterPayment = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedPatient(patient);
            setPaymentsDialogOpen(true);
          };

          return (
            <div className="flex items-center gap-2">
              {/* WhatsApp Button */}
              {patient.phone && (
                <button
                  onClick={handleWhatsApp}
                  className="p-2 rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
                  title="Enviar WhatsApp"
                  aria-label="Enviar WhatsApp"
                >
                  <MessageCircle size={18} />
                </button>
              )}

              {/* Register Payment Button */}
              <button
                onClick={handleRegisterPayment}
                className="p-2 rounded-lg hover:bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] transition-colors"
                title="Registrar pago"
                aria-label="Registrar pago"
              >
                <CheckCircle2 size={18} />
              </button>

              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                    aria-label="Más opciones"
                  >
                    <MoreVertical
                      size={18}
                      className="text-[hsl(var(--muted-foreground))]"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setPatientToArchive(patient);
                      setArchiveDialogOpen(true);
                    }}
                    className="text-[hsl(var(--muted-foreground))] focus:text-[hsl(var(--muted-foreground))]"
                  >
                    Archivar deuda
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [formatCurrency],
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
          <Wallet size={48} className="text-[hsl(var(--brand))]" />
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
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand))]/70 flex items-center justify-center shadow-lg">
            <Wallet size={24} className="text-white" />
          </div>
          Finanzas
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Cuentas por cobrar y seguimiento
        </p>
      </div>

      {/* Stats Cards - 3 cards con colores DIFERENTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Por Cobrar */}
        <div className="card p-6 hover:shadow-lg transition-shadow border-blue-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Wallet className="text-blue-600" size={24} />
            </div>
            <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-700">
              Total
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Por Cobrar
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalDebt)}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Users size={12} />
              {patientsWithDebt.length} paciente
              {patientsWithDebt.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Aún no contactados */}
        <div className="card p-6 hover:shadow-lg transition-shadow border-yellow-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <Badge variant="warning" className="text-xs">
              Sin contacto
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Aún no contactados
            </p>
            <p className="text-2xl font-bold text-yellow-600">
              {notContactedPatients.length}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Users size={12} />
              paciente{notContactedPatients.length !== 1 ? "s" : ""} sin contactar
            </p>
          </div>
        </div>

        {/* Urgentes (+90 días) */}
        <div className="card p-6 hover:shadow-lg transition-shadow border-red-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <Badge variant="danger" className="text-xs animate-pulse">
              Urgente
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Urgentes (+90 días)
            </p>
            <p className="text-2xl font-bold text-red-600">
              {urgentPatients.length}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <AlertTriangle size={12} />
              paciente{urgentPatients.length !== 1 ? "s" : ""} en mora crítica
            </p>
          </div>
        </div>
      </div>

      {/* Accounts Receivable Table */}
      <Section title="Cartera de Cuentas por Cobrar" icon={<Users size={20} />}>
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
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 pb-4 border-b border-[hsl(var(--border))]">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
                />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o teléfono"
                  className="pl-10"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                    filterStatus === "all"
                      ? "bg-[hsl(var(--brand))] text-white"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80",
                  )}
                >
                  Todos ({patientsWithDebt.length})
                </button>
                <button
                  onClick={() => setFilterStatus("not_contacted")}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                    filterStatus === "not_contacted"
                      ? "bg-yellow-600 text-white"
                      : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
                  )}
                >
                  Aún no contactado ({notContactedPatients.length})
                </button>
                <button
                  onClick={() => setFilterStatus("recently_contacted")}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                    filterStatus === "recently_contacted"
                      ? "bg-green-600 text-white"
                      : "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                  )}
                >
                  Contactado recientemente
                </button>
                <button
                  onClick={() => setFilterStatus("long_ago")}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                    filterStatus === "long_ago"
                      ? "bg-orange-600 text-white"
                      : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
                  )}
                >
                  Contacto antiguo
                </button>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[hsl(var(--muted))]/50 border-b-2 border-[hsl(var(--border))]">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                              <Filter size={32} className="text-[hsl(var(--muted-foreground))]" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                                No se encontraron pacientes
                              </h3>
                              <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md">
                                Intenta cambiar los términos de búsqueda o limpiar los filtros
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row, index) => (
                        <tr
                          key={row.id}
                          onClick={() => handleRowClick(row.original.patient_id)}
                          className="hover:bg-[hsl(var(--muted))]/30 transition-all duration-150 group cursor-pointer"
                          role="button"
                          tabIndex={0}
                          aria-label={`Ver detalle de ${row.original.full_name}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRowClick(row.original.patient_id);
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-6 py-5 text-sm animate-fadeIn"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {table.getPageCount() > 1 && (
                <div className="px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
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
                        variant="secondary"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="gap-2"
                      >
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
                        variant="primary"
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
            </div>
          </>
        )}
      </Section>

      {/* Quick Payment Modal */}
      {selectedPatient && (
        <QuickPaymentModal
          open={paymentsDialogOpen}
          onOpenChange={setPaymentsDialogOpen}
          patientId={selectedPatient.patient_id}
          paymentMethods={paymentMethods}
          onSave={async (payment) => {
            try {
              const repo = await getRepository();

              // 1. Get patient data
              const patient = await repo.findPatientById(selectedPatient.patient_id);
              if (!patient) {
                throw new Error("Paciente no encontrado");
              }

              // 2. Get last cumulative balance
              const sessions = await repo.getSessionsByPatientList(selectedPatient.patient_id);
              const lastSession = sessions.length > 0 ? sessions[0] : null;
              const previousCumulativeBalance = selectedPatient.current_balance;

              // 3. Calculate new cumulative balance
              const newCumulativeBalance = previousCumulativeBalance - payment.amount;

              // 4. Create payment session
              const paymentSession = {
                id: undefined,
                patient_id: selectedPatient.patient_id,
                date: payment.date,
                reason_type: "Abono a cuenta",
                reason_detail: null,
                diagnosis_text: null,
                auto_dx_text: null,
                full_dx_text: null,
                tooth_dx_json: null,
                budget: 0,
                discount: 0,
                payment: payment.amount,
                balance: -payment.amount,
                cumulative_balance: newCumulativeBalance,
                payment_method_id: payment.payment_method_id,
                payment_notes: payment.payment_notes,
                signer: null,
                clinical_notes: null,
                is_saved: true,
              };

              // 5. Create a dummy visit for the parent structure (required by savePatientWithSessions)
              const dummyVisit = { ...paymentSession };

              // 6. Save via repository
              await repo.savePatientWithSessions({
                patient,
                session: dummyVisit,
                sessions: [
                  {
                    session: paymentSession,
                    items: [],
                  },
                ],
              });

              // 7. TRIADA logic is now applied automatically in Rust backend
              //    (see save_visit_with_sessions command)

              // 8. Reload data
              await loadFinancialData();
            } catch (error) {
              console.error("Error saving payment:", error);
              throw error;
            }
          }}
        />
      )}

      {/* Archive Debt Confirmation Dialog */}
      {patientToArchive && (
        <Dialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          title="¿Archivar deuda?"
          description={`La deuda de ${patientToArchive.full_name} de ${formatCurrency(patientToArchive.current_balance)} será archivada.`}
          size="md"
        >
          <DialogContent>
            <div className="space-y-3 py-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Esta acción:
              </p>
              <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))] list-disc list-inside">
                <li>No eliminará los datos del paciente</li>
                <li>La deuda seguirá visible en su historial</li>
                <li>No contará en el total "Por cobrar"</li>
                <li>Se puede reactivar en el futuro</li>
              </ul>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setArchiveDialogOpen(false);
                  setPatientToArchive(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    const repo = await getRepository();

                    // Archive debt for this patient
                    await repo.archiveDebt(patientToArchive.patient_id);

                    // Close modal
                    setArchiveDialogOpen(false);
                    setPatientToArchive(null);

                    // Reload data
                    await loadFinancialData();
                  } catch (error) {
                    console.error('Error archivando deuda:', error);
                    // TODO: Show error toast
                  }
                }}
              >
                Archivar deuda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
