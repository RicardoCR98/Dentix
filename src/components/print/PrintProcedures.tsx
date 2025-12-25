// src/components/print/PrintProcedures.tsx
import { memo, useMemo } from "react";
import type { SessionItem } from "../../lib/types";

interface PrintProceduresProps {
  sessionItems: SessionItem[];
}

export const PrintProcedures = memo(function PrintProcedures({
  sessionItems,
}: PrintProceduresProps) {
  // Filter active items only (memoized)
  const activeItems = useMemo(
    () => sessionItems.filter((item) => item.is_active !== false),
    [sessionItems]
  );

  if (activeItems.length === 0) {
    return (
      <section className="print-section-professional">
        <div className="print-section-title-box">
          <div className="print-section-title">IV. PROCEDIMIENTOS REALIZADOS</div>
        </div>
        <div className="print-empty-message">
          No se registraron procedimientos en esta consulta.
        </div>
      </section>
    );
  }

  return (
    <section className="print-section-professional">
      <div className="print-section-title-box">
        <div className="print-section-title">IV. PROCEDIMIENTOS REALIZADOS</div>
      </div>

      <table className="print-procedures-table-professional">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>N°</th>
            <th style={{ width: "50%" }}>Procedimiento</th>
            <th style={{ width: "15%" }}>Pieza Dental</th>
            <th style={{ width: "25%" }}>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {activeItems.map((item, index) => (
            <tr key={item.id || index}>
              <td className="print-table-center">{index + 1}</td>
              <td>{item.name}</td>
              <td className="print-table-center">
                {item.tooth_number ? item.tooth_number : "—"}
              </td>
              <td className="print-table-notes">
                {item.procedure_notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
});
