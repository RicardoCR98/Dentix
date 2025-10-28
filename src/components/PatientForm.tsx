// src/components/PatientForm.tsx
import type { Patient } from "../lib/types";
import { Input } from "./ui/Input";
import { User, CreditCard, Calendar, Phone, PhoneCall } from "lucide-react";
import { Textarea } from "./ui/Textarea";
import React from "react";

type Props = {
  value: Patient;
  onChange: (p: Patient) => void;
  errors?: Partial<Record<keyof Patient, string>>;
};

export default function PatientForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof Patient>(k: K, v: Patient[K]) =>
    onChange({ ...value, [k]: v });

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

  const hasAllergy = Boolean(value.allergyDetail?.trim());

  return (
    <div className="space-y-4">
      {/* Fila 1: Nombre y Cédula */}
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

      {/* Fila 2: Edad y Teléfono */}
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Edad"
          type="number"
          min={0}
          max={120}
          value={value.age || ""}
          placeholder="Ej: 35"
          onChange={(e) => set("age", Number(e.target.value) || undefined)}
          error={!!errors?.age}
          helperText={errors?.age || "Años cumplidos"}
          icon={
            <Calendar
              size={16}
              className="text-[hsl(var(--muted-foreground))]"
            />
          }
        />

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
            <Phone size={16} className="text-[hsl(var(--muted-foreground))]" />
          }
        />
      </div>

      {/* Fila 3: Anamnesis y Alergias */}
      <div className="grid md:grid-cols-2 gap-4">
        <Textarea
          label="Anamnesis"
          value={value.anamnesis || ""}
          placeholder="Ej: Paciente refiere dolor en el diente 12"
          onChange={(e) => set("anamnesis", e.target.value)}
          error={!!errors?.anamnesis}
          helperText={errors?.anamnesis}
        />
        <div className="relative">
          <Textarea
            label="Detalles de alergias y novedades"
            value={value.allergyDetail || ""}
            placeholder="Ej: Paciente es alérgico a la penicilina"
            onChange={(e) => set("allergyDetail", e.target.value)}
            error={!!errors?.allergyDetail}
            helperText={errors?.allergyDetail}
          />
          {hasAllergy && (
            <>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-glow" />
            </>
          )}
        </div>
      </div>

      {/* Campo de teléfono de emergencia (solo si hay alergias) */}
      {hasAllergy && (
        <div className="grid">
          <div></div>
          <Input
            label="Teléfono de emergencia"
            type="tel"
            value={value.emergency_phone || ""}
            placeholder="Ej: 0991234567"
            onChange={(e) => set("emergency_phone", e.target.value)}
            helperText="Contacto en caso de emergencia médica"
            maxLength={10}
            icon={<PhoneCall size={16} className="text-red-600" />}
          />
        </div>
      )}

      {/* Información adicional */}
      {(value.full_name || value.doc_id) && (
        <div
          className={[
            "mt-4 p-4 rounded-lg border-2 relative ",
            hasAllergy
              ? "border-red-500 bg-red-50 dark:bg-red-950/20 animate-pulseAlert shadow-lg"
              : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]",
          ].join(" ")}
        >
          {/* Banner de advertencia visible */}
          {hasAllergy && (
            <div className="absolute -top-3 left-4 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2  cursor-auto">
              <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
              ¡ALERTA!
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold text-lg shrink-0">
              {value.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[hsl(var(--foreground))] truncate">
                {value.full_name || "Sin nombre"}
              </h4>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {value.doc_id && (
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} />
                    {value.doc_id}
                  </span>
                )}
                {value.age && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {value.age} años
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
                {hasAllergy && (
                  <span className="flex items-center gap-1 font-semibold text-red-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    Novedad Encontrada
                  </span>
                )}
              </div>

              {/* Bloque de detalle de alergias también aquí (opcional) */}
              {hasAllergy && (
                <div className="mt-3 p-3 rounded-md bg-white/60 dark:bg-white/5 border border-red-200 dark:border-red-500/30">
                  <div className="text-xs font-semibold text-red-700 mb-1">
                    Detalle:
                  </div>
                  <div className="text-sm leading-relaxed text-[hsl(var(--foreground))]">
                    {highlightAllergy(value.allergyDetail!)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
