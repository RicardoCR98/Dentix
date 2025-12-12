// src/stores/patientStore.ts

import type { Patient, ToothDx, AttachmentFile } from "../lib/types";

/**
 * Patient Store Slice
 *
 * Manages patient data, including:
 * - Current patient being viewed/edited
 * - Patient form state
 * - Patient search results
 * - Odontogram data (ToothDx)
 * - Manual diagnosis
 */

export interface PatientState {
  // Current patient data
  patient: Patient;

  // Odontogram data (tooth number -> diagnosis array)
  toothDx: ToothDx;

  // Manual diagnosis text (user-entered)
  manualDiagnosis: string;

  // Attachments for current patient
  attachments: AttachmentFile[];

  // UI flags
  isEditingPatient: boolean;
  hasUnsavedChanges: boolean;

  // Patient search results (for dialogs)
  searchResults: Array<Patient & { id: number }>;
}

export interface PatientActions {
  // Patient data actions
  setPatient: (patient: Patient) => void;
  updatePatient: (updates: Partial<Patient>) => void;
  clearPatient: () => void;

  // Odontogram actions
  setToothDx: (toothDx: ToothDx) => void;
  updateToothDx: (toothNumber: string, diagnoses: string[]) => void;
  clearToothDx: () => void;

  // Diagnosis actions
  setManualDiagnosis: (text: string) => void;

  // Attachment actions
  setAttachments: (attachments: AttachmentFile[]) => void;
  addAttachment: (attachment: AttachmentFile) => void;
  removeAttachment: (attachmentId: string) => void;

  // UI actions
  setIsEditingPatient: (isEditing: boolean) => void;
  setSearchResults: (results: Array<Patient & { id: number }>) => void;

  // Complex operations
  resetPatientForm: () => void; // Reset to initial state
  loadPatientData: (patient: Patient, toothDx: ToothDx, attachments: AttachmentFile[]) => void;
}

/**
 * Initial patient state
 */
export const initialPatient: Patient = {
  full_name: "",
  doc_id: "",
  phone: "",
  date_of_birth: "",
  email: "",
  emergency_phone: "",
};

/**
 * Create patient store slice
 */
export const createPatientSlice = (set: any, get: any) => ({
  // Initial state
  patient: initialPatient,
  toothDx: {},
  manualDiagnosis: "",
  attachments: [],
  isEditingPatient: true,
  hasUnsavedChanges: false,
  searchResults: [],

  // Actions
  setPatient: (patient: Patient) => {
    set({ patient, hasUnsavedChanges: true });
  },

  updatePatient: (updates: Partial<Patient>) => {
    set((state: PatientState) => ({
      patient: { ...state.patient, ...updates },
      hasUnsavedChanges: true,
    }));
  },

  clearPatient: () => {
    set({
      patient: initialPatient,
      toothDx: {},
      manualDiagnosis: "",
      attachments: [],
      hasUnsavedChanges: false,
    });
  },

  setToothDx: (toothDx: ToothDx) => {
    set({ toothDx, hasUnsavedChanges: true });
  },

  updateToothDx: (toothNumber: string, diagnoses: string[]) => {
    set((state: PatientState) => ({
      toothDx: { ...state.toothDx, [toothNumber]: diagnoses },
      hasUnsavedChanges: true,
    }));
  },

  clearToothDx: () => {
    set({ toothDx: {} });
  },

  setManualDiagnosis: (text: string) => {
    set({ manualDiagnosis: text, hasUnsavedChanges: true });
  },

  setAttachments: (attachments: AttachmentFile[]) => {
    set({ attachments });
  },

  addAttachment: (attachment: AttachmentFile) => {
    set((state: PatientState) => ({
      attachments: [...state.attachments, attachment],
      hasUnsavedChanges: true,
    }));
  },

  removeAttachment: (attachmentId: string) => {
    set((state: PatientState) => ({
      attachments: state.attachments.filter(a => a.id !== attachmentId),
      hasUnsavedChanges: true,
    }));
  },

  setIsEditingPatient: (isEditing: boolean) => {
    set({ isEditingPatient: isEditing });
  },

  setSearchResults: (results: Array<Patient & { id: number }>) => {
    set({ searchResults: results });
  },

  resetPatientForm: () => {
    set({
      patient: initialPatient,
      toothDx: {},
      manualDiagnosis: "",
      attachments: [],
      isEditingPatient: true,
      hasUnsavedChanges: false,
    });
  },

  loadPatientData: (patient: Patient, toothDx: ToothDx, attachments: AttachmentFile[]) => {
    set({
      patient,
      toothDx,
      attachments,
      isEditingPatient: false,
      hasUnsavedChanges: false,
    });
  },
});
