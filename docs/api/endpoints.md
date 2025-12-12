Aquí no tienes API HTTP externa, pero puedes usarlo para documentar:

“Comandos Tauri” como si fueran endpoints.

Las estructuras de datos que viajan entre React y Tauri.

api/endpoints.md

Piensa en los comandos Tauri como endpoints:

Ejemplo:

## get_patient_by_id

- Uso: Obtener paciente por ID
- Se llama desde React mediante `invoke('get_patient_by_id', { id })`
- Input:
  - `id: number`
- Output:
  - Objeto `Patient`
- Errores:
  - `NOT_FOUND`
  - `DB_ERROR`


Esto le da a cualquier dev una lista clara de “puntos de entrada” al backend Tauri.
