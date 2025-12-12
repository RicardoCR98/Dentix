// src/hooks/useMasterData.ts
import { useCallback, useEffect, useState } from "react";
import type { ProcedureTemplate, ReasonType, PaymentMethod } from "../lib/types";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { useToast } from "./useToast";

/**
 * Hook to manage master/reference data (templates, signers, reason types, payment methods)
 * Loads data on mount and provides update functions
 */
export function useMasterData() {
  const toast = useToast();

  const [procedureTemplates, setProcedureTemplates] = useState<ProcedureTemplate[]>([]);
  const [signers, setSigners] = useState<Array<{ id: number; name: string }>>([]);
  const [reasonTypes, setReasonTypes] = useState<ReasonType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Load all master data on mount
  useEffect(() => {
    (async () => {
      try {
        const repo = await getRepository();

        const [templates, signersList, reasonTypesList, paymentMethodsList] =
          await Promise.all([
            repo.getProcedureTemplates(),
            repo.getSigners(),
            repo.getReasonTypes(),
            repo.getPaymentMethods(),
          ]);

        setProcedureTemplates(templates);
        setSigners(signersList);
        setReasonTypes(reasonTypesList);
        setPaymentMethods(paymentMethodsList);
      } catch (error) {
        console.error("Error inicializando datos:", error);
        alert(
          "Error al cargar datos iniciales. Por favor recarga la aplicación.",
        );
        setProcedureTemplates([]);
        setSigners([]);
        setReasonTypes([]);
        setPaymentMethods([]);
      }
    })();
  }, []);

  // Update procedure templates
  const updateProcedureTemplates = useCallback(
    async (
      items: Array<{
        name: string;
        unit_price: number;
        procedure_template_id?: number;
      }>,
    ) => {
      try {
        // Filter only items with names
        const validItems = items.filter((it) => it.name.trim().length > 0);

        const templates = validItems.map((it) => ({
          id: it.procedure_template_id,
          name: it.name.trim(),
          default_price: it.unit_price,
        }));

        const repo = await getRepository();
        await repo.saveProcedureTemplates(templates);

        // Reload from database to get correct IDs
        const updatedTemplates = await repo.getProcedureTemplates();
        setProcedureTemplates(updatedTemplates);

        toast.success(
          "Plantilla actualizada",
          "La plantilla de procedimientos se guardó correctamente",
        );
      } catch (error) {
        console.error("Error actualizando plantillas:", error);
        toast.error(
          "Error",
          "No se pudo guardar la plantilla de procedimientos",
        );
        throw error;
      }
    },
    [toast],
  );

  // Reload signers list
  const reloadSigners = useCallback(async () => {
    try {
      const repo = await getRepository();
      const list = await repo.getSigners();
      setSigners(list);
    } catch (error) {
      console.error("Error recargando doctores:", error);
    }
  }, []);

  // Reload reason types
  const reloadReasonTypes = useCallback(async () => {
    try {
      const repo = await getRepository();
      const list = await repo.getReasonTypes();
      setReasonTypes(list);
    } catch (error) {
      console.error("Error recargando tipos de motivos:", error);
    }
  }, []);

  // Handler for reason types change (used by child components)
  const handleReasonTypesChange = useCallback(async () => {
    const repo = await getRepository();
    const updated = await repo.getReasonTypes();
    setReasonTypes(updated);
  }, []);

  return {
    // State
    procedureTemplates,
    signers,
    reasonTypes,
    paymentMethods,

    // Updaters
    updateProcedureTemplates,
    reloadSigners,
    reloadReasonTypes,
    handleReasonTypesChange,
  };
}
