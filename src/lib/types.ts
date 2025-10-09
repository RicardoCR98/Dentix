export type ToothDx = Record<string, string[]>; 

export type Patient = {
  id?: number;
  full_name: string;
  doc_id?: string;
  age?: number;
  phone?: string;
};

export type Visit = {
  id?: number;
  patient_id?: number;
  date?: string;               
  reasonType?: "Dolor"|"Control"|"Emergencia"|"Estetica"|"Otro";
  reasonDetail?: string;
  diagnosis?: string;
  toothDx?: ToothDx;
};
