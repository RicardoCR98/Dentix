# Resumen de Implementación - Refactor Clínico/Financiero

## Fecha: 09 Diciembre 2024

---

## 🎯 Objetivo

Separar visualmente la información **clínica** de la información **financiera** en el bloque de Evolución y Procedimientos, manteniendo un esquema de BD híbrido que permita snapshots y consultas eficientes.

---

## 📋 Cambios en la Arquitectura de UI

### ANTES (mezclado):
```
App.tsx:
├── Datos del Paciente
├── Motivo de Consulta          ← Global, fuera de sesiones
├── Odontograma
├── Diagnóstico
├── Evolución y Procedimientos  ← Todo mezclado (clínica + finanzas)
└── Adjuntos
```

### DESPUÉS (separado):
```
App.tsx:
├── Datos del Paciente
├── Odontograma (solo diagnósticos)
├── Diagnóstico (auto-generado)
├── 📋 Historial Clínico        ← NUEVO - Solo procedimientos, diagnósticos, notas
└── 💰 Historial Financiero     ← NUEVO - Solo presupuestos, pagos, saldos
```

---

## 🏗️ Estructura de Bloques

### Bloque 1: HISTORIAL CLÍNICO

**Responsabilidad**: Procedimientos realizados, diagnósticos, notas médicas, firmas

**SessionCard - Resumen (collapsed)**:
```
┌─────────────────────────────────────────────────────────┐
│ [🦷 Motivo] 09/12/2024              Dr. López      │
│ Dolor intenso muela superior derecha                    │
│ Procedimientos: Endodoncia (1)                          │
│ Obs: Endodoncia molar 16 iniciada                       │
│ [Expandir ▼]                                            │
└─────────────────────────────────────────────────────────┘
```

**SessionCard - Detalle (expanded)** - 3 COLUMNAS:

```
┌──────────────┬──────────────────┬─────────────────┐
│  CLÍNICO     │ FINANCIERO (*)   │ FIRMA/NOTAS     │
├──────────────┼──────────────────┼─────────────────┤
│ Motivo:      │ Presup: $150     │ Firma:          │
│ [Dolor ▼]    │ (auto-calc)      │ [Dr. López ▼]   │
│              │                  │                 │
│ Detalle:     │ Desc: [___] $    │ Observaciones:  │
│ [Dolor       │ Abono: [100] $   │ [Endodoncia     │
│  intenso...] │ Método: [▼]      │  iniciada...]   │
│              │ Saldo: $50       │                 │
│ Procedim.:   │ (auto-calc)      │                 │
│ ☑ Endodoncia │                  │                 │
│ ☐ Limpieza   │ Notas pago:      │                 │
│ ☐ Resina     │ [Pago inicial]   │                 │
└──────────────┴──────────────────┴─────────────────┘

(*) Solo editable en sesiones EN BORRADOR
    Sesiones guardadas: columna oculta
```

---

### Bloque 2: HISTORIAL FINANCIERO

**Responsabilidad**: Resumen de totales, tabla de transacciones, estado de cuenta

**Resumen General**:
```
┌────────────────┬────────────────┬────────────────┐
│ Presupuestado  │    Abonado     │   Pendiente    │
│    $190        │     $190       │      $0 ✅     │
└────────────────┴────────────────┴────────────────┘
```

**Tabla de Transacciones** (solo lectura):
```
┌──────┬──────────────┬────────┬─────────┬──────────┬──────────┬────────┬───────────┐
│ Fecha│Procedimiento │Presup. │ Abonado │Pendiente │  Método  │ Estado │   Notas   │
├──────┼──────────────┼────────┼─────────┼──────────┼──────────┼────────┼───────────┤
│20/12 │ Control (1)  │  $40   │  $130   │  -$90    │ Efectivo │Pagado✅│Abonó más  │
│09/12 │Endodoncia(1) │  $150  │  $100   │  $50     │ Tarjeta  │Parcial⚠│Pago inicial│
└──────┴──────────────┴────────┴─────────┴──────────┴──────────┴────────┴───────────┘
```

**Botón adicional**:
```
[💰 Registrar abono adicional]
  → Crea sesión con reason_type = "Abono a cuenta"
  → Solo campos financieros, sin procedimientos
```

---

## 🗄️ Cambios en el Esquema de BD

### Tablas renombradas:
- ✅ `visits` → `sessions`
- ✅ `visit_procedures` → `session_items`

### Nuevos campos en `sessions`:
- ✅ `reason_type` - Motivo de ESTA sesión (antes estaba fuera)
- ✅ `reason_detail` - Descripción del motivo
- ✅ `clinical_notes` - Notas clínicas (antes `observations`)
- ✅ `payment_method_id` - FK a tabla `payment_methods`
- ✅ `payment_notes` - Notas específicas del pago

### Nuevos campos en `session_items`:
- ✅ `tooth_number` - En qué diente se aplicó (opcional)
- ✅ `procedure_notes` - Notas del procedimiento (opcional)

### Nueva tabla: `payment_methods`
```sql
payment_methods:
  - Efectivo
  - Tarjeta débito
  - Tarjeta crédito
  - Transferencia
  - Cheque
  - Otro
```

### Actualizados en `reason_types`:
```sql
reason_types:
  - Dolor
  - Control
  - Emergencia
  - Estética
  - Ortodoncia
  - Abono a cuenta  ← NUEVO (sesión de solo pago)
  - Presupuesto     ← NUEVO (solo cotización)
  - Otro
```

### Actualizados en `diagnosis_options`:
```sql
diagnosis_options (solo estados del diente):
  - Sano
  - Caries
  - Fractura
  - Sensibilidad
  - Obturación
  - Corona
  - Endodoncia
  - Implante
  - Ausente
```

---

## 📊 Flujo de Trabajo

### Escenario 1: Nueva sesión de tratamiento

1. Usuario: Click "Nueva sesión"
2. Sistema:
   - Crea sesión en borrador
   - Prelena `session_items` desde `procedure_templates`
   - Muestra SessionCard expandido con las 3 columnas (columnas que ya tengo)
3. Usuario: 
   - Selecciona `reason_type`: "Dolor"
   - Escribe `reason_detail`: "Dolor molar 16"
   - Activa checkboxes de procedimientos realizados
   - Sistema auto-calcula `budget` (suma de items activos)
   - Ingresa `payment` (abono) y `payment_method`
   - Sistema auto-calcula `balance` = budget - payment
4. Usuario: Ctrl+S (Guardar)
5. Sistema:
   - Guarda snapshot de `tooth_dx_json`
   - Marca `is_saved = 1`
   - SessionCard pasa a solo lectura (oculta columna financiera)

---

### Escenario 2: Sesión de SOLO pago (sin tratamiento)

**Opción - Botón rápido** (recomendado):
1. Usuario: Click "💰 Registrar abono adicional" (en bloque financiero)
2. Sistema: Muestra modal simple
3. Usuario: Ingresa monto, método, notas
4. Sistema: Crea sesión con `reason_type = "Abono a cuenta"` pero no lo muestra en bloque clínico

---

### Escenario 3: Cargar paciente existente

1. Usuario: Ctrl+K → Busca paciente → Selecciona
2. Sistema ejecuta:
   ```typescript
   // Cargar paciente
   const patient = await repo.findPatientById(id);

   // Cargar sesiones
   const sessions = await repo.getSessionsByPatient(id);

   // Cargar items de cada sesión
   const items = await repo.getSessionItems(session_ids);

   // Cargar odontograma de la ÚLTIMA sesión guardada
   const lastSession = sessions.filter(s => s.is_saved)[0];
   const toothDx = JSON.parse(lastSession.tooth_dx_json);
   ```
3. UI muestra:
   - Datos del paciente
   - Odontograma con estado de última sesión
   - Bloque clínico: Lista de sesiones (más reciente primero)
   - Bloque financiero: Tabla de transacciones + totales

---

## 🎨 Componentes a Crear

### Nuevos componentes:

1. **`SessionTable.tsx`** (editar @SessionTable) (este es el componente clinico)
   - Gestiona lista de sesiones clínicas
   - Props: sessions, onSessionsChange, procedureTemplates, signers
   - Botón "Nueva sesión"

2. **`SessionsCard.tsx`** (editar @SessionCard) (este son los cards resumen de sesiones)
   - Card individual de sesión
   - 3 columnas: Clínico | Financiero | Firma/Notas (esto ya lo tengo)
   - Columna financiera SOLO visible en borradores
   - Props: session, isEditable, onUpdate, ...

3. **`FinancialHistoryBlock.tsx`** (nuevo componente)
   - Resumen general (totales presupuesto, pagos, saldo)
   - Botón "Registrar abono adicional" (por si usuario viene solo a pagar)
   - `FinancialTransactionTable`
   - Props: sessions (solo lectura)

4. **`FinancialTransactionTable.tsx`** (nuevo componente)
   - Tabla de transacciones (tanstack table)
   - Columnas: fecha, procedimientos, presup, abono, pendiente, método, estado, notas
   - Solo lectura

5. **`QuickPaymentModal.tsx`** (nuevo componente)
   - Modal simple para pago rápido (se abre cuando le da a click en botón "Registrar abono adicional")
   - Campos: monto, método, notas de pago
   - Crea sesión de "Abono a cuenta" (invisible en bloque clínico)

---

## 🔧 Modificaciones a Componentes Existentes

### `App.tsx`:
- ❌ Eliminar sección "Motivo de Consulta"
- ✅ actualizar `<SessionsTable />` después de Diagnóstico (esto ya lo tengo)
- ✅ Agregar `<FinancialHistoryBlock />` después de Clínico (esto es un nuevo bloque)

### `SessionCard.tsx`:
- Mantener layout de 3 columnas
- Agregar lógica: ocultar columna financiera si `is_saved = true`
- Agregar lógica: ocultar tabla procedimientos si `reason_type = "Abono a cuenta"`

### `ReasonTypeSelect.tsx`:
- Ya existe, solo actualizar opciones con nuevos reason_types

### `Odontogram.tsx`:
- Actualizar opciones de `diagnosis_options`
- Eliminar cualquier categorización de tratamientos

---

## 🧪 Testing - Casos a Verificar

### ✅ Caso 1: Paciente nuevo - Primera sesión
- Odontograma vacío
- Crear sesión, marcar procedimientos
- Verificar auto-cálculo de presupuesto
- Guardar, verificar snapshot de tooth_dx_json

### ✅ Caso 2: Paciente recurrente - Segunda sesión
- Cargar paciente
- Verificar odontograma cargado de última sesión
- Modificar odontograma
- Nueva sesión con nuevo snapshot

### ✅ Caso 3: Sesión de solo pago
- Botón "Pago rápido" en la sección de finanzas
- Verificar budget = 0, balance negativo
- Tabla procedimientos oculta

### ✅ Caso 4: Múltiples sesiones mismo día
- Dos sesiones con misma fecha
- Verificar orden en lista
- Verificar cálculo de saldo acumulativo

### ✅ Caso 5: Bloque financiero
- Verificar totales correctos
- Verificar tabla muestra todas las sesiones
- Verificar badges de estado (Pagado/Parcial/Pendiente)

---

## 📝 Notas Importantes

### Snapshots (inmutabilidad):
- ✅ `tooth_dx_json` - Snapshot del odontograma al guardar
- ✅ `reason_type` - Snapshot del catálogo
- ✅ `signer` - Snapshot del nombre del doctor
- ✅ `payment_method` - Snapshot del método (aunque sea FK, se duplica)
- ✅ Procedimientos en `session_items` - Snapshot de nombre y precio

### Auto-cálculos:
- ✅ `budget` = Suma de `session_items` donde `is_active = true`
- ✅ `balance` = `budget - discount - payment`
- ✅ `cumulative_balance` = Suma de balances de sesiones anteriores
- ✅ `subtotal` en items = `unit_price * quantity`

### Reglas de negocio:
- ✅ Solo la sesión más reciente EN BORRADOR es editable
- ✅ Sesiones guardadas (`is_saved = 1`) son inmutables
- ✅ Odontograma es acumulativo (estado actual de la boca)
- ✅ Cada sesión guarda snapshot del odontograma (auditoría)

---

## 🚀 Plan de Implementación

### Fase 1: Base de Datos
- [x] Crear nuevo esquema SQL
- [x] Script de migración (DROP old DB, CREATE new)
- [ ] Actualizar `TauriSqliteRepository.ts`
- [ ] Actualizar `types.ts`

### Fase 2: Componentes Core
- [ ] Eliminar "Motivo de Consulta" de App.tsx
- [ ] Actualizar `SessionTable.tsx`
- [ ] Actualizar `SessionCard` con lógica condicional

### Fase 3: Bloque Financiero
- [ ] Crear `FinancialHistoryBlock.tsx`
- [ ] Crear `FinancialTransactionTable.tsx`
- [ ] Crear `QuickPaymentModal.tsx`

### Fase 4: Testing
- [ ] Test casos 1-5
- [ ] Verificar cálculos financieros
- [ ] Verificar snapshots correctos
- [ ] Verificar UX fluida

---

## 📚 Referencias

- Esquema BD: `schema.sql`
- Diagrama PlantUML: `schema.puml`
- Tipos TypeScript: `src/lib/types.ts`
- Repository: `src/lib/storage/TauriSqliteRepository.ts`
