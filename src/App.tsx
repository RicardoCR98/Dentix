// src/App.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout";
import Section from "./components/Section";
import PatientForm from "./components/PatientForm";
import DiagnosisArea from "./components/DiagnosisArea";
import Odontogram from "./components/Odontogram";
import SessionsTable from "./components/SessionsTable";
import Attachments from "./components/Attachments";
import PatientSearchDialog from "./components/PatientSearchDialog";
import PendingPaymentsDialog from "./components/PendingPaymentsDialog";
import ShortcutsHelp from "./components/ShortcutsHelp";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
} from "./components/ui/Popover";
import { Label } from "./components/ui/Label";
import { Button } from "./components/ui/Button";
import { Textarea } from "./components/ui/Textarea";
import { Alert } from "./components/ui/Alert";
import {
  Plus,
  Save,
  FileDown,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Paperclip,
  Activity,
  Search,
  Wallet,
  Info,
  AlertTriangle,
} from "lucide-react";

import type {
  AttachmentFile,
  Patient,
  Visit,
  ToothDx,
  SessionRow,
  ProcedureTemplate,
  ReasonType,
} from "./lib/types";
import ThemePanel from "./components/ThemePanel";
import ReasonTypeSelect from "./components/ReasonTypeSelect";
import { getRepository } from "./lib/storage/TauriSqliteRepository";
import { saveAttachmentFile } from "./lib/files/attachments";
import { useToast } from "./components/ToastProvider";

// -------- Estados iniciales --------
const initialPatient: Patient = {
  full_name: "",
  doc_id: "",
  phone: "",
  date_of_birth: "",
  email: "",
  emergency_phone: "",
};

const initialVisit: Visit = {
  date: new Date().toISOString().slice(0, 10),
  reasonType: "Dolor",
  reasonDetail: "",
  diagnosis: "",
};

export default function App() {
  // hook de notificaciones
  const toast = useToast();

  // ficha + visita activa
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [visit, setVisit] = useState<Visit>(initialVisit);

  // odontograma, diagnóstico manual y sesiones
  const [toothDx, setToothDx] = useState<ToothDx>({});
  const [manualDiagnosis, setManualDiagnosis] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  // adjuntos NUEVOS a guardar
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // plantilla global de procedimientos
  const [procedureTemplates, setProcedureTemplates] = useState<
    ProcedureTemplate[]
  >([]);

  // lista de doctores/firmantes
  const [signers, setSigners] = useState<Array<{ id: number; name: string }>>(
    [],
  );

  // lista de tipos de motivos de consulta
  const [reasonTypes, setReasonTypes] = useState<ReasonType[]>([]);

  // diálogos / datos auxiliares
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);

  const [patientsForDialogs, setPatientsForDialogs] = useState<
    Array<Patient & { id: number }>
  >([]);
  const [patientSessionsMap, setPatientSessionsMap] = useState<
    Record<number, SessionRow[]>
  >({});

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
    setVisit((v) => ({ ...v, toothDx: next }));
  }, []);

  const handleNew = useCallback(() => {
    if (
      !confirm("¿Crear una nueva historia? Se perderán cambios no guardados.")
    )
      return;
    setPatient(initialPatient);
    setVisit({ ...initialVisit, date: new Date().toISOString().slice(0, 10) });
    setToothDx({});
    setManualDiagnosis("");
    setSessions([]);
    setAttachments([]);
    setShowSaveAlert(false);
  }, []);

  const handlePreview = useCallback(() => window.print(), []);

  // ---------- Guardar ----------
  const handleSave = useCallback(async () => {
    const hasPatientData = Boolean(patient.full_name && patient.doc_id);
    if (!hasPatientData) {
      toast.warning("Datos incompletos", "Completa al menos nombre y cédula del paciente para guardar.");
      return;
    }

    try {
      const repo = await getRepository();

      const safeReasonType: Visit["reasonType"] =
        visit.reasonType ?? ("Otro" as Visit["reasonType"]);

      const visitPayload: Visit & {
        autoDxText?: string;
        manualDxText?: string;
        fullDxText?: string;
      } = {
        date: visit.date!,
        reasonType: safeReasonType,
        reasonDetail: visit.reasonDetail ?? "",
        toothDx: Object.keys(toothDx).length ? toothDx : undefined,
        diagnosis: fullDiagnosis || undefined,
        autoDxText: diagnosisFromTeeth || undefined,
        manualDxText: manualDiagnosis || undefined,
        fullDxText: fullDiagnosis || undefined,
      };

      // Preparar datos de attachments ANTES de la transacción
      const newAttachments = attachments.filter((a) => a.file);
      const attachmentMetadata: Array<{
        filename: string;
        mime_type: string;
        bytes: number;
        storage_key: string;
      }> = [];

      // Guardar archivos en disco ANTES de tocar la BD (operación lenta)
      for (const a of newAttachments) {
        const { storage_key, bytes } = await saveAttachmentFile(
          a.file!,
          patient.id || 0, // Usaremos el ID real después
          visit.date,
        );
        attachmentMetadata.push({
          filename: a.name,
          mime_type: a.type || "application/octet-stream",
          bytes,
          storage_key,
        });
      }

      // Ahora guardar TODO en una sola transacción
      const { patientId, visitId } = await repo.saveVisitWithSessions({
        patient,
        visit: visitPayload,
        sessions,
      });

      // Guardar attachments metadata (operación rápida)
      for (const meta of attachmentMetadata) {
        await repo.createAttachment({
          patient_id: patientId,
          visit_id: visitId,
          ...meta,
        });
      }

      // Actualizar estado local SIN recargar desde BD
      setPatient((prev) => ({ ...prev, id: patientId }));
      setVisit((prev) => ({ ...prev, id: visitId, patient_id: patientId }));

      // Actualizar sessions con IDs si es necesario
      setSessions((prevSessions) =>
        prevSessions.map((s) => ({ ...s, visitId })),
      );

      // Marcar attachments como guardados (sin recargar)
      setAttachments((prev) =>
        prev.map((att, idx) => {
          if (att.file) {
            return {
              ...att,
              file: undefined, // Ya no es "nuevo"
              db_id: idx + 1, // ID temporal, será correcto al recargar
            };
          }
          return att;
        }),
      );

      // Notificación de éxito
      toast.success("Guardado exitoso", "La historia clínica se ha guardado correctamente");
    } catch (e) {
      console.error("Error al guardar:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error("Error al guardar", `No se pudo guardar la historia clínica: ${errorMessage}`);
    }
  }, [
    toast,
    patient,
    visit,
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
      throw e; // Re-lanzar para que el componente maneje el error
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const last = list[0] as any;
        const lastToothDx =
          last.toothDx ??
          (last.tooth_dx_json
            ? (JSON.parse(last.tooth_dx_json) as ToothDx)
            : undefined);

        setVisit({
          date: today,
          reasonType: undefined,
          reasonDetail: "",
          diagnosis: "",
          toothDx: lastToothDx,
        });

        setToothDx(lastToothDx || {});
      } else {
        setVisit({ ...initialVisit, date: today, reasonDetail: "" });
        setToothDx({});
      }

      // Cargar sessions y attachments en paralelo (operaciones de LECTURA)
      const [allSess, savedAttachments] = await Promise.all([
        repo.getSessionsByPatient(p.id!),
        repo.getAttachmentsByPatient(p.id!),
      ]);

      setSessions(allSess);

      const attachmentFiles: AttachmentFile[] = savedAttachments.map((att) => ({
        id: `saved-${att.id}`,
        name: att.filename,
        size: att.bytes,
        type: att.mime_type,
        url: "", // Se generará bajo demanda al visualizar
        uploadDate: att.created_at,
        storage_key: att.storage_key,
        db_id: att.id,
      }));
      setAttachments(attachmentFiles);
    } catch (e) {
      console.error("Error al seleccionar paciente:", e);
      alert("Error al cargar los datos del paciente");
    }
  }, []);

  // ---------- Diálogos (con debounce para evitar race conditions) ----------
  useEffect(() => {
    if (!searchDialogOpen) return;

    // Debounce de 150ms para evitar conflictos con guardado
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

  useEffect(() => {
    if (!paymentsDialogOpen) return;

    // Debounce de 150ms para evitar conflictos con guardado
    const timeoutId = setTimeout(async () => {
      try {
        const repo = await getRepository();
        const all = await repo.searchPatients("");
        setPatientsForDialogs(all);

        // OPTIMIZADO: Cargar sesiones usando getSessionsByPatient
        // en lugar de loops anidados (N+M queries → N queries)
        const map: Record<number, SessionRow[]> = {};
        for (const p of all) {
          if (!p.id) continue;
          map[p.id] = await repo.getSessionsByPatient(p.id);
        }
        setPatientSessionsMap(map);
      } catch (e) {
        console.error("Error cargando datos de cartera:", e);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [paymentsDialogOpen]);

  // ---------- Inicializar y cargar datos ----------
  useEffect(() => {
    (async () => {
      try {
        // Primero obtener el repositorio (esto inicializa la DB)
        const repo = await getRepository();

        // OPTIMIZACIÓN: Los datos por defecto ya están en la BD (migraciones 002, 003 y 007)
        // Solo cargar lo que viene de la BD, sin insertar nada
        const templates = await repo.getProcedureTemplates();
        const signersList = await repo.getSigners();
        const reasonTypesList = await repo.getReasonTypes();

        console.log("✅ Plantillas cargadas desde BD:", templates.length);
        console.log("✅ Firmantes cargados desde BD:", signersList.length);
        console.log(
          "✅ Tipos de motivos cargados desde BD:",
          reasonTypesList.length,
        );

        setProcedureTemplates(templates);
        setSigners(signersList);
        setReasonTypes(reasonTypesList);
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

  // Función para actualizar plantilla global
  const updateProcedureTemplates = useCallback(
    async (items: Array<{ name: string; unit: number; procedure_template_id?: number }>) => {
      try {
        // Filtrar solo items con nombre (ignorar vacíos)
        const validItems = items.filter((it) => it.name.trim().length > 0);

        const templates = validItems.map((it) => ({
          id: it.procedure_template_id, // Preservar ID de plantilla si existe
          name: it.name.trim(),
          default_price: it.unit,
        }));

        const repo = await getRepository();
        await repo.saveProcedureTemplates(templates);

        // CRÍTICO: Recargar desde BD para obtener IDs correctos
        // Esto garantiza sincronización perfecta entre BD y estado local
        const updatedTemplates = await repo.getProcedureTemplates();
        console.log("✅ Plantillas actualizadas desde BD:", updatedTemplates.length);
        setProcedureTemplates(updatedTemplates);

        toast.success("Plantilla actualizada", "La plantilla de procedimientos se guardó correctamente");
      } catch (error) {
        console.error("Error actualizando plantillas:", error);
        toast.error("Error", "No se pudo guardar la plantilla de procedimientos");
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
  const reloadReasonTypes = useCallback(async () => {
    try {
      const repo = await getRepository();
      const list = await repo.getReasonTypes();
      setReasonTypes(list);
    } catch (error) {
      console.error("Error recargando tipos de motivos:", error);
    }
  }, []);

  // ---------- Atajos ----------
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
  const canSave = hasPatientData;
  const hasAllergy = Boolean(patient.allergyDetail?.trim());

  return (
    <Layout
      clinicName="GREENAPPLEDENTAL"
      slogan="Magic in your smile"
      schedule="10:00 - 1:00 / 3:00 - 7:00"
      headerRight={
        <>
          <ThemePanel inlineTrigger />
        </>
      }
    >
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
        patients={patientsForDialogs}
        patientSessions={patientSessionsMap}
        onSelectPatient={handleSelectPatient}
      />
      {/* Acciones rápidas */}
      <Section
        title="Acciones Rápidas"
        icon={
          <PopoverRoot>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Ver atajos de teclado"
                className="cursor-pointer inline-flex items-center justify-center rounded-full p-1 hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
                title="Atajos de teclado"
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
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={handleNew}
            variant="primary"
            size="lg"
            className="min-w-[180px] h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus size={22} />
            Nueva historia
          </Button>
          <Button
            onClick={handlePreview}
            variant="secondary"
            size="lg"
            className="min-w-[180px] h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileDown size={22} />
            Vista previa/Imprimir
          </Button>
          <Button
            onClick={() => setSearchDialogOpen(true)}
            variant="secondary"
            size="lg"
            className="min-w-[180px] h-14 text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Search size={22} />
            Búsqueda de pacientes
          </Button>
          <Button
            onClick={() => setPaymentsDialogOpen(true)}
            variant="secondary"
            size="lg"
            className="min-w-[180px] h-14 text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Wallet size={22} />
            Cartera de pendientes
          </Button>
        </div>
      </Section>
      {/* Datos del paciente */}
      <Section
        title="Datos del Paciente"
        icon={<User size={20} />}
        right={
          hasAllergy && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-base font-bold shadow-lg">
              <AlertTriangle size={20} className="animate-pulse" />
              ALERGIA
            </div>
          )
        }
      >
        <PatientForm value={patient} onChange={setPatient} />
        {!hasPatientData && (
          <Alert variant="warning" className="mt-4">
            Por favor completa al menos el nombre y cédula del paciente para
            poder guardar.
          </Alert>
        )}
      </Section>
      {/* Motivo */}
      <Section title="Motivo de Consulta" icon={<Stethoscope size={20} />}>
        <div className="grid mb-4">
          <div>
            <Label required>Tipo de consulta</Label>
            <ReasonTypeSelect
              value={visit.reasonType || "Dolor"}
              onChange={(v) =>
                setVisit((vv) => ({
                  ...vv,
                  reasonType: v as Visit["reasonType"],
                }))
              }
              reasonTypes={reasonTypes}
              onReasonTypesChange={reloadReasonTypes}
              onError={(title, message) => toast.error(title, message)}
            />
          </div>
        </div>

        <Textarea
          label="Descripción detallada"
          value={visit.reasonDetail || ""}
          onChange={(e) =>
            setVisit((v) => ({ ...v, reasonDetail: e.target.value }))
          }
          placeholder="Describe el motivo de la consulta, síntomas, duración, etc."
          className="min-h-[100px]"
        />
      </Section>
      {/* Odontograma */}
      <Section title="Odontograma por Cuadrantes" icon={<Activity size={20} />}>
        <Odontogram value={toothDx} onChange={onToothDxChange} />
        <div className="mt-4 p-4 bg-[hsl(var(--muted))] rounded-lg">
          <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <FileText size={14} />
            <span>
              <strong>Instrucciones:</strong> Haz clic en cualquier pieza dental
              para seleccionar diagnósticos. Los cambios se reflejarán
              automáticamente en la sección de diagnóstico.
            </span>
          </p>
        </div>
      </Section>
      {/* Diagnóstico */}
      <Section title="Diagnóstico" icon={<FileText size={20} />}>
        {diagnosisFromTeeth && (
          <Alert variant="info" className="mb-3">
            <div className="flex items-start gap-2">
              <Calendar size={16} className="mt-0.5" />
              <div className="text-sm">
                <strong>Diagnóstico automático del odontograma:</strong>
                <p className="mt-1 whitespace-pre-line">{diagnosisFromTeeth}</p>
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
          <strong>💡 Nota:</strong> Al guardar, se combinarán las selecciones
          del odontograma con tus notas manuales en el campo{" "}
          <em>diagnóstico</em> de la visita.
        </div>
      </Section>
      {/* Evolución y procedimientos */}
      <Section title="Evolución y Procedimientos" icon={<Activity size={20} />}>
        <SessionsTable
          sessions={sessions}
          onSessionsChange={setSessions}
          procedureTemplates={procedureTemplates}
          onUpdateTemplates={updateProcedureTemplates}
          signers={signers}
          onSignersChange={reloadSigners}
        />
      </Section>
      {/* Adjuntos */}
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

      {/* Botonera final */}
      <div className="flex justify-end gap-3 mt-8 p-6 bg-[hsl(var(--muted))] rounded-lg">
        <Button onClick={handleNew} variant="ghost" size="lg">
          <Plus size={18} />
          Nueva Historia
        </Button>
        <Button onClick={handlePreview} variant="secondary" size="lg">
          <FileDown size={18} />
          Vista previa/Imprimir
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          size="lg"
          disabled={!canSave}
          title="Guardar"
        >
          <Save size={18} />
          Guardar Historia
        </Button>
      </div>
    </Layout>
  );
}
