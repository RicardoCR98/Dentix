# Types Reorganization Summary

**Date:** 2025-11-29
**Status:** ✅ Completed Successfully
**Build Status:** ✅ Passing

---

## What Was Done

### 1. Separated Database Types from Frontend UI Types

The `types.ts` file has been reorganized into two clear sections:

#### 📦 DATABASE TYPES (Lines 3-184)
**Purpose:** Types that map 1:1 with database tables and match Rust structs exactly
**Naming Convention:** All fields use `snake_case` to align with SQL and Rust

**Organized into subsections:**

- **CORE ENTITIES**
  - `Patient` - Patient demographics and medical info
  - `Visit` - Visit records with diagnosis and financials
  - `VisitProcedure` - Individual procedures per visit

- **MASTER DATA / CATALOGS**
  - `ProcedureTemplate` - Reusable procedure catalog
  - `Signer` - Doctors/dentists who sign documents
  - `DiagnosisOption` - Available diagnosis options
  - `ReasonType` - Visit reason categories

- **CONFIGURATION & SETTINGS**
  - `DoctorProfile` - Doctor and clinic profile
  - `UserSetting` - Application user settings

- **ATTACHMENTS**
  - `Attachment` - File attachments (DB-aligned)

- **TELEMETRY & OBSERVABILITY**
  - `TelemetryEvent` - Analytics events
  - `ErrorLog` - Error logging

- **SYNC & CDC**
  - `SyncQueueItem` - Change Data Capture queue

#### 🎨 FRONTEND UI TYPES (Lines 186-256)
**Purpose:** UI/Frontend-specific types that DO NOT map directly to database
**Usage:** Component state, props, and UI logic
**Key Difference:** These are helper types for frontend convenience

**Types:**

- **`ToothDx`** - Odontogram data structure (tooth → diagnoses mapping)
- **`SessionRow`** - Frontend representation of Visit with procedures (used in SessionsTable)
- **`ProcItem`** - Simplified procedure for UI (maps to VisitProcedure when saving)
- **`AttachmentFile`** - UI state for file upload/preview (maps to Attachment when saving)

### 2. Eliminated Legacy Types

**Removed:**
- ❌ `PatientRecord` - Was marked as "Legacy - may be removed", not used anywhere

**Kept (Active Use):**
- ✅ `SessionRow` - Used in 5 files (App.tsx, SessionsTable.tsx, etc.)
- ✅ `ProcItem` - Used in 4 files
- ✅ `AttachmentFile` - Used in 4 files

---

## Key Differences: Database vs Frontend Types

### Example 1: Attachment vs AttachmentFile

| Feature | `Attachment` (DB) | `AttachmentFile` (UI) |
|---------|-------------------|----------------------|
| Purpose | Database storage | File upload/preview UI |
| ID Type | `number?` | `string` (UUID) |
| Filename | `filename` | `name` |
| MIME Type | `mime_type` | `type` |
| Size | `size_bytes` | `size` |
| Patient/Visit | `patient_id`, `visit_id` | References via `db_id?` |
| Browser File | ❌ Not stored | `file?: File` |
| Preview URL | ❌ Not stored | `url: string` |
| Kind | `'radiograph' \| 'photo' \| 'document' \| 'other'` | ❌ Not tracked |

### Example 2: VisitProcedure vs ProcItem

| Feature | `VisitProcedure` (DB) | `ProcItem` (UI) |
|---------|----------------------|-----------------|
| Purpose | Database storage | SessionsTable UI |
| Fields | All DB fields (10+) | Simplified (6 fields) |
| Sort Order | ✅ `sort_order` | ❌ Not tracked |
| Timestamps | ✅ `created_at` | ❌ Not tracked |
| Visit Link | ✅ `visit_id` | ❌ Not tracked |

### Example 3: Visit vs SessionRow

| Feature | `Visit` (DB) | `SessionRow` (UI) |
|---------|--------------|-------------------|
| Purpose | Database storage | SessionsTable component |
| ID Type | `number?` | `string?` (temporary) or `number` (saved) |
| Visit ID | `id` | `visitId` (separate field) |
| Procedures | ❌ Separate table | ✅ Embedded as `items: ProcItem[]` |
| Auto Budget | ❌ Not tracked | ✅ `auto?: boolean` |
| All Visit Fields | ✅ All present | ⚠️ Subset only |

---

## Documentation Improvements

### Added JSDoc Comments

All Frontend UI types now have clear documentation:

```typescript
/**
 * SessionRow: Frontend representation of a Visit with its procedures
 * Used in SessionsTable component for financial session management
 * Note: In the backend, each session is stored as a Visit in the visits table
 */
export type SessionRow = { ... }
```

### Section Headers

- Clear section dividers with `// =========================`
- Subsection headers with `// -------- SUBSECTION --------`
- Explanatory comments for each major section

---

## Benefits

1. **✅ Clear Separation of Concerns**
   - Database types are clearly separated from UI types
   - Easy to identify which types map to DB tables

2. **✅ Better Documentation**
   - JSDoc comments explain purpose and usage
   - Clear notes on mapping relationships

3. **✅ Easier Maintenance**
   - Developers can quickly find the right type
   - No confusion about which type to use when

4. **✅ Removed Dead Code**
   - Eliminated unused `PatientRecord` type
   - Cleaner codebase

5. **✅ Preserved Functionality**
   - All active types kept intact
   - No breaking changes
   - All builds passing

---

## File Structure

```
DATABASE TYPES (snake_case, maps to DB/Rust)
├── CORE ENTITIES
│   ├── Patient
│   ├── Visit
│   └── VisitProcedure
├── MASTER DATA / CATALOGS
│   ├── ProcedureTemplate
│   ├── Signer
│   ├── DiagnosisOption
│   └── ReasonType
├── CONFIGURATION & SETTINGS
│   ├── DoctorProfile
│   └── UserSetting
├── ATTACHMENTS
│   └── Attachment
├── TELEMETRY & OBSERVABILITY
│   ├── TelemetryEvent
│   └── ErrorLog
└── SYNC & CDC
    └── SyncQueueItem

FRONTEND UI TYPES (UI-specific, does not map to DB)
├── ToothDx (odontogram data)
├── SessionRow (Visit + procedures for UI)
├── ProcItem (simplified VisitProcedure)
└── AttachmentFile (file upload state)
```

---

## Verification

### Build Status ✅
```bash
pnpm build
# Result: ✓ built in 7.50s
# All 1786 modules transformed successfully
```

### Type Usage Verified ✅
- `SessionRow` - Used in 5 files ✅
- `ProcItem` - Used in 4 files ✅
- `AttachmentFile` - Used in 4 files ✅
- `PatientRecord` - Removed (not used) ✅

### No Breaking Changes ✅
- All exports preserved
- All type definitions intact
- Only reorganization and documentation improvements

---

## When to Use Which Type

### Use DATABASE TYPES when:
- ✅ Reading from or writing to database
- ✅ Calling Tauri commands (Rust backend)
- ✅ Repository/service layer operations
- ✅ Need exact match with DB schema

### Use FRONTEND UI TYPES when:
- ✅ Component props and state
- ✅ Form data before saving
- ✅ Temporary UI state
- ✅ Displaying data in tables/lists
- ✅ File upload/preview handling

### Conversion Pattern:
```typescript
// Frontend → Database (when saving)
const visitProcedure: VisitProcedure = {
  ...procItem,  // ProcItem fields
  visit_id: visitId,
  sort_order: index,
  created_at: new Date().toISOString(),
};

// Database → Frontend (when loading)
const procItem: ProcItem = {
  id: visitProcedure.id,
  name: visitProcedure.name,
  unit_price: visitProcedure.unit_price,
  quantity: visitProcedure.quantity,
  subtotal: visitProcedure.subtotal,
  procedure_template_id: visitProcedure.procedure_template_id,
};
```

---

## Future Recommendations

1. **Consider Creating Converter Functions**
   - `AttachmentFile → Attachment` converter
   - `ProcItem → VisitProcedure` converter
   - Centralize conversion logic

2. **Type Guards**
   - Add type guard functions to check if types are saved/unsaved
   - Example: `isSavedSession(session: SessionRow): boolean`

3. **Strict Types**
   - Consider making required fields non-optional in some cases
   - Example: `patient_id` in Attachment should never be undefined

---

**Result:** Clean, well-organized, and well-documented type system ✅
