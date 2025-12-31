// src/pages/SettingsPage.tsx
import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  CreditCard,
  Sparkles,
  Loader2,
  Shield,
  Copy,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import { tauriSqliteRepository } from "../lib/storage/TauriSqliteRepository";
import { telemetryService } from "../lib/telemetry";
import { useToast } from "../hooks/useToast";
import { TemplatesManagerModal } from "../components/TemplatesManagerModal";
import type {
  DoctorProfile,
  ProcedureTemplate,
  Signer,
  PaymentMethod,
} from "../lib/types";

export function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  // Telemetry data
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | undefined>();

  // Profile data
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

  // Working hours
  const [workStartHour, setWorkStartHour] = useState("08:00");
  const [workEndHour, setWorkEndHour] = useState("18:00");
  const [lunchStartHour, setLunchStartHour] = useState("12:00");
  const [lunchEndHour, setLunchEndHour] = useState("13:00");

  // Catalog data
  const [procedureTemplates, setProcedureTemplates] = useState<
    ProcedureTemplate[]
  >([]);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // New items (inline creation)
  const [newProcedureName, setNewProcedureName] = useState("");
  const [newProcedurePrice, setNewProcedurePrice] = useState("");
  const [newSignerName, setNewSignerName] = useState("");
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("");

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load profile
      const data = await tauriSqliteRepository.getDoctorProfile();
      if (data) {
        setProfile(data);

        // Parse clinic hours
        if (data.clinic_hours) {
          try {
            const hours = JSON.parse(data.clinic_hours);
            if (hours.workStart) setWorkStartHour(hours.workStart);
            if (hours.workEnd) setWorkEndHour(hours.workEnd);
            if (hours.lunchStart) setLunchStartHour(hours.lunchStart);
            if (hours.lunchEnd) setLunchEndHour(hours.lunchEnd);
          } catch (err) {
            console.error("Error parsing clinic hours:", err);
          }
        }
      }

      // Load catalogs
      const [templates, signersData, paymentMethodsData] = await Promise.all([
        tauriSqliteRepository.getProcedureTemplates(),
        tauriSqliteRepository.getSigners(),
        tauriSqliteRepository.getPaymentMethods(),
      ]);

      setProcedureTemplates(templates.filter((t) => t.active !== false));
      setSigners(signersData as Signer[]);
      setPaymentMethods(paymentMethodsData);

      // Load telemetry data
      try {
        await telemetryService.initialize();
        setTelemetryEnabled(telemetryService.isEnabled());
        setInstallationId(telemetryService.getInstallationId());
        setLastHeartbeat(telemetryService.getLastHeartbeat());
      } catch (err) {
        console.error("Error loading telemetry data:", err);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Error", "No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!profile.email?.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = "Email inválido";
    }
    if (!profile.clinic_name?.trim()) {
      newErrors.clinic_name = "El nombre de la clínica es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggleTelemetry = async (enabled: boolean) => {
    try {
      await telemetryService.setEnabled(enabled);
      setTelemetryEnabled(enabled);
      toast.success(
        "Telemetría actualizada",
        `La telemetría ha sido ${enabled ? "habilitada" : "deshabilitada"}`
      );
    } catch (error) {
      console.error("Error toggling telemetry:", error);
      toast.error("Error", "No se pudo actualizar la configuración de telemetría");
    }
  };

  const handleCopyInstallationId = () => {
    if (installationId) {
      navigator.clipboard.writeText(installationId);
      toast.success("Copiado", "Installation ID copiado al portapapeles");
    }
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      toast.error(
        "Error de validación",
        "Por favor completa los campos requeridos",
      );
      setActiveTab("profile"); // Switch to profile tab to show errors
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

      // Save profile
      await tauriSqliteRepository.upsertDoctorProfile({
        ...profile,
        clinic_hours: clinicHours,
      });

      // Save procedure templates
      await tauriSqliteRepository.saveProcedureTemplates(procedureTemplates);

      toast.success(
        "Guardado exitoso",
        "Los cambios se guardaron correctamente",
      );
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error", "No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProcedure = () => {
    if (!newProcedureName.trim() || !newProcedurePrice.trim()) {
      toast.error("Error", "Completa el nombre y precio del procedimiento");
      return;
    }

    const price = parseFloat(newProcedurePrice);
    if (isNaN(price) || price < 0) {
      toast.error("Error", "El precio debe ser un número válido");
      return;
    }

    const newTemplate: ProcedureTemplate = {
      name: newProcedureName.trim(),
      default_price: price,
      active: true,
    };

    setProcedureTemplates([...procedureTemplates, newTemplate]);
    setNewProcedureName("");
    setNewProcedurePrice("");
    toast.success(
      "Agregado",
      "Procedimiento agregado (recuerda guardar cambios)",
    );
  };

  const handleDeleteProcedure = (index: number) => {
    const updated = [...procedureTemplates];
    updated.splice(index, 1);
    setProcedureTemplates(updated);
  };

  const handleUpdateProcedurePrice = (index: number, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price)) return;

    const updated = [...procedureTemplates];
    updated[index] = { ...updated[index], default_price: price };
    setProcedureTemplates(updated);
  };

  const handleAddSigner = async () => {
    if (!newSignerName.trim()) {
      toast.error("Error", "Ingresa un nombre");
      return;
    }

    try {
      const id = await tauriSqliteRepository.createSigner(newSignerName.trim());
      setSigners([
        ...signers,
        { id, name: newSignerName.trim(), active: true },
      ]);
      setNewSignerName("");
      toast.success("Agregado", "Doctor agregado correctamente");
    } catch (error) {
      console.error("Error adding signer:", error);
      toast.error("Error", "No se pudo agregar el doctor");
    }
  };

  const handleDeleteSigner = async (id: number) => {
    try {
      await tauriSqliteRepository.deleteSigner(id);
      setSigners(signers.filter((s) => s.id !== id));
      toast.success("Eliminado", "Doctor eliminado correctamente");
    } catch (error) {
      console.error("Error deleting signer:", error);
      toast.error("Error", "No se pudo eliminar el doctor");
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethodName.trim()) {
      toast.error("Error", "Ingresa un nombre");
      return;
    }

    try {
      const id = await tauriSqliteRepository.createPaymentMethod(
        newPaymentMethodName.trim(),
      );
      setPaymentMethods([
        ...paymentMethods,
        { id, name: newPaymentMethodName.trim(), active: true },
      ]);
      setNewPaymentMethodName("");
      toast.success("Agregado", "Método de pago agregado correctamente");
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast.error("Error", "No se pudo agregar el método de pago");
    }
  };

  const getProfileCompleteness = (): {
    status: "complete" | "incomplete" | "warning";
    label: string;
    percentage: number;
  } => {
    let filled = 0;
    const total = 6;

    if (profile.name.trim()) filled++;
    if (profile.email?.trim()) filled++;
    if (profile.clinic_name?.trim()) filled++;
    if (profile.phone?.trim()) filled++;
    if (profile.location?.trim()) filled++;
    if (profile.clinic_slogan?.trim()) filled++;

    const percentage = Math.round((filled / total) * 100);

    if (percentage === 100)
      return { status: "complete", label: "Completo", percentage };
    if (percentage >= 50)
      return { status: "warning", label: "Parcial", percentage };
    return { status: "incomplete", label: "Incompleto", percentage };
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
        <p className="text-[hsl(var(--muted-foreground))]">
          Cargando configuración...
        </p>
      </div>
    );
  }

  const completeness = getProfileCompleteness();

  return (
    <div className="space-y-6 pb-20">
      {/* Header with status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
            Configuración
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Gestiona la información de tu clínica y personaliza la aplicación
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Profile completeness indicator */}
          <div className="flex items-center gap-2">
            {completeness.status === "complete" && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            {completeness.status === "warning" && (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            {completeness.status === "incomplete" && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div className="text-sm">
              <div className="font-medium text-[hsl(var(--foreground))]">
                Perfil {completeness.percentage}%
              </div>
              <div className="text-[hsl(var(--muted-foreground))]">
                {completeness.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Perfil Profesional
          </TabsTrigger>
          <TabsTrigger value="catalogs" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Catálogos
          </TabsTrigger>
          <TabsTrigger value="personalization" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Personalización
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Professional Profile */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          {/* Doctor Information Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                <User className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  Información del Doctor
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Datos personales y de contacto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-1">
                  Nombre completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Dr. Juan Pérez"
                  value={profile.name}
                  onChange={(e) => {
                    setProfile({ ...profile, name: e.target.value });
                    setErrors({ ...errors, name: "" });
                  }}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@ejemplo.com"
                  value={profile.email || ""}
                  onChange={(e) => {
                    setProfile({ ...profile, email: e.target.value });
                    setErrors({ ...errors, email: "" });
                  }}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  value={profile.phone || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad, País"
                  value={profile.location || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                />
              </div>
            </div>
          </Card>

          {/* Clinic Information Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                <Building2 className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  Información de la Clínica
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Datos de tu consultorio o clínica dental
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="clinic_name"
                  className="flex items-center gap-1"
                >
                  Nombre de la Clínica <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clinic_name"
                  placeholder="Clínica Dental Sonrisa"
                  value={profile.clinic_name || ""}
                  onChange={(e) => {
                    setProfile({ ...profile, clinic_name: e.target.value });
                    setErrors({ ...errors, clinic_name: "" });
                  }}
                  className={errors.clinic_name ? "border-red-500" : ""}
                />
                {errors.clinic_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.clinic_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="clinic_slogan">Eslogan</Label>
                <Input
                  id="clinic_slogan"
                  placeholder="Tu sonrisa es nuestra prioridad"
                  value={profile.clinic_slogan || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, clinic_slogan: e.target.value })
                  }
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Aparece en documentos y reportes
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Catalogs */}
        <TabsContent value="catalogs" className="space-y-6 mt-6">
          {/* Procedure Prices Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                  <DollarSign className="w-5 h-5 text-[hsl(var(--brand))]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    Precios de Procedimientos
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {procedureTemplates.length} procedimiento(s) configurado(s)
                  </p>
                </div>
              </div>
              <Badge variant="info">{procedureTemplates.length}</Badge>
            </div>

            {/* Add new procedure */}
            <div className="mb-4 p-4 border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted)/0.3)]">
              <Label className="text-sm font-medium mb-2 block">
                Agregar nuevo procedimiento
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del procedimiento"
                  value={newProcedureName}
                  onChange={(e) => setNewProcedureName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={newProcedurePrice}
                  onChange={(e) => setNewProcedurePrice(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleAddProcedure} variant="secondary">
                  Agregar
                </Button>
              </div>
            </div>

            {/* Procedures list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {procedureTemplates.length === 0 ? (
                <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No hay procedimientos configurados. Agrega uno arriba.
                </p>
              ) : (
                procedureTemplates.map((template, index) => (
                  <div
                    key={template.id || index}
                    className="flex items-center gap-3 p-3 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[hsl(var(--foreground))]">
                        {template.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        $
                      </span>
                      <Input
                        type="number"
                        value={template.default_price}
                        onChange={(e) =>
                          handleUpdateProcedurePrice(index, e.target.value)
                        }
                        className="w-24"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProcedure(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Signers Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                  <Users className="w-5 h-5 text-[hsl(var(--brand))]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    Doctores Firmantes
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Doctores que pueden firmar historias clínicas
                  </p>
                </div>
              </div>
              <Badge variant="info">{signers.length}</Badge>
            </div>

            {/* Add new signer */}
            <div className="mb-4 p-4 border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted)/0.3)]">
              <Label className="text-sm font-medium mb-2 block">
                Agregar nuevo doctor
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del doctor"
                  value={newSignerName}
                  onChange={(e) => setNewSignerName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddSigner} variant="secondary">
                  Agregar
                </Button>
              </div>
            </div>

            {/* Signers list */}
            <div className="space-y-2">
              {signers.length === 0 ? (
                <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No hay doctores firmantes. Agrega uno arriba.
                </p>
              ) : (
                signers.map((signer) => (
                  <div
                    key={signer.id}
                    className="flex items-center justify-between p-3 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
                  >
                    <div className="font-medium text-[hsl(var(--foreground))]">
                      {signer.name}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSigner(signer.id!)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Payment Methods Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                  <CreditCard className="w-5 h-5 text-[hsl(var(--brand))]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    Métodos de Pago
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Formas de pago disponibles en tu clínica
                  </p>
                </div>
              </div>
              <Badge variant="info">{paymentMethods.length}</Badge>
            </div>

            {/* Add new payment method */}
            <div className="mb-4 p-4 border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted)/0.3)]">
              <Label className="text-sm font-medium mb-2 block">
                Agregar método de pago
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Tarjeta de crédito, Efectivo, Transferencia"
                  value={newPaymentMethodName}
                  onChange={(e) => setNewPaymentMethodName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddPaymentMethod} variant="secondary">
                  Agregar
                </Button>
              </div>
            </div>

            {/* Payment methods list */}
            <div className="space-y-2">
              {paymentMethods.length === 0 ? (
                <p className="text-center text-[hsl(var(--muted-foreground))] py-8">
                  No hay métodos de pago configurados.
                </p>
              ) : (
                paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-3 border border-[hsl(var(--border))] rounded-lg"
                  >
                    <div className="font-medium text-[hsl(var(--foreground))]">
                      {method.name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Personalization */}
        <TabsContent value="personalization" className="space-y-6 mt-6">
          {/* Working Hours Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                <Clock className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  Horarios de Atención
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Define el horario de trabajo para el calendario de citas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workStartHour">Hora de Apertura</Label>
                <Input
                  id="workStartHour"
                  type="time"
                  value={workStartHour}
                  onChange={(e) => setWorkStartHour(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="workEndHour">Hora de Cierre</Label>
                <Input
                  id="workEndHour"
                  type="time"
                  value={workEndHour}
                  onChange={(e) => setWorkEndHour(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="lunchStartHour">Inicio de Almuerzo</Label>
                <Input
                  id="lunchStartHour"
                  type="time"
                  value={lunchStartHour}
                  onChange={(e) => setLunchStartHour(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="lunchEndHour">Fin de Almuerzo</Label>
                <Input
                  id="lunchEndHour"
                  type="time"
                  value={lunchEndHour}
                  onChange={(e) => setLunchEndHour(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Horario configurado:</strong> {workStartHour} -{" "}
                {workEndHour} (Almuerzo: {lunchStartHour} - {lunchEndHour})
              </p>
            </div>
          </Card>

          {/* Text Templates Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                <FileText className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  Plantillas de Texto
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Mensajes predefinidos para WhatsApp, diagnósticos y notas
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => setTemplatesModalOpen(true)}
            >
              <FileText className="w-4 h-4" />
              Gestionar plantillas
            </Button>
          </Card>
        </TabsContent>

        {/* Tab 4: System Info */}
        <TabsContent value="system" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--brand)/0.1)]">
                <Settings className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  Información del Sistema
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Datos técnicos y de configuración
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border border-[hsl(var(--border))] rounded-lg">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Versión de la Aplicación
                </span>
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {profile.app_version || "1.0.0"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 border border-[hsl(var(--border))] rounded-lg">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Última sincronización
                </span>
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {profile.last_sync
                    ? formatDate(profile.last_sync)
                    : "No disponible"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 border border-[hsl(var(--border))] rounded-lg">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Términos aceptados
                </span>
                <Badge
                  variant={profile.agreed_to_terms ? "success" : "warning"}
                >
                  {profile.agreed_to_terms ? "Sí" : "No"}
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 border border-[hsl(var(--border))] rounded-lg">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Fecha de creación
                </span>
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {formatDate(profile.created_at)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 border border-[hsl(var(--border))] rounded-lg">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Última actualización
                </span>
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {formatDate(profile.updated_at)}
                </span>
              </div>
            </div>
          </Card>

          {/* Telemetry & Privacy Card */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-[hsl(var(--brand)/0.1)] rounded-xl">
                <Shield className="w-5 h-5 text-[hsl(var(--brand))]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  Telemetría y Privacidad
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Control de datos de uso y estadísticas anónimas
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Telemetry Toggle */}
              <div className="flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    Enviar datos de telemetría
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    Ayúdanos a mejorar Oklus enviando estadísticas de uso anónimas. No recopilamos datos médicos ni información personal.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={telemetryEnabled}
                    onChange={(e) => handleToggleTelemetry(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[hsl(var(--muted))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--brand)/0.3)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--brand))]"></div>
                </label>
              </div>

              {/* Installation ID */}
              {installationId && (
                <div className="flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted)/0.3)]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                      Installation ID
                    </p>
                    <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] truncate">
                      {installationId}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopyInstallationId}
                    className="ml-3 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/80"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Last Heartbeat */}
              {lastHeartbeat && (
                <div className="flex justify-between items-center p-3 border border-[hsl(var(--border))] rounded-lg">
                  <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    Último reporte de uso
                  </span>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {formatDate(lastHeartbeat)}
                  </span>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  <strong>Privacidad garantizada:</strong> Los datos de telemetría son completamente anónimos y NO incluyen información médica de pacientes, nombres, documentos de identidad ni ningún dato personal sensible. Solo recopilamos estadísticas de uso (instalaciones activas, errores críticos, características utilizadas) para mejorar la aplicación.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating save button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="shadow-lg hover:shadow-xl transition-shadow gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      {/* Templates Manager Modal */}
      <TemplatesManagerModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
      />
    </div>
  );
}
