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
 * - Waits for layout mode to be loaded before rendering (prevents flash of wrong layout)
 *
 * Usage:
 * Import this component in routes:
 * ```tsx
 * <Route path="pacientes" element={<PatientsPageWrapper />} />
 * ```
 */
export function PatientsPageWrapper() {
  const layoutMode = useAppStore((state) => state.layoutMode);
  const layoutModeInitialized = useAppStore((state) => state.layoutModeInitialized);
  const loadLayoutModeFromDB = useAppStore((state) => state.loadLayoutModeFromDB);

  // Load saved layout preference on mount
  useEffect(() => {
    loadLayoutModeFromDB();
  }, [loadLayoutModeFromDB]);

  // Wait for layout mode to be loaded from database before rendering
  // This prevents flash of wrong layout when navigating from patient list
  if (!layoutModeInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--brand))]"></div>
      </div>
    );
  }

  return <PatientsPageUnified layoutMode={layoutMode} />;
}
