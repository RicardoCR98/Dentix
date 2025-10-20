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
  ArrowLeft,
  Info,
} from "lucide-react";

import type {
  AttachmentFile,
  Patient,
  Visit,
  ToothDx,
  SessionRow,
} from "./lib/types";
import ThemePanel from "./components/ThemePanel";
import { getRepository } from "./lib/storage/TauriSqliteRepository";
import {
  saveAttachmentFile,
  resolveAttachmentPath,
  openWithOS,
  revealInOS,
} from "./lib/files/attachments";

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

  // adjuntos de la visita histórica (solo lectura, con ruta)
  const [historicalAttachments, setHistoricalAttachments] = useState<
    {
      id: number;
      filename: string;
      storage_key: string;
      mime_type: string;
      bytes: number;
      created_at: string;
      absPath: string;
    }[]
  >([]);

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

  // —— Modo (timeline vs visita) para sesiones —— //
  const [sessionsViewMode, setSessionsViewMode] = useState<
    "timeline" | "visit"
  >("timeline");
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  // —— Modo histórico (solo lectura total) —— //
  const [historicalMode, setHistoricalMode] = useState(false);
  const [historicalVisitId, setHistoricalVisitId] = useState<number | null>(
    null
  );

  // ---------- Diagnóstico generado desde el odontograma ----------
  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(toothDx)
      .sort((a, b) => +a - +b)
      .map((n) =>
        toothDx[n]?.length ? `Diente ${n}: ${toothDx[n].join(", ")}` : ""
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
    setHistoricalAttachments([]);
    setShowSaveAlert(false);

    setSessionsViewMode("timeline");
    setSelectedVisitId(null);
    setHistoricalMode(false);
    setHistoricalVisitId(null);
  }, []);

  const handlePreview = useCallback(() => window.print(), []);

  // ---------- Guardar ----------
  const handleSave = useCallback(async () => {
    if (historicalMode) {
      alert(
        "Estás viendo un histórico (solo lectura). Vuelve a edición para guardar cambios."
      );
      return;
    }

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
          visit.date
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

      if (sessionsViewMode === "visit" && patientId) {
        const allSess = await (
          await getRepository()
        ).getSessionsByPatient(patientId);
        setSessions(allSess);
        setSessionsViewMode("timeline");
        setSelectedVisitId(null);
      }

      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Error al guardar la historia clínica.");
    }
  }, [
    historicalMode,
    patient,
    visit,
    toothDx,
    sessions,
    fullDiagnosis,
    diagnosisFromTeeth,
    manualDiagnosis,
    attachments,
    sessionsViewMode,
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
    setHistoricalAttachments([]);
    setSessionsViewMode("timeline");
    setSelectedVisitId(null);
    setHistoricalMode(false);
    setHistoricalVisitId(null);
  }, []);

  // ---------- Ver visita desde Histórico ----------
  const viewVisitFromHistory = useCallback(
    async (visitId: number) => {
      if (!patient?.id) return;
      const repo = await getRepository();

      const v = await repo.getVisitDetail(visitId);
      const parsedTooth = v.tooth_dx_json
        ? (JSON.parse(v.tooth_dx_json) as ToothDx)
        : undefined;

      setVisit({
        id: v.id,
        patient_id: v.patient_id,
        date: v.date,
        reasonType: (v.reason_type as Visit["reasonType"]) ?? undefined,
        reasonDetail: v.reason_detail ?? "",
        diagnosis: v.full_dx_text ?? v.diagnosis ?? "",
        toothDx: parsedTooth,
      });

      const sess = await repo.getSessionsByVisit(visitId);
      setSessions(sess);

      const atts = await repo.getAttachmentsByVisit(visitId);
      // resolver rutas absolutas
      const enriched = await Promise.all(
        atts.map(async (a) => ({
          id: a.id,
          filename: a.filename,
          storage_key: a.storage_key,
          mime_type: a.mime_type,
          bytes: a.bytes,
          created_at: a.created_at,
          absPath: await resolveAttachmentPath(a.storage_key),
        }))
      );
      setHistoricalAttachments(enriched);

      setToothDx(parsedTooth || {});
      setSessionsViewMode("visit");
      setSelectedVisitId(visitId);
      setHistoryOpen(false);

      setHistoricalMode(true);
      setHistoricalVisitId(visitId);

      setAttachments([]);
    },
    [patient?.id]
  );

  const backToTimeline = useCallback(async () => {
    if (!patient?.id) return;
    const repo = await getRepository();
    const allSess = await repo.getSessionsByPatient(patient.id);
    setSessions(allSess);
    setSessionsViewMode("timeline");
    setSelectedVisitId(null);

    setHistoricalMode(false);
    setHistoricalVisitId(null);
    setHistoricalAttachments([]);
  }, [patient?.id]);

  const copyOdontogramFromVisit = useCallback(async (visitId: number) => {
    const repo = await getRepository();
    const v = await repo.getVisitDetail(visitId);
    const parsed = v.tooth_dx_json
      ? (JSON.parse(v.tooth_dx_json) as ToothDx)
      : {};
    const today = new Date().toISOString().slice(0, 10);

    setVisit({
      date: today,
      reasonType: undefined,
      reasonDetail: "",
      diagnosis: "",
      toothDx: parsed,
    });
    setToothDx(parsed);
    setSessions([]);
    setAttachments([]);
    setHistoricalAttachments([]);

    setHistoricalMode(false);
    setHistoricalVisitId(null);

    setSessionsViewMode("timeline");
    setSelectedVisitId(null);
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
  const canSave = hasPatientData && !historicalMode;

  const readOnlyCls = historicalMode
    ? "pointer-events-none opacity-70 select-none"
    : "";

  return (
    <Layout
      clinicName='GREENAPPLEDENTAL'
      slogan='Magic in your smile'
      schedule='10:00 - 1:00 / 3:00 - 7:00'
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
      {/* Banner histórico */}
      {historicalMode && (
        <div className='mb-4'>
          <Alert
            variant='warning'
            title='Estás viendo un histórico (solo lectura)'
          >
            Estás consultando la visita #{historicalVisitId}. Puedes volver a
            edición o usar este histórico como base para una nueva visita.
            <div className='mt-3 flex gap-2'>
              <Button
                variant='secondary'
                onClick={backToTimeline}
                title='Volver a sesiones del paciente'
              >
                <ArrowLeft size={16} />
                Volver a edición
              </Button>

              {historicalVisitId && (
                <Button
                  variant='primary'
                  onClick={() => copyOdontogramFromVisit(historicalVisitId)}
                  title='Crear nueva visita para hoy usando este odontograma'
                >
                  Usar como base (odontograma)
                </Button>
              )}
            </div>
          </Alert>
        </div>
      )}
      {showSaveAlert && (
        <div className='mb-6'>
          <Alert variant='success' title='¡Guardado exitoso!'>
            La historia clínica se ha guardado correctamente.
          </Alert>
        </div>
      )}
      {/* Acciones rápidas */}
      <Section
        title='Acciones Rápidas'
        icon={
          <PopoverRoot>
            <PopoverTrigger asChild>
              <button
                type='button'
                aria-label='Ver atajos de teclado'
                className='cursor-pointer inline-flex items-center justify-center rounded-full p-1 hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]'
                title='Atajos de teclado'
              >
                <Info size={20} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side='bottom'
              align='start'
              className='w-[320px] p-3'
            >
              <ShortcutsHelp />
            </PopoverContent>
          </PopoverRoot>
        }
      >
        <div className='flex flex-wrap gap-4 justify-center'>
          <Button
            onClick={handleNew}
            variant='primary'
            size='lg'
            className='min-w-[180px] h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white'
          >
            <Plus size={22} />
            Nueva historia
          </Button>
          <Button
            onClick={handlePreview}
            variant='secondary'
            size='lg'
            className='min-w-[180px] h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white'
          >
            <FileDown size={22} />
            Vista previa/Imprimir
          </Button>
          <Button
            onClick={() => setSearchDialogOpen(true)}
            variant='secondary'
            size='lg'
            className='min-w-[180px] h-14 text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white'
          >
            <Search size={22} />
            Búsqueda de pacientes
          </Button>
          <Button
            onClick={() => setPaymentsDialogOpen(true)}
            variant='secondary'
            size='lg'
            className='min-w-[180px] h-14 text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white'
          >
            <Wallet size={22} />
            Cartera de pendientes
          </Button>
        </div>
      </Section>
      {/* Datos del paciente */}
      <Section title='Datos del Paciente' icon={<User size={20} />}>
        <div className={readOnlyCls}>
          <PatientForm value={patient} onChange={setPatient} />
        </div>
        {!hasPatientData && !historicalMode && (
          <Alert variant='warning' className='mt-4'>
            Por favor completa al menos el nombre y cédula del paciente para
            poder guardar.
          </Alert>
        )}
      </Section>
      {/* Motivo */}
      <Section title='Motivo de Consulta' icon={<Stethoscope size={20} />}>
        <div className={"grid mb-4 " + readOnlyCls}>
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
              disabled={historicalMode as unknown as boolean}
            >
              <SelectTrigger />
              <SelectContent>
                <SelectItem value='Dolor'>🦷 Dolor</SelectItem>
                <SelectItem value='Control'>✅ Control</SelectItem>
                <SelectItem value='Emergencia'>🚨 Emergencia</SelectItem>
                <SelectItem value='Estetica'>✨ Estética</SelectItem>
                <SelectItem value='Otro'>📋 Otro</SelectItem>
              </SelectContent>
            </SelectRoot>
          </div>
        </div>

        <div className={readOnlyCls}>
          <Textarea
            label='Descripción detallada'
            value={visit.reasonDetail || ""}
            onChange={(e) =>
              setVisit((v) => ({ ...v, reasonDetail: e.target.value }))
            }
            placeholder='Describe el motivo de la consulta, síntomas, duración, etc.'
            className='min-h-[100px]'
            disabled={historicalMode}
          />
        </div>
      </Section>
      {/* Odontograma */}
      <Section title='Odontograma por Cuadrantes' icon={<Activity size={20} />}>
        <div className={readOnlyCls}>
          <Odontogram value={toothDx} onChange={onToothDxChange} />
        </div>
        <div className='mt-4 p-4 bg-[hsl(var(--muted))] rounded-lg'>
          <p className='text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2'>
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
      <Section title='Diagnóstico' icon={<FileText size={20} />}>
        {diagnosisFromTeeth && (
          <Alert variant='info' className='mb-3'>
            <div className='flex items-start gap-2'>
              <Calendar size={16} className='mt-0.5' />
              <div className='text-sm'>
                <strong>Diagnóstico automático del odontograma:</strong>
                <p className='mt-1 whitespace-pre-line'>{diagnosisFromTeeth}</p>
              </div>
            </div>
          </Alert>
        )}

        <div className={readOnlyCls}>
          <DiagnosisArea
            value={manualDiagnosis}
            onChange={setManualDiagnosis}
            autoGenerated={Boolean(diagnosisFromTeeth)}
          />
        </div>

        <div className='mt-3 p-3 bg-[hsl(var(--muted))] rounded text-sm text-[hsl(var(--muted-foreground))]'>
          <strong>💡 Nota:</strong> Al guardar, se combinarán las selecciones
          del odontograma con tus notas manuales en el campo{" "}
          <em>diagnóstico</em> de la visita.
        </div>
      </Section>
      {/* Evolución y procedimientos */}
      <Section title='Evolución y Procedimientos' icon={<Activity size={20} />}>
        <div className='flex items-center justify-between mb-3'>
          <div className='text-sm text-[hsl(var(--muted-foreground))]'>
            {sessionsViewMode === "timeline" ? (
              <span>
                Mostrando: <b>todas</b> las sesiones del paciente
              </span>
            ) : (
              <span>
                Mostrando: sesiones de la <b>visita #{selectedVisitId}</b>
              </span>
            )}
          </div>

          <div className='flex gap-2'>
            {sessionsViewMode === "visit" && (
              <Button variant='secondary' size='sm' onClick={backToTimeline}>
                <ArrowLeft size={14} />
                Volver a sesiones (todas)
              </Button>
            )}
          </div>
        </div>

        <div className={readOnlyCls}>
          <SessionsTable
            sessions={sessions}
            onSessionsChange={historicalMode ? () => {} : setSessions}
            onOpenSession={(id) => {
              // si quieres marcarla visualmente como activa (controlado),
              // guarda el id en un estado y pásalo a activeId
              // setActiveSessionId(id);
            }}
            onViewReadOnly={async (_sessionId, visitId) => {
              if (!visitId) {
                alert("No encuentro la visita a la que pertenece esta sesión.");
                return;
              }
              // Usa tu lógica existente para cargar visita en solo lectura:
              await viewVisitFromHistory(visitId);
            }}
            // activeId={activeSessionId} // <- si decides controlar desde arriba
          />
        </div>
      </Section>
      {/* Adjuntos */}
      <Section
        title='Adjuntos (Radiografías, Fotos, Documentos)'
        icon={<Paperclip size={20} />}
      >
        {historicalMode ? (
          <>
            {historicalAttachments.length === 0 ? (
              <Alert variant='info'>
                Esta visita histórica no tiene adjuntos.
              </Alert>
            ) : (
              <div className='space-y-2'>
                <div className='text-sm text-[hsl(var(--muted-foreground))]'>
                  Adjuntos guardados en esta visita (solo lectura):
                </div>
                <ul className='divide-y'>
                  {historicalAttachments.map((a) => (
                    <li
                      key={a.id}
                      className='py-2 flex items-center justify-between gap-3'
                    >
                      <div className='min-w-0'>
                        <div className='font-medium text-sm truncate'>
                          {a.filename}
                        </div>
                        <div className='text-xs text-[hsl(var(--muted-foreground))]'>
                          {Math.round(a.bytes / 1024)} KB •{" "}
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                        <div className='text-[11px] mt-1 truncate'>
                          <span className='opacity-70'>Ruta:</span> {a.absPath}
                        </div>
                      </div>
                      <div className='flex gap-2 shrink-0'>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => openWithOS(a.absPath)}
                        >
                          Abrir ubicación
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => revealInOS(a.absPath)}
                        >
                          Mostrar carpeta
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Alert variant='warning' className='mt-3'>
              Estás en modo histórico: no puedes adjuntar ni eliminar archivos.
            </Alert>
          </>
        ) : (
          <Attachments files={attachments} onFilesChange={setAttachments} />
        )}
      </Section>
      
      {/* Botonera final */}
      <div className='flex justify-end gap-3 mt-8 p-6 bg-[hsl(var(--muted))] rounded-lg'>
        <Button onClick={handleNew} variant='ghost' size='lg'>
          <Plus size={18} />
          Nueva Historia
        </Button>
        <Button onClick={handlePreview} variant='secondary' size='lg'>
          <FileDown size={18} />
          Vista previa/Imprimir
        </Button>
        <Button
          onClick={handleSave}
          variant='primary'
          size='lg'
          disabled={!canSave}
          title={historicalMode ? "No disponible en modo histórico" : "Guardar"}
        >
          <Save size={18} />
          Guardar Historia
        </Button>
      </div>
    </Layout>
  );
}
