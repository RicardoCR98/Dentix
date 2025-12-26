// src/components/HistoricalSessionsSidebar.tsx
import { memo } from "react";
import { X, Eye, Calendar, User } from "lucide-react";
import { formatDate, formatDateTime } from "../lib/print-utils";
import type { SessionRow } from "../lib/types";
import { Button } from "./ui/Button";

export interface HistoricalSessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionRow[];
  currentSnapshotId: number | null;
  onSelectSession: (sessionId: number) => void;
}

/**
 * Sidebar that shows timeline of patient sessions
 * Slides in from the right side
 */
export const HistoricalSessionsSidebar = memo(function HistoricalSessionsSidebar({
  isOpen,
  onClose,
  sessions,
  currentSnapshotId,
  onSelectSession,
}: HistoricalSessionsSidebarProps) {
  // Filter only saved sessions (historical records)
  const savedSessions = sessions.filter((s) => s.session.is_saved);

  // Sort by date descending (newest first)
  const sortedSessions = [...savedSessions].sort((a, b) =>
    (b.session.date || "").localeCompare(a.session.date || "")
  );

  return (
    <>
      {/* Sidebar Panel */}
      <aside
        className={`historical-sidebar ${isOpen ? "historical-sidebar-open" : ""}`}
        aria-label="Timeline de sesiones"
      >
        {/* Header */}
        <div className="historical-sidebar-header">
          <div className="historical-sidebar-title">
            <Calendar size={20} />
            <span>Timeline de Sesiones</span>
          </div>
          <button
            onClick={onClose}
            className="historical-sidebar-close-btn"
            aria-label="Cerrar timeline"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="historical-sidebar-content">
          {sortedSessions.length === 0 ? (
            <div className="historical-sidebar-empty">
              <Calendar size={48} className="opacity-30" />
              <p>No hay sesiones guardadas</p>
            </div>
          ) : (
            <div className="historical-sidebar-list">
              {sortedSessions.map((sessionRow, index) => {
                const session = sessionRow.session;
                const isActive = session.id === currentSnapshotId;
                const sessionNumber = sortedSessions.length - index;
                const date = formatDate(session.date);
                const signer = session.signer || "Sin firma";
                const proceduresCount = sessionRow.items.filter(
                  (item) => item.is_active !== false
                ).length;

                return (
                  <div
                    key={session.id}
                    className={`historical-session-item ${isActive ? "active" : ""}`}
                  >
                    <div className="historical-session-item-header">
                      <div className="historical-session-item-number">
                        #{sessionNumber}
                      </div>
                      <div className="historical-session-item-date">
                        <Calendar size={14} />
                        {date}
                      </div>
                    </div>

                    <div className="historical-session-item-info">
                      <div className="historical-session-item-signer">
                        <User size={14} />
                        Dr. {signer}
                      </div>
                      {session.reason_type && (
                        <div className="historical-session-item-reason">
                          {session.reason_type}
                        </div>
                      )}
                      <div className="historical-session-item-procedures">
                        {proceduresCount} procedimiento{proceduresCount !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="historical-session-item-actions">
                      {isActive ? (
                        <span className="historical-session-active-badge">
                          Visualizando
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (session.id) {
                              onSelectSession(session.id);
                            }
                          }}
                          className="historical-session-view-btn"
                        >
                          <Eye size={16} />
                          Ver
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
});
