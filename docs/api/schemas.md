Aquí defines los tipos de datos:

Patient.json

Appointment.json

DoctorProfile.json

O bien .md con interfaces TS:

export interface Patient {
  id: number;
  fullName: string;
  docId: string;
  phone?: string;
  createdAt: string;
}


Sirve para asegurar que React y Tauri hablan el mismo idioma.
