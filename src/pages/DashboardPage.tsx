import { useState, useEffect } from "react";
import { Calendar, Clock, Bell } from "lucide-react";
import type { Appointment } from "../lib/types";
import { tauriSqliteRepository } from "../lib/storage/TauriSqliteRepository";

export const DashboardPage = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      // Today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayApts = await tauriSqliteRepository.listAppointments(
        today.toISOString(),
        todayEnd.toISOString()
      );
      setTodayAppointments(todayApts);

      // Tomorrow's appointments (for reminders)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tomorrowApts = await tauriSqliteRepository.listAppointments(
        tomorrow.toISOString(),
        tomorrowEnd.toISOString()
      );
      setTomorrowAppointments(tomorrowApts);

      // Upcoming week appointments (next 7 days, excluding today)
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingApts = await tauriSqliteRepository.listAppointments(
        todayEnd.toISOString(),
        nextWeek.toISOString()
      );
      setUpcomingAppointments(upcomingApts);
    } catch (err) {
      console.error("Error fetching dashboard appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--brand))]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
        </header>

        {/* Main Content - 2 Column Layout */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Column 1: Today's Appointments */}
            <div className="space-y-6">
              {/* Today's appointments section */}
              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-[hsl(var(--brand))]/10">
                    <Clock size={20} className="text-[hsl(var(--brand))]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Citas de Hoy</h2>
                    <p className="text-sm text-[hsl(var(--text-muted))]">
                      {new Date().toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>

                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8 text-[hsl(var(--text-muted))]">
                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No hay citas programadas para hoy</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((apt) => {
                      const startTime = new Date(apt.starts_at);
                      const isPast = startTime < new Date();

                      return (
                        <div
                          key={apt.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isPast
                              ? "bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))] opacity-60"
                              : "bg-white border-[hsl(var(--border))] hover:border-[hsl(var(--brand))]/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-[hsl(var(--text))]">
                                {startTime.toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                {apt.procedure}
                              </div>
                            </div>
                            <div
                              className={`text-xs px-2 py-1 rounded-full ${
                                apt.status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : apt.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {apt.status === "confirmed"
                                ? "Confirmada"
                                : apt.status === "cancelled"
                                ? "Cancelada"
                                : "Programada"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tomorrow's reminders */}
              {tomorrowAppointments.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Bell size={20} className="text-amber-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-amber-900">
                        Recordatorios para Mañana
                      </h2>
                      <p className="text-sm text-amber-700">
                        {tomorrowAppointments.length}{" "}
                        {tomorrowAppointments.length === 1 ? "cita" : "citas"} programadas
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tomorrowAppointments.map((apt) => {
                      const startTime = new Date(apt.starts_at);
                      return (
                        <div
                          key={apt.id}
                          className="p-3 rounded-lg bg-white border border-amber-200"
                        >
                          <div className="font-medium text-amber-900">
                            {startTime.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-sm text-amber-700 mt-1">
                            {apt.procedure}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Upcoming Week Appointments */}
            <div>
              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Calendar size={20} className="text-purple-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Próximas Citas</h2>
                    <p className="text-sm text-[hsl(var(--text-muted))]">
                      Próximos 7 días
                    </p>
                  </div>
                </div>

                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-[hsl(var(--text-muted))]">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No hay citas programadas esta semana</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((apt) => {
                      const startDate = new Date(apt.starts_at);

                      return (
                        <div
                          key={apt.id}
                          className="p-4 rounded-lg border border-[hsl(var(--border))] bg-white hover:border-purple-300 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-[hsl(var(--text))]">
                                {startDate.toLocaleDateString("es-ES", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}{" "}
                                -{" "}
                                {startDate.toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                {apt.procedure}
                              </div>
                            </div>
                            <div
                              className={`text-xs px-2 py-1 rounded-full ${
                                apt.status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : apt.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {apt.status === "confirmed"
                                ? "Confirmada"
                                : apt.status === "cancelled"
                                ? "Cancelada"
                                : "Programada"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
