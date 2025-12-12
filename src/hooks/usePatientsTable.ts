// src/hooks/usePatientsTable.ts
import { useState, useEffect } from "react";
import { tauriSqliteRepository } from "../lib/storage/TauriSqliteRepository";
import type { PatientListItem } from "../lib/types";

export function usePatientsTable() {
  const [data, setData] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const patients = await tauriSqliteRepository.getAllPatientsList();
      setData(patients);
    } catch (err) {
      console.error("Error loading patients:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadPatients();
  };

  return {
    data,
    loading,
    error,
    globalFilter,
    setGlobalFilter,
    refresh,
  };
}
