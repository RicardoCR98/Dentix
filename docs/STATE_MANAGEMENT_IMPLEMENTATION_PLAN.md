# State Management Implementation Plan

## Executive Summary

This document outlines a detailed, step-by-step plan to migrate the dental clinic application from local component state to Zustand global state management.

**Goal**: Eliminate 874 lines of duplicated code, enable seamless layout switching, and persist user state.

**Timeline**: 3-5 days for full implementation and testing

## Current Problems

### Code Duplication
```
PatientsPage.tsx:         874 lines
PatientsPageTabbed.tsx:   1007 lines
Total duplication:        ~800 lines (90% identical)
```

### State Loss Scenarios

1. **Layout Switch**: User fills patient form → switches to tabs layout → **data lost**
2. **Tab Navigation**: User edits odontogram → switches to procedures tab → switches back → **selections lost**
3. **URL Navigation**: User opens patient from list → switches layout → **patient data lost**
4. **App Restart**: User fills draft data → closes app → **unsaved work lost** (optional to fix)

## Solution Architecture

### Store Structure

```
AppStore (Zustand)
├── Patient Slice
│   ├── patient: Patient
│   ├── toothDx: ToothDx
│   ├── manualDiagnosis: string
│   ├── attachments: AttachmentFile[]
│   └── isEditingPatient: boolean
│
├── Session Slice
│   ├── session: Session
│   ├── sessions: VisitWithProcedures[]
│   └── quickPaymentOpen: boolean
│
├── Master Data Slice
│   ├── procedureTemplates: ProcedureTemplate[]
│   ├── signers: Signer[]
│   ├── reasonTypes: ReasonType[]
│   └── paymentMethods: PaymentMethod[]
│
└── UI Slice
    ├── layoutMode: 'tabs' | 'vertical'
    ├── activeTab: string
    ├── searchDialogOpen: boolean
    └── paymentsDialogOpen: boolean
```

### Persistence Strategy

#### What Persists in localStorage?
```typescript
{
  layoutMode: 'tabs' | 'vertical',           // User's preferred layout
  activeTab: 'odontogram',                   // Last active tab
  lastOpenedPatientId: 123,                  // Last viewed patient
  // Optional: Draft data for recovery
  draftPatient?: Patient,
  draftToothDx?: ToothDx,
}
```

#### What Loads from Database?
- Patient records
- Sessions (visits)
- Master data (templates, signers, etc.)
- Attachments metadata

#### What is Session-Only (cleared on reload)?
- Dialog open/close states
- Search results
- Temporary UI flags

## Implementation Phases

### Phase 1: Foundation (Day 1)

**Status**: ✅ COMPLETE

- [x] Install Zustand
- [x] Create store directory structure
- [x] Define TypeScript types for all slices
- [x] Create persistence configuration
- [x] Set up store with middleware

**Files Created**:
- `src/stores/index.ts`
- `src/stores/patientStore.ts`
- `src/stores/sessionStore.ts`
- `src/stores/masterDataStore.ts`
- `src/stores/uiStore.ts`
- `src/stores/persistenceConfig.ts`

**Testing**:
```bash
# Verify store works
pnpm dev
# Open DevTools → Application → localStorage
# Should see 'dentix-app-state' key
```

---

### Phase 2: Custom Hooks (Day 2)

**Status**: 🔄 PENDING

Create reusable hooks that encapsulate business logic.

#### Tasks

1. **Create `useInitializeMasterData.ts`**
   - Load all master data on app start
   - Replace duplicate initialization code
   - Handle loading states

2. **Create `usePatientLoader.ts`**
   - Handle URL parameter loading (`?patientId=123`)
   - Load patient data from database
   - Update store with loaded data
   - Show toast notifications

3. **Create `usePatientOperations.ts`**
   - `handleNew()`: Reset to new patient form
   - `handleSave()`: Save patient with sessions
   - `handleSelectPatient()`: Load existing patient
   - `handlePreview()`: Print preview

4. **Create `useSessionOperations.ts`**
   - Session CRUD operations
   - Financial calculations
   - Quick payment handling

5. **Create `useMasterDataOperations.ts`**
   - Update procedure templates
   - Reload signers
   - Manage reason types
   - Handle payment methods

**Files to Create**:
- `src/hooks/useInitializeMasterData.ts`
- `src/hooks/usePatientLoader.ts`
- `src/hooks/usePatientOperations.ts`
- `src/hooks/useSessionOperations.ts`
- `src/hooks/useMasterDataOperations.ts`

**Testing**:
```typescript
// Test in isolation
import { renderHook } from '@testing-library/react';
import { usePatientOperations } from './usePatientOperations';

test('handleSave validates patient data', () => {
  const { result } = renderHook(() => usePatientOperations());
  // Test save with empty patient
  // Should show warning toast
});
```

---

### Phase 3: Unified Component (Day 3)

**Status**: 🔄 PENDING

Create single component that replaces both page variants.

#### Tasks

1. **Create `PatientsPageUnified.tsx`**
   - Use Zustand selectors for all state
   - Import custom hooks from Phase 2
   - Render quick actions section
   - Render patient form/card section
   - Render content (vertical or tabbed based on `layoutMode`)
   - Add keyboard shortcuts (Ctrl+S, Ctrl+K, Ctrl+N, Ctrl+P)

2. **Implement Vertical Layout**
   - All sections in single scroll
   - Same as current `PatientsPage.tsx`

3. **Implement Tabbed Layout**
   - Patient card in fixed section
   - Tabs for: Odontograma, Procedimientos, Financiero, Adjuntos
   - Active tab persists in store
   - Same as current `PatientsPageTabbed.tsx`

4. **Add Layout Toggle UI**
   - Button in header to switch layouts
   - Icon changes based on current mode
   - Persists preference in localStorage

**Example Structure**:
```typescript
export function PatientsPageUnified() {
  // Hooks
  useInitializeMasterData();
  usePatientLoader();
  const operations = usePatientOperations();

  // Store state
  const layoutMode = useAppStore(selectLayoutMode);
  const patient = useAppStore(selectPatient);
  const toothDx = useAppStore(selectToothDx);

  // Render
  return (
    <>
      <QuickActionsSection {...operations} />
      <PatientSection patient={patient} />
      {layoutMode === 'vertical' ? (
        <VerticalLayout />
      ) : (
        <TabbedLayout />
      )}
    </>
  );
}
```

**Testing**:
- Manually test both layouts
- Verify data persists when switching layouts
- Test keyboard shortcuts
- Test URL parameter loading

---

### Phase 4: Component Integration (Day 4)

**Status**: 🔄 PENDING

Update all child components to work with Zustand.

#### Tasks

1. **Update `PatientForm.tsx`**
   - Accept `onChange` prop with store action
   - OR read/write directly from store (preferred)

2. **Update `Odontogram.tsx`**
   - Use `toothDx` from store
   - Call `setToothDx` action

3. **Update `DiagnosisArea.tsx`**
   - Use `manualDiagnosis` from store
   - Call `setManualDiagnosis` action

4. **Update `SessionsTable.tsx`**
   - Use `sessions` from store
   - Call `setSessions` action

5. **Update `Attachments.tsx`**
   - Use `attachments` from store
   - Call attachment actions

6. **Update `PatientSearchDialog.tsx`**
   - Use `searchDialogOpen` from store
   - Use `patientsForDialogs` from store
   - Call `handleSelectPatient` from operations hook

7. **Update `PendingPaymentsDialog.tsx`**
   - Use `paymentsDialogOpen` from store
   - Call `handleSelectPatient` from operations hook

**Pattern**:
```typescript
// BEFORE
function Odontogram({ value, onChange }) {
  return <div onClick={() => onChange(newValue)} />;
}

// AFTER
function Odontogram() {
  const toothDx = useAppStore(selectToothDx);
  const setToothDx = useAppStore(state => state.setToothDx);
  return <div onClick={() => setToothDx(newValue)} />;
}
```

**Testing**:
- Test each component in isolation
- Verify store updates correctly
- Check for re-render performance

---

### Phase 5: Update Wrapper (Day 4)

**Status**: 🔄 PENDING

Update `PatientsPageWrapper.tsx` to use new unified component.

#### Tasks

1. **Update `PatientsPageWrapper.tsx`**
   ```typescript
   // BEFORE
   export function PatientsPageWrapper() {
     const { layoutMode } = useTheme();
     if (layoutMode === "tabs") return <PatientsPageTabbed />;
     return <PatientsPage />;
   }

   // AFTER
   export function PatientsPageWrapper() {
     // Layout mode now comes from store, not theme
     return <PatientsPageUnified />;
   }
   ```

2. **Move `layoutMode` from ThemeProvider to Store**
   - Remove from `ThemeProvider`
   - Add to Zustand store
   - Update ThemePanel to use store

**Testing**:
- Navigate to `/registro-clinico`
- Should render unified component
- Layout toggle should work

---

### Phase 6: Cleanup (Day 5)

**Status**: 🔄 PENDING

Remove old code and update documentation.

#### Tasks

1. **Remove Old Files**
   - ~~Delete `src/pages/PatientsPage.tsx`~~
   - ~~Delete `src/pages/PatientsPageTabbed.tsx`~~
   - Keep backups in `src/pages/_archive/` folder first

2. **Update ThemeProvider**
   - Remove `layoutMode` from theme context
   - Update TypeScript types

3. **Update CLAUDE.md**
   - Document new Zustand architecture
   - Update state management section
   - Add examples of using store

4. **Update README.md** (if exists)
   - Add Zustand to tech stack
   - Document store architecture

**Testing**:
- Full regression test of all features
- Test all keyboard shortcuts
- Test all dialogs
- Test save/load operations

---

### Phase 7: Testing & Validation (Day 5)

**Status**: 🔄 PENDING

Comprehensive testing of the new system.

#### Test Scenarios

1. **Layout Switching**
   - [ ] Fill patient form in vertical layout
   - [ ] Switch to tabs layout
   - [ ] Data should persist
   - [ ] Switch back to vertical
   - [ ] Data should still be there

2. **Tab Navigation**
   - [ ] Select teeth in odontogram tab
   - [ ] Switch to procedures tab
   - [ ] Add a session
   - [ ] Switch back to odontogram
   - [ ] Teeth selections should persist

3. **URL Navigation**
   - [ ] Navigate to `/registro-clinico?patientId=123`
   - [ ] Patient should load
   - [ ] Switch layouts
   - [ ] Patient data should persist

4. **Persistence Across Reloads**
   - [ ] Set layout to tabs
   - [ ] Switch to odontogram tab
   - [ ] Reload page
   - [ ] Should restore tabs layout
   - [ ] Should be on odontogram tab

5. **Save Operations**
   - [ ] Fill patient form
   - [ ] Add tooth diagnoses
   - [ ] Add session
   - [ ] Click save
   - [ ] Should save successfully
   - [ ] Draft sessions should become saved
   - [ ] `hasUnsavedChanges` should be false

6. **New Patient**
   - [ ] Fill patient form
   - [ ] Click "Nueva Historia"
   - [ ] Should prompt for confirmation
   - [ ] Should clear all data

7. **Search Patient**
   - [ ] Open search dialog (Ctrl+K)
   - [ ] Search for patient
   - [ ] Select patient
   - [ ] Should load patient data
   - [ ] Should close dialog

8. **Keyboard Shortcuts**
   - [ ] Ctrl+S saves
   - [ ] Ctrl+K opens search
   - [ ] Ctrl+N creates new
   - [ ] Ctrl+P opens print preview

#### Performance Testing

1. **Re-render Optimization**
   ```typescript
   // Use React DevTools Profiler
   // Check components only re-render when their data changes
   ```

2. **Store Size**
   ```typescript
   // Check localStorage size
   // Should be < 1MB for typical usage
   ```

3. **Load Time**
   ```typescript
   // Measure time from page load to render
   // Should be < 500ms
   ```

---

## Backward Compatibility Strategy

### Option A: Feature Flag (Recommended)

Add a setting to toggle between old and new implementations:

```typescript
// In settings
{
  experimental: {
    useUnifiedPatientPage: boolean;
  }
}

// In PatientsPageWrapper
export function PatientsPageWrapper() {
  const { useUnifiedPatientPage } = useSettings();
  const layoutMode = useAppStore(selectLayoutMode);

  if (useUnifiedPatientPage) {
    return <PatientsPageUnified />;
  }

  // Fallback to old implementation
  if (layoutMode === 'tabs') return <PatientsPageTabbed />;
  return <PatientsPage />;
}
```

**Pros**:
- Safe rollback if issues found
- Gradual migration
- Users can test new version

**Cons**:
- Maintains duplicate code temporarily
- More complex during transition

### Option B: Direct Replacement

Replace immediately with new unified component.

**Pros**:
- Clean codebase immediately
- Simpler implementation

**Cons**:
- Higher risk
- No fallback

**Recommendation**: Use Option A during initial rollout, then remove old code after 1-2 weeks of stable usage.

---

## Risk Mitigation

### Potential Issues

1. **Store Hydration Errors**
   - **Risk**: localStorage data incompatible with new schema
   - **Mitigation**: Add version migration logic
   - **Recovery**: Clear localStorage and reload

2. **Performance Degradation**
   - **Risk**: Too many re-renders due to poor selector usage
   - **Mitigation**: Use specific selectors, not full state
   - **Monitoring**: Add React DevTools profiler

3. **Data Loss**
   - **Risk**: Store update logic has bugs, data lost
   - **Mitigation**: Extensive testing, keep old code as backup
   - **Recovery**: Rollback to old implementation

4. **Type Errors**
   - **Risk**: TypeScript errors in complex selectors
   - **Mitigation**: Proper typing of all store slices
   - **Testing**: Run `pnpm build` to catch errors

### Rollback Plan

If critical issues found:

1. Disable feature flag (if using Option A)
2. Or revert commit that added Zustand
3. Clear affected user's localStorage
4. Investigate and fix issues
5. Re-deploy when stable

---

## Success Criteria

### Functional Requirements
- [ ] All features work identically to old implementation
- [ ] Layout switching preserves all state
- [ ] Tab navigation preserves all state
- [ ] URL parameter loading works
- [ ] Save/load operations work correctly
- [ ] Keyboard shortcuts work

### Non-Functional Requirements
- [ ] Code reduction: 874 → ~400 lines (50% reduction)
- [ ] No performance regression
- [ ] localStorage usage < 1MB
- [ ] All TypeScript errors resolved
- [ ] No console errors/warnings

### User Experience
- [ ] Instant layout switching (no loading delay)
- [ ] No data loss scenarios
- [ ] Preferences persist across sessions
- [ ] Smooth transitions between tabs

---

## Maintenance Notes

### Adding New State

When adding new state to the store:

1. Decide which slice it belongs to
2. Add type to slice file
3. Add to initial state
4. Create actions to modify it
5. Export selectors in `index.ts`
6. Update persistence config if needed

### Debugging Store

```typescript
// In browser console
localStorage.getItem('dentix-app-state')

// Enable Zustand devtools (optional)
import { devtools } from 'zustand/middleware';
export const useAppStore = create(
  devtools(
    persist(...),
    { name: 'OklusStore' }
  )
);
```

### Performance Monitoring

```typescript
// Add to store for debugging
const useAppStore = create((set, get) => ({
  // ... state
  __DEBUG__: {
    getFullState: () => get(),
    logStateSize: () => {
      const state = get();
      console.log('Store size:', JSON.stringify(state).length);
    },
  },
}));
```

---

## Timeline Summary

| Phase | Tasks | Duration | Status |
|-------|-------|----------|--------|
| 1. Foundation | Setup Zustand, create stores | 4 hours | ✅ COMPLETE |
| 2. Custom Hooks | Extract business logic | 6 hours | 🔄 PENDING |
| 3. Unified Component | Create single page component | 8 hours | 🔄 PENDING |
| 4. Component Integration | Update child components | 6 hours | 🔄 PENDING |
| 5. Wrapper Update | Update routing | 2 hours | 🔄 PENDING |
| 6. Cleanup | Remove old code | 2 hours | 🔄 PENDING |
| 7. Testing | Comprehensive testing | 8 hours | 🔄 PENDING |

**Total Estimated Time**: 36 hours (~5 days)

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Start Phase 2**: Create custom hooks
3. **Test incrementally** after each phase
4. **Document issues** in GitHub/tracking system
5. **Update CLAUDE.md** with learnings

---

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [React Performance Best Practices](https://react.dev/learn/render-and-commit)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- See `docs/STATE_MANAGEMENT_MIGRATION.md` for migration guide
- See `docs/EXAMPLE_UNIFIED_COMPONENT.md` for code examples
