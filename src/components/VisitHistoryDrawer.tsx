// src/components/VisitHistoryDrawer.tsx
// Componente para mostrar el historial de visitas de un paciente
// No se usará por el momento
// En un futuro se puede usar para mostrar el historial de visitas de un paciente
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Calendar,
  Stethoscope,
  FileText,
  BookHeart,
  Eye,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import type { Visit } from "../lib/types";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { cn } from "../lib/cn";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patientId: number | null;
  onViewVisit: (visitId: number) => void; // ver visita completa (modo histórico)
  onUseOdontogram: (visitId: number) => void; // copiar odontograma como base
};

export default function VisitHistoryDrawer({
  open,
  onOpenChange,
  patientId,
  onViewVisit,
  onUseOdontogram,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<
    Array<
      Visit & {
        id: number;
        reason_type?: string;
        reason_detail?: string | null;
        diagnosis?: string | null;
        tooth_dx_json?: string | null;
        full_dx_text?: string | null;
        date: string;
      }
    >
  >([]);

  // Paginado
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(
    () => (total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize))),
    [total, pageSize],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const reload = useCallback(async () => {
    if (!patientId || !open) return;
    setLoading(true);
    try {
      const repo = await getRepository();
      const {
        rows,
        total: t,
        page: p,
      } = await repo.getVisitsByPatientPaged(patientId, page, pageSize);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVisits(rows as any);
      setTotal(t);

      // Si el usuario estaba en una página > totalPages (después de borrar), reajusta
      const newTotalPages = t === 0 ? 1 : Math.ceil(t / pageSize);
      if (p > newTotalPages) {
        setPage(newTotalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, open, page, pageSize]);

  useEffect(() => {
    if (!open || !patientId) return;
    void reload();
  }, [open, patientId, page, reload]);

  const onDelete = useCallback(
    async (visitId: number) => {
      if (
        !confirm(
          "¿Eliminar esta visita y todo su contenido? Esta acción no se puede deshacer.",
        )
      ) {
        return;
      }
      const repo = await getRepository();
      await repo.deleteVisit(visitId);

      // Si borramos la única visita de la página, intenta retroceder una página
      if (visits.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void reload();
      }
    },
    [page, visits.length, reload],
  );

  // Rangos mostrados
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 transition-opacity z-40",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => onOpenChange(false)}
      />
      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[560px] bg-[hsl(var(--background))] shadow-2xl z-50 transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Histórico de visitas</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Selecciona una visita para ver sus sesiones o usar su odontograma
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X size={16} />
          </Button>
        </div>

        <div className="p-4 space-y-3 h-[calc(100%-116px)] overflow-y-auto">
          {!patientId ? (
            <Alert variant="warning">
              Busca y selecciona un paciente para ver su histórico.
            </Alert>
          ) : loading ? (
            <Alert variant="info">Cargando visitas…</Alert>
          ) : total === 0 ? (
            <Alert variant="info">
              Este paciente no tiene visitas registradas.
            </Alert>
          ) : (
            visits.map((v) => {
              const reason = (v.reason_type as string) ?? v.reason_type ?? "—";
              const det =
                (v.reason_detail as string) ??
                (v.reason_detail as string) ??
                "";
              const diag =
                (v.full_dx_text as string) ?? (v.diagnosis as string) ?? "";
              return (
                <div key={v.id} className="card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} />
                        <span className="font-semibold">{v.date}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <Stethoscope
                          size={14}
                          className="text-[hsl(var(--brand))]"
                        />
                        <span className="truncate">
                          <b>{reason}</b>{" "}
                          {det ? (
                            <span className="text-[hsl(var(--muted-foreground))]">
                              · {det}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      {diag ? (
                        <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                          <FileText size={12} className="inline mr-1" />
                          {diag}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewVisit(v.id!)}
                        title="Ver visita completa (modo histórico)"
                      >
                        <Eye size={14} />
                        Ver visita
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUseOdontogram(v.id!)}
                        title="Copiar odontograma como base para nueva visita"
                      >
                        <BookHeart size={14} />
                        Odontograma
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(v.id!)}
                        title="Eliminar esta visita y todo su contenido"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {total > 0 && (
            <Alert variant="info">
              <div className="flex items-start gap-2 text-xs">
                <Copy size={14} className="mt-0.5" />
                <div>
                  <b>Tips:</b> “Ver visita” carga <u>solo lectura</u> (incluye
                  sesiones y adjuntos). “Odontograma” crea una nueva visita hoy
                  con ese odontograma. Eliminar borra la visita, sus sesiones e
                  items y los metadatos de adjuntos (los archivos en disco no se
                  tocan).
                </div>
              </div>
            </Alert>
          )}
        </div>

        {/* Paginador */}
        <div className="border-t p-3 flex items-center justify-between">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            {total === 0
              ? "Sin resultados"
              : `Mostrando ${rangeFrom}–${rangeTo} de ${total}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
              title="Anterior"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm">
              Página <b>{page}</b> / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              title="Siguiente"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
