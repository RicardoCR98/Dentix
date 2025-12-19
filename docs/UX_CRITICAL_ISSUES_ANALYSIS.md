# Critical UX Issues Analysis - Oklus Dental App

**Date**: 2025-12-19
**Priority**: CRITICAL - Affects core usability
**Status**: Analysis Complete, Solutions Proposed

---

## Executive Summary

Three critical UX issues have been identified through user testing:

1. **MacOSDock Visual Issues** (Severity: MEDIUM)
   - All buttons are neutral gray with no visual differentiation
   - Dock appears visually descentered

2. **Odontogram Visual Feedback** (Severity: HIGH)
   - No clear indication of which tooth is selected/active
   - Teeth with diagnoses lack prominent visual differentiation
   - Difficult to see odontogram state at a glance

3. **CONCEPTUAL ARCHITECTURE ISSUE** (Severity: CRITICAL)
   - Odontogram can be modified WITHOUT creating a session
   - No clear UX feedback showing which session the odontogram belongs to
   - Confusion between "global odontogram" vs "per-session odontogram"

---

## PART 1: IMMEDIATE FIXES (MacOSDock & Odontogram Visual)

### Issue 1.1: MacOSDock Color Monotony

**Current State:**
```typescript
// All buttons use variant="neutral" (gray)
<MacOSDockButton variant="neutral" ... /> // All 5 buttons
```

**Problem:**
- Recent C2 simplification made ALL buttons neutral
- No visual hierarchy or action importance
- Hard to quickly identify primary actions

**Root Cause:**
Lines 140, 153, 166, 194 in `MacOSDock.tsx` all use `variant="neutral"`.

**Solution: Subtle Semantic Coloring**

Apply color psychology while maintaining macOS aesthetic:

```typescript
// NUEVA HISTORIA - Neutral (creation is neutral)
variant="neutral"

// BUSQUEDA - Neutral (navigation is neutral)
variant="neutral"

// IMPRIMIR - Neutral (utility action)
variant="neutral"

// GUARDAR - Dynamic based on state (already implemented)
variant={getSaveVariant()} // brand/neutral/danger

// CARTERA - Brand (financial focus deserves emphasis)
variant="brand"
```

**Color Palette:**
- **Neutral**: `hsl(var(--muted-foreground) / 0.8)` - Gray (70% of buttons)
- **Brand**: `hsl(var(--brand))` - Teal/Blue (Save when dirty, Cartera)
- **Danger**: `hsl(var(--danger))` - Red (Save on error)

**Rationale:**
- Save button already has good logic (lines 95-108)
- Cartera (pending payments) is financially important - deserves brand color
- Other buttons stay neutral to avoid "rainbow effect"

**Code Changes:**
File: `D:\Github\odonto\src\components\MacOSDock.tsx`

```typescript
// Line 194 - CHANGE THIS:
<MacOSDockButton
  icon={Wallet}
  label="Cartera de Pendientes"
  shortcut=""
  variant="neutral" // ❌ CHANGE TO "brand"
  onClick={onPendingPayments}
  disabled={buttonsDisabled}
  magnification={getMagnification(4)}
  onHover={() => setHoveredIndex(4)}
  onLeave={() => setHoveredIndex(null)}
/>

// Line 194 - TO THIS:
<MacOSDockButton
  icon={Wallet}
  label="Cartera de Pendientes"
  shortcut=""
  variant="brand" // ✅ Brand color for financial emphasis
  onClick={onPendingPayments}
  disabled={buttonsDisabled}
  magnification={getMagnification(4)}
  onHover={() => setHoveredIndex(4)}
  onLeave={() => setHoveredIndex(null)}
/>
```

**Expected Result:**
- 3 neutral buttons (New, Search, Print)
- 1 dynamic button (Save - changes color based on state)
- 1 brand button (Cartera - financial focus)

---

### Issue 1.2: MacOSDock Centering

**Current State:**
```css
className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50"
```

**Problem:**
User reports dock appears "descentrado" (off-center).

**Hypothesis:**
- Likely a browser zoom issue OR
- Transform not accounting for button magnification OR
- Container width calculation issue

**Diagnostic Steps:**

1. Check if magnification affects centering:
   - When buttons scale (1.0 to 1.25x), container width changes
   - Container uses `flex gap-3` - gaps don't scale
   - May cause visual shift

2. Check container background width:
   - Line 127: `flex items-center gap-3 px-6 py-3`
   - Background is glass-morphism with border-radius
   - May appear offset due to asymmetric padding

**Solution Options:**

**Option A: Force exact centering with absolute positioning**
```typescript
<div
  className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-[400ms]"
  style={{
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    pointerEvents: visible ? "auto" : "none",
  }}
>
  <div className="flex items-center gap-3 px-6 py-3 rounded-[24px] border border-white/30 shadow-2xl mb-6"
    style={{
      background: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(50px) saturate(200%)",
      ...
    }}
  >
    {/* buttons */}
  </div>
</div>
```

**Option B: Add debug guide (temporary)**
```typescript
// Add this AFTER the dock container (for testing only)
<div className="fixed bottom-0 left-1/2 w-px h-20 bg-red-500 -translate-x-1/2 pointer-events-none"
     style={{ opacity: 0.5 }} />
```

This creates a red vertical line at true center - if dock is off, it will be visible.

**Recommendation:**
1. Deploy Option B (debug guide) first to confirm issue
2. If confirmed, implement Option A (forced centering)

---

### Issue 2: Odontogram Visual Feedback

**Current State:**
```typescript
// Tooth button (lines 251-288)
<button
  className={cn(
    "relative h-16 rounded-lg text-center border-2 transition-all",
    hasDiagnoses
      ? "border-[hsl(var(--brand))] bg-[color-mix(in_oklab,hsl(var(--brand))_15%,transparent)]"
      : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
  )}
>
  <span className={hasDiagnoses ? "text-[hsl(var(--brand))]" : "text-[hsl(var(--foreground))]"}>
    {toothNum}
  </span>
  {hasDiagnoses && (
    <div className="flex gap-0.5">
      {diagnoses.slice(0, 3).map((_, i) => (
        <div key={i} className="w-1 h-1 rounded-full bg-[hsl(var(--brand))]" />
      ))}
    </div>
  )}
</button>
```

**Problems:**
1. **Weak border differentiation**: `border-2` with brand color is too subtle
2. **Low contrast background**: `15% opacity` brand color barely visible
3. **Tiny indicator dots**: `w-1 h-1` dots are too small
4. **No animation**: Static state doesn't catch eye

**Solution: Multi-Layer Visual Hierarchy**

**Layer 1: Border Enhancement**
```typescript
className={cn(
  "relative h-16 rounded-lg text-center transition-all",
  hasDiagnoses
    ? "border-[3px] border-[hsl(var(--brand))] shadow-md shadow-[hsl(var(--brand))/0.3]"
    : "border-2 border-[hsl(var(--border))]"
)}
```

**Layer 2: Background Contrast**
```typescript
hasDiagnoses
  ? "bg-[color-mix(in_oklab,hsl(var(--brand))_25%,transparent)]" // 15% → 25%
  : "bg-[hsl(var(--surface))]"
```

**Layer 3: Badge Instead of Dots**
```typescript
{hasDiagnoses && (
  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[hsl(var(--brand))] text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse-subtle">
    {diagnoses.length}
  </div>
)}
```

**Layer 4: Hover Animation**
```typescript
className={cn(
  "relative h-16 rounded-lg text-center transition-all",
  "hover:scale-110 hover:shadow-xl", // Existing
  hasDiagnoses
    ? "hover:border-[hsl(var(--brand))] hover:shadow-[hsl(var(--brand))/0.5]"
    : "hover:border-[hsl(var(--brand))]"
)}
```

**Complete Updated Code:**

File: `D:\Github\odonto\src\components\Odontogram.tsx`

```typescript
// Lines 251-288 - REPLACE WITH:
<button
  type="button"
  className={cn(
    "relative h-16 rounded-lg text-center transition-all duration-200",
    "flex flex-col items-center justify-center gap-1",
    "hover:scale-110 hover:shadow-xl cursor-pointer",
    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:ring-offset-2",
    hasDiagnoses
      ? [
          "border-[3px] border-[hsl(var(--brand))]",
          "bg-[color-mix(in_oklab,hsl(var(--brand))_25%,transparent)]",
          "shadow-md shadow-[hsl(var(--brand))/0.3]",
          "font-semibold",
        ]
      : [
          "border-2 border-[hsl(var(--border))]",
          "bg-[hsl(var(--surface))]",
          "hover:border-[hsl(var(--brand))]",
        ],
  )}
  title={
    hasDiagnoses
      ? `Diente ${toothNum}: ${diagnoses.join(", ")}`
      : `Diente ${toothNum}`
  }
>
  <span
    className={cn(
      "text-base font-bold leading-none",
      hasDiagnoses
        ? "text-[hsl(var(--brand))]"
        : "text-[hsl(var(--foreground))]",
    )}
  >
    {toothNum}
  </span>

  {/* BADGE: Replace dots with count badge */}
  {hasDiagnoses && (
    <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-[hsl(var(--brand))] text-white text-xs font-bold flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse-subtle">
      {diagnoses.length}
    </div>
  )}
</button>
```

**Visual Impact:**
- **Before**: Subtle blue tint, 1px dots
- **After**:
  - Thicker border (3px vs 2px)
  - Stronger background (25% vs 15%)
  - Prominent badge with count (24px circle)
  - Shadow glow effect
  - Subtle pulse animation

---

## PART 2: CRITICAL CONCEPTUAL ISSUE - Odontogram Session Binding

### Problem Statement

**Current Architecture:**
```
patients
  ├── visits
  │     ├── sessions (financial records)
  │     │     └── session_items
  │     └── tooth_dx_json (odontogram as JSON)
```

**The Issue:**
- `tooth_dx_json` lives in **visits** table (per-visit)
- Sessions are **children** of visits
- But UX treats odontogram as if it's "global" or "per-session"

**Real-World Confusion Scenario:**

1. User opens patient record
2. User modifies odontogram (adds "Caries" to tooth 11)
3. User does NOT create a session
4. User clicks "Guardar"
5. **What happens?**
   - Odontogram is saved to `visits.tooth_dx_json`
   - But no session exists
   - No procedural or financial record
   - Diagnosis "floats" without context

**The Fundamental Question:**
> Is the odontogram a **snapshot per session** or a **cumulative patient record**?

### Current Implementation Analysis

From `usePatientRecord.ts`:

```typescript
// Lines 44-47: NEW per-session odontogram state
const [sessionOdontograms, setSessionOdontograms] = useState<Map<number, ToothDx>>(new Map());
const [currentToothDx, setCurrentToothDx] = useState<ToothDx>({});
const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
```

**Discovery:** Code ALREADY implements per-session odontograms!

- `sessionOdontograms` is a `Map<sessionId, ToothDx>`
- Each session has its own odontogram snapshot
- `activeSessionId` tracks which session is being edited

**But the UX doesn't communicate this!**

Users don't see:
- Which session is currently active
- That modifying odontogram affects active session only
- Visual binding between odontogram and sessions

---

### Solution Comparison

#### Option A: Odontogram per Session (Already Implemented - Just Fix UX)

**Status:** Code architecture ALREADY supports this (lines 44-47, 122-134, 516-531)

**What's Missing:** Visual/UX clarity

**Required Changes:**

1. **Session Context Bar** (NEW component)
   - Shows which session is active
   - Displays: "Editando Sesión #3 - 2025-12-15"
   - Color-coded: Green (saved), Orange (draft)

2. **Odontogram Header Enhancement**
   - Add "Odontograma de Sesión Activa" badge
   - Show session date and number
   - Warning if no session is active

3. **Auto-create Session on Odontogram Change**
   - If no session exists, create draft session automatically
   - Show toast: "Se creó una nueva sesión para este diagnóstico"

4. **Session Switcher in Odontogram Section**
   - Dropdown to switch between sessions
   - Preview odontograms from past sessions (read-only)

**Implementation Steps:**

**Step 1: Create SessionContextBar Component**

File: `D:\Github\odonto\src\components\sessions\SessionContextBar.tsx`

```typescript
import { Badge } from "../ui/Badge";
import { Calendar, FileText, AlertCircle } from "lucide-react";
import type { Session } from "../../lib/types";

interface SessionContextBarProps {
  activeSession: Session | null;
  sessionNumber?: number;
  totalSessions: number;
  onSwitchSession?: () => void;
}

export function SessionContextBar({
  activeSession,
  sessionNumber,
  totalSessions,
  onSwitchSession
}: SessionContextBarProps) {
  if (!activeSession) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-[hsl(var(--warning))] bg-[hsl(var(--warning))/0.1]">
        <AlertCircle size={20} className="text-[hsl(var(--warning))]" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-[hsl(var(--warning))]">
            Sin sesión activa
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            Los cambios en el odontograma crearán una nueva sesión automáticamente
          </div>
        </div>
      </div>
    );
  }

  const isSaved = activeSession.is_saved;
  const badgeVariant = isSaved ? "success" : "warning";
  const badgeText = isSaved ? "Guardada" : "Borrador";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[hsl(var(--brand))] bg-[hsl(var(--brand))/0.05]">
      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold">
        {sessionNumber || "?"}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            Sesión Activa: #{activeSession.id}
          </span>
          <Badge variant={badgeVariant} className="text-xs">
            {badgeText}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {activeSession.date}
          </div>
          <div className="flex items-center gap-1">
            <FileText size={12} />
            {activeSession.reason_type || "Sin motivo"}
          </div>
        </div>
      </div>

      {totalSessions > 1 && onSwitchSession && (
        <button
          onClick={onSwitchSession}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-[hsl(var(--muted))] hover:bg-[hsl(var(--brand))] hover:text-white transition-colors"
        >
          Cambiar sesión ({totalSessions})
        </button>
      )}
    </div>
  );
}
```

**Step 2: Integrate SessionContextBar into Odontogram Section**

File: `D:\Github\odonto\src\components\OdontogramDiagnosisSection.tsx`

Add after imports:
```typescript
import { SessionContextBar } from "./sessions/SessionContextBar";
```

Find where `<Section>` with Odontogram starts and add:

```typescript
<Section
  title="Odontograma y Diagnóstico"
  icon={<Activity size={20} />}
>
  {/* ADD THIS - Session Context Bar */}
  <SessionContextBar
    activeSession={session}
    sessionNumber={activeSessionId ?
      sessions.findIndex(s => s.session.id === activeSessionId) + 1
      : undefined
    }
    totalSessions={sessions.length}
  />

  {/* Existing odontogram code */}
  <Odontogram ... />
</Section>
```

**Step 3: Auto-create Session on First Odontogram Change**

File: `D:\Github\odonto\src\hooks\usePatientRecord.ts`

Update `onToothDxChange` (lines 122-134):

```typescript
const onToothDxChange = useCallback((next: ToothDx) => {
  // Auto-create session if none exists
  if (!activeSessionId) {
    console.warn('No active session - creating draft session for odontogram change');

    // Create new draft session
    const newSessionId = -Date.now();
    const today = new Date().toISOString().slice(0, 10);

    const newSession: Session = {
      id: newSessionId,
      date: today,
      reason_type: "Control",
      reason_detail: "Actualización de diagnóstico",
      budget: 0,
      discount: 0,
      payment: 0,
      balance: 0,
      cumulative_balance: 0,
      is_saved: false,
    };

    // Add to sessions list
    setSessions(prev => [{
      session: newSession,
      items: [],
    }, ...prev]);

    setActiveSessionId(newSessionId);

    // Show toast
    toast.info(
      "Nueva sesión creada",
      "Se creó una sesión automáticamente para este diagnóstico"
    );
  }

  setSessionOdontograms(prev => {
    const updated = new Map(prev);
    updated.set(activeSessionId!, next);
    return updated;
  });
  setCurrentToothDx(next);
}, [activeSessionId, setSessions, toast]);
```

**Step 4: Session Switcher Dialog**

File: `D:\Github\odonto\src\components\SessionSwitcherDialog.tsx` (NEW)

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import type { VisitWithProcedures } from "../lib/types";
import { Calendar, DollarSign } from "lucide-react";

interface SessionSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: VisitWithProcedures[];
  activeSessionId: number | null;
  onSelectSession: (sessionId: number) => void;
}

export function SessionSwitcherDialog({
  open,
  onOpenChange,
  sessions,
  activeSessionId,
  onSelectSession,
}: SessionSwitcherDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar Sesión Activa</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {sessions.map((s, idx) => {
            const isActive = s.session.id === activeSessionId;
            const isSaved = s.session.is_saved;

            return (
              <button
                key={s.session.id}
                onClick={() => {
                  onSelectSession(s.session.id!);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  isActive
                    ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))/0.1]"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--brand))]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand))] text-white font-bold flex items-center justify-center">
                    {sessions.length - idx}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Sesión #{s.session.id}
                      </span>
                      <Badge variant={isSaved ? "success" : "warning"}>
                        {isSaved ? "Guardada" : "Borrador"}
                      </Badge>
                      {isActive && (
                        <Badge variant="info">Activa</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {s.session.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} />
                        ${s.session.balance.toFixed(2)} saldo
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Pros:**
- Leverages existing architecture (no DB changes)
- Clear UX binding between odontogram and session
- Prevents "orphan" odontograms
- Historical accuracy maintained

**Cons:**
- Requires auto-session creation (may confuse users initially)
- More components to maintain

---

#### Option B: Global Odontogram with Session Snapshots

**Concept:**
- Maintain ONE "current odontogram" per patient
- When saving a session, create a snapshot of current odontogram
- Sessions preserve their own odontogram at time of save

**Changes Required:**

1. Add `current_odontogram_json` to `patients` table
2. Keep `tooth_dx_json` in sessions for historical snapshots
3. Odontogram UI edits `patients.current_odontogram_json`
4. On session save, copy current to session

**Migration:**
```sql
ALTER TABLE patients ADD COLUMN current_odontogram_json TEXT;
```

**Pros:**
- Simpler mental model (one "current" odontogram)
- Sessions automatically capture state at save time
- No session required to edit odontogram

**Cons:**
- Requires database migration
- More complex save logic (dual writes)
- Loses granular per-session editing

---

#### Option C: Mandatory Session for Odontogram Changes

**Concept:**
- Odontogram is LOCKED unless a session is active
- Force user to create session before editing
- Visual banner: "Crea una sesión para modificar el odontograma"

**Implementation:**
```typescript
// In Odontogram.tsx
const isLocked = !activeSessionId;

<Odontogram
  readOnly={isLocked}
  value={toothDx}
  onChange={onToothDxChange}
/>

{isLocked && (
  <Alert variant="warning">
    Debes crear una sesión para modificar el odontograma.
    <Button onClick={onCreateSession}>Crear Sesión</Button>
  </Alert>
)}
```

**Pros:**
- Enforces data integrity
- Clear cause-effect relationship
- No "orphan" diagnoses

**Cons:**
- Friction in workflow
- May annoy users who just want to update diagnosis
- Inflexible (what if user just wants to correct typo?)

---

### RECOMMENDED SOLUTION: Option A (Enhanced)

**Why Option A is Best:**

1. **Architecture Already Exists** - Code supports per-session odontograms
2. **No Database Changes** - Faster to implement
3. **Flexible Workflow** - Auto-create session removes friction
4. **Historical Accuracy** - Each session preserves exact odontogram state
5. **Clear UX** - SessionContextBar makes relationship explicit

**Implementation Priority:**

**Phase 1 (Immediate - 2-3 hours):**
1. Create `SessionContextBar` component
2. Add to `OdontogramDiagnosisSection`
3. Test session visibility

**Phase 2 (Next Day - 3-4 hours):**
1. Implement auto-session creation in `onToothDxChange`
2. Add toast notifications
3. Test workflow: odontogram change → auto-session → save

**Phase 3 (Optional - 2 hours):**
1. Create `SessionSwitcherDialog`
2. Add "Cambiar sesión" button to context bar
3. Test session switching with odontogram preview

---

## PART 3: PRIORITIZATION & RISK ASSESSMENT

### Priority Matrix

| Issue | Severity | User Impact | Effort | Priority |
|-------|----------|-------------|--------|----------|
| Odontogram Visual Feedback | HIGH | HIGH | LOW | **P0 - Critical** |
| MacOSDock Colors | MEDIUM | MEDIUM | LOW | **P1 - High** |
| Session Context Bar | CRITICAL | CRITICAL | MEDIUM | **P0 - Critical** |
| Auto-Session Creation | HIGH | HIGH | MEDIUM | **P1 - High** |
| MacOSDock Centering | LOW | LOW | LOW | P2 - Medium |
| Session Switcher Dialog | MEDIUM | MEDIUM | HIGH | P3 - Low |

### Implementation Roadmap

**Week 1 (This Week):**

**Day 1 (Today):**
- [ ] Fix odontogram visual feedback (border, badge, shadow)
- [ ] Change MacOSDock Cartera button to brand color
- [ ] Deploy and test

**Day 2:**
- [ ] Create SessionContextBar component
- [ ] Integrate into OdontogramDiagnosisSection
- [ ] Test visibility and styling

**Day 3:**
- [ ] Implement auto-session creation
- [ ] Add toast notifications
- [ ] Test complete workflow

**Week 2:**
- [ ] Session switcher dialog (if needed)
- [ ] MacOSDock centering fix (if confirmed)
- [ ] User acceptance testing

---

## Risk Assessment

### Risk 1: Auto-Session Creation Confusion

**Risk:** Users may not understand why sessions appear automatically

**Mitigation:**
- Clear toast message: "Se creó una nueva sesión para este diagnóstico"
- SessionContextBar shows "Borrador" badge prominently
- Onboarding tooltip on first use

**Likelihood:** MEDIUM
**Impact:** LOW
**Overall Risk:** LOW

---

### Risk 2: Breaking Existing Data

**Risk:** Changes to odontogram logic may break existing patient records

**Mitigation:**
- Code ALREADY supports per-session odontograms (lines 516-531)
- Only adding UX layer, not changing data model
- Existing `tooth_dx_json` in sessions preserved

**Likelihood:** LOW
**Impact:** CRITICAL
**Overall Risk:** MEDIUM

**Testing Checklist:**
- [ ] Load patient with existing sessions
- [ ] Verify odontograms display correctly
- [ ] Switch between sessions
- [ ] Create new session
- [ ] Save and reload

---

### Risk 3: Performance with Many Sessions

**Risk:** Map-based odontogram storage may slow down with 100+ sessions

**Mitigation:**
- Current implementation uses `Map<number, ToothDx>` (fast O(1) lookup)
- Only active session's odontogram is rendered
- Lazy loading for session switcher

**Likelihood:** LOW
**Impact:** MEDIUM
**Overall Risk:** LOW

---

## Testing Checklist

### Visual Tests (MacOSDock & Odontogram)

- [ ] MacOSDock: Verify Cartera button shows brand color
- [ ] MacOSDock: Verify Save button changes color (neutral/brand/danger)
- [ ] MacOSDock: Test centering on different screen sizes (1920x1080, 1366x768)
- [ ] Odontogram: Tooth with diagnosis shows thicker border
- [ ] Odontogram: Tooth with diagnosis shows count badge
- [ ] Odontogram: Badge shows correct count (1, 2, 3+)
- [ ] Odontogram: Hover animation works smoothly

### Session Context Tests

- [ ] No session: Context bar shows warning "Sin sesión activa"
- [ ] Draft session: Context bar shows orange "Borrador" badge
- [ ] Saved session: Context bar shows green "Guardada" badge
- [ ] Context bar displays correct session number
- [ ] Context bar displays correct date

### Auto-Session Creation Tests

- [ ] Open patient with no sessions
- [ ] Modify odontogram (add diagnosis to tooth)
- [ ] Verify new session created automatically
- [ ] Verify toast notification appears
- [ ] Verify session appears in sessions table as draft
- [ ] Save session successfully
- [ ] Reload patient and verify odontogram preserved

### Session Switching Tests (if implemented)

- [ ] Open patient with 3+ sessions
- [ ] Click "Cambiar sesión" button
- [ ] Dialog shows all sessions
- [ ] Select different session
- [ ] Verify odontogram updates to match selected session
- [ ] Verify context bar updates

---

## Success Metrics

### Before (Current State)

- Users report: "No sé qué diente está seleccionado"
- Users report: "Los botones del dock son todos iguales"
- Users report: "No sé si estoy editando una sesión o creando una nueva"
- Odontogram changes can exist without sessions (data integrity issue)

### After (Target State)

- Teeth with diagnoses are immediately visible (3px border, badge, shadow)
- MacOSDock has visual hierarchy (neutral, brand, dynamic colors)
- SessionContextBar clearly shows active session
- All odontogram changes are bound to a session (data integrity guaranteed)
- Users can switch between session odontograms

### KPIs

- **Task Completion Time:** Add diagnosis to tooth - reduce from 15s to 5s
- **Error Rate:** Users saving without session - reduce to 0%
- **User Satisfaction:** NPS score on odontogram usability - target 8+/10

---

## Appendix: Code File Summary

### Files to Modify

1. **D:\Github\odonto\src\components\MacOSDock.tsx**
   - Line 194: Change Cartera button variant to "brand"
   - Optional: Fix centering logic

2. **D:\Github\odonto\src\components\Odontogram.tsx**
   - Lines 251-288: Enhance tooth button visual feedback
   - Add badge instead of dots
   - Strengthen border and background

3. **D:\Github\odonto\src\hooks\usePatientRecord.ts**
   - Lines 122-134: Add auto-session creation to `onToothDxChange`

### Files to Create

1. **D:\Github\odonto\src\components\sessions\SessionContextBar.tsx** (NEW)
   - Session status display
   - Active session indicator
   - Session switcher button

2. **D:\Github\odonto\src\components\SessionSwitcherDialog.tsx** (NEW - Optional)
   - Session selection interface
   - Odontogram preview per session

### Files to Update (Integration)

1. **D:\Github\odonto\src\components\OdontogramDiagnosisSection.tsx**
   - Add SessionContextBar
   - Pass session props

2. **D:\Github\odonto\src\pages\PatientsPageUnified.tsx**
   - Pass activeSessionId to odontogram section
   - Wire session switcher handlers

---

## Conclusion

The critical issues stem from a disconnect between the **data architecture** (which correctly implements per-session odontograms) and the **UX layer** (which doesn't communicate this relationship).

**Key Insight:** The code is RIGHT, the UX is WRONG.

**Solution:** Add visual clarity layers (SessionContextBar, enhanced odontogram feedback, auto-session creation) to align UX with existing architecture.

**Estimated Total Effort:** 8-12 hours development + 4 hours testing = **2 working days**

**Recommended Start:** Immediately - these are blocking usability issues.

---

**Document prepared by:** Claude (Sonnet 4.5)
**Review status:** Ready for implementation
**Next steps:** Review with team, prioritize fixes, begin Phase 1
