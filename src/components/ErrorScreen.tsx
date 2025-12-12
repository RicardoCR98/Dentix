/**
 * ErrorScreen - Pantalla de error de inicialización
 * Se muestra si falla la inicialización de la base de datos
 */

interface ErrorScreenProps {
  error: Error;
}

export default function ErrorScreen({ error }: ErrorScreenProps) {
  const handleRetry = () => {
    window.location.reload();
  };

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
          onClick={handleRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
