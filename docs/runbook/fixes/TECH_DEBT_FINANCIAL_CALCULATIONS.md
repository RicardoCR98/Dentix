# TECH DEBT: Cálculos Financieros en Frontend

**Fecha de identificación:** 2025-12-03
**Severidad:** 🟡 Media
**Prioridad:** Alta (para producción)
**Esfuerzo estimado:** 3-4 horas

---

## 📋 Resumen del Problema

Actualmente, los **cálculos financieros críticos** (budget y balance) se realizan en el **frontend** y el backend los guarda sin validación. Esto representa un riesgo de seguridad y consistencia de datos.

### ⚠️ Vulnerabilidades Identificadas

| # | Problema | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| 1 | Frontend calcula `budget` (suma de items) | `SessionsTable.tsx` | 🟡 Media | Usuario podría manipular JS console y guardar budget incorrecto |
| 2 | Frontend calcula `balance` (budget - discount - payment) | `SessionsTable.tsx` | 🟡 Media | Usuario podría manipular balance antes de guardar |
| 3 | Backend guarda sin validación | `commands.rs:727-730` | 🔴 Alta | Backend confía ciegamente en valores del frontend |
| 4 | Agregaciones en frontend | `PendingPaymentsDialog.tsx:60` | 🟢 Baja | Solo visualización, pero ineficiente |

---

## ✅ Qué SÍ está bien

1. **✅ Balance acumulativo (cumulative_balance):**
   Se calcula en backend mediante query SQL (líneas 683-706 de `commands.rs`)

2. **✅ Cálculos de preview:**
   El frontend calcula budget/balance para mostrar al usuario en tiempo real (esto es OK)

3. **✅ Datos persistidos:**
   Una vez guardados, los datos vienen de BD (no se recalculan en cada carga)

---

## 🔧 Solución Recomendada

### **Fase 1: Validación en Backend (CRÍTICO)** ⭐

**Archivo:** `src-tauri/src/commands.rs`
**Función:** `save_visit_with_sessions`

**Cambios necesarios:**

```rust
// ANTES (líneas 727-730)
.bind(session.visit.budget)    // ← Confía en frontend
.bind(session.visit.discount)
.bind(session.visit.payment)
.bind(session.visit.balance)   // ← Confía en frontend

// DESPUÉS
// ✅ RECALCULAR budget desde items
let calculated_budget: f64 = session.items
    .iter()
    .map(|item| item.subtotal)  // subtotal ya viene calculado (unit_price * qty)
    .sum();

// ✅ RECALCULAR balance
let calculated_balance = calculated_budget
    - session.visit.discount
    - session.visit.payment;

// ⚠️ VALIDACIÓN (opcional: log warning si no coincide)
if (calculated_budget - session.visit.budget).abs() > 0.01 {
    eprintln!(
        "⚠️ Budget mismatch for session: frontend={}, backend={}",
        session.visit.budget,
        calculated_budget
    );
}

if (calculated_balance - session.visit.balance).abs() > 0.01 {
    eprintln!(
        "⚠️ Balance mismatch for session: frontend={}, backend={}",
        session.visit.balance,
        calculated_balance
    );
}

// ✅ USAR VALORES CALCULADOS EN BACKEND (ignorar frontend)
.bind(calculated_budget)      // ← Backend como fuente de verdad
.bind(session.visit.discount) // ← OK, usuario ingresa este valor
.bind(session.visit.payment)  // ← OK, usuario ingresa este valor
.bind(calculated_balance)     // ← Backend recalcula
```

**Beneficios:**
- ✅ Elimina posibilidad de manipulación desde JS console
- ✅ Backend es única fuente de verdad
- ✅ Backward compatible (frontend sigue funcionando igual)
- ✅ Bajo riesgo (solo afecta capa de guardado)

---

### **Fase 2: Optimizar Reportes (MEJORA DE PERFORMANCE)**

**Archivo nuevo:** `src-tauri/src/commands.rs`

**Nuevo comando IPC:**

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct PatientDebtSummary {
    pub patient_id: i64,
    pub full_name: String,
    pub phone: Option<String>,
    pub doc_id: String,
    pub total_debt: f64,
    pub last_session_date: String,
    pub days_since_last: i64,
    pub is_overdue: bool,
}

#[tauri::command]
pub async fn get_pending_payments_summary(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<PatientDebtSummary>, String> {
    let pool = db_pool.0.lock().await;

    // ✅ CÁLCULO COMPLETO EN SQL (UNA SOLA QUERY)
    let rows = sqlx::query(
        "SELECT
            p.id as patient_id,
            p.full_name,
            p.phone,
            p.doc_id,
            SUM(v.balance) as total_debt,
            MAX(v.date) as last_session_date,
            CAST((JULIANDAY('now') - JULIANDAY(MAX(v.date))) AS INTEGER) as days_since_last
         FROM patients p
         INNER JOIN visits v ON v.patient_id = p.id
         WHERE v.is_saved = 1 AND v.balance > 0
         GROUP BY p.id, p.full_name, p.phone, p.doc_id
         HAVING total_debt > 0
         ORDER BY total_debt DESC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let summaries = rows
        .into_iter()
        .map(|row| PatientDebtSummary {
            patient_id: row.get("patient_id"),
            full_name: row.get("full_name"),
            phone: row.get("phone"),
            doc_id: row.get("doc_id"),
            total_debt: row.get("total_debt"),
            last_session_date: row.get("last_session_date"),
            days_since_last: row.get("days_since_last"),
            is_overdue: row.get::<i64, _>("days_since_last") > 90,
        })
        .collect();

    Ok(summaries)
}
```

**Cambios en frontend:**

**Archivo:** `src/lib/storage/TauriSqliteRepository.ts`

```typescript
async getPendingPaymentsSummary(): Promise<PatientDebtSummary[]> {
  try {
    return await invoke<PatientDebtSummary[]>("get_pending_payments_summary");
  } catch (error) {
    console.error("Error en getPendingPaymentsSummary:", error);
    throw error;
  }
}
```

**Archivo:** `src/components/PendingPaymentsDialog.tsx`

```typescript
// ANTES (líneas 401-425 en App.tsx + lógica en PendingPaymentsDialog)
// - Cargar TODOS los pacientes
// - Cargar sesiones de TODOS los pacientes (N queries)
// - Calcular sumas en JS (líneas 53-99)

// DESPUÉS
useEffect(() => {
  if (!open) return;

  const fetchData = async () => {
    try {
      const repo = await getRepository();
      const summary = await repo.getPendingPaymentsSummary(); // ← UNA query
      setPatientsWithDebt(summary);
    } catch (e) {
      console.error("Error cargando cartera:", e);
    }
  };

  fetchData();
}, [open]);
```

**Beneficios:**
- ✅ **Performance:** 1 query SQL vs N+1 queries + agregación JS
- ✅ **Cálculos en BD:** SQL es más eficiente para agregaciones
- ✅ **Menos código JS:** Elimina ~100 líneas de lógica de agregación
- ✅ **Menos tráfico IPC:** Envía solo datos agregados (no todos los pacientes + sesiones)

---

## 📊 Comparación: Antes vs Después

### **Cálculo de Budget/Balance**

| Aspecto | ANTES | DESPUÉS (Fase 1) |
|---------|-------|------------------|
| Dónde se calcula | ❌ Frontend (JS) | ✅ Backend (Rust) |
| Validación | ❌ Ninguna | ✅ Recalcula y valida |
| Seguridad | 🔴 Vulnerable | 🟢 Protegido |
| Esfuerzo | - | ~2 horas |

### **Reporte de Cartera (PendingPaymentsDialog)**

| Aspecto | ANTES | DESPUÉS (Fase 2) |
|---------|-------|------------------|
| Queries a BD | ❌ N+1 (todos pacientes + sesiones c/u) | ✅ 1 query SQL optimizada |
| Cálculos | ❌ Frontend (loops en JS) | ✅ Backend (SQL agregaciones) |
| Datos transferidos | ❌ Todos pacientes + todas sesiones | ✅ Solo resumen agregado |
| Performance | 🟡 ~500ms (50 pacientes) | 🟢 ~50ms |
| Esfuerzo | - | ~2 horas |

---

## 🚀 Plan de Implementación

### **Prioridad ALTA (Antes de producción):**

1. **Fase 1: Validación Backend** ⭐ **CRÍTICO**
   - Modificar `save_visit_with_sessions` en `commands.rs`
   - Recalcular budget/balance desde items
   - Testing: Verificar que se guarden valores correctos
   - **Esfuerzo:** 2 horas

### **Prioridad MEDIA (Optimización):**

2. **Fase 2: Optimizar Reportes**
   - Crear comando `get_pending_payments_summary`
   - Actualizar `TauriSqliteRepository.ts`
   - Actualizar `PendingPaymentsDialog.tsx`
   - Testing: Verificar que reportes sean idénticos
   - **Esfuerzo:** 2 horas

---

## 🧪 Testing Requerido

### **Fase 1:**
- [ ] Guardar sesión con múltiples items → Verificar budget correcto en BD
- [ ] Intentar manipular budget desde JS console → Verificar que se ignora
- [ ] Guardar con discount/payment → Verificar balance = budget - discount - payment
- [ ] Sesiones existentes siguen funcionando (backward compatibility)

### **Fase 2:**
- [ ] Abrir "Cartera Pendiente" → Verificar que muestra mismos datos que antes
- [ ] Verificar KPIs (total adeudado, cantidad en mora)
- [ ] Verificar ordenamiento (primero en mora, luego mayor deuda)
- [ ] Performance: Comparar tiempo de carga antes/después

---

## 📚 Referencias

**Archivos afectados:**

1. **Backend (Rust):**
   - `src-tauri/src/commands.rs` - Líneas 681-800 (save_visit_with_sessions)
   - Nuevo comando: `get_pending_payments_summary`

2. **Frontend (TypeScript):**
   - `src/components/SessionsTable.tsx` - Cálculos de preview (OK, mantener)
   - `src/components/PendingPaymentsDialog.tsx` - Líneas 53-99 (reemplazar)
   - `src/lib/storage/TauriSqliteRepository.ts` - Agregar método nuevo
   - `src/lib/types.ts` - Agregar tipo `PatientDebtSummary`

**Documentación relacionada:**
- `CLAUDE.md` - Sección "Financial Sessions"
- `docs/ARCHITECTURE.md` - Patrón de comunicación IPC

---

## 🔍 Notas Adicionales

### **¿Por qué no es CRÍTICO ahora?**

- La app es **offline** y de **escritorio** (no web pública)
- Usuario final es **el mismo doctor** (no hay usuarios maliciosos)
- Manipulación requiere **conocimientos técnicos** (abrir DevTools, ejecutar JS)
- No hay **incentivo económico** para el doctor de manipular sus propios datos

### **¿Cuándo SÍ se vuelve crítico?**

- ✅ Si migras a **web app** (accessible públicamente)
- ✅ Si implementas **multi-tenant** (múltiples clínicas en una BD)
- ✅ Si agregas **roles** (recepcionista, doctor, admin)
- ✅ Si integras **pagos en línea** o **facturación electrónica**

---

## ✅ Checklist para Implementación Futura

- [ ] Implementar Fase 1 (Validación Backend)
- [ ] Escribir tests unitarios para cálculos financieros
- [ ] Implementar Fase 2 (Optimización Reportes)
- [ ] Documentar cambios en CHANGELOG.md
- [ ] Actualizar diagrama C4 si es necesario
- [ ] Code review de cambios financieros
- [ ] Testing de regresión completo

---

**Creado por:** Claude Code
**Última actualización:** 2025-12-03
**Estado:** 📝 Documentado (Pendiente de implementación)
