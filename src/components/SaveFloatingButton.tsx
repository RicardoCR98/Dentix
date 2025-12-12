// src/components/SaveFloatingButton.tsx
import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "../lib/cn";

type SaveButtonState =
  | 'no-changes'    // Gris, deshabilitado
  | 'has-changes'   // Verde, pulsante
  | 'saving'        // Azul, spinner
  | 'saved'         // Verde, checkmark (2s)
  | 'error';        // Rojo, warning icon

interface SaveFloatingButtonProps {
  /** Whether the FAB should be visible */
  visible: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Number of pending changes (for badge) */
  changesCount: number;
  /** Callback when save button is clicked */
  onSave: () => Promise<void>;
  /** Whether save is currently disabled */
  disabled?: boolean;
}

export function SaveFloatingButton({
  visible,
  hasChanges,
  changesCount,
  onSave,
  disabled = false,
}: SaveFloatingButtonProps) {
  const [state, setState] = useState<SaveButtonState>('no-changes');
  const [isHovered, setIsHovered] = useState(false);

  // Update state based on hasChanges prop
  useEffect(() => {
    if (state === 'saving' || state === 'saved' || state === 'error') {
      return; // Don't interrupt these states
    }

    if (!hasChanges) {
      setState('no-changes');
    } else {
      setState('has-changes');
    }
  }, [hasChanges, state]);

  // Handle save action
  const handleSave = useCallback(async () => {
    if (state !== 'has-changes') return;

    setState('saving');
    try {
      await onSave();
      setState('saved');

      // Return to normal state after 2 seconds
      setTimeout(() => {
        setState('no-changes');
      }, 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setState('error');

      // Return to has-changes after 3 seconds if still has changes
      setTimeout(() => {
        if (hasChanges) {
          setState('has-changes');
        }
      }, 3000);
    }
  }, [state, onSave, hasChanges]);

  // Visual configuration for each state
  const stateConfig = {
    'no-changes': {
      icon: Save,
      color: 'bg-gray-400',
      hoverColor: 'hover:bg-gray-400',
      label: 'Sin cambios',
      showBadge: false,
      disabled: true,
      cursor: 'cursor-not-allowed',
      animation: '',
    },
    'has-changes': {
      icon: Save,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      label: `${changesCount} cambio${changesCount !== 1 ? 's' : ''} pendiente${changesCount !== 1 ? 's' : ''}`,
      showBadge: true,
      disabled: false,
      cursor: 'cursor-pointer',
      animation: 'animate-pulse-subtle',
    },
    'saving': {
      icon: Loader2,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-600',
      label: 'Guardando...',
      showBadge: false,
      disabled: true,
      cursor: 'cursor-wait',
      animation: 'animate-spin',
    },
    'saved': {
      icon: CheckCircle,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-600',
      label: 'Guardado ✓',
      showBadge: false,
      disabled: true,
      cursor: 'cursor-default',
      animation: 'animate-scale-bounce',
    },
    'error': {
      icon: AlertTriangle,
      color: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
      label: 'Error al guardar',
      showBadge: false,
      disabled: false,
      cursor: 'cursor-pointer',
      animation: 'animate-shake',
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;
  const isDisabled = config.disabled || disabled;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "transition-all duration-200 ease-out",
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-90 translate-y-4 pointer-events-none",
      )}
    >
      {/* Tooltip */}
      {isHovered && (
        <div
          className={cn(
            "absolute bottom-full right-0 mb-3",
            "px-3 py-2 rounded-lg",
            "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
            "shadow-lg border border-[hsl(var(--border))]",
            "font-medium text-sm whitespace-nowrap",
            "animate-fadeIn",
            "pointer-events-none",
          )}
        >
          <div className="flex flex-col gap-1">
            <span>{config.label}</span>
            {state === 'has-changes' && (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Ctrl+S
              </span>
            )}
          </div>
          {/* Arrow pointing down */}
          <div
            className="absolute top-full right-6 -mt-1"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid hsl(var(--border))',
            }}
          />
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isDisabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative",
          "flex items-center justify-center",
          "w-14 h-14 rounded-full",
          "text-white shadow-lg",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
          "focus-visible:ring-[hsl(var(--brand))]",
          config.color,
          !isDisabled && config.hoverColor,
          !isDisabled && "hover:scale-105 hover:shadow-xl",
          !isDisabled && "active:scale-95",
          config.cursor,
          config.animation,
          disabled && "opacity-50",
        )}
        aria-label={config.label}
        aria-disabled={isDisabled}
        type="button"
      >
        <Icon className="w-6 h-6" />

        {/* Badge for change count */}
        {config.showBadge && changesCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1",
              "flex items-center justify-center",
              "w-6 h-6 rounded-full",
              "bg-red-500 text-white",
              "text-xs font-bold",
              "shadow-md",
              "animate-pulse",
            )}
          >
            {changesCount}
          </span>
        )}
      </button>
    </div>
  );
}
