// src/components/OnboardingWizard.tsx
import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Card } from "./ui/Card";
import { CheckboxRoot } from "./ui/Checkbox";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { TermsModal } from "./TermsModal";
import { telemetryService } from "../lib/telemetry";
import type { ProcedureTemplate } from "../lib/types";

interface OnboardingWizardProps {
  onComplete: () => void;
}

// Precios de ejemplo para facilitar la configuración
const EXAMPLE_PRICES: Record<string, number> = {
  Curación: 25,
  "Resinas simples": 35,
  "Resinas compuestas": 50,
  "Extracciones simples": 30,
  "Extracciones complejas": 60,
  "Limpieza simple": 40,
  "Limpieza compleja": 70,
  "Endodoncia simple": 120,
  "Endodoncia compleja": 200,
  "Correctivo inicial": 150,
  "Control mensual": 20,
  "Prótesis total": 500,
  "Prótesis removible": 350,
  "Prótesis fija": 400,
  Retenedor: 80,
  Pegada: 15,
  Reposición: 25,
};

const DRAFT_KEY = "onboarding_draft_v2";

interface DraftData {
  step: number;
  clinicName: string;
  doctorName: string;
  email: string;
  phone: string;
  location: string;
  workStartHour: string;
  workEndHour: string;
  lunchStartHour: string;
  lunchEndHour: string;
  clinicSlogan: string;
  agreedToTerms: boolean;
  agreedToDataProcessing: boolean;
  procedurePrices: Record<string, string>;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templates, setTemplates] = useState<ProcedureTemplate[]>([]);

  // Step 1: Legal (Terms and Conditions) - OBLIGATORIO
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDataProcessing, setAgreedToDataProcessing] = useState(false);

  // Step 2: Professional Identity
  const [clinicName, setClinicName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [email, setEmail] = useState("");

  // Step 3: Prices (stored as Record<templateName, price>)
  const [procedurePrices, setProcedurePrices] = useState<
    Record<string, string>
  >({});

  // Step 4: Contact Information
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Step 5: Personalization
  const [workStartHour, setWorkStartHour] = useState("08:00");
  const [workEndHour, setWorkEndHour] = useState("18:00");
  const [lunchStartHour, setLunchStartHour] = useState("12:00");
  const [lunchEndHour, setLunchEndHour] = useState("13:00");
  const [clinicSlogan, setClinicSlogan] = useState("");

  // Step 6: Confirmation (auto-redirect)
  const [countdown, setCountdown] = useState(5);

  // Terms modal
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const data: DraftData = JSON.parse(draft);
        setStep(data.step);
        setClinicName(data.clinicName);
        setDoctorName(data.doctorName);
        setEmail(data.email);
        setPhone(data.phone);
        setLocation(data.location);
        setWorkStartHour(data.workStartHour);
        setWorkEndHour(data.workEndHour);
        setLunchStartHour(data.lunchStartHour);
        setLunchEndHour(data.lunchEndHour);
        setClinicSlogan(data.clinicSlogan);
        setAgreedToTerms(data.agreedToTerms);
        setAgreedToDataProcessing(data.agreedToDataProcessing);
        setProcedurePrices(data.procedurePrices);
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, []);

  // Load procedure templates from database
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const data = await invoke<ProcedureTemplate[]>(
          "get_procedure_templates",
        );
        setTemplates(data);

        // Initialize prices from existing templates
        const initialPrices: Record<string, string> = {};
        data.forEach((t) => {
          initialPrices[t.name] =
            t.default_price > 0 ? t.default_price.toString() : "";
        });
        setProcedurePrices(initialPrices);
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // Save draft to localStorage whenever data changes
  useEffect(() => {
    const draft: DraftData = {
      step,
      clinicName,
      doctorName,
      email,
      phone,
      location,
      workStartHour,
      workEndHour,
      lunchStartHour,
      lunchEndHour,
      clinicSlogan,
      agreedToTerms,
      agreedToDataProcessing,
      procedurePrices,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    step,
    clinicName,
    doctorName,
    email,
    phone,
    location,
    workStartHour,
    workEndHour,
    lunchStartHour,
    lunchEndHour,
    clinicSlogan,
    agreedToTerms,
    agreedToDataProcessing,
    procedurePrices,
  ]);

  // Countdown for auto-redirect in step 6
  useEffect(() => {
    if (step === 6 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 6 && countdown === 0) {
      // Send telemetry event before completing
      const sendTelemetryAndComplete = async () => {
        try {
          await telemetryService.initialize();
          await telemetryService.trackEvent("installation_completed", {
            doctor_name: doctorName,
            clinic_name: clinicName,
            country: "Ecuador",
          });
          console.log("✅ installation_completed event sent");
        } catch (error) {
          console.error("❌ Error sending telemetry:", error);
          // Continue anyway - telemetry shouldn't block onboarding
        } finally {
          localStorage.removeItem(DRAFT_KEY);
          onComplete();
        }
      };

      sendTelemetryAndComplete();
    }
  }, [step, countdown, onComplete, doctorName, clinicName]);

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleUseExamplePrices = () => {
    const newPrices = { ...procedurePrices };
    templates.forEach((template) => {
      const examplePrice = EXAMPLE_PRICES[template.name];
      if (examplePrice !== undefined) {
        newPrices[template.name] = examplePrice.toString();
      }
    });
    setProcedurePrices(newPrices);
  };

  const handleSkipToEnd = async () => {
    // Skip remaining optional steps (only allowed AFTER accepting terms)
    // This will use minimal default values for identity and configuration
    if (!agreedToTerms || !agreedToDataProcessing) {
      alert("Debes aceptar los términos y condiciones antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      const clinicHours = JSON.stringify({
        workStart: "08:00",
        workEnd: "18:00",
        lunchStart: "12:00",
        lunchEnd: "13:00",
      });

      // Use provided data or defaults
      const finalDoctorName = doctorName.trim() || "Doctor";
      const finalEmail = email.trim() || "doctor@example.com";
      const finalClinicName = clinicName.trim() || "Mi Clínica";

      await invoke("upsert_doctor_profile", {
        profile: {
          doctor_id: crypto.randomUUID(),
          name: finalDoctorName,
          email: finalEmail,
          clinic_name: finalClinicName,
          clinic_hours: clinicHours,
          clinic_slogan: clinicSlogan || null,
          phone: phone || null,
          location: location || null,
          agreed_to_terms: agreedToTerms,
          app_version: "1.0.0",
        },
      });

      // Send telemetry event (only if terms were accepted)
      try {
        await telemetryService.initialize();
        await telemetryService.trackEvent("installation_completed", {
          doctor_name: finalDoctorName,
          clinic_name: finalClinicName,
          country: "Ecuador",
        });
        console.log("✅ installation_completed event sent (skip to end)");
      } catch (error) {
        console.error("❌ Error sending telemetry:", error);
      }

      localStorage.removeItem(DRAFT_KEY);
      onComplete();
    } catch (error) {
      console.error("Error creating minimal profile:", error);
      alert("Error al crear el perfil. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const { invoke } = await import("@tauri-apps/api/core");

      // 1. Create clinic hours object
      const clinicHours = JSON.stringify({
        workStart: workStartHour,
        workEnd: workEndHour,
        lunchStart: lunchStartHour,
        lunchEnd: lunchEndHour,
      });

      // 2. Create doctor profile
      await invoke("upsert_doctor_profile", {
        profile: {
          doctor_id: crypto.randomUUID(),
          name: doctorName,
          email: email,
          clinic_name: clinicName,
          clinic_hours: clinicHours,
          clinic_slogan: clinicSlogan || null,
          phone: phone || null,
          location: location || null,
          agreed_to_terms: agreedToTerms,
          app_version: "1.0.0",
        },
      });

      // 3. Create signer with doctor's real name (replaces "Dr. Ejemplo 1")
      try {
        // First, get all signers
        const signers =
          await invoke<Array<{ id: number; name: string }>>("get_signers");

        // Delete example signers
        for (const signer of signers) {
          if (signer.name.includes("Ejemplo")) {
            await invoke("delete_signer", { id: signer.id });
          }
        }

        // Create new signer with doctor's real name
        await invoke("create_signer", { name: doctorName });
      } catch (error) {
        console.error("Error managing signers:", error);
      }

      // 4. Update procedure template prices
      const updatedTemplates: ProcedureTemplate[] = templates.map(
        (template) => {
          const priceStr = procedurePrices[template.name] || "0";
          const price = parseFloat(priceStr) || 0;
          return {
            ...template,
            default_price: price,
          };
        },
      );

      await invoke("save_procedure_templates", { templates: updatedTemplates });

      // Move to confirmation step
      setStep(6);
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert(
        "Error al guardar la configuración. Por favor, intente nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Validations
  const canProceedStep1 = agreedToTerms && agreedToDataProcessing;

  const canProceedStep2 =
    clinicName.trim().length >= 3 &&
    doctorName.trim().length >= 5 &&
    email.trim() !== "" &&
    /\S+@\S+\.\S+/.test(email);

  const configuredPricesCount = Object.values(procedurePrices).filter(
    (price) => price !== "" && parseFloat(price) > 0,
  ).length;

  const canProceedStep3 = configuredPricesCount >= 5;

  const canProceedStep4 = true; // Contact info is optional

  // Progress calculation
  const totalSteps = 5; // Don't count confirmation as a step
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-[hsl(var(--background))] z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full p-8 my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-[hsl(var(--brand))]">
              Bienvenido a Oklus
            </h1>
            <Sparkles className="text-[hsl(var(--brand))]" size={28} />
          </div>
          <p className="text-[hsl(var(--muted-foreground))]">
            Configuremos tu clínica dental en unos simples pasos
          </p>
        </div>

        {/* Progress Indicator (Steps) */}
        {step <= 5 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {/* Step 1: Legal */}
            <div
              className={`flex items-center gap-2 ${
                step >= 1
                  ? "text-[hsl(var(--brand))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step > 1
                    ? "bg-[hsl(var(--brand))] text-white"
                    : step === 1
                      ? "bg-[hsl(var(--brand))] text-white"
                      : "bg-[hsl(var(--muted))]"
                }`}
              >
                {step > 1 ? <CheckCircle2 size={20} /> : "1"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Legal
              </span>
            </div>

            <div className="w-8 h-0.5 bg-[hsl(var(--border))]" />

            {/* Step 2: Identity */}
            <div
              className={`flex items-center gap-2 ${
                step >= 2
                  ? "text-[hsl(var(--brand))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step > 2
                    ? "bg-[hsl(var(--brand))] text-white"
                    : step === 2
                      ? "bg-[hsl(var(--brand))] text-white"
                      : "bg-[hsl(var(--muted))]"
                }`}
              >
                {step > 2 ? <CheckCircle2 size={20} /> : "2"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Identidad
              </span>
            </div>

            <div className="w-8 h-0.5 bg-[hsl(var(--border))]" />

            {/* Step 3: Prices */}
            <div
              className={`flex items-center gap-2 ${
                step >= 3
                  ? "text-[hsl(var(--brand))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step > 3
                    ? "bg-[hsl(var(--brand))] text-white"
                    : step === 3
                      ? "bg-[hsl(var(--brand))] text-white"
                      : "bg-[hsl(var(--muted))]"
                }`}
              >
                {step > 3 ? <CheckCircle2 size={20} /> : "3"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Precios
              </span>
            </div>

            <div className="w-8 h-0.5 bg-[hsl(var(--border))]" />

            {/* Step 4: Contact */}
            <div
              className={`flex items-center gap-2 ${
                step >= 4
                  ? "text-[hsl(var(--brand))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step > 4
                    ? "bg-[hsl(var(--brand))] text-white"
                    : step === 4
                      ? "bg-[hsl(var(--brand))] text-white"
                      : "bg-[hsl(var(--muted))]"
                }`}
              >
                {step > 4 ? <CheckCircle2 size={20} /> : "4"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Contacto
              </span>
            </div>

            <div className="w-8 h-0.5 bg-[hsl(var(--border))]" />

            {/* Step 5: Personalization */}
            <div
              className={`flex items-center gap-2 ${
                step >= 5
                  ? "text-[hsl(var(--brand))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= 5
                    ? "bg-[hsl(var(--brand))] text-white"
                    : "bg-[hsl(var(--muted))]"
                }`}
              >
                5
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Extra
              </span>
            </div>
          </div>
        )}

        {/* Step 1: Legal (Terms and Conditions) - OBLIGATORIO */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-l-4 border-[hsl(var(--brand))] bg-[hsl(var(--muted))] p-4 rounded-r">
              <h2 className="text-lg font-semibold mb-1">
                ⚖️ Términos y Condiciones
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Antes de comenzar, debes leer y aceptar nuestros términos de uso
              </p>
            </div>

            <div className=" p-4 rounded-lg border badge-info">
              <h3 className="text-base font-semibold mb-2">
                📊 Sobre la Telemetría
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                Oklus recopila datos técnicos anónimos para mejorar la
                aplicación:
              </p>
              <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1 ml-4">
                <li>✅ Estadísticas de uso (cantidad de pacientes, visitas)</li>
                <li>✅ Errores técnicos para corregir problemas</li>
                <li>✅ Información del sistema (versión, plataforma)</li>
              </ul>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-3">
                ❌ NUNCA recopilamos: nombres de pacientes, diagnósticos, datos
                médicos
              </p>
            </div>

            <div className="border-t border-[hsl(var(--border))] pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckboxRoot
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) =>
                    setAgreedToTerms(checked as boolean)
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    He leído y acepto los términos y condiciones de uso *
                  </label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    <a
                      href="#"
                      className="text-[hsl(var(--brand))] hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsModalOpen(true);
                      }}
                    >
                      Ver términos completos
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckboxRoot
                  id="dataProcessing"
                  checked={agreedToDataProcessing}
                  onCheckedChange={(checked) =>
                    setAgreedToDataProcessing(checked as boolean)
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="dataProcessing"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Acepto el procesamiento de datos médicos según normativa
                    local y la recopilación de telemetría anónima *
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={handleNext} disabled={!canProceedStep1}>
                Acepto, Continuar →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Professional Identity */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-l-4 border-[hsl(var(--brand))] bg-[hsl(var(--muted))] p-4 rounded-r">
              <h2 className="text-lg font-semibold mb-1">
                Identidad Profesional
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Esta información aparecerá en documentos y firmas de historias
                clínicas.
              </p>
            </div>

            <div>
              <Label htmlFor="clinicName" className="required">
                🏥 Nombre de la Clínica
              </Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Ej: Clínica Dental Sonrisas"
                className="mt-2"
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                💡 Este nombre aparecerá en todos los documentos
              </p>
            </div>

            <div>
              <Label htmlFor="doctorName" className="required">
                👨‍⚕️ Nombre del Doctor/a
              </Label>
              <Input
                id="doctorName"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ej: Dr. Juan Pérez Martínez"
                className="mt-2"
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                💡 Nombre que firmará las historias clínicas
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="required">
                📧 Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinica.com"
                className="mt-2"
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                💡 Para notificaciones y recuperación de datos
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="ghost" onClick={handleBack}>
                ← Atrás
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSkipToEnd}
                  disabled={loading}
                >
                  Omitir configuración
                </Button>
                <Button onClick={handleNext} disabled={!canProceedStep2}>
                  Siguiente →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Price Catalog */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-l-4 border-[hsl(var(--brand))] bg-[hsl(var(--muted))] p-4 rounded-r">
              <h2 className="text-lg font-semibold mb-1">
                Configura tus Precios (Puedes editarlos después)
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Define los precios de los procedimientos más comunes para
                empezar a facturar rápidamente.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Precios configurados: {configuredPricesCount}/
                  {templates.length}
                </p>
                {configuredPricesCount >= 5 ? (
                  <p className="text-xs text-green-600">✓ Listo para empezar</p>
                ) : (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Configura al menos 5 precios para continuar
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUseExamplePrices}
              >
                <Sparkles size={16} className="mr-2" />
                Usar precios de ejemplo
              </Button>
            </div>

            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="animate-spin text-[hsl(var(--brand))]"
                  size={32}
                />
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase">
                    Procedimientos Básicos
                  </h3>
                  {templates.slice(0, 9).map((template) => {
                    const hasPrice =
                      procedurePrices[template.name] &&
                      parseFloat(procedurePrices[template.name]) > 0;
                    return (
                      <div
                        key={template.id}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 items-center"
                      >
                        <span className="text-sm">{template.name}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={procedurePrices[template.name] || ""}
                          onChange={(e) =>
                            setProcedurePrices({
                              ...procedurePrices,
                              [template.name]: e.target.value,
                            })
                          }
                          className="w-32"
                        />
                        {hasPrice && (
                          <CheckCircle2
                            size={20}
                            className="text-green-600"
                            aria-label="Configurado"
                          />
                        )}
                        {!hasPrice && <div className="w-5" />}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-4 border-t border-[hsl(var(--border))]">
                  <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase">
                    Procedimientos Avanzados (opcional)
                  </h3>
                  {templates.slice(9).map((template) => {
                    const hasPrice =
                      procedurePrices[template.name] &&
                      parseFloat(procedurePrices[template.name]) > 0;
                    return (
                      <div
                        key={template.id}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 items-center"
                      >
                        <span className="text-sm">{template.name}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={procedurePrices[template.name] || ""}
                          onChange={(e) =>
                            setProcedurePrices({
                              ...procedurePrices,
                              [template.name]: e.target.value,
                            })
                          }
                          className="w-32"
                        />
                        {hasPrice && (
                          <CheckCircle2
                            size={20}
                            className="text-green-600"
                            aria-label="Configurado"
                          />
                        )}
                        {!hasPrice && <div className="w-5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="ghost" onClick={handleBack}>
                ← Atrás
              </Button>
              <Button onClick={handleNext} disabled={!canProceedStep3}>
                Siguiente →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Contact Information */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-l-4 border-[hsl(var(--brand))] bg-[hsl(var(--muted))] p-4 rounded-r">
              <h2 className="text-lg font-semibold mb-1">
                Información de Contacto
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Opcional pero recomendado
              </p>
            </div>

            <div>
              <Label htmlFor="phone">📞 Teléfono de la Clínica</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+593 999 999 999"
                className="mt-2"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                💡 Para que tus pacientes puedan contactarte
              </p>
            </div>

            <div>
              <Label htmlFor="location">📍 Dirección de la Clínica</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Av. Principal #123, Quito"
                className="mt-2"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                💡 Aparecerá en documentos y recibos
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="ghost" onClick={handleBack}>
                ← Atrás
              </Button>
              <Button onClick={handleNext} disabled={!canProceedStep4}>
                Siguiente →
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Personalization */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="border-l-4 border-[hsl(var(--brand))] bg-[hsl(var(--muted))] p-4 rounded-r">
              <h2 className="text-lg font-semibold mb-1">
                Personaliza tu Experiencia
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Este paso es completamente opcional - puedes cambiarlo después
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">
                🕐 Horario de Atención (opcional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workStartHour">Apertura</Label>
                  <Input
                    id="workStartHour"
                    type="time"
                    value={workStartHour}
                    onChange={(e) => setWorkStartHour(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="workEndHour">Cierre</Label>
                  <Input
                    id="workEndHour"
                    type="time"
                    value={workEndHour}
                    onChange={(e) => setWorkEndHour(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">
                🍽️ Horario de Almuerzo (opcional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lunchStartHour">Inicio</Label>
                  <Input
                    id="lunchStartHour"
                    type="time"
                    value={lunchStartHour}
                    onChange={(e) => setLunchStartHour(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lunchEndHour">Fin</Label>
                  <Input
                    id="lunchEndHour"
                    type="time"
                    value={lunchEndHour}
                    onChange={(e) => setLunchEndHour(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                💡 Estos horarios se guardan para futuras funcionalidades de
                agenda
              </p>
            </div>

            <div className="border-t border-[hsl(var(--border))] pt-4">
              <Label htmlFor="clinicSlogan">
                ✨ Slogan de la Clínica (opcional)
              </Label>
              <Input
                id="clinicSlogan"
                value={clinicSlogan}
                onChange={(e) => setClinicSlogan(e.target.value)}
                placeholder="Tu sonrisa es nuestra pasión"
                className="mt-2"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                💡 Aparecerá en encabezados de documentos
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="ghost" onClick={handleBack}>
                ← Atrás
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleComplete();
                  }}
                  disabled={loading}
                >
                  Omitir
                </Button>
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Guardando...
                    </>
                  ) : (
                    "Finalizar Configuración"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {step === 6 && (
          <div className="space-y-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">¡Todo listo!</h2>
              <p className="text-[hsl(var(--muted-foreground))]">
                Tu clínica ha sido configurada exitosamente
              </p>
            </div>

            <div className="bg-[hsl(var(--muted))] p-6 rounded-lg space-y-2 text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                <div>
                  <p className="font-semibold">{clinicName}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {doctorName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-semibold">
                    {configuredPricesCount} procedimientos configurados
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Listo para facturar
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-left bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
              <h3 className="font-semibold">¿Qué puedes hacer ahora?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                  <span className="text-sm">Registrar tu primer paciente</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Crear historias clínicas con odontograma
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Gestionar presupuestos y cobros
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Almacenar adjuntos (radiografías, fotos)
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                💡 <strong>Tip:</strong> Presiona{" "}
                <kbd className="px-2 py-1 bg-[hsl(var(--muted))] rounded text-xs">
                  Ctrl+K
                </kbd>{" "}
                para buscar pacientes rápidamente
              </p>
              <Button
                size="lg"
                onClick={async () => {
                  try {
                    await telemetryService.initialize();
                    await telemetryService.trackEvent(
                      "installation_completed",
                      {
                        doctor_name: doctorName,
                        clinic_name: clinicName,
                        country: "Ecuador",
                      },
                    );
                    console.log(
                      "✅ installation_completed event sent (manual click)",
                    );
                  } catch (error) {
                    console.error("❌ Error sending telemetry:", error);
                  } finally {
                    localStorage.removeItem(DRAFT_KEY);
                    onComplete();
                  }
                }}
                className="w-full"
              >
                Comenzar a usar Oklus →
              </Button>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Redirigiendo automáticamente en {countdown} segundos...
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Terms and Conditions Modal */}
      <TermsModal open={termsModalOpen} onOpenChange={setTermsModalOpen} />
    </div>
  );
}
