// src/components/TermsModal.tsx
import { Dialog, DialogContent } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { TERMS_AND_CONDITIONS } from "../lib/terms-and-conditions";
import { ScrollArea } from "./ui/ScrollArea";
import { FileText } from "lucide-react";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="4xl">
      <DialogContent className="max-h-[90vh] p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                <FileText className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Términos y Condiciones de Uso
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  Oklus - Software de Gestión de Clínicas Dentales
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="default">
                Versión {TERMS_AND_CONDITIONS.version}
              </Badge>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Actualizado: {TERMS_AND_CONDITIONS.lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <ScrollArea
          className="flex-1 px-6 py-4"
          style={{ maxHeight: "calc(75vh - 180px)" }}
        >
          <div className="space-y-6 pr-4">
            {TERMS_AND_CONDITIONS.sections.map((section, index) => (
              <div key={section.id} className="space-y-3">
                {/* Section Title */}
                <h3
                  className={`font-bold text-lg ${
                    section.id === "telemetry" || section.id === "medical-data"
                      ? "text-[hsl(var(--brand))]"
                      : "text-[hsl(var(--foreground))]"
                  }`}
                >
                  {section.title}
                </h3>

                {/* Section Content */}
                <div
                  className={`text-sm text-[hsl(var(--muted-foreground))] leading-relaxed whitespace-pre-line ${
                    section.id === "telemetry" || section.id === "medical-data"
                      ? "bg-[hsl(var(--brand)/0.05)] p-4 rounded-lg border-l-4 border-[hsl(var(--brand))]"
                      : ""
                  }`}
                >
                  {section.content}
                </div>

                {/* Divider (except last section) */}
                {index < TERMS_AND_CONDITIONS.sections.length - 1 && (
                  <div className="h-px bg-[hsl(var(--border))] my-6" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              <p className="font-medium">
                Vigente desde: {TERMS_AND_CONDITIONS.effectiveDate}
              </p>
              <p className="text-xs mt-1">
                Para ejercer tus derechos o consultas: garycardo98@gmail.com
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} size="lg">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
