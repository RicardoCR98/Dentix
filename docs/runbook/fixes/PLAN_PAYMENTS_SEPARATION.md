# Plan: Separación de Pagos y Sesiones

## 🎯 Objetivo

Separar los conceptos de:
- **Sesiones (visits):** Solo procedimientos realizados + presupuesto
- **Pagos (payments):** Abonos a cuenta independientes de sesiones

## 📊 Arquitectura Nueva

```
patients
  ├── visits (sesiones de procedimientos)
  │     └── visit_procedures (procedimientos realizados)
  └── payments (abonos a cuenta)
```

## 🗄️ Fase 1: Base de Datos

### 1.1 Nueva tabla `payments`

```sql
CREATE TABLE IF NOT EXISTS payments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id       INTEGER NOT NULL,
  date             TEXT NOT NULL,
  amount           REAL NOT NULL,
  payment_method   TEXT,  -- 'cash', 'card', 'transfer', etc (opcional)
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
```

### 1.2 Cambios en tabla `visits`

**REMOVER:**
- ~~`payment`~~ campo → Ya no se almacena pago en sesión
- ~~`balance`~~ campo → Se calcula dinámicamente
- ~~`cumulative_balance`~~ campo → Se calcula dinámicamente

**MANTENER:**
- `budget` → Presupuesto de la sesión
- `discount` → Descuento aplicado

**NUEVO CÁLCULO:**
```typescript
// Balance de sesión = presupuesto - descuento (sin pago)
session.balance = session.budget - session.discount

// Saldo total del paciente = Σ(sesiones.balance) - Σ(payments.amount)
totalDebt = sessions.reduce((sum, s) => sum + s.balance, 0)
          - payments.reduce((sum, p) => sum + p.amount, 0)
```

### 1.3 Migración de datos existentes

**Estrategia:**
1. Extraer todos los `payment > 0` de `visits` existentes
2. Crear registros en `payments` con la misma fecha
3. Poner `payment = 0` en todas las visits (ya no se usa)
4. **NO eliminar columnas** (mantener compatibilidad, marcar como deprecated)

## 🦀 Fase 2: Backend (Rust)

### 2.1 Nuevo struct `Payment`

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub date: String,
    pub amount: f64,
    pub payment_method: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

### 2.2 Nuevos comandos Tauri

```rust
// Obtener pagos de un paciente
#[tauri::command]
pub async fn get_payments_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<Payment>, String>

// Crear pago
#[tauri::command]
pub async fn create_payment(
    db_pool: State<'_, DbPool>,
    payment: Payment,
) -> Result<i64, String>

// Actualizar pago
#[tauri::command]
pub async fn update_payment(
    db_pool: State<'_, DbPool>,
    payment: Payment,
) -> Result<(), String>

// Eliminar pago
#[tauri::command]
pub async fn delete_payment(
    db_pool: State<'_, DbPool>,
    payment_id: i64,
) -> Result<(), String>
```

### 2.3 Actualizar `save_visit_with_sessions`

**CAMBIOS:**
- Remover lógica de `payment` y `balance`
- Solo guardar `budget` y `discount`
- Balance se calcula en frontend

## 💻 Fase 3: Frontend (TypeScript)

### 3.1 Nuevo type `Payment`

```typescript
export type Payment = {
  id?: number;
  patient_id: number;
  date: string;
  amount: number;
  payment_method?: 'cash' | 'card' | 'transfer' | 'other';
  notes?: string;
  created_at?: string;
  updated_at?: string;
};
```

### 3.2 Actualizar `Visit` type

```typescript
export type Visit = {
  // ... campos existentes
  budget: number;
  discount: number;
  // REMOVER: payment, balance, cumulative_balance
  // (mantener por compatibilidad pero no usar)
}
```

### 3.3 Nuevo componente `PaymentsSection.tsx`

**Ubicación:** `src/components/payments/PaymentsSection.tsx`

**Funcionalidad:**
- Lista de pagos del paciente
- Botón "Agregar pago"
- Dialog para crear/editar pago
- Muestra: fecha, monto, método, notas
- Total de pagos

### 3.4 Actualizar cálculos en `App.tsx`

```typescript
// Estado nuevo
const [payments, setPayments] = useState<Payment[]>([]);

// Cargar pagos al seleccionar paciente
const handleSelectPatient = async (id: number) => {
  // ... código existente
  const paymentsData = await repo.getPaymentsByPatient(id);
  setPayments(paymentsData);
};

// Calcular saldo total
const totalSessionsBalance = sessions
  .filter(s => s.visit.is_saved)
  .reduce((sum, s) => sum + (s.visit.budget - s.visit.discount), 0);

const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

const totalDebt = totalSessionsBalance - totalPayments;
```

### 3.5 Actualizar `FinancialSection.tsx`

**REMOVER:**
- Input de "Abono"

**NUEVA VISUALIZACIÓN:**
```
┌─────────────────────────────┐
│ Presupuesto:    $100        │
│ Descuento:      $10         │
│ ─────────────────────       │
│ Saldo sesión:   $90         │
└─────────────────────────────┘
```

### 3.6 Nuevo `PaymentsDialog.tsx`

**Ubicación:** Botón en panel lateral o en historial

**Formulario:**
- Fecha (default: hoy)
- Monto
- Método de pago (opcional)
- Notas (opcional)

## 🎨 Fase 4: UX/UI

### 4.1 Panel de historial actualizado

```
┌─────────────────────────────────────────┐
│ 📋 Sesiones (procedimientos)            │
├─────────────────────────────────────────┤
│ 2025-01-15 | Resinas x2      | $100    │
│ 2025-01-10 | Limpieza        | $50     │
│                                         │
│ 💰 Pagos a cuenta                       │
├─────────────────────────────────────────┤
│ 2025-01-16 | Efectivo        | -$50    │
│ 2025-01-12 | Transferencia   | -$30    │
│                                         │
│ ═════════════════════════════════════   │
│ SALDO TOTAL:                    $70     │
└─────────────────────────────────────────┘
```

### 4.2 Badge de estado actualizado

```typescript
// Solo basado en saldo total (no por sesión)
if (totalDebt === 0) return "Pagado";
if (totalDebt < 0) return "A favor"; // Adelantó dinero
if (totalPayments > 0) return "Abonado";
return "Pendiente";
```

## 🧪 Fase 5: Testing

### 5.1 Casos de prueba

1. ✅ Crear sesión sin pago → Solo presupuesto
2. ✅ Agregar pago a cuenta → Reduce saldo total
3. ✅ Eliminar pago → Aumenta saldo total
4. ✅ Paciente adelanta dinero → Saldo negativo
5. ✅ Migración de datos existentes → Pagos preservados

## 📝 Fase 6: Limpieza

### 6.1 Deprecar campos antiguos

**En Rust:**
```rust
#[deprecated(note = "Use payments table instead")]
pub payment: f64,
```

**En TypeScript:**
```typescript
/** @deprecated Use payments table instead */
payment?: number;
```

### 6.2 Documentación

Actualizar `CLAUDE.md` con:
- Nueva arquitectura de pagos
- Cómo agregar pagos
- Cómo calcular saldo total

## 🚀 Plan de ejecución

1. **Migración DB** (003_separate_payments.sql)
2. **Backend Rust** (structs, commands)
3. **Frontend types** (Payment type)
4. **Nuevo repositorio** (TauriSqliteRepository methods)
5. **UI Components** (PaymentsSection, PaymentsDialog)
6. **Integración App.tsx** (cargar/guardar payments)
7. **Actualizar cálculos** (remover payment de visits)
8. **Testing completo**

## ⚠️ Notas de compatibilidad

- Campos `payment`, `balance`, `cumulative_balance` se mantienen en DB (no se eliminan)
- Se marcan como deprecated pero se ignoran
- Datos existentes se migran a `payments` table
- Rollback posible si es necesario

## ✅ Beneficios

1. **Claridad conceptual:** Sesiones = trabajo, Pagos = dinero
2. **Flexibilidad:** Pagos independientes de sesiones
3. **Simplicidad:** Cálculo de saldo más directo
4. **Escalabilidad:** Fácil agregar métodos de pago, recibos, etc.
5. **Auditoría:** Historial de pagos separado y claro
