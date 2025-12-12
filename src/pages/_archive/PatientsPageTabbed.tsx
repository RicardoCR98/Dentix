// src/pages/PatientsPageTabbed.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Section from "../components/Section";
import PatientForm from "../components/PatientForm";
import PatientCard from "../components/PatientCard";
import DiagnosisArea from "../components/DiagnosisArea";
import Odontogram from "../components/Odontogram";
import SessionsTable from "../components/sessions/SessionsTable";
import Attachments from "../components/Attachments";
import PatientSearchDialog from "../components/PatientSearchDialog";
import PendingPaymentsDialog from "../components/PendingPaymentsDialog";
import ShortcutsHelp from "../components/ShortcutsHelp";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/Popover";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/Tabs";
import {
  Plus,
  FileDown,
  FileText,
  User,
  Activity,
  Calendar,
  Paperclip,
  Search,
  Wallet,
  Info,
  AlertTriangle,
  Stethoscope,
  Printer,
} from "lucide-react";

import type {
  AttachmentFile,
  Patient,
  Session,
  ToothDx,
  VisitWithProcedures,
  ProcedureTemplate,
  ReasonType,
  PaymentMethod,
  SessionWithItems,
} from "../lib/types";
import { FinancialHistoryBlock } from "../components/FinancialHistoryBlock";
import { QuickPaymentModal } from "../components/QuickPaymentModal";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import { saveAttachmentFile } from "../lib/files/attachments";
import { useToast } from "../hooks/useToast";

// -------- Estados iniciales --------
const initialPatient: Patient = {
  full_name: "",
  doc_id: "",
  phone: "",
  date_of_birth: "",
  email: "",
  emergency_phone: "",
};

const initialSession: Session = {
  date: new Date().toISOString().slice(0, 10),
  reason_type: "Dolor",
  reason_detail: "",
  diagnosis_text: "",
  budget: 0,
  discount: 0,
  payment: 0,
  balance: 0,
  cumulative_balance: 0,
};

export function PatientsPageTabbed() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado de edición: empieza en true si no hay paciente en URL, false si hay
  const [isEditingPatient, setIsEditingPatient] = useState(
    !searchParams.get("patientId"),
  );

  // Flag para trackear si ya se cargó el paciente desde URL
  const [urlPatientLoaded, setUrlPatientLoaded] = useState(false);

  // Ficha + visita activa
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [session, setSession] = useState<Session>(initialSession);

  // Odontograma, diagnóstico manual y sesiones
  const [toothDx, setToothDx] = useState<ToothDx>({});
  const [manualDiagnosis, setManualDiagnosis] = useState("");
  const [sessions, setSessions] = useState<VisitWithProcedures[]>([]);

  // Adjuntos NUEVOS a guardar
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Plantilla global de procedimientos
  const [procedureTemplates, setProcedureTemplates] = useState<
    ProcedureTemplate[]
  >([]);

  // Lista de doctores/firmantes
  const [signers, setSigners] = useState<Array<{ id: number; name: string }>>(
    [],
  );

  // Lista de tipos de motivos de consulta
  const [reasonTypes, setReasonTypes] = useState<ReasonType[]>([]);

  // Lista de métodos de pago
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);

  // Diálogos / datos auxiliares
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);

  const [patientsForDialogs, setPatientsForDialogs] = useState<
    Array<Patient & { id: number }>
  >([]);

  // Tab activo
  const [activeTab, setActiveTab] = useState("odontogram");

  // ---------- Diagnóstico generado desde el odontograma ----------
  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(toothDx)
      .sort((a, b) => +a - +b)
      .map((n) =>
        toothDx[n]?.length ? `Diente ${n}: ${toothDx[n].join(", ")}` : "",
      )
      .filter(Boolean);
    return lines.join("\n");
  }, [toothDx]);

  // Snapshot de diagnóstico (auto + manual)
  const fullDiagnosis = useMemo(() => {
    const parts: string[] = [];
    if (diagnosisFromTeeth) parts.push(diagnosisFromTeeth);
    if (manualDiagnosis.trim()) parts.push(manualDiagnosis.trim());
    return parts.join("\n\n");
  }, [diagnosisFromTeeth, manualDiagnosis]);

  // ---------- Handlers base ----------
  const onToothDxChange = useCallback((next: ToothDx) => {
    setToothDx(next);
  }, []);

  const handleNew = useCallback(() => {
    // Verificar si hay sesiones en borrador sin guardar
    const draftSessions = sessions.filter((s) => !s.session.is_saved);
    const hasDrafts = draftSessions.length > 0;

    let confirmMessage =
      "¿Crear una nueva historia? Se perderán cambios no guardados.";
    if (hasDrafts) {
      confirmMessage = `⚠️ Tienes ${draftSessions.length} sesión(es) en BORRADOR sin guardar.\n\n¿Estás seguro de crear una nueva historia? Se perderán todos los borradores.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setPatient(initialPatient);
    setSession({
      ...initialSession,
      date: new Date().toISOString().slice(0, 10),
    });
    setToothDx({});
    setManualDiagnosis("");
    setSessions([]);
    setAttachments([]);
    setIsEditingPatient(true);

    // Limpiar parámetro de URL si existe
    setSearchParams({});
    setUrlPatientLoaded(false);
  }, [sessions, setSearchParams]);

  const handlePreview = useCallback(() => window.print(), []);

  // ---------- Guardar ----------
  const handleSave = useCallback(async () => {
    const hasPatientData = Boolean(patient.full_name && patient.doc_id);
    if (!hasPatientData) {
      toast.warning(
        "Datos incompletos",
        "Completa al menos nombre y cédula del paciente para guardar.",
      );
      return;
    }

    try {
      const repo = await getRepository();

      const safeReasonType: Session["reason_type"] =
        session.reason_type ?? ("Otro" as Session["reason_type"]);

      // Convertir toothDx a JSON string
      const toothDxJson = Object.keys(toothDx).length
        ? JSON.stringify(toothDx)
        : undefined;

      const sessionPayload: Session = {
        id: session.id,
        patient_id: patient.id,
        date: session.date!,
        reason_type: safeReasonType,
        reason_detail: session.reason_detail ?? "",
        tooth_dx_json: toothDxJson,
        diagnosis_text: fullDiagnosis || undefined,
        auto_dx_text: diagnosisFromTeeth || undefined,
        full_dx_text: fullDiagnosis || undefined,
        budget: 0,
        discount: 0,
        payment: 0,
        balance: 0,
        cumulative_balance: 0,
        signer: undefined,
        clinical_notes: undefined,
        is_saved: undefined,
        created_at: undefined,
        updated_at: undefined,
      };

      // Preparar datos de attachments ANTES de la transacción
      const newAttachments = attachments.filter((a) => a.file);
      const attachmentMetadata: Array<{
        filename: string;
        mime_type: string;
        bytes: number;
        storage_key: string;
      }> = [];

      // Guardar archivos en disco ANTES de tocar la BD
      for (const a of newAttachments) {
        const { storage_key, bytes } = await saveAttachmentFile(
          a.file!,
          patient.id || 0,
          session.date,
        );
        attachmentMetadata.push({
          filename: a.name,
          mime_type: a.type || "application/octet-stream",
          bytes,
          storage_key,
        });
      }

      // Filtrar solo sesiones en BORRADOR para guardar
      const draftSessions = sessions.filter((s) => !s.session.is_saved);

      if (draftSessions.length === 0) {
        toast.warning("Sin cambios", "No hay sesiones nuevas para guardar");
        return;
      }

      // Ahora guardar solo las sesiones en borrador
      const { patient_id, session_id } = await repo.saveVisitWithSessions({
        patient,
        session: sessionPayload,
        sessions: draftSessions,
      });

      // Guardar attachments metadata
      for (const meta of attachmentMetadata) {
        await repo.createAttachment({
          patient_id: patient_id,
          session_id: session_id,
          ...meta,
        });
      }

      // Actualizar estado local SIN recargar desde BD
      setPatient((prev) => ({ ...prev, id: patient_id }));
      setSession((prev) => ({
        ...prev,
        id: session_id,
        patient_id: patient_id,
      }));

      // Marcar sesiones guardadas como is_saved: true
      setSessions((prevSessions) =>
        prevSessions.map((s) => {
          if (!s.session.is_saved) {
            return {
              ...s,
              session: {
                ...s.session,
                is_saved: true,
                id: session_id,
                patient_id: patient_id,
              },
            };
          }
          return s;
        }),
      );

      // Marcar attachments como guardados
      setAttachments((prev) =>
        prev.map((att, idx) => {
          if (att.file) {
            return {
              ...att,
              file: undefined,
              db_id: idx + 1,
            };
          }
          return att;
        }),
      );

      // Cambiar a modo visualización
      setIsEditingPatient(false);

      toast.success(
        "Guardado exitoso",
        "La historia clínica se ha guardado correctamente",
      );
    } catch (e) {
      console.error("Error al guardar:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error(
        "Error al guardar",
        `No se pudo guardar la historia clínica: ${errorMessage}`,
      );
    }
  }, [
    toast,
    patient,
    session,
    toothDx,
    sessions,
    fullDiagnosis,
    diagnosisFromTeeth,
    manualDiagnosis,
    attachments,
  ]);

  // ---------- Eliminar attachment ----------
  const handleDeleteAttachment = useCallback(async (file: AttachmentFile) => {
    if (!file.db_id) return;

    try {
      const repo = await getRepository();
      await repo.deleteAttachment(file.db_id);
    } catch (e) {
      console.error("Error al eliminar attachment:", e);
      throw e;
    }
  }, []);

  // ---------- Seleccionar paciente ----------
  const handleSelectPatient = useCallback(async (selectedPatient: Patient) => {
    if (!selectedPatient?.id) return;

    try {
      const repo = await getRepository();

      const p = await repo.findPatientById(selectedPatient.id);
      if (!p) return;
      setPatient(p);

      const list = await repo.getVisitsByPatient(p.id!);
      const today = new Date().toISOString().slice(0, 10);

      if (list.length > 0) {
        const last = list[0];
        const lastToothDx = last.tooth_dx_json
          ? (JSON.parse(last.tooth_dx_json) as ToothDx)
          : {};

        setSession({
          date: today,
          reason_type: undefined,
          reason_detail: "",
          diagnosis_text: "",
          tooth_dx_json: last.tooth_dx_json || "",
          budget: 0,
          discount: 0,
          payment: 0,
          balance: 0,
          cumulative_balance: 0,
        });

        setToothDx(lastToothDx);
      } else {
        setSession({ ...initialSession, date: today });
        setToothDx({});
      }

      // Cargar sessions y attachments en paralelo
      const [allSess, savedAttachments] = await Promise.all([
        repo.getSessionsByPatient(p.id!),
        repo.getAttachmentsByPatient(p.id!),
      ]);

      setSessions(allSess);

      const attachmentFiles: AttachmentFile[] = savedAttachments.map((att) => ({
        id: `saved-${att.id}`,
        name: att.filename,
        size: att.size_bytes || 0,
        type: att.mime_type || "",
        url: "",
        uploadDate: att.created_at || "",
        storage_key: att.storage_key,
        db_id: att.id,
      }));
      setAttachments(attachmentFiles);

      // Cambiar a modo visualización si hay datos
      setIsEditingPatient(false);
    } catch (e) {
      console.error("Error al seleccionar paciente:", e);
      alert("Error al cargar los datos del paciente");
    }
  }, []);

  // ---------- Diálogos (con debounce para evitar race conditions) ----------
  useEffect(() => {
    if (!searchDialogOpen) return;

    const timeoutId = setTimeout(async () => {
      try {
        const repo = await getRepository();
        const all = await repo.searchPatients("");
        setPatientsForDialogs(all);
      } catch (e) {
        console.error("Error cargando pacientes para búsqueda:", e);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchDialogOpen]);

  // ---------- Inicializar y cargar datos ----------
  useEffect(() => {
    (async () => {
      try {
        const repo = await getRepository();

        const templates = await repo.getProcedureTemplates();
        const signersList = await repo.getSigners();
        const reasonTypesList = await repo.getReasonTypes();
        const paymentMethodsList = await repo.getPaymentMethods();

        setProcedureTemplates(templates);
        setSigners(signersList);
        setReasonTypes(reasonTypesList);
        setPaymentMethods(paymentMethodsList);
      } catch (error) {
        console.error("Error inicializando datos:", error);
        alert(
          "Error al cargar datos iniciales. Por favor recarga la aplicación.",
        );
        setProcedureTemplates([]);
        setSigners([]);
      }
    })();
  }, []);

  // ---------- Cargar paciente desde URL ----------
  useEffect(() => {
    // Solo cargar una vez
    if (urlPatientLoaded) return;

    const patientIdParam = searchParams.get("patientId");
    if (!patientIdParam) {
      setUrlPatientLoaded(true);
      return;
    }

    const patientId = parseInt(patientIdParam, 10);
    if (isNaN(patientId)) {
      setUrlPatientLoaded(true);
      return;
    }

    (async () => {
      try {
        const repo = await getRepository();
        const p = await repo.findPatientById(patientId);
        if (!p) {
          toast.warning(
            "Paciente no encontrado",
            "No se pudo cargar el paciente solicitado",
          );
          // Limpiar el parámetro de la URL
          setSearchParams({});
          setUrlPatientLoaded(true);
          return;
        }

        // Cargar datos del paciente
        setPatient(p);

        const list = await repo.getVisitsByPatient(p.id!);
        const today = new Date().toISOString().slice(0, 10);

        if (list.length > 0) {
          const last = list[0];
          const lastToothDx = last.tooth_dx_json
            ? (JSON.parse(last.tooth_dx_json) as ToothDx)
            : {};

          setSession({
            date: today,
            reason_type: undefined,
            reason_detail: "",
            diagnosis_text: "",
            tooth_dx_json: last.tooth_dx_json || "",
            budget: 0,
            discount: 0,
            payment: 0,
            balance: 0,
            cumulative_balance: 0,
          });

          setToothDx(lastToothDx);
        } else {
          setSession({ ...initialSession, date: today });
          setToothDx({});
        }

        // Cargar sessions y attachments en paralelo
        const [allSess, savedAttachments] = await Promise.all([
          repo.getSessionsByPatient(p.id!),
          repo.getAttachmentsByPatient(p.id!),
        ]);

        setSessions(allSess);

        const attachmentFiles: AttachmentFile[] = savedAttachments.map(
          (att) => ({
            id: `saved-${att.id}`,
            name: att.filename,
            size: att.size_bytes || 0,
            type: att.mime_type || "",
            url: "",
            uploadDate: att.created_at || "",
            storage_key: att.storage_key,
            db_id: att.id,
          }),
        );
        setAttachments(attachmentFiles);

        // Cambiar a modo visualización
        setIsEditingPatient(false);

        toast.success(
          "Paciente cargado",
          `Se cargó la historia clínica de ${p.full_name}`,
        );

        setUrlPatientLoaded(true);
      } catch (error) {
        console.error("Error cargando paciente desde URL:", error);
        toast.error(
          "Error al cargar",
          "No se pudo cargar el paciente desde la URL",
        );
        setUrlPatientLoaded(true);
      }
    })();
  }, [urlPatientLoaded, searchParams, toast, setSearchParams]);

  // Función para actualizar plantilla global
  const updateProcedureTemplates = useCallback(
    async (
      items: Array<{
        name: string;
        unit_price: number;
        procedure_template_id?: number;
      }>,
    ) => {
      try {
        const validItems = items.filter((it) => it.name.trim().length > 0);

        const templates = validItems.map((it) => ({
          id: it.procedure_template_id,
          name: it.name.trim(),
          default_price: it.unit_price,
        }));

        const repo = await getRepository();
        await repo.saveProcedureTemplates(templates);

        const updatedTemplates = await repo.getProcedureTemplates();
        setProcedureTemplates(updatedTemplates);

        toast.success(
          "Plantilla actualizada",
          "La plantilla de procedimientos se guardó correctamente",
        );
      } catch (error) {
        console.error("Error actualizando plantillas:", error);
        toast.error(
          "Error",
          "No se pudo guardar la plantilla de procedimientos",
        );
        throw error;
      }
    },
    [toast],
  );

  // Función para recargar lista de doctores
  const reloadSigners = useCallback(async () => {
    try {
      const repo = await getRepository();
      const list = await repo.getSigners();
      setSigners(list);
    } catch (error) {
      console.error("Error recargando doctores:", error);
    }
  }, []);

  // Función para recargar lista de tipos de motivos
  const handleReasonTypesChange = useCallback(async () => {
    const repo = await getRepository();
    const updated = await repo.getReasonTypes();
    setReasonTypes(updated);
  }, []);

  const handleQuickPayment = useCallback(
    async (payment: {
      date: string;
      amount: number;
      payment_method_id?: number;
      payment_notes?: string;
    }) => {
      if (!patient.id) {
        toast.warning("Sin paciente", "Selecciona un paciente primero");
        return;
      }

      try {
        const repo = await getRepository();

        const session: Session = {
          date: payment.date,
          reason_type: "Abono a cuenta",
          reason_detail: payment.payment_notes || "Abono rápido a cuenta",
          budget: 0,
          discount: 0,
          payment: payment.amount,
          balance: -payment.amount,
          cumulative_balance: 0,
          payment_method_id: payment.payment_method_id,
          payment_notes: payment.payment_notes,
        };

        const sessionWithItems: SessionWithItems = {
          session: session,
          items: [],
        };

        await repo.saveVisitWithSessions({
          patient,
          session: session,
          sessions: [sessionWithItems],
        });

        const updatedSessions = await repo.getSessionsByPatient(patient.id);
        setSessions(updatedSessions);

        toast.success(
          "Abono registrado",
          "El abono se ha guardado correctamente",
        );
        setQuickPaymentOpen(false);
      } catch (e) {
        console.error("Error al guardar abono:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        toast.error(
          "Error al guardar",
          `No se pudo guardar el abono: ${errorMessage}`,
        );
      }
    },
    [patient, toast],
  );

  // ---------- Atajos de teclado ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const cmd = e.ctrlKey || e.metaKey;
      if (!cmd) return;

      if (k === "s") {
        e.preventDefault();
        handleSave();
      } else if (k === "p") {
        e.preventDefault();
        handlePreview();
      } else if (k === "k") {
        e.preventDefault();
        setSearchDialogOpen(true);
      } else if (k === "n") {
        e.preventDefault();
        handleNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, handlePreview, handleNew]);

  // ---------- Flags UI ----------
  const hasPatientData = Boolean(patient.full_name && patient.doc_id);
  const hasAllergy = Boolean(patient.allergy_detail?.trim());

  return (
    <>
      {/* Diálogos */}
      <PatientSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        patients={patientsForDialogs}
        onSelectPatient={handleSelectPatient}
      />
      <PendingPaymentsDialog
        open={paymentsDialogOpen}
        onOpenChange={setPaymentsDialogOpen}
        onSelectPatient={handleSelectPatient}
      />

      {/* Sección fija superior: Acciones rápidas */}

      <Section
        title="Acciones Rápidas"
        icon={
          <PopoverRoot>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Ver atajos de teclado"
                className="cursor-pointer inline-flex items-center justify-center rounded-full p-1.5 hover:bg-[hsl(var(--muted))]/60 transition"
              >
                <Info size={20} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              className="w-[320px] p-3"
            >
              <ShortcutsHelp />
            </PopoverContent>
          </PopoverRoot>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          {/* Nueva historia */}
          <button
            onClick={handleNew}
            className="
              group flex flex-col items-center justify-center gap-2
              px-5 py-6 rounded-2xl border-2
             badge-success font-semibold text-[15px]
              transition-all duration-150
              hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(30,157,96,0.24)]
              active:scale-[0.97]
            "
          >
            <Plus size={28} />
            Nueva historia
          </button>

          {/* Vista previa */}
          <button
            onClick={handlePreview}
            className="
              group flex flex-col items-center justify-center gap-2
              px-5 py-6 rounded-2xl border-2
              badge-info font-semibold text-[15px]
              transition-all duration-150
              hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(27,99,209,0.24)]
              active:scale-[0.97]
            "
          >
            <Printer size={28} />
            Imprimir
          </button>

          {/* Buscar paciente */}
          <button
            onClick={() => setSearchDialogOpen(true)}
            className="
              group flex flex-col items-center justify-center gap-2
              px-5 py-6 rounded-2xl border-2
             badge-purple font-semibold text-[15px]
             shadow-[0_2px_6px_rgba(214,69,69,0.16)]
              transition-all duration-150
              hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(122,59,227,0.24)]
              active:scale-[0.97]
            "
          >
            <Search size={28} />
            Búsqueda de pacientes
          </button>

          {/* Cartera */}
          <button
            onClick={() => setPaymentsDialogOpen(true)}
            className="
              group flex flex-col items-center justify-center gap-2
              px-5 py-6 rounded-2xl border-2
             badge-danger font-semibold text-[15px]
              transition-all duration-150
              hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(214,69,69,0.24)]
              active:scale-[0.97]
            "
          >
            <Wallet size={28} />
            Cartera de pendientes
          </button>
        </div>
      </Section>

      {/* Sección fija superior: Datos del paciente O card del paciente */}
      <Section
        title="Datos del Paciente"
        icon={<User size={20} />}
        right={
          hasAllergy &&
          !isEditingPatient && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-base font-bold shadow-lg">
              <AlertTriangle size={20} className="animate-pulse" />
              ALERGIA
            </div>
          )
        }
      >
        {isEditingPatient ? (
          <>
            <PatientForm value={patient} onChange={setPatient} />
            {!hasPatientData && (
              <Alert variant="warning" className="mt-4">
                Por favor completa al menos el nombre y cédula del paciente para
                poder guardar.
              </Alert>
            )}
          </>
        ) : (
          <PatientCard
            patient={patient}
            onEdit={() => setIsEditingPatient(true)}
          />
        )}
      </Section>

      {/* Sistema de tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-6 bg-[hsl(var(--surface))]">
          <TabsTrigger value="odontogram">
            <Activity size={18} />
            Odontograma y Diagnóstico
          </TabsTrigger>
          <TabsTrigger value="procedures">
            <Stethoscope size={18} />
            Evolución y Procedimientos
          </TabsTrigger>
          <TabsTrigger value="financial">
            <Wallet size={18} />
            Historial Financiero
          </TabsTrigger>
          <TabsTrigger value="attachments">
            <Paperclip size={18} />
            Adjuntos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Odontograma + Diagnóstico */}
        <TabsContent value="odontogram">
          <Section
            title="Odontograma por Cuadrantes"
            icon={<Activity size={20} />}
          >
            <Odontogram value={toothDx} onChange={onToothDxChange} />
            <div className="mt-4 p-4 bg-[hsl(var(--muted))] rounded-lg">
              <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <FileText size={14} />
                <span>
                  <strong>Instrucciones:</strong> Haz clic en cualquier pieza
                  dental para seleccionar diagnósticos. Los cambios se
                  reflejarán automáticamente en la sección de diagnóstico.
                </span>
              </p>
            </div>
          </Section>

          <Section title="Diagnóstico" icon={<FileText size={20} />}>
            {diagnosisFromTeeth && (
              <Alert variant="info" className="mb-3">
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="mt-0.5" />
                  <div className="text-sm">
                    <strong>Diagnóstico automático del odontograma:</strong>
                    <p className="mt-1 whitespace-pre-line">
                      {diagnosisFromTeeth}
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            <DiagnosisArea
              value={manualDiagnosis}
              onChange={setManualDiagnosis}
              autoGenerated={Boolean(diagnosisFromTeeth)}
            />

            <div className="mt-3 p-3 bg-[hsl(var(--muted))] rounded text-sm text-[hsl(var(--muted-foreground))]">
              <strong>Nota:</strong> Al guardar, se combinarán las selecciones
              del odontograma con tus notas manuales en el campo{" "}
              <em>diagnóstico</em> de la visita.
            </div>
          </Section>
        </TabsContent>

        {/* Tab 2: Evolución y Procedimientos */}
        <TabsContent value="procedures">
          <Section
            title="Evolución y Procedimientos"
            icon={<Activity size={20} />}
          >
            <SessionsTable
              sessions={sessions}
              onSessionsChange={setSessions}
              procedureTemplates={procedureTemplates}
              onUpdateTemplates={updateProcedureTemplates}
              signers={signers}
              onSignersChange={reloadSigners}
              reasonTypes={reasonTypes}
              paymentMethods={paymentMethods}
              onReasonTypesChange={handleReasonTypesChange}
            />
          </Section>
        </TabsContent>

        {/* Tab 3: Historial Financiero */}
        <TabsContent value="financial">
          {(() => {
            const savedSessions = sessions.filter(
              (s) => s.session.is_saved === true,
            );

            return patient.id && savedSessions.length > 0 ? (
              <Section icon={<Wallet size={20} />} title="Historial Financiero">
                <FinancialHistoryBlock
                  sessions={savedSessions}
                  onQuickPayment={() => setQuickPaymentOpen(true)}
                />
              </Section>
            ) : (
              <Section icon={<Wallet size={20} />} title="Historial Financiero">
                <Alert variant="info">
                  No hay historial financiero disponible. Guarda al menos una
                  sesión para ver el historial.
                </Alert>
              </Section>
            );
          })()}

          {/* Quick Payment Modal */}
          {patient.id && (
            <QuickPaymentModal
              open={quickPaymentOpen}
              onOpenChange={setQuickPaymentOpen}
              patientId={patient.id}
              paymentMethods={paymentMethods}
              onSave={handleQuickPayment}
            />
          )}
        </TabsContent>

        {/* Tab 4: Adjuntos */}
        <TabsContent value="attachments">
          <Section
            title="Adjuntos (Radiografías, Fotos, Documentos)"
            icon={<Paperclip size={20} />}
          >
            <Attachments
              files={attachments}
              onFilesChange={setAttachments}
              onFileDelete={handleDeleteAttachment}
              patientName={patient.full_name}
            />
          </Section>
        </TabsContent>
      </Tabs>
    </>
  );
}
