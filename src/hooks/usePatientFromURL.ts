// src/hooks/usePatientFromURL.ts
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Patient } from "../lib/types";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { useToast } from "./useToast";

interface UsePatientFromURLOptions {
  onPatientLoaded: (patient: Patient) => Promise<boolean | void>;
}

/**
 * Hook to load a patient from URL parameter (?patientId=123)
 * Loads patient data once on mount if patientId is present
 */
export function usePatientFromURL({ onPatientLoaded }: UsePatientFromURLOptions) {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [urlPatientLoaded, setUrlPatientLoaded] = useState(false);

  useEffect(() => {
    // Only load once
    if (urlPatientLoaded) return;

    const patientIdParam = searchParams.get("patientId");
    if (!patientIdParam) {
      setUrlPatientLoaded(true);
      return;
    }

    const patientId = parseInt(patientIdParam, 10);
    if (isNaN(patientId)) {
      setUrlPatientLoaded(true);
      return;
    }

    (async () => {
      try {
        const repo = await getRepository();
        const p = await repo.findPatientById(patientId);

        if (!p) {
          toast.warning(
            "Paciente no encontrado",
            "No se pudo cargar el paciente solicitado",
          );
          // Clear URL parameter
          setSearchParams({});
          setUrlPatientLoaded(true);
          return;
        }

        // Load patient data via callback
        await onPatientLoaded(p);

        toast.success(
          "Paciente cargado",
          `Se cargó la historia clínica de ${p.full_name}`,
        );

        setUrlPatientLoaded(true);
      } catch (error) {
        console.error("Error cargando paciente desde URL:", error);
        toast.error(
          "Error al cargar",
          "No se pudo cargar el paciente desde la URL",
        );
        setUrlPatientLoaded(true);
      }
    })();
  }, [urlPatientLoaded, searchParams, toast, setSearchParams, onPatientLoaded]);

  return {
    clearPatientURL: () => setSearchParams({}),
    resetURLFlag: () => setUrlPatientLoaded(false),
  };
}
