// src/components/PatientCard.tsx
import { memo } from "react";
import type { Patient } from "../lib/types";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";
import {
  CreditCard,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  Edit3,
} from "lucide-react";

type PatientCardProps = {
  patient: Patient;
  onEdit: () => void;
};

/**
 * PatientCard Component
 *
 * Displays patient information in a compact card format.
 * Used in tabbed layout to show patient details when viewing tabs.
 *
 * Features:
 * - Patient name with initial avatar
 * - Key demographics (ID, age, contact)
 * - Allergy alert banner if applicable
 * - Edit button to return to form view
 *
 * Usage:
 * ```tsx
 * <PatientCard
 *   patient={patient}
 *   onEdit={() => setIsEditing(true)}
 * />
 * ```
 */
const PatientCard = memo(function PatientCard({
  patient,
  onEdit,
}: PatientCardProps) {
  // Calculate age from date of birth
  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const age = calculateAge(patient.date_of_birth);
  const hasAllergy = Boolean(patient.allergy_detail?.trim());

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-6 transition-all",
        hasAllergy
          ? "border-red-500 bg-red-50 dark:bg-red-950/20 animate-pulseAlert shadow-lg"
          : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
      )}
    >
      {/* Allergy Alert Banner */}
      {hasAllergy && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
          ALERTA: Novedad Encontrada
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--brand)/0.3)] flex items-center justify-center text-white font-bold text-3xl shrink-0 border-2 border-[hsl(var(--brand))]">
          {patient.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] truncate">
              {patient.full_name?.toUpperCase() || "Sin nombre"}
            </h3>
            <Button
              onClick={onEdit}
              variant="secondary"
              size="sm"
              className="ml-4"
            >
              <Edit3 size={16} />
              Editar datos
            </Button>
          </div>

          {/* Demographics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {patient.doc_id && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard size={14} className="text-[hsl(var(--muted-foreground))]" />
                <span className="font-medium">{patient.doc_id}</span>
              </div>
            )}
            {age !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-[hsl(var(--muted-foreground))]" />
                <span className="font-medium">{age} años</span>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-[hsl(var(--muted-foreground))]" />
                <span className="font-medium">{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-[hsl(var(--muted-foreground))]" />
                <span className="font-medium truncate">{patient.email}</span>
              </div>
            )}
          </div>

          {/* Allergy Alert */}
          {hasAllergy && (
            <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
                    Novedad médica importante
                  </div>
                  <div className="text-sm text-red-800 dark:text-red-200 break-words">
                    {patient.allergy_detail}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PatientCard.displayName = "PatientCard";

export default PatientCard;
