// src/components/ui/Dialog.ts
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useDockVisibility } from "../../contexts/DockVisibilityContext";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  spotlight?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  size = "md",
  spotlight = false,
}: DialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { hideForModal, showAfterModal } = useDockVisibility();

  // Notify dock visibility context when modal opens/closes
  useEffect(() => {
    if (open) {
      hideForModal();
    } else {
      showAfterModal();
    }

    return () => {
      if (open) {
        showAfterModal();
      }
    };
  }, [open, hideForModal, showAfterModal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    full: "max-w-7xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0",
          spotlight
            ? "bg-black/60 backdrop-blur-xl"
            : "bg-black/50 backdrop-blur-sm",
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          "relative w-full bg-[hsl(var(--surface))] rounded-2xl shadow-2xl my-8 max-h-[90vh] flex flex-col",
          spotlight &&
            "ring-1 ring-white/20 shadow-[0_0_80px_rgba(255,255,255,0.1)]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex-1">
              {title && (
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="ml-4 rounded-lg p-2 hover:bg-[hsl(var(--muted))] transition-colors duration-150 active:scale-95"
            >
              <X size={20} className="text-[hsl(var(--muted-foreground))]" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn("px-6 overflow-y-auto", title || description ? "pb-6" : "py-6")}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para contenido del diálogo
export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[hsl(var(--border))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
