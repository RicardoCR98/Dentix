# UX: Saldo Acumulativo - Documentación Completa

## 🎯 Objetivo

Permitir al doctor ver claramente:
1. El saldo de la sesión actual
2. El saldo acumulado de sesiones anteriores
3. El saldo total que el paciente debe

Todo esto sin confusión sobre qué procedimientos son de antes vs. ahora.

## 🎨 Diseño UX Implementado

### Principio fundamental: **Plantilla siempre limpia**

Cada nueva sesión SIEMPRE carga la plantilla global de procedimientos:
- ✅ Precios actualizados (los que están en la base de datos)
- ✅ Cantidades en 0 (doctor decide qué se hizo HOY)
- ✅ Sin datos de sesiones anteriores mezclados

### Visual Design

#### 1. Badge de alerta (cuando hay saldo anterior)

Ubicación: Al expandir la sesión, arriba de los procedimientos

```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Este paciente tiene un saldo pendiente          │
│     de sesiones anteriores                          │
│                                                     │
│     Saldo anterior: $150 • Se sumará               │
│     automáticamente al saldo de esta sesión        │
└─────────────────────────────────────────────────────┘
```

**Características:**
- Fondo naranja claro
- Icono de advertencia
- Texto claro y directo
- Solo aparece si `previousBalance > 0`

#### 2. Resumen financiero mejorado

Ubicación: Panel derecho "Información Financiera"

**Antes (sin saldo anterior):**
```
┌─────────────────────┐
│ Presupuesto: $100   │
│ Descuento:   $10    │
│ Abono:       $50    │
│ ──────────────────  │
│ Saldo sesión: $40   │
└─────────────────────┘
```

**Después (con saldo anterior de $150):**
```
┌─────────────────────────────┐
│ Presupuesto:    $100        │
│ Descuento:      $10         │
│ Abono:          $50         │
│ ─────────────────────       │
│ Saldo sesión:   $40         │
│                             │
│ ═════════════════════       │
│ 💰 RESUMEN DE SALDOS        │
│ ─────────────────────       │
│                             │
│ ┌─────────────────────┐     │
│ │ Saldo anterior      │     │
│ │         $150   │ [Naranja]
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Esta sesión         │     │
│ │          $40   │ [Rojo]   │
│ └─────────────────────┘     │
│                             │
│ ┌───────────────────────┐   │
│ │ TOTAL DEBE            │   │
│ │          $190         │   │ [Gradiente rojo-naranja]
│ └───────────────────────┘   │ [Texto grande, destacado]
└─────────────────────────────┘
```

**Características visuales:**
- Saldo anterior: fondo naranja suave
- Esta sesión: fondo rojo suave
- Total debe: **Gradiente vibrante rojo-naranja, texto blanco, tamaño grande**
- Solo aparece si `previousBalance > 0`

#### 3. Tarjeta colapsada (resumen rápido)

```
┌──────────────────────────────────────────────────┐
│ [1] 📅 2025-01-15  Resinas x2, Limpieza x1      │
│                                                  │
│ Presup: $100  Abono: $50  Saldo: $40  Total: $190│
│                                        ▲          │
│                                        │          │
│                              Solo si hay saldo   │
│                              anterior > 0        │
└──────────────────────────────────────────────────┘
```

## 📊 Flujos de uso

### Caso 1: Paciente con deuda anterior viene por tratamiento nuevo

**Escenario:**
- Paciente debe $150 de sesiones anteriores
- Hoy vino por limpieza ($80)
- Pagó $50

**Flujo:**
1. Doctor selecciona paciente → Ve historial con 2 sesiones guardadas
2. Click "Nueva sesión" → **Plantilla limpia** se carga
3. **Badge naranja aparece:** "Saldo anterior: $150"
4. Doctor marca: Limpieza simple x1 ($80)
5. Sistema calcula: Presupuesto = $80
6. Doctor ingresa: Pago = $50
7. Sistema muestra:
   - Saldo sesión: $30
   - **Resumen:**
     - Saldo anterior: $150
     - Esta sesión: $30
     - **TOTAL DEBE: $180** (destacado)

### Caso 2: Paciente al día viene por tratamiento

**Escenario:**
- Paciente nuevo o al día (sin deuda)
- Hoy: Resinas x2 ($100)
- Pagó $60

**Flujo:**
1. Doctor selecciona paciente
2. Click "Nueva sesión" → Plantilla limpia
3. **NO aparece badge** (previousBalance = 0)
4. Doctor marca: Resinas simples x2 ($100)
5. Doctor ingresa: Pago = $60
6. Sistema muestra:
   - Saldo sesión: $40
   - **NO muestra resumen** (no hay saldo anterior)

### Caso 3: Paciente solo viene a pagar deuda

**Escenario:**
- Paciente debe $150
- Hoy no se hizo ningún procedimiento
- Pagó $50

**Flujo:**
1. Doctor selecciona paciente
2. Click "Nueva sesión" → Plantilla limpia
3. Badge naranja: "Saldo anterior: $150"
4. Doctor **NO marca ningún procedimiento** (cantidades en 0)
5. Presupuesto automático = $0
6. Doctor ingresa: Pago = $50
7. Sistema muestra:
   - Saldo sesión: -$50 (a favor del paciente)
   - **Resumen:**
     - Saldo anterior: $150
     - Esta sesión: -$50
     - **TOTAL DEBE: $100**

### Caso 4: Paciente con tratamiento continuo

**Escenario:**
- Paciente debe $40 (le faltan 2 resinas de plan anterior)
- Hoy viene a hacer esas 2 resinas pendientes
- Pagó $70

**Flujo:**
1. Doctor selecciona paciente
2. Click "Nueva sesión" → Plantilla limpia
3. Badge naranja: "Saldo anterior: $40"
4. Doctor **MANUALMENTE** marca: Resinas simples x2 ($100)
   - Nota: El doctor decide conscientemente qué hacer hoy
   - No hay confusión sobre si es "pendiente" o "nuevo"
5. Doctor ingresa: Pago = $70
6. Sistema muestra:
   - Saldo sesión: $30
   - **Resumen:**
     - Saldo anterior: $40
     - Esta sesión: $30
     - **TOTAL DEBE: $70**

## 🔧 Implementación técnica

### Archivos modificados

1. **`SessionCard.tsx`**
   - Agregado prop `previousBalance: number`
   - Badge de alerta con diseño naranja
   - Pasado a `FinancialSection`

2. **`FinancialSection.tsx`**
   - Agregado prop `previousBalance: number`
   - Resumen visual mejorado con gradientes
   - Boxes diferenciados por color

3. **`SessionsTable.tsx`**
   - Cálculo de `previousBalance` por sesión:
     ```typescript
     const previousBalance = sessions
       .filter((s) =>
         s.visit &&
         s.visit.is_saved &&                    // Solo guardadas
         s.visit.date < (row.visit?.date || "") // Solo anteriores
       )
       .reduce((acc, s) => acc + (s.visit?.balance || 0), 0);
     ```

### Lógica de cálculo

**Saldo anterior = Suma de balances de sesiones guardadas anteriores**

```typescript
previousBalance = Σ (balance de sesiones donde):
  - visit.is_saved = true
  - visit.date < sesión_actual.date
```

**Saldo total = Saldo anterior + Saldo de esta sesión**

```typescript
totalDebt = previousBalance + session.visit.balance
```

## 🎓 Decisiones de diseño

### ¿Por qué plantilla siempre limpia?

**Alternativas consideradas:**
1. ❌ Copiar procedimientos de sesión anterior
2. ❌ Mostrar procedimientos "pendientes"
3. ✅ **Plantilla limpia con saldo visible**

**Razones:**
- **Claridad mental:** Cada sesión es un nuevo tratamiento
- **Flexibilidad:** Doctor controla qué se hizo HOY
- **Precios actualizados:** Siempre usa precios actuales del mercado
- **Sin ambigüedad:** No hay confusión entre "viejo" vs "nuevo"
- **Transparencia:** Saldo anterior siempre visible y claro

### ¿Por qué solo mostrar resumen si hay saldo anterior?

- Si no hay deuda, no es necesario mostrar el resumen
- Reduce ruido visual
- Hace que la alerta sea más impactante cuando aparece

### ¿Por qué usar gradiente en "Total debe"?

- Llama la atención inmediatamente
- Diferencia clara entre saldo parcial y total
- Ayuda al doctor a comunicar la deuda total al paciente

## 🚀 Próximos pasos (opcional)

1. **Alertas visuales por monto:**
   - Verde: $0
   - Amarillo: $1-$100
   - Naranja: $101-$500
   - Rojo intenso: >$500

2. **Histórico detallado:**
   - Modal con desglose de todas las sesiones
   - Gráfico de evolución de la deuda

3. **Recordatorios automáticos:**
   - Notificaciones para pacientes con mora (>3 meses)
   - Integración con WhatsApp/SMS

4. **Reportes:**
   - Cartera total
   - Pacientes en mora
   - Proyección de ingresos

## 📝 Notas para el usuario final (doctor)

### ¿Cómo usar el sistema?

1. **Selecciona paciente**
2. **Revisa historial** (ver sesiones anteriores)
3. **Crea nueva sesión**
4. **Si aparece badge naranja:** Paciente tiene deuda anterior
5. **Marca procedimientos de HOY**
6. **Ingresa pago recibido**
7. **Revisa "Total debe"** en el resumen para comunicar al paciente
8. **Guarda**

### ¿Qué pasa si el paciente abona a cuenta?

Simplemente:
1. Crea nueva sesión
2. No marques procedimientos (dejar todo en 0)
3. Ingresa el monto del pago
4. El sistema calculará saldo negativo para esta sesión
5. El "Total debe" mostrará la deuda actualizada

### ¿Cómo edito precios de la plantilla?

1. Expande cualquier sesión en borrador (sin guardar)
2. Click "Editar plantilla"
3. Cambia nombres y precios
4. Click "Guardar"
5. Los nuevos precios se aplicarán a TODAS las sesiones futuras

## 🐛 Solución de problemas

### Problema: Precios en $0 en plantillas

**Causa:** Plantillas en base de datos tienen `default_price = 0`

**Solución:**
1. Abre una sesión en borrador
2. Click "Editar plantilla"
3. Ingresa precios correctos para cada procedimiento
4. Click "Guardar"
5. Crea nueva sesión → Precios deberían aparecer correctamente

### Problema: Saldo anterior no aparece

**Causa:** Sesiones anteriores no están guardadas (`is_saved = false`)

**Solución:**
1. Verifica que las sesiones anteriores estén guardadas
2. Solo sesiones con badge "Guardado" cuentan para el saldo anterior
3. Los borradores NO cuentan hasta que se guarden

### Problema: Saldo total no coincide

**Verificar:**
1. Revisa el cálculo manual: Σ(balances de sesiones guardadas)
2. Verifica que las fechas sean correctas
3. Confirma que todas las sesiones estén guardadas
