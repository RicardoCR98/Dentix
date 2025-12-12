// src/components/ToastProvider.tsx
import { createContext, useState, useCallback } from "react";
import { Toast, ToastContainer } from "./ui/Toast";
import type { ToastType } from "./ui/Toast";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
  ) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration: number = 5000,
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastData = {
        id,
        type,
        title,
        message,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    [],
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showToast("success", title, message, 4000);
    },
    [showToast],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast("error", title, message, 6000);
    },
    [showToast],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast("info", title, message, 4000);
    },
    [showToast],
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast("warning", title, message, 5000);
    },
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
