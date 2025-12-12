# State Management Migration Guide

## Overview

This guide provides a step-by-step approach to migrate from local component state to Zustand global state management.

## Why Migrate?

**Current Problems:**
- 874 lines of duplicated code between `PatientsPage.tsx` and `PatientsPageTabbed.tsx`
- State loss when switching layouts (tabs vs single-page)
- State loss when changing tabs
- No persistence between sessions
- Complex prop drilling

**Benefits After Migration:**
- Single source of truth for all patient data
- State persists when switching layouts
- State persists when changing tabs
- Selective persistence in localStorage
- Better performance (optimized selectors)
- Type-safe state management
- Easier testing

## Architecture

### Store Structure

```
src/stores/
├── index.ts                 # Main store with all slices combined
├── patientStore.ts          # Patient data slice
├── sessionStore.ts          # Session/visit data slice
├── masterDataStore.ts       # Templates, signers, etc.
├── uiStore.ts              # UI state (tabs, dialogs)
└── persistenceConfig.ts    # Persistence configuration
```

### State Organization

```typescript
AppStore {
  // Patient slice
  patient: Patient
  toothDx: ToothDx
  manualDiagnosis: string
  attachments: AttachmentFile[]
  isEditingPatient: boolean
  hasUnsavedChanges: boolean

  // Session slice
  session: Session
  sessions: VisitWithProcedures[]
  quickPaymentOpen: boolean

  // Master data slice
  procedureTemplates: ProcedureTemplate[]
  signers: Signer[]
  reasonTypes: ReasonType[]
  paymentMethods: PaymentMethod[]

  // UI slice
  layoutMode: 'tabs' | 'vertical'
  activeTab: string
  searchDialogOpen: boolean
  paymentsDialogOpen: boolean

  // + All actions for each slice
}
```

## Migration Steps

### Phase 1: Install and Setup (DONE)

1. Install Zustand: `pnpm add zustand`
2. Create store files (all files in `src/stores/`)
3. Configure persistence

### Phase 2: Create Unified Component

Create a single `PatientsPageUnified.tsx` that replaces both `PatientsPage.tsx` and `PatientsPageTabbed.tsx`.

**Key Changes:**
- Replace all `useState` with Zustand selectors
- Replace `useCallback` deps with store actions
- Remove prop drilling
- Add layout mode toggle

### Phase 3: Migrate Data Loading

**Before:**
```typescript
// In PatientsPage.tsx
useEffect(() => {
  (async () => {
    const repo = await getRepository();
    const templates = await repo.getProcedureTemplates();
    setProcedureTemplates(templates);
    // ... more loads
  })();
}, []);
```

**After:**
```typescript
// In a custom hook: useInitializeMasterData.ts
export function useInitializeMasterData() {
  const loadAllMasterData = useAppStore(state => state.loadAllMasterData);
  const isLoading = useAppStore(state => state.isLoadingMasterData);

  useEffect(() => {
    (async () => {
      const repo = await getRepository();
      const [templates, signers, reasonTypes, paymentMethods] = await Promise.all([
        repo.getProcedureTemplates(),
        repo.getSigners(),
        repo.getReasonTypes(),
        repo.getPaymentMethods(),
      ]);

      loadAllMasterData({ templates, signers, reasonTypes, paymentMethods });
    })();
  }, [loadAllMasterData]);

  return { isLoading };
}
```

### Phase 4: Migrate Event Handlers

**Before:**
```typescript
const handleSave = useCallback(async () => {
  const hasPatientData = Boolean(patient.full_name && patient.doc_id);
  if (!hasPatientData) {
    toast.warning("Datos incompletos", "...");
    return;
  }
  // ... save logic
}, [patient, session, toothDx, sessions, attachments]);
```

**After:**
```typescript
const handleSave = async () => {
  const state = useAppStore.getState();
  const hasPatientData = Boolean(state.patient.full_name && state.patient.doc_id);
  if (!hasPatientData) {
    toast.warning("Datos incompletos", "...");
    return;
  }
  // ... save logic using state values
};
```

### Phase 5: Update Components to Use Store

**Before:**
```typescript
<PatientForm value={patient} onChange={setPatient} />
```

**After:**
```typescript
// Component reads from store directly
const patient = useAppStore(selectPatient);
const updatePatient = useAppStore(state => state.updatePatient);

<PatientForm value={patient} onChange={updatePatient} />
```

### Phase 6: Handle URL Parameters

**Before (in PatientsPageTabbed.tsx):**
```typescript
useEffect(() => {
  const patientIdParam = searchParams.get("patientId");
  if (!patientIdParam || urlPatientLoaded) return;

  // Load patient...
  setUrlPatientLoaded(true);
}, [urlPatientLoaded, searchParams]);
```

**After (in PatientsPageUnified.tsx):**
```typescript
const loadedFromUrl = useAppStore(state => state.loadedFromUrl);
const setLoadedFromUrl = useAppStore(state => state.setLoadedFromUrl);
const loadPatientData = useAppStore(state => state.loadPatientData);

useEffect(() => {
  const patientIdParam = searchParams.get("patientId");
  if (!patientIdParam || loadedFromUrl) return;

  // Load patient and update store...
  setLoadedFromUrl(true);
}, [loadedFromUrl, searchParams, setLoadedFromUrl, loadPatientData]);
```

### Phase 7: Add Layout Toggle UI

Create a toggle button in the UI to switch between layouts:

```typescript
import { useAppStore, selectLayoutMode } from "../stores";

function LayoutToggle() {
  const layoutMode = useAppStore(selectLayoutMode);
  const setLayoutMode = useAppStore(state => state.setLayoutMode);

  return (
    <button
      onClick={() => setLayoutMode(layoutMode === 'tabs' ? 'vertical' : 'tabs')}
    >
      {layoutMode === 'tabs' ? 'Vista Vertical' : 'Vista por Pestañas'}
    </button>
  );
}
```

### Phase 8: Testing

1. Test state persistence across layout switches
2. Test state persistence across tab changes
3. Test URL parameter loading
4. Test save/load operations
5. Test keyboard shortcuts (Ctrl+S, Ctrl+K, etc.)

### Phase 9: Cleanup

1. Remove `PatientsPage.tsx`
2. Remove `PatientsPageTabbed.tsx`
3. Update `PatientsPageWrapper.tsx` to use unified component
4. Remove unused state management code

## Migration Checklist

### Data Migration
- [ ] Patient data (patient, toothDx, manualDiagnosis, attachments)
- [ ] Session data (session, sessions)
- [ ] Master data (procedureTemplates, signers, reasonTypes, paymentMethods)
- [ ] UI state (layoutMode, activeTab, dialog states)

### Component Updates
- [ ] PatientForm
- [ ] Odontogram
- [ ] DiagnosisArea
- [ ] SessionsTable
- [ ] Attachments
- [ ] PatientSearchDialog
- [ ] PendingPaymentsDialog
- [ ] FinancialHistoryBlock
- [ ] QuickPaymentModal

### Event Handlers
- [ ] handleNew
- [ ] handleSave
- [ ] handlePreview
- [ ] handleSelectPatient
- [ ] handleDeleteAttachment
- [ ] handleQuickPayment
- [ ] updateProcedureTemplates
- [ ] reloadSigners
- [ ] handleReasonTypesChange

### Persistence
- [ ] Layout mode persists in localStorage
- [ ] Active tab persists in localStorage
- [ ] Last opened patient ID persists
- [ ] Draft data restoration (optional)

## Example: Refactored Component

See `docs/EXAMPLE_UNIFIED_COMPONENT.md` for a complete example of the unified component.

## Backward Compatibility

During migration, you can run both old and new systems in parallel:

1. Keep old components (`PatientsPage.tsx`, `PatientsPageTabbed.tsx`)
2. Create new unified component (`PatientsPageUnified.tsx`)
3. Add feature flag in settings to toggle between old/new
4. Test thoroughly
5. Remove old components once stable

## Performance Considerations

### Optimized Selectors

```typescript
// BAD: This will re-render on ANY state change
const state = useAppStore();

// GOOD: Only re-renders when patient changes
const patient = useAppStore(selectPatient);

// BETTER: Only re-renders when patient name changes
const patientName = useAppStore(state => state.patient.full_name);
```

### Avoid Over-Subscribing

```typescript
// BAD: Component re-renders on any patient change
function MyComponent() {
  const patient = useAppStore(selectPatient);
  return <div>{patient.full_name}</div>;
}

// GOOD: Only subscribes to what you need
function MyComponent() {
  const patientName = useAppStore(state => state.patient.full_name);
  return <div>{patientName}</div>;
}
```

## Troubleshooting

### State not persisting?
- Check localStorage in DevTools
- Verify `partialize` function in store config
- Check STORAGE_KEY is unique

### Components re-rendering too often?
- Use specific selectors instead of full state
- Check dependencies in useEffect/useMemo/useCallback

### TypeScript errors?
- Ensure all types are exported from store files
- Check that selectors return correct types
- Verify actions are properly typed

## Next Steps

After completing this migration:

1. Add Vitest tests for store actions
2. Add React Testing Library tests for components
3. Consider adding devtools for debugging
4. Document new patterns for the team
5. Update CLAUDE.md with new architecture

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [Zustand Persistence](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
