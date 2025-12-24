// src/components/print/PrintTemplate.tsx
import { memo } from "react";
import type { Patient, Session, SessionItem, DoctorProfile } from "../../lib/types";
import {
  formatDate,
  formatDateTime,
  calculateAge,
  parseToothDx,
  getClinicInitials,
} from "../../lib/print-utils";
import { PrintHeader } from "./PrintHeader";
import { PrintPatientInfo } from "./PrintPatientInfo";
import { PrintSessionInfo } from "./PrintSessionInfo";
import { PrintOdontogram } from "./PrintOdontogram";
import { PrintProcedures } from "./PrintProcedures";
import { PrintClinicalNotes } from "./PrintClinicalNotes";
import { PrintFooter } from "./PrintFooter";
import "../../styles/print.css";

export interface PrintTemplateProps {
  // Snapshot data
  patient: Patient;
  session: Session;
  sessionItems: SessionItem[];
  doctorProfile: DoctorProfile;

  // Optional current timestamp for print metadata
  printedAt?: Date;
}

/**
 * PrintTemplate - Main print template component for clinical history
 * This component renders a complete clinical history document for a specific session
 *
 * Design: Professional dental clinic print layout optimized for A4/Letter
 * Layout: Vertical, single-column with clear sections
 * Excludes: Financial information (budget, payment, balance)
 *
 * Usage: Rendered when user presses Ctrl+P or Print button
 */
export const PrintTemplate = memo(function PrintTemplate({
  patient,
  session,
  sessionItems,
  doctorProfile,
  printedAt = new Date(),
}: PrintTemplateProps) {
  // Debug logging
  console.log("[PrintTemplate] Rendering with:", {
    patientId: patient.id,
    patientName: patient.full_name,
    sessionId: session.id,
    sessionDate: session.date,
    itemsCount: sessionItems.length,
    doctorProfile: doctorProfile.clinic_name,
  });

  // Parse tooth diagnosis from session
  const toothDx = parseToothDx(session.tooth_dx_json);

  // Calculate patient age
  const patientAge = calculateAge(patient.date_of_birth);

  // Extract diagnosis texts
  const autoDiagnosis = session.auto_dx_text || "";
  const manualDiagnosis = session.diagnosis_text || "";
  const fullDiagnosis = session.full_dx_text || autoDiagnosis;

  // Clinical notes
  const clinicalNotes = session.clinical_notes || "";

  return (
    <div className="print-wrapper">
      <div className="print-template">
        {/* Header - Clinic Information */}
        <PrintHeader doctorProfile={doctorProfile} />

        {/* Patient Information */}
        <PrintPatientInfo patient={patient} age={patientAge} />

        {/* Session Information */}
        <PrintSessionInfo session={session} />

        {/* Odontogram + Diagnosis */}
        <PrintOdontogram
          toothDx={toothDx}
          autoDiagnosis={autoDiagnosis}
          manualDiagnosis={manualDiagnosis}
        />

        {/* Procedures Performed */}
        <PrintProcedures sessionItems={sessionItems} />

        {/* Clinical Notes / Observations */}
        <PrintClinicalNotes notes={clinicalNotes} />

        {/* Footer - Signature and Metadata */}
        <PrintFooter
          signer={session.signer || ""}
          printedAt={printedAt}
          doctorProfile={doctorProfile}
        />
      </div>
    </div>
  );
});
