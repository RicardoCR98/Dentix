// src/components/PatientForm.tsx
import type { Patient } from "../lib/types";
import { Input } from "./ui/Input";
import { User, CreditCard, Calendar, Phone } from "lucide-react";

type Props = {
  value: Patient;
  onChange: (p: Patient) => void;
  errors?: Partial<Record<keyof Patient, string>>;
};

export default function PatientForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof Patient>(k: K, v: Patient[K]) => 
    onChange({ ...value, [k]: v });

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
          icon={<User size={16} className="text-[hsl(var(--muted-foreground))]" />}
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
          icon={<CreditCard size={16} className="text-[hsl(var(--muted-foreground))]" />}
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
          icon={<Calendar size={16} className="text-[hsl(var(--muted-foreground))]" />}
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
          icon={<Phone size={16} className="text-[hsl(var(--muted-foreground))]" />}
        />
      </div>

      {/* Información adicional */}
      {(value.full_name || value.doc_id) && (
        <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {value.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[hsl(var(--foreground))] truncate">
                {value.full_name || 'Sin nombre'}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}