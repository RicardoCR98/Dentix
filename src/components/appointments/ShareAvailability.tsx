import { useState } from "react";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Label } from "../ui/Label";
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/Select";
import { tauriSqliteRepository } from "../../lib/storage/TauriSqliteRepository";
import type { Patient, AvailableSlot } from "../../lib/types";
import { Alert } from "../ui/Alert";
import { MessageCircle, Loader2, Calendar } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface ShareAvailabilityProps {
  patient: Patient;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ShareAvailability = ({
  patient,
  open: controlledOpen,
  onOpenChange,
}: ShareAvailabilityProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);

  // Configuration
  const [days, setDays] = useState("7");
  const [slotMinutes, setSlotMinutes] = useState("30");
  const [workStartHour, setWorkStartHour] = useState("9");
  const [workEndHour, setWorkEndHour] = useState("18");

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const availableSlots = await tauriSqliteRepository.generateAvailableSlots(
        {
          days: parseInt(days),
          slotMinutes: parseInt(slotMinutes),
          workStartHour: parseInt(workStartHour),
          workEndHour: parseInt(workEndHour),
        },
      );

      if (availableSlots.length === 0) {
        setError("No hay horarios disponibles en este rango");
        return;
      }

      setSlots(availableSlots);
    } catch (err) {
      console.error("Error generating slots:", err);
      setError(err instanceof Error ? err.message : "Error generando horarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (slots.length === 0) {
      setError("Genera horarios primero");
      return;
    }

    if (!patient.phone) {
      setError("El paciente no tiene teléfono registrado");
      return;
    }

    try {
      // Format slots list
      const slotsList = slots
        .map((slot, index) => {
          const start = new Date(slot.starts_at);
          const dateStr = start.toLocaleDateString("es", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          const timeStr = start.toLocaleTimeString("es", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${index + 1}. ${dateStr} a las ${timeStr}`;
        })
        .join("\n");

      // Generate message
      const message = `Hola ${patient.full_name}. Tengo los siguientes horarios disponibles:\n\n${slotsList}\n\n¿Cuál te viene mejor?`;

      // Clean phone number
      const phone = patient.phone.replace(/\D/g, "");

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      await invoke("open_url", { url: whatsappUrl });

      // Close dialog
      setOpen(false);
    } catch (err) {
      console.error("Error opening WhatsApp:", err);
      setError("Error al abrir WhatsApp");
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Compartir disponibilidad
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Compartir horarios disponibles"
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <Alert variant="danger">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="days">Días a buscar</Label>
              <SelectRoot value={days} onValueChange={setDays}>
                <SelectTrigger id="days" />
                <SelectContent>
                  <SelectItem value="3">3 días</SelectItem>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="14">14 días</SelectItem>
                </SelectContent>
              </SelectRoot>
            </div>

            <div>
              <Label htmlFor="slotMinutes">Duración cita</Label>
              <SelectRoot value={slotMinutes} onValueChange={setSlotMinutes}>
                <SelectTrigger id="slotMinutes" />
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </SelectRoot>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workStart">Horario inicio</Label>
              <SelectRoot
                value={workStartHour}
                onValueChange={setWorkStartHour}
              >
                <SelectTrigger id="workStart" />
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 7).map((hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {hour}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            <div>
              <Label htmlFor="workEnd">Horario fin</Label>
              <SelectRoot value={workEndHour} onValueChange={setWorkEndHour}>
                <SelectTrigger id="workEnd" />
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 14).map((hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {hour}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Calendar className="mr-2 h-4 w-4" />
            Generar horarios
          </Button>

          {slots.length > 0 && (
            <div className="space-y-2">
              <Label>Horarios disponibles ({slots.length})</Label>
              <div className="max-h-48 overflow-y-auto border border-[hsl(var(--border))] rounded-lg p-3 space-y-1 bg-[hsl(var(--surface))]">
                {slots.map((slot, index) => {
                  const start = new Date(slot.starts_at);
                  const dateStr = start.toLocaleDateString("es", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  });
                  const timeStr = start.toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={index}
                      className="text-sm py-1 px-2 hover:bg-[hsl(var(--background))] rounded"
                    >
                      {index + 1}. {dateStr} a las {timeStr}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendWhatsApp} disabled={slots.length === 0}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar por WhatsApp
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
