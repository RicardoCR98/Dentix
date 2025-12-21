// src/components/sessions/SessionContextBar.tsx
import { useMemo } from "react";
import { Activity, Clock3, Pencil } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Alert } from "../ui/Alert";
import type { SessionWithItems } from "../../lib/types";
import { cn } from "../../lib/cn";

interface SessionContextBarProps {
  activeSessionId: number | null;
  sessions: SessionWithItems[];
  onSessionChange: (sessionId: number | null) => void;
}

export function SessionContextBar({
  activeSessionId,
  sessions,
}: SessionContextBarProps) {
  const activeSession = useMemo(
    () => sessions.find((s) => s.session.id === activeSessionId),
    [sessions, activeSessionId],
  );

  if (!activeSession) {
    return (
      <div className="mb-6">
        <Alert variant="info">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">
              No hay sesion activa. Selecciona una sesion o inicia un nuevo
              diagnostico para crearla.
            </span>
          </div>
        </Alert>
      </div>
    );
  }
}

type PillStatus = "saved" | "draft" | "empty";

interface SessionPillProps {
  label: string;
  status: PillStatus;
  active?: boolean;
  onClick: () => void;
}

function SessionPill({ label, status, active, onClick }: SessionPillProps) {
  const isSaved = status === "saved";
  const isDraft = status === "draft";
  const Icon = isSaved ? Clock3 : isDraft ? Pencil : Activity;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[200px] max-w-[260px] px-3 py-3 rounded-xl border text-left transition",
        "bg-[hsl(var(--surface))] shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        active
          ? "border-[hsl(var(--brand))] ring-2 ring-[hsl(var(--brand)/0.35)]"
          : "border-[hsl(var(--border))]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            isSaved
              ? "bg-emerald-100 text-emerald-700"
              : isDraft
                ? "bg-amber-100 text-amber-700"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
          )}
        >
          <Icon size={14} />
        </span>
        <div className="space-y-1">
          <div className="font-semibold text-sm leading-tight line-clamp-2">
            {label}
          </div>
          <div>
            {isSaved && <Badge variant="success">Guardada</Badge>}
            {isDraft && <Badge variant="warning">Borrador</Badge>}
            {!isSaved && !isDraft && <Badge variant="info">Libre</Badge>}
          </div>
        </div>
      </div>
    </button>
  );
}
