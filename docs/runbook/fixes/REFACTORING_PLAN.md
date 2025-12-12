# Schema Alignment Refactoring Plan

## Executive Summary

This plan addresses the critical misalignment between the database schema, Rust structs, and TypeScript types that resulted from a complete schema migration without corresponding type updates.

**Goal**: Ensure full alignment across three layers:
1. SQL Schema (source of truth) →
2. Rust Structs (backend serialization) →
3. TypeScript Types (frontend contracts)

---

## Current State Analysis

### Layer Comparison Matrix

| SQL Table | Rust Struct | TypeScript Type | Status |
|-----------|-------------|-----------------|--------|
| `doctor_profile` | ❌ Missing | ❌ Missing | **NEW - Not Implemented** |
| `patients` | ✅ Patient | ✅ Patient | **Aligned** |
| `visits` | ✅ Visit | ✅ Visit | **Aligned** |
| `visit_procedures` | ✅ VisitProcedure | ✅ VisitProcedure | **Aligned** |
| `procedure_templates` | ✅ ProcedureTemplate | ✅ ProcedureTemplate | **Aligned** |
| `signers` | ✅ Signer | ✅ Signer | **Aligned** |
| `diagnosis_options` | ✅ DiagnosisOption | ✅ DiagnosisOption | **Aligned** |
| `reason_types` | ✅ ReasonType | ✅ ReasonType | **Aligned** |
| `attachments` | ❌ Missing | ⚠️ Partial (`AttachmentFile`) | **Misaligned** |
| `user_settings` | ❌ Missing | ❌ Missing | **NEW - Not Implemented** |
| `telemetry_events` | ❌ Missing | ❌ Missing | **NEW - Not Implemented** |
| `error_logs` | ❌ Missing | ❌ Missing | **NEW - Not Implemented** |
| `sync_queue` | ❌ Missing | ❌ Missing | **NEW - Not Implemented** |

### Issues Identified

#### 1. Missing Types (High Priority)

**Tables without corresponding types:**
- `doctor_profile` - Doctor/clinic metadata (13 fields)
- `user_settings` - Application settings (4 fields)
- `telemetry_events` - Analytics events (6 fields)
- `error_logs` - Error tracking (7 fields)
- `sync_queue` - Change Data Capture for sync (8 fields)

#### 2. Partial Implementation (High Priority)

**Attachments Type Mismatch:**
- SQL Schema has: `id`, `patient_id`, `visit_id`, `kind`, `filename`, `mime_type`, `size_bytes`, `storage_key`, `note`, `created_at`
- Current `AttachmentFile` type has: `id`, `name`, `size`, `type`, `file?`, `url`, `uploadDate`, `storage_key?`, `db_id?`
- **Problem**: Frontend type doesn't match database structure

#### 3. Legacy Types (Low Priority)

**Types that may be deprecated:**
- `SessionRow` - Frontend representation, but may overlap with `Visit`
- `ProcItem` - Simplified version of `VisitProcedure`
- `PatientRecord` - Aggregation type marked as "Legacy - may be removed"

---

## Detailed Schema Definitions

### NEW TYPES TO ADD

#### 1. DoctorProfile

**SQL Schema:**
```sql
CREATE TABLE doctor_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  clinic_name TEXT,
  clinic_hours TEXT,
  clinic_slogan TEXT,
  phone TEXT,
  location TEXT,
  app_version TEXT,
  agreed_to_terms BOOLEAN DEFAULT 0,
  last_sync TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Required Rust Struct:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoctorProfile {
    pub id: Option<i64>,
    pub doctor_id: String,
    pub name: String,
    pub email: Option<String>,
    pub clinic_name: Option<String>,
    pub clinic_hours: Option<String>,
    pub clinic_slogan: Option<String>,
    pub phone: Option<String>,
    pub location: Option<String>,
    pub app_version: Option<String>,
    pub agreed_to_terms: Option<bool>,
    pub last_sync: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

**Required TypeScript Type:**
```typescript
export type DoctorProfile = {
  id?: number;
  doctor_id: string;
  name: string;
  email?: string;
  clinic_name?: string;
  clinic_hours?: string;
  clinic_slogan?: string;
  phone?: string;
  location?: string;
  app_version?: string;
  agreed_to_terms?: boolean;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
};
```

#### 2. Attachment (Database-Aligned)

**SQL Schema:**
```sql
CREATE TABLE attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  visit_id INTEGER,
  kind TEXT NOT NULL CHECK (kind IN ('radiograph', 'photo', 'document', 'other')),
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  storage_key TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);
```

**Required Rust Struct:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub visit_id: Option<i64>,
    pub kind: String, // 'radiograph' | 'photo' | 'document' | 'other'
    pub filename: String,
    pub mime_type: Option<String>,
    pub size_bytes: Option<i64>,
    pub storage_key: String,
    pub note: Option<String>,
    pub created_at: Option<String>,
}
```

**Required TypeScript Type:**
```typescript
export type Attachment = {
  id?: number;
  patient_id: number;
  visit_id?: number;
  kind: 'radiograph' | 'photo' | 'document' | 'other';
  filename: string;
  mime_type?: string;
  size_bytes?: number;
  storage_key: string;
  note?: string;
  created_at?: string;
};
```

**Note**: Keep `AttachmentFile` as a separate frontend-only type for file upload UI state

#### 3. UserSetting

**SQL Schema:**
```sql
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT DEFAULT 'general',
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Required Rust Struct:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSetting {
    pub id: Option<i64>,
    pub key: String,
    pub value: Option<String>,
    pub category: Option<String>,
    pub updated_at: Option<String>,
}
```

**Required TypeScript Type:**
```typescript
export type UserSetting = {
  id?: number;
  key: string;
  value?: string;
  category?: string;
  updated_at?: string;
};
```

#### 4. TelemetryEvent

**SQL Schema:**
```sql
CREATE TABLE telemetry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,
  timestamp TEXT DEFAULT (datetime('now')),
  sent BOOLEAN DEFAULT 0,
  sent_at TEXT
);
```

**Required Rust Struct:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEvent {
    pub id: Option<i64>,
    pub doctor_id: String,
    pub event_type: String,
    pub event_data: Option<String>,
    pub timestamp: Option<String>,
    pub sent: Option<bool>,
    pub sent_at: Option<String>,
}
```

**Required TypeScript Type:**
```typescript
export type TelemetryEvent = {
  id?: number;
  doctor_id: string;
  event_type: string;
  event_data?: string;
  timestamp?: string;
  sent?: boolean;
  sent_at?: string;
};
```

#### 5. ErrorLog

**SQL Schema:**
```sql
CREATE TABLE error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  context TEXT,
  timestamp TEXT DEFAULT (datetime('now')),
  sent BOOLEAN DEFAULT 0
);
```

**Required Rust Struct:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorLog {
    pub id: Option<i64>,
    pub doctor_id: Option<String>,
    pub error_type: String,
    pub error_message: Option<String>,
    pub stack_trace: Option<String>,
    pub context: Option<String>,
    pub timestamp: Option<String>,
    pub sent: Option<bool>,
}
```

**Required TypeScript Type:**
```typescript
export type ErrorLog = {
  id?: number;
  doctor_id?: string;
  error_type: string;
  error_message?: string;
  stack_trace?: string;
  context?: string;
  timestamp?: string;
  sent?: boolean;
};
```

#### 6. SyncQueueItem

**SQL Schema:**
```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  synced BOOLEAN DEFAULT 0,
  synced_at TEXT
);
```

**Required Rust Struct:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: Option<i64>,
    pub table_name: String,
    pub record_id: i64,
    pub operation: String, // 'INSERT' | 'UPDATE' | 'DELETE'
    pub payload: Option<String>,
    pub created_at: Option<String>,
    pub synced: Option<bool>,
    pub synced_at: Option<String>,
}
```

**Required TypeScript Type:**
```typescript
export type SyncQueueItem = {
  id?: number;
  table_name: string;
  record_id: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload?: string;
  created_at?: string;
  synced?: boolean;
  synced_at?: string;
};
```

---

## Implementation Plan

### Phase 1: Add Rust Structs (Backend Layer)
**File**: `src-tauri/src/commands.rs`

1. Add all 6 missing structs with proper Serde annotations
2. Verify field types match SQL schema exactly (especially i64 vs String, Option types)
3. Ensure all structs derive `Debug, Clone, Serialize, Deserialize`
4. Run `cargo check` to verify compilation

**Estimated Changes**: ~150 lines

### Phase 2: Add TypeScript Types (Frontend Layer)
**File**: `src/lib/types.ts`

1. Add all 6 missing types
2. Add `Attachment` type (database-aligned)
3. Keep existing `AttachmentFile` but add comment clarifying it's UI-only
4. Group types logically with clear section headers
5. Add JSDoc comments explaining each type's purpose

**Estimated Changes**: ~100 lines

### Phase 3: Update TauriSqliteRepository (Data Layer)
**File**: `src/lib/storage/TauriSqliteRepository.ts`

This requires careful analysis after types are added. Potential updates:
1. Add CRUD methods for new tables (if needed by UI)
2. Update existing queries to handle new fields
3. Ensure proper type annotations using new types

**Estimated Changes**: To be determined after Phase 1-2 completion

### Phase 4: Update Application Code (UI Layer)

Files that may need updates:
1. **App.tsx** - If using any new types
2. **Attachments.tsx** - Update to use `Attachment` type from database
3. Any components using old field names (already mostly fixed)

**Estimated Changes**: Minimal, most field name issues already resolved

### Phase 5: Testing & Validation

1. **Type Safety Check**: Run `npm run build` - should compile without errors
2. **Runtime Check**: Run `pnpm tauri:dev` - verify no runtime type errors
3. **Database Check**: Verify all CRUD operations work correctly
4. **Data Flow Check**: Test full user workflows (create patient, add visit, save, etc.)

---

## Risk Assessment

### Low Risk ✅
- Adding new types that aren't yet used (Phases 1-2)
- Existing aligned types (Patient, Visit, etc.) don't need changes

### Medium Risk ⚠️
- Attachments refactoring - currently in use, need migration strategy
- TauriSqliteRepository updates - must maintain backward compatibility

### High Risk 🚨
- None identified - changes are additive, not breaking

---

## Migration Strategy for Attachments

**Problem**: Current `AttachmentFile` type is in use but doesn't match DB schema

**Solution**: Two-type approach
1. **`Attachment`** (new) - Matches database schema, used for DB operations
2. **`AttachmentFile`** (existing) - UI state type for file uploads/previews

**Conversion Layer**:
```typescript
// Helper to convert DB Attachment to UI AttachmentFile
function attachmentToFile(att: Attachment): AttachmentFile {
  return {
    id: att.id!.toString(),
    name: att.filename,
    size: att.size_bytes || 0,
    type: att.mime_type || '',
    url: '', // resolve from storage_key
    uploadDate: att.created_at || '',
    storage_key: att.storage_key,
    db_id: att.id,
  };
}

// Helper to create Attachment from AttachmentFile
function fileToAttachment(file: AttachmentFile, patient_id: number, visit_id?: number): Attachment {
  return {
    patient_id,
    visit_id,
    kind: 'document', // or determine from mime_type
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    storage_key: file.storage_key || '',
    note: undefined,
  };
}
```

---

## Success Criteria

✅ All tables in SQL schema have corresponding Rust structs
✅ All Rust structs have corresponding TypeScript types
✅ All types use consistent snake_case naming
✅ Frontend code compiles without type errors
✅ Backend code compiles without type errors
✅ Application runs without runtime type errors
✅ All existing features continue to work

---

## Rollback Plan

If issues arise during implementation:
1. **Phase 1-2**: Simply revert commits (no runtime impact)
2. **Phase 3-4**: Revert to previous TauriSqliteRepository version
3. **Full Rollback**: Git revert to commit before refactoring started

---

## Next Steps

1. **Review & Approve** this plan
2. **Execute Phase 1** - Add Rust structs
3. **Execute Phase 2** - Add TypeScript types
4. **Assess Phase 3 needs** - Determine TauriSqliteRepository updates
5. **Execute Phase 4** - Update application code
6. **Execute Phase 5** - Testing

**Estimated Total Time**: 2-3 hours of focused work

---

## Questions for Consideration

1. **Do we need CRUD operations for all new tables immediately?**
   - `doctor_profile`, `user_settings` - Likely yes (app settings)
   - `telemetry_events`, `error_logs`, `sync_queue` - Likely no (background operations)

2. **Should we remove legacy types now or later?**
   - `PatientRecord` is marked legacy - safe to remove?
   - `SessionRow` and `ProcItem` are actively used - keep for now

3. **Attachment migration timing**
   - Should we migrate attachments code immediately or in separate effort?

---

**Plan Status**: ✅ Ready for Review and Approval
