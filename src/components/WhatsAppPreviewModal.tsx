import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { MessageCircle, Copy, Check } from "lucide-react";
import type { TextTemplate } from "../lib/types";

interface WhatsAppPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientPhone: string;
  saldo: number;
  diasMora: number;
  templates: TextTemplate[];
  onSend: () => void;
}

export function WhatsAppPreviewModal({
  open,
  onOpenChange,
  patientName,
  patientPhone,
  saldo,
  diasMora,
  templates,
  onSend,
}: WhatsAppPreviewModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [markAsContacted, setMarkAsContacted] = useState(true);

  // Helper to replace variables in template
  const replaceVariables = (template: string): string => {
    return template
      .replace(/{nombre}/g, patientName)
      .replace(/{saldo}/g, formatCurrency(saldo))
      .replace(/{dias}/g, diasMora.toString())
      .replace(/{clinica}/g, "la clínica"); // TODO: Get from settings
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Initialize with first template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const firstTemplate = templates[0];
      setSelectedTemplateId(firstTemplate.id || null);
      setMessage(replaceVariables(firstTemplate.body));
    }
  }, [templates, selectedTemplateId]);

  // Update message when template changes
  const handleTemplateChange = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setMessage(replaceVariables(template.body));
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    const phone = patientPhone.replace(/\D/g, ""); // Remove non-digits
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    try {
      // Verificar si estamos en Tauri (app de escritorio)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isTauri = typeof (window as any).__TAURI__ !== "undefined";

      if (isTauri) {
        // En Tauri: usar plugin opener para abrir en navegador externo del sistema
        const { open } = await import("@tauri-apps/plugin-opener");
        await open(url);

        // Solo marcar como contactado en Tauri (donde hay base de datos)
        if (markAsContacted) {
          await onSend();
        }
      } else {
        // En desarrollo web: usar window.open como fallback
        window.open(url, "_blank");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      // Fallback: intentar con window.open si falla el plugin
      window.open(url, "_blank");
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Enviar WhatsApp a ${patientName}`}
      size="lg"
    >
      <DialogContent>
        <div className="space-y-4">
          {/* Phone display */}
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <MessageCircle size={16} />
            <span>Número: {patientPhone}</span>
          </div>

          {/* Template selector */}
          {templates.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                Plantilla:
              </label>
              <select
                value={selectedTemplateId || ""}
                onChange={(e) => handleTemplateChange(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">
              Mensaje:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[120px] p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              placeholder="Escribe tu mensaje aquí..."
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Puedes editar el mensaje antes de enviar
            </p>
          </div>

          {/* Mark as contacted checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="markContacted"
              checked={markAsContacted}
              onChange={(e) => setMarkAsContacted(e.target.checked)}
              className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))]"
            />
            <label
              htmlFor="markContacted"
              className="text-sm text-[hsl(var(--foreground))] cursor-pointer"
            >
              Marcar como contactado después de enviar
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={16} />
                Copiar
              </>
            )}
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            className="gap-2"
          >
            <MessageCircle size={16} />
            Abrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
