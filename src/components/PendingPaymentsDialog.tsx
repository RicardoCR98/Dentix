import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent } from "./ui/Dialog";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import {
  User,
  Phone,
  DollarSign,
  Search,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "../lib/cn";
import type { Patient } from "../lib/types";

export type ProcItem = { name: string; unit: number; qty: number; sub: number };
export type SessionRow = {
  id?: string;
  date: string;
  items: ProcItem[];
  auto: boolean;
  budget: number;
  payment: number;
  balance: number;
  signer?: string;
};

interface PatientWithDebt {
  patient: Patient;
  totalDebt: number;
  lastSessionDate: string;
  isOverdue: boolean;
  daysOverdue: number;
}

interface PendingPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  patientSessions: Record<number, SessionRow[]>;
  onSelectPatient: (patient: Patient) => void;
}

export default function PendingPaymentsDialog({
  open,
  onOpenChange,
  patients,
  patientSessions,
  onSelectPatient,
}: PendingPaymentsDialogProps) {
  // inputValue: lo que escribe el usuario
  const [inputValue, setInputValue] = useState("");
  // searchTerm: valor con debounce (se usa para filtrar)
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce 250 ms
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(inputValue.trim()), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const hasTyped = searchTerm.length > 0;

  const patientsWithDebt = useMemo(() => {
    const result: PatientWithDebt[] = [];

    patients.forEach((patient) => {
      if (!patient.id) return;

      const sessions = patientSessions[patient.id] || [];
      const totalDebt = sessions.reduce((sum, s) => sum + s.balance, 0);

      if (totalDebt > 0) {
        const sessionsWithBalance = sessions
          .filter((s) => s.balance > 0)
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        const lastSession = sessionsWithBalance[0];
        const lastDate =
          lastSession?.date || sessions[sessions.length - 1]?.date || "";

        const daysDiff = lastDate
          ? Math.floor(
              (Date.now() - new Date(lastDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        const isOverdue = daysDiff > 90;

        result.push({
          patient,
          totalDebt,
          lastSessionDate: lastDate,
          isOverdue,
          daysOverdue: daysDiff,
        });
      }
    });

    // Orden: primero en mora, luego mayor deuda
    return result.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.totalDebt - a.totalDebt;
    });
  }, [patients, patientSessions]);

  // Filtro con debounce (solo si se escribió)
  const filteredPatients = useMemo(() => {
    if (!hasTyped) return [];
    const term = searchTerm.toLowerCase();
    return patientsWithDebt.filter(
      (p) =>
        p.patient.full_name?.toLowerCase().includes(term) ||
        p.patient.phone?.toLowerCase().includes(term) ||
        p.patient.doc_id?.toLowerCase().includes(term)
    );
  }, [patientsWithDebt, hasTyped, searchTerm]);

  // Qué mostrar:
  // - Sin escribir: Top 5 deudores
  // - Escribiendo: resultados filtrados (máx 5)
  const top5 = useMemo(() => patientsWithDebt.slice(0, 5), [patientsWithDebt]);
  const visible = hasTyped ? filteredPatients.slice(0, 5) : top5;

  const totalDebt = patientsWithDebt.reduce((sum, p) => sum + p.totalDebt, 0);
  const overdueCount = patientsWithDebt.filter((p) => p.isOverdue).length;

  const handleSelect = (patient: Patient) => {
    onSelectPatient(patient);
    onOpenChange(false);
    setInputValue("");
    setSearchTerm("");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Sin fecha";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const money = (n: number) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setInputValue("");
          setSearchTerm("");
        }
      }}
      title="Cartera Pendiente"
      description={`${patientsWithDebt.length} paciente${
        patientsWithDebt.length !== 1 ? "s" : ""
      } con saldo pendiente`}
      size="4xl"
    >
      <DialogContent>
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={18} className="text-red-600" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Total adeudado
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {money(totalDebt)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={18} className="text-orange-600" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                En mora (+3 meses)
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{overdueCount}</p>
          </div>
        </div>

        {/* Buscador */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Buscar por nombre, teléfono o cédula..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            icon={<Search size={18} />}
            autoFocus
            className="h-11"
          />
          <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {hasTyped ? "Mostrando coincidencias (máx. 5)" : "Top 5 deudores"}
          </div>
        </div>

        {/* Tabla / Lista */}
        <div className="space-y-2 max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--muted))] scrollbar-track-transparent">
          {patientsWithDebt.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign
                size={48}
                className="mx-auto mb-3 text-green-500 opacity-40"
              />
              <p className="text-lg font-medium">¡No hay deudas pendientes!</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Todos los pacientes están al día
              </p>
            </div>
          ) : hasTyped && visible.length === 0 ? (
            <div className="text-center py-12">
              <Search
                size={48}
                className="mx-auto mb-3 text-[hsl(var(--muted-foreground))] opacity-60"
              />
              <p className="text-lg font-medium">No se encontraron resultados</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Intenta con otro término de búsqueda
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr_1fr_1.5fr_120px] gap-4 px-4 py-2 bg-[hsl(var(--muted))]/50 rounded-lg text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                <div>
                  {hasTyped ? "Paciente (coincidencias)" : "Top 5 deudores"}
                </div>
                <div className="text-center">Debe</div>
                <div className="text-center">Última sesión</div>
                <div className="text-center">Acción</div>
              </div>

              {visible.map((item) => (
                <div
                  key={item.patient.id}
                  className={cn(
                    "grid grid-cols-[2fr_1fr_1.5fr_120px] gap-4 items-center px-4 py-3 rounded-lg transition-all",
                    "hover:bg-[hsl(var(--muted))] border",
                    item.isOverdue
                      ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
                      : "bg-[hsl(var(--surface))] border-transparent hover:border-[hsl(var(--brand))]/30"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User
                        size={16}
                        className={
                          item.isOverdue
                            ? "text-red-500"
                            : "text-[hsl(var(--brand))]"
                        }
                      />
                      <span className="font-semibold">
                        {item.patient.full_name}
                      </span>
                      {item.isOverdue && (
                        <Badge variant="danger" className="text-xs animate-pulse">
                          MORA
                        </Badge>
                      )}
                    </div>
                    {item.patient.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                        <Phone size={12} />
                        <span>{item.patient.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p
                      className={cn(
                        "font-bold text-lg",
                        item.isOverdue ? "text-red-600" : "text-orange-600"
                      )}
                    >
                      {money(item.totalDebt)}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-sm">
                      <Calendar
                        size={14}
                        className="text-[hsl(var(--muted-foreground))]"
                      />
                      <span>{formatDate(item.lastSessionDate)}</span>
                    </div>
                    {item.isOverdue && (
                      <p className="text-xs text-red-600 mt-0.5">
                        Hace {item.daysOverdue} días
                      </p>
                    )}
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => handleSelect(item.patient)}
                      variant={item.isOverdue ? "primary" : "secondary"}
                      size="sm"
                      className="w-full"
                    >
                      Ver detalles
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {visible.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              💡 <strong>Nota:</strong> Los pacientes marcados como "MORA"
              tienen deudas de hace más de 3 meses.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
