# State Management Architecture

**Last Updated**: 2026-01-07
**Status**: Current Implementation

## Overview

Oklus uses a **hybrid state management approach** that combines:
- **Zustand store** for UI preferences and global UI state
- **Custom hooks** for patient record management (business logic)
- **Local component state** for patient data (via hooks)

This architecture was implemented on 2025-12-11 to eliminate code duplication and improve maintainability.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                 React Application                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │         PatientsPageUnified.tsx                    │  │
│  │                                                    │  │
│  │  Uses:                                             │  │
│  │  • usePatientRecord() → Patient data              │  │
│  │  • useMasterData() → Templates, signers, etc.     │  │
│  │  • useUIStore() → Layout mode, active tab         │  │
│  └────────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Custom Hooks Layer                       │  │
│  │                                                    │  │
│  │  usePatientRecord:                                 │  │
│  │   • Patient data, sessions, odontogram            │  │
│  │   • handleSave(), handleNew()                     │  │
│  │   • Attachments management                        │  │
│  │                                                    │  │
│  │  useMasterData:                                    │  │
│  │   • Procedure templates                           │  │
│  │   • Signers, reason types, payment methods        │  │
│  │                                                    │  │
│  │  usePatientFromURL:                                │  │
│  │   • Load patient from URL param                   │  │
│  └────────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Zustand Store (UI only)                  │  │
│  │                                                    │  │
│  │  uiStore.ts:                                       │  │
│  │   • layoutMode (vertical | tabs)                  │  │
│  │   • activeTab                                      │  │
│  │   • Dialog states                                  │  │
│  │                                                    │  │
│  │  Persistence:                                      │  │
│  │   • layoutMode → SQLite (user_settings table)     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│         TauriSqliteRepository.ts                         │
│                                                          │
│  • searchPatients()                                      │
│  • getSessionsByPatient()                                │
│  • saveVisitWithSessions()                               │
│  • getProcedureTemplates()                               │
│  • getSigners()                                          │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│              SQLite Database (clinic.db)                 │
└──────────────────────────────────────────────────────────┘
```

---

## State Types

### 1. UI State (Zustand)

**Location**: `src/stores/uiStore.ts`

**Purpose**: Global UI preferences that persist across app restarts

**State**:
```typescript
{
  layoutMode: 'vertical' | 'tabs',
  activeTab: string | null,
  // Dialog states (if needed)
}
```

**Persistence**:
- `layoutMode` is saved to SQLite `user_settings` table
- Survives app restarts

**Usage**:
```typescript
const { layoutMode, setLayoutMode } = useUIStore();
```

---

### 2. Patient Record State (Custom Hooks)

**Location**: `src/hooks/usePatientRecord.ts`

**Purpose**: Manage patient data, sessions, odontogram, and financial records

**State**:
```typescript
{
  patient: Patient | null,
  visit: Visit,
  toothDx: ToothDx,
  sessions: VisitWithProcedures[],
  attachments: AttachmentFile[],
  hasUnsavedChanges: boolean,
}
```

**Operations**:
- `handleSave()` - Save patient record
- `handleNew()` - Create new record
- `handleSelectPatient()` - Load patient
- `updatePatient()`, `updateVisit()`, etc.

**Persistence**: None (local component state)

---

### 3. Master Data State (Custom Hooks)

**Location**: `src/hooks/useMasterData.ts`

**Purpose**: Reference data (templates, signers, etc.)

**State**:
```typescript
{
  procedureTemplates: ProcedureTemplate[],
  signers: Signer[],
  reasonTypes: ReasonType[],
  paymentMethods: PaymentMethod[],
  diagnosisOptions: DiagnosisOption[],
}
```

**Persistence**: Loaded from SQLite on mount

---

## Data Flow

### Save Operation

```
User clicks "Guardar"
    │
    ▼
usePatientRecord.handleSave()
    │
    ├─ 1. Validate patient data
    ├─ 2. Save attachment files to disk
    │
    ▼
repo.saveVisitWithSessions()
    │
    ├─ Tauri invoke("save_visit_with_sessions")
    │
    ▼
Rust backend (commands.rs)
    │
    ├─ BEGIN TRANSACTION
    ├─ Upsert patient
    ├─ Upsert sessions
    ├─ Insert session_items
    ├─ COMMIT
    │
    ▼
Update local state with returned IDs
    │
    ▼
Show success toast
```

---

### Layout Switch (Vertical ↔ Tabs)

```
User clicks layout toggle
    │
    ▼
setLayoutMode('tabs') → Zustand store
    │
    ├─ Update SQLite (user_settings table)
    ├─ Re-render PatientsPageUnified
    │
    ▼
State preserved (patient, visit, sessions remain intact)
```

---

## Key Benefits

### 1. **State Preservation**
When switching layouts, all patient data remains in memory (no data loss)

### 2. **No Code Duplication**
Before: 1,595 lines duplicated between VerticalLayout and TabsLayout
After: Single PatientsPageUnified component (705 lines)

### 3. **Data Loss Prevention**
`beforeunload` listener warns users before closing with unsaved draft sessions

### 4. **Performance**
- No database reload after saves
- Local state updated with returned IDs
- Prevents race conditions

---

## Migration History

**Date**: 2025-12-11
**Change**: Migrated from dual components to unified component with custom hooks

**Eliminated**:
- `VerticalLayout.tsx`
- `TabsLayout.tsx`

**Created**:
- `PatientsPageUnified.tsx`
- `usePatientRecord.ts`
- `useMasterData.ts`
- `usePatientFromURL.ts`

---

## Best Practices

### ✅ DO:
- Use `usePatientRecord()` for all patient data operations
- Use `useUIStore()` for UI preferences only
- Keep business logic in custom hooks
- Update local state after saves (don't reload from DB)

### ❌ DON'T:
- Don't put patient data in Zustand store
- Don't reload from database after every save
- Don't create new global state solutions without architectural review

---

## File Locations

```
src/
├── stores/
│   └── uiStore.ts                 # UI preferences (Zustand)
├── hooks/
│   ├── usePatientRecord.ts        # Patient data management
│   ├── useMasterData.ts           # Reference data
│   └── usePatientFromURL.ts       # URL-based loading
├── pages/
│   └── PatientsPageUnified.tsx    # Main patient record component
└── lib/
    └── storage/
        └── TauriSqliteRepository.ts  # Database access
```

---

## References

- See `CLAUDE.md` for full project architecture
- See `ARCHITECTURE.md` for system-level architecture
