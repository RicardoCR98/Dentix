import { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/Select";
import type { Appointment } from "../../lib/types";
import { tauriSqliteRepository } from "../../lib/storage/TauriSqliteRepository";
import { Alert } from "../ui/Alert";
import { Loader2 } from "lucide-react";
import { AppointmentPicker } from "../ui/AppointmentPicker";

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  patientId: number;
  appointment?: Appointment;
}

export const AppointmentDialog = ({
  open,
  onClose,
  onSaved,
  patientId,
  appointment,
}: AppointmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [procedure, setProcedure] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Appointment["status"]>("scheduled");

  // For appointment picker
  const [bookedSlots, setBookedSlots] = useState<
    Array<{ starts_at: string; ends_at: string }>
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(true);

  // Fetch booked appointments when dialog opens
  useEffect(() => {
    if (open) {
      // Fetch appointments for the next 4 weeks
      const fetchBookedSlots = async () => {
        try {
          const today = new Date();
          const fourWeeksLater = new Date();
          fourWeeksLater.setDate(today.getDate() + 28);

          const appointments = await tauriSqliteRepository.listAppointments(
            today.toISOString(),
            fourWeeksLater.toISOString(),
          );

          setBookedSlots(
            appointments.map((apt) => ({
              starts_at: apt.starts_at,
              ends_at: apt.ends_at,
            })),
          );
        } catch (err) {
          console.error("Error fetching appointments:", err);
        }
      };

      fetchBookedSlots();

      // Initialize form fields
      if (appointment) {
        // Editing existing appointment - hide picker
        setShowPicker(false);
        const startDate = new Date(appointment.starts_at);
        const endDate = new Date(appointment.ends_at);
        setDate(startDate.toISOString().split("T")[0]);
        setTimeStart(startDate.toTimeString().split(" ")[0].substring(0, 5));
        setDurationMinutes(
          String(Math.round((endDate.getTime() - startDate.getTime()) / 60000)),
        );
        setProcedure(appointment.procedure);
        setNotes(appointment.notes || "");
        setStatus(appointment.status);
        setSelectedSlot(null);
      } else {
        // Creating new appointment - show picker
        setShowPicker(true);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split("T")[0]);
        setTimeStart("10:00");
        setDurationMinutes("30");
        setProcedure("");
        setNotes("");
        setStatus("scheduled");
        setSelectedSlot(null);
      }
      setError(null);
    }
  }, [open, appointment]);

  // Handle slot selection from picker
  const handleSlotSelect = (slotDate: Date) => {
    setSelectedSlot(slotDate);
    setDate(slotDate.toISOString().split("T")[0]);
    const hours = slotDate.getHours().toString().padStart(2, "0");
    const minutes = slotDate.getMinutes().toString().padStart(2, "0");
    setTimeStart(`${hours}:${minutes}`);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!date || !timeStart) {
        setError("Debes seleccionar fecha y hora");
        return;
      }

      const startsAt = new Date(`${date}T${timeStart}:00`);
      const endsAt = new Date(
        startsAt.getTime() + parseInt(durationMinutes) * 60000,
      );

      const appointmentData: Appointment = {
        patient_id: patientId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        procedure: "Cita", // Default procedure name
        notes: notes.trim() || undefined,
        status: "scheduled", // Always start as scheduled
      };

      if (appointment?.id) {
        await tauriSqliteRepository.updateAppointment(
          appointment.id,
          appointmentData,
        );
      } else {
        await tauriSqliteRepository.createAppointment(appointmentData);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error("Error saving appointment:", err);
      setError(err instanceof Error ? err.message : "Error al guardar cita");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;
    if (!confirm("¿Estás seguro de eliminar esta cita?")) return;

    try {
      setLoading(true);
      setError(null);
      await tauriSqliteRepository.deleteAppointment(appointment.id);
      onSaved();
      onClose();
    } catch (err) {
      console.error("Error deleting appointment:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar cita");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title={appointment ? "Editar cita" : "Programar cita"}
      size="full"
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="danger">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        {/* Show appointment picker for new appointments */}
        {showPicker && !appointment && (
          <div>
            <Label className="mb-2 block">
              Selecciona un horario disponible
            </Label>
            <AppointmentPicker
              bookedSlots={bookedSlots}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
              slotDuration={parseInt(durationMinutes)}
              workStartHour={8}
              workEndHour={18}
              lunchStartHour={12}
              lunchEndHour={13}
            />
          </div>
        )}

        {/* Only show duration and notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duración</Label>
            <SelectRoot
              value={durationMinutes}
              onValueChange={setDurationMinutes}
              disabled={loading}
            >
              <SelectTrigger id="duration" />
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </SelectRoot>
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            {appointment && (
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
              >
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {appointment ? "Guardar" : "Crear cita"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
