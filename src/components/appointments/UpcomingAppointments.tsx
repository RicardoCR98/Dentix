import { useState, useEffect } from "react";
import { tauriSqliteRepository } from "../../lib/storage/TauriSqliteRepository";
import type { Appointment } from "../../lib/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Calendar, Clock, MessageCircle, Check, X } from "lucide-react";

interface UpcomingAppointmentsProps {
  patientId: number;
  onEdit: (appointment: Appointment) => void;
  onRefresh?: () => void;
}

export const UpcomingAppointments = ({
  patientId,
  onEdit,
  onRefresh,
}: UpcomingAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const upcoming = await tauriSqliteRepository.listUpcomingAppointments(7);
      // Filter for this patient
      setAppointments(
        upcoming.filter((apt) => apt.patient_id === patientId)
      );
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId]);

  const handleConfirm = async (apt: Appointment) => {
    try {
      await tauriSqliteRepository.updateAppointment(apt.id!, {
        ...apt,
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      });
      fetchAppointments();
      onRefresh?.();
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  const handleCancel = async (apt: Appointment) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    try {
      await tauriSqliteRepository.updateAppointment(apt.id!, {
        ...apt,
        status: "cancelled",
      });
      fetchAppointments();
      onRefresh?.();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  const handleOpenWhatsApp = async (apt: Appointment) => {
    try {
      // Get patient info
      const patient = await tauriSqliteRepository.findPatientById(apt.patient_id);
      if (!patient || !patient.phone) {
        alert("El paciente no tiene teléfono registrado");
        return;
      }

      // Format date/time
      const startDate = new Date(apt.starts_at);
      const dateStr = startDate.toLocaleDateString("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const timeStr = startDate.toLocaleTimeString("es", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Generate message
      const message = `Hola ${patient.full_name}. Te recuerdo que tienes tu cita de ${apt.procedure} el ${dateStr} a las ${timeStr}. ¡Te esperamos!`;

      // Clean phone number
      const phone = patient.phone.replace(/\D/g, "");

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      // Use Tauri opener plugin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isTauri = typeof (window as any).__TAURI__ !== "undefined";

      if (isTauri) {
        const { open } = await import("@tauri-apps/plugin-opener");
        await open(whatsappUrl);
      } else {
        window.open(whatsappUrl, "_blank");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      alert("Error al abrir WhatsApp");
    }
  };

  const getStatusBadge = (status: Appointment["status"]) => {
    const variants: Record<Appointment["status"], { variant: "success" | "info" | "warning" | "danger" | "default"; label: string }> = {
      scheduled: { variant: "info", label: "Programada" },
      confirmed: { variant: "success", label: "Confirmada" },
      cancelled: { variant: "danger", label: "Cancelada" },
      no_show: { variant: "warning", label: "No asistió" },
      completed: { variant: "default", label: "Completada" },
    };
    return variants[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--brand))]"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-[hsl(var(--text-muted))]">
        <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>No hay citas próximas (7 días)</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt) => {
        const startDate = new Date(apt.starts_at);
        const endDate = new Date(apt.ends_at);
        const badge = getStatusBadge(apt.status);

        return (
          <Card key={apt.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">{apt.procedure}</h4>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-[hsl(var(--text-muted))]">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {startDate.toLocaleDateString("es", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {startDate.toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {endDate.toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {apt.notes && (
                  <p className="text-sm text-[hsl(var(--text-muted))]">
                    {apt.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-1">
                {apt.status === "scheduled" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleConfirm(apt)}
                      title="Confirmar"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenWhatsApp(apt)}
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {(apt.status === "scheduled" || apt.status === "confirmed") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancel(apt)}
                    title="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(apt)}
                >
                  Editar
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
