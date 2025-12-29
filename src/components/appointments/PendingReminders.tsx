import { useState, useEffect } from "react";
import { tauriSqliteRepository } from "../../lib/storage/TauriSqliteRepository";
import type { MessageQueueItem, Patient } from "../../lib/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { MessageCircle, Check, X, RefreshCw } from "lucide-react";
import { Alert } from "../ui/Alert";

export const PendingReminders = () => {
  const [messages, setMessages] = useState<MessageQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientNames, setPatientNames] = useState<Record<number, string>>({});

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending messages
      const pending = await tauriSqliteRepository.listPendingMessages();
      setMessages(pending);

      // Fetch patient names for each message
      const names: Record<number, string> = {};
      for (const msg of pending) {
        if (!names[msg.patient_id]) {
          try {
            const patient = await tauriSqliteRepository.findPatientById(
              msg.patient_id
            );
            if (patient) {
              names[msg.patient_id] = patient.full_name;
            }
          } catch (err) {
            console.error("Error fetching patient:", err);
          }
        }
      }
      setPatientNames(names);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Error cargando mensajes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleGenerateReminders = async () => {
    try {
      setLoading(true);
      const count = await tauriSqliteRepository.generate1dReminders();
      console.log(`Generated ${count} new reminders`);
      await fetchMessages();
    } catch (err) {
      console.error("Error generating reminders:", err);
      setError(
        err instanceof Error ? err.message : "Error generando recordatorios"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = async (msg: MessageQueueItem) => {
    try {
      // Get patient phone
      const patient = await tauriSqliteRepository.findPatientById(
        msg.patient_id
      );
      if (!patient || !patient.phone) {
        alert("El paciente no tiene teléfono registrado");
        return;
      }

      // Clean phone number
      const phone = patient.phone.replace(/\D/g, "");

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg.message_text)}`;

      // Use Tauri opener plugin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isTauri = typeof (window as any).__TAURI__ !== "undefined";

      if (isTauri) {
        const { open } = await import("@tauri-apps/plugin-opener");
        await open(whatsappUrl);
      } else {
        window.open(whatsappUrl, "_blank");
      }
    } catch (err) {
      console.error("Error opening WhatsApp:", err);
      alert("Error al abrir WhatsApp");
    }
  };

  const handleMarkAsSent = async (msg: MessageQueueItem) => {
    if (!msg.id) return;

    try {
      await tauriSqliteRepository.markMessageAsSent(msg.id);
      await fetchMessages();
    } catch (err) {
      console.error("Error marking as sent:", err);
      alert("Error al marcar como enviado");
    }
  };

  const handleSkip = async (msg: MessageQueueItem) => {
    if (!msg.id) return;
    if (!confirm("¿Omitir este recordatorio?")) return;

    // For now, we'll just mark as sent to remove from pending list
    // In a real implementation, we might want a "skipped" status
    try {
      await tauriSqliteRepository.markMessageAsSent(msg.id);
      await fetchMessages();
    } catch (err) {
      console.error("Error skipping message:", err);
      alert("Error al omitir recordatorio");
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--brand))]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Mensajes pendientes</h3>
          {messages.length > 0 && (
            <Badge variant="info">{messages.length}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateReminders}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Generar recordatorios
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {messages.length === 0 ? (
        <Card className="p-8 text-center text-[hsl(var(--text-muted))]">
          <MessageCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No hay mensajes pendientes</p>
          <p className="text-sm mt-1">
            Los recordatorios se generan automáticamente para citas de mañana
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const patientName = patientNames[msg.patient_id] || "Paciente";
            const typeLabels = {
              reminder_1d: "Recordatorio 1 día",
              availability: "Disponibilidad",
              custom: "Personalizado",
            };
            const typeLabel =
              typeLabels[msg.type as keyof typeof typeLabels] || msg.type;

            return (
              <Card key={msg.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{patientName}</span>
                      <Badge variant="info">{typeLabel}</Badge>
                    </div>

                    <p className="text-sm text-[hsl(var(--text-muted))] whitespace-pre-wrap border-l-2 border-[hsl(var(--border))] pl-3 py-1">
                      {msg.message_text}
                    </p>

                    {msg.created_at && (
                      <p className="text-xs text-[hsl(var(--text-muted))]">
                        Creado:{" "}
                        {new Date(msg.created_at).toLocaleString("es", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleOpenWhatsApp(msg)}
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Abrir WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsSent(msg)}
                      title="Marcar como enviado"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Enviado
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSkip(msg)}
                      title="Omitir"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
