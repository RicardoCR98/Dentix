# UX Implementation Guide: Code Examples & Specifications

**Companion to:** UX_IMPROVEMENT_ROADMAP.md
**Purpose:** Concrete code examples for each improvement
**Updated:** 2025-12-19

---

## Table of Contents

1. [C1: Eliminate Action Button Redundancy](#c1-eliminate-action-button-redundancy)
2. [C2: Color System Overhaul](#c2-color-system-overhaul)
3. [C3: Odontogram Usability](#c3-odontogram-usability)
4. [C4: PatientCard/Form Simplification](#c4-patientcardform-simplification)
5. [H1: Remove SessionsTable Pagination](#h1-remove-sessionstable-pagination)
6. [Design Tokens Reference](#design-tokens-reference)

---

## C1: Eliminate Action Button Redundancy

### Step 1: Remove "Acciones Rápidas" Section

**File:** `D:\Github\odonto\src\pages\PatientsPageUnified.tsx`

**Delete these lines:**

```tsx
// DELETE LINES 114-119 (state management)
const showQuickActions = useAppStore((state) => state.showQuickActions);
const quickActionsRef = useRef<HTMLElement>(null);
const showFAB = useScrollVisibility({ targetRef: quickActionsRef });

// DELETE LINES 322-385 (vertical layout quick actions)
{showQuickActions && (
  <Section
    ref={quickActionsRef}
    title="Acciones Rápidas"
    icon={...}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
      {/* ... 4 action buttons ... */}
    </div>
  </Section>
)}

// DELETE LINES 562-626 (tabs layout quick actions - duplicate)
{/* Same as above */}

// DELETE LINES 508-527 (fixed action buttons at bottom - vertical)
<div className="flex justify-end gap-3 mt-8 p-6 bg-[hsl(var(--muted))] rounded-lg">
  <Button onClick={handleNewWrapper} variant="ghost" size="lg">
    <Plus size={18} />
    Nueva Historia
  </Button>
  {/* ... other buttons ... */}
</div>

// DELETE LINES 799-818 (fixed action buttons at bottom - tabs)
{/* Same as above */}
```

**Keep only MacOSDock (lines 529-541, 820-832):**

```tsx
{/* macOS Dock - THE ONLY ACTION BAR */}
<MacOSDock
  visible={true}
  onNewRecord={handleNewWrapper}
  onSearch={() => setSearchDialogOpen(true)}
  onPrint={handlePreview}
  onSave={handleSaveWrapper}
  onPendingPayments={() => setPaymentsDialogOpen(true)}
  hasChanges={hasAnyChanges}
  changesCount={changesCount}
  saveDisabled={!canSave}
  isSnapshotMode={isSnapshotMode}
/>
```

### Step 2: Remove Unused State from Store

**File:** `D:\Github\odonto\src\stores\uiStore.ts`

```typescript
// FIND AND REMOVE:
showQuickActions: boolean;
setShowQuickActions: (show: boolean) => void;

// In create() function, remove:
showQuickActions: true,
setShowQuickActions: (show) => set({ showQuickActions: show }),
```

### Step 3: Enhance MacOSDock Visibility

**File:** `D:\Github\odonto\src\components\MacOSDock.tsx`

**Update the glass-morphism container (lines 125-134):**

```tsx
// BEFORE:
style={{
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3)...",
}}

// AFTER (more prominent):
style={{
  background: "rgba(255, 255, 255, 0.15)",
  backdropFilter: "blur(60px) saturate(200%)",
  WebkitBackdropFilter: "blur(60px) saturate(200%)",
  boxShadow: `
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 8px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.4)
  `,
}}
```

**Result:**
- Removed ~250 lines of redundant code
- Reclaimed ~500px vertical space
- Single source of truth for actions

---

## C2: Color System Overhaul

### Step 1: Update CSS Variables

**File:** `D:\Github\odonto\src\index.css`

**Find the badge classes section (around line 200-350) and replace:**

```css
/* ================== BEFORE (DELETE) ================== */

.badge-success {
  border: 2px solid hsl(142, 71%, 35%);
  background-color: color-mix(in oklab, hsl(142, 71%, 45%) 12%, transparent);
  color: hsl(142, 71%, 25%);
}

.badge-info {
  border: 2px solid hsl(215, 80%, 50%);
  background-color: color-mix(in oklab, hsl(215, 80%, 50%) 12%, transparent);
  color: hsl(215, 80%, 35%);
}

.badge-purple {
  border: 2px solid hsl(271, 59%, 50%);
  background-color: color-mix(in oklab, hsl(271, 59%, 50%) 12%, transparent);
  color: hsl(271, 59%, 30%);
}

.badge-danger {
  border: 2px solid hsl(0, 80%, 50%);
  background-color: color-mix(in oklab, hsl(0, 80%, 50%) 12%, transparent);
  color: hsl(0, 80%, 30%);
}

/* ================== AFTER (SIMPLIFIED) ================== */

/* Neutral - for most UI elements */
.badge-neutral {
  border: 2px solid hsl(var(--border));
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

/* Brand - for primary actions/status */
.badge-brand {
  border: 2px solid hsl(var(--brand));
  background-color: color-mix(in oklab, hsl(var(--brand)) 10%, transparent);
  color: hsl(var(--brand));
}

/* Danger - for destructive actions/errors ONLY */
.badge-danger {
  border: 2px solid hsl(0, 80%, 50%);
  background-color: color-mix(in oklab, hsl(0, 80%, 50%) 10%, transparent);
  color: hsl(0, 80%, 40%);
}

/* Success - for confirmations/positive feedback ONLY */
.badge-success {
  border: 2px solid hsl(142, 60%, 45%);
  background-color: color-mix(in oklab, hsl(142, 60%, 45%) 10%, transparent);
  color: hsl(142, 60%, 35%);
}
```

### Step 2: Update Badge Component

**File:** `D:\Github\odonto\src\components\ui\Badge.tsx`

```tsx
// Update variant type
export type BadgeVariant =
  | 'neutral'   // NEW: default for most cases
  | 'brand'     // NEW: primary status
  | 'danger'    // KEEP: destructive
  | 'success'   // KEEP: positive feedback
  | 'default';  // DEPRECATED: use neutral instead

// Update className mapping
const variantClass = {
  neutral: 'badge-neutral',
  brand: 'badge-brand',
  danger: 'badge-danger',
  success: 'badge-success',
  default: 'badge-neutral', // fallback
};
```

### Step 3: Update MacOSDock Button Colors

**File:** `D:\Github\odonto\src\components\MacOSDock.tsx`

**Replace button variants (lines 136-200):**

```tsx
// BEFORE - colorful variants
<MacOSDockButton variant="success" />   // Nueva Historia (green)
<MacOSDockButton variant="purple" />    // Búsqueda (purple)
<MacOSDockButton variant="info" />      // Imprimir (blue)
<MacOSDockButton variant={getSaveVariant()} />  // Guardar (varies)
<MacOSDockButton variant="danger" />    // Cartera (red)

// AFTER - neutral with selective emphasis
<MacOSDockButton
  variant="neutral"  // Neutral gray
  onClick={onNewRecord}
/>

<MacOSDockButton
  variant="neutral"  // Neutral gray
  onClick={onSearch}
/>

<MacOSDockButton
  variant="neutral"  // Neutral gray
  onClick={onPrint}
/>

<MacOSDockButton
  variant={hasChanges ? "brand" : "neutral"}  // BLUE only when has changes
  onClick={handleSave}
  badgeCount={changesCount}
/>

<MacOSDockButton
  variant="neutral"  // Neutral with red badge
  onClick={onPendingPayments}
/>
```

### Step 4: Update MacOSDockButton Styles

**File:** `D:\Github\odonto\src\components\MacOSDockButton.tsx`

```tsx
const variantStyles = {
  neutral: {
    bg: 'rgba(128, 128, 128, 0.2)',     // Gray glass
    border: 'rgba(128, 128, 128, 0.3)',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  brand: {
    bg: 'rgba(59, 130, 246, 0.2)',      // Blue glass
    border: 'rgba(59, 130, 246, 0.4)',
    shadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.2)',       // Red glass
    border: 'rgba(239, 68, 68, 0.4)',
    shadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.2)',       // Green glass
    border: 'rgba(34, 197, 94, 0.4)',
    shadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
  },
};
```

**Visual Result:**
- Dock buttons: all gray except Save (blue when changes exist)
- Clear focus on primary action (save)
- Professional, consistent appearance

---

## C3: Odontogram Usability

### Step 1: Increase Tooth Button Size

**File:** `D:\Github\odonto\src\components\Odontogram.tsx`

**Line 236 - Update grid gap:**

```tsx
// BEFORE:
<div className="grid grid-cols-8 gap-2">

// AFTER:
<div className="grid grid-cols-8 gap-3">
```

**Lines 254-288 - Update button styles:**

```tsx
// BEFORE:
<button
  type="button"
  className={cn(
    "relative h-12 rounded-lg text-center border-2 transition-all",
    "flex flex-col items-center justify-center gap-1",
    "hover:scale-110 hover:shadow-md cursor-pointer",
    // ... rest
  )}
>
  <span className="text-sm font-bold leading-none">
    {toothNum}
  </span>
  {/* ... */}
</button>

// AFTER:
<button
  type="button"
  className={cn(
    "relative h-16 rounded-lg text-center border-2 transition-all",
    "flex flex-col items-center justify-center gap-1.5",
    "hover:scale-[1.15] hover:shadow-lg cursor-pointer",
    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:ring-offset-2",
    hasDiagnoses
      ? "border-[hsl(var(--brand))] bg-[color-mix(in_oklab,hsl(var(--brand))_15%,transparent)] font-semibold animate-pulse-subtle"
      : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--brand))]",
  )}
  title={
    hasDiagnoses
      ? `Diente ${toothNum}: ${diagnoses.join(", ")}`
      : `Diente ${toothNum}`
  }
>
  {/* Tooth number - larger */}
  <span
    className={cn(
      "text-base font-bold leading-none",  // was text-sm
      hasDiagnoses
        ? "text-[hsl(var(--brand))]"
        : "text-[hsl(var(--foreground))]",
    )}
  >
    {toothNum}
  </span>

  {/* Diagnosis count badge */}
  {hasDiagnoses && (
    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--brand))] text-white text-xs font-bold flex items-center justify-center shadow-md">
      {diagnoses.length}
    </div>
  )}
</button>
```

**Add subtle pulse animation to CSS:**

```css
/* Add to src/index.css */
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.02);
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
```

### Step 2: Simplify Popover UI

**File:** `D:\Github\odonto\src\components\Odontogram.tsx`

**Lines 304-346 - Update popover header:**

```tsx
// BEFORE:
<div className="flex items-center justify-between mb-3 pb-3 border-b">
  <div className="flex items-center gap-2">
    {/* ... */}
  </div>
  <div className="flex items-center gap-1">
    {!isEditMode && (
      <Button variant="ghost" onClick={handleEditMode} size="sm">
        <Edit3 size={14} />
        Editar
      </Button>
    )}
    <Popover.Close asChild>
      <Button variant="ghost" size="sm">
        <X size={14} />
      </Button>
    </Popover.Close>
  </div>
</div>

// AFTER (simplified):
<div className="flex items-center justify-between mb-3 pb-3 border-b">
  <div className="flex items-center gap-2">
    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold text-base">
      {toothNum}
    </div>
    <div>
      <div className="font-semibold text-base">Pieza {toothNum}</div>
      {hasDiagnoses && !isEditMode && (
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {diagnoses.length} diagnóstico{diagnoses.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  </div>
  {/* Only show Edit button when there are diagnosis options to manage */}
  <div className="flex items-center gap-1">
    {!isEditMode && (
      <Button
        variant="ghost"
        onClick={handleEditMode}
        size="sm"
        title="Editar lista de diagnósticos"
      >
        <Edit3 size={14} />
      </Button>
    )}
    <Popover.Close asChild>
      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
        <X size={14} />
      </Button>
    </Popover.Close>
  </div>
</div>
```

**Lines 422-463 - Larger checkbox labels:**

```tsx
// BEFORE:
<label className={cn(
  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
  "hover:bg-[hsl(var(--muted))]",
  checked && "bg-[hsl(var(--muted))]",
)}>
  <CheckboxRoot /* ... */ />
  <span className="flex-1 text-sm">{diag.label}</span>
  {/* ... */}
</label>

// AFTER:
<label className={cn(
  "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
  "hover:bg-[hsl(var(--muted))]",
  checked && "bg-[hsl(var(--muted))]",
)}>
  <CheckboxRoot /* ... */ />
  <span className="flex-1 text-base font-medium">{diag.label}</span>
  {checked && (
    <Badge variant="brand" className="text-xs">
      Activo
    </Badge>
  )}
</label>
```

**Lines 466-492 - Auto-close on selection:**

```tsx
// BEFORE:
{!isEditMode && (
  <div className="flex gap-2 pt-3 border-t">
    {hasDiagnoses && (
      <Button variant="ghost" onClick={() => clearTooth(toothNum)}>
        <X size={14} />
        Limpiar
      </Button>
    )}
    <Popover.Close asChild>
      <Button variant="primary" size="sm" className="flex-1">
        <Check size={14} />
        Confirmar
      </Button>
    </Popover.Close>
  </div>
)}

// AFTER (simplified - remove Confirmar button, auto-close is annoying):
{!isEditMode && hasDiagnoses && (
  <div className="flex gap-2 pt-3 border-t">
    <Button
      variant="ghost"
      onClick={() => clearTooth(toothNum)}
      className="flex-1"
    >
      <X size={14} />
      Limpiar diente
    </Button>
  </div>
)}
```

**Visual Result:**
- Tooth buttons: 48px → 64px (33% larger)
- Hover scale: 1.10 → 1.15 (more responsive)
- Badge shows diagnosis count (e.g., "3")
- Larger popover labels (easier to read)
- Fewer buttons in popover (less clutter)

---

## C4: PatientCard/Form Simplification

### Remove PatientCard from Tabs Mode

**File:** `D:\Github\odonto\src\pages\PatientsPageUnified.tsx`

**Lines 109-110 - Delete state:**

```tsx
// DELETE:
const [isEditingPatient, setIsEditingPatient] = useState(true);

// This state is no longer needed
```

**Lines 167-182 - Remove setIsEditingPatient calls:**

```tsx
// BEFORE:
const handleNewWrapper = useCallback(() => {
  const result = handleNew();
  if (result) {
    clearPatientURL();
    setIsEditingPatient(true);  // DELETE THIS LINE
  }
}, [handleNew, clearPatientURL]);

const handleSaveWrapper = useCallback(async () => {
  if (isSnapshotMode) return;
  const result = await handleSave();
  if (result && layoutMode === "tabs") {
    setIsEditingPatient(false);  // DELETE THIS LINE
  }
}, [handleSave, layoutMode, isSnapshotMode]);

const handleSelectPatientWrapper = useCallback(
  async (selectedPatient: Patient) => {
    const result = await handleSelectPatient(selectedPatient);
    if (result) {
      setHasManuallyExited(false);
      if (layoutMode === "tabs") {
        setIsEditingPatient(false);  // DELETE THIS LINE
      }
    }
  },
  [handleSelectPatient, layoutMode],
);

// AFTER (simplified):
const handleNewWrapper = useCallback(() => {
  const result = handleNew();
  if (result) {
    clearPatientURL();
    // No state change needed
  }
}, [handleNew, clearPatientURL]);

const handleSaveWrapper = useCallback(async () => {
  if (isSnapshotMode) return;
  await handleSave();
  // No state change needed
}, [handleSave, isSnapshotMode]);

const handleSelectPatientWrapper = useCallback(
  async (selectedPatient: Patient) => {
    const result = await handleSelectPatient(selectedPatient);
    if (result) {
      setHasManuallyExited(false);
      // No state change needed
    }
  },
  [handleSelectPatient],
);
```

**Lines 645-679 - Simplify tabs mode patient section:**

```tsx
// BEFORE:
<Section
  title="Datos del Paciente"
  icon={<User size={20} />}
  right={
    hasAllergy &&
    !isEditingPatient && (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-base font-bold shadow-lg">
        <AlertTriangle size={20} className="animate-pulse" />
        ALERGIA
      </div>
    )
  }
>
  <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
    {isEditingPatient ? (
      <>
        <PatientForm value={patient} onChange={setPatient} />
        {!hasPatientData && (
          <Alert variant="warning" className="mt-4">
            Por favor completa al menos el nombre y cédula del paciente para
            poder guardar.
          </Alert>
        )}
      </>
    ) : (
      <PatientCard
        patient={patient}
        onEdit={() => setIsEditingPatient(true)}
      />
    )}
  </div>
</Section>

// AFTER (same as vertical mode):
<Section
  title="Datos del Paciente"
  icon={<User size={20} />}
  right={
    hasAllergy && (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-base font-bold shadow-lg sticky top-4 z-40">
        <AlertTriangle size={20} className="animate-pulse" />
        ALERGIA
      </div>
    )
  }
>
  <div className={isSnapshotMode ? "pointer-events-none opacity-70 grayscale" : ""}>
    <PatientForm value={patient} onChange={setPatient} />
    {!hasPatientData && (
      <Alert variant="warning" className="mt-4">
        Por favor completa al menos el nombre y cédula del paciente para
        poder guardar.
      </Alert>
    )}
  </div>
</Section>
```

**Result:**
- Deleted 1 state variable
- Removed 3 state setter calls
- Simplified tabs mode to match vertical mode
- PatientForm now shows consistently (with built-in summary card when saved)
- No more confusing toggle between card and form

---

## H1: Remove SessionsTable Pagination

### Step 1: Delete Pagination State and Logic

**File:** `D:\Github\odonto\src\components\sessions\SessionsTable.tsx`

```tsx
// DELETE LINE 45:
const PAGE_SIZE = 5;

// DELETE LINE 81:
const [page, setPage] = useState(0);

// DELETE LINES 300-306:
const goFirst = useCallback(() => setPage(0), []);
const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
const goNext = useCallback(
  () => setPage((p) => Math.min(totalPages - 1, p + 1)),
  [totalPages],
);
const goLast = useCallback(() => setPage(totalPages - 1), [totalPages]);
```

### Step 2: Show All Sessions

```tsx
// BEFORE (lines 171-188):
const sortedSessions = useMemo(() => {
  const copy = [...sessions].filter((s) => s.session);
  copy.sort((a, b) => {
    const da = a.session?.date ?? "";
    const db = b.session?.date ?? "";
    return db.localeCompare(da);
  });
  return copy;
}, [sessions]);

const totalPages = Math.max(1, Math.ceil(sortedSessions.length / PAGE_SIZE));
const safePage = Math.min(page, totalPages - 1);
const start = safePage * PAGE_SIZE;
const end = start + PAGE_SIZE;
const visibleSessions = useMemo(
  () => sortedSessions.slice(start, end),
  [sortedSessions, start, end],
);

// AFTER (simplified):
const sortedSessions = useMemo(() => {
  const copy = [...sessions].filter((s) => s.session);
  copy.sort((a, b) => {
    const da = a.session?.date ?? "";
    const db = b.session?.date ?? "";
    return db.localeCompare(da);
  });
  return copy;
}, [sessions]);

// No pagination - show all sessions
const visibleSessions = sortedSessions;
```

### Step 3: Delete Pagination UI

```tsx
// DELETE LINES 630-675:
{/* Paginación */}
{sessions.length > 0 && (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-[hsl(var(--muted-foreground))]">
      Página {safePage + 1} de {totalPages} · {PAGE_SIZE} por página
    </span>
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={goFirst} /* ... */>
        <ChevronsLeft size={16} />
      </Button>
      {/* ... other buttons ... */}
    </div>
  </div>
)}
```

### Step 4: Optimize for Scrolling (Optional - for > 20 sessions)

**If many sessions exist, add virtual scrolling:**

```tsx
// Install: pnpm add react-window

import { FixedSizeList as List } from 'react-window';

// Wrap session cards in virtual list:
{sessions.length > 20 ? (
  <List
    height={600}
    itemCount={sortedSessions.length}
    itemSize={200}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <SessionCard session={sortedSessions[index]} /* ... */ />
      </div>
    )}
  </List>
) : (
  <div className="space-y-3">
    {visibleSessions.map((row) => (
      <SessionCard key={row.session?.id} session={row} /* ... */ />
    ))}
  </div>
)}
```

**Result:**
- Removed ~50 lines of pagination code
- Eliminated 2-5 clicks per patient record review
- Faster navigation to any session
- Better overview of treatment history

---

## Design Tokens Reference

### Color Palette

```css
/* Light Mode */
:root {
  /* Brand - Primary Actions */
  --brand: 215 80% 50%;           /* Blue #3B82F6 */
  --brand-hover: 215 80% 45%;

  /* Semantic Colors */
  --danger: 0 80% 50%;            /* Red #EF4444 */
  --danger-hover: 0 80% 45%;
  --success: 142 60% 45%;         /* Green #22C55E */
  --success-hover: 142 60% 40%;

  /* Neutral Scale */
  --foreground: 0 0% 10%;         /* Near black */
  --muted-foreground: 0 0% 45%;   /* Medium gray */
  --border: 0 0% 85%;             /* Light gray */
  --surface: 0 0% 98%;            /* Very light gray */
  --muted: 0 0% 95%;              /* Off-white */
  --background: 0 0% 100%;        /* White */
}

/* Dark Mode */
[data-theme="dark"] {
  --foreground: 0 0% 95%;
  --muted-foreground: 0 0% 55%;
  --border: 0 0% 20%;
  --surface: 0 0% 12%;
  --muted: 0 0% 15%;
  --background: 0 0% 8%;
}
```

### Typography Scale

```css
/* Base font: Inter */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

/* Hierarchy */
.text-display {
  font-size: 2rem;       /* 32px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.text-heading {
  font-size: 1.5rem;     /* 24px */
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.text-subheading {
  font-size: 1.125rem;   /* 18px */
  font-weight: 600;
  line-height: 1.4;
}

.text-body {
  font-size: 1rem;       /* 16px */
  font-weight: 400;
  line-height: 1.6;
}

.text-caption {
  font-size: 0.875rem;   /* 14px */
  font-weight: 400;
  line-height: 1.5;
}

.text-small {
  font-size: 0.75rem;    /* 12px */
  font-weight: 400;
  line-height: 1.4;
}
```

### Spacing Scale

```css
/* Use Tailwind's spacing scale (multiples of 4px) */
gap-1:  4px
gap-2:  8px
gap-3:  12px
gap-4:  16px   /* Most common */
gap-6:  24px   /* Card padding */
gap-8:  32px   /* Section margins */
gap-12: 48px
gap-16: 64px
```

### Shadow Scale

```css
/* Elevation system */
.shadow-sm {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.shadow-md {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1),
              0 2px 4px rgba(0, 0, 0, 0.06);
}

.shadow-lg {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1),
              0 4px 8px rgba(0, 0, 0, 0.06);
}

.shadow-xl {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15),
              0 8px 16px rgba(0, 0, 0, 0.1);
}
```

### Border Radius

```css
/* Consistent rounding */
rounded-md:  6px    /* Small elements (buttons, inputs) */
rounded-lg:  8px    /* Cards, containers */
rounded-xl:  12px   /* Large cards */
rounded-2xl: 16px   /* Modals, special containers */
rounded-full: 9999px /* Pills, avatars */
```

---

## Component-Specific Patterns

### Buttons

```tsx
// Primary - Brand color, highest emphasis
<Button variant="primary" size="lg">
  <Save size={18} />
  Guardar Historia
</Button>

// Secondary - Neutral, medium emphasis
<Button variant="secondary" size="md">
  <FileDown size={16} />
  Exportar
</Button>

// Ghost - Transparent, lowest emphasis
<Button variant="ghost" size="sm">
  <X size={14} />
  Cancelar
</Button>

// Danger - Red, destructive actions
<Button variant="danger" size="sm">
  <Trash2 size={14} />
  Eliminar
</Button>
```

### Badges

```tsx
// Neutral - default for status
<Badge variant="neutral">Borrador</Badge>

// Brand - primary status
<Badge variant="brand">Activo</Badge>

// Success - positive feedback
<Badge variant="success">Guardado</Badge>

// Danger - errors, alerts
<Badge variant="danger">Pendiente</Badge>
```

### Cards

```tsx
// Standard card
<div className="card p-6">
  {/* content */}
</div>

// Interactive card (clickable)
<div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
  {/* content */}
</div>

// Highlighted card
<div className="card p-6 border-2 border-[hsl(var(--brand))]">
  {/* content */}
</div>
```

---

## Accessibility Guidelines

### Focus States

```css
/* Visible focus ring for keyboard navigation */
.focus-visible:focus-visible {
  outline: 2px solid hsl(var(--brand));
  outline-offset: 2px;
}
```

### ARIA Labels

```tsx
// All interactive elements need labels
<button
  aria-label="Cerrar modal"
  title="Cerrar"
  onClick={handleClose}
>
  <X size={16} />
</button>

// Screen reader text
<span className="sr-only">
  Cargar paciente
</span>
```

### Color Contrast

```css
/* Ensure WCAG AA compliance (4.5:1 for normal text) */
/* Check with: https://webaim.org/resources/contrastchecker/ */

/* Good examples: */
--foreground: hsl(0, 0%, 10%);     /* #1A1A1A on white = 15.3:1 ✓ */
--muted-foreground: hsl(0, 0%, 45%); /* #737373 on white = 4.6:1 ✓ */

/* Bad example: */
--light-gray: hsl(0, 0%, 75%);     /* #BFBFBF on white = 2.3:1 ✗ */
```

---

## Testing Checklist

### Visual Regression Testing

- [ ] Compare before/after screenshots
- [ ] Test on multiple screen sizes (mobile, tablet, desktop)
- [ ] Test in light and dark mode
- [ ] Verify color contrast ratios

### Functional Testing

- [ ] All keyboard shortcuts still work
- [ ] MacOSDock buttons trigger correct actions
- [ ] Odontogram popover opens/closes properly
- [ ] Sessions list scrolls smoothly
- [ ] Forms validate correctly

### User Acceptance Testing

- [ ] Show to 3 dentists for feedback
- [ ] Time common workflows (before vs after)
- [ ] Ask: "Is this easier or harder?"
- [ ] Iterate based on feedback

---

## Rollback Procedures

### Git Strategy

```bash
# Create feature branch for each priority
git checkout -b feature/c1-remove-redundant-actions
# Make changes
git commit -m "C1: Remove redundant action buttons"
git push origin feature/c1-remove-redundant-actions

# If needs rollback:
git revert <commit-hash>
```

### Feature Flags

```typescript
// .env
VITE_NEW_UI_COLORS = "true"
VITE_NEW_ODONTOGRAM = "true"

// In code
const useNewColors = import.meta.env.VITE_NEW_UI_COLORS === "true";

{useNewColors ? (
  <Badge variant="neutral">Status</Badge>
) : (
  <Badge variant="info">Status</Badge>
)}
```

---

## Next Steps

1. **Review this guide with team**
2. **Start with Quick Wins** (< 1 hour each)
3. **Implement C1-C4** in order (week 1-2)
4. **Test with users** after each critical change
5. **Iterate based on feedback**
6. **Move to H1-H4** (week 3-4)

**Questions? Issues?**
Document in `docs/UX_IMPROVEMENT_ISSUES.md` as you implement.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-19
**Next Review:** After C1-C4 implementation
