# Codebase Organization - Dentix Desktop

## Project Structure Overview

```
dentix/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── ui/                  # Reusable UI primitives (Radix-based)
│   │   └── *.tsx                # Domain-specific components
│   ├── lib/                     # Core libraries and utilities
│   │   ├── storage/             # Data access layer
│   │   ├── files/               # File management utilities
│   │   ├── os/                  # OS-specific operations
│   │   ├── analytics/           # Analytics tracking
│   │   └── types.ts             # TypeScript type definitions
│   ├── hooks/                   # Custom React hooks
│   ├── theme/                   # Theme system
│   ├── assets/                  # Static assets (images, fonts)
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles
├── src-tauri/                   # Backend Rust application
│   ├── src/
│   │   ├── main.rs              # Tauri entry point
│   │   ├── lib.rs               # Library root
│   │   └── commands.rs          # Tauri command handlers
│   ├── migrations/              # SQL migration files
│   ├── capabilities/            # Tauri security capabilities
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── docs/                        # Documentation
├── public/                      # Public assets
├── package.json                 # Node dependencies
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── vite.config.ts              # Vite build configuration
└── eslint.config.js            # ESLint rules
```

## Frontend Structure (`src/`)

### Main Application

**`App.tsx`** (720 lines)
- **Purpose**: Main application component, contains all state management
- **Responsibilities**:
  - Patient state management
  - Visit state management
  - Odontogram (ToothDx) state
  - Financial sessions state
  - Attachments state
  - Master data (templates, signers, diagnosis options)
  - Event handlers for all operations
  - Keyboard shortcuts
- **Pattern**: Single-page application with prop drilling
- **State Management**: React `useState` hooks (no Redux/Zustand)

**`main.tsx`**
- React application entry point
- Renders `<App />` wrapped in providers (ThemeProvider, ToastProvider)
- Sets up strict mode for development

### Components Directory (`src/components/`)

#### Domain Components

| Component | Lines | Purpose | Key Features |
|-----------|-------|---------|--------------|
| **PatientForm.tsx** | ~200 | Patient demographics form | Name, DOC ID, phone, DOB, allergies, anamnesis |
| **Odontogram.tsx** | ~400 | Interactive dental chart | FDI notation (11-48, 51-85), tooth selection, diagnosis assignment |
| **DiagnosisArea.tsx** | ~150 | Diagnosis text editor | Auto-generated + manual diagnosis, textarea with formatting |
| **SessionsTable.tsx** | ~500 | Financial sessions table | Procedure items, budget/discount/payment, virtual scrolling |
| **Attachments.tsx** | ~300 | File attachments manager | Upload, preview, organize by date, open with OS |
| **SignerSelect.tsx** | ~150 | Doctor selection dropdown | Add/remove signers, manage active doctors |
| **ReasonTypeSelect.tsx** | ~150 | Visit reason selector | Predefined reasons, add custom reasons |
| **ThemePanel.tsx** | ~200 | Theme settings panel | Color schemes, fonts, font sizes |
| **PatientSearchDialog.tsx** | ~250 | Patient search modal | Keyboard navigation (Ctrl+K), fuzzy search |
| **VisitHistoryDrawer.tsx** | ~200 | Past visits sidebar | Timeline view, load previous visits |
| **PendingPaymentsDialog.tsx** | ~330 | Outstanding balances view | Sort by overdue, debt amounts, quick navigation |
| **DentalChart.tsx** | ~150 | Visual tooth diagram | SVG-based tooth visualization |
| **Section.tsx** | ~50 | Layout section wrapper | Consistent spacing and styling |
| **Layout.tsx** | ~100 | Main layout container | App header, footer, grid layout |
| **ShortcutsHelp.tsx** | ~100 | Keyboard shortcuts help | Documentation overlay |
| **ToastProvider.tsx** | ~150 | Toast notification system | Success, error, warning messages |
| **BrandBlock.tsx** | ~50 | Branding/logo component | Clinic name, logo display |

#### UI Primitives (`src/components/ui/`)

**Design System**: Based on Radix UI primitives with custom Tailwind styling

| Component | Purpose | Radix Primitive |
|-----------|---------|-----------------|
| **Button.tsx** | Primary/secondary/ghost buttons | - |
| **Input.tsx** | Text input with icons | - |
| **Textarea.tsx** | Multi-line text input | - |
| **Select.tsx** | Dropdown selection | @radix-ui/react-select |
| **Dialog.tsx** | Modal dialogs | @radix-ui/react-dialog |
| **Popover.tsx** | Floating popovers | @radix-ui/react-popover |
| **Toast.tsx** | Toast notifications | @radix-ui/react-toast |
| **DatePicker.tsx** | Date selection | @radix-ui/react-popover + date logic |
| **Label.tsx** | Form labels | @radix-ui/react-label |
| **Badge.tsx** | Status badges | - |
| **Card.tsx** | Content cards | - |
| **Table.tsx** | Data tables | - |
| **Tabs.tsx** | Tabbed interfaces | @radix-ui/react-tabs |
| **Alert.tsx** | Alert messages | - |
| **Checkbox.tsx** | Checkboxes | @radix-ui/react-checkbox |
| **Drawer.tsx** | Slide-out panels | @radix-ui/react-dialog (as drawer) |

**Styling Conventions**:
- CSS Variables: `hsl(var(--background))`, `hsl(var(--primary))`, etc.
- Tailwind utilities for spacing, sizing, layout
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Dark mode support via CSS variables

### Libraries Directory (`src/lib/`)

#### Storage Layer (`src/lib/storage/`)

**`TauriSqliteRepository.ts`** (300 lines)
- **Purpose**: Data access layer, abstracts Tauri invoke calls
- **Pattern**: Repository pattern
- **Key Methods**:

  **Patient Operations**:
  - `searchPatients(query: string): Promise<Patient[]>`
  - `findPatientById(id: number): Promise<Patient | null>`
  - `getAllPatients(): Promise<Patient[]>`

  **Visit Operations**:
  - `getVisitsByPatient(patientId: number): Promise<Visit[]>`
  - `getSessionsByPatient(patientId: number): Promise<VisitWithProcedures[]>`
  - `saveVisitWithSessions(payload): Promise<{ patient_id, visit_id }>`
  - `deleteVisit(visitId: number): Promise<void>`

  **Master Data**:
  - `getProcedureTemplates(): Promise<ProcedureTemplate[]>`
  - `saveProcedureTemplates(templates): Promise<void>`
  - `getSigners(): Promise<Signer[]>`
  - `createSigner(name): Promise<number>`
  - `deleteSignerdata(id): Promise<void>`
  - `getDiagnosisOptions(): Promise<DiagnosisOption[]>`
  - `saveDiagnosisOptions(options): Promise<void>`
  - `getReasonTypes(): Promise<ReasonType[]>`
  - `createReasonType(name): Promise<number>`

  **Attachments**:
  - `getAttachmentsByPatient(patientId): Promise<Attachment[]>`
  - `saveAttachment(attachment): Promise<number>`
  - `deleteAttachment(id): Promise<void>`

  **Settings**:
  - `getAllSettings(): Promise<Record<string, string>>`
  - `saveSetting(key, value, category): Promise<void>`

- **Implementation**: Uses `@tauri-apps/api/core invoke()` for IPC

#### File Management (`src/lib/files/`)

**`attachments.ts`**
- **Purpose**: File system operations for attachments
- **Key Functions**:
  - `saveAttachmentFile(patientId, file): Promise<{ storage_key, path }>`
  - `getAttachmentPath(storage_key): Promise<string>`
  - `deleteAttachmentFile(storage_key): Promise<void>`
  - `openWithOS(path): Promise<void>` - Opens file with default OS app
  - `revealInOS(path): Promise<void>` - Shows file in file explorer

**Storage Pattern**:
```
Documents/GreenAppleDental/attachments/
  p_{patient_id}/
    2025/
      01/
        1738195200000_abc123_radiografia.jpg
        1738195300000_def456_consent_form.pdf
```

#### OS Integration (`src/lib/os/`)

- Path helpers (using `@tauri-apps/api/path`)
- File dialog helpers (using `@tauri-apps/plugin-dialog`)
- OS-specific utilities

#### Analytics (`src/lib/analytics/`)

- Event tracking (currently placeholder for future telemetry)
- Error logging helpers

#### Types (`src/lib/types.ts`)

**Critical File** (225 lines)

**Section 1: DATABASE TYPES** (Lines 1-180)
Types that map 1:1 with database tables and Rust structs:

| Type | Fields | Purpose |
|------|--------|---------|
| **DoctorProfile** | 14 fields | Doctor account information |
| **Patient** | 11 fields | Patient demographics |
| **Visit** | 16 fields | Visit record (reason, diagnosis, financials) |
| **VisitProcedure** | 8 fields | Individual procedure items |
| **Attachment** | 10 fields | File attachment metadata |
| **ProcedureTemplate** | 6 fields | Procedure catalog |
| **Signer** | 5 fields | Doctor/signer list |
| **DiagnosisOption** | 7 fields | Diagnosis options for odontogram |
| **ReasonType** | 6 fields | Visit reason categories |
| **UserSetting** | 5 fields | Application settings |
| **TelemetryEvent** | 7 fields | Analytics events (future) |
| **ErrorLog** | 8 fields | Error tracking (future) |
| **SyncQueueItem** | 8 fields | Sync queue for CDC (future) |

**Section 2: FRONTEND UI TYPES** (Lines 181-225)

| Type | Purpose | Fields |
|------|---------|--------|
| **ToothDx** | Odontogram data | `Record<string, string[]>` (tooth → diagnoses) |
| **VisitWithProcedures** | Visit + procedures | `{ visit: Visit, items: VisitProcedure[] }` |
| **AttachmentFile** | File upload UI state | Browser File object, preview URL, metadata |

**Naming Convention**:
- Database types: snake_case fields (matches SQL/Rust)
- UI types: mixed case for frontend convenience

### Hooks Directory (`src/hooks/`)

**`useScrollLock.ts`**
- Prevents body scrolling when modals are open
- Cleanup on unmount

**`useDebounce.ts`**
- Debounces rapid state changes
- Used in search inputs

### Theme System (`src/theme/`)

**`ThemeProvider.tsx`**
- React context for theme state
- Applies CSS variables to document root
- Persists settings to localStorage

**`presets.ts`**
- Theme definitions: `light`, `dark`
- Color palettes in HSL format
- Font configurations: Inter, Poppins, Roboto, System

**CSS Variables**:
```css
--background
--foreground
--primary
--secondary
--accent
--destructive
--muted
--border
--input
--ring
--brand
```

### Styling (`src/index.css`)

- Global CSS reset
- Theme CSS variables
- Tailwind base/components/utilities
- Custom scrollbar styles
- Font-face declarations

## Backend Structure (`src-tauri/`)

### Rust Source (`src-tauri/src/`)

**`main.rs`** (100 lines)
- **Purpose**: Tauri application entry point
- **Responsibilities**:
  - Initialize SQLite connection pool
  - Configure WAL mode, busy timeout, synchronous mode
  - Register all Tauri commands
  - Configure plugins (SQL, FS, Opener)
  - Set up main window
  - Handle app lifecycle

**Key Initialization**:
```rust
let pool = SqlitePool::connect("sqlite:clinic.db?mode=rwc").await?;

// WAL mode for concurrent reads
sqlx::query("PRAGMA journal_mode = WAL").execute(&pool).await?;
sqlx::query("PRAGMA busy_timeout = 10000").execute(&pool).await?;
sqlx::query("PRAGMA synchronous = NORMAL").execute(&pool).await?;

// Run migrations
run_migrations(&pool).await?;
```

**`lib.rs`**
- Library root, re-exports modules
- Currently minimal (delegates to commands.rs)

**`commands.rs`** (1189 lines)
- **Purpose**: All Tauri command handlers
- **Structure**:
  - Struct definitions (lines 1-195)
  - Patient commands (lines 196-334)
  - Visit commands (lines 335-418)
  - Visit procedures commands (lines 419-619)
  - Complex save command (lines 620-810)
  - Procedure templates commands (lines 811-933)
  - Diagnosis options commands (lines 934-1015)
  - Signers commands (lines 1016-1084)
  - Reason types commands (lines 1085-1137)
  - Settings commands (lines 1138-1189)

**Rust Structs** (match TypeScript types exactly):
```rust
Patient, Visit, VisitProcedure, SessionRow,
ProcedureTemplate, DiagnosisOption, Signer, ReasonType,
DoctorProfile, Attachment, UserSetting,
TelemetryEvent, ErrorLog, SyncQueueItem,
SaveVisitPayload
```

**Key Command**: `save_visit_with_sessions()`
- Most complex command (lines 627-810)
- Transaction-based
- Upserts patient
- Upserts multiple visits (sessions)
- Calculates cumulative balances
- Deletes/inserts procedures
- Returns IDs for frontend state update

### Database Migrations (`src-tauri/migrations/`)

**`001_dentix_schema_final.sql`** (398 lines)
- Complete schema definition
- All tables, indexes, triggers
- Initial seed data
- Comments explaining design decisions

**Migration Execution**:
- Migrations run on app startup
- Idempotent (CREATE IF NOT EXISTS)
- No rollback needed (offline app, no multi-version deployments)

### Tauri Configuration (`src-tauri/tauri.conf.json`)

**Key Settings**:
- App identifier: `com.tauri.dev`
- Window title: "Dentix"
- Window size: 1400x900
- Security capabilities: SQL, FS, Opener plugins
- Build targets: Windows (MSI), macOS (DMG), Linux (DEB/AppImage)

### Capabilities (`src-tauri/capabilities/`)

**Security Model**: Tauri capabilities restrict what frontend can access

**`app.json`** and `default.json`**:
- Allowed Tauri commands (whitelist)
- File system access permissions
- SQL plugin permissions
- Opener plugin permissions

## Data Flow Patterns

### Component Hierarchy

```
App.tsx (state)
  ├── Layout
  │     ├── Section (Patient Form)
  │     │     └── PatientForm
  │     │           ├── Input (name, doc_id, etc.)
  │     │           ├── DatePicker (DOB)
  │     │           └── Textarea (anamnesis)
  │     │
  │     ├── Section (Visit Reason)
  │     │     └── ReasonTypeSelect
  │     │
  │     ├── Section (Odontogram)
  │     │     ├── Odontogram
  │     │     └── DentalChart
  │     │
  │     ├── Section (Diagnosis)
  │     │     └── DiagnosisArea
  │     │           └── Textarea
  │     │
  │     ├── Section (Financial Sessions)
  │     │     └── SessionsTable
  │     │           ├── Table
  │     │           └── Button (add session)
  │     │
  │     ├── Section (Attachments)
  │     │     └── Attachments
  │     │           └── File upload/list
  │     │
  │     └── ThemePanel
  │
  ├── PatientSearchDialog (Ctrl+K)
  ├── VisitHistoryDrawer
  ├── PendingPaymentsDialog
  └── ShortcutsHelp
```

### State Flow

**Top-Down (Props)**:
```
App.tsx
  patient → PatientForm
  visit → DiagnosisArea, Attachments
  toothDx → Odontogram
  sessions → SessionsTable
  procedureTemplates → SessionsTable
  signers → SignerSelect
```

**Bottom-Up (Callbacks)**:
```
PatientForm
  onChange → App.setPatient

Odontogram
  onToothDxChange → App.setToothDx

SessionsTable
  onSessionsChange → App.setSessions

Attachments
  onAttachmentsChange → App.setAttachments
```

### Data Access Flow

```
App.tsx
  ↓ uses
TauriSqliteRepository
  ↓ invoke()
@tauri-apps/api/core
  ↓ IPC (JSON over WebSocket)
Tauri Core (Rust)
  ↓ dispatch
commands.rs handler
  ↓ SQLx query
SQLite database
```

## Module Dependency Rules

### ✅ Allowed Dependencies

- **UI Components** → **UI Primitives**: ✅ Domain components use Radix-based primitives
- **App.tsx** → **Repository**: ✅ Main app calls data access layer
- **Repository** → **Tauri invoke**: ✅ Repository calls Rust backend
- **Components** → **Hooks**: ✅ Components use custom hooks
- **Components** → **Theme**: ✅ Components access theme context
- **Rust Commands** → **SQLx**: ✅ Commands query database directly

### ❌ Forbidden Dependencies

- **UI Components** → **Repository**: ❌ Components never call data layer directly
- **UI Components** → **Tauri invoke**: ❌ Components never invoke Rust commands
- **Rust** → **TypeScript**: ❌ Backend never imports frontend code
- **Frontend** → **SQL**: ❌ Frontend never executes SQL directly
- **UI Primitives** → **Domain Logic**: ❌ Primitives are pure UI, no business logic

## File Size Guidelines

| File Size | Category | Examples |
|-----------|----------|----------|
| < 100 lines | Small | UI primitives, utilities, types |
| 100-300 lines | Medium | Domain components, hooks, providers |
| 300-500 lines | Large | Complex components (Odontogram, SessionsTable) |
| 500+ lines | Very Large | App.tsx (720), commands.rs (1189) |

**Refactoring Threshold**: Files >500 lines should be considered for splitting unless they are central orchestrators (like App.tsx or commands.rs).

## Code Location Quick Reference

| Looking for... | Check here |
|----------------|------------|
| **Type definitions** | `src/lib/types.ts` |
| **Patient form** | `src/components/PatientForm.tsx` |
| **Odontogram logic** | `src/components/Odontogram.tsx` |
| **Financial calculations** | `src-tauri/src/commands.rs:627` (save_visit_with_sessions) |
| **Database schema** | `src-tauri/migrations/001_dentix_schema_final.sql` |
| **Data access** | `src/lib/storage/TauriSqliteRepository.ts` |
| **File uploads** | `src/lib/files/attachments.ts` |
| **Theme settings** | `src/theme/presets.ts`, `src/theme/ThemeProvider.tsx` |
| **UI primitives** | `src/components/ui/` |
| **Main state** | `src/App.tsx` (lines 80-100) |
| **Keyboard shortcuts** | `src/App.tsx` (lines 500-550) |
| **Save handler** | `src/App.tsx:handleSave()` |
| **Rust entry point** | `src-tauri/src/main.rs` |
| **Tauri commands** | `src-tauri/src/commands.rs` |
| **Build config** | `vite.config.ts`, `src-tauri/tauri.conf.json` |

## Testing Strategy (Future)

**Currently**: No test framework configured

**Roadmap (v0.2.0)**:
- **Frontend**: Vitest + React Testing Library
- **Backend**: Rust unit tests (`#[cfg(test)]`)
- **E2E**: Tauri WebDriver (future)

**Test Locations** (planned):
```
src/
  __tests__/           # Frontend unit tests
  components/__tests__/  # Component tests

src-tauri/src/
  tests/               # Rust unit tests
```

## Build Artifacts

### Development Build

```bash
pnpm dev                 # Frontend only (Vite dev server)
pnpm tauri:dev          # Full stack (Vite + Tauri)
```

**Output**:
- Frontend: http://localhost:5173 (Vite HMR)
- Backend: Tauri window with dev tools enabled

### Production Build

```bash
pnpm tauri:build
```

**Output Locations**:
- **Windows**: `src-tauri/target/release/bundle/msi/Dentix_0.1.0_x64_en-US.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/Dentix_0.1.0_x64.dmg`
- **Linux**: `src-tauri/target/release/bundle/deb/dentix_0.1.0_amd64.deb`

**Bundle Contents**:
- Compiled Rust binary (3-5 MB)
- Bundled frontend assets (HTML, JS, CSS)
- Embedded WebView libraries
- Migration SQL files

---

**Document Version**: 1.0
**Last Updated**: 2025-11-29
**Maintained By**: Development Team
