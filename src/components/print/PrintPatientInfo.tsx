// src/components/print/PrintPatientInfo.tsx
import { memo } from "react";
import type { Patient } from "../../lib/types";
import { formatDate } from "../../lib/print-utils";

interface PrintPatientInfoProps {
  patient: Patient;
  age: number;
}

export const PrintPatientInfo = memo(function PrintPatientInfo({
  patient,
  age,
}: PrintPatientInfoProps) {
  const hasAllergy = !!patient.allergy_detail;
  const hasAnamnesis = !!patient.anamnesis;
  const birthDate = formatDate(patient.date_of_birth);

  return (
    <section className="print-section-professional">
      <div className="print-section-title-box">
        <div className="print-section-title">I. DATOS DEL PACIENTE</div>
      </div>

      <table className="print-data-table">
        <tbody>
          <tr>
            <td className="print-data-label">Nombre Completo:</td>
            <td className="print-data-value" colSpan={3}>{patient.full_name}</td>
          </tr>
          <tr>
            <td className="print-data-label">Documento de Identidad:</td>
            <td className="print-data-value">{patient.doc_id}</td>
            <td className="print-data-label">Fecha de Nacimiento:</td>
            <td className="print-data-value">{birthDate} ({age} años)</td>
          </tr>
          <tr>
            <td className="print-data-label">Teléfono:</td>
            <td className="print-data-value">{patient.phone}</td>
            <td className="print-data-label">Tel. Emergencia:</td>
            <td className="print-data-value">{patient.emergency_phone || "—"}</td>
          </tr>
          {patient.email && (
            <tr>
              <td className="print-data-label">Correo Electrónico:</td>
              <td className="print-data-value" colSpan={3}>{patient.email}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Allergy Alert Box */}
      {hasAllergy && (
        <div className="print-alert-box print-alert-danger">
          <div className="print-alert-icon">⚠</div>
          <div className="print-alert-content">
            <div className="print-alert-title">ALERGIAS IDENTIFICADAS</div>
            <div className="print-alert-text">{patient.allergy_detail}</div>
          </div>
        </div>
      )}

      {/* Anamnesis Box */}
      {hasAnamnesis && (
        <div className="print-anamnesis-box">
          <div className="print-anamnesis-title">Antecedentes Médicos (Anamnesis):</div>
          <div className="print-anamnesis-text">{patient.anamnesis}</div>
        </div>
      )}
    </section>
  );
});
