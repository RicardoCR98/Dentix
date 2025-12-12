// src/stores/sessionStore.ts

import type { Session, VisitWithProcedures } from "../lib/types";

/**
 * Session Store Slice
 *
 * Manages session (visit) data, including:
 * - Current session being edited
 * - Historical sessions for current patient
 * - Draft sessions (unsaved)
 * - Financial calculations
 */

export interface SessionState {
  // Current session metadata (reason, date, etc.)
  session: Session;

  // All sessions for current patient (includes saved + drafts)
  sessions: VisitWithProcedures[];

  // Quick payment modal state
  quickPaymentOpen: boolean;
}

export interface SessionActions {
  // Session metadata actions
  setSession: (session: Session) => void;
  updateSession: (updates: Partial<Session>) => void;
  resetSession: () => void;

  // Sessions list actions
  setSessions: (sessions: VisitWithProcedures[]) => void;
  addSession: (session: VisitWithProcedures) => void;
  updateSessionInList: (index: number, session: VisitWithProcedures) => void;
  removeSession: (index: number) => void;
  markSessionsAsSaved: () => void; // Mark draft sessions as saved after save operation

  // Quick payment actions
  setQuickPaymentOpen: (open: boolean) => void;

  // Complex operations
  resetSessionData: () => void; // Reset all session state
}

/**
 * Initial session state
 */
export const initialSession: Session = {
  date: new Date().toISOString().slice(0, 10),
  reason_type: "Dolor",
  reason_detail: "",
  diagnosis_text: "",
  budget: 0,
  discount: 0,
  payment: 0,
  balance: 0,
  cumulative_balance: 0,
};

/**
 * Create session store slice
 */
export const createSessionSlice = (set: any, get: any) => ({
  // Initial state
  session: initialSession,
  sessions: [],
  quickPaymentOpen: false,

  // Actions
  setSession: (session: Session) => {
    set({ session });
  },

  updateSession: (updates: Partial<Session>) => {
    set((state: SessionState) => ({
      session: { ...state.session, ...updates },
    }));
  },

  resetSession: () => {
    set({
      session: {
        ...initialSession,
        date: new Date().toISOString().slice(0, 10),
      },
    });
  },

  setSessions: (sessions: VisitWithProcedures[]) => {
    set({ sessions });
  },

  addSession: (session: VisitWithProcedures) => {
    set((state: SessionState) => ({
      sessions: [...state.sessions, session],
    }));
  },

  updateSessionInList: (index: number, session: VisitWithProcedures) => {
    set((state: SessionState) => ({
      sessions: state.sessions.map((s, i) => (i === index ? session : s)),
    }));
  },

  removeSession: (index: number) => {
    set((state: SessionState) => ({
      sessions: state.sessions.filter((_, i) => i !== index),
    }));
  },

  markSessionsAsSaved: () => {
    set((state: SessionState) => ({
      sessions: state.sessions.map((s) => ({
        ...s,
        session: {
          ...s.session,
          is_saved: true,
        },
      })),
    }));
  },

  setQuickPaymentOpen: (open: boolean) => {
    set({ quickPaymentOpen: open });
  },

  resetSessionData: () => {
    set({
      session: {
        ...initialSession,
        date: new Date().toISOString().slice(0, 10),
      },
      sessions: [],
      quickPaymentOpen: false,
    });
  },
});
