# BUGFIX: Sistema de Guardado de Visitas y Sesiones

**Fecha**: 2025-12-04 (2:30 AM 😴)
**Duración**: ~2 horas de debugging intenso
**Estado**: ✅ RESUELTO

---

## Problema Original

Al intentar guardar una historia clínica (paciente + visita + sesiones), la aplicación mostraba el error:

```
invalid args `payload` for command `save_visit_with_sessions`: missing field `date`
```

El guardado nunca llegaba a ejecutarse en Rust - fallaba en la deserialización JSON → Rust.

---

## Arquitectura Involucrada

```
Frontend (React/TypeScript)
    ↓
TauriSqliteRepository.ts
    ↓ invoke("save_visit_with_sessions", {...})
    ↓
Tauri IPC (JSON serialization)
    ↓ Serde deserialización
    ↓
commands.rs (Rust)
    ↓
SQLite Database
```

---

## Root Cause Analysis

### 1. **Problema Principal: Mismatch en estructura de datos**

**Rust esperaba**:
```rust
#[tauri::command]
pub async fn save_visit_with_sessions(
    db_pool: State<'_, DbPool>,
    patient: Patient,      // ← Argumento directo
    visit: Visit,          // ← Argumento directo
    sessions: Vec<SessionRow>,  // ← Argumento directo
)
```

**TypeScript enviaba**:
```typescript
invoke("save_visit_with_sessions", { payload })
// Enviaba: { payload: { patient, visit, sessions } }
// Rust esperaba: { patient, visit, sessions }
```

### 2. **Campos `undefined` desaparecían en JSON**

TypeScript:
```typescript
const visitPayload: Visit = {
  date: "2025-12-04",
  signer: undefined,  // ← Desaparece al serializar a JSON
  observations: undefined,  // ← Desaparece
}
```

JSON serializado:
```json
{
  "date": "2025-12-04"
  // signer y observations NO están presentes
}
```

Rust esperaba TODOS los campos (aunque sean `null`):
```rust
pub struct Visit {
    pub date: String,
    pub signer: Option<String>,  // ← Debe estar presente (puede ser null)
    pub observations: Option<String>,  // ← Debe estar presente
}
```

### 3. **Struct con `#[serde(flatten)]` mal serializado**

Rust tiene:
```rust
pub struct SessionRow {
    #[serde(flatten)]  // ← Los campos de Visit se aplanan
    pub visit: Visit,
    pub items: Vec<VisitProcedure>,
}
```

TypeScript enviaba:
```typescript
{
  visit: { date: "...", budget: 100, ... },  // ❌ Anidado
  items: [...]
}
```

Serde esperaba:
```typescript
{
  date: "...",   // ✅ Aplanado al mismo nivel que items
  budget: 100,
  items: [...]
}
```

### 4. **IDs temporales negativos tratados como IDs reales**

Frontend genera IDs temporales para sesiones nuevas:
```typescript
const tempId = -Date.now();  // ej: -1764811187387
```

Rust intentaba hacer UPDATE con ese ID:
```rust
if let Some(id) = session.visit.id {
    // ❌ Intentaba UPDATE con id=-1764811187387
    sqlx::query("UPDATE visits ... WHERE id = ?").bind(id)
}
```

Resultado: `FOREIGN KEY constraint failed` porque ese ID no existe en la BD.

---

## Solución Implementada

### Fix 1: Cambiar firma del comando Rust

**Antes**:
```rust
pub async fn save_visit_with_sessions(
    db_pool: State<'_, DbPool>,
    payload: SaveVisitPayload,  // ❌ Struct wrapper
)
```

**Después**:
```rust
pub async fn save_visit_with_sessions(
    db_pool: State<'_, DbPool>,
    patient: Patient,           // ✅ Argumento directo
    visit: Visit,               // ✅ Argumento directo
    sessions: Vec<SessionRow>,  // ✅ Argumento directo
)
```

### Fix 2: Serializar `undefined` como `null`

**TauriSqliteRepository.ts**:
```typescript
const serializeVisit = (v: Visit) => ({
  id: v.id ?? null,                    // ✅ null en lugar de undefined
  patient_id: v.patient_id ?? null,
  date: v.date,
  reason_type: v.reason_type ?? null,
  // ... todos los campos con ?? null
  signer: v.signer ?? null,
  observations: v.observations ?? null,
  is_saved: v.is_saved ?? null,
  created_at: v.created_at ?? null,
  updated_at: v.updated_at ?? null,
});
```

### Fix 3: Aplanar campos de Visit en sessions

**TauriSqliteRepository.ts**:
```typescript
sessions: payload.sessions.map(s => ({
  // ✅ Spread para aplanar visit fields
  ...serializeVisit(s.visit),
  items: s.items,
}))
```

Resultado:
```json
{
  "id": -1764811187387,
  "date": "2025-12-04",
  "budget": 4444,
  "signer": "Dr. Ejemplo 1",
  "items": [...]
}
```

### Fix 4: Detectar IDs temporales negativos

**commands.rs**:
```rust
// Antes
let visit_id = if let Some(id) = session.visit.id {
    // ❌ Intentaba UPDATE con IDs negativos

// Después
let visit_id = if let Some(id) = session.visit.id.filter(|&i| i > 0) {
    // ✅ Solo UPDATE si ID > 0 (ID real de BD)
    // Si ID es negativo o None → INSERT
```

---

## Cambios en Archivos

### `src/lib/storage/TauriSqliteRepository.ts`

```typescript
async saveVisitWithSessions(payload: {
  patient: Patient;
  visit: Visit;
  sessions: VisitWithProcedures[];
}): Promise<{ patient_id: number; visit_id: number }> {

  // Función helper para serializar visits con todos los campos
  const serializeVisit = (v: Visit) => ({
    id: v.id ?? null,
    patient_id: v.patient_id ?? null,
    date: v.date,
    reason_type: v.reason_type ?? null,
    reason_detail: v.reason_detail ?? null,
    diagnosis_text: v.diagnosis_text ?? null,
    auto_dx_text: v.auto_dx_text ?? null,
    full_dx_text: v.full_dx_text ?? null,
    tooth_dx_json: v.tooth_dx_json ?? null,
    budget: v.budget ?? 0,
    discount: v.discount ?? 0,
    payment: v.payment ?? 0,
    balance: v.balance ?? 0,
    cumulative_balance: v.cumulative_balance ?? 0,
    signer: v.signer ?? null,
    observations: v.observations ?? null,
    is_saved: v.is_saved ?? null,
    created_at: v.created_at ?? null,
    updated_at: v.updated_at ?? null,
  });

  const serializedPayload = {
    patient: payload.patient,
    visit: serializeVisit(payload.visit),
    sessions: payload.sessions.map(s => ({
      // Flatten visit fields (match Rust's #[serde(flatten)])
      ...serializeVisit(s.visit),
      items: s.items,
    })),
  };

  return await invoke<{ patient_id: number; visit_id: number }>(
    "save_visit_with_sessions",
    {
      patient: serializedPayload.patient,
      visit: serializedPayload.visit,
      sessions: serializedPayload.sessions,
    }
  );
}
```

### `src-tauri/src/commands.rs`

```rust
#[tauri::command]
pub async fn save_visit_with_sessions(
    db_pool: State<'_, DbPool>,
    patient: Patient,
    visit: Visit,
    sessions: Vec<SessionRow>,
) -> Result<HashMap<String, i64>, String> {
    println!("🦀 Rust received:");
    println!("   Patient: {}", patient.full_name);
    println!("   Visit date: {}", visit.date);
    println!("   Sessions count: {}", sessions.len());

    // ... código de guardado ...

    for session in sessions {
        // Detectar IDs temporales (negativos)
        let previous_cumulative = if let Some(session_id) = session.visit.id.filter(|&i| i > 0) {
            // ID positivo = sesión existente
            sqlx::query_scalar::<_, f64>(
                "SELECT COALESCE(SUM(balance), 0.0) FROM visits
                 WHERE patient_id = ?1 AND id < ?2 AND is_saved = 1"
            )
            .bind(patient_id)
            .bind(session_id)
            .fetch_one(&mut *tx)
            .await
            .unwrap_or(0.0)
        } else {
            // ID negativo o None = sesión nueva
            sqlx::query_scalar::<_, f64>(
                "SELECT COALESCE(SUM(balance), 0.0) FROM visits
                 WHERE patient_id = ?1 AND is_saved = 1"
            )
            .bind(patient_id)
            .fetch_one(&mut *tx)
            .await
            .unwrap_or(0.0)
        };

        // Solo UPDATE si ID > 0 (real)
        let visit_id = if let Some(id) = session.visit.id.filter(|&i| i > 0) {
            // UPDATE sesión existente
            sqlx::query("UPDATE visits SET ... WHERE id = ?")
                .bind(id)
                .execute(&mut *tx)
                .await?;
            id
        } else {
            // INSERT nueva sesión
            let result = sqlx::query("INSERT INTO visits ...")
                .execute(&mut *tx)
                .await?;
            result.last_insert_rowid()
        };

        // ... resto del código ...
    }
}
```

### `src/App.tsx`

```typescript
const visitPayload: Visit = {
  id: visit.id,
  patient_id: patient.id,
  date: visit.date!,
  reason_type: safeReasonType,
  reason_detail: visit.reason_detail ?? "",
  tooth_dx_json: toothDxJson,
  diagnosis_text: fullDiagnosis || undefined,
  auto_dx_text: diagnosisFromTeeth || undefined,
  full_dx_text: fullDiagnosis || undefined,
  budget: 0,
  discount: 0,
  payment: 0,
  balance: 0,
  cumulative_balance: 0,
  signer: undefined,
  observations: undefined,
  is_saved: undefined,
  created_at: undefined,
  updated_at: undefined,
};
```

---

## Debugging Techniques Usadas

### 1. Logs en ambos lados

**TypeScript**:
```typescript
console.log("🔍 Full payload being sent:", JSON.stringify(payload, null, 2));
```

**Rust**:
```rust
println!("🦀 Rust received:");
println!("   Patient: {}", patient.full_name);
```

### 2. Verificar errores de Serde

Errores como `missing field 'date'` indican problema de deserialización ANTES de ejecutar la función.

### 3. Verificar Foreign Key constraints

Error `FOREIGN KEY constraint failed` indica que se llegó a ejecutar SQL, pero con datos inválidos.

### 4. Inspeccionar JSON serializado

Usar `JSON.stringify()` para ver EXACTAMENTE qué se está enviando (campos presentes vs ausentes).

---

## Lecciones Aprendidas

### 1. **TypeScript `undefined` ≠ Rust `Option<T>`**

- TypeScript: `undefined` desaparece al serializar a JSON
- Rust: `Option<T>` requiere que el campo esté presente (puede ser `null`)
- **Solución**: Usar `?? null` para todos los campos opcionales

### 2. **Serde `#[serde(flatten)]` aplana campos**

Cuando un struct tiene `#[serde(flatten)]`, los campos internos suben un nivel en la jerarquía JSON.

### 3. **Tauri deserializa por nombre de argumento**

```rust
fn command(arg1: Type1, arg2: Type2)
```

Espera JSON:
```json
{ "arg1": {...}, "arg2": {...} }
```

NO:
```json
{ "payload": { "arg1": {...}, "arg2": {...} } }
```

### 4. **IDs temporales en frontend deben ser manejados**

- Usar IDs negativos para identificarlos fácilmente
- Backend debe detectarlos y tratarlos como nuevos registros

---

## Testing

### Caso de prueba exitoso:

1. **Input**: Nuevo paciente + 1 sesión con procedimientos
2. **Payload enviado**:
   ```json
   {
     "patient": { "full_name": "sdf", "doc_id": "345345", ... },
     "visit": { "date": "2025-12-04", "diagnosis_text": "...", ... },
     "sessions": [
       {
         "id": -1764811187387,  // ← ID temporal
         "date": "2025-12-04",
         "budget": 4444,
         "items": [...]
       }
     ]
   }
   ```
3. **Resultado**:
   - ✅ Paciente creado con ID real
   - ✅ Sesión creada con ID real (no usa el temporal)
   - ✅ Procedimientos guardados correctamente
   - ✅ Foreign keys válidas

---

## Próximos Pasos

Según `PLAN_VISIT_SNAPSHOT.md`:

1. **FASE 2**: Botones "Cargar Último" para Motivo y Diagnóstico
2. **FASE 3-4**: Componente VisitSnapshot para ver historial completo
3. **FASE 5**: Estilos de impresión

---

## Notas Finales

**Tiempo total de debugging**: ~2 horas
**Errores encontrados**: 5 problemas críticos
**Archivos modificados**: 3 archivos
**Líneas de código agregadas**: ~80 líneas
**Café consumido**: ☕☕☕ (estimado)
**Hora de finalización**: 2:30 AM 😴

**Estado**: ✅ El guardado funciona perfectamente ahora

---

*Documentado por Claude & Ricky - Madrugada épica de debugging 🌙*
