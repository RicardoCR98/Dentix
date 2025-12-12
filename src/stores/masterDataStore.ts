// src/stores/masterDataStore.ts

import type { ProcedureTemplate, ReasonType, PaymentMethod } from "../lib/types";

/**
 * Master Data Store Slice
 *
 * Manages master/reference data that is loaded from the database on app init:
 * - Procedure templates (catalog of procedures with default prices)
 * - Signers (list of doctors/dentists)
 * - Reason types (consultation reason categories)
 * - Payment methods (cash, card, transfer, etc.)
 *
 * This data is NOT persisted in localStorage - it's loaded fresh from DB on each app start.
 * This ensures data consistency and avoids sync issues.
 */

export interface MasterDataState {
  // Procedure templates (catalog)
  procedureTemplates: ProcedureTemplate[];

  // Signers (doctors/dentists)
  signers: Array<{ id: number; name: string }>;

  // Reason types (consultation categories)
  reasonTypes: ReasonType[];

  // Payment methods
  paymentMethods: PaymentMethod[];

  // Loading states (useful for showing skeletons during initial load)
  isLoadingMasterData: boolean;
}

export interface MasterDataActions {
  // Procedure templates
  setProcedureTemplates: (templates: ProcedureTemplate[]) => void;
  addProcedureTemplate: (template: ProcedureTemplate) => void;
  updateProcedureTemplate: (id: number, updates: Partial<ProcedureTemplate>) => void;
  removeProcedureTemplate: (id: number) => void;

  // Signers
  setSigners: (signers: Array<{ id: number; name: string }>) => void;
  addSigner: (signer: { id: number; name: string }) => void;
  removeSigner: (id: number) => void;

  // Reason types
  setReasonTypes: (reasonTypes: ReasonType[]) => void;
  addReasonType: (reasonType: ReasonType) => void;
  updateReasonType: (id: number, updates: Partial<ReasonType>) => void;
  removeReasonType: (id: number) => void;

  // Payment methods
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (id: number) => void;

  // Loading state
  setIsLoadingMasterData: (isLoading: boolean) => void;

  // Bulk load (for app initialization)
  loadAllMasterData: (data: {
    procedureTemplates: ProcedureTemplate[];
    signers: Array<{ id: number; name: string }>;
    reasonTypes: ReasonType[];
    paymentMethods: PaymentMethod[];
  }) => void;
}

/**
 * Create master data store slice
 */
export const createMasterDataSlice = (set: any, get: any) => ({
  // Initial state
  procedureTemplates: [],
  signers: [],
  reasonTypes: [],
  paymentMethods: [],
  isLoadingMasterData: false,

  // Procedure templates actions
  setProcedureTemplates: (templates: ProcedureTemplate[]) => {
    set({ procedureTemplates: templates });
  },

  addProcedureTemplate: (template: ProcedureTemplate) => {
    set((state: MasterDataState) => ({
      procedureTemplates: [...state.procedureTemplates, template],
    }));
  },

  updateProcedureTemplate: (id: number, updates: Partial<ProcedureTemplate>) => {
    set((state: MasterDataState) => ({
      procedureTemplates: state.procedureTemplates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  removeProcedureTemplate: (id: number) => {
    set((state: MasterDataState) => ({
      procedureTemplates: state.procedureTemplates.filter((t) => t.id !== id),
    }));
  },

  // Signers actions
  setSigners: (signers: Array<{ id: number; name: string }>) => {
    set({ signers });
  },

  addSigner: (signer: { id: number; name: string }) => {
    set((state: MasterDataState) => ({
      signers: [...state.signers, signer],
    }));
  },

  removeSigner: (id: number) => {
    set((state: MasterDataState) => ({
      signers: state.signers.filter((s) => s.id !== id),
    }));
  },

  // Reason types actions
  setReasonTypes: (reasonTypes: ReasonType[]) => {
    set({ reasonTypes });
  },

  addReasonType: (reasonType: ReasonType) => {
    set((state: MasterDataState) => ({
      reasonTypes: [...state.reasonTypes, reasonType],
    }));
  },

  updateReasonType: (id: number, updates: Partial<ReasonType>) => {
    set((state: MasterDataState) => ({
      reasonTypes: state.reasonTypes.map((rt) =>
        rt.id === id ? { ...rt, ...updates } : rt
      ),
    }));
  },

  removeReasonType: (id: number) => {
    set((state: MasterDataState) => ({
      reasonTypes: state.reasonTypes.filter((rt) => rt.id !== id),
    }));
  },

  // Payment methods actions
  setPaymentMethods: (methods: PaymentMethod[]) => {
    set({ paymentMethods: methods });
  },

  addPaymentMethod: (method: PaymentMethod) => {
    set((state: MasterDataState) => ({
      paymentMethods: [...state.paymentMethods, method],
    }));
  },

  removePaymentMethod: (id: number) => {
    set((state: MasterDataState) => ({
      paymentMethods: state.paymentMethods.filter((pm) => pm.id !== id),
    }));
  },

  // Loading state
  setIsLoadingMasterData: (isLoading: boolean) => {
    set({ isLoadingMasterData: isLoading });
  },

  // Bulk load
  loadAllMasterData: (data: {
    procedureTemplates: ProcedureTemplate[];
    signers: Array<{ id: number; name: string }>;
    reasonTypes: ReasonType[];
    paymentMethods: PaymentMethod[];
  }) => {
    set({
      procedureTemplates: data.procedureTemplates,
      signers: data.signers,
      reasonTypes: data.reasonTypes,
      paymentMethods: data.paymentMethods,
      isLoadingMasterData: false,
    });
  },
});
