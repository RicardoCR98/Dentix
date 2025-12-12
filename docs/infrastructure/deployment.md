Aunque no tengas servidor, sí tienes infra de build y distribución.

infrastructure/deployment.md

Aquí explicas:

Cómo compilar la app:

pnpm install

pnpm tauri build

Targets soportados (Win, Linux, Mac).

Dónde se generan los binarios/instaladores.

Flujo para sacar una nueva versión:

Crear tag.

Ejecutar pipeline.

Subir instalador a GitHub Releases / web.

Si usas auto-updates de Tauri, lo documentas aquí.
