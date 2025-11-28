import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ToastProvider } from "./components/ToastProvider";
import { getRepository } from "./lib/storage/TauriSqliteRepository";

/**
 * Componente de Splash Screen que se muestra durante la inicialización
 */
function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[hsl(222,14%,8%)]">
      <div className="text-center">
        {/* Spinner animado */}
        <div className="mb-6">
          <svg
            className="animate-spin h-16 w-16 mx-auto text-[hsl(172,49%,56%)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Título de la app */}
        <h1 className="text-3xl font-bold mb-2 text-[hsl(0,0%,98%)]">
          Dentix
        </h1>

        {/* Mensaje de carga */}
        <p className="text-sm text-[hsl(0,0%,60%)] animate-pulse">
          Inicializando base de datos...
        </p>
      </div>
    </div>
  );
}

/**
 * Pantalla de error si falla la inicialización de la BD
 */
function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-red-50">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-xl">
        {/* Icono de error */}
        <div className="mb-4">
          <svg
            className="h-16 w-16 mx-auto text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-red-600 mb-3">
          Error de Inicialización
        </h2>

        {/* Descripción */}
        <p className="text-gray-700 mb-4">
          No se pudo inicializar la base de datos.
          <br />
          Por favor, verifica que la aplicación tenga permisos de escritura.
        </p>

        {/* Detalles del error */}
        <details className="text-left mb-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Ver detalles técnicos
          </summary>
          <pre className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
            {String(error)}
          </pre>
        </details>

        {/* Botón de reintentar */}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

/**
 * Inicialización ordenada de la aplicación
 *
 * Proceso:
 * 1. Mostrar SplashScreen
 * 2. Inicializar BD (await getRepository())
 * 3. Renderizar App solo después de que BD esté lista
 * 4. Si falla, mostrar ErrorScreen
 */
async function init() {
  const root = ReactDOM.createRoot(document.getElementById("root")!);

  try {
    // Paso 1: Mostrar Splash Screen
    console.log("📱 Mostrando splash screen...");
    root.render(<SplashScreen />);

    // Paso 2: Inicializar base de datos
    console.log("🗄️ Inicializando base de datos...");
    const startTime = performance.now();
    await getRepository();
    const endTime = performance.now();
    console.log(`✅ Base de datos inicializada en ${Math.round(endTime - startTime)}ms`);

    // Paso 3: Renderizar aplicación completa
    console.log("🚀 Renderizando aplicación...");
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </React.StrictMode>
    );

    console.log("✅ Aplicación inicializada correctamente");
  } catch (error) {
    // Paso 4: Mostrar pantalla de error
    console.error("❌ Error crítico durante la inicialización:", error);
    root.render(<ErrorScreen error={error as Error} />);
  }
}

// Iniciar la aplicación
init();
