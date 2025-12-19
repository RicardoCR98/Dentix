// src/lib/types.ts

// =========================
// DATABASE TYPES
// =========================
// These types map 1:1 with database tables and match Rust structs exactly.
// All fields use snake_case to align with SQL and Rust conventions.

// -------- CORE ENTITIES --------
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

export type Patient = {
  id?: number;
  full_name: string;
  doc_id: string;
  email?: string;
  phone: string;
  emergency_phone?: string;
  date_of_birth: string; // ISO date string
  anamnesis?: string;
  allergy_detail?: string;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
};

export type Session = {
  id?: number;
  patient_id?: number;
  date: string;

  // Reason for session (snapshot - per session, not global)
  reason_type?: string;
  reason_detail?: string;

  // Diagnosis (snapshots)
  diagnosis_text?: string;
  auto_dx_text?: string;
  full_dx_text?: string;
  tooth_dx_json?: string;

  // Financial
  budget: number;
  discount: number;
  payment: number;
  balance: number;
  cumulative_balance: number;
  payment_method_id?: number; // NEW: FK to payment_methods
  payment_notes?: string; // NEW: Notes specific to payment

  // Administrative
  signer?: string;
  clinical_notes?: string; // RENAMED: from observations
  is_saved?: boolean;

  // Metadata
  created_at?: string;
  updated_at?: string;
};

// DEPRECATED: Use Session instead
/** @deprecated Use Session type instead */
export type Visit = Session;

export type SessionItem = {
  id?: number;
  session_id?: number;
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  is_active?: boolean; // Checkbox activation (independent of quantity)
  tooth_number?: string; // NEW: Which tooth this procedure was applied to
  procedure_notes?: string; // NEW: Notes specific to this procedure
  procedure_template_id?: number; // Optional: for audit trail
  sort_order?: number;
  created_at?: string;
};

// DEPRECATED: Use SessionItem instead
/** @deprecated Use SessionItem type instead */
export type VisitProcedure = SessionItem;

export type Attachment = {
  id?: number;
  patient_id: number;
  session_id?: number; // RENAMED: from visit_id
  kind: "radiograph" | "photo" | "document" | "other";
  filename: string;
  mime_type?: string;
  size_bytes?: number;
  storage_key: string;
  note?: string;
  created_at?: string;
};

export type Payment = {
  id?: number;
  patient_id: number;
  date: string;
  amount: number;
  payment_method?: "cash" | "card" | "transfer" | "other";
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

// -------- MASTER DATA / CATALOGS --------

export type ProcedureTemplate = {
  id?: number;
  name: string;
  default_price: number; // REAL ahora (soporta decimales)
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Signer = {
  id?: number;
  name: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DiagnosisOption = {
  id?: number;
  label: string;
  color: "success" | "info" | "warning" | "danger" | "default";
  active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type ReasonType = {
  id?: number;
  name: string;
  active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type PaymentMethod = {
  id?: number;
  name: string;
  active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type UserSetting = {
  id?: number;
  key: string;
  value?: string;
  category?: string;
  updated_at?: string;
};

// -------- TELEMETRY & OBSERVABILITY --------

export type TelemetryEvent = {
  id?: number;
  doctor_id: string;
  event_type: string;
  event_data?: string;
  timestamp?: string;
  sent?: boolean;
  sent_at?: string;
};

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

// -------- SYNC & CDC --------

export type SyncQueueItem = {
  id?: number;
  table_name: string;
  record_id: number;
  operation: "INSERT" | "UPDATE" | "DELETE";
  payload?: string;
  created_at?: string;
  synced?: boolean;
  synced_at?: string;
};

// =========================
// FRONTEND UI TYPES
// =========================
// These types are UI/Frontend-specific and DO NOT map directly to database tables.
// They are used for component state, props, and UI logic.
// Some fields may use different naming conventions for frontend convenience.

/**
 * ToothDx: Odontogram data structure
 * Maps tooth number (string) to array of diagnosis codes
 */
export type ToothDx = Record<string, string[]>;

/**
 * SessionWithItems: A Session with its associated procedure items
 * This matches exactly what Rust backend returns from:
 * - get_sessions_by_patient
 * - get_sessions_by_visit
 * And what it expects for:
 * - save_visit_with_sessions
 *
 * No transformation needed - use directly from backend to frontend
 */
export type SessionWithItems = {
  session: Session;
  items: SessionItem[];
};

// DEPRECATED: Use SessionWithItems instead
/** @deprecated Use SessionWithItems type instead */
export type VisitWithProcedures = SessionWithItems;

/**
 * AttachmentFile: UI state for file upload/preview
 * Used in Attachments component for file management
 * Maps to Attachment type when saving to database
 */
export type AttachmentFile = {
  id: string; // Frontend UUID
  name: string; // Display name
  size: number; // File size in bytes
  type: string; // MIME type
  file?: File; // Browser File object (only for new uploads)
  url: string; // Object URL for preview
  uploadDate: string; // Display date
  storage_key?: string; // File path on disk (for saved files)
  db_id?: number; // Attachment.id in database (for saved files)
  session_id?: number | null; // Link attachment to specific session (NEW)
};

/**
 * PatientDebtSummary: Aggregated patient debt report with TRIADA fields
 * Used by FinancesPage for optimized reporting with contact tracking
 * Calculated entirely in backend (Rust) for performance
 */
export type PatientDebtSummary = {
  patient_id: number;
  full_name: string;
  phone: string | null;
  doc_id: string;

  // Financial
  current_balance: number;        // Latest cumulative_balance

  // TRIADA (from patients table)
  debt_opened_at: string | null;  // Date when debt was opened
  debt_archived: number;          // 0=active, 1=archived
  last_contact_at: string | null; // Last contact timestamp
  last_contact_type: string | null; // 'whatsapp' | 'call' | 'email' | 'in_person'

  // Calculated
  days_overdue: number;           // Days since debt_opened_at
  contact_status: string;         // 'not_contacted' | 'recently_contacted' | 'long_ago'
};

/**
 * PatientListItem: Patient summary for table list view
 * Optimized for display in patients list page
 * Includes last visit date and pending balance
 */
export type PatientListItem = {
  id: number;
  full_name: string;
  doc_id: string;
  phone: string;
  allergy_detail?: string | null;
  status?: "active" | "inactive";
  last_visit_date: string | null;
  pending_balance: number;
};
