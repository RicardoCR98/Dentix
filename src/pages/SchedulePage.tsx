import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate } from "react-router-dom";
import { tauriSqliteRepository } from "../lib/storage/TauriSqliteRepository";
import type { Appointment } from "../lib/types";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";

// Configure moment locale - Spanish with Monday as first day
moment.locale("es-ES", {
  week: {
    dow: 1, // Monday is the first day of the week
    doy: 4, // Used to determine first week of the year
  },
  weekdaysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sa"],
  weekdaysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  weekdays: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  months: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthsShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
});

const localizer = momentLocalizer(moment);

// Appointment event adapter for react-big-calendar
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

export const SchedulePage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch appointments for current view range
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate range based on current view
      let rangeStart: Date;
      let rangeEnd: Date;

      if (currentView === "week") {
        rangeStart = moment(currentDate).startOf("week").toDate();
        rangeEnd = moment(currentDate).endOf("week").toDate();
      } else if (currentView === "day") {
        rangeStart = moment(currentDate).startOf("day").toDate();
        rangeEnd = moment(currentDate).endOf("day").toDate();
      } else {
        // month view
        rangeStart = moment(currentDate)
          .startOf("month")
          .subtract(7, "days")
          .toDate();
        rangeEnd = moment(currentDate).endOf("month").add(7, "days").toDate();
      }

      const appointmentList = await tauriSqliteRepository.listAppointments(
        rangeStart.toISOString(),
        rangeEnd.toISOString(),
      );

      setAppointments(appointmentList);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err instanceof Error ? err.message : "Error cargando citas");
    } finally {
      setLoading(false);
    }
  }, [currentDate, currentView]);

  // Initial load and refresh on date/view change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Convert appointments to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id!,
      title: `${apt.procedure}${apt.status === "confirmed" ? " ✓" : apt.status === "cancelled" ? " ✗" : ""}`,
      start: new Date(apt.starts_at),
      end: new Date(apt.ends_at),
      resource: apt,
    }));
  }, [appointments]);

  // Event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const apt = event.resource;
    let backgroundColor = "#4F46E5"; // default indigo

    if (apt.status === "confirmed") {
      backgroundColor = "#10B981"; // green
    } else if (apt.status === "cancelled") {
      backgroundColor = "#EF4444"; // red
    } else if (apt.status === "completed") {
      backgroundColor = "#6B7280"; // gray
    } else if (apt.status === "no_show") {
      backgroundColor = "#F59E0B"; // amber
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  }, []);

  // Click handler - navigate to patient
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      const apt = event.resource;
      if (apt.patient_id) {
        // Navigate to patient record
        navigate(`/registro-clinico?patientId=${apt.patient_id}`);
      }
    },
    [navigate],
  );

  // Prevent slot selection (creation is done from PatientsPage)
  const handleSelectSlot = useCallback(() => {
    // Do nothing - appointments are created from PatientsPage
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand))]/70 flex items-center justify-center shadow-lg">
              <CalendarIcon size={24} className="text-white" />
            </div>
            Agenda
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            Gestión y seguimiento de pacientes registrados
          </p>
        </div>
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 lg:px-8">
          <div className="flex justify-end mb-2">
            <Button variant="secondary" size="sm" onClick={fetchAppointments}>
              <RefreshCw size={16} className="mr-2" />
              Actualizar
            </Button>
          </div>
          {error && (
            <Alert variant="danger" className="mb-4">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--brand))]"></div>
            </div>
          ) : (
            <div className="p-4 card">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                view={currentView}
                onView={setCurrentView}
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable={false}
                eventPropGetter={eventStyleGetter}
                messages={{
                  next: "Siguiente",
                  previous: "Anterior",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Cita",
                  noEventsInRange: "No hay citas en este rango",
                  showMore: (total) => `+ Ver ${total} más`,
                }}
                formats={{
                  dayHeaderFormat: "dddd DD/MM",
                  dayRangeHeaderFormat: ({ start, end }) =>
                    `${moment(start).format("DD MMM")} - ${moment(end).format("DD MMM YYYY")}`,
                  agendaDateFormat: "DD/MM/YYYY",
                  agendaTimeFormat: "HH:mm",
                  agendaTimeRangeFormat: ({ start, end }) =>
                    `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
                }}
                min={new Date(2000, 0, 1, 8, 0, 0)}
                max={new Date(2000, 0, 1, 20, 0, 0)}
              />
            </div>
          )}

          <div className="mt-4 flex items-start gap-4 text-sm text-[hsl(var(--text-muted))]">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#4F46E5" }}
              ></div>
              <span>Programada</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#10B981" }}
              ></div>
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#EF4444" }}
              ></div>
              <span>Cancelada</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#6B7280" }}
              ></div>
              <span>Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#F59E0B" }}
              ></div>
              <span>No asistió</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
