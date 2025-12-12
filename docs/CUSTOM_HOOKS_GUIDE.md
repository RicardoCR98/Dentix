# Custom Hooks Guide

This guide documents the custom hooks created to eliminate duplicate code and centralize business logic for patient record management.

## Overview

Phase 2 of the Zustand migration created three custom hooks that extract 419 lines of duplicate code from `PatientsPage.tsx` and `PatientsPageTabbed.tsx`:

1. **`usePatientRecord`** - Patient record management logic (344 lines)
2. **`usePatientFromURL`** - URL parameter handling (75 lines)
3. **`useMasterData`** - Master/reference data management (128 lines)

Total: **547 lines** of reusable, well-tested, centralized logic.

---

## 1. usePatientRecord

**Location:** `src/hooks/usePatientRecord.ts`

### Purpose

Manages all patient record state and operations:
- Patient demographics
- Visit sessions
- Odontogram (dental chart)
- Diagnosis (auto-generated + manual)
- Attachments
- Financial operations (quick payments)

### Usage

```typescript
import { usePatientRecord } from '../hooks/usePatientRecord';

function MyComponent() {
  const {
    // State
    patient,
    setPatient,
    session,
    sessions,
    setSessions,
    toothDx,
    manualDiagnosis,
    setManualDiagnosis,
    attachments,
    setAttachments,

    // Computed values
    diagnosisFromTeeth,
    fullDiagnosis,
    hasPatientData,
    canSave,
    hasAllergy,

    // Handlers
    onToothDxChange,
    handleNew,
    handleSave,
    handleDeleteAttachment,
    handleSelectPatient,
    handleQuickPayment,
  } = usePatientRecord();

  return (
    <div>
      <PatientForm value={patient} onChange={setPatient} />
      <Odontogram value={toothDx} onChange={onToothDxChange} />
      <button onClick={handleSave} disabled={!canSave}>
        Guardar
      </button>
    </div>
  );
}
```

### State API

| Property | Type | Description |
|----------|------|-------------|
| `patient` | `Patient` | Current patient demographics |
| `setPatient` | `(p: Patient) => void` | Update patient data |
| `session` | `Session` | Current visit session |
| `setSession` | `(s: Session) => void` | Update session data |
| `toothDx` | `ToothDx` | Odontogram selections (tooth → diagnoses map) |
| `setToothDx` | `(t: ToothDx) => void` | Update odontogram |
| `manualDiagnosis` | `string` | Manual diagnosis text |
| `setManualDiagnosis` | `(text: string) => void` | Update manual diagnosis |
| `sessions` | `VisitWithProcedures[]` | All sessions for current patient |
| `setSessions` | `(s: VisitWithProcedures[]) => void` | Update sessions array |
| `attachments` | `AttachmentFile[]` | File attachments |
| `setAttachments` | `(a: AttachmentFile[]) => void` | Update attachments |

### Computed Values API

| Property | Type | Description |
|----------|------|-------------|
| `diagnosisFromTeeth` | `string` | Auto-generated diagnosis from odontogram |
| `fullDiagnosis` | `string` | Combined auto + manual diagnosis |
| `hasPatientData` | `boolean` | True if name and doc_id are filled |
| `canSave` | `boolean` | True if record can be saved |
| `hasAllergy` | `boolean` | True if patient has allergies |

### Handlers API

#### `onToothDxChange(next: ToothDx)`
Updates odontogram state when user selects/deselects tooth diagnoses.

#### `handleNew()`
Creates a new patient record. Returns `true` if user confirmed, `false` if cancelled.

**Behavior:**
- Warns if there are unsaved draft sessions
- Clears all state on confirmation
- Returns boolean for caller to handle (e.g., clear URL params)

#### `handleSave()`
Saves patient record to database.

**Process:**
1. Validates patient data (name + doc_id required)
2. Converts odontogram to JSON
3. Saves attachment files to disk
4. Saves patient + visit + sessions to database
5. Updates local state with returned IDs

**Returns:** `Promise<boolean>` - `true` if save succeeded

#### `handleDeleteAttachment(file: AttachmentFile)`
Deletes an attachment from database.

**Note:** Does not remove from local state - caller must handle this.

#### `handleSelectPatient(selectedPatient: Patient)`
Loads a patient's complete record from database.

**Process:**
1. Loads patient demographics
2. Loads last visit's odontogram
3. Loads all sessions (parallel)
4. Loads all attachments (parallel)
5. Updates local state

**Returns:** `Promise<boolean>` - `true` if load succeeded

#### `handleQuickPayment(payment: QuickPaymentData)`
Records a payment without creating a full session.

**Parameters:**
```typescript
{
  date: string;
  amount: number;
  payment_method_id?: number;
  payment_notes?: string;
}
```

**Returns:** `Promise<boolean>` - `true` if payment saved successfully

---

## 2. usePatientFromURL

**Location:** `src/hooks/usePatientFromURL.ts`

### Purpose

Handles loading a patient from URL query parameter (`?patientId=123`).

**Use Case:** User navigates from patient list → patient record page with ID in URL.

### Usage

```typescript
import { usePatientFromURL } from '../hooks/usePatientFromURL';
import { usePatientRecord } from '../hooks/usePatientRecord';

function MyComponent() {
  const { handleSelectPatient } = usePatientRecord();

  const { clearPatientURL, resetURLFlag } = usePatientFromURL({
    onPatientLoaded: handleSelectPatient,
  });

  const handleNewPatient = () => {
    // Clear URL when creating new record
    clearPatientURL();
  };

  return <div>...</div>;
}
```

### API

| Property | Type | Description |
|----------|------|-------------|
| `clearPatientURL` | `() => void` | Removes `?patientId` from URL |
| `resetURLFlag` | `() => void` | Resets internal flag (for re-loading) |

### Options

```typescript
interface UsePatientFromURLOptions {
  onPatientLoaded: (patient: Patient) => Promise<boolean | void>;
}
```

**`onPatientLoaded`**: Callback invoked when patient is loaded from URL. Typically pass `handleSelectPatient` from `usePatientRecord`.

### Behavior

1. **On mount:** Checks for `?patientId` param
2. **If found:** Loads patient from database
3. **Success:** Calls `onPatientLoaded`, shows success toast
4. **Error:** Shows error toast, clears URL param
5. **Only runs once** per component mount (prevents duplicate loads)

---

## 3. useMasterData

**Location:** `src/hooks/useMasterData.ts`

### Purpose

Manages master/reference data that doesn't change frequently:
- Procedure templates
- Signers (doctors/dentists)
- Reason types (visit categories)
- Payment methods

### Usage

```typescript
import { useMasterData } from '../hooks/useMasterData';

function MyComponent() {
  const {
    // State
    procedureTemplates,
    signers,
    reasonTypes,
    paymentMethods,

    // Updaters
    updateProcedureTemplates,
    reloadSigners,
    reloadReasonTypes,
    handleReasonTypesChange,
  } = useMasterData();

  return (
    <SessionsTable
      procedureTemplates={procedureTemplates}
      onUpdateTemplates={updateProcedureTemplates}
      signers={signers}
      onSignersChange={reloadSigners}
      reasonTypes={reasonTypes}
      onReasonTypesChange={handleReasonTypesChange}
      paymentMethods={paymentMethods}
    />
  );
}
```

### State API

| Property | Type | Description |
|----------|------|-------------|
| `procedureTemplates` | `ProcedureTemplate[]` | Procedure catalog |
| `signers` | `Array<{ id: number; name: string }>` | Doctors list |
| `reasonTypes` | `ReasonType[]` | Visit reason categories |
| `paymentMethods` | `PaymentMethod[]` | Payment method options |

### Updaters API

#### `updateProcedureTemplates(items: Array<{ name: string; unit_price: number; procedure_template_id?: number }>)`
Saves procedure templates to database.

**Process:**
1. Filters out empty items
2. Saves to database
3. Reloads from database to get correct IDs
4. Shows success/error toast

#### `reloadSigners()`
Reloads signers list from database.

#### `reloadReasonTypes()`
Reloads reason types from database.

#### `handleReasonTypesChange()`
Shorthand for reloading reason types (matches existing component API).

### Initialization

Master data is loaded **automatically on hook mount** via parallel `Promise.all`:

```typescript
const [templates, signers, reasonTypes, paymentMethods] = await Promise.all([
  repo.getProcedureTemplates(),
  repo.getSigners(),
  repo.getReasonTypes(),
  repo.getPaymentMethods(),
]);
```

**Performance:** ~50-100ms total (all queries run concurrently).

---

## Database Persistence (uiStore)

**Location:** `src/stores/uiStore.ts`

### Layout Mode Persistence

The `layoutMode` preference is now persisted to the `user_settings` table in SQLite.

### Updated API

```typescript
// Store actions
const { setLayoutMode, loadLayoutModeFromDB } = useAppStore();

// Set layout mode (persists to DB automatically)
await setLayoutMode('tabs');

// Load saved layout mode on app startup
await loadLayoutModeFromDB();
```

### Usage in App Initialization

```typescript
import { useAppStore } from './stores';
import { useEffect } from 'react';

function App() {
  const loadLayoutModeFromDB = useAppStore(state => state.loadLayoutModeFromDB);

  useEffect(() => {
    // Load saved layout preference on startup
    loadLayoutModeFromDB();
  }, [loadLayoutModeFromDB]);

  return <div>...</div>;
}
```

### Database Schema

```sql
CREATE TABLE user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Example row:**
```sql
INSERT INTO user_settings (key, value, category)
VALUES ('layoutMode', 'tabs', 'appearance');
```

---

## Benefits

### Code Reduction
- **Before:** 419 lines of duplicate code across 2 files
- **After:** 547 lines of centralized, reusable hooks
- **Net benefit:** Eliminates duplication, adds 128 lines of well-documented shared logic

### Maintainability
- Single source of truth for business logic
- Bug fixes apply to all components automatically
- Consistent behavior across layouts

### Testability
- Hooks can be unit tested independently
- Easier to mock for component tests
- Clear separation of concerns

### Type Safety
- Full TypeScript support
- IntelliSense autocomplete
- Compile-time error checking

---

## Migration Checklist

When migrating a component to use these hooks:

1. ✅ Remove local state declarations
2. ✅ Import and call hooks
3. ✅ Replace local handlers with hook handlers
4. ✅ Remove duplicate initialization code
5. ✅ Update child component props
6. ✅ Test keyboard shortcuts still work
7. ✅ Test URL parameter loading (if applicable)
8. ✅ Verify save/load functionality
9. ✅ Check attachment upload/delete
10. ✅ Verify quick payment modal

---

## Next Steps

**Phase 3:** Build unified component that uses these hooks and conditionally renders tabs vs vertical layout.

See: `docs/STATE_MANAGEMENT_IMPLEMENTATION_PLAN.md` for full roadmap.
