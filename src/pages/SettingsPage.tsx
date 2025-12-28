// src/pages/SettingsPage.tsx
import { useState, useEffect } from "react";
import { Settings, FileText, User, Edit } from "lucide-react";
import Section from "../components/Section";
import { Button } from "../components/ui/Button";
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
      await tauriSqliteRepository.upsertDoctorProfile(profile);
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

            {/* Horario */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[hsl(var(--muted-foreground))] block mb-2">
                Horario
              </label>
              <input
                type="text"
                placeholder="Ej: Lunes a Viernes 9:00 AM - 6:00 PM"
                value={profile.clinic_hours || ""}
                onChange={(e) =>
                  setProfile({ ...profile, clinic_hours: e.target.value })
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
