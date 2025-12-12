// src/stores/persistenceConfig.ts

/**
 * Persistence Configuration for Zustand Store
 *
 * This file defines what state should persist in localStorage vs what should be session-only.
 *
 * PERSISTENCE STRATEGY:
 *
 * 1. PERSIST IN LOCALSTORAGE:
 *    - Layout preference (tabs vs single-page)
 *    - Last active tab
 *    - UI preferences (dialog states, etc.)
 *    - Draft data (unsaved patient forms, sessions in progress)
 *
 * 2. PERSIST IN DATABASE:
 *    - Patient records
 *    - Sessions (visits)
 *    - Financial data
 *    - Attachments metadata
 *
 * 3. SESSION-ONLY (clear on reload):
 *    - Master data (procedureTemplates, signers, reasonTypes, paymentMethods)
 *      -> These are loaded from DB on app init
 *    - Dialog open/close state
 *    - Search results
 */

export interface PersistedState {
  // UI State that should persist across sessions
  uiState: {
    layoutMode: 'tabs' | 'vertical';
    activeTab: string;
    lastOpenedPatientId?: number;
  };

  // Draft/WIP data that should persist across sessions
  draftState: {
    patient?: any; // Unsaved patient form data
    toothDx?: Record<string, string[]>;
    manualDiagnosis?: string;
    draftSessions?: any[];
    draftAttachments?: any[];
    timestamp?: string; // When this draft was created
  };
}

/**
 * Keys to persist in localStorage
 */
export const PERSISTED_KEYS: (keyof PersistedState)[] = [
  'uiState',
  'draftState',
];

/**
 * Keys to exclude from persistence (session-only)
 */
export const SESSION_ONLY_KEYS = [
  'masterData',
  'dialogState',
  'searchResults',
] as const;

/**
 * Default persisted state (fallback if localStorage is empty)
 */
export const DEFAULT_PERSISTED_STATE: PersistedState = {
  uiState: {
    layoutMode: 'vertical',
    activeTab: 'odontogram',
  },
  draftState: {},
};

/**
 * Storage key for Zustand persistence
 */
export const STORAGE_KEY = 'dentix-app-state';

/**
 * Storage version for migration support
 * Increment this when making breaking changes to the store structure
 */
export const STORAGE_VERSION = 1;
