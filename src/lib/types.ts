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

export type TextTemplate = {
  id?: number;
  kind: string; // 'diagnosis' | 'clinical_notes' | 'reason_detail' | 'procedure_notes' | 'whatsapp_message'
  title: string;
  body: string;
  tags?: string;
  source?: "system" | "user";
  is_favorite?: boolean;
  active?: boolean;
  sort_order?: number;
  created_at?: string;
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
  isRecent?: boolean; // Highlight as recent during this edit session
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
 * Includes last visit date, pending balance, and next appointment
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
  // Next appointment information
  next_appointment_id?: number | null;
  next_appointment_starts_at?: string | null;
  next_appointment_procedure?: string | null;
  next_appointment_status?: "scheduled" | "confirmed" | "cancelled" | "no_show" | "completed" | null;
  appointments_count?: number; // Total upcoming appointments
};

// =========================
// APPOINTMENTS MODULE
// =========================

/**
 * Appointment: Scheduled appointment for a patient
 * Separate from Session (clinical records) - this is purely for scheduling
 */
export type Appointment = {
  id?: number;
  patient_id: number;
  starts_at: string;  // ISO 8601 datetime string (e.g. "2025-01-15T10:00:00-03:00")
  ends_at: string;    // ISO 8601 datetime string
  procedure: string;  // What service is scheduled
  notes?: string;     // Optional appointment notes
  status: "scheduled" | "confirmed" | "cancelled" | "no_show" | "completed";
  confirmed_at?: string;       // When patient confirmed
  reminder_1d_sent_at?: string; // When 1-day reminder was created
  created_at?: string;
  updated_at?: string;
};

/**
 * AvailableSlot: A free time slot for booking appointments
 * Returned by generate_available_slots command
 */
export type AvailableSlot = {
  starts_at: string;  // ISO 8601 datetime
  ends_at: string;    // ISO 8601 datetime
};

/**
 * MessageQueueItem: Pending WhatsApp message to be sent manually
 * Used for semi-automatic reminders (app generates text, user sends via WhatsApp)
 */
export type MessageQueueItem = {
  id?: number;
  patient_id: number;
  appointment_id?: number;  // Optional link to appointment
  type: "reminder_1d" | "availability" | "custom";
  message_text: string;     // Pre-generated message ready to send
  status: "pending" | "sent" | "skipped";
  sent_at?: string;
  created_at?: string;
};

/**
 * InformedConsent: Consentimiento informado digital con firma
 * Sistema de protección legal para procedimientos odontológicos
 */
export type InformedConsent = {
  id?: number;
  patient_id: number;
  visit_id?: number;
  procedure_type: string;       // Tipo de procedimiento (extracción, endodoncia, cirugía, etc.)
  procedure_name?: string;      // Nombre específico del procedimiento
  consent_template: string;     // Plantilla usada
  consent_text: string;         // Texto completo del consentimiento
  signature_data: string;       // Base64 del canvas de firma
  signed_by: string;            // Nombre del paciente que firma
  signed_at: string;            // Fecha y hora de firma (ISO 8601)
  witness_name?: string;        // Nombre del testigo (opcional)
  witness_signature?: string;   // Firma del testigo (opcional)
  doctor_name?: string;         // Nombre del doctor
  notes?: string;               // Notas adicionales
  created_at?: string;
  updated_at?: string;
};

/**
 * ConsentTemplate: Plantilla predefinida de consentimiento informado
 * Contiene el texto legal con variables que se reemplazan
 */
export type ConsentTemplate = {
  id?: number;
  name: string;                 // Nombre de la plantilla
  procedure_type: string;       // Tipo de procedimiento
  title: string;                // Título del consentimiento
  content: string;              // Contenido con variables {paciente}, {fecha}, {procedimiento}
  is_active?: boolean;          // 1 = activo, 0 = inactivo
  created_at?: string;
  updated_at?: string;
};
