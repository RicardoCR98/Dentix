# Especificación de Diseño: Refactorización FinancesPage

**Fecha:** 2025-12-18
**Archivo:** `D:\Github\odonto\src\pages\FinancesPage.tsx`
**Objetivo:** Simplificar la pantalla de Finanzas para responder en <5 segundos: ¿Cuánto me deben? ¿Quién me debe? ¿A quién cobro primero?

---

## Principios de Diseño

1. **Menos es más**: Eliminar todo lo que no ayude a cobrar hoy
2. **Acción inmediata**: Cada fila debe invitar a actuar (WhatsApp, registrar pago)
3. **Sin drama**: UI tranquila, clara, directa (no ERP, no CRM)
4. **Sin decoración**: No gráficas, no reportes, no KPIs decorativos

---

## 1. ELEMENTOS A ELIMINAR

### 1.1 Imports no utilizados (líneas 3-18)
**Eliminar:**
```typescript
TrendingUp,      // línea 5
Users,           // línea 6
PieChart,        // línea 15
ChevronLeft,     // línea 16
Wallet2,         // línea 17
```

**Mantener:**
```typescript
Wallet, AlertTriangle, Clock, CheckCircle2, ArrowUpDown,
Filter, Phone, CalendarClock, ChevronRight
```

**Agregar:**
```typescript
Search,          // Para búsqueda
MessageCircle,   // Para WhatsApp
MoreVertical,    // Para menú de acciones
```

### 1.2 Estados y cálculos innecesarios

**Eliminar (líneas 70-89):**
```typescript
const totalPaid = patientsWithDebt.reduce((sum, p) => sum + p.total_paid, 0);
const totalBudget = patientsWithDebt.reduce((sum, p) => sum + p.total_budget, 0);
const collectionRate = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;
```

**Eliminar variable (línea 88):**
```typescript
const recentDebt = patientsWithDebt.filter((p) => p.days_since_last <= 30);
```

**Agregar nuevo estado:**
```typescript
const [searchQuery, setSearchQuery] = useState<string>("");
const [selectedPatient, setSelectedPatient] = useState<PatientDebtSummary | null>(null);
```

### 1.3 Filtro "recent" (líneas 37, 94-95, 511-520)

**Eliminar tipo:**
```typescript
type FilterStatus = "all" | "overdue" | "recent";  // Cambiar a: "all" | "overdue" | "urgent"
```

**Eliminar lógica de filtro "recent":**
```typescript
} else if (filterStatus === "recent") {
  return patientsWithDebt.filter((p) => p.days_since_last <= 30);
}
```

**Eliminar botón filtro "Recientes" (líneas 511-520)**

### 1.4 Cards de KPIs innecesarias (líneas 345-392)

**Eliminar completamente:**
- Card "Total Presupuestado" (líneas 346-369)
- Card "Total Cobrado" (líneas 372-392)

### 1.5 Columnas de tabla innecesarias

**Eliminar columnas (líneas 161-278):**
- `total_budget` (Presupuesto) - líneas 161-170
- `total_paid` (Pagado con barra de progreso) - líneas 171-193
- `last_session_date` (Última Sesión) - líneas 212-239
- `status` (Estado con badges) - líneas 241-278

### 1.6 Botón "Gestionar Cobros" (líneas 449-459)

**Eliminar todo el bloque `right` del Section:**
```typescript
right={
  <div className="flex items-center gap-2">
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setPaymentsDialogOpen(true)}
      className="flex items-center gap-2"
    >
      <Phone size={16} />
      Gestionar Cobros
    </Button>
  </div>
}
```

### 1.7 Dialog de pagos pendientes (líneas 702-706)

**Eliminar:**
```typescript
<PendingPaymentsDialog
  open={paymentsDialogOpen}
  onOpenChange={setPaymentsDialogOpen}
  onSelectPatient={handleSelectPatient}
/>
```

**Eliminar import:**
```typescript
import PendingPaymentsDialog from "../components/PendingPaymentsDialog";
```

---

## 2. ELEMENTOS A MANTENER

### 2.1 Header (líneas 331-342)
**Mantener exactamente igual:**
- Título: "Finanzas"
- Subtítulo: "Cuentas por cobrar y seguimiento"
- Ícono gradient con Wallet

### 2.2 Columna "Paciente" (líneas 128-160)
**Mantener estructura:**
- Avatar circular con inicial
- Nombre en bold
- Teléfono con ícono (pequeño, muted)

**Modificación menor en avatar:**
```typescript
// Color según urgencia:
patient.days_since_last > 90
  ? "bg-red-500/20 text-red-600"
  : patient.is_overdue
    ? "bg-orange-500/20 text-orange-600"
    : "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]"
```

### 2.3 Columna "Saldo" (líneas 194-210)
**Mantener lógica de colores pero actualizar:**
```typescript
className={cn(
  "font-bold text-lg",
  patient.days_since_last > 90
    ? "text-red-600"      // +90 días = rojo
    : "text-orange-600"   // Todo lo demás = naranja
)}
```

### 2.4 Loading State (líneas 316-327)
**Mantener igual**

### 2.5 Empty State (líneas 462-474)
**Mantener igual**

### 2.6 Paginación (líneas 636-697)
**Mantener igual**

### 2.7 Funciones helper
**Mantener:**
- `formatCurrency()` (líneas 107-114)
- `formatDate()` (líneas 116-123)
- `loadFinancialData()` (líneas 52-63)

---

## 3. ELEMENTOS A MODIFICAR

### 3.1 Cálculo de "urgentes" (agregar nuevo)

**Después de línea 85, agregar:**
```typescript
// Urgent patients (>90 days)
const urgentPatients = patientsWithDebt.filter((p) => p.days_since_last > 90);
const urgentAmount = urgentPatients.reduce((sum, p) => sum + p.total_debt, 0);

// Overdue but not urgent (30-90 days)
const overdueNotUrgent = patientsWithDebt.filter(
  (p) => p.is_overdue && p.days_since_last <= 90
);
```

### 3.2 Modificar tipo FilterStatus

**Línea 37, cambiar:**
```typescript
type FilterStatus = "all" | "overdue" | "urgent";
```

### 3.3 Actualizar lógica de filtros (líneas 91-98)

**Reemplazar:**
```typescript
const filteredData = useMemo(() => {
  let filtered = patientsWithDebt;

  // Filtro por estado
  if (filterStatus === "overdue") {
    filtered = filtered.filter((p) => p.is_overdue && p.days_since_last <= 90);
  } else if (filterStatus === "urgent") {
    filtered = filtered.filter((p) => p.days_since_last > 90);
  }

  // Filtro por búsqueda
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.full_name.toLowerCase().includes(query) ||
        (p.phone && p.phone.includes(query))
    );
  }

  return filtered;
}, [patientsWithDebt, filterStatus, searchQuery]);
```

### 3.4 Actualizar orden por defecto (líneas 48-50)

**Reemplazar:**
```typescript
const [sorting, setSorting] = useState<SortingState>([
  { id: "days_since_last", desc: true }, // Más viejo primero
]);
```

### 3.5 Modificar Cards superiores (líneas 345-442)

**Reemplazar todo el grid de cards con:**
```typescript
{/* Stats Cards - Solo 3 cards críticas */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Por Cobrar */}
  <div className="card p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="p-3 badge-warning rounded-xl">
        <Wallet className="text-orange-600" size={24} />
      </div>
      <Badge variant="warning" className="text-xs">
        Pendiente
      </Badge>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
        Por Cobrar
      </p>
      <p className="text-2xl font-bold text-orange-600">
        {formatCurrency(totalDebt)}
      </p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
        <Users size={12} />
        {patientsWithDebt.length} paciente{patientsWithDebt.length !== 1 ? "s" : ""}
      </p>
    </div>
  </div>

  {/* Vencidos (30-90 días) */}
  <div className="card p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="p-3 badge-warning rounded-xl">
        <Clock className="text-orange-600" size={24} />
      </div>
      <Badge variant="warning" className="text-xs">
        Vencidos
      </Badge>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
        Vencidos
      </p>
      <p className="text-2xl font-bold text-orange-600">
        {formatCurrency(overdueNotUrgent.reduce((sum, p) => sum + p.total_debt, 0))}
      </p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
        <Clock size={12} />
        {overdueNotUrgent.length} paciente{overdueNotUrgent.length !== 1 ? "s" : ""} (+30 días)
      </p>
    </div>
  </div>

  {/* Urgentes (+90 días) */}
  <div className="card p-6 hover:shadow-lg transition-shadow border-red-500/20">
    <div className="flex items-start justify-between mb-3">
      <div className="p-3 badge-danger rounded-xl">
        <AlertTriangle className="text-red-600" size={24} />
      </div>
      <Badge variant="danger" className="text-xs animate-pulse">
        Urgente
      </Badge>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
        Urgentes
      </p>
      <p className="text-2xl font-bold text-red-600">
        {formatCurrency(urgentAmount)}
      </p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
        <AlertTriangle size={12} />
        {urgentPatients.length} paciente{urgentPatients.length !== 1 ? "s" : ""} (+90 días)
      </p>
    </div>
  </div>
</div>
```

### 3.6 Reemplazar barra de filtros (líneas 477-529)

**Reemplazar completamente:**
```typescript
{/* Search and Filters */}
<div className="flex flex-col sm:flex-row gap-3 mb-6 pb-4 border-b border-[hsl(var(--border))]">
  {/* Search Input */}
  <div className="flex-1 relative">
    <Search
      size={18}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
    />
    <Input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Buscar por nombre o teléfono"
      className="pl-10"
    />
  </div>

  {/* Filter Chips */}
  <div className="flex items-center gap-2">
    <button
      onClick={() => setFilterStatus("all")}
      className={cn(
        "px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
        filterStatus === "all"
          ? "bg-[hsl(var(--brand))] text-white"
          : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80"
      )}
    >
      Todos ({patientsWithDebt.length})
    </button>
    <button
      onClick={() => setFilterStatus("overdue")}
      className={cn(
        "px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
        filterStatus === "overdue"
          ? "bg-orange-600 text-white"
          : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
      )}
    >
      Vencidos ({overdueNotUrgent.length})
    </button>
    <button
      onClick={() => setFilterStatus("urgent")}
      className={cn(
        "px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
        filterStatus === "urgent"
          ? "bg-red-600 text-white"
          : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
      )}
    >
      Urgentes ({urgentPatients.length})
    </button>
  </div>
</div>
```

---

## 4. ELEMENTOS NUEVOS A AGREGAR

### 4.1 Nueva columna: "Estado de cuenta" (reemplaza last_session_date y status)

**Agregar después de la columna total_debt (después de línea 210):**

```typescript
columnHelper.accessor("days_since_last", {
  id: "days_since_last",
  enableSorting: true,
  header: () => <span>Estado de cuenta</span>,
  cell: (info) => {
    const days = info.getValue();
    const patient = info.row.original;

    // Determinar color y texto según antigüedad
    let colorClass = "text-[hsl(var(--muted-foreground))]";
    let text = `Hace ${days} días`;

    if (days <= 7) {
      colorClass = "text-[hsl(var(--muted-foreground))]";
    } else if (days <= 30) {
      colorClass = "text-yellow-600";
    } else if (days <= 90) {
      colorClass = "text-orange-600";
    } else {
      colorClass = "text-red-600 font-semibold";
      text = `+90 días`;
    }

    return (
      <span className={cn("text-sm", colorClass)}>
        {text}
      </span>
    );
  },
}),
```

### 4.2 Nueva columna de Acciones (reemplazar la existente líneas 279-293)

**Reemplazar completamente:**

```typescript
columnHelper.display({
  id: "actions",
  header: () => <span className="text-right">Acciones</span>,
  cell: (info) => {
    const patient = info.row.original;

    const handleWhatsApp = () => {
      if (patient.phone) {
        const phone = patient.phone.replace(/\D/g, ''); // Remove non-digits
        const message = `Hola ${patient.full_name}, te contacto desde la clínica para coordinar el pago pendiente de ${formatCurrency(patient.total_debt)}.`;
        const url = `https://wa.me/593${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
    };

    const handleRegisterPayment = () => {
      setSelectedPatient(patient);
      setPaymentsDialogOpen(true);
    };

    return (
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* WhatsApp Button */}
        {patient.phone && (
          <button
            onClick={handleWhatsApp}
            className="p-2 rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
            title="Enviar WhatsApp"
            aria-label="Enviar WhatsApp"
          >
            <MessageCircle size={18} />
          </button>
        )}

        {/* Register Payment Button */}
        <button
          onClick={handleRegisterPayment}
          className="p-2 rounded-lg hover:bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] transition-colors"
          title="Registrar pago"
          aria-label="Registrar pago"
        >
          <CheckCircle2 size={18} />
        </button>

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              aria-label="Más opciones"
            >
              <MoreVertical size={18} className="text-[hsl(var(--muted-foreground))]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              // TODO: Navigate to patient detail page
              console.log('Ver detalle', patient);
            }}>
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              // TODO: Open payment plan dialog
              console.log('Acuerdo de pago', patient);
            }}>
              Acuerdo de pago
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // TODO: Mark as uncollectible
                console.log('Marcar incobrable', patient);
              }}
              className="text-red-600 focus:text-red-600"
            >
              Marcar incobrable
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
}),
```

### 4.3 Agregar DropdownMenu imports

**Agregar en línea 32:**
```typescript
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../components/ui/DropdownMenu";
import { Input } from "../components/ui/Input";
```

### 4.4 Reemplazar PendingPaymentsDialog con QuickPaymentModal

**Después de línea 700 (cerrando del Section), agregar:**

```typescript
{/* Quick Payment Modal */}
{selectedPatient && (
  <QuickPaymentModal
    open={paymentsDialogOpen}
    onOpenChange={setPaymentsDialogOpen}
    patientId={selectedPatient.patient_id}
    paymentMethods={[]} // TODO: Load from master data
    onSave={async (payment) => {
      try {
        const repo = await getRepository();
        // TODO: Save payment via repository
        console.log('Saving payment:', payment, 'for patient:', selectedPatient);
        await loadFinancialData(); // Reload data
      } catch (error) {
        console.error('Error saving payment:', error);
      }
    }}
  />
)}
```

**Agregar import:**
```typescript
import { QuickPaymentModal } from "../components/QuickPaymentModal";
```

---

## 5. ESTRUCTURA FINAL DE COLUMNAS

**Orden de columnas en la tabla:**

1. **Paciente** (existente, modificado)
   - Avatar con color por urgencia
   - Nombre (bold)
   - Teléfono (pequeño, muted)

2. **Saldo** (existente, modificado)
   - Monto en bold, grande
   - Color: orange-600 (0-90 días), red-600 (+90 días)

3. **Estado de cuenta** (NUEVA - reemplaza last_session_date y status)
   - "Hace X días" o "+90 días"
   - Colores por rango: muted (0-7), yellow (8-30), orange (31-90), red (+90)

4. **Acciones** (nueva, reemplaza la existente)
   - Botón WhatsApp
   - Botón "Registrar pago"
   - Menú "..." (Ver detalle, Acuerdo de pago, Marcar incobrable)

---

## 6. ALINEACIÓN DE COLUMNAS

```typescript
// En thead (líneas 543-560)
["full_name"].includes(header.id) ? "text-left" : "text-right",

// En tbody (líneas 606-610)
["full_name"].includes(cell.column.id) ? "text-left" : "text-right",
```

**IMPORTANTE:** La columna "Acciones" debe alinearse a la derecha tanto en header como en cell.

---

## 7. COMPORTAMIENTO DE SORTING

**Orden por defecto:**
- Primario: `days_since_last DESC` (más antiguo primero)
- Secundario: `total_debt DESC` (mayor saldo primero)

**Columnas ordenables:**
- Paciente (alfabético)
- Saldo (numérico)
- Estado de cuenta / days_since_last (numérico)

---

## 8. FLUJO DE INTERACCIÓN

### 8.1 Registrar pago rápido
1. Usuario hace hover en fila → botones aparecen (opacity 0 → 100)
2. Click en "CheckCircle2" → Abre QuickPaymentModal
3. Modal muestra campos: fecha, monto, método, notas
4. Al guardar → actualiza datos financieros → cierra modal

### 8.2 Enviar WhatsApp
1. Click en "MessageCircle" → abre WhatsApp Web/Desktop
2. URL prellenada con mensaje:
   ```
   Hola {nombre}, te contacto desde la clínica para coordinar
   el pago pendiente de ${saldo}.
   ```

### 8.3 Búsqueda en tiempo real
1. Usuario escribe en input → filtra al instante
2. Búsqueda en: `full_name` y `phone`
3. Case-insensitive
4. Se combina con filtro activo (Todos/Vencidos/Urgentes)

---

## 9. ESTILOS Y CLASES CSS

### 9.1 Colores por urgencia (consistentes en todo el componente)

```typescript
// 0-30 días (reciente): brand color
bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]

// 31-90 días (vencido): orange
bg-orange-500/20 text-orange-600

// +90 días (urgente): red
bg-red-500/20 text-red-600
```

### 9.2 Hover states
```typescript
// Fila de tabla
hover:bg-[hsl(var(--muted))]/50

// Botones de acción
hover:bg-green-500/10      // WhatsApp
hover:bg-[hsl(var(--brand))]/10  // Registrar pago
hover:bg-[hsl(var(--muted))]     // Menu
```

### 9.3 Animación de fade-in
**Mantener (línea 600):**
```typescript
style={{
  animation: `fadeIn 300ms ease-out ${index * 50}ms both`,
}}
```

---

## 10. VALIDACIONES Y EDGE CASES

### 10.1 Sin teléfono
- No mostrar botón WhatsApp
- No mostrar ícono de teléfono en columna Paciente

### 10.2 Búsqueda sin resultados
**Mostrar mensaje (similar a líneas 625-633):**
```
No se encontraron pacientes
Prueba con otro término de búsqueda
```

### 10.3 Sin pacientes con deuda
**Mantener empty state existente (líneas 462-474)**

---

## 11. PENDIENTES (TODOs para implementación)

1. **Cargar payment methods** en QuickPaymentModal (actualmente array vacío)
2. **Implementar guardado de pago** en `onSave` del modal
3. **Navegación a detalle** del paciente en menú "Ver detalle"
4. **Dialog de acuerdo de pago** (nueva funcionalidad futura)
5. **Funcionalidad "Marcar incobrable"** (nueva funcionalidad futura)

---

## 12. RESUMEN DE CAMBIOS

### Eliminaciones
- 2 cards de KPIs (Total Presupuestado, Total Cobrado)
- 3 columnas de tabla (Presupuesto, Pagado, Última Sesión, Estado)
- Filtro "Recientes"
- Botón "Gestionar Cobros"
- Dialog PendingPaymentsDialog

### Adiciones
- 1 card nueva (Vencidos 30-90 días)
- Campo de búsqueda en tiempo real
- Filtro "Urgentes" (+90 días)
- Columna "Estado de cuenta" (híbrida)
- Botón WhatsApp por fila
- Botón "Registrar pago" por fila
- Menú de acciones con 3 opciones
- QuickPaymentModal

### Modificaciones
- Card "Por Cobrar" (simplificada)
- Card "Urgentes" (redefinida como +90 días)
- Columna Paciente (colores por urgencia)
- Columna Saldo (colores actualizados)
- Lógica de filtros (all/overdue/urgent)
- Orden por defecto (días primero)

---

## 13. ARCHIVOS A MODIFICAR

1. **`D:\Github\odonto\src\pages\FinancesPage.tsx`** (archivo principal)
2. Dependencias existentes (no modificar):
   - `D:\Github\odonto\src\components\QuickPaymentModal.tsx`
   - `D:\Github\odonto\src\components\ui\DropdownMenu.tsx` (verificar existencia)
   - `D:\Github\odonto\src\components\ui\Input.tsx`

---

## 14. CHECKLIST DE IMPLEMENTACIÓN

- [ ] Actualizar imports (eliminar/agregar)
- [ ] Eliminar estados y cálculos innecesarios
- [ ] Agregar estados nuevos (searchQuery, selectedPatient)
- [ ] Modificar tipo FilterStatus
- [ ] Actualizar cálculos de urgentes y vencidos
- [ ] Actualizar lógica de filtros (incluir búsqueda)
- [ ] Modificar orden por defecto (sorting)
- [ ] Reemplazar grid de 4 cards por 3 cards
- [ ] Agregar barra de búsqueda y filtros chips
- [ ] Eliminar columnas innecesarias
- [ ] Agregar columna "Estado de cuenta"
- [ ] Reemplazar columna Acciones
- [ ] Actualizar alineación de columnas
- [ ] Reemplazar PendingPaymentsDialog por QuickPaymentModal
- [ ] Implementar función handleWhatsApp
- [ ] Implementar función handleRegisterPayment
- [ ] Agregar DropdownMenu items
- [ ] Probar flujo completo de búsqueda
- [ ] Probar flujo completo de filtros
- [ ] Probar WhatsApp (validar URL)
- [ ] Probar modal de pago rápido
- [ ] Verificar responsive design
- [ ] Verificar animaciones y transitions

---

**Fin de especificación**
