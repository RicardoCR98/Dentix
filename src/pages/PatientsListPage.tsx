// src/pages/PatientsListPage.tsx
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { usePatientsTable } from "../hooks/usePatientsTable";
import type { PatientListItem } from "../lib/types";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";

const columnHelper = createColumnHelper<PatientListItem>();

export function PatientsListPage() {
  const navigate = useNavigate();
  const { data, loading, error, globalFilter, setGlobalFilter } =
    usePatientsTable();

  // Helper function to get days since last visit
  const getDaysSinceLastVisit = useCallback(
    (dateStr: string | null): number | null => {
      if (!dateStr) return null;
      const lastVisit = new Date(dateStr);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    [],
  );

  // Helper function to get visit status badge
  const getVisitStatusBadge = (dateStr: string | null) => {
    if (!dateStr) {
      return (
        <Badge variant="default" className="gap-1">
          <AlertCircle size={12} />
          Sin visitas
        </Badge>
      );
    }

    const days = getDaysSinceLastVisit(dateStr);
    if (days === null) return null;

    if (days <= 30) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 size={12} />
          Reciente
        </Badge>
      );
    } else if (days <= 90) {
      return (
        <Badge variant="info" className="gap-1">
          <Clock size={12} />
          Activo
        </Badge>
      );
    } else {
      return (
        <Badge variant="warning" className="gap-1">
          <Clock size={12} />
          Inactivo
        </Badge>
      );
    }
  };

  const renderAllergyBadge = useCallback((allergyDetail?: string | null) => {
    const hasAllergies = Boolean(allergyDetail && allergyDetail.trim());

    if (hasAllergies) {
      return (
        <Badge
          variant="danger"
          className="gap-1"
          title={allergyDetail ?? "Alergias registradas"}
        >
          <AlertCircle size={12} />
          Alergia registrada
        </Badge>
      );
    }

    return (
      <Badge
        variant="default"
        className="gap-1"
        title="Sin alergias ni condiciones reportadas"
      >
        <CheckCircle2 size={12} />
        Sin alergias
      </Badge>
    );
  }, []);

  const buildWhatsAppLink = useCallback((phone: string, fullName: string) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;

    const defaultMessage = encodeURIComponent(`Hola ${fullName},`);
    return `https://wa.me/${digits}?text=${defaultMessage}`;
  }, []);

  const handleNewSessionShortcut = useCallback(
    (patientId: number) => {
      navigate(`/registro-clinico?patientId=${patientId}&newSession=1`);
    },
    [navigate],
  );

  // Column definitions
  const columns = useMemo<ColumnDef<PatientListItem, any>[]>(
    () => [
      columnHelper.accessor("full_name", {
        id: "full_name",
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
          const row = info.row.original;
          const hasDebt = row.pending_balance > 0;

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] flex items-center justify-center font-semibold text-sm">
                  {info.getValue().charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[hsl(var(--foreground))]">
                    {info.getValue()}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <Phone size={12} />
                    <span className="font-mono text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                      : {info.row.original.phone}
                    </span>
                  </div>
                </div>
              </div>
              {hasDebt && (
                <div className="ml-10 text-xs text-[hsl(var(--warning))] flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>Tiene saldo pendiente</span>
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("last_visit_date", {
        id: "last_visit_date",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors uppercase"
          >
            Última visita
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: (info) => {
          const date = info.getValue();
          const days = getDaysSinceLastVisit(date);

          return (
            <div className="flex flex-col gap-2">
              {/*getVisitStatusBadge(date)*/}
              {date && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <Calendar size={12} />
                    <span>{new Date(date).toLocaleDateString("es-ES")}</span>
                  </div>
                  {days !== null && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Hace {days} días
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("allergy_detail", {
        id: "allergy_detail",
        header: "Estado",
        cell: (info) => (
          <div className="flex items-center">
            {renderAllergyBadge(info.getValue())}
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const patient = row.original;
          const whatsappLink = buildWhatsAppLink(
            patient.phone,
            patient.full_name,
          );

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full badge-success"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  if (whatsappLink) {
                    window.open(whatsappLink, "_blank", "noopener,noreferrer");
                  }
                }}
                disabled={!whatsappLink}
                title={
                  whatsappLink
                    ? `Abrir chat de WhatsApp con ${patient.full_name}`
                    : "Agrega un número válido para WhatsApp"
                }
                aria-label={
                  whatsappLink
                    ? `Contactar a ${patient.full_name} por WhatsApp`
                    : "WhatsApp no disponible"
                }
                type="button"
              >
                <MessageCircle size={16} className="text-[#25D366]" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-full badge-default"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  handleNewSessionShortcut(patient.id);
                }}
                title="Agregar una nueva sesión para este paciente"
                aria-label="Agregar nueva sesión"
                type="button"
              >
                <Plus size={16} />
              </Button>
            </div>
          );
        },
      }),
    ],
    [
      buildWhatsAppLink,
      getDaysSinceLastVisit,
      handleNewSessionShortcut,
      renderAllergyBadge,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const handleRowClick = (patientId: number) => {
    navigate(`/registro-clinico?patientId=${patientId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-10 w-48 bg-[hsl(var(--muted))] rounded animate-pulse" />
          <div className="h-4 w-64 bg-[hsl(var(--muted))] rounded animate-pulse" />
        </div>

        {/* Search Skeleton */}
        <div className="h-12 bg-[hsl(var(--muted))] rounded animate-pulse" />

        {/* Table Skeleton */}
        <div className="bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[hsl(var(--muted))] rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[hsl(var(--muted))] rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-[hsl(var(--muted))] rounded w-1/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))] p-6 space-y-2"
            >
              <div className="h-4 bg-[hsl(var(--muted))] rounded w-1/2 animate-pulse" />
              <div className="h-8 bg-[hsl(var(--muted))] rounded w-1/3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--danger))]/10 flex items-center justify-center">
                <AlertCircle size={32} className="text-[hsl(var(--danger))]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Error al cargar pacientes
                </h3>
                <p className="text-[hsl(var(--muted-foreground))]">{error}</p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                className="gap-2"
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const activeFilter = globalFilter && globalFilter.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand))]/70 flex items-center justify-center shadow-lg">
              <Users size={24} className="text-white" />
            </div>
            Pacientes
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            Gestión y seguimiento de pacientes registrados
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-[hsl(var(--border))]
            bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]
            placeholder:text-[hsl(var(--muted-foreground))]
            focus:outline-none focus:border-[hsl(var(--brand))] focus:ring-4 focus:ring-[hsl(var(--brand))]/10
            transition-all duration-200"
            aria-label="Buscar pacientes"
          />
          {activeFilter && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Badge variant="info" className="gap-1">
                <Search size={12} />
                {filteredCount} resultado{filteredCount !== 1 ? "s" : ""}
              </Badge>
              <button
                onClick={() => setGlobalFilter("")}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {/* New patient CTA */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => navigate("/registro-clinico")}
            aria-label="Crear nueva historia clínica"
          >
            <Plus size={16} />
            Nuevo paciente
          </Button>
        </div>
      </div>

      {/* Table Container */}
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
                  <td colSpan={columns.length} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                        {activeFilter ? (
                          <Search
                            size={32}
                            className="text-[hsl(var(--muted-foreground))]"
                          />
                        ) : (
                          <Users
                            size={32}
                            className="text-[hsl(var(--muted-foreground))]"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                          {activeFilter
                            ? "No se encontraron pacientes"
                            : "No hay pacientes registrados"}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md">
                          {activeFilter
                            ? "Intenta cambiar los términos de búsqueda o limpiar los filtros"
                            : "Comienza agregando tu primer paciente desde el registro clínico"}
                        </p>
                      </div>
                      {activeFilter && (
                        <Button
                          variant="secondary"
                          onClick={() => setGlobalFilter("")}
                          className="gap-2"
                        >
                          Limpiar búsqueda
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.original.id)}
                    className="hover:bg-[hsl(var(--muted))]/30 cursor-pointer transition-all duration-150 group"
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir ficha de ${row.original.full_name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(row.original.id);
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

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                    table.getFilteredRowModel().rows.length,
                  )}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-[hsl(var(--foreground))]">
                  {table.getFilteredRowModel().rows.length}
                </span>{" "}
                pacientes
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
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
    </div>
  );
}
