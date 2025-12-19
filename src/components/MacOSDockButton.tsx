// src/components/MacOSDockButton.tsx
import { type LucideIcon } from "lucide-react";
import { useState } from "react";

export type DockButtonVariant =
  | "neutral"
  | "brand"
  | "danger"
  | "info"
  | "success"
  | "warning";

export interface MacOSDockButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  variant?: DockButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  hasChanges?: boolean;
  badgeCount?: number;
  magnification: number; // 1.0 to 1.8 (scale factor)
  onHover: () => void;
  onLeave: () => void;
}

const variantColors: Record<DockButtonVariant, string> = {
  neutral: "hsl(var(--muted-foreground) / 0.8)", // Subtle gray
  brand: "hsl(var(--brand))", // Brand blue for emphasis
  danger: "hsl(var(--danger))", // Red for destructive
  info: "hsl(var(--info))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
};

export function MacOSDockButton({
  icon: Icon,
  label,
  shortcut,
  variant = "neutral",
  onClick,
  disabled = false,
  hasChanges = false,
  badgeCount,
  magnification,
  onHover,
  onLeave,
}: MacOSDockButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    onHover();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    onLeave();
  };

  const baseSize = 56; // Base size in pixels
  const scaledSize = baseSize * magnification;

  return (
    <div className="relative flex items-center justify-center">
      {/* Tooltip */}
      {showTooltip && !disabled && (
        <div
          className="absolute bottom-full mb-3 px-3 py-2 rounded-lg bg-[hsl(var(--surface-overlay))] border border-[hsl(var(--border))] shadow-lg whitespace-nowrap animate-fadeIn z-50"
          style={{
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
            <span>{label}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-xs font-mono text-[hsl(var(--muted-foreground))]">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>
      )}

      {/* Button */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        aria-label={label}
        aria-disabled={disabled}
        className="relative rounded-[20px] flex items-center justify-center transition-all duration-[400ms] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent will-change-transform"
        style={{
          width: `${scaledSize}px`,
          height: `${scaledSize}px`,
          backgroundColor: variantColors[variant],
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Elastic easing
          transform: `scale(${magnification}) translateY(${magnification > 1.0 ? -(magnification - 1.0) * 16 : 0}px)`,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled
            ? "none"
            : "0 8px 20px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Icon
          size={24}
          className="text-white drop-shadow-sm"
          strokeWidth={2.5}
        />

        {/* Badge for unsaved changes or count */}
        {!disabled && (hasChanges || (badgeCount !== undefined && badgeCount > 0)) && (
          <div
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md animate-pulse-subtle"
            style={{
              backgroundColor: "hsl(var(--danger))",
            }}
          >
            {badgeCount !== undefined && badgeCount > 0 ? badgeCount : ""}
          </div>
        )}

        {/* Active indicator dot (when has changes) */}
        {!disabled && hasChanges && (
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
          />
        )}
      </button>
    </div>
  );
}
