// src/components/FloatingActionButton.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Printer, Search, Wallet } from "lucide-react";
import { cn } from "../lib/cn";

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass: string;
  ariaLabel: string;
}

interface FloatingActionButtonProps {
  /** Whether the FAB should be visible (controlled by scroll position) */
  visible: boolean;
  /** Callback when "Nueva historia" is clicked */
  onNewRecord: () => void;
  /** Callback when "Imprimir" is clicked */
  onPrint: () => void;
  /** Callback when "Búsqueda de pacientes" is clicked */
  onSearch: () => void;
  /** Callback when "Cartera de pendientes" is clicked */
  onPendingPayments: () => void;
}

export function FloatingActionButton({
  visible,
  onNewRecord,
  onPrint,
  onSearch,
  onPendingPayments,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Define actions configuration
  const actions: FABAction[] = [
    {
      id: "new",
      label: "Nueva historia",
      icon: <Plus size={24} />,
      onClick: onNewRecord,
      colorClass: "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90",
      ariaLabel: "Crear nueva historia clínica",
    },
    {
      id: "print",
      label: "Imprimir",
      icon: <Printer size={24} />,
      onClick: onPrint,
      colorClass: "bg-[hsl(var(--info))] hover:bg-[hsl(var(--info))]/90",
      ariaLabel: "Imprimir historia clínica",
    },
    {
      id: "search",
      label: "Búsqueda de pacientes",
      icon: <Search size={24} />,
      onClick: onSearch,
      colorClass: "bg-[hsl(var(--purple))] hover:bg-[hsl(var(--purple))]/90",
      ariaLabel: "Buscar pacientes",
    },
    {
      id: "payments",
      label: "Cartera de pendientes",
      icon: <Wallet size={24} />,
      onClick: onPendingPayments,
      colorClass: "bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90",
      ariaLabel: "Ver cartera de pagos pendientes",
    },
  ];

  // Close menu handler
  const closeMenu = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Handle action click
  const handleActionClick = useCallback((action: FABAction) => {
    action.onClick();
    setIsExpanded(false);
  }, []);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isExpanded, closeMenu]);

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div
          className={cn(
            "fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40",
            "animate-fadeIn transition-opacity duration-200",
          )}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div
        ref={fabRef}
        className={cn(
          "fixed bottom-24 right-6 z-40",
          "flex flex-col-reverse items-end gap-4",
          // Visibility animation using GPU-accelerated properties
          "transition-all duration-200 ease-out",
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none",
        )}
        role="group"
        aria-label="Acciones rápidas flotantes"
      >
        {/* Action Buttons (Speed Dial Menu) */}
        <div
          className={cn(
            "flex flex-col-reverse items-end gap-3",
            "transition-all duration-300",
            isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none",
          )}
          role="menu"
          aria-hidden={!isExpanded}
        >
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-3 group",
                // Staggered animation
                isExpanded && "animate-scaleIn",
              )}
              style={{
                animationDelay: isExpanded ? `${index * 60}ms` : "0ms",
                animationFillMode: "backwards",
              }}
              role="menuitem"
            >
              {/* Label Tooltip */}
              <div
                className={cn(
                  "px-3 py-2 rounded-lg",
                  "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
                  "shadow-lg border border-[hsl(var(--border))]",
                  "font-medium text-sm whitespace-nowrap",
                  "opacity-0 scale-95 translate-x-2",
                  "group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0",
                  "transition-all duration-150 ease-out",
                  "pointer-events-none",
                )}
                aria-hidden="true"
              >
                {action.label}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleActionClick(action)}
                className={cn(
                  "flex items-center justify-center",
                  "w-11 h-11 rounded-full",
                  "text-white shadow-lg",
                  action.colorClass,
                  "transition-all duration-200 ease-out",
                  "hover:scale-110 hover:shadow-xl",
                  "active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  "focus-visible:ring-[hsl(var(--brand))]",
                )}
                aria-label={action.ariaLabel}
                type="button"
                tabIndex={isExpanded ? 0 : -1}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB Button (Secondary - Menu) */}
        <button
          onClick={toggleExpanded}
          className={cn(
            "flex items-center justify-center",
            "w-12 h-12 rounded-full",
            "bg-gray-700 text-white",
            "shadow-md hover:shadow-lg",
            "hover:bg-gray-600",
            "transition-all duration-200 ease-out",
            "hover:scale-105 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "focus-visible:ring-[hsl(var(--brand))]",
          )}
          aria-label={isExpanded ? "Cerrar menú de acciones rápidas" : "Abrir menú de acciones rápidas"}
          aria-expanded={isExpanded}
          aria-haspopup="menu"
          type="button"
        >
          <Plus
            size={24}
            className={cn(
              "transition-transform duration-200 ease-out",
              isExpanded && "rotate-45",
            )}
          />
        </button>
      </div>
    </>
  );
}
