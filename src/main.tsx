import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ToastProvider } from "./components/ToastProvider";
import { getRepository } from "./lib/storage/TauriSqliteRepository";
import SplashScreen from "./components/SplashScreen";
import ErrorScreen from "./components/ErrorScreen";
import { DashboardLayout } from "./layouts/DashboardLayout";
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
        await Promise.race([dbInitPromise, timeoutPromise]);

        const endTime = performance.now();
        const dbInitDuration = endTime - startTime;
        console.log(
          `✅ Base de datos inicializada en ${Math.round(dbInitDuration)}ms`,
        );

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
          console.log("🚀 Renderizando aplicación...");
          setAppState({ status: "ready" });
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

  // Renderizado condicional basado en estado
  switch (appState.status) {
    case "loading":
      return <SplashScreen />;

    case "error":
      return <ErrorScreen error={appState.error} />;

    case "ready":
      return (
        <ThemeProvider>
          <ToastProvider>
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
                  {/* Redirect root to /pacientes */}
                  <Route
                    index
                    element={<Navigate to="/registro-clinico" replace />}
                  />

                  {/* Main routes */}
                  <Route
                    path="registro-clinico"
                    element={<PatientsPageWrapper />}
                  />
                  <Route path="pacientes" element={<PatientsListPage />} />
                  <Route path="Agenda" element={<SchedulePage />} />
                  <Route path="finanzas" element={<FinancesPage />} />
                  <Route path="reportes" element={<ReportsPage />} />
                  <Route path="configuracion" element={<SettingsPage />} />

                  {/* Catch-all redirect */}
                  <Route
                    path="*"
                    element={<Navigate to="/registro-clinico" replace />}
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ThemeProvider>
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
