// src/components/HistoricalModeBanner.tsx
import { memo } from "react";
import { X, Clock } from "lucide-react";
import { formatDateTime } from "../lib/print-utils";
import type { Session } from "../lib/types";

export interface HistoricalModeBannerProps {
  session: Session | null;
  sessionOrdinal?: number | null;
  onClose: () => void;
}

/**
 * Banner shown at the top when viewing historical/snapshot mode
 * Indicates to the user they are viewing past data (read-only)
 */
export const HistoricalModeBanner = memo(function HistoricalModeBanner({
  session,
  sessionOrdinal,
  onClose,
}: HistoricalModeBannerProps) {
  if (!session) {
    return null;
  }

  const sessionDate = formatDateTime(session.date);
  const savedBy = session.signer || "Unknown";
  const updatedAt = session.updated_at
    ? formatDateTime(session.updated_at)
    : sessionDate;

  const ordinalText = sessionOrdinal ? `Sesión #${sessionOrdinal}` : "Sesión Histórica";

  return (
    <div className="historical-mode-banner">
      <div className="historical-banner-content">
        {/* Left side - Session info */}
        <div className="historical-banner-info">
          <div className="historical-banner-icon">
            <Clock size={24} />
          </div>
          <div className="historical-banner-text">
            <div className="historical-banner-title">
              {ordinalText} - {sessionDate}
            </div>
            <div className="historical-banner-subtitle">
              Guardado por Dr. {savedBy} • {updatedAt}
            </div>
          </div>
        </div>

        {/* Right side - Close button */}
        <button
          onClick={onClose}
          className="historical-banner-close"
          aria-label="Salir del modo histórico"
        >
          <X size={20} />
          <span>Volver a Sesión Actual</span>
        </button>
      </div>
    </div>
  );
});
