# UX Critical Issues - Implementation Guide

**Date**: 2025-12-19
**Related Doc**: `UX_CRITICAL_ISSUES_ANALYSIS.md`
**Status**: Ready for implementation

---

## Quick Summary

This guide provides the exact code changes needed to fix the three critical UX issues:

1. MacOSDock visual differentiation
2. Odontogram visual feedback
3. Session context clarity

---

## FIX 1: MacOSDock - Add Visual Differentiation

### File: `src/components/MacOSDock.tsx`

**Change Line 194:**

```typescript
// BEFORE (Line 194):
<MacOSDockButton
  icon={Wallet}
  label="Cartera de Pendientes"
  shortcut=""
  variant="neutral"  // ❌ All gray
  onClick={onPendingPayments}
  disabled={buttonsDisabled}
  magnification={getMagnification(4)}
  onHover={() => setHoveredIndex(4)}
  onLeave={() => setHoveredIndex(null)}
/>

// AFTER:
<MacOSDockButton
  icon={Wallet}
  label="Cartera de Pendientes"
  shortcut=""
  variant="brand"  // ✅ Brand color for financial focus
  onClick={onPendingPayments}
  disabled={buttonsDisabled}
  magnification={getMagnification(4)}
  onHover={() => setHoveredIndex(4)}
  onLeave={() => setHoveredIndex(null)}
/>
```

**Expected Result:**
- Nueva Historia: Gray
- Búsqueda: Gray
- Imprimir: Gray
- Guardar: Dynamic (brand when changes, neutral when clean)
- Cartera: Brand (teal/blue)

---

## FIX 2: Odontogram - Enhance Visual Feedback

### File: `src/components/Odontogram.tsx`

**Replace Lines 251-288:**

```typescript
// COMPLETE REPLACEMENT - Lines 251-288
<Popover.Trigger asChild>
  <button
    type="button"
    className={cn(
      "relative h-16 rounded-lg text-center transition-all duration-200",
      "flex flex-col items-center justify-center gap-1",
      "hover:scale-110 hover:shadow-xl cursor-pointer",
      "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:ring-offset-2",
      hasDiagnoses
        ? [
            "border-[3px] border-[hsl(var(--brand))]", // ✅ Thicker border
            "bg-[color-mix(in_oklab,hsl(var(--brand))_25%,transparent)]", // ✅ Stronger background
            "shadow-md shadow-[hsl(var(--brand))/0.3]", // ✅ Glow effect
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
    {/* Tooth Number */}
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

    {/* DIAGNOSIS COUNT BADGE - Replaces dots */}
    {hasDiagnoses && (
      <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-[hsl(var(--brand))] text-white text-xs font-bold flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse-subtle">
        {diagnoses.length}
      </div>
    )}
  </button>
</Popover.Trigger>
```

**Key Changes:**
- Border: `2px` → `3px` with brand color
- Background opacity: `15%` → `25%`
- Added shadow glow effect
- Badge instead of tiny dots (24px circle with count)
- Badge has white ring for contrast
- Subtle pulse animation on badge

**Expected Result:**
- Teeth with diagnoses are MUCH more visible
- Count badge shows "1", "2", "3", etc.
- Clear visual hierarchy

---

## FIX 3A: Create SessionContextBar Component (NEW FILE)

### File: `src/components/sessions/SessionContextBar.tsx` (CREATE NEW)

```typescript
// src/components/sessions/SessionContextBar.tsx
import { Badge } from "../ui/Badge";
import { Calendar, FileText, AlertCircle } from "lucide-react";
import type { Session } from "../../lib/types";

interface SessionContextBarProps {
  activeSession: Session | null;
  sessionNumber?: number;
  totalSessions: number;
  onSwitchSession?: () => void;
}

/**
 * SessionContextBar - Visual indicator showing which session is currently active
 *
 * Purpose: Solves the UX problem where users don't know which session they're editing
 * when modifying the odontogram. This component creates clear visual binding between
 * the odontogram and the active session.
 */
export function SessionContextBar({
  activeSession,
  sessionNumber,
  totalSessions,
  onSwitchSession
}: SessionContextBarProps) {
  // No active session - Show warning
  if (!activeSession) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-[hsl(var(--warning))] bg-[hsl(var(--warning))/0.1] mb-4">
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

  // Active session exists
  const isSaved = activeSession.is_saved;
  const badgeVariant = isSaved ? "success" : "warning";
  const badgeText = isSaved ? "Guardada" : "Borrador";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[hsl(var(--brand))] bg-[hsl(var(--brand))/0.05] mb-4">
      {/* Session Number Badge */}
      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold shrink-0">
        {sessionNumber || "?"}
      </div>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">
            Sesión Activa: #{activeSession.id}
          </span>
          <Badge variant={badgeVariant} className="text-xs">
            {badgeText}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {activeSession.date}
          </div>
          {activeSession.reason_type && (
            <div className="flex items-center gap-1">
              <FileText size={12} />
              {activeSession.reason_type}
            </div>
          )}
        </div>
      </div>

      {/* Session Switcher Button (optional) */}
      {totalSessions > 1 && onSwitchSession && (
        <button
          onClick={onSwitchSession}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-[hsl(var(--muted))] hover:bg-[hsl(var(--brand))] hover:text-white transition-colors shrink-0"
          title="Ver y cambiar entre sesiones"
        >
          Cambiar sesión ({totalSessions})
        </button>
      )}
    </div>
  );
}
```

---

## FIX 3B: Integrate SessionContextBar into Odontogram Section

### File: `src/components/OdontogramDiagnosisSection.tsx`

**Step 1: Add import at top:**

```typescript
import { SessionContextBar } from "./sessions/SessionContextBar";
```

**Step 2: Add props to component interface:**

Find the interface and add:

```typescript
interface OdontogramDiagnosisSectionProps {
  // ... existing props ...

  // NEW: Session context props
  activeSession?: Session | null;
  activeSessionId?: number | null;
  sessions?: VisitWithProcedures[];
}
```

**Step 3: Add SessionContextBar before Odontogram:**

Find where `<Odontogram>` is rendered and add BEFORE it:

```typescript
export default function OdontogramDiagnosisSection({
  toothDx,
  onToothDxChange,
  diagnosisFromTeeth,
  manualDiagnosis,
  onManualDiagnosisChange,
  readOnly,
  // NEW props
  activeSession,
  activeSessionId,
  sessions = [],
}: OdontogramDiagnosisSectionProps) {
  // Calculate session number
  const sessionNumber = activeSessionId
    ? sessions.findIndex(s => s.session.id === activeSessionId) + 1
    : undefined;

  return (
    <Section
      title="Odontograma y Diagnóstico"
      icon={<Activity size={20} />}
    >
      {/* NEW: Session Context Bar */}
      <SessionContextBar
        activeSession={activeSession || null}
        sessionNumber={sessionNumber}
        totalSessions={sessions.length}
      />

      {/* Existing Odontogram */}
      <Odontogram
        value={toothDx}
        onChange={onToothDxChange}
        readOnly={readOnly}
      />

      {/* Rest of component ... */}
    </Section>
  );
}
```

---

## FIX 3C: Pass Session Props from PatientsPageUnified

### File: `src/pages/PatientsPageUnified.tsx`

**Find where OdontogramDiagnosisSection is rendered (appears twice - vertical and tabs layouts):**

**Update Line ~343 (Vertical Layout):**

```typescript
// BEFORE:
<OdontogramDiagnosisSection
  toothDx={toothDx}
  onToothDxChange={handleToothDxChange}
  diagnosisFromTeeth={diagnosisFromTeeth}
  manualDiagnosis={manualDiagnosis}
  onManualDiagnosisChange={handleManualDiagnosisChange}
  readOnly={isSnapshotMode}
/>

// AFTER:
<OdontogramDiagnosisSection
  toothDx={toothDx}
  onToothDxChange={handleToothDxChange}
  diagnosisFromTeeth={diagnosisFromTeeth}
  manualDiagnosis={manualDiagnosis}
  onManualDiagnosisChange={handleManualDiagnosisChange}
  readOnly={isSnapshotMode}
  // NEW: Session context props
  activeSession={session}
  activeSessionId={activeSessionId}
  sessions={sessions}
/>
```

**Update Line ~522 (Tabs Layout - same change):**

```typescript
// Apply same changes as above for the tabs layout version
```

---

## FIX 3D: Auto-Create Session on Odontogram Change (OPTIONAL - Phase 2)

### File: `src/hooks/usePatientRecord.ts`

**Update `onToothDxChange` function (Lines 122-134):**

```typescript
// BEFORE:
const onToothDxChange = useCallback((next: ToothDx) => {
  if (!activeSessionId) {
    console.warn('onToothDxChange called without active session');
    return;
  }

  setSessionOdontograms(prev => {
    const updated = new Map(prev);
    updated.set(activeSessionId, next);
    return updated;
  });
  setCurrentToothDx(next);
}, [activeSessionId]);

// AFTER (with auto-session creation):
const onToothDxChange = useCallback((next: ToothDx) => {
  // Auto-create session if none exists
  if (!activeSessionId) {
    console.warn('No active session - creating draft session for odontogram change');

    // Create new draft session
    const newSessionId = -Date.now();
    const today = new Date().toISOString().slice(0, 10);

    const newSessionWithItems: VisitWithProcedures = {
      session: {
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
      },
      items: [],
    };

    // Add to sessions list
    setSessions(prev => [newSessionWithItems, ...prev]);
    setActiveSessionId(newSessionId);

    // Show toast notification
    toast.info(
      "Nueva sesión creada",
      "Se creó una sesión automáticamente para este diagnóstico"
    );

    // Update odontogram for new session
    setSessionOdontograms(prev => {
      const updated = new Map(prev);
      updated.set(newSessionId, next);
      return updated;
    });
    setCurrentToothDx(next);
    return;
  }

  // Normal flow - update existing session
  setSessionOdontograms(prev => {
    const updated = new Map(prev);
    updated.set(activeSessionId, next);
    return updated;
  });
  setCurrentToothDx(next);
}, [activeSessionId, setSessions, toast]);
```

**Note:** This requires importing `VisitWithProcedures` type at the top.

---

## Testing Checklist

After implementing changes:

### Visual Tests

- [ ] MacOSDock: Cartera button shows brand color (teal/blue)
- [ ] MacOSDock: Other buttons remain gray
- [ ] MacOSDock: Save button changes color based on state
- [ ] Odontogram: Teeth with diagnoses have thick blue border
- [ ] Odontogram: Badge shows correct count (1, 2, 3+)
- [ ] Odontogram: Badge pulses subtly

### Session Context Tests

- [ ] Open patient with no sessions → "Sin sesión activa" warning shows
- [ ] Open patient with draft session → Context bar shows "Borrador" badge
- [ ] Open patient with saved session → Context bar shows "Guardada" badge
- [ ] Context bar displays correct session number
- [ ] Context bar displays correct date and reason

### Integration Tests

- [ ] Modify odontogram → Add diagnosis to tooth 11
- [ ] Verify SessionContextBar updates if session exists
- [ ] Verify auto-session creation (if Phase 2 implemented)
- [ ] Save record successfully
- [ ] Reload patient and verify odontogram preserved

---

## Deployment Steps

1. **Commit changes with descriptive message:**
   ```bash
   git add .
   git commit -m "fix(ux): enhance odontogram visual feedback and add session context clarity"
   ```

2. **Test in development:**
   ```bash
   pnpm tauri:dev
   ```

3. **Create test cases:**
   - New patient
   - Existing patient with sessions
   - Patient with no sessions

4. **Deploy to production** (after successful testing)

---

## Rollback Plan

If issues occur:

1. **Revert MacOSDock change:**
   - Change `variant="brand"` back to `variant="neutral"` on line 194

2. **Revert Odontogram changes:**
   - Restore original lines 251-288 from git history

3. **Remove SessionContextBar:**
   - Comment out `<SessionContextBar>` components
   - Keep file for future use

---

## Files Modified Summary

**Modified:**
1. `src/components/MacOSDock.tsx` (1 line change)
2. `src/components/Odontogram.tsx` (40 lines replacement)
3. `src/components/OdontogramDiagnosisSection.tsx` (add imports, props, component)
4. `src/pages/PatientsPageUnified.tsx` (add props to 2 locations)

**Created:**
1. `src/components/sessions/SessionContextBar.tsx` (new file, 90 lines)

**Optional (Phase 2):**
1. `src/hooks/usePatientRecord.ts` (enhance auto-session creation)

---

## Support

If you encounter issues during implementation:

1. Check console for TypeScript errors
2. Verify all imports are correct
3. Ensure `Session` type is imported from `../../lib/types`
4. Test in browser devtools (inspect element to verify CSS classes)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-19
**Implementation Time Estimate:** 2-3 hours
