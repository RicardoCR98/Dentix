import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Input } from "./ui/Input";
import type { TextTemplate } from "../lib/types";
import { tauriSqliteRepository } from "../lib/storage/TauriSqliteRepository";
import { useToast } from "../hooks/useToast";

interface TemplatesManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: TemplateKind;
}

type TemplateKind = "whatsapp_message" | "diagnosis" | "clinical_notes" | "reason_detail" | "procedure_notes" | "payment_notes";

const TEMPLATE_CATEGORIES: Record<TemplateKind, string> = {
  whatsapp_message: "Mensajes de WhatsApp",
  diagnosis: "Diagnósticos",
  clinical_notes: "Notas Clínicas",
  reason_detail: "Detalles de Motivo",
  procedure_notes: "Notas de Procedimiento",
  payment_notes: "Notas de Pago",
};

// Variables disponibles para cada categoría (español, una sola llave)
const TEMPLATE_VARIABLES: Record<TemplateKind, string[]> = {
  whatsapp_message: ["{nombre}", "{saldo}", "{dias}"],
  diagnosis: ["{nombre}", "{edad}", "{pieza}", "{fecha}", "{doctor}"],
  clinical_notes: ["{nombre}", "{edad}", "{fecha}", "{doctor}"],
  reason_detail: ["{nombre}", "{edad}", "{fecha}", "{doctor}"],
  procedure_notes: ["{nombre}", "{procedimiento}", "{pieza}", "{fecha}", "{doctor}"],
  payment_notes: ["{monto}", "{nombre}", "{fecha}"],
};

export function TemplatesManagerModal({
  open,
  onOpenChange,
  defaultCategory,
}: TemplatesManagerModalProps) {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<TemplateKind>(defaultCategory || "whatsapp_message");
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");

  // Actualizar categoría cuando cambie defaultCategory
  useEffect(() => {
    if (open && defaultCategory) {
      setSelectedCategory(defaultCategory);
    }
  }, [open, defaultCategory]);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await tauriSqliteRepository.getTextTemplatesByKind(selectedCategory);
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Error", "No se pudieron cargar las plantillas");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save all templates
      for (const template of templates) {
        if (template.id) {
          await tauriSqliteRepository.updateTextTemplate(template.id, template.body);
        }
      }

      toast.success("Guardado exitoso", "Las plantillas se guardaron correctamente");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving templates:", error);
      toast.error("Error", "No se pudieron guardar las plantillas");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateTitle.trim() || !newTemplateBody.trim()) {
      toast.error("Error", "Título y contenido son requeridos");
      return;
    }

    try {
      await tauriSqliteRepository.createTextTemplate(
        selectedCategory,
        newTemplateTitle.trim(),
        newTemplateBody.trim()
      );
      setIsCreating(false);
      setNewTemplateTitle("");
      setNewTemplateBody("");
      await loadTemplates();
      toast.success("Éxito", "Plantilla creada correctamente");
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Error", "No se pudo crear la plantilla");
    }
  };

  const handleDeleteTemplate = async (id: number, title: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la plantilla "${title}"?`)) {
      return;
    }

    try {
      await tauriSqliteRepository.deleteTextTemplate(id);
      await loadTemplates();
      toast.success("Éxito", "Plantilla eliminada correctamente");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Error", "No se pudo eliminar la plantilla");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Gestionar Plantillas"
      size="xl"
    >
      <DialogContent>
        <div className="space-y-4">
          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">
              Categoría:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateKind)}
              className="w-full p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
            >
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Help text with variables */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]">
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              Variables disponibles:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES[selectedCategory].map((variable) => (
                <code
                  key={variable}
                  className="px-2 py-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs font-mono"
                >
                  {variable}
                </code>
              ))}
            </div>
          </div>

          {/* Add Template Button */}
          {!isCreating && (
            <Button
              variant="secondary"
              onClick={() => setIsCreating(true)}
              className="gap-2 w-full"
            >
              <Plus size={16} />
              Agregar plantilla
            </Button>
          )}

          {/* Create Template Form */}
          {isCreating && (
            <div className="space-y-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Título:
                </label>
                <Input
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="Ej: Recordatorio de pago"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Contenido:
                </label>
                <textarea
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  rows={3}
                  placeholder="Escribe el contenido de la plantilla..."
                  className="w-full p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTemplateTitle("");
                    setNewTemplateBody("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateTemplate}
                  disabled={!newTemplateTitle.trim() || !newTemplateBody.trim()}
                  className="flex-1"
                >
                  Crear plantilla
                </Button>
              </div>
            </div>
          )}

          {/* Templates List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[hsl(var(--muted-foreground))]">Cargando...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText size={48} className="text-[hsl(var(--muted-foreground))] mb-2" />
              <p className="text-[hsl(var(--muted-foreground))]">
                No hay plantillas en esta categoría
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {templates.map((template) => (
                <div key={template.id} className="space-y-2 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {template.title}
                    </label>
                    <div className="flex items-center gap-2">
                      {template.source === "system" && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded">
                          Sistema
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteTemplate(template.id!, template.title)}
                        className="p-1.5 hover:bg-[hsl(var(--destructive))]/10 rounded-md transition-colors"
                        title="Eliminar plantilla"
                      >
                        <Trash2 size={16} className="text-[hsl(var(--destructive))]" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={template.body}
                    onChange={(e) => {
                      setTemplates((prev) =>
                        prev.map((t) =>
                          t.id === template.id
                            ? { ...t, body: e.target.value }
                            : t
                        )
                      );
                    }}
                    rows={3}
                    className="w-full p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || templates.length === 0}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
