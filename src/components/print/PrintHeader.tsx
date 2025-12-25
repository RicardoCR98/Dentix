// src/components/print/PrintHeader.tsx
import { memo, useMemo } from "react";
import type { DoctorProfile } from "../../lib/types";
import { getClinicInitials } from "../../lib/print-utils";

interface PrintHeaderProps {
  doctorProfile: DoctorProfile;
}

export const PrintHeader = memo(function PrintHeader({
  doctorProfile,
}: PrintHeaderProps) {
  const headerData = useMemo(
    () => ({
      clinicName: doctorProfile.clinic_name || "Clínica Dental",
      clinicSlogan: doctorProfile.clinic_slogan || "Cuidado Profesional de Tu Salud Bucal",
      doctorName: doctorProfile.name || "",
      phone: doctorProfile.phone || "",
      email: doctorProfile.email || "",
      location: doctorProfile.location || "",
    }),
    [doctorProfile]
  );

  return (
    <header className="print-header-professional">
      {/* Top border decoration */}
      <div className="print-header-top-border" />

      <div className="print-header-content">
        {/* Left side - Clinic Info */}
        <div className="print-header-left">
          <div className="print-header-clinic-name">{headerData.clinicName}</div>
          <div className="print-header-slogan">{headerData.clinicSlogan}</div>
          {headerData.doctorName && (
            <div className="print-header-doctor">Dr. {headerData.doctorName}</div>
          )}
        </div>

        {/* Right side - Contact Info in box */}
        <div className="print-header-right">
          {headerData.location && (
            <div className="print-header-contact-line">
              <span className="print-header-label">Dirección:</span>
              <span>{headerData.location}</span>
            </div>
          )}
          {headerData.phone && (
            <div className="print-header-contact-line">
              <span className="print-header-label">Teléfono:</span>
              <span>{headerData.phone}</span>
            </div>
          )}
          {headerData.email && (
            <div className="print-header-contact-line">
              <span className="print-header-label">Email:</span>
              <span>{headerData.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Document title */}
      <div className="print-document-title">
        HISTORIA CLÍNICA ODONTOLÓGICA
      </div>
    </header>
  );
});
