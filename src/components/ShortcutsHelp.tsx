// src/components/ShortcutsHelp.tsx
import { FileText } from "lucide-react";

export default function ShortcutsHelp() {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <FileText size={16} className="mt-0.5" />
        <div>
          <p className="font-medium mb-1">Atajos útiles</p>
          <ol className="text-sm space-y-1">
            <li>
              Usa{" "}
              <b>
                <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs">
                  Ctrl+S
                </kbd>
              </b>{" "}
              para guardar.
            </li>
            <li>
              Usa{" "}
              <b>
                <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs">
                  Ctrl+P
                </kbd>
              </b>{" "}
              para vista previa/imprimir.
            </li>
            <li>
              Usa{" "}
              <b>
                <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs">
                  Ctrl+K
                </kbd>
              </b>{" "}
              para buscar pacientes.
            </li>
            <li>
              Usa{" "}
              <b>
                <kbd className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs">
                  Ctrl+N
                </kbd>
              </b>{" "}
              para nueva historia.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
