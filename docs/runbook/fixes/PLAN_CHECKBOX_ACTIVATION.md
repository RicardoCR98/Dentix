# Plan de Implementación: Sistema de Activación de Procedimientos con Checkbox

## 📋 Objetivo

Implementar un sistema de activación explícita de procedimientos que permita:
1. Marcar qué procedimientos se realizaron independientemente de la cantidad
2. Recordar visualmente qué procedimientos se hicieron en la sesión anterior
3. Mantener compatibilidad con datos históricos (no romper snapshots)

## 🎯 Problema a resolver

### Caso de uso crítico:
**Paciente viene solo a pagar (sin procedimientos):**
- Actualmente: Imposible registrar porque `quantity = 0` significa "no se hizo nada"
- Necesitamos: Un checkbox para indicar "se realizó" independiente de la cantidad

### Caso de uso secundario:
**Recordatorio visual:**
- Doctor necesita ver rápidamente qué procedimientos hizo en la visita anterior
- Ayuda a mantener continuidad del tratamiento

## 🏗️ Arquitectura de la solución

### Nuevo campo en base de datos

**Tabla:** `visit_procedures`

```sql
ALTER TABLE visit_procedures
ADD COLUMN is_active INTEGER DEFAULT 1;
```

**Características:**
- `is_active = 1`: Procedimiento activado (cuenta para presupuesto)
- `is_active = 0`: Procedimiento no activado (no cuenta para presupuesto)
- `DEFAULT 1`: Compatibilidad con datos existentes

### Compatibilidad hacia atrás

**Regla de inferencia para datos históricos:**
```
Si is_active es NULL o no existe:
  is_active = (quantity > 0) ? 1 : 0
```

**Ejemplo de lectura de datos viejos:**
```javascript
// BD (sin is_active)
{ name: "Resinas", quantity: 2, subtotal: 100 }

// Frontend (con inferencia)
{ name: "Resinas", quantity: 2, subtotal: 100, is_active: true }
```

**Ejemplo de datos nuevos:**
```javascript
// Paciente solo viene a pagar
{ name: "Resinas", quantity: 0, subtotal: 0, is_active: false }

// Procedimiento realizado
{ name: "Limpieza", quantity: 1, subtotal: 30, is_active: true }
```

## 📐 Diseño UX

### Vista de tabla de procedimientos

```
┌──────────────────────────────────────────────────────────┐
│ PROCEDIMIENTOS REALIZADOS                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [ ]  Activar │ Procedimiento     │ P.Unit │ Cant │ Sub │
│ ├────────────┼──────────────────┼────────┼──────┼─────┤
│ [✓]          │ Resinas simples  │  $50   │  2   │ $100│ ← Usado antes (fondo azul)
│ [ ]          │ Limpieza         │  $30   │  0   │  $0 │
│ [✓]          │ Extracción       │  $40   │  1   │ $40 │ ← Usado antes (fondo azul)
│ [ ]          │ Control          │  $20   │  0   │  $0 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Leyenda:**
- ✅ **Checkbox marcado** = Procedimiento activado (cuenta para presupuesto)
- 🔵 **Fondo azul claro** = Procedimiento usado en sesión anterior (recordatorio visual)
- **Cantidad editable** = Doctor decide cuánto hacer HOY
- **Auto-cálculo** = Subtotal = P.Unit × Cantidad

### Reglas de negocio

1. **Presupuesto total:**
   ```typescript
   budget = sum(items.filter(item => item.is_active).map(item => item.subtotal))
   ```

2. **Checkbox y cantidad:**
   - Checkbox independiente de cantidad
   - Cantidad puede ser 0 incluso con checkbox marcado
   - Si cantidad > 0, checkbox se marca automáticamente (pero se puede desmarcar)

3. **Modo edición de plantilla:**
   - Checkbox **deshabilitado** (no se puede marcar/desmarcar)
   - Solo se editan nombres y precios
   - Cantidad siempre en 0

4. **Modo normal:**
   - Checkbox **habilitado**
   - Cantidad **editable**
   - Nombre y precio **solo lectura**

## 🔧 Implementación técnica

### Fase 1: Base de datos y tipos (Backend)

#### 1.1 Crear migración SQL

**Archivo:** `src-tauri/migrations/010_add_is_active_to_procedures.sql`

```sql
-- Agregar campo is_active a visit_procedures
ALTER TABLE visit_procedures
ADD COLUMN is_active INTEGER DEFAULT 1;

-- Actualizar registros existentes basándose en quantity
UPDATE visit_procedures
SET is_active = CASE
  WHEN quantity > 0 THEN 1
  ELSE 0
END
WHERE is_active IS NULL;
```

#### 1.2 Actualizar struct Rust

**Archivo:** `src-tauri/src/commands.rs`

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VisitProcedure {
    pub id: Option<i64>,
    pub visit_id: Option<i64>,
    pub name: String,
    pub unit_price: f64,
    pub quantity: i32,
    pub subtotal: f64,
    pub procedure_template_id: Option<i64>,
    pub sort_order: Option<i32>,
    pub created_at: Option<String>,
    pub is_active: Option<bool>, // ← NUEVO CAMPO
}
```

#### 1.3 Actualizar query de lectura

**Archivo:** `src-tauri/src/commands.rs`

```rust
// En get_sessions_by_visit y get_sessions_by_patient
let items: Vec<VisitProcedure> = sqlx::query(
    "SELECT id, visit_id, name, unit_price, quantity, subtotal,
            procedure_template_id, sort_order, created_at,
            COALESCE(is_active, CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as is_active
     FROM visit_procedures
     WHERE visit_id = ?1
     ORDER BY sort_order ASC, id ASC"
)
.bind(visit_id)
.fetch_all(&*pool)
.await
.map_err(|e| e.to_string())?
.into_iter()
.map(|row| VisitProcedure {
    id: row.get("id"),
    visit_id: row.get("visit_id"),
    name: row.get("name"),
    unit_price: row.get("unit_price"),
    quantity: row.get("quantity"),
    subtotal: row.get("subtotal"),
    procedure_template_id: row.get("procedure_template_id"),
    sort_order: row.get("sort_order"),
    created_at: row.get("created_at"),
    is_active: Some(row.get::<i64, _>("is_active") != 0), // ← NUEVO
})
.collect();
```

#### 1.4 Actualizar query de escritura

**Archivo:** `src-tauri/src/commands.rs`

```rust
// En save_visit_with_sessions
for item in &session.items {
    sqlx::query(
        "INSERT INTO visit_procedures
         (visit_id, name, unit_price, quantity, subtotal,
          procedure_template_id, sort_order, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
    )
    .bind(saved_visit_id)
    .bind(&item.name)
    .bind(item.unit_price)
    .bind(item.quantity)
    .bind(item.subtotal)
    .bind(item.procedure_template_id)
    .bind(item.sort_order.unwrap_or(0))
    .bind(item.is_active.unwrap_or(item.quantity > 0) as i64) // ← NUEVO
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;
}
```

#### 1.5 Actualizar cálculo de presupuesto

**Archivo:** `src-tauri/src/commands.rs`

```rust
// En save_visit_with_sessions - recalcular budget
let calculated_budget: f64 = session.items
    .iter()
    .filter(|item| item.is_active.unwrap_or(item.quantity > 0)) // ← Filtrar por is_active
    .map(|item| item.subtotal)
    .sum();
```

### Fase 2: Frontend - Tipos y lógica

#### 2.1 Actualizar tipos TypeScript

**Archivo:** `src/lib/types.ts`

```typescript
export type VisitProcedure = {
  id: number;
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  procedure_template_id?: number | null;
  is_active?: boolean; // ← NUEVO CAMPO
};
```

#### 2.2 Actualizar newRow en SessionsTable

**Archivo:** `src/components/sessions/SessionsTable.tsx`

```typescript
const newRow = useCallback((): VisitWithProcedures => {
  // Obtener procedimientos de la sesión guardada más reciente
  const lastSavedSession = sessions
    .filter(s => s.visit && s.visit.is_saved)
    .sort((a, b) => (b.visit?.date || "").localeCompare(a.visit?.date || ""))
    [0];

  const previousProcedureIds = new Set(
    lastSavedSession?.items
      .filter(item => item.is_active ?? (item.quantity > 0))
      .map(item => item.procedure_template_id)
      .filter(id => id != null) || []
  );

  const baseItems: VisitProcedure[] = procedureTemplates.map((template, index) => ({
    id: Date.now() + index,
    name: template.name,
    unit_price: template.default_price,
    quantity: 0,
    subtotal: 0,
    procedure_template_id: template.id,
    is_active: false, // ← NUEVO: Inicialmente desactivado
    // Marcar si se usó en sesión anterior (para UI)
    _wasUsedBefore: previousProcedureIds.has(template.id),
  }));

  return {
    visit: {
      id: -Date.now(),
      date: new Date().toISOString().slice(0, 10),
      budget: 0,
      discount: 0,
      payment: 0,
      balance: 0,
      cumulative_balance: 0,
      signer: "",
      observations: "",
      is_saved: false,
    },
    items: baseItems,
  };
}, [procedureTemplates, sessions]);
```

#### 2.3 Actualizar cálculo de presupuesto automático

**Archivo:** `src/components/sessions/SessionsTable.tsx`

```typescript
const recalcRow = useCallback(
  (idx: number, mutate: (row: VisitWithProcedures) => void) => {
    const updated = [...sessions];
    const row = updated[idx];
    mutate(row);

    // ✅ Solo sumar items activos
    const autoBudget = row.items
      .filter(item => item.is_active ?? (item.quantity > 0))
      .reduce((sum, item) => sum + item.subtotal, 0);

    if (!manualBudgetEnabled.get(row.visit.id?.toString() || "")) {
      row.visit.budget = autoBudget;
    }

    row.visit.balance = row.visit.budget - row.visit.discount - row.visit.payment;
    onSessionsChange(updated);
  },
  [sessions, onSessionsChange, manualBudgetEnabled]
);
```

### Fase 3: Frontend - UI Components

#### 3.1 Actualizar ProceduresSection

**Archivo:** `src/components/sessions/ProceduresSection.tsx`

**Agregar columna de checkbox:**

```typescript
<div className="grid grid-cols-[50px_2fr_100px_100px_120px_60px] gap-2 items-center">
  {/* HEADER */}
  <div className="text-xs font-semibold">Activo</div>
  <div className="text-xs font-semibold">Procedimiento</div>
  <div className="text-xs font-semibold text-center">P. Unitario</div>
  <div className="text-xs font-semibold text-center">Cantidad</div>
  <div className="text-xs font-semibold text-center">Subtotal</div>
  <div className="text-xs font-semibold"></div>

  {/* ROWS */}
  {items.map((item, idx) => (
    <React.Fragment key={item.id}>
      {/* Checkbox de activación */}
      <div className="flex justify-center">
        <CheckboxRoot
          checked={item.is_active ?? (item.quantity > 0)}
          onCheckedChange={(checked) =>
            onActiveChange?.(idx, checked === true)
          }
          disabled={!isEditable || inEditMode}
        />
      </div>

      {/* Procedimiento (con indicador visual si se usó antes) */}
      <div className={cn(
        "p-2 rounded",
        item._wasUsedBefore && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200"
      )}>
        {inEditMode ? (
          <Input
            value={item.name}
            onChange={(e) => onNameChange?.(idx, e.target.value)}
            disabled={!isEditable}
          />
        ) : (
          <span className="flex items-center gap-2">
            {item._wasUsedBefore && (
              <Badge variant="info" className="text-xs">
                Anterior
              </Badge>
            )}
            {item.name}
          </span>
        )}
      </div>

      {/* Precio Unitario */}
      <div className="text-center">
        {inEditMode ? (
          <Input
            type="number"
            value={item.unit_price}
            onChange={(e) => onUnitChange?.(idx, e.target.value)}
            disabled={!isEditable}
          />
        ) : (
          <span>${item.unit_price}</span>
        )}
      </div>

      {/* Cantidad */}
      <div className="text-center">
        <Input
          type="number"
          min={0}
          value={item.quantity}
          onChange={(e) => {
            onQtyChange?.(idx, e.target.value);
            // Auto-marcar checkbox si cantidad > 0
            if (parseInt(e.target.value) > 0) {
              onActiveChange?.(idx, true);
            }
          }}
          disabled={!isEditable || inEditMode}
        />
      </div>

      {/* Subtotal */}
      <div className="text-center font-semibold">
        ${item.subtotal}
      </div>

      {/* Acciones */}
      <div>
        {inEditMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove?.(idx)}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </React.Fragment>
  ))}
</div>
```

#### 3.2 Agregar handler de cambio de checkbox

**Archivo:** `src/components/sessions/SessionsTable.tsx`

```typescript
const handleActiveChange = useCallback(
  (sessionIdx: number, itemIdx: number, isActive: boolean) => {
    recalcRow(sessionIdx, (row) => {
      row.items[itemIdx].is_active = isActive;

      // Recalcular subtotal si está activo
      if (isActive) {
        row.items[itemIdx].subtotal =
          row.items[itemIdx].unit_price * row.items[itemIdx].quantity;
      } else {
        row.items[itemIdx].subtotal = 0;
      }
    });
  },
  [recalcRow]
);
```

## 🧪 Testing

### Casos de prueba

#### Test 1: Paciente solo paga (sin procedimientos)
```
✅ Crear sesión
✅ NO marcar ningún checkbox
✅ Presupuesto = $0
✅ Pago = $50
✅ Balance = -$50 (a favor)
✅ Guardar sesión
✅ Verificar: sesión guardada correctamente
```

#### Test 2: Procedimiento con cantidad 0
```
✅ Crear sesión
✅ Marcar checkbox "Resinas"
✅ Cantidad = 0
✅ Presupuesto = $0
✅ Guardar
✅ Verificar: procedimiento guardado con is_active=1, quantity=0
```

#### Test 3: Indicador visual de sesión anterior
```
✅ Sesión 1: Resinas (checkbox marcado)
✅ Guardar sesión 1
✅ Crear sesión 2
✅ Verificar: Resinas tiene fondo azul y badge "Anterior"
✅ Checkbox NO marcado automáticamente (cantidad = 0)
```

#### Test 4: Auto-marcar checkbox al poner cantidad
```
✅ Crear sesión
✅ Poner cantidad = 2 en "Limpieza"
✅ Verificar: Checkbox se marca automáticamente
✅ Presupuesto se actualiza
```

#### Test 5: Compatibilidad datos históricos
```
✅ Cargar sesión guardada antes de migración (sin is_active)
✅ Verificar: Procedimientos con quantity > 0 muestran checkbox marcado
✅ Verificar: Procedimientos con quantity = 0 muestran checkbox desmarcado
✅ Presupuesto calculado correctamente
```

## 📊 Impacto en snapshots

### ¿Se rompen los snapshots? ❌ NO

**Razón:** Los snapshots capturan:
- `name` ✅ No cambia
- `unit_price` ✅ No cambia
- `quantity` ✅ No cambia
- `subtotal` ✅ No cambia

**El campo `is_active` es:**
- **Opcional** (puede ser NULL)
- **Inferible** (si es NULL, se deduce de `quantity > 0`)
- **No afecta el snapshot histórico** (solo afecta la lógica de negocio)

### Compatibilidad hacia atrás

```javascript
// Snapshot histórico (antes de migración)
{
  name: "Resinas",
  unit_price: 50,
  quantity: 2,
  subtotal: 100
}

// Se lee en frontend como:
{
  name: "Resinas",
  unit_price: 50,
  quantity: 2,
  subtotal: 100,
  is_active: true  // ← Inferido de quantity > 0
}
```

## 📝 Checklist de implementación

### Backend
- [ ] Crear migración SQL (`010_add_is_active_to_procedures.sql`)
- [ ] Ejecutar migración
- [ ] Actualizar struct `VisitProcedure` en Rust
- [ ] Actualizar query de lectura (SELECT con COALESCE)
- [ ] Actualizar query de escritura (INSERT con is_active)
- [ ] Actualizar cálculo de presupuesto (filtrar por is_active)
- [ ] Probar queries manualmente

### Frontend - Tipos
- [ ] Actualizar tipo `VisitProcedure` en TypeScript
- [ ] Agregar campo `_wasUsedBefore` (temporal, no persiste en BD)
- [ ] Actualizar `newRow()` para marcar procedimientos usados antes

### Frontend - Lógica
- [ ] Actualizar `recalcRow()` para filtrar por is_active
- [ ] Agregar handler `handleActiveChange()`
- [ ] Auto-marcar checkbox cuando quantity > 0
- [ ] Limpiar checkbox cuando quantity = 0 (opcional)

### Frontend - UI
- [ ] Agregar columna checkbox en `ProceduresSection`
- [ ] Agregar fondo azul para procedimientos usados antes
- [ ] Agregar badge "Anterior"
- [ ] Deshabilitar checkbox en modo edición
- [ ] Habilitar checkbox en modo normal
- [ ] Estilos responsive

### Testing
- [ ] Test: Paciente solo paga
- [ ] Test: Procedimiento con cantidad 0
- [ ] Test: Indicador visual sesión anterior
- [ ] Test: Auto-marcar checkbox
- [ ] Test: Compatibilidad datos históricos
- [ ] Test: Guardar y recargar sesión
- [ ] Test: Múltiples sesiones mismo día

## 🚀 Plan de despliegue

### Paso 1: Backup de BD
```bash
cp "C:/Users/Ricky/AppData/Roaming/com.tauri.dev/clinic.db" \
   "C:/Users/Ricky/AppData/Roaming/com.tauri.dev/clinic.db.backup"
```

### Paso 2: Aplicar migración
La migración se ejecutará automáticamente al iniciar la app.

### Paso 3: Verificar datos
```sql
-- Verificar que is_active se agregó correctamente
SELECT id, name, quantity, is_active
FROM visit_procedures
LIMIT 10;

-- Verificar que datos históricos se infieren correctamente
SELECT id, name, quantity,
       COALESCE(is_active, CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as is_active
FROM visit_procedures
WHERE is_active IS NULL
LIMIT 10;
```

### Paso 4: Testing en producción
1. Probar con paciente real
2. Crear sesión nueva
3. Verificar indicadores visuales
4. Guardar sesión
5. Recargar y verificar persistencia

## 📚 Documentación para el usuario

### Guía rápida para el doctor

**¿Cómo usar el checkbox de activación?**

1. **Procedimiento realizado:**
   - ✅ Marcar checkbox
   - Ingresar cantidad
   - Subtotal se calcula automáticamente

2. **Paciente solo paga:**
   - ⬜ NO marcar ningún checkbox
   - Ingresar monto en "Pago"
   - Presupuesto queda en $0

3. **Procedimiento programado (sin hacer):**
   - ⬜ NO marcar checkbox
   - Cantidad = 0
   - Agregar en observaciones

**¿Qué significa el fondo azul?**
- Indica que ese procedimiento se realizó en la visita anterior
- Es solo un recordatorio, puedes marcarlo o no según lo que hagas hoy

## ⚠️ Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Migración falla | Baja | Alto | Backup automático antes de migración |
| Datos históricos mal interpretados | Media | Medio | Inferencia robusta con COALESCE |
| Performance en queries | Baja | Bajo | Índice en is_active si es necesario |
| Confusión de UX | Media | Medio | Documentación y tooltips |

## 📖 Referencias

- Documento original: `UX_SALDO_ACUMULATIVO.md`
- Migración de ejemplo: `src-tauri/migrations/002_*.sql`
- Componente de referencia: `src/components/sessions/ProceduresSection.tsx`
