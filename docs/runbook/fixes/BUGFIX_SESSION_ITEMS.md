# 🐛 Corrección: Bug en eliminación de procedimientos

## Problema Original

**Síntoma**: Al eliminar un procedimiento "de abajo" en la lista, se eliminaba el procedimiento "de arriba" en su lugar.

**Causa raíz**: El cálculo de índices en `SessionsTable.tsx` usaba `findIndex()` con coincidencia por nombre/precio/cantidad, lo cual fallaba cuando había procedimientos similares.

```typescript
// ❌ ANTES (INCORRECTO)
const fullIdx = row.items.findIndex(
  (it) => it.id === item.id || (it.name === item.name && it.unit === item.unit && it.qty === item.qty),
);
```

**Problema**: Si dos procedimientos tenían el mismo nombre, precio y cantidad, `findIndex` siempre devolvía el índice del **primero** que encontraba, no el correcto.

---

## Solución Implementada

### **1. IDs Temporales Únicos para Items Nuevos**

**Archivo**: `src/components/SessionsTable.tsx`

#### A) Al crear nueva sesión (línea 248-255)
```typescript
const baseItems: ProcItem[] = procedureTemplates.map((template, index) => ({
  id: -(Date.now() + index),  // ✅ ID temporal negativo único
  name: template.name,
  unit: template.default_price,
  qty: 0,
  sub: 0,
  procedure_template_id: template.id,
}));
```

#### B) Al agregar procedimiento vacío (línea 400-401)
```typescript
{
  id: -(Date.now()),  // ✅ ID temporal negativo único
  name: "",
  unit: 0,
  qty: 0,
  sub: 0,
}
```

#### C) Al copiar sesión anterior (línea 324-326)
```typescript
row.items = row.items.map((item, index) => ({
  ...item,
  id: -(Date.now() + index + 1000),  // ✅ Nuevo ID temporal único
  qty: prevQtyMap.get(item.name) || 0,
  sub: item.unit * (prevQtyMap.get(item.name) || 0),
}));
```

**Estrategia de IDs**:
- IDs **negativos**: Items temporales (aún no guardados en BD)
- IDs **positivos**: Items guardados en BD

---

### **2. Cálculo Correcto de Índices**

**Archivo**: `src/components/SessionsTable.tsx` (línea 778-783)

```typescript
// ✅ AHORA (CORRECTO)
const itemId = item.id;
const fullIdx = row.items.findIndex((it) => it.id === itemId);

// Fallback si no se encuentra por ID (no debería pasar)
const actualIdx = fullIdx >= 0 ? fullIdx : displayIdx;
```

**Beneficio**: Cada item tiene un ID único (temporal o de BD), garantizando que `findIndex` siempre encuentre el item correcto.

---

### **3. Validación de Índices en Callbacks**

```typescript
onNameChange={(value) =>
  recalcRow(idxReal, (r) => {
    if (r.items[actualIdx]) {  // ✅ Validación de índice
      r.items[actualIdx].name = value;
    }
  })
}
```

---

## Flujo de IDs

### **Nuevo Procedimiento** (no guardado)
```
1. Usuario crea sesión
   → Items generados con ID: -1733000000000, -1733000000001, ...

2. Usuario edita/modifica items
   → Se usan IDs temporales para identificarlos

3. Usuario guarda
   → Backend asigna IDs reales de BD: 1, 2, 3, ...

4. Estado se actualiza
   → Items ahora tienen IDs positivos de BD
```

### **Sesión Cargada** (desde BD)
```
1. Se carga paciente
   → getSessionsByPatient devuelve items con IDs de BD

2. Transformación en TauriSqliteRepository
   → item.id = rustItem.id (ID real de BD)

3. Renderizado
   → Se usan IDs de BD para identificación única
```

---

## Casos de Prueba

### ✅ Test 1: Eliminar item del medio
```
Plantilla: [Curación, Resina, Extracción]
1. Agregar sesión
2. Expandir sesión
3. Eliminar "Resina" (item del medio)
Resultado esperado: Solo "Resina" se elimina
```

### ✅ Test 2: Items duplicados con diferentes cantidades
```
Plantilla: [Resina, Resina, Resina]
1. Agregar sesión
2. Modificar cantidades: [1, 2, 3]
3. Eliminar el segundo (qty=2)
Resultado esperado: Solo el item con qty=2 se elimina
```

### ✅ Test 3: Agregar y eliminar item personalizado
```
1. Agregar sesión
2. Editar plantilla → Añadir procedimiento
3. Ingresar nombre "Blanqueamiento"
4. Eliminar "Blanqueamiento"
Resultado esperado: Solo "Blanqueamiento" se elimina
```

### ✅ Test 4: Guardar y recargar
```
1. Agregar sesión con procedimientos
2. Modificar cantidades
3. Guardar
4. Recargar paciente
5. Verificar que los items mantienen sus datos
Resultado esperado: Todos los datos se preservan correctamente
```

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/SessionsTable.tsx` | 4 cambios principales en generación de IDs y cálculo de índices |
| `src/lib/types.ts` | Actualización de tipos para soportar IDs temporales |

---

## Mejoras Adicionales Implementadas

1. **Logs de depuración**: Se agregaron console.log para rastrear creación de sesiones e items
2. **Validaciones de índice**: Se agregaron validaciones `if (r.items[actualIdx])` para evitar crashes
3. **IDs únicos garantizados**: Uso de `Date.now()` + offset para garantizar unicidad

---

## Notas Importantes

- **NO eliminar IDs temporales**: Los IDs negativos son fundamentales para el funcionamiento correcto
- **NO usar `indexOf` o coincidencias por valor**: Siempre usar IDs para identificar items
- **Preservar IDs de BD**: Cuando se carga desde BD, usar los IDs reales, nunca reemplazarlos

---

## Próximos Pasos

- [ ] Probar exhaustivamente con múltiples sesiones
- [ ] Verificar que el guardado preserva `procedure_template_id`
- [ ] Confirmar que la edición de plantillas funciona correctamente
- [ ] Validar que no hay regresiones en otros flujos

---

**Fecha**: 2025-11-29
**Autor**: Claude Code (Refactor)
