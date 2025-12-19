// src/components/PatientForm.tsx
import type { Patient } from "../lib/types";
import { Input } from "./ui/Input";
import {
  User,
  CreditCard,
  Calendar,
  Phone,
  PhoneCall,
  Mail,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Textarea } from "./ui/Textarea";
import { DatePicker } from "./ui/DatePicker";
import React, { memo } from "react";

type Props = {
  value: Patient;
  onChange: (p: Patient) => void;
  errors?: Partial<Record<keyof Patient, string>>;
  showSummaryOnly?: boolean;
  onEditSummary?: () => void;
};

const PatientForm = memo(function PatientForm({
  value,
  onChange,
  errors,
  showSummaryOnly,
  onEditSummary,
}: Props) {
  const set = <K extends keyof Patient>(k: K, v: Patient[K]) =>
    onChange({ ...value, [k]: v });

  // Calcular edad desde fecha de nacimiento
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

  const age = calculateAge(value.date_of_birth);

  // Palabras críticas a resaltar dentro del detalle de alergias
  const CRITICAL = React.useMemo(
    () => [
      "penicilina",
      "amoxicilina",
      "ampicilina",
      "ibuprofeno",
      "aine",
      "a.i.n.e",
      "yodo",
      "látex",
      "latex",
      "lidocaína",
      "lignocaína",
      "anestésico",
      "sulfas",
      "clindamicina",
      "eritromicina",
      "paracetamol",
      "acetaminofén",
      "ketorolaco",
    ],
    [],
  );

  // Resalta términos críticos usando <mark> (sin HTML peligroso)
  const highlightAllergy = (text: string) => {
    if (!text) return null;
    const escaped = CRITICAL.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <mark key={`${match.index}-${match[0]}`} className="px-1 rounded">
          {match[0]}
        </mark>,
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const hasAllergy = Boolean(value.allergy_detail?.trim());


  const summaryCard = (value.full_name || value.doc_id) && (
    <div
      className={[
        "mt-4 p-4 rounded-lg border-2 relative mb-10",
        hasAllergy
          ? "badge-danger animate-pulseAlert shadow-lg"
          : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]",
      ].join(" ")}
    >
      {hasAllergy && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2  cursor-auto">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
          ¡ALERTA! Novedad Encontrada
        </div>
      )}
      <div className="flex items-start gap-6 py-4">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--brand)/0.3)] flex items-center justify-center text-white font-bold text-3xl shrink-0 ms-4 mt-4 border-2 border-[hsl(var(--brand))]">
          {value.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0 ">
          <div className="flex items-start justify-between gap-3">
            <h4 className="mb-2 font-semibold text-[hsl(var(--foreground))] truncate">
              {value.full_name.toUpperCase() || "Sin nombre"}
            </h4>
            {value.id && onEditSummary && (
              <button
                type="button"
                onClick={onEditSummary}
                className="inline-flex items-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm font-semibold hover:bg-[hsl(var(--muted))] transition"
              >
                Editar datos
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {value.doc_id && (
              <span className="flex items-center gap-1">
                <CreditCard size={12} />
                {value.doc_id}
              </span>
            )}
            {age !== null && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {age} años
              </span>
            )}
            {value.email && (
              <span className="flex items-center gap-1">
                <Mail size={12} />
                {value.email}
              </span>
            )}
            {value.phone && (
              <span className="flex items-center gap-1">
                <Phone size={12} />
                {value.phone}
              </span>
            )}
            {value.emergency_phone && (
              <span className="flex items-center gap-1 text-red-700 font-semibold">
                <PhoneCall size={12} />
                {value.emergency_phone}
              </span>
            )}
          </div>

          <div className="grid gap-2 md:grid-flow-col md:auto-cols-fr">
            {value.anamnesis && (
              <div className="mt-3 p-3 rounded-md bg-white/60 dark:bg-white/6 ">
                <div className="text-sm font-semibold mb-1">Anamnesis:</div>
                <div className="text-md leading-relaxed text-[hsl(var(--foreground))]">
                  {value.anamnesis}
                </div>
              </div>
            )}

            {hasAllergy && (
              <div className="mt-3 p-3 rounded-md bg-white/60 dark:bg-white/6 border border-red-200 dark:border-red-500/30">
                <div className="text-sm font-semibold text-red-700 mb-1">
                  Detalle:
                </div>
                <div className="text-md leading-relaxed text-[hsl(var(--foreground))]">
                  {highlightAllergy(value.allergy_detail!)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (showSummaryOnly) {
    return <>{summaryCard}</>;
  }
  return (
    <>
      {summaryCard}
      <div className="space-y-4">
        {/* 1. Nombre completo - Cédula */}
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Nombre completo"
            required
            value={value.full_name}
            placeholder="Ej: García Pérez Juan Carlos"
            onChange={(e) => set("full_name", e.target.value)}
            error={!!errors?.full_name}
            helperText={errors?.full_name}
            icon={
              <User size={16} className="text-[hsl(var(--muted-foreground))]" />
            }
          />

          <Input
            label="Cédula de identidad"
            required
            value={value.doc_id || ""}
            placeholder="Ej: 1234567890"
            onChange={(e) => set("doc_id", e.target.value)}
            error={!!errors?.doc_id}
            helperText={errors?.doc_id}
            maxLength={10}
            icon={
              <CreditCard
                size={16}
                className="text-[hsl(var(--muted-foreground))]"
              />
            }
          />
        </div>

        {/* 2. Fecha de nacimiento - Teléfono de contacto */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-2.5">
              <Calendar
                size={16}
                className="text-[hsl(var(--muted-foreground))] "
              />
              Fecha de nacimiento
              <span className="text-red-500">*</span>
            </label>
            <DatePicker
              mode="birthdate"
              value={value.date_of_birth || ""}
              onChange={(date) => set("date_of_birth", date)}
              placeholder="Selecciona fecha de nacimiento"
              className="w-full"
            />
            {errors?.date_of_birth && (
              <p className="text-xs text-red-600 mt-1">
                {errors.date_of_birth}
              </p>
            )}
            {!errors?.date_of_birth && age !== null && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {age} año{age !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <Input
            label="Teléfono de contacto"
            required
            type="tel"
            value={value.phone || ""}
            placeholder="Ej: 0991234567"
            onChange={(e) => set("phone", e.target.value)}
            error={!!errors?.phone}
            helperText={errors?.phone || "Celular o convencional"}
            maxLength={10}
            icon={
              <Phone
                size={16}
                className="text-[hsl(var(--muted-foreground))]"
              />
            }
          />
        </div>

        {/* 3. Correo electrónico - Anamnesis */}
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            value={value.email || ""}
            placeholder="Ej: paciente@ejemplo.com"
            onChange={(e) => set("email", e.target.value)}
            error={!!errors?.email}
            helperText={errors?.email || "Opcional"}
            icon={
              <Mail size={16} className="text-[hsl(var(--muted-foreground))]" />
            }
          />

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-2.5">
              <FileText
                size={16}
                className="text-[hsl(var(--muted-foreground))]"
              />
              Anamnesis
            </label>
            <Textarea
              value={value.anamnesis || ""}
              placeholder="Ej: Paciente refiere dolor en el diente 12"
              onChange={(e) => set("anamnesis", e.target.value)}
              error={!!errors?.anamnesis}
              helperText={errors?.anamnesis}
            />
          </div>
        </div>

        {/* 4. Detalles de alergias y novedades (full width) */}
        <div className="relative space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-2.5">
            <AlertTriangle
              size={16}
              className="text-[hsl(var(--muted-foreground))]"
            />
            Detalles de alergias y novedades
          </label>
          <Textarea
            value={value.allergy_detail || ""}
            placeholder="Ej: Paciente es alérgico a la penicilina"
            onChange={(e) => set("allergy_detail", e.target.value)}
            error={!!errors?.allergy_detail}
            helperText={errors?.allergy_detail}
          />
        </div>

        {/* 5. Teléfono de emergencia: solo si hay alergias/novedades */}
        {hasAllergy && (
          <Input
            label="Teléfono de emergencia"
            type="tel"
            value={value.emergency_phone || ""}
            placeholder="Ej: 0991234567"
            onChange={(e) => set("emergency_phone", e.target.value)}
            helperText={
              errors?.emergency_phone ||
              "Contacto en caso de emergencia relacionado con las alergias/novedades registradas"
            }
            maxLength={10}
            icon={
              <PhoneCall
                size={16}
                className="text-[hsl(var(--muted-foreground))]"
              />
            }
          />
        )}
      </div>
    </>
  );
});

PatientForm.displayName = "PatientForm";

export default PatientForm;