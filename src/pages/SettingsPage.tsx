// src/pages/SettingsPage.tsx
import { useState, useEffect } from "react";
import { Settings, FileText, User, Edit, Clock } from "lucide-react";
import Section from "../components/Section";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Input } from "../components/ui/Input";
import { tauriSqliteRepository } from "../lib/storage/TauriSqliteRepository";
import { useToast } from "../hooks/useToast";
import { TemplatesManagerModal } from "../components/TemplatesManagerModal";
import type { DoctorProfile } from "../lib/types";

export function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile>({
    doctor_id: crypto.randomUUID(),
    name: "",
    email: "",
    clinic_name: "",
    clinic_hours: "",
    clinic_slogan: "",
    phone: "",
    location: "",
    agreed_to_terms: true,
  });

  // Working hours (parsed from clinic_hours JSON)
  const [workStartHour, setWorkStartHour] = useState("08:00");
  const [workEndHour, setWorkEndHour] = useState("18:00");
  const [lunchStartHour, setLunchStartHour] = useState("12:00");
  const [lunchEndHour, setLunchEndHour] = useState("13:00");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Clean duplicates first
      const cleaned = await tauriSqliteRepository.cleanDuplicateTemplates();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} duplicate templates`);
      }

      const data = await tauriSqliteRepository.getDoctorProfile();
      if (data) {
        setProfile(data);

        // Parse clinic hours if available
        if (data.clinic_hours) {
          try {
            const hours = JSON.parse(data.clinic_hours);
            if (hours.workStart) setWorkStartHour(hours.workStart);
            if (hours.workEnd) setWorkEndHour(hours.workEnd);
            if (hours.lunchStart) setLunchStartHour(hours.lunchStart);
            if (hours.lunchEnd) setLunchEndHour(hours.lunchEnd);
          } catch (err) {
            console.error("Error parsing clinic hours:", err);
            // Keep defaults on error
          }
        }
      }
    } catch (error) {
      console.error("Error loading doctor profile:", error);
      toast.error("Error", "No se pudo cargar el perfil del doctor");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!profile.name.trim()) {
      toast.error("Error de validación", "El nombre es requerido");
      return;
    }
    if (!profile.email?.trim()) {
      toast.error("Error de validación", "El email es requerido");
      return;
    }
    if (!profile.clinic_name?.trim()) {
      toast.error("Error de validación", "El nombre de la clínica es requerido");
      return;
    }

    try {
      setSaving(true);

      // Build clinic hours JSON
      const clinicHours = JSON.stringify({
        workStart: workStartHour,
        workEnd: workEndHour,
        lunchStart: lunchStartHour,
        lunchEnd: lunchEndHour,
      });

      // Save profile with updated clinic hours
      await tauriSqliteRepository.upsertDoctorProfile({
        ...profile,
        clinic_hours: clinicHours,
      });

      toast.success("Guardado exitoso", "El perfil se guardó correctamente");
    } catch (error) {
      console.error("Error saving doctor profile:", error);
      toast.error("Error", "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[hsl(var(--muted-foreground))]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Configuración
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Personaliza la aplicación según tus necesidades
        </p>
      </div>

      {/* Doctor Info */}
      <Section title="Información del Doctor" icon={<User size={20} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nombre completo"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))]
                  bg-[hsl(var(--background))] text-[hsl(var(--foreground))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={profile.email || ""}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))]
                  bg-[hsl(var(--background))] text-[hsl(var(--foreground))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-2">
                Teléfono
              </label>
              <input
                type="text"
                placeholder="Número de contacto"
                value={profile.phone || ""}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))]
                  bg-[hsl(var(--background))] text-[hsl(var(--foreground))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              />
            </div>

            {/* Ubicación */}
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-2">
                Ubicación
              </label>
              <input
                type="text"
                placeholder="Ciudad / Dirección"
                value={profile.location || ""}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))]
                  bg-[hsl(var(--background))] text-[hsl(var(--foreground))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Clinic Info */}
      <Section title="Información de la Clínica" icon={<FileText size={20} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre de la clínica */}
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-2">
                Nombre de la Clínica <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nombre de la clínica"
                value={profile.clinic_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, clinic_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))]
                  bg-[hsl(var(--background))] text-[hsl(var(--foreground))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              />
            </div>

            {/* Eslogan */}
            <div>
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-2">
                Eslogan
              </label>
              <input
                type="text"
                placeholder="Eslogan"
                value={profile.clinic_slogan || ""}
                onChange={(e) =>
                  setProfile({ ...profile, clinic_slogan: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))]
                  bg-[hsl(var(--background))] text-[hsl(var(--foreground))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              />
            </div>

          </div>

          <Button
            variant="primary"
            className="mt-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Section>

      {/* Working Hours */}
      <Section title="Horarios de Atención" icon={<Clock size={20} />}>
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Define el horario de atención de tu clínica. Estos horarios se usarán en el calendario de citas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Work hours */}
            <div>
              <Label htmlFor="workStartHour">Hora de Apertura</Label>
              <Input
                id="workStartHour"
                type="time"
                value={workStartHour}
                onChange={(e) => setWorkStartHour(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="workEndHour">Hora de Cierre</Label>
              <Input
                id="workEndHour"
                type="time"
                value={workEndHour}
                onChange={(e) => setWorkEndHour(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Lunch hours */}
            <div>
              <Label htmlFor="lunchStartHour">Inicio de Almuerzo</Label>
              <Input
                id="lunchStartHour"
                type="time"
                value={lunchStartHour}
                onChange={(e) => setLunchStartHour(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="lunchEndHour">Fin de Almuerzo</Label>
              <Input
                id="lunchEndHour"
                type="time"
                value={lunchEndHour}
                onChange={(e) => setLunchEndHour(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <Button
            variant="primary"
            className="mt-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Section>

      {/* Text Templates */}
      <Section title="Plantillas de Texto" icon={<FileText size={20} />}>
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Gestiona las plantillas de texto para mensajes de WhatsApp, diagnósticos, notas clínicas y más.
          </p>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setTemplatesModalOpen(true)}
          >
            <Edit size={16} />
            Gestionar plantillas
          </Button>
        </div>
      </Section>

      {/* System Info */}
      <Section title="Datos del Sistema" icon={<Settings size={20} />}>
        <div className="space-y-3 text-[hsl(var(--muted-foreground))]">
          <div className="flex justify-between items-center">
            <span className="text-sm">Versión de la Aplicación</span>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {profile.app_version || "1.0.0"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Última sincronización</span>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {profile.last_sync ? formatDate(profile.last_sync) : "No disponible"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Términos aceptados</span>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {profile.agreed_to_terms ? "Sí" : "No"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Fecha de creación</span>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {formatDate(profile.created_at)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Última actualización</span>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {formatDate(profile.updated_at)}
            </span>
          </div>
        </div>
      </Section>

      {/* Templates Manager Modal */}
      <TemplatesManagerModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
      />
    </div>
  );
}
