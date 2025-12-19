// src/stores/index.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  createPatientSlice,
  type PatientState,
  type PatientActions,
} from "./patientStore";
import {
  createSessionSlice,
  type SessionState,
  type SessionActions,
} from "./sessionStore";
import {
  createMasterDataSlice,
  type MasterDataState,
  type MasterDataActions,
} from "./masterDataStore";
import { createUISlice, type UIState, type UIActions } from "./uiStore";
import { STORAGE_KEY, STORAGE_VERSION } from "./persistenceConfig";

/**
 * Combined Store State
 *
 * This is the main Zustand store that combines all slices.
 * It uses middleware for localStorage persistence of specific slices.
 */
export type AppStore = PatientState &
  PatientActions &
  SessionState &
  SessionActions &
  MasterDataState &
  MasterDataActions &
  UIState &
  UIActions & {
    // Global actions that affect multiple slices
    resetAllData: () => void;
    hasUnsavedChanges: () => boolean;
  };

/**
 * Main Zustand Store
 *
 * Architecture:
 * - Combines multiple slices (patient, session, masterData, ui)
 * - Uses persist middleware for selective localStorage persistence
 * - Provides computed values and cross-slice actions
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Combine all slices
      ...createPatientSlice(set, get),
      ...createSessionSlice(set, get),
      ...createMasterDataSlice(set, get),
      ...createUISlice(set, get),

      // Global actions
      resetAllData: () => {
        // Reset all slices to initial state
        get().resetPatientForm();
        get().resetSessionData();
        get().resetUIState();
        // Note: We don't reset masterData as it's loaded from DB
      },

      hasUnsavedChanges: () => {
        const state = get();
        // Check if patient has unsaved changes
        if (state.hasUnsavedChanges()) return true;

        // Check if there are draft sessions
        const draftSessions = state.sessions.filter((s) => !s.session.is_saved);
        if (draftSessions.length > 0) return true;

        // Check if there are new attachments
        const newAttachments = state.attachments.filter((a) => a.file);
        if (newAttachments.length > 0) return true;

        return false;
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),

      // Only persist specific parts of the state
      partialize: (state) => ({
        // UI preferences
        layoutMode: state.layoutMode,
        activeTab: state.activeTab,
        lastOpenedPatientId: state.lastOpenedPatientId,

        // Draft patient data (optional - for restoring unsaved work)
        // Uncomment if you want to restore drafts on app restart
        // patient: state.hasUnsavedChanges ? state.patient : undefined,
        // toothDx: state.hasUnsavedChanges ? state.toothDx : undefined,
        // manualDiagnosis: state.hasUnsavedChanges ? state.manualDiagnosis : undefined,
      }),

      // Merge persisted state with initial state
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          // Restore UI preferences
          layoutMode: persistedState?.layoutMode ?? currentState.layoutMode,
          activeTab: persistedState?.activeTab ?? currentState.activeTab,
          lastOpenedPatientId: persistedState?.lastOpenedPatientId,

          // Optionally restore draft data
          // patient: persistedState?.patient ?? currentState.patient,
          // toothDx: persistedState?.toothDx ?? currentState.toothDx,
          // manualDiagnosis: persistedState?.manualDiagnosis ?? currentState.manualDiagnosis,
        };
      },

      // Migration function for version changes
      migrate: (persistedState: any, version: number) => {
        // Example: Handle breaking changes between versions
        if (version === 0) {
          // Migrate from v0 to v1
          // Add your migration logic here
        }
        return persistedState;
      },
    },
  ),
);

/**
 * Selectors for optimized re-renders
 *
 * Usage:
 * const patient = useAppStore(selectPatient);
 * const hasChanges = useAppStore(selectHasUnsavedChanges);
 */

// Patient selectors
export const selectPatient = (state: AppStore) => state.patient;
export const selectToothDx = (state: AppStore) => state.toothDx;
export const selectManualDiagnosis = (state: AppStore) => state.manualDiagnosis;
export const selectAttachments = (state: AppStore) => state.attachments;
export const selectIsEditingPatient = (state: AppStore) =>
  state.isEditingPatient;

// Session selectors
export const selectSession = (state: AppStore) => state.session;
export const selectSessions = (state: AppStore) => state.sessions;
export const selectDraftSessions = (state: AppStore) =>
  state.sessions.filter((s) => !s.session.is_saved);
export const selectSavedSessions = (state: AppStore) =>
  state.sessions.filter((s) => s.session.is_saved === true);

// Master data selectors
export const selectProcedureTemplates = (state: AppStore) =>
  state.procedureTemplates;
export const selectSigners = (state: AppStore) => state.signers;
export const selectReasonTypes = (state: AppStore) => state.reasonTypes;
export const selectPaymentMethods = (state: AppStore) => state.paymentMethods;

// UI selectors
export const selectLayoutMode = (state: AppStore) => state.layoutMode;
export const selectActiveTab = (state: AppStore) => state.activeTab;
export const selectSearchDialogOpen = (state: AppStore) =>
  state.searchDialogOpen;
export const selectPaymentsDialogOpen = (state: AppStore) =>
  state.paymentsDialogOpen;

// Computed selectors
export const selectHasUnsavedChanges = (state: AppStore) =>
  state.hasUnsavedChanges();
export const selectHasPatientData = (state: AppStore) =>
  Boolean(state.patient.full_name && state.patient.doc_id);
export const selectCanSave = (state: AppStore) =>
  Boolean(state.patient.full_name && state.patient.doc_id);

// Complex selectors with business logic
export const selectDiagnosisFromTeeth = (state: AppStore) => {
  const lines = Object.keys(state.toothDx)
    .sort((a, b) => +a - +b)
    .map((n) =>
      state.toothDx[n]?.length
        ? `Diente ${n}: ${state.toothDx[n].join(", ")}`
        : "",
    )
    .filter(Boolean);
  return lines.join("\n");
};

export const selectFullDiagnosis = (state: AppStore) => {
  const parts: string[] = [];
  const diagnosisFromTeeth = selectDiagnosisFromTeeth(state);
  if (diagnosisFromTeeth) parts.push(diagnosisFromTeeth);
  if (state.manualDiagnosis.trim()) parts.push(state.manualDiagnosis.trim());
  return parts.join("\n\n");
};

/**
 * Action selectors (for components that only need actions)
 */
export const selectPatientActions = (state: AppStore) => ({
  setPatient: state.setPatient,
  updatePatient: state.updatePatient,
  clearPatient: state.clearPatient,
  setToothDx: state.setToothDx,
  updateToothDx: state.updateToothDx,
  clearToothDx: state.clearToothDx,
  setManualDiagnosis: state.setManualDiagnosis,
  setAttachments: state.setAttachments,
  addAttachment: state.addAttachment,
  removeAttachment: state.removeAttachment,
  setIsEditingPatient: state.setIsEditingPatient,
  resetPatientForm: state.resetPatientForm,
  loadPatientData: state.loadPatientData,
});

export const selectSessionActions = (state: AppStore) => ({
  setSession: state.setSession,
  updateSession: state.updateSession,
  resetSession: state.resetSession,
  setSessions: state.setSessions,
  addSession: state.addSession,
  updateSessionInList: state.updateSessionInList,
  removeSession: state.removeSession,
  markSessionsAsSaved: state.markSessionsAsSaved,
  setQuickPaymentOpen: state.setQuickPaymentOpen,
  resetSessionData: state.resetSessionData,
});

export const selectUIActions = (state: AppStore) => ({
  setLayoutMode: state.setLayoutMode,
  setActiveTab: state.setActiveTab,
  setSearchDialogOpen: state.setSearchDialogOpen,
  setPaymentsDialogOpen: state.setPaymentsDialogOpen,
  setLastOpenedPatientId: state.setLastOpenedPatientId,
  setLoadedFromUrl: state.setLoadedFromUrl,
  resetUIState: state.resetUIState,
});
