# 🐛 Corrección: Sistema de Sesiones en Borrador

## Problema Original

**Síntoma**: Al crear una "Nueva sesión", la sesión anterior se guardaba automáticamente, impidiendo eliminarla y causando que sesiones accidentales quedaran en el histórico.

**Causa raíz**: No existía distinción entre sesiones **en borrador** (editables/eliminables) y sesiones **guardadas** (histórico legal).

---

## Solución Implementada

### **1. Campo `is_saved` en SessionRow**

**Archivo**: `src/lib/types.ts` (línea 93)

```typescript
export type SessionRow = {
  // ... otros campos
  is_saved?: boolean;  // false = borrador, true = guardado (histórico)
};
```

**Estados**:
- `is_saved: false` → **BORRADOR** (puede eliminarse, editarse)
- `is_saved: true` → **GUARDADO** (histórico legal, no editable, no eliminable)

---

### **2. Creación de Sesiones como Borrador**

**Archivo**: `src/components/SessionsTable.tsx` (línea 275)

```typescript
return {
  id: tempSessionId,
  date: today,
  items: baseItems,
  // ... otros campos
  is_saved: false,  // ✅ BORRADOR - puede eliminarse
};
```

**Beneficio**: Las nuevas sesiones NO se guardan automáticamente.

---

### **3. Botón Eliminar (Solo Borradores)**

**Archivo**: `src/components/SessionsTable.tsx` (línea 690-704)

```typescript
{/* Eliminar sesión (solo borradores) */}
{!row.is_saved && (
  <Button
    variant="ghost"
    size="sm"
    title="Eliminar sesión en borrador"
    onClick={(e) => {
      e.stopPropagation();
      deleteSession(row.id!);
    }}
    className="hover:bg-red-500/20 hover:text-red-600"
  >
    <Trash2 size={16} />
  </Button>
)}
```

**Comportamiento**:
- El icono 🗑️ **solo aparece** en sesiones con `is_saved: false`
- Al hacer clic, pide confirmación antes de eliminar
- Si intentas eliminar una sesión guardada, muestra alerta de error

---

### **4. Guardado Selectivo (Solo Borradores)**

**Archivo**: `src/App.tsx` (línea 213-228)

```typescript
// Filtrar solo sesiones en BORRADOR para guardar
const draftSessions = sessions.filter((s) => !s.is_saved);

if (draftSessions.length === 0) {
  toast.warning("Sin cambios", "No hay sesiones nuevas para guardar");
  return;
}

console.log(`💾 Guardando ${draftSessions.length} sesión(es) en borrador...`);

// Ahora guardar solo las sesiones en borrador
const { patientId, visitId } = await repo.saveVisitWithSessions({
  patient,
  visit: visitPayload,
  sessions: draftSessions,  // ✅ Solo borradores
});
```

**Beneficio**:
- Solo se envían borradores a la BD
- Sesiones ya guardadas NO se vuelven a guardar
- Notifica si no hay nada que guardar

---

### **5. Marcar Sesiones como Guardadas Después de Guardar**

**Archivo**: `src/App.tsx` (línea 243-253)

```typescript
// Marcar sesiones guardadas como is_saved: true
setSessions((prevSessions) =>
  prevSessions.map((s) => {
    // Si era borrador, marcarlo como guardado
    if (!s.is_saved) {
      return { ...s, is_saved: true, visitId };
    }
    // Sesiones ya guardadas no se tocan
    return s;
  }),
);
```

**Beneficio**: Después de guardar, las sesiones pasan de "Borrador" → "Guardado" automáticamente.

---

### **6. Advertencia en "Nueva Historia"**

**Archivo**: `src/App.tsx` (línea 135-156)

```typescript
const handleNew = useCallback(() => {
  // Verificar si hay sesiones en borrador sin guardar
  const draftSessions = sessions.filter((s) => !s.is_saved);
  const hasDrafts = draftSessions.length > 0;

  let confirmMessage = "¿Crear una nueva historia? Se perderán cambios no guardados.";
  if (hasDrafts) {
    confirmMessage = `⚠️ Tienes ${draftSessions.length} sesión(es) en BORRADOR sin guardar.\n\n¿Estás seguro de crear una nueva historia? Se perderán todos los borradores.`;
  }

  if (!confirm(confirmMessage)) {
    return;
  }

  // ... limpiar todo
}, [sessions]);
```

**Beneficio**: Previene pérdida accidental de borradores.

---

### **7. Solo Editar Borrador Más Reciente**

**Archivo**: `src/components/SessionsTable.tsx` (línea 231-245)

```typescript
// Determinar cuál es la sesión más reciente EN BORRADOR (la única editable)
const mostRecentDraftId = useMemo(() => {
  // Filtrar solo sesiones en borrador
  const drafts = sessions.filter((s) => !s.is_saved);
  if (drafts.length === 0) return null;

  // Encontrar la sesión borrador con la fecha más reciente
  let mostRecent = drafts[0];
  for (const session of drafts) {
    if ((session.date ?? "") > (mostRecent.date ?? "")) {
      mostRecent = session;
    }
  }
  return mostRecent.id;
}, [sessions]);
```

**Beneficio**: Solo se puede editar la sesión borrador más reciente (lógica correcta según contexto).

---

### **8. Badge Visual de Estado**

**Archivo**: `src/components/SessionsTable.tsx` (línea 617-642)

```typescript
<div className="flex gap-2 shrink-0">
  {/* Badge de estado guardado/borrador */}
  <Badge
    variant={row.is_saved ? "default" : "info"}
    className={!row.is_saved ? "animate-pulse" : ""}
  >
    {row.is_saved ? "Guardado" : "Borrador"}
  </Badge>

  {/* Badge de estado de pago */}
  <Badge variant={/* ... */}>
    {/* Pagado / Abonado / Pendiente */}
  </Badge>
</div>
```

**Beneficio**: El usuario ve claramente:
- 🟦 **"Borrador"** (animado) → Puede eliminar/editar
- ⚫ **"Guardado"** → Histórico legal, no editable

---

### **9. Sesiones Cargadas desde BD → Guardadas**

**Archivo**: `src/lib/storage/TauriSqliteRepository.ts`

```typescript
// Al cargar sesiones desde BD
return rustSessions.map((rustSession) => ({
  // ... otros campos
  is_saved: true,  // ✅ Sesiones desde BD están guardadas
}));
```

**Beneficio**: Al cargar un paciente antiguo, sus sesiones históricas aparecen como "Guardado".

---

## Flujo Completo

### **Caso 1: Nueva Sesión Accidental**

```
1. Doctor crea "Nueva sesión" por error
   → Sesión aparece con badge "Borrador" (animado)
   → Aparece botón 🗑️ de eliminar

2. Doctor se da cuenta del error
   → Hace clic en 🗑️
   → Confirma eliminación
   → Sesión desaparece

✅ No se guarda en BD, no contamina el histórico
```

---

### **Caso 2: Múltiples Sesiones Borradores**

```
1. Doctor crea Sesión 1 (20/11/2024)
   → Estado: Borrador

2. Doctor crea Sesión 2 (29/11/2024)
   → Estado: Borrador
   → Sesión 1 sigue siendo Borrador (NO se guardó)

3. Doctor pulsa "Guardar Historia" (Ctrl+S)
   → Se guardan ambas sesiones
   → Ambas pasan a estado "Guardado"
   → Botón 🗑️ desaparece de ambas

✅ Control total sobre cuándo guardar
```

---

### **Caso 3: Nueva Historia con Borradores**

```
1. Doctor tiene 2 sesiones en borrador
2. Doctor pulsa "Nueva Historia" (botón verde)
3. Sistema muestra alerta:
   ⚠️ "Tienes 2 sesión(es) en BORRADOR sin guardar.

   ¿Estás seguro de crear una nueva historia?
   Se perderán todos los borradores."

4a. Doctor cancela → Borradores se preservan
4b. Doctor confirma → Borradores se pierden

✅ Previene pérdida accidental
```

---

### **Caso 4: Cargar Paciente Antiguo**

```
1. Doctor busca paciente de hace 2 meses
2. Sistema carga 3 sesiones históricas
   → Todas aparecen con badge "Guardado"
   → NO aparece botón 🗑️
   → Solo la más reciente borrador es editable

3. Doctor crea nueva sesión
   → Nueva sesión: badge "Borrador"
   → Sesiones antiguas: badge "Guardado"

✅ Histórico protegido, nuevas sesiones editables
```

---

## Cambios Resumidos

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `types.ts` | Agregado `is_saved?: boolean` | 93 |
| `SessionsTable.tsx` | Creación borrador + botón eliminar + badge visual + lógica editable | 275, 352-370, 617-642, 690-704, 231-245 |
| `App.tsx` | Guardado selectivo + advertencia + marcar guardadas | 135-156, 213-228, 243-253 |
| `TauriSqliteRepository.ts` | Marcar sesiones cargadas como guardadas | 2 lugares |

---

## Pruebas Recomendadas

### ✅ Test 1: Eliminar sesión accidental
```
1. Crear nueva sesión
2. Verificar badge "Borrador" animado
3. Verificar botón 🗑️ visible
4. Hacer clic en 🗑️
5. Confirmar eliminación
Resultado: Sesión desaparece
```

### ✅ Test 2: Múltiples borradores
```
1. Crear 3 sesiones sin guardar
2. Verificar las 3 tienen badge "Borrador"
3. Verificar las 3 tienen botón 🗑️
4. Guardar historia (Ctrl+S)
5. Verificar las 3 cambian a "Guardado"
6. Verificar botón 🗑️ desaparece
Resultado: Borradores → Guardadas correctamente
```

### ✅ Test 3: Advertencia en Nueva Historia
```
1. Crear 2 sesiones sin guardar
2. Pulsar "Nueva Historia"
3. Verificar alerta "⚠️ Tienes 2 sesión(es) en BORRADOR"
4. Cancelar
5. Verificar borradores siguen ahí
Resultado: Advertencia funciona, borradores protegidos
```

### ✅ Test 4: Cargar paciente antiguo
```
1. Guardar paciente con 2 sesiones
2. Crear nueva historia
3. Buscar y cargar paciente anterior
4. Verificar 2 sesiones con badge "Guardado"
5. Verificar NO tienen botón 🗑️
6. Crear nueva sesión
7. Verificar nueva sesión tiene "Borrador" + 🗑️
Resultado: Histórico protegido, nuevas editables
```

---

## Notas Importantes

- **Solo borradores se guardan**: Al presionar Ctrl+S, solo se envían sesiones con `is_saved: false`
- **Un borrador editable**: Solo la sesión borrador más reciente permite editar plantilla
- **Histórico legal protegido**: Sesiones guardadas NO se pueden eliminar ni editar
- **Badge animado**: El badge "Borrador" tiene `animate-pulse` para llamar la atención

---

**Fecha**: 2025-11-29
**Autor**: Claude Code (Refactor)
