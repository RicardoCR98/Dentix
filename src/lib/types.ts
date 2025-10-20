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