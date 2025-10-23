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
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "./components/ui/Select";
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
} from "lucide-react";

import type {
  AttachmentFile,
  Patient,
  Visit,
  ToothDx,
  SessionRow,
  ProcedureTemplate,
} from "./lib/types";
import ThemePanel from "./components/ThemePanel";
import { getRepository } from "./lib/storage/TauriSqliteRepository";
import { saveAttachmentFile } from "./lib/files/attachments";

// -------- Estados iniciales --------
const initialPatient: Patient = {
  full_name: "",
  doc_id: "",
  phone: "",
  age: undefined,
};

const initialVisit: Visit = {
  date: new Date().toISOString().slice(0, 10),
  reasonType: "Dolor",
  reasonDetail: "",
  diagnosis: "",
};

export default function App() {
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

  // diálogos / datos auxiliares
  const [showSaveAlert, setShowSaveAlert] = useState(false);
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
      alert("Completa al menos nombre y cédula del paciente para guardar.");
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

      const { patientId, visitId } = await repo.saveVisitWithSessions({
        patient,
        visit: visitPayload,
        sessions,
      });

      for (const a of attachments) {
        const { storage_key, bytes } = await saveAttachmentFile(
          a.file!,
          patientId,
          visit.date,
        );
        await repo.createAttachment({
          patient_id: patientId,
          visit_id: visitId,
          filename: a.name,
          mime_type: a.type || "application/octet-stream",
          bytes,
          storage_key,
        });
      }
      setAttachments([]);

      setPatient((prev) => ({ ...prev, id: patientId }));
      setVisit((prev) => ({ ...prev, id: visitId, patient_id: patientId }));

      // Recargar todas las sesiones del paciente para actualizar
      if (patientId) {
        const allSess = await (
          await getRepository()
        ).getSessionsByPatient(patientId);
        setSessions(allSess);
      }

      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Error al guardar la historia clínica.");
    }
  }, [
    patient,
    visit,
    toothDx,
    sessions,
    fullDiagnosis,
    diagnosisFromTeeth,
    manualDiagnosis,
    attachments,
  ]);

  // ---------- Seleccionar paciente ----------
  const handleSelectPatient = useCallback(async (selectedPatient: Patient) => {
    if (!selectedPatient?.id) return;
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

    const allSess = await repo.getSessionsByPatient(p.id!);
    setSessions(allSess);

    setAttachments([]);
  }, []);

  // ---------- Diálogos ----------
  useEffect(() => {
    if (!searchDialogOpen) return;
    (async () => {
      const repo = await getRepository();
      const all = await repo.searchPatients("");
      setPatientsForDialogs(all);
    })();
  }, [searchDialogOpen]);

  useEffect(() => {
    if (!paymentsDialogOpen) return;
    (async () => {
      const repo = await getRepository();
      const all = await repo.searchPatients("");
      setPatientsForDialogs(all);

      const map: Record<number, SessionRow[]> = {};
      for (const p of all) {
        if (!p.id) continue;
        const vlist = await repo.getVisitsByPatient(p.id);
        const allSessions: SessionRow[] = [];
        for (const v of vlist) {
          const sess = await repo.getSessionsByVisit(v.id);
          allSessions.push(...sess);
        }
        map[p.id] = allSessions;
      }
      setPatientSessionsMap(map);
    })();
  }, [paymentsDialogOpen]);

  // ---------- Inicializar y cargar datos ----------
  useEffect(() => {
    (async () => {
      try {
        // Primero obtener el repositorio (esto inicializa la DB)
        const repo = await getRepository();

        // Luego cargar todos los datos necesarios
        const [templates, signersList] = await Promise.all([
          repo.getProcedureTemplates(),
          repo.getSigners(),
        ]);

        setProcedureTemplates(templates);
        setSigners(signersList);
      } catch (error) {
        console.error("Error inicializando datos:", error);
        setProcedureTemplates([]);
        setSigners([]);
      }
    })();
  }, []);

  // Función para actualizar plantilla global
  const updateProcedureTemplates = useCallback(
    async (items: Array<{ name: string; unit: number }>) => {
      // Filtrar solo items con nombre (ignorar vacíos)
      const validItems = items.filter((it) => it.name.trim().length > 0);

      const templates = validItems.map((it) => ({
        name: it.name.trim(),
        default_price: it.unit,
      }));

      const repo = await getRepository();
      await repo.saveProcedureTemplates(templates);

      // Recargar desde BD
      const saved = await repo.getProcedureTemplates();
      setProcedureTemplates(saved);
    },
    [],
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
      {showSaveAlert && (
        <div className="mb-6">
          <Alert variant="success" title="¡Guardado exitoso!">
            La historia clínica se ha guardado correctamente.
          </Alert>
        </div>
      )}
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
      <Section title="Datos del Paciente" icon={<User size={20} />}>
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
            <SelectRoot
              value={visit.reasonType || "Dolor"}
              onValueChange={(v) =>
                setVisit((vv) => ({
                  ...vv,
                  reasonType: v as Visit["reasonType"],
                }))
              }
            >
              <SelectTrigger />
              <SelectContent>
                <SelectItem value="Dolor">🦷 Dolor</SelectItem>
                <SelectItem value="Control">✅ Control</SelectItem>
                <SelectItem value="Emergencia">🚨 Emergencia</SelectItem>
                <SelectItem value="Estetica">✨ Estética</SelectItem>
                <SelectItem value="Otro">📋 Otro</SelectItem>
              </SelectContent>
            </SelectRoot>
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
        <Attachments files={attachments} onFilesChange={setAttachments} />
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
