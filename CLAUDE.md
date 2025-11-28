# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture
- Frontend: React/TypeScript
- Backend: Rust
- Database: SQLite (backend), localStorage (frontend)

## Coding Standards
- Use TypeScript for all code
- Write the code, taking care to lock the database (SQLite).
- Follow ESLint config

## Project Overview

**Dentix** is a desktop dental clinic management system built with React, TypeScript, and Tauri. It's a 100% offline application that stores data locally in SQLite, providing patient management, odontogram (dental chart), visit tracking, and financial management for dental practices.

## Development Commands

### Running the Application

```bash
# Development mode (recommended - starts both frontend and Tauri backend)
pnpm tauri:dev

# Frontend only (for UI development without Tauri features)
pnpm dev
```

### Building

```bash
# Build for production (creates platform-specific installers)
pnpm tauri:build

# Frontend build only
pnpm build
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Preview production build
pnpm preview
```

## Architecture

### Frontend-Backend Communication

This is a **Tauri application** - frontend (React) communicates with backend (Rust) via:
- **`@tauri-apps/plugin-sql`**: Direct SQLite access from frontend
- **`@tauri-apps/plugin-fs`**: File system operations for attachments
- **`@tauri-apps/plugin-opener`**: Opening files with native OS applications

The frontend directly manages the SQLite database through the Tauri SQL plugin - there is NO REST API layer.

### Database Architecture

**File**: `clinic.db` (SQLite with WAL mode)
**Location**: Managed by Tauri's plugin system
**Migrations**: Located in `src-tauri/migrations/` and executed on app startup

**Schema hierarchy**:
```
patients (root entity)
  ├── visits (one visit per date)
  │     ├── sessions (financial records - budget, payment, balance)
  │     │     └── session_items (procedure line items)
  │     └── tooth_dx_json (odontogram data as JSON)
  └── attachments (files stored on disk, metadata in DB)
```

**Critical tables**:
- `patients`: Patient demographics, allergies, anamnesis
- `visits`: Visit records with reason, diagnosis, and tooth_dx_json (odontogram)
- `sessions`: Financial sessions linked to visits
- `session_items`: Individual procedure items within sessions
- `attachments`: File metadata (actual files stored in Documents/GreenAppleDental/attachments)
- `procedure_templates`: Reusable procedure catalog
- `signers`: Doctors/dentists list
- `reason_types`: Visit reason categories

**Migrations are managed** via TypeScript in `TauriSqliteRepository.ts` (see `runMigrations()` method).

### State Management Pattern

**No Redux/Zustand** - this app uses React's built-in state management:
- **Local state** (`useState`) in `App.tsx` for all application data
- **Prop drilling** to pass data to child components
- **Callbacks** passed down for child components to update parent state

**Key state in App.tsx**:
- `patient`: Current patient record
- `visit`: Current visit being edited
- `toothDx`: Odontogram selections (tooth number → diagnosis array mapping)
- `sessions`: Financial sessions array
- `attachments`: File attachments array
- `procedureTemplates`, `signers`, `reasonTypes`: Master data from database

### Data Flow for Save Operation

1. User clicks "Guardar Historia" → `handleSave()` in App.tsx
2. Validate patient data (name + doc_id required)
3. **Pre-save**: Save attachment files to disk BEFORE database transaction
4. Call `repo.saveVisitWithSessions()` with patient, visit, and sessions
5. Repository handles transaction: upsert patient → upsert visit → upsert sessions
6. Save attachment metadata to database
7. Update local state with returned IDs (no database reload for performance)

**Performance optimization**: The app avoids reloading from database after saves. Instead, it updates local state with returned IDs to prevent race conditions.

### File Storage Strategy

**Attachments** (radiographs, photos, documents):
- **Files stored**: `Documents/GreenAppleDental/attachments/p_{patientId}/{YYYY}/{MM}/{timestamp}_{random}_{filename}`
- **Metadata in DB**: `attachments` table stores filename, mime_type, bytes, storage_key
- **Access pattern**: When opening, resolve storage_key to absolute path and open with OS default app

## Component Architecture

### Main Application Component

**`App.tsx`** (720 lines): The main application component managing all state. This is intentionally a large component following the single-page application pattern.

**Key sections**:
1. Patient data form
2. Visit reason/motive
3. Odontogram (interactive dental chart)
4. Diagnosis (auto-generated from odontogram + manual notes)
5. Sessions table (financial tracking)
6. Attachments manager

### UI Component Library

Located in `src/components/ui/` - custom components built on **Radix UI primitives**:
- Button, Input, Textarea, Label
- Dialog, Popover, Toast
- Select, DatePicker, Checkbox
- Alert, Badge, Card, Table, Tabs

These follow the **shadcn/ui** pattern but are customized for this project.

### Theme System

**Providers**: `ThemeProvider` (wraps app) + `ToastProvider`
**Presets**: `light`, `dark` themes
**Fonts**: Inter, Poppins, Roboto, System
**Storage**: Theme settings in `localStorage`
**CSS Variables**: HSL-based color system (e.g., `hsl(var(--background))`)

Themes use CSS custom properties defined in `src/index.css` and toggled via `ThemePanel.tsx`.

## Key Domain Concepts

### Odontogram (Dental Chart)

- **Permanent teeth**: Numbered 11-48 (FDI notation)
- **Deciduous teeth**: Numbered 51-85
- **Data structure**: `ToothDx` type = `Record<string, string[]>` (tooth number → diagnosis array)
- **UI**: Interactive visual tooth selector in `Odontogram.tsx`
- **Auto-diagnosis**: Automatically generates text diagnosis from tooth selections

### Financial Sessions

**Business logic**:
- One visit can have multiple financial sessions
- Each session has: date, items (procedures), budget, discount, payment, balance
- Balance = budget - discount - payment
- Sessions persist across visits for tracking payment history

**Calculation**:
```typescript
budget = sum(item.sub) where item.sub = item.unit * item.qty
balance = budget - discount - payment
```

### Visit Reason Types

**Predefined categories**: Dolor, Control, Emergencia, Estetica, Otro
**Customizable**: Users can add/edit reason types via `ReasonTypeSelect` component
**Storage**: `reason_types` table in database

## Development Guidelines

### When Modifying Database Schema

1. Create new migration file in `src-tauri/migrations/00X_description.sql`
2. Update `TauriSqliteRepository.runMigrations()` to run new migration
3. Update TypeScript types in `src/lib/types.ts`
4. Update repository methods in `TauriSqliteRepository.ts`

### Performance Considerations

**Critical**: This app prioritizes instant UI responsiveness:
- Use SQLite WAL mode (already configured)
- Avoid reloading data from database after writes - update local state instead
- Use `Promise.all()` for parallel read operations (see `handleSelectPatient`)
- Debounce dialog data loading (150ms) to avoid race conditions with saves

**Database locks**: The app has careful lock management via:
```typescript
PRAGMA journal_mode = WAL;        // Concurrent reads
PRAGMA busy_timeout = 10000;      // 10s timeout
PRAGMA synchronous = NORMAL;      // Balance safety/speed
```

### Working with Attachments

Attachment files are NOT stored in the database - only metadata is stored. When adding attachment features:
1. Save file to disk via `saveAttachmentFile()` in `lib/files/attachments.ts`
2. Store metadata in `attachments` table
3. Use `storage_key` to retrieve files later
4. Open files via `openWithOS()` or `revealInOS()` helpers

### Keyboard Shortcuts

Implemented in `App.tsx` via `useEffect` + `keydown` listener:
- `Ctrl+S` / `Cmd+S`: Save
- `Ctrl+P` / `Cmd+P`: Print preview
- `Ctrl+K` / `Cmd+K`: Search patients
- `Ctrl+N` / `Cmd+N`: New patient record

When adding new shortcuts, add to `ShortcutsHelp.tsx` component.

### Toast Notifications

Use the `useToast()` hook from `ToastProvider`:
```typescript
const toast = useToast();
toast.success("Title", "Message");
toast.error("Title", "Error details");
toast.warning("Title", "Warning message");
```

## Project Structure Highlights

```
src/
├── App.tsx                          # Main application component (all state lives here)
├── main.tsx                         # React entry point
├── components/
│   ├── ui/                         # Radix-based UI primitives
│   ├── PatientForm.tsx             # Patient demographics form
│   ├── Odontogram.tsx              # Interactive dental chart
│   ├── DiagnosisArea.tsx           # Diagnosis text editor
│   ├── SessionsTable.tsx           # Financial sessions table
│   ├── Attachments.tsx             # File attachments manager
│   ├── ThemePanel.tsx              # Theme/font settings
│   └── [other domain components]
├── lib/
│   ├── storage/
│   │   └── TauriSqliteRepository.ts # Database access layer
│   ├── files/
│   │   └── attachments.ts           # File storage utilities
│   └── types.ts                     # TypeScript type definitions
└── theme/
    ├── ThemeProvider.tsx            # Theme context provider
    └── presets.ts                   # Theme configurations

src-tauri/
├── migrations/                      # SQL migrations (auto-run on startup)
├── src/
│   ├── main.rs                     # Tauri entry point
│   └── lib.rs                      # Rust backend code
└── tauri.conf.json                 # Tauri configuration
```

## Common Patterns

### Adding a New Master Data Table

1. Create migration SQL file with table structure
2. Add TypeScript type to `src/lib/types.ts`
3. Add repository methods to `TauriSqliteRepository.ts`:
   - `getXxxs()`: Fetch all records
   - `createXxx()`: Insert record
   - `updateXxx()`: Update record
   - `deleteXxx()`: Delete record
4. Add state in `App.tsx`
5. Create UI component for management (if needed)

### Adding a New Field to Patient/Visit

1. Create migration to add column
2. Update TypeScript type
3. Update repository `save` methods
4. Add input field to relevant form component
5. Update `handleSave()` in App.tsx to include new field

## Testing Notes

Currently **no test framework** is configured. The roadmap includes adding Vitest + React Testing Library in v0.2.0.

## Platform-Specific Notes

**Windows**: Uses `Documents` folder for attachments, WebView2 for rendering
**macOS**: Uses `~/Documents`, native WebKit
**Linux**: Uses `~/Documents`, WebKit2GTK

File paths use Tauri's cross-platform path APIs (`@tauri-apps/api/path`).
