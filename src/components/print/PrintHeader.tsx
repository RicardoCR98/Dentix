// src/components/print/PrintHeader.tsx
import { memo } from "react";
import type { DoctorProfile } from "../../lib/types";
import { getClinicInitials } from "../../lib/print-utils";

interface PrintHeaderProps {
  doctorProfile: DoctorProfile;
}

export const PrintHeader = memo(function PrintHeader({
  doctorProfile,
}: PrintHeaderProps) {
  const clinicName = doctorProfile.clinic_name || "Clínica Dental";
  const clinicSlogan = doctorProfile.clinic_slogan || "Cuidado Profesional de Tu Salud Bucal";
  const doctorName = doctorProfile.name || "";
  const phone = doctorProfile.phone || "";
  const email = doctorProfile.email || "";
  const location = doctorProfile.location || "";

  return (
    <header className="print-header-professional">
      {/* Top border decoration */}
      <div className="print-header-top-border" />

      <div className="print-header-content">
        {/* Left side - Clinic Info */}
        <div className="print-header-left">
          <div className="print-header-clinic-name">{clinicName}</div>
          <div className="print-header-slogan">{clinicSlogan}</div>
          {doctorName && (
            <div className="print-header-doctor">Dr. {doctorName}</div>
          )}
        </div>

        {/* Right side - Contact Info in box */}
        <div className="print-header-right">
          {location && (
            <div className="print-header-contact-line">
              <span className="print-header-label">Dirección:</span>
              <span>{location}</span>
            </div>
          )}
          {phone && (
            <div className="print-header-contact-line">
              <span className="print-header-label">Teléfono:</span>
              <span>{phone}</span>
            </div>
          )}
          {email && (
            <div className="print-header-contact-line">
              <span className="print-header-label">Email:</span>
              <span>{email}</span>
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
