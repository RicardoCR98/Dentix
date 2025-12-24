// src/components/print/PrintSessionInfo.tsx
import { memo } from "react";
import type { Session } from "../../lib/types";
import { formatDate } from "../../lib/print-utils";

interface PrintSessionInfoProps {
  session: Session;
}

export const PrintSessionInfo = memo(function PrintSessionInfo({
  session,
}: PrintSessionInfoProps) {
  const sessionDate = formatDate(session.date);
  const reasonType = session.reason_type || "";
  const reasonDetail = session.reason_detail || "";
  const signer = session.signer || "";

  const fullReason = reasonDetail
    ? `${reasonType} - ${reasonDetail}`
    : reasonType || "No especificado";

  return (
    <section className="print-section-professional">
      <div className="print-section-title-box">
        <div className="print-section-title">II. INFORMACIÓN DE LA CONSULTA</div>
      </div>

      <table className="print-data-table">
        <tbody>
          <tr>
            <td className="print-data-label">Fecha de Consulta:</td>
            <td className="print-data-value">{sessionDate}</td>
            <td className="print-data-label">Profesional:</td>
            <td className="print-data-value">
              {signer ? `Dr. ${signer}` : "—"}
            </td>
          </tr>
          <tr>
            <td className="print-data-label">Motivo de Consulta:</td>
            <td className="print-data-value" colSpan={3}>{fullReason}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
});
