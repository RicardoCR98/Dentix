/**
 * SplashScreen - Pantalla de carga inicial
 * Se muestra durante la inicialización de la base de datos
 */
export default function SplashScreen() {
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
