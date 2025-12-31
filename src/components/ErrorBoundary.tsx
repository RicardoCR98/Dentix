// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo } from "react";
import { Button } from "./ui/Button";
import { AlertTriangle } from "lucide-react";
import { reportError } from "../hooks/useErrorTelemetry";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar errores de renderizado de React
 *
 * Características:
 * - Captura errores en componentes hijos
 * - Muestra UI de fallback con detalles del error
 * - Envía errores a telemetría
 * - Permite recargar la aplicación
 *
 * Uso:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Actualizar estado para renderizar UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Loguear error
    console.error("❌ Error Boundary capturó un error:", error, errorInfo);

    // Guardar error info en estado
    this.setState({
      errorInfo,
    });

    // Enviar a telemetría
    reportError(error, "ui");
  }

  handleReload = () => {
    // Recargar la aplicación
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[hsl(var(--background))] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[hsl(var(--surface))] rounded-2xl shadow-2xl p-8">
            {/* Icon and Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  Algo salió mal
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  La aplicación encontró un error inesperado
                </p>
              </div>
            </div>

            {/* Error Message */}
            {this.state.error && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                  Mensaje de error:
                </h3>
                <div className="bg-[hsl(var(--muted))] rounded-lg p-4 font-mono text-sm text-red-600 dark:text-red-400 overflow-x-auto">
                  {this.state.error.message}
                </div>
              </div>
            )}

            {/* Error Stack (collapsible) */}
            {this.state.errorInfo && (
              <details className="mb-6">
                <summary className="text-sm font-semibold text-[hsl(var(--foreground))] cursor-pointer hover:underline">
                  Ver detalles técnicos
                </summary>
                <div className="mt-2 bg-[hsl(var(--muted))] rounded-lg p-4 font-mono text-xs text-[hsl(var(--muted-foreground))] overflow-x-auto max-h-64 overflow-y-auto">
                  {this.state.errorInfo.componentStack}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={this.handleReload} size="lg" className="flex-1">
                Recargar aplicación
              </Button>
              <Button
                onClick={() => {
                  // Copiar error al portapapeles
                  const errorText = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}`;
                  navigator.clipboard.writeText(errorText);
                }}
                size="lg"
                className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80"
              >
                Copiar error
              </Button>
            </div>

            {/* Support Info */}
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-6 text-center">
              Si el problema persiste, contacta a soporte: <strong>soporte@oklus.com</strong>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
