// src/components/MacOSDock.tsx
import { useState, useCallback, useMemo } from "react";
import { Plus, Search, Printer, Save, Wallet } from "lucide-react";
import { MacOSDockButton } from "./MacOSDockButton";

export type SaveButtonState = "no-changes" | "has-changes" | "saving" | "saved" | "error";

export interface MacOSDockProps {
  visible: boolean;
  onNewRecord: () => void;
  onSearch: () => void;
  onPrint: () => void;
  onSave: () => void;
  onPendingPayments: () => void;
  hasChanges?: boolean;
  changesCount?: number;
  saveDisabled?: boolean;
  isSnapshotMode?: boolean;
}

const MAGNIFICATION_STRENGTH = 0.48; // How much adjacent buttons magnify (0.0 to 1.0)
const MAX_MAGNIFICATION = 1.25; // Maximum scale for hovered button (more subtle)
const BASE_MAGNIFICATION = 1.0; // Normal scale

export function MacOSDock({
  visible,
  onNewRecord,
  onSearch,
  onPrint,
  onSave,
  onPendingPayments,
  hasChanges = false,
  changesCount = 0,
  saveDisabled = false,
  isSnapshotMode = false,
}: MacOSDockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveButtonState>("no-changes");

  // Calculate magnification for each button based on hover state
  const getMagnification = useCallback((index: number): number => {
    if (hoveredIndex === null) return BASE_MAGNIFICATION;

    const distance = Math.abs(index - hoveredIndex);

    if (distance === 0) {
      return MAX_MAGNIFICATION; // 1.25x - hovered button
    } else if (distance === 1) {
      return BASE_MAGNIFICATION + (MAX_MAGNIFICATION - BASE_MAGNIFICATION) * MAGNIFICATION_STRENGTH; // 1.12x - adjacent ±1
    } else if (distance === 2) {
      return BASE_MAGNIFICATION + (MAX_MAGNIFICATION - BASE_MAGNIFICATION) * MAGNIFICATION_STRENGTH * 0.2; // 1.05x - adjacent ±2
    }

    return BASE_MAGNIFICATION;
  }, [hoveredIndex]);

  // Handle save with state management
  const handleSave = useCallback(async () => {
    if (saveDisabled || isSnapshotMode) return;

    setSaveState("saving");

    try {
      await onSave();
      setSaveState("saved");

      // Reset to no-changes after 2 seconds
      setTimeout(() => {
        setSaveState("no-changes");
      }, 2000);
    } catch {
      setSaveState("error");

      // Reset to has-changes after 3 seconds
      setTimeout(() => {
        setSaveState("has-changes");
      }, 3000);
    }
  }, [onSave, saveDisabled, isSnapshotMode]);

  // Update save state based on hasChanges prop
  useMemo(() => {
    if (saveState === "saving" || saveState === "saved" || saveState === "error") {
      return; // Don't override transient states
    }

    if (hasChanges) {
      setSaveState("has-changes");
    } else {
      setSaveState("no-changes");
    }
  }, [hasChanges, saveState]);

  // Get Save button variant based on state
  const getSaveVariant = () => {
    switch (saveState) {
      case "has-changes":
        return "brand" as const; // Highlight with brand color when changes exist
      case "saving":
        return "brand" as const; // Keep brand color while saving
      case "saved":
        return "neutral" as const; // Return to neutral after save
      case "error":
        return "danger" as const; // Red for errors
      default:
        return "neutral" as const; // Neutral by default
    }
  };

  // Determine if buttons should be disabled
  const buttonsDisabled = isSnapshotMode;
  const saveButtonDisabled = saveDisabled || isSnapshotMode;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-[400ms] ease-out will-change-transform"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(20px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Glass-morphism container with enhanced visibility */}
      <div
        className="flex items-center gap-3 px-6 py-3 rounded-[24px] border border-white/30 shadow-2xl mb-6"
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(50px) saturate(200%)",
          WebkitBackdropFilter: "blur(50px) saturate(200%)",
          boxShadow: "0 16px 64px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        }}
      >
        {/* Nueva Historia */}
        <MacOSDockButton
          icon={Plus}
          label="Nueva Historia"
          shortcut="Ctrl+N"
          variant="neutral"
          onClick={onNewRecord}
          disabled={buttonsDisabled}
          magnification={getMagnification(0)}
          onHover={() => setHoveredIndex(0)}
          onLeave={() => setHoveredIndex(null)}
        />

        {/* Búsqueda */}
        <MacOSDockButton
          icon={Search}
          label="Búsqueda de Pacientes"
          shortcut="Ctrl+K"
          variant="neutral"
          onClick={onSearch}
          disabled={buttonsDisabled}
          magnification={getMagnification(1)}
          onHover={() => setHoveredIndex(1)}
          onLeave={() => setHoveredIndex(null)}
        />

        {/* Imprimir - Always enabled even in snapshot mode */}
        <MacOSDockButton
          icon={Printer}
          label="Imprimir"
          shortcut="Ctrl+P"
          variant="neutral"
          onClick={onPrint}
          disabled={false} // Always enabled
          magnification={getMagnification(2)}
          onHover={() => setHoveredIndex(2)}
          onLeave={() => setHoveredIndex(null)}
        />

        {/* Guardar */}
        <MacOSDockButton
          icon={Save}
          label="Guardar Historia"
          shortcut="Ctrl+S"
          variant={getSaveVariant()}
          onClick={handleSave}
          disabled={saveButtonDisabled}
          hasChanges={hasChanges}
          badgeCount={changesCount}
          magnification={getMagnification(3)}
          onHover={() => setHoveredIndex(3)}
          onLeave={() => setHoveredIndex(null)}
        />

        {/* Cartera */}
        <MacOSDockButton
          icon={Wallet}
          label="Cartera de Pendientes"
          shortcut=""
          variant="neutral"
          onClick={onPendingPayments}
          disabled={buttonsDisabled}
          magnification={getMagnification(4)}
          onHover={() => setHoveredIndex(4)}
          onLeave={() => setHoveredIndex(null)}
        />
      </div>
    </div>
  );
}
