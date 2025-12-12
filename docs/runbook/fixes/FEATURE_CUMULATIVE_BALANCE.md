# Feature: Saldo Acumulativo en Sesiones

## Problema resuelto

Cuando un paciente tiene múltiples sesiones con saldos pendientes, el doctor necesita ver claramente:
1. El saldo de la sesión actual
2. El saldo acumulado de sesiones anteriores
3. El saldo total que el paciente debe

## Solución implementada

### Opción 1: Siempre cargar plantilla global + mostrar saldo acumulativo

**Comportamiento:**
- Cada nueva sesión SIEMPRE carga la plantilla de procedimientos actual (con precios actualizados)
- El sistema calcula y muestra el saldo acumulado de todas las sesiones guardadas anteriores
- Se distingue claramente entre "Saldo sesión" y "Saldo total"

**Ventajas:**
- ✅ Plantilla siempre actualizada
- ✅ Precios correctos (los actuales del mercado)
- ✅ Saldo acumulativo visible
- ✅ No hay confusión sobre qué viene de dónde

**Ejemplo visual:**

```
┌──────────────────────────────────────┐
│ Sesión #3 (Hoy - 2025-01-15)        │
├──────────────────────────────────────┤
│ Procedimientos: [plantilla actual]   │
│                                      │
│ Presupuesto:        $200.00          │
│ Descuento:          -$20.00          │
│ Abono:              -$50.00          │
│ ──────────────────────────────       │
│ Saldo sesión:       $130.00          │
│                                      │
│ ┌────────────────────────────┐       │
│ │ RESUMEN DE SALDOS          │       │
│ ├────────────────────────────┤       │
│ │ Saldo anterior:   $150.00  │ ← Sesión #1 + #2
│ │ Esta sesión:      $130.00  │       │
│ │ ──────────────────────────  │       │
│ │ Saldo total:      $280.00  │ ← DESTACADO
│ └────────────────────────────┘       │
└──────────────────────────────────────┘
```

## Archivos modificados

### 1. `src/components/sessions/SessionCard.tsx`
- Agregado prop `previousBalance: number` al interface
- Modificado resumen financiero en tarjeta colapsada para mostrar "Saldo total" cuando hay saldo anterior
- Pasado `previousBalance` al componente `FinancialSection`

### 2. `src/components/sessions/FinancialSection.tsx`
- Agregado prop `previousBalance: number` al interface
- Agregada sección "Resumen de saldos" que muestra:
  - Saldo anterior (naranja)
  - Esta sesión (rojo)
  - **Saldo total (rojo, destacado, más grande)**
- La sección solo aparece cuando `previousBalance > 0`

### 3. `src/components/sessions/SessionsTable.tsx`
- Agregada lógica para calcular `previousBalance` de cada sesión:
  ```typescript
  const previousBalance = sessions
    .filter((s) =>
      s.visit &&
      s.visit.is_saved &&                    // Solo sesiones guardadas
      s.visit.date < (row.visit?.date || "") // Solo anteriores
    )
    .reduce((acc, s) => acc + (s.visit?.balance || 0), 0);
  ```
- Pasado `previousBalance` como prop a `SessionCard`

## Cálculo del saldo acumulativo

**Reglas:**
1. Solo se cuentan sesiones **guardadas** (`is_saved = true`)
2. Solo se cuentan sesiones con fecha **anterior** a la sesión actual
3. Se suma el **balance** de cada sesión (no el presupuesto, sino lo que quedó pendiente)

**Ejemplo:**
```
Sesión #1 (2024-12-01): Budget $100 - Pago $50 = Balance $50  ✅ Guardada
Sesión #2 (2024-12-15): Budget $150 - Pago $50 = Balance $100 ✅ Guardada
Sesión #3 (2025-01-15): Budget $200 - Pago $50 = Balance $150 🔄 Borrador

Para Sesión #3:
  previousBalance = $50 (sesión #1) + $100 (sesión #2) = $150
  Saldo total = $150 + $150 = $300
```

## UX Flow

### Creación de nueva sesión
1. Doctor crea nueva sesión → Plantilla actual se carga automáticamente
2. Doctor ve procedimientos con precios actuales
3. Doctor modifica cantidades según tratamiento de hoy
4. Sistema calcula presupuesto automáticamente
5. Doctor ingresa descuento (si aplica) y pago recibido
6. Sistema calcula balance de la sesión

### Visualización del saldo
**Tarjeta colapsada:**
- Muestra: Presupuesto, Abono, Saldo sesión
- Si hay saldo anterior > 0: Muestra también "Saldo total" (destacado)

**Tarjeta expandida:**
- Panel derecho "Información Financiera" muestra:
  - Presupuesto (auto o manual)
  - Descuento
  - Abono
  - Saldo sesión
  - **Resumen de saldos** (solo si `previousBalance > 0`):
    - Saldo anterior: $XXX
    - Esta sesión: $YYY
    - **Saldo total: $ZZZ** (destacado)

## Casos de uso

### Caso 1: Paciente con deuda anterior viene por tratamiento nuevo
```
Paciente tiene $150 de saldo anterior
Hoy vino por limpieza ($80)
Pagó $50

→ Saldo sesión: $30 ($80 - $50)
→ Saldo total: $180 ($150 + $30)
```

### Caso 2: Paciente sin deuda anterior
```
Paciente nuevo o al día
Hoy primer tratamiento ($200)
Pagó $100

→ Saldo sesión: $100
→ Saldo total: NO SE MUESTRA (previousBalance = 0)
```

### Caso 3: Paciente abona a deuda anterior sin nuevo tratamiento
```
Paciente con $150 de saldo anterior
Hoy solo vino a pagar (sin procedimientos)
Pagó $50

→ Presupuesto: $0
→ Pago: $50
→ Saldo sesión: -$50
→ Saldo total: $100 ($150 - $50)
```

## Notas técnicas

1. **Performance**: El cálculo de `previousBalance` se hace en el componente (no backend) porque:
   - Es un cálculo simple (filter + reduce)
   - Solo se ejecuta cuando se renderiza una sesión
   - No requiere llamadas IPC adicionales

2. **Sesiones en borrador**: Los borradores NO cuentan para el saldo acumulativo hasta que se guarden

3. **Orden cronológico**: El cálculo usa la fecha de la sesión (`visit.date`) para determinar qué es "anterior"

4. **Compatibilidad**: El cambio es 100% compatible con sesiones existentes - simplemente comienza a mostrar el resumen cuando hay saldo anterior

## Mejoras futuras (opcionales)

1. **Alerta visual**: Cambiar color del saldo total según el monto (ej: >$500 rojo intenso)
2. **Histórico de pagos**: Modal que muestre el desglose completo de todas las sesiones
3. **Gráfico de deuda**: Visualización temporal de la evolución del saldo
4. **Recordatorios**: Sistema de notificaciones para pacientes con mora
