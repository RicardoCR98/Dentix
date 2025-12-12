// src/stores/uiStore.ts

import { getRepository } from '../lib/storage/TauriSqliteRepository';

/**
 * UI Store Slice
 *
 * Manages UI-specific state:
 * - Layout mode (tabs vs single-page) - persisted to database
 * - Active tab
 * - Dialog states
 * - Navigation state
 * - URL parameters tracking
 */

export interface UIState {
  // Layout preferences
  layoutMode: 'tabs' | 'vertical';
  activeTab: string;

  // Dialog states
  searchDialogOpen: boolean;
  paymentsDialogOpen: boolean;

  // Navigation state
  lastOpenedPatientId?: number; // Track last opened patient for restore on app restart
  loadedFromUrl: boolean; // Flag to prevent duplicate loads from URL params

  // Pending payments dialog state
  patientsForDialogs: Array<any>; // Patient list for search dialog
  patientSessionsMap: Record<number, any[]>; // Cached session data for pending payments dialog
}

export interface UIActions {
  // Layout actions
  setLayoutMode: (mode: 'tabs' | 'vertical') => Promise<void>;
  loadLayoutModeFromDB: () => Promise<void>;
  setActiveTab: (tab: string) => void;

  // Dialog actions
  setSearchDialogOpen: (open: boolean) => void;
  setPaymentsDialogOpen: (open: boolean) => void;

  // Navigation actions
  setLastOpenedPatientId: (patientId?: number) => void;
  setLoadedFromUrl: (loaded: boolean) => void;

  // Dialog data actions
  setPatientsForDialogs: (patients: Array<any>) => void;
  setPatientSessionsMap: (map: Record<number, any[]>) => void;

  // Reset UI state
  resetUIState: () => void;
}

/**
 * Create UI store slice
 */
export const createUISlice = (set: any, get: any) => ({
  // Initial state
  layoutMode: 'vertical' as const,
  activeTab: 'odontogram',
  searchDialogOpen: false,
  paymentsDialogOpen: false,
  loadedFromUrl: false,
  patientsForDialogs: [],
  patientSessionsMap: {},

  // Actions
  setLayoutMode: async (mode: 'tabs' | 'vertical') => {
    set({ layoutMode: mode });

    // Persist to database (user_settings table)
    try {
      const repo = await getRepository();
      await repo.setSetting('layoutMode', mode, 'appearance');
    } catch (error) {
      console.error('Error saving layout mode to database:', error);
      // Don't throw - allow UI to update even if DB save fails
    }
  },

  loadLayoutModeFromDB: async () => {
    try {
      const repo = await getRepository();
      const savedMode = await repo.getSetting('layoutMode');

      if (savedMode === 'tabs' || savedMode === 'vertical') {
        set({ layoutMode: savedMode });
      }
    } catch (error) {
      console.error('Error loading layout mode from database:', error);
      // Default to 'vertical' on error (already set in initial state)
    }
  },

  setActiveTab: (tab: string) => {
    set({ activeTab: tab });
  },

  setSearchDialogOpen: (open: boolean) => {
    set({ searchDialogOpen: open });
  },

  setPaymentsDialogOpen: (open: boolean) => {
    set({ paymentsDialogOpen: open });
  },

  setLastOpenedPatientId: (patientId?: number) => {
    set({ lastOpenedPatientId: patientId });
  },

  setLoadedFromUrl: (loaded: boolean) => {
    set({ loadedFromUrl: loaded });
  },

  setPatientsForDialogs: (patients: Array<any>) => {
    set({ patientsForDialogs: patients });
  },

  setPatientSessionsMap: (map: Record<number, any[]>) => {
    set({ patientSessionsMap: map });
  },

  resetUIState: () => {
    set({
      searchDialogOpen: false,
      paymentsDialogOpen: false,
      patientsForDialogs: [],
      patientSessionsMap: {},
    });
  },
});
