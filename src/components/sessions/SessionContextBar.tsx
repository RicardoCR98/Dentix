// src/components/sessions/SessionContextBar.tsx
import { useMemo } from "react";
import { Activity, Clock3, Lock, Pencil } from "lucide-react";
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
  onSessionChange,
}: SessionContextBarProps) {
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) =>
        (b.session.date || "").localeCompare(a.session.date || ""),
      ),
    [sessions],
  );

  const activeSession = useMemo(
    () => sessions.find((s) => s.session.id === activeSessionId),
    [sessions, activeSessionId],
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Sin fecha";

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const sessionLabel = (session: SessionWithItems) =>
    `${formatDate(session.session.date)} - ${
      session.session.reason_type || "Sin motivo"
    }`;

  const renderPills = () => (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      <SessionPill
        label="Sin sesion activa"
        status="empty"
        onClick={() => onSessionChange(null)}
        active={activeSessionId === null}
      />
      {sortedSessions.map((s) => (
        <SessionPill
          key={s.session.id}
          label={sessionLabel(s)}
          status={s.session.is_saved ? "saved" : "draft"}
          onClick={() => onSessionChange(s.session.id!)}
          active={s.session.id === activeSessionId}
        />
      ))}
    </div>
  );

  if (!activeSession) {
    return (
      <div className="mb-6">
        <Alert variant="info">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">
              No hay sesion activa. Selecciona una sesion para editar.
            </span>
            {sessions.length > 0 && (
              <div className="flex-1 max-w-[620px]">{renderPills()}</div>
            )}
          </div>
        </Alert>
      </div>
    );
  }

  const isReadOnly = Boolean(activeSession.session.is_saved);

  return (
    <div className="mb-6 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--brand))] text-white flex items-center justify-center">
            <Activity size={18} />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Contexto de sesion
            </div>
            <div className="font-semibold text-base">
              {formatDate(activeSession.session.date)}
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              {activeSession.session.reason_type || "Sin motivo registrado"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {isReadOnly ? (
                <>
                  <Badge variant="success">Guardada</Badge>
                  <Badge variant="info" className="flex items-center gap-1">
                    <Lock size={12} />
                    Modo lectura
                  </Badge>
                </>
              ) : (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Pencil size={12} />
                  Borrador editable
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-[hsl(var(--muted-foreground))] leading-tight">
          <div className="font-semibold text-[hsl(var(--foreground))]">
            {isReadOnly ? "Historico bloqueado" : "Sesion editable"}
          </div>
          <div>{sessionLabel(activeSession)}</div>
        </div>
      </div>

      {renderPills()}
    </div>
  );
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
