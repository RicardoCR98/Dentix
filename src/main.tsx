import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ToastProvider } from "./components/ToastProvider";
import { DockVisibilityProvider } from "./contexts/DockVisibilityContext";
import { getRepository } from "./lib/storage/TauriSqliteRepository";
import SplashScreen from "./components/SplashScreen";
import ErrorScreen from "./components/ErrorScreen";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { TelemetryWrapper } from "./components/TelemetryWrapper";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientsPageWrapper } from "./pages/PatientsPageWrapper";
import { PatientsListPage } from "./pages/PatientsListPage";
import { FinancesPage } from "./pages/FinancesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SchedulePage } from "./pages/SchedulePage";

/**
 * Estado de la aplicación durante la inicialización
 */
type AppState =
  | { status: "loading" } // Inicializando BD
  | { status: "onboarding" } // Mostrar wizard de configuración inicial
  | { status: "ready" } // BD lista, renderizar App
  | { status: "error"; error: Error }; // Error durante inicialización

/**
 * Constantes de configuración
 */
const MIN_SPLASH_DURATION_MS = 500; // Duración mínima del splash para evitar flash
const DB_INIT_TIMEOUT_MS = 30000; // Timeout de 30s para inicialización de BD

/**
 * AppRoot - Componente raíz que maneja el estado de inicialización
 *
 * Ventajas de este enfoque:
 * - Un solo renderizado inicial (evita montaje/desmontaje)
 * - StrictMode consistente en todos los estados
 * - Transición suave sin flash visual
 * - Type-safe error handling
 */
function AppRoot() {
  const [appState, setAppState] = useState<AppState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    /**
     * Inicializa la base de datos con timeout y tiempo mínimo de splash
     */
    async function initializeApp() {
      const startTime = performance.now();
      console.log("🗄️ Inicializando base de datos...");

      try {
        // Ejecutar inicialización de BD con timeout
        const dbInitPromise = getRepository();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Timeout: La base de datos no respondió en ${DB_INIT_TIMEOUT_MS / 1000}s`,
              ),
            );
          }, DB_INIT_TIMEOUT_MS);
        });

        // Race entre inicialización y timeout
        const repo = await Promise.race([dbInitPromise, timeoutPromise]);

        const endTime = performance.now();
        const dbInitDuration = endTime - startTime;
        console.log(
          `✅ Base de datos inicializada en ${Math.round(dbInitDuration)}ms`,
        );

        // Verificar si existe perfil del doctor
        console.log("👤 Verificando perfil del doctor...");
        const doctorProfile = await repo.getDoctorProfile();

        const needsOnboarding = !doctorProfile;

        // Asegurar duración mínima del splash (evitar flash visual)
        const remainingTime = MIN_SPLASH_DURATION_MS - dbInitDuration;
        if (remainingTime > 0) {
          console.log(
            `⏱️ Esperando ${Math.round(remainingTime)}ms para tiempo mínimo de splash...`,
          );
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Solo actualizar estado si el componente aún está montado
        if (isMounted) {
          if (needsOnboarding) {
            console.log("🎯 Primer inicio - mostrando onboarding...");
            setAppState({ status: "onboarding" });
          } else {
            console.log("🚀 Renderizando aplicación...");
            setAppState({ status: "ready" });
          }
        }
      } catch (error) {
        // Type-safe error handling
        const appError =
          error instanceof Error
            ? error
            : new Error(`Error desconocido: ${String(error)}`);

        console.error("❌ Error crítico durante la inicialización:", appError);

        if (isMounted) {
          setAppState({ status: "error", error: appError });
        }
      }
    }

    initializeApp();

    // Cleanup: prevenir actualizaciones de estado después de desmontar
    return () => {
      isMounted = false;
    };
  }, []);

  // Handler para cuando el onboarding se completa
  const handleOnboardingComplete = () => {
    // Recargar la aplicación después de completar el onboarding
    window.location.reload();
  };

  // Renderizado condicional basado en estado
  switch (appState.status) {
    case "loading":
      return <SplashScreen />;

    case "error":
      return <ErrorScreen error={appState.error} />;

    case "onboarding":
      return (
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <DockVisibilityProvider>
                <OnboardingWizard onComplete={handleOnboardingComplete} />
              </DockVisibilityProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      );

    case "ready":
      return (
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <DockVisibilityProvider>
                <TelemetryWrapper>
                  <BrowserRouter>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <DashboardLayout
                            clinicName="Oklus"
                            slogan="Magic in your smile"
                          />
                        }
                      >
                        {/* Redirect root to dashboard */}
                        <Route
                          index
                          element={<Navigate to="/registro-clinico" replace />}
                        />

                        {/* Main routes */}
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route
                          path="registro-clinico"
                          element={<PatientsPageWrapper />}
                        />
                        <Route
                          path="pacientes"
                          element={<PatientsListPage />}
                        />
                        <Route path="Agenda" element={<SchedulePage />} />
                        <Route path="finanzas" element={<FinancesPage />} />
                        {/*<Route path="reportes" element={<ReportsPage />} />*/}
                        <Route
                          path="configuracion"
                          element={<SettingsPage />}
                        />

                        {/* Catch-all redirect */}
                        <Route
                          path="*"
                          element={<Navigate to="/registro-clinico" replace />}
                        />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </TelemetryWrapper>
              </DockVisibilityProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      );
  }
}

/**
 * Inicializar aplicación React
 */
function init() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error(
      "Error crítico: No se encontró el elemento #root en el DOM. " +
        "Verifica que index.html contenga <div id='root'></div>",
    );
  }

  const root = ReactDOM.createRoot(rootElement);

  // Renderizar una sola vez con StrictMode consistente
  root.render(
    <React.StrictMode>
      <AppRoot />
    </React.StrictMode>,
  );

  console.log("✅ React renderizado - inicializando aplicación...");
}

// Iniciar la aplicación
init();
