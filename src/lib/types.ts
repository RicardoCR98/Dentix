// src/lib/types.ts

// =========================
// CORE DOMAIN TYPES
// =========================

export type ToothDx = Record<string, string[]>;

export type Patient = {
  id?: number;
  full_name: string;
  doc_id: string;  // Ahora es obligatorio
  email?: string;
  phone: string;  // Ahora es obligatorio
  emergency_phone?: string;
  date_of_birth: string;  // Reemplaza age - formato ISO date string
  anamnesis?: string;
  allergyDetail?: string;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
};

export type Visit = {
  id?: number;
  patient_id?: number;
  date: string;

  // Reason for visit
  reason_type?: string;  // Snapshot: "Dolor", "Control", etc (no FK)
  reason_detail?: string;

  // Diagnosis
  diagnosis_text?: string;  // Manual diagnosis notes
  auto_dx_text?: string;  // Auto-generated from odontogram
  full_dx_text?: string;  // Combined diagnosis
  tooth_dx_json?: string;  // JSON stringified ToothDx

  // Financial (all REAL/number now, supports decimals)
  budget: number;
  discount: number;
  payment: number;
  balance: number;  // budget - discount - payment
  cumulative_balance: number;  // Running balance across all visits

  // Administrative
  signer?: string;  // Snapshot: doctor name (no FK)
  observations?: string;
  is_saved?: boolean;  // false = draft, true = historical record (immutable)

  // Metadata
  created_at?: string;
  updated_at?: string;
};

export type VisitProcedure = {
  id?: number;
  visit_id?: number;
  name: string;  // Snapshot: procedure name at the time
  unit_price: number;  // Snapshot: price that day (REAL, supports decimals)
  quantity: number;
  subtotal: number;  // unit_price * quantity
  procedure_template_id?: number;  // Optional: for tracking which template was used
  sort_order?: number;
  created_at?: string;
};

// =========================
// SESSION TYPES (Frontend representation)
// =========================
// SessionRow representa una visita con sus procedimientos incluidos
// En el backend, cada sesión es una visita (visit) en la tabla visits
export type SessionRow = {
  id?: string;  // Frontend ID temporal (puede ser number si viene de BD)
  visitId?: number;  // ID de la visita en BD (para sesiones guardadas)
  date: string;
  auto?: boolean;  // Presupuesto automático

  // Items/procedimientos
  items: ProcItem[];

  // Financial
  budget: number;
  discount: number;
  payment: number;
  balance: number;

  // Administrative
  signer?: string;
  observations?: string;
};

// ProcItem representa un procedimiento individual
export type ProcItem = {
  id?: number;  // ID en BD (para procedimientos guardados)
  name: string;
  unit: number;  // Precio unitario
  qty: number;   // Cantidad
  sub: number;   // Subtotal (unit * qty)
  procedure_template_id?: number;  // ID de la plantilla de origen
};

// =========================
// MASTER DATA / CATALOG TYPES
// =========================

export type ProcedureTemplate = {
  id?: number;
  name: string;
  default_price: number;  // REAL ahora (soporta decimales)
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

// =========================
// ATTACHMENTS
// =========================

export type AttachmentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // Solo para archivos nuevos (antes de guardar)
  url: string; // Para preview en el UI
  uploadDate: string;
  storage_key?: string; // Para archivos ya guardados en disco
  db_id?: number; // ID en la base de datos (para archivos existentes)
};

// =========================
// RECORD AGGREGATION (Legacy - may be removed)
// =========================

export type PatientRecord = {
  patient: Patient;
  visits: Visit[];
  sessions: SessionRow[];  // Deprecated - usar visits directamente
  createdAt: string;
  updatedAt: string;
};
