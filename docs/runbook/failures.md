Contiene:

Fallos típicos

Síntomas

Causas probables

Soluciones rápidas

Notas para prevenirlos

Ejemplo:

Error: Database Locked (SQLite)
Síntomas: la app se congela al guardar.
Causa: dos procesos acceden a SQLite simultáneamente.
Solución: activar WAL mode y serializar los writes desde Tauri.
Prevención: no llamar comandos de escritura en paralelo.
