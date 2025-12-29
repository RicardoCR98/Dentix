// src/components/OnboardingWizard.tsx
import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Card } from "./ui/Card";
import { CheckCircle2 } from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [clinicName, setClinicName] = useState("");
  const [clinicSlogan, setClinicSlogan] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Horarios
  const [workStartHour, setWorkStartHour] = useState("08:00");
  const [workEndHour, setWorkEndHour] = useState("18:00");
  const [lunchStartHour, setLunchStartHour] = useState("12:00");
  const [lunchEndHour, setLunchEndHour] = useState("13:00");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Importar dinámicamente para evitar errores en desarrollo web
      const { invoke } = await import("@tauri-apps/api/core");

      // Crear objeto de horarios
      const clinicHours = JSON.stringify({
        workStart: workStartHour,
        workEnd: workEndHour,
        lunchStart: lunchStartHour,
        lunchEnd: lunchEndHour,
      });

      // Crear perfil del doctor
      await invoke("upsert_doctor_profile", {
        profile: {
          doctor_id: crypto.randomUUID(), // Generar ID único
          name: doctorName,
          email: email,
          clinic_name: clinicName,
          clinic_hours: clinicHours,
          clinic_slogan: clinicSlogan || null,
          phone: phone || null,
          location: location || null,
          agreed_to_terms: true, // ✅ BOOLEAN, no integer
          app_version: "1.0.0",
        },
      });

      onComplete();
    } catch (error) {
      console.error("Error saving doctor profile:", error);
      alert("Error al guardar la configuración. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = clinicName.trim() !== "" && doctorName.trim() !== "";
  const canComplete = email.trim() !== "" && /\S+@\S+\.\S+/.test(email);

  return (
    <div className="fixed inset-0 bg-[hsl(var(--background))] z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--brand))] mb-2">
            Bienvenido a Oklus
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Configuremos tu clínica dental en unos simples pasos
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {/* Step 1 */}
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-[hsl(var(--brand))]" : "text-[hsl(var(--muted-foreground))]"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? "bg-[hsl(var(--brand))] text-white" : "bg-[hsl(var(--muted))]"
            }`}>
              {step > 1 ? <CheckCircle2 size={20} /> : "1"}
            </div>
            <span className="text-sm font-medium">Clínica</span>
          </div>

          <div className="w-8 h-0.5 bg-[hsl(var(--border))]" />

          {/* Step 2 */}
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-[hsl(var(--brand))]" : "text-[hsl(var(--muted-foreground))]"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? "bg-[hsl(var(--brand))] text-white" : "bg-[hsl(var(--muted))]"
            }`}>
              {step > 2 ? <CheckCircle2 size={20} /> : "2"}
            </div>
            <span className="text-sm font-medium">Horarios</span>
          </div>

          <div className="w-8 h-0.5 bg-[hsl(var(--border))]" />

          {/* Step 3 */}
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-[hsl(var(--brand))]" : "text-[hsl(var(--muted-foreground))]"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 3 ? "bg-[hsl(var(--brand))] text-white" : "bg-[hsl(var(--muted))]"
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Contacto</span>
          </div>
        </div>

        {/* Step 1: Clinic info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="clinicName" className="required">
                Nombre de la Clínica
              </Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Ej: Clínica Dental Sonrisas"
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="clinicSlogan">
                Slogan de la Clínica (opcional)
              </Label>
              <Input
                id="clinicSlogan"
                value={clinicSlogan}
                onChange={(e) => setClinicSlogan(e.target.value)}
                placeholder="Ej: Tu sonrisa es nuestra pasión"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="doctorName" className="required">
                Nombre del Doctor/a
              </Label>
              <Input
                id="doctorName"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ej: Dr. Juan Pérez"
                className="mt-2"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleNext}
                disabled={!canProceedStep1}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Working hours */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Define el horario de atención de tu clínica
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workStartHour">
                  Hora de Apertura
                </Label>
                <Input
                  id="workStartHour"
                  type="time"
                  value={workStartHour}
                  onChange={(e) => setWorkStartHour(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="workEndHour">
                  Hora de Cierre
                </Label>
                <Input
                  id="workEndHour"
                  type="time"
                  value={workEndHour}
                  onChange={(e) => setWorkEndHour(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="border-t border-[hsl(var(--border))] pt-4">
              <p className="text-sm font-medium mb-4 text-[hsl(var(--text))]">
                Horario de Almuerzo/Descanso
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lunchStartHour">
                    Inicio de Almuerzo
                  </Label>
                  <Input
                    id="lunchStartHour"
                    type="time"
                    value={lunchStartHour}
                    onChange={(e) => setLunchStartHour(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="lunchEndHour">
                    Fin de Almuerzo
                  </Label>
                  <Input
                    id="lunchEndHour"
                    type="time"
                    value={lunchEndHour}
                    onChange={(e) => setLunchEndHour(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
              >
                Atrás
              </Button>
              <Button
                onClick={handleNext}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact info */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="email" className="required">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="mt-2"
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Se usará para comunicaciones y recordatorios
              </p>
            </div>

            <div>
              <Label htmlFor="phone">
                Teléfono de la Clínica (opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: +593 999 999 999"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="location">
                Dirección (opcional)
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Av. Principal #123, Quito"
                className="mt-2"
              />
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!canComplete || loading}
              >
                {loading ? "Guardando..." : "Completar Configuración"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
