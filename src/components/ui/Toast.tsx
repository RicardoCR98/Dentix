// src/components/ui/Toast.tsx
import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, XCircle, X } from "lucide-react";
import { cn } from "../../lib/cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const styles = {
  success:
    "bg-green-50 border-green-200 text-green-900 dark:bg-green-900 dark:border-green-800 dark:text-green-100",
  error:
    "bg-red-50 border-red-200 text-red-900 dark:bg-red-900 dark:border-red-800 dark:text-red-100",
  info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100",
  warning:
    "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-100",
};

const iconStyles = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-yellow-600 dark:text-yellow-400",
};

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg",
        "min-w-[320px] max-w-[420px]",
        "animate-[slideInFromRight_300ms_ease-out]",
        styles[type],
      )}
      role="alert"
    >
      <Icon
        size={20}
        className={cn("flex-shrink-0 mt-0.5", iconStyles[type])}
      />

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        {message && <div className="text-sm opacity-90 mt-1">{message}</div>}
      </div>

      <button
        onClick={() => onClose(id)}
        className={cn(
          "flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10",
          "transition-colors",
        )}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Contenedor de toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="pointer-events-auto flex flex-col gap-2">{children}</div>
    </div>
  );
}
