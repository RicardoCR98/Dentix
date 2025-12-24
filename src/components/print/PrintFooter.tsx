// src/components/print/PrintFooter.tsx
import { memo } from "react";
import type { DoctorProfile } from "../../lib/types";
import { formatDateTime } from "../../lib/print-utils";

interface PrintFooterProps {
  signer: string;
  printedAt: Date;
  doctorProfile: DoctorProfile;
}

export const PrintFooter = memo(function PrintFooter({
  signer,
  printedAt,
  doctorProfile,
}: PrintFooterProps) {
  const printDateFormatted = formatDateTime(printedAt.toISOString());
  const clinicName = doctorProfile.clinic_name || "Clínica Dental";

  return (
    <footer className="print-footer-professional">
      {/* Signature Section */}
      <div className="print-signature-section">
        <div className="print-signature-box">
          <div className="print-signature-line" />
          <div className="print-signature-label">Firma y Sello del Profesional</div>
          <div className="print-signature-name">
            {signer ? `Dr. ${signer}` : "Dr. _________________"}
          </div>
          <div className="print-signature-reg">Odontólogo Tratante</div>
        </div>
      </div>

      {/* Footer info */}
      <div className="print-footer-info">
        <div className="print-footer-left">
          <div>{clinicName}</div>
          <div className="print-footer-small">Historia Clínica Odontológica</div>
        </div>
        <div className="print-footer-right">
          <div className="print-footer-small">
            Documento generado electrónicamente
          </div>
          <div className="print-footer-small">
            Fecha de impresión: {printDateFormatted}
          </div>
        </div>
      </div>
    </footer>
  );
});
