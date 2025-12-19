# Coding Standards - Oklus Desktop

## Overview

This document defines the coding standards, conventions, and best practices for the Oklus Desktop project. All contributors must follow these guidelines to maintain code quality and consistency.

## TypeScript / React Standards

### Code Style

**Linter**: ESLint with TypeScript ESLint
**Configuration**: `eslint.config.js`

**Enabled Rules**:
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks` recommended-latest
- `eslint-plugin-react-refresh` vite config

**ECMAScript Version**: ES2020
**Globals**: Browser environment

### Running Linter

```bash
pnpm lint              # Check for errors
pnpm lint --fix        # Auto-fix issues
```

### Naming Conventions

#### Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| **React Components** | PascalCase.tsx | `PatientForm.tsx`, `Odontogram.tsx` |
| **UI Primitives** | PascalCase.tsx | `Button.tsx`, `Dialog.tsx` |
| **Hooks** | camelCase.ts | `useScrollLock.ts`, `useDebounce.ts` |
| **Utilities** | camelCase.ts | `attachments.ts`, `cn.ts` |
| **Types** | camelCase.ts | `types.ts` |
| **Directories** | lowercase | `components/`, `lib/`, `hooks/` |

#### Variables and Functions

```typescript
// Constants - SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_THEME = 'dark';

// Variables - camelCase
const patientName = 'John Doe';
let visitCount = 0;

// Functions - camelCase (verb-first)
function calculateBalance(budget: number, discount: number, payment: number): number {
  return budget - discount - payment;
}

// Event handlers - handle prefix
const handleSave = () => { /* ... */ };
const handlePatientSelect = (patient: Patient) => { /* ... */ };

// Boolean variables - is/has/should prefix
const isActive = true;
const hasAllergy = patient.allergy_detail !== null;
const shouldShowDialog = open && patient !== null;

// Async functions - async suffix (optional but clear)
async function loadPatientAsync(id: number): Promise<Patient | null> {
  return await repo.findPatientById(id);
}
```

#### React Components

```typescript
// Component names - PascalCase, descriptive nouns
export default function PatientForm({ patient, onChange }: PatientFormProps) {
  // Component body
}

// Props interface - ComponentName + Props suffix
interface PatientFormProps {
  patient: Patient | null;
  onChange: (patient: Patient) => void;
}

// State variables - descriptive names
const [patient, setPatient] = useState<Patient | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

#### Types and Interfaces

```typescript
// Types - PascalCase
export type Patient = { /* ... */ };
export type Visit = { /* ... */ };
export type ToothDx = Record<string, string[]>;

// Interfaces - PascalCase (prefer type for data, interface for contracts)
interface Repository {
  findPatientById(id: number): Promise<Patient | null>;
  savePatient(patient: Patient): Promise<number>;
}

// Enums - PascalCase for enum, SCREAMING_SNAKE_CASE for values
enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
```

### Type Safety Rules

#### ✅ Do This

```typescript
// 1. Explicit return types for functions
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  return today.getFullYear() - dob.getFullYear();
}

// 2. Strict null checks
const patient: Patient | null = await repo.findPatientById(id);
if (patient === null) {
  console.error('Patient not found');
  return;
}
// Now patient is Patient (narrowed type)

// 3. Use type guards
function isVisitSaved(visit: Visit): visit is Visit & { id: number } {
  return visit.is_saved === true && visit.id !== undefined;
}

// 4. Discriminated unions for state
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Patient[] }
  | { status: 'error'; error: string };

// 5. Const assertions for literals
const REASON_TYPES = ['Dolor', 'Control', 'Emergencia'] as const;
type ReasonType = typeof REASON_TYPES[number]; // 'Dolor' | 'Control' | 'Emergencia'
```

#### ❌ Don't Do This

```typescript
// ❌ No 'any' type (use 'unknown' if truly unknown)
function processData(data: any) { /* ... */ }

// ✅ Use unknown and type guard
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Process data
  }
}

// ❌ No implicit any
const items = []; // ❌ Type is any[]

// ✅ Explicit type
const items: VisitProcedure[] = [];

// ❌ No type assertions without validation
const patient = data as Patient; // ❌ Unsafe

// ✅ Validate before asserting
if (isValidPatient(data)) {
  const patient = data as Patient; // ✅ Safe after validation
}

// ❌ No optional chaining abuse
const name = patient?.visit?.procedures?.[0]?.name; // ❌ Too deep

// ✅ Check at appropriate level
if (patient?.visit?.procedures && patient.visit.procedures.length > 0) {
  const name = patient.visit.procedures[0].name;
}
```

### Component Structure

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Patient } from '../lib/types';

// 1. Props interface
interface PatientFormProps {
  patient: Patient | null;
  onChange: (patient: Patient) => void;
  onSave: () => void;
}

// 2. Component definition
export default function PatientForm({ patient, onChange, onSave }: PatientFormProps) {
  // 3. State hooks (group related state)
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 4. Effects (with clear dependencies)
  useEffect(() => {
    if (patient === null) {
      setIsEditing(false);
    }
  }, [patient]);

  // 5. Callbacks (memoized when passed to children)
  const handleNameChange = useCallback((value: string) => {
    if (patient) {
      onChange({ ...patient, full_name: value });
    }
  }, [patient, onChange]);

  // 6. Helper functions (local to component)
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!patient?.full_name) {
      newErrors.full_name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 7. Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave();
    }
  };

  // 8. Early returns
  if (patient === null) {
    return <div>No patient selected</div>;
  }

  // 9. Main render
  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={patient.full_name}
        onChange={(e) => handleNameChange(e.target.value)}
        error={errors.full_name}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}
```

### Import Organization

```typescript
// 1. External dependencies (React, libraries)
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

// 2. Internal UI components
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';

// 3. Internal domain components
import PatientForm from './PatientForm';
import Odontogram from './Odontogram';

// 4. Utilities and helpers
import { cn } from '../lib/cn';
import { formatDate } from '../lib/formatters';

// 5. Types
import type { Patient, Visit, ToothDx } from '../lib/types';

// 6. Styles (if any)
import './styles.css';
```

### State Management Patterns

```typescript
// ✅ Lift state to common ancestor (current pattern)
function App() {
  const [patient, setPatient] = useState<Patient | null>(null);

  return (
    <>
      <PatientForm patient={patient} onChange={setPatient} />
      <VisitHistory patient={patient} />
    </>
  );
}

// ✅ Use callbacks for child updates
interface ChildProps {
  value: string;
  onChange: (value: string) => void; // Callback pattern
}

// ❌ Don't use prop drilling beyond 2-3 levels
// If needed, consider:
// - Component composition
// - Context API (for theme, auth, etc.)
// - Lifting state higher
```

### Error Handling

```typescript
// ✅ Try-catch for async operations
async function loadPatient(id: number) {
  try {
    const patient = await repo.findPatientById(id);
    if (patient === null) {
      toast.error('Patient not found', `No patient with ID ${id}`);
      return;
    }
    setPatient(patient);
  } catch (error) {
    console.error('Failed to load patient:', error);
    toast.error('Error loading patient', error instanceof Error ? error.message : 'Unknown error');
  }
}

// ✅ Validate user input
function validatePatient(patient: Patient): string[] {
  const errors: string[] = [];
  if (!patient.full_name.trim()) {
    errors.push('Name is required');
  }
  if (!patient.doc_id.trim()) {
    errors.push('Document ID is required');
  }
  if (!patient.phone.trim()) {
    errors.push('Phone is required');
  }
  return errors;
}
```

## Rust Standards

### Code Style

**Formatter**: `rustfmt`
**Linter**: `clippy`

**Running Tools**:
```bash
cargo fmt              # Format code
cargo clippy           # Lint code
cargo clippy --fix     # Auto-fix issues
```

### Naming Conventions

#### Rust Conventions (snake_case for most things)

```rust
// Structs - PascalCase
pub struct Patient {
    pub id: Option<i64>,
    pub full_name: String,
    pub doc_id: String,
}

// Enums - PascalCase for enum, PascalCase for variants
pub enum PatientStatus {
    Active,
    Inactive,
}

// Functions - snake_case
pub async fn find_patient_by_id(
    db_pool: State<'_, DbPool>,
    id: i64,
) -> Result<Option<Patient>, String> {
    // Implementation
}

// Constants - SCREAMING_SNAKE_CASE
const MAX_QUERY_TIMEOUT: u64 = 10_000;
const DEFAULT_PAGE_SIZE: usize = 50;

// Module names - snake_case
mod database_utils;
mod patient_repository;
```

#### Tauri Command Naming

```rust
// Commands - snake_case, descriptive verbs
#[tauri::command]
pub async fn search_patients(/* ... */) -> Result<Vec<Patient>, String> { }

#[tauri::command]
pub async fn find_patient_by_id(/* ... */) -> Result<Option<Patient>, String> { }

#[tauri::command]
pub async fn upsert_patient(/* ... */) -> Result<i64, String> { }

#[tauri::command]
pub async fn delete_visit(/* ... */) -> Result<(), String> { }

// Pattern: {verb}_{noun} or {verb}_{noun}_by_{criteria}
// - get_*, find_*, search_* for reads
// - create_*, save_*, upsert_* for writes
// - delete_*, remove_* for deletions
```

### Error Handling

```rust
// ✅ Use Result<T, E> for operations that can fail
pub async fn find_patient_by_id(
    db_pool: State<'_, DbPool>,
    id: i64,
) -> Result<Option<Patient>, String> {
    let pool = db_pool.0.lock().await;

    let row = sqlx::query(/* ... */)
        .bind(id)
        .fetch_optional(&*pool)
        .await
        .map_err(|e| e.to_string())?; // Convert SQLx error to String

    Ok(row.map(|r| Patient { /* ... */ }))
}

// ✅ Handle errors gracefully, return user-friendly messages
pub async fn save_patient(patient: Patient) -> Result<i64, String> {
    // Validate input
    if patient.full_name.trim().is_empty() {
        return Err("Patient name cannot be empty".to_string());
    }

    // Execute operation
    let result = sqlx::query(/* ... */)
        .execute(&*pool)
        .await
        .map_err(|e| format!("Failed to save patient: {}", e))?;

    Ok(result.last_insert_rowid())
}

// ❌ Don't use unwrap() or expect() in production code
let patient = find_patient_by_id(1).await.unwrap(); // ❌ Can panic

// ✅ Use ? operator or match
let patient = find_patient_by_id(1).await?; // ✅ Propagates error
```

### Database Query Patterns

```rust
// ✅ Use bind parameters (prevent SQL injection)
sqlx::query("SELECT * FROM patients WHERE id = ?1")
    .bind(id)
    .fetch_one(&pool)
    .await?;

// ❌ Don't concatenate SQL strings
let query = format!("SELECT * FROM patients WHERE id = {}", id); // ❌ SQL injection risk

// ✅ Transaction pattern for multi-step operations
let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

// Step 1: Upsert patient
sqlx::query("INSERT INTO patients (...) VALUES (...)")
    .execute(&mut *tx)
    .await?;

// Step 2: Upsert visit
sqlx::query("INSERT INTO visits (...) VALUES (...)")
    .execute(&mut *tx)
    .await?;

// Commit transaction
tx.commit().await.map_err(|e| e.to_string())?;
```

### Type Alignment with TypeScript

```rust
// ✅ Match TypeScript types exactly (use Serde)
#[derive(Debug, Serialize, Deserialize)]
pub struct Patient {
    pub id: Option<i64>,           // TypeScript: id?: number
    pub full_name: String,         // TypeScript: full_name: string
    pub doc_id: String,            // TypeScript: doc_id: string
    pub email: Option<String>,     // TypeScript: email?: string
    pub phone: String,             // TypeScript: phone: string
    pub date_of_birth: String,     // TypeScript: date_of_birth: string (ISO date)
    pub status: Option<String>,    // TypeScript: status?: 'active' | 'inactive'
}

// ✅ Use snake_case for struct fields (matches DB and TypeScript database types)
// Serde will serialize to JSON with snake_case automatically
```

## SQL Standards

### Table Naming

```sql
-- Tables - snake_case, plural nouns
CREATE TABLE patients (...);
CREATE TABLE visits (...);
CREATE TABLE visit_procedures (...);
CREATE TABLE procedure_templates (...);

-- Junction tables - {table1}_{table2}
CREATE TABLE user_roles (...);

-- Lookup tables - {entity}_types or {entity}_options
CREATE TABLE reason_types (...);
CREATE TABLE diagnosis_options (...);
```

### Column Naming

```sql
-- Columns - snake_case
CREATE TABLE patients (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    doc_id TEXT UNIQUE NOT NULL,
    date_of_birth TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Foreign keys - {referenced_table}_id
patient_id INTEGER REFERENCES patients(id)
visit_id INTEGER REFERENCES visits(id)
procedure_template_id INTEGER REFERENCES procedure_templates(id)

-- Booleans - use INTEGER (0/1), descriptive names with is_/has_ prefix
is_saved INTEGER DEFAULT 0
is_active INTEGER DEFAULT 1
has_allergy INTEGER DEFAULT 0

-- Timestamps - {action}_at pattern
created_at TEXT NOT NULL DEFAULT (datetime('now'))
updated_at TEXT NOT NULL DEFAULT (datetime('now'))
deleted_at TEXT  -- For soft deletes
sent_at TEXT     -- For async operations
```

### Index Naming

```sql
-- Pattern: idx_{table}_{column(s)}
CREATE INDEX idx_patients_doc_id ON patients(doc_id);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_date ON visits(date);

-- Composite indexes
CREATE INDEX idx_visits_patient_date ON visits(patient_id, date);

-- Unique indexes (if not using UNIQUE constraint)
CREATE UNIQUE INDEX idx_patients_email ON patients(email);
```

### Trigger Naming

```sql
-- Pattern: trg_{table}_{action}
CREATE TRIGGER trg_patients_updated_at
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
  UPDATE patients SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

## Testing Standards

### Current Status

⚠️ **No test framework configured yet**

### Planned Testing Strategy (v0.2.0)

#### Frontend Testing

**Framework**: Vitest + React Testing Library

**What to Test**:

1. **Critical Components** (must have tests):
   - PatientForm - form validation, data binding
   - Odontogram - tooth selection, diagnosis assignment
   - SessionsTable - financial calculations, add/remove items
   - Attachments - file upload, delete operations

2. **Utility Functions** (must have tests):
   - `src/lib/files/attachments.ts` - file operations
   - `src/lib/storage/TauriSqliteRepository.ts` - data access (mocked)
   - Financial calculation helpers

3. **Hooks** (should have tests):
   - `useScrollLock` - body scroll behavior
   - `useDebounce` - debounce timing

**Test Structure**:
```typescript
// src/components/__tests__/PatientForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PatientForm from '../PatientForm';

describe('PatientForm', () => {
  it('should render patient name input', () => {
    const mockOnChange = vi.fn();
    render(<PatientForm patient={null} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('should call onChange when name is updated', () => {
    const mockOnChange = vi.fn();
    const patient = { full_name: 'John', /* ... */ };
    render(<PatientForm patient={patient} onChange={mockOnChange} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Jane Doe' },
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Jane Doe' })
    );
  });
});
```

#### Backend Testing

**Framework**: Rust built-in testing (`#[cfg(test)]`)

**What to Test**:

1. **Database Operations** (unit tests with in-memory SQLite):
   - Patient CRUD operations
   - Visit save with transactions
   - Financial calculations (cumulative balance)

2. **Business Logic**:
   - Balance calculations
   - Snapshot denormalization
   - Validation logic

**Test Structure**:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        // Run migrations
        sqlx::query(include_str!("../migrations/001_dentix_schema_final.sql"))
            .execute(&pool)
            .await
            .unwrap();
        pool
    }

    #[tokio::test]
    async fn test_upsert_patient_creates_new_patient() {
        let pool = setup_test_db().await;

        let patient = Patient {
            id: None,
            full_name: "John Doe".to_string(),
            doc_id: "1234567890".to_string(),
            phone: "0991234567".to_string(),
            date_of_birth: "1990-01-01".to_string(),
            // ... other fields
        };

        let result = upsert_patient(/* args */).await;

        assert!(result.is_ok());
        assert!(result.unwrap() > 0); // Returns new ID
    }

    #[tokio::test]
    async fn test_calculate_cumulative_balance() {
        // Test financial calculation logic
        let balance1 = 100.0;
        let balance2 = 50.0;
        let expected = 150.0;

        let cumulative = balance1 + balance2;

        assert_eq!(cumulative, expected);
    }
}
```

### Test Coverage Goals

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Financial calculations | 100% | Critical |
| Data access layer | 80%+ | High |
| Form validation | 80%+ | High |
| UI components | 60%+ | Medium |
| Utility functions | 80%+ | Medium |

## Git Commit Standards

### Conventional Commits

**Format**: `<type>(<scope>): <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no functional change)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples**:
```bash
feat(odontogram): add multi-tooth selection with Ctrl+Click
fix(sessions): correct balance calculation for negative discounts
docs(readme): update installation instructions for Windows
refactor(types): eliminate SessionRow wrapper type
perf(queries): add index on visits.patient_id for faster lookups
test(patient-form): add validation tests
chore(deps): upgrade Tauri to 2.8.0
```

**Scope** (optional but recommended):
- `frontend`, `backend`, `database`
- Component names: `odontogram`, `patient-form`, `sessions`
- Feature areas: `auth`, `sync`, `theme`

### Commit Messages

```bash
# ✅ Good commits
git commit -m "feat(sessions): add cumulative balance calculation

- Calculate cumulative balance from previous visits
- Update Rust save_visit_with_sessions command
- Add frontend display in SessionsTable"

git commit -m "fix(app): correct draft session detection after type refactoring

Fixes #42"

# ❌ Bad commits
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "asdfasdf"
```

## Code Review Checklist

### Before Submitting PR

- [ ] Code follows naming conventions
- [ ] TypeScript: No `any` types, strict null checks
- [ ] Rust: No `unwrap()`, proper error handling
- [ ] ESLint passes with no warnings
- [ ] Rust clippy passes with no warnings
- [ ] Code is formatted (rustfmt / prettier)
- [ ] No console.log statements in production code
- [ ] Database migrations are idempotent
- [ ] Commit messages follow Conventional Commits
- [ ] Tests added for new functionality (when testing framework ready)

### During Code Review

**Reviewers should check**:
- Type safety: Are types accurate and specific?
- Error handling: Are errors handled gracefully?
- Performance: Any obvious performance issues?
- Security: SQL injection risks? Input validation?
- Consistency: Follows project patterns?
- Documentation: Complex logic documented?

## Documentation Standards

### Code Comments

```typescript
// ✅ Document WHY, not WHAT
// Calculate cumulative balance to show total debt across all visits
const cumulativeBalance = previousBalance + currentBalance;

// ❌ Don't state the obvious
// Add previousBalance and currentBalance
const cumulativeBalance = previousBalance + currentBalance;

// ✅ Document complex business logic
/**
 * Denormalization Decision: Store procedure name as snapshot
 *
 * Rationale: Historical billing records must not change when the
 * procedure_templates catalog is updated. We store the name at
 * time of visit to maintain audit trail accuracy.
 *
 * Trade-off: Redundancy vs historical accuracy (we chose accuracy)
 */
const procedureName = template.name; // Snapshot for immutability
```

### JSDoc for Public APIs

```typescript
/**
 * Saves a visit with all associated sessions and procedures
 *
 * @param patient - Patient demographics (will be upserted)
 * @param visit - Visit metadata (reason, diagnosis, odontogram)
 * @param sessions - Financial sessions with procedure items
 * @returns Promise resolving to { patient_id, visit_id }
 * @throws {Error} If patient validation fails
 * @throws {Error} If database transaction fails
 *
 * @example
 * ```typescript
 * const result = await repo.saveVisitWithSessions({
 *   patient: { full_name: 'John Doe', ... },
 *   visit: { date: '2025-11-30', ... },
 *   sessions: [{ visit: {...}, items: [...] }]
 * });
 * console.log(`Saved patient ${result.patient_id}`);
 * ```
 */
async saveVisitWithSessions(payload: SaveVisitPayload): Promise<{ patient_id: number; visit_id: number }> {
  // Implementation
}
```

## Performance Guidelines

### Frontend

- **Avoid unnecessary re-renders**: Use `React.memo`, `useCallback`, `useMemo` appropriately
- **Debounce expensive operations**: Search inputs, auto-save
- **Virtual scrolling**: For large lists (already using TanStack Virtual)
- **Lazy load components**: Use `React.lazy` for heavy components (not critical yet)

### Backend

- **Use indexes**: All foreign keys and frequently queried columns
- **Limit query results**: Use LIMIT for large result sets
- **Transaction batching**: Group related operations in transactions
- **Avoid N+1 queries**: Use JOINs or batch queries

### Database

- **WAL mode enabled**: Already configured for concurrent reads
- **Analyze queries**: Use `EXPLAIN QUERY PLAN` for slow queries
- **Vacuum periodically**: Keep database file optimized

---

**Document Version**: 1.0
**Last Updated**: 2025-11-30
**Maintained By**: Development Team
