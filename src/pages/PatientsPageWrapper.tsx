// src/pages/PatientsPageWrapper.tsx
import { useEffect } from "react";
import { useAppStore } from "../stores";
import { PatientsPageUnified } from "./PatientsPageUnified";

/**
 * PatientsPageWrapper Component
 *
 * Wrapper that loads the user's layout preference from the database
 * and renders the unified patient component with the appropriate layout.
 *
 * Features:
 * - Loads layout preference from database on mount
 * - Preserves state when switching between layouts
 * - Persists layout changes to database automatically
 *
 * Usage:
 * Import this component in routes:
 * ```tsx
 * <Route path="pacientes" element={<PatientsPageWrapper />} />
 * ```
 */
export function PatientsPageWrapper() {
  const layoutMode = useAppStore((state) => state.layoutMode);
  const loadLayoutModeFromDB = useAppStore((state) => state.loadLayoutModeFromDB);

  // Load saved layout preference on mount
  useEffect(() => {
    loadLayoutModeFromDB();
  }, [loadLayoutModeFromDB]);

  return <PatientsPageUnified layoutMode={layoutMode} />;
}
