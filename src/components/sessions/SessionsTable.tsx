// src/components/sessions/SessionsTable.tsx
import { useMemo, useState, memo, useCallback, useEffect } from "react";
import { toInt } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import {
  Plus,
  FileText,
} from "lucide-react";
import { SessionCard } from "./SessionCard";
import type {
  VisitWithProcedures,
  VisitProcedure,
  ProcedureTemplate,
  ReasonType,
  PaymentMethod,
} from "../../lib/types";
import type { TemplateContext } from "../../lib/templates/templateProcessor";

interface SessionsTableProps {
  sessions: VisitWithProcedures[];
  onSessionsChange: (sessions: VisitWithProcedures[]) => void;
  procedureTemplates: ProcedureTemplate[];
  onUpdateTemplates: (
    items: Array<{
      name: string;
      unit_price: number;
      procedure_template_id?: number;
    }>,
  ) => Promise<void>;
  onCreateSession?: () => void;
  signers: Array<{ id: number; name: string }>;
  onSignersChange: () => Promise<void>;
  reasonTypes: ReasonType[];
  paymentMethods: PaymentMethod[];
  onReasonTypesChange: () => Promise<void>;
  autoCreateDraftKey?: number | string;
  activeId?: number | null;
  onOpenSession?: (sessionId: number) => void;
  onViewReadOnly?: (sessionId: number, visitId?: number) => void;
  isSnapshotMode?: boolean;
  templateContext?: TemplateContext;
}

const SessionsTable = memo(function SessionsTable({
  sessions,
  onSessionsChange,
  procedureTemplates,
  onUpdateTemplates,
  onCreateSession,
  signers,
  onSignersChange,
  reasonTypes,
  paymentMethods,
  onReasonTypesChange,
  autoCreateDraftKey,
  activeId,
  onOpenSession,
  onViewReadOnly,
  isSnapshotMode = false,
  templateContext,
}: SessionsTableProps) {
  // Estado interno para IDs expandidos (múltiples cards pueden estar expandidas)
  // In snapshot mode, start with all cards collapsed
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Estado para modo edición de plantilla de procedimientos
  const [editModeSessionId, setEditModeSessionId] = useState<string | null>(
    null,
  );

  // Estado para guardar snapshot de items originales (para poder cancelar cambios)
  const [itemsSnapshot, setItemsSnapshot] = useState<
    Map<string, VisitProcedure[]>
  >(new Map());

  // Estado para controlar si el presupuesto es editable manualmente (por sesión)
  const [manualBudgetEnabled, setManualBudgetEnabled] = useState<
    Map<string, boolean>
  >(new Map());

  // Efecto para expandir la sesión más reciente automáticamente cuando se crea una nueva
  useEffect(() => {
    // Skip auto-expansion in snapshot mode - all cards start collapsed
    if (isSnapshotMode) return;

    // Filtrar sesiones válidas (con session definido)
    const validSessions = sessions.filter((s) => s.session);

    if (validSessions.length > 0 && activeId === undefined) {
      // Encontrar la sesión más reciente
      const mostRecent = validSessions.reduce((prev, current) => {
        return (current.session?.date ?? "") > (prev.session?.date ?? "")
          ? current
          : prev;
      }, validSessions[0]);

      if (mostRecent.session?.id) {
        const idStr = mostRecent.session.id.toString();
        // Solo expandir si no está ya expandida
        setExpandedIds((prev) => {
          if (prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.add(idStr);
          return next;
        });
      }
    }
  }, [sessions.length, activeId, isSnapshotMode]);

  // NEW: Sync expansion with activeId (when session context changes)
  useEffect(() => {
    // Skip auto-expansion in snapshot mode
    if (isSnapshotMode) return;

    if (activeId !== undefined && activeId !== null) {
      const idStr = String(activeId);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(idStr);
        return next;
      });
    }
  }, [activeId, isSnapshotMode]);

  // Determinar cuál es la sesión más reciente EN BORRADOR (la única editable)
  const mostRecentDraftId = useMemo(() => {
    const drafts = sessions.filter(
      (s) => s.session && s.session.is_saved === false,
    );
    if (drafts.length === 0) return null;

    let mostRecent = drafts[0];
    for (const session of drafts) {
      if ((session.session?.date ?? "") > (mostRecent.session?.date ?? "")) {
        mostRecent = session;
      }
    }
    return mostRecent.session?.id;
  }, [sessions]);

  const newRow = useCallback((): VisitWithProcedures => {
    const baseItems: VisitProcedure[] = procedureTemplates.map(
      (template, index) => ({
        id: Date.now() + index,
        name: template.name,
        unit_price: template.default_price,
        quantity: 0,
        subtotal: 0,
        is_active: false, // ✅ NUEVO: Checkbox desactivado por defecto (plantilla limpia)
        procedure_template_id: template.id,
      }),
    );

    const today = new Date().toISOString().slice(0, 10);

    // Generar ID temporal único negativo para sesiones en borrador
    const tempId = -Date.now();

    return {
      session: {
        id: tempId, // ✅ ID temporal para borradores
        date: today,
        budget: 0,
        discount: 0,
        payment: 0,
        balance: 0,
        cumulative_balance: 0,
        signer: "",
        clinical_notes: "",
        is_saved: false,
      },
      items: baseItems,
    };
  }, [procedureTemplates]);

  // Lista ordenada por fecha (descendente: más reciente primero)
  const sortedSessions = useMemo(() => {
    const copy = [...sessions].filter((s) => s.session);
    copy.sort((a, b) => {
      const da = a.session?.date ?? "";
      const db = b.session?.date ?? "";
      return db.localeCompare(da);
    });
    return copy;
  }, [sessions]);

  // Pagination removed - show all sessions with scrolling
  const visibleSessions = sortedSessions;

  // Agregar sesión
  const addRow = useCallback(() => {
    if (onCreateSession) {
      onCreateSession();
      return;
    }

    let previousSession: VisitWithProcedures | null = null;
    const validSessions = sessions.filter((s) => s.session);
    if (validSessions.length > 0) {
      previousSession = validSessions[0];
      for (const session of validSessions) {
        if (
          (session.session?.date ?? "") > (previousSession.session?.date ?? "")
        ) {
          previousSession = session;
        }
      }
    }

    const row = newRow();

    if (previousSession) {
      const prevQtyMap = new Map(
        previousSession.items.map((item) => [item.name, item.quantity]),
      );

      row.items = row.items.map((item, index) => ({
        ...item,
        id: -(Date.now() + index + 1000),
        quantity: prevQtyMap.get(item.name) || 0,
        subtotal: item.unit_price * (prevQtyMap.get(item.name) || 0),
      }));
    }

    const next = [row, ...sessions];
    onSessionsChange(next);

    if (row.session.id) {
      if (onOpenSession) {
        onOpenSession(row.session.id);
      } else {
        const idStr = row.session.id.toString();
        setExpandedIds((prev) => {
          const nextSet = new Set(prev);
          nextSet.add(idStr);
          return nextSet;
        });
      }
    }
  }, [onCreateSession, sessions, onSessionsChange, onOpenSession, newRow]);

  useEffect(() => {
    if (autoCreateDraftKey === undefined || autoCreateDraftKey === null) return;
    addRow();
  }, [autoCreateDraftKey, addRow]);

  // Eliminar sesión (solo borradores)
  const deleteSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find(
        (s) => s.session.id?.toString() === sessionId,
      );

      if (session?.session.is_saved) {
        alert("No se puede eliminar una sesión guardada (histórico legal)");
        return;
      }

      if (!confirm("¿Eliminar esta sesión en borrador?")) {
        return;
      }

      const next = sessions.filter(
        (s) => s.session?.id?.toString() !== sessionId,
      );
      onSessionsChange(next);
    },
    [sessions, onSessionsChange],
  );

  // Recalcular montos
  const recalcRow = useCallback(
    (idxOriginal: number, mutate?: (r: VisitWithProcedures) => void) => {
      const next = [...sessions];
      const r = {
        ...next[idxOriginal],
        session: { ...next[idxOriginal].session },
      };
      mutate?.(r);
      r.items = r.items.map((it) => ({
        ...it,
        subtotal: toInt(it.unit_price) * toInt(it.quantity),
      }));
      // ✅ FILTRAR solo procedimientos activos para calcular presupuesto
      const totalProcs = r.items
        .filter((it) => it.is_active ?? it.quantity > 0) // Solo activos
        .reduce((sum, it) => sum + it.subtotal, 0);

      // Solo auto-calcular si el presupuesto manual NO está habilitado
      const sessionId = r.session.id?.toString() || "";
      if (!manualBudgetEnabled.get(sessionId)) {
        r.session.budget = totalProcs;
      }

      // Balance = Presupuesto - Descuento - Abono
      r.session.balance =
        r.session.budget - toInt(r.session.discount) - r.session.payment;
      next[idxOriginal] = r;
      onSessionsChange(next);
    },
    [sessions, onSessionsChange, manualBudgetEnabled],
  );

  // Pagination navigation functions removed

  const handleToggleRow = useCallback(
    (id: number) => {
      const idStr = id.toString();
      setExpandedIds((prev) => {
        const next = new Set(prev);
        const wasExpanded = next.has(idStr);

        if (wasExpanded) {
          next.delete(idStr);
        } else {
          next.add(idStr);
          // NEW: Notify parent when expanding a session (makes it active)
          if (onOpenSession) {
            onOpenSession(id);
          }
        }
        return next;
      });
    },
    [onOpenSession],
  );

  // Agregar un procedimiento vacío a una sesión
  const addProcedure = useCallback(
    (idxOriginal: number) => {
      const next = [...sessions];
      const r = { ...next[idxOriginal] };
      r.items = [
        ...r.items,
        {
          id: -Date.now(),
          name: "",
          unit_price: 0,
          quantity: 0,
          subtotal: 0,
        },
      ];
      next[idxOriginal] = r;
      onSessionsChange(next);
    },
    [sessions, onSessionsChange],
  );

  // Eliminar un procedimiento de una sesión
  const removeProcedure = useCallback(
    (sessionIdx: number, itemIdx: number) => {
      recalcRow(sessionIdx, (r) => {
        r.items = r.items.filter((_, idx) => idx !== itemIdx);
      });
    },
    [recalcRow],
  );

  // Entrar al modo edición de plantilla
  const enterEditMode = useCallback(
    (sessionId: number) => {
      const session = sessions.find((s) => s.session?.id === sessionId);
      if (session) {
        const snapshot = JSON.parse(
          JSON.stringify(session.items),
        ) as VisitProcedure[];
        setItemsSnapshot((prev) =>
          new Map(prev).set(sessionId.toString(), snapshot),
        );
      }
      setEditModeSessionId(sessionId.toString());
    },
    [sessions],
  );

  // Salir del modo edición de plantilla
  const exitEditMode = useCallback(async () => {
    if (!editModeSessionId) return;

    const sessionIdx = sessions.findIndex(
      (s) => s.session?.id?.toString() === editModeSessionId,
    );
    if (sessionIdx === -1) {
      setEditModeSessionId(null);
      return;
    }

    const session = sessions[sessionIdx];
    await onUpdateTemplates(session.items);

    setEditModeSessionId(null);
  }, [editModeSessionId, sessions, onUpdateTemplates]);

  // Cancelar la edición de plantilla y restaurar items originales
  const cancelEditMode = useCallback(() => {
    if (!editModeSessionId) return;

    const snapshot = itemsSnapshot.get(editModeSessionId);
    if (snapshot) {
      const sessionIdx = sessions.findIndex(
        (s) => s.session?.id?.toString() === editModeSessionId,
      );
      if (sessionIdx !== -1) {
        const next = [...sessions];
        next[sessionIdx] = {
          ...next[sessionIdx],
          items: JSON.parse(JSON.stringify(snapshot)),
        };
        onSessionsChange(next);
      }

      setItemsSnapshot((prev) => {
        const newMap = new Map(prev);
        newMap.delete(editModeSessionId);
        return newMap;
      });
    }

    setEditModeSessionId(null);
  }, [editModeSessionId, itemsSnapshot, sessions, onSessionsChange]);

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">Sesiones de tratamiento</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {sessions.length} sesión{sessions.length !== 1 ? "es" : ""}{" "}
            registrada
            {sessions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={addRow} size="sm">
            <Plus size={16} />
            Nueva sesión
          </Button>
        </div>
      </div>

      {/* Tabla de sesiones */}
      {sessions.length === 0 ? (
        <Alert variant="info">
          <div className="text-center py-4">
            <FileText
              size={48}
              className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]"
            />
            <p className="font-medium mb-1">No hay sesiones registradas</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Haz clic en "Nueva sesión" para comenzar
            </p>
          </div>
        </Alert>
      ) : (
        <div className="space-y-3">
          {visibleSessions
            .filter((row) => row.session)
            .map((row) => {
              const sessionId = row.session?.id?.toString() || "";
              const isExpanded = expandedIds.has(sessionId);
              const displayIndex =
                sortedSessions.length -
                sortedSessions.findIndex(
                  (s) => s.session?.id === row.session?.id,
                );
              const idxReal = sessions.findIndex(
                (s) => s.session?.id === row.session?.id,
              );
              const isEditable =
                row.session?.is_saved === false &&
                row.session?.id === mostRecentDraftId;
              const inEditMode =
                editModeSessionId === row.session?.id?.toString();

              // ✅ Calcular saldo acumulado de sesiones GUARDADAS anteriores
              // Usamos fecha + ID para manejar múltiples sesiones el mismo día
              const currentDate = row.session?.date || "";
              const currentId = row.session?.id || 0;

              const previousSessions = sessions.filter((s) => {
                if (!s.session || !s.session.is_saved) return false;

                const sDate = s.session.date || "";
                const sId = s.session.id || 0;

                // Es anterior si:
                // 1. Fecha anterior, O
                // 2. Misma fecha pero ID menor (creada antes en el mismo día)
                return (
                  sDate < currentDate ||
                  (sDate === currentDate && sId < currentId)
                );
              });

              const previousBalance = previousSessions.reduce(
                (acc, s) => acc + (s.session?.balance || 0),
                0,
              );

              return (
                <SessionCard
                  key={row.session?.id || `session-${row.session?.date}`}
                  session={row}
                  displayIndex={displayIndex}
                  isExpanded={isExpanded}
                  isEditable={isEditable}
                  inEditMode={inEditMode}
                  isActive={row.session.id === activeId}
                  manualBudgetEnabled={
                    manualBudgetEnabled.get(sessionId) || false
                  }
                  previousBalance={previousBalance}
                  signers={signers}
                  reasonTypes={reasonTypes}
                  paymentMethods={paymentMethods}
                  onToggle={() =>
                    row.session.id && handleToggleRow(row.session.id)
                  }
                  onDateChange={(date) =>
                    recalcRow(idxReal, (r) => {
                      r.session.date = date;
                    })
                  }
                  onDelete={() =>
                    row.session.id && deleteSession(row.session.id.toString())
                  }
                  onViewReadOnly={() =>
                    onViewReadOnly?.(row.session.id!, row.session.patient_id)
                  }
                  onEnterEditMode={() =>
                    row.session.id && enterEditMode(row.session.id)
                  }
                  onExitEditMode={exitEditMode}
                  onCancelEditMode={cancelEditMode}
                  onAddProcedure={() => addProcedure(idxReal)}
                  onManualBudgetToggle={(enabled) => {
                    setManualBudgetEnabled((prev) => {
                      const next = new Map(prev);
                      next.set(sessionId, enabled);
                      return next;
                    });
                  }}
                  onBudgetChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.budget = value;
                    })
                  }
                  onDiscountChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.discount = value;
                    })
                  }
                  onPaymentChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.payment = value;
                    })
                  }
                  onPaymentMethodChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.payment_method_id = value;
                    })
                  }
                  onPaymentNotesChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.payment_notes = value;
                    })
                  }
                  onSignerChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.signer = value;
                    })
                  }
                  onClinicalNotesChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.clinical_notes = value;
                    })
                  }
                  onReasonTypeChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.reason_type = value;
                    })
                  }
                  onReasonDetailChange={(value) =>
                    recalcRow(idxReal, (r) => {
                      r.session.reason_detail = value;
                    })
                  }
                  onSignersChange={onSignersChange}
                  onReasonTypesChange={onReasonTypesChange}
                  onProcedureNameChange={(itemIdx, value) =>
                    recalcRow(idxReal, (r) => {
                      if (r.items[itemIdx]) {
                        r.items[itemIdx].name = value;
                      }
                    })
                  }
                  onProcedureUnitChange={(itemIdx, value) =>
                    recalcRow(idxReal, (r) => {
                      if (r.items[itemIdx]) {
                        r.items[itemIdx].unit_price = toInt(value);
                      }
                    })
                  }
                  onProcedureQtyChange={(itemIdx, value) =>
                    recalcRow(idxReal, (r) => {
                      if (r.items[itemIdx]) {
                        r.items[itemIdx].quantity = toInt(value);
                      }
                    })
                  }
                  onProcedureActiveChange={(itemIdx, value) =>
                    recalcRow(idxReal, (r) => {
                      if (r.items[itemIdx]) {
                        r.items[itemIdx].is_active = value;
                      }
                    })
                  }
                  onProcedureRemove={(itemIdx) =>
                    removeProcedure(idxReal, itemIdx)
                  }
                  templateContext={templateContext}
                />
              );
            })}
        </div>
      )}

      {/* Pagination removed - sessions now scroll naturally */}
    </div>
  );
});

SessionsTable.displayName = "SessionsTable";

export default SessionsTable;
