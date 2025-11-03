# 🔒 Explicación: Database Locks para Principiantes

## ¿Qué es un Lock?

Un **lock** (candado) es como cuando pones tu mano sobre un cuaderno para que nadie más escriba en él mientras tú escribes.

### Ejemplo de la Vida Real

Imagina 3 estudiantes compartiendo un cuaderno:

```
Situación 1: SIN LOCKS (Caos total)
─────────────────────────────────────
👤 Ana escribe: "La capital de Francia es Par..."
👤 Luis escribe encima: "2 + 2 = 4"
👤 María borra lo que escribió Ana

Resultado: 📖 "La capit2 + 2 = 4 4"  ← ¡DESASTRE!
```

```
Situación 2: CON LOCKS (Orden)
─────────────────────────────────────
👤 Ana: "Voy a escribir" → 🔒 Pone su mano en el cuaderno
   → Nadie más puede escribir
   → Escribe: "La capital de Francia es París"
   → 🔓 Quita su mano

👤 Luis: "Ahora yo" → 🔒 Pone su mano
   → Escribe: "2 + 2 = 4"
   → 🔓 Quita su mano

Resultado: 📖 Ordenado y correcto ✅
```

---

## SQLite vs Otras Bases de Datos

### SQLite (Tu caso)

```
┌─────────────────────────────────┐
│  BASE DE DATOS = UN ARCHIVO     │
│                                 │
│  clinic.db ← Todo aquí          │
│                                 │
│  🔒 Solo 1 persona puede        │
│     escribir a la vez           │
└─────────────────────────────────┘

Ventajas:
✅ Simple (no necesita servidor)
✅ Rápido para apps pequeñas
✅ Perfecto para móviles/desktop

Desventajas:
❌ Solo 1 escritor a la vez
❌ No ideal para muchos usuarios simultáneos
```

### PostgreSQL / MySQL (Bases de datos "grandes")

```
┌─────────────────────────────────┐
│  BASE DE DATOS = SERVIDOR       │
│                                 │
│  🖥️ Servidor corriendo 24/7     │
│                                 │
│  🔒 Muchas personas pueden      │
│     escribir simultáneamente    │
│     en diferentes partes        │
└─────────────────────────────────┘

Ventajas:
✅ Múltiples escritores
✅ Locks más inteligentes (por fila/tabla)
✅ Ideal para apps web con muchos usuarios

Desventajas:
❌ Más complejo de configurar
❌ Necesita servidor dedicado
❌ Más pesado
```

---

## ¿Por Qué el Diseño Afectó Tu Código?

### El Problema Original

Tu función `handleSave()` hacía esto:

```typescript
// Paso 1: Guardar paciente + visita + sesiones
await saveVisitWithSessions({...})  // ← ESCRIBE en la DB
   BEGIN TRANSACTION
   INSERT INTO patients ...
   INSERT INTO visits ...
   INSERT INTO sessions ...
   COMMIT  // ← Suelta el lock... o ¿lo suelta?

// Paso 2: Guardar adjuntos (INMEDIATAMENTE después)
for (const adjunto of adjuntos) {
   await createAttachment({...})  // ← ¡Intenta ESCRIBIR de nuevo!
      BEGIN TRANSACTION  // ← ❌ ERROR: ¡DB aún bloqueada!
}
```

### ¿Por Qué Falla?

Cuando haces `COMMIT`, SQLite:

```
1. Escribe los cambios al disco      [0-10ms]
2. Actualiza índices internos        [0-5ms]
3. Libera el lock                     [0-2ms]
   └─ ⚠️ Este paso puede tardar unos milisegundos
```

Pero tu código hace:

```
COMMIT  ←──┐
           │ 0.001 segundos después
           ↓
BEGIN    ← ❌ Lock todavía no liberado = ERROR
```

---

## Analogía Visual

```
Tiempo →

Ana escribiendo en el cuaderno:
👤 Ana: Escribe "París"... Termina... Levanta la mano...
     ↑
     │ Justo en este momento (0.001 seg)
     │
     👤 Luis: ¡Intenta agarrar el cuaderno!
        ❌ "¡Aún no lo has soltado completamente!"
```

---

## ¿Cómo Se Soluciona?

### Solución 1: Retry Logic (Lo que implementé)

```typescript
async function saveWithRetry() {
   for (let intento = 1; intento <= 3; intento++) {
      try {
         await createAttachment()
         break; // ✅ Funcionó
      } catch (error) {
         if (error.includes("locked") && intento < 3) {
            await sleep(100); // Espera 100ms
            continue; // Reintenta
         }
         throw error; // ❌ Ya no hay más intentos
      }
   }
}
```

**Analogía:**
```
Luis: "¿Puedo escribir?"
Ana: "No, aún no termino"
Luis: *Espera 100ms*
Luis: "¿Y ahora?"
Ana: "Sí, ya está libre" ✅
```

### Solución 2: WAL Mode (Lo que configuré)

**Modo Normal (Journal):**
```
📖 Cuaderno
   🔒 Si Ana escribe → Nadie puede leer ni escribir
```

**Modo WAL (Write-Ahead Logging):**
```
📖 Cuaderno + 📝 Borrador temporal
   👤 Ana escribe en el BORRADOR
   👁️ Luis/María pueden LEER el cuaderno original
   ✅ Cuando Ana termina, copia del borrador al cuaderno
```

**Beneficio:** Otros pueden leer mientras alguien escribe.

---

## ¿Cuándo Usar Cada Base de Datos?

### Usa SQLite si:
- ✅ App de escritorio (1 usuario a la vez)
- ✅ App móvil
- ✅ Prototipo rápido
- ✅ < 100 usuarios simultáneos
- ✅ No quieres configurar servidor

### Usa PostgreSQL/MySQL si:
- ✅ App web con muchos usuarios
- ✅ Necesitas múltiples escritores simultáneos
- ✅ Datos críticos (bancos, hospitales)
- ✅ > 100 usuarios simultáneos
- ✅ Transacciones complejas

### Tu Caso (App Odontológica)
```
🦷 Consultorio dental
   👨‍⚕️ 1-3 doctores usando la app
   📊 1 usuario a la vez por computadora

   ✅ SQLite es PERFECTO
   ❌ PostgreSQL sería excesivo
```

---

## Términos Importantes

| Término | Explicación Simple |
|---------|-------------------|
| **Lock** | Candado que impide que otros escriban |
| **Transaction** | Conjunto de operaciones que se hacen juntas (todo o nada) |
| **COMMIT** | "Ya terminé, guarda todo" |
| **ROLLBACK** | "Cancelar, no guardes nada" |
| **WAL** | Escribir en un archivo temporal antes del principal |
| **ACID** | Garantías de que los datos sean consistentes |
| **Concurrent Writes** | Múltiples personas escribiendo al mismo tiempo |
| **Race Condition** | Error cuando 2 procesos compiten por lo mismo |

---

## Recursos para Aprender Más

### Videos Recomendados (YouTube)
1. Busca: "SQLite vs PostgreSQL explained"
2. Busca: "Database transactions for beginners"
3. Busca: "What is database locking"

### Artículos Oficiales
- SQLite WAL Mode: https://www.sqlite.org/wal.html
- Tipos de Locks: https://www.sqlite.org/lockingv3.html

### Cursos Gratis
- Khan Academy: Intro to Databases
- freeCodeCamp: Database Design Course

---

## Preguntas Frecuentes

**P: ¿Por qué no usar PostgreSQL entonces?**
R: Para tu app odontológica, SQLite es suficiente. PostgreSQL sería como
   usar un camión para llevar una bolsa de compras.

**P: ¿El lock es malo?**
R: No, es necesario. Sin locks, los datos se corromperían. El problema es
   cuando el código no está preparado para manejarlos.

**P: ¿Puedo tener múltiples bases de datos SQLite?**
R: Sí, pero cada archivo tiene sus propios locks. No ayuda con el problema.

**P: ¿Qué pasa si 2 usuarios abren la app?**
R: Cada instancia de la app abre la misma DB. Solo 1 puede escribir a la vez,
   por eso necesitas retry logic.

---

## Conclusión

El error "database is locked" es **normal y esperado** en SQLite cuando:
1. Haces operaciones de escritura muy rápidas
2. No hay tiempo para que se liberen los locks
3. No implementaste retry logic

**No es tu culpa, es la naturaleza de SQLite.**

Las soluciones que implementé (WAL mode, retry logic, busy timeout) son
**patrones estándar** usados por todas las apps que usan SQLite.

---

Creado para entender el error "database is locked" en tu app odontológica.
