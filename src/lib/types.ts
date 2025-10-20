// src/lib/types.ts
export type ToothDx = Record<string, string[]>;

export type Patient = {
  id?: number;
  full_name: string;
  doc_id?: string;
  age?: number;
  phone?: string;
  anamnesis?: string;
  allergyDetail?: string;
};

export type Visit = {
  id?: number;
  patient_id?: number;
  date?: string;
  reasonType?: "Dolor" | "Control" | "Emergencia" | "Estetica" | "Otro";
  reasonDetail?: string;
  diagnosis?: string;
  toothDx?: ToothDx;
};

// Tipos para sesiones y procedimientos
export type ProcItem = {
  id?: string; // ID temporal para facilitar eliminación de filas
  name: string;
  unit: number;
  qty: number;
  sub: number;
};

export type SessionRow = {
  id?: string;
  date: string;
  items: ProcItem[];
  auto: boolean;
  budget: number;
  discount: number; // NUEVO: descuento aplicado
  payment: number;
  balance: number;
  signer?: string;
  visitId?: number;
};

// Tipo para almacenar datos completos del paciente
export type PatientRecord = {
  patient: Patient;
  visits: Visit[];
  sessions: SessionRow[];
  createdAt: string;
  updatedAt: string;
};

export type AttachmentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
  url: string;
  uploadDate: string;
};

// Tipos para templates y signers (maestros)
export type ProcedureTemplate = {
  id?: number;
  name: string;
  default_price: number;
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