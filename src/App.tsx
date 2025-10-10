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
} from "lucide-react";
import type {
  Patient,
  Visit,
  ToothDx,
  SessionRow,
  PatientRecord,
} from "./lib/types";
import ThemePanel from "./components/ThemePanel";

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
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [visit, setVisit] = useState<Visit>(initialVisit);
  const [toothDx, setToothDx] = useState<ToothDx>({});
  const [manualDiagnosis, setManualDiagnosis] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  // Almacenamiento temporal de pacientes (en memoria)
  const [savedPatients, setSavedPatients] = useState<PatientRecord[]>([]);

  // Estados para los diálogos
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);

  // Diagnóstico automático desde el odontograma
  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(toothDx)
      .sort((a, b) => +a - +b)
      .map((n) =>
        toothDx[n]?.length ? `Diente ${n}: ${toothDx[n].join(", ")}` : ""
      )
      .filter(Boolean);
    return lines.join("\n");
  }, [toothDx]);

  // Componer diagnóstico final (auto + manual) para guardar/imprimir
  const fullDiagnosis = useMemo(() => {
    const parts: string[] = [];
    if (diagnosisFromTeeth) parts.push(diagnosisFromTeeth);
    if (manualDiagnosis.trim()) parts.push(manualDiagnosis.trim());
    return parts.join("\n\n");
  }, [diagnosisFromTeeth, manualDiagnosis]);

  // Odontograma: actualiza sin tocar lo manual ni diagnosis del visit
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
    setShowSaveAlert(false);
  }, []);

  const handleSave = useCallback(() => {
    const now = new Date().toISOString();

    // Buscar si el paciente ya existe (por doc_id o id)
    const existingIndex = savedPatients.findIndex(
      (p) =>
        (patient.id && p.patient.id === patient.id) ||
        (patient.doc_id && p.patient.doc_id === patient.doc_id)
    );

    const patientWithId = patient.id ? patient : { ...patient, id: Date.now() }; // Generar ID temporal si no existe

    const visitWithDiagnosis = {
      ...visit,
      diagnosis: fullDiagnosis,
      patient_id: patientWithId.id,
    };

    if (existingIndex >= 0) {
      // Actualizar paciente existente (REEMPLAZAR sesiones → evita duplicados)
      const prev = savedPatients[existingIndex];
      const updated = [...savedPatients];
      updated[existingIndex] = {
        patient: patientWithId,
        visits: [...prev.visits, visitWithDiagnosis],
        sessions: sessions, // ← reemplazar en lugar de concatenar
        createdAt: prev.createdAt,
        updatedAt: now,
      };
      setSavedPatients(updated);
    } else {
      // Agregar nuevo paciente
      const newRecord: PatientRecord = {
        patient: patientWithId,
        visits: [visitWithDiagnosis],
        sessions: sessions,
        createdAt: now,
        updatedAt: now,
      };
      setSavedPatients([...savedPatients, newRecord]);
    }

    setPatient(patientWithId);
    console.log("Guardado (placeholder).");
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  }, [patient, visit, fullDiagnosis, sessions, savedPatients]);

  const handlePreview = useCallback(() => {
    window.print();
  }, []);

  // Cargar paciente desde búsqueda (mantener sesiones guardadas tal cual)
  const handleSelectPatient = useCallback(
    (selectedPatient: Patient) => {
      const record = savedPatients.find(
        (p) => p.patient.id === selectedPatient.id
      );

      if (record) {
        setPatient(record.patient);
        setSessions(record.sessions || []); // ← usar lo guardado, sin factories

        // Iniciar visita nueva (motivo en blanco), pero puedes cargar el último odontograma como referencia
        if (record.visits && record.visits.length > 0) {
          const lastVisit = record.visits[record.visits.length - 1];
          setVisit({
            ...initialVisit,
            date: new Date().toISOString().slice(0, 10),
          });
          if (lastVisit.toothDx) {
            setToothDx(lastVisit.toothDx);
          } else {
            setToothDx({});
          }
        } else {
          setVisit({ ...initialVisit, date: new Date().toISOString().slice(0, 10) });
          setToothDx({});
        }
      } else {
        setPatient(selectedPatient);
        setSessions([]);
        setVisit({ ...initialVisit, date: new Date().toISOString().slice(0, 10) });
        setToothDx({});
      }
    },
    [savedPatients]
  );

  // Preparar datos para el diálogo de pagos pendientes
  const patientSessionsMap = useMemo(() => {
    const map: Record<number, SessionRow[]> = {};
    savedPatients.forEach((record) => {
      if (record.patient.id) {
        map[record.patient.id] = record.sessions || [];
      }
    });
    return map;
  }, [savedPatients]);

  // Validación básica
  const hasPatientData = Boolean(patient.full_name && patient.doc_id);
  const canSave = hasPatientData;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePreview();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, handlePreview, handleNew]);

  return (
    <Layout
      clinicName='GREENAPPLEDENTAL'
      slogan='Magic in your smile'
      schedule='10:00 - 1:00 / 3:00 - 7:00'
      headerRight={<ThemePanel inlineTrigger label='Configuración' />}
    >
      {/* Diálogos */}
      <PatientSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        patients={savedPatients.map((r) => r.patient)}
        onSelectPatient={handleSelectPatient}
      />

      <PendingPaymentsDialog
        open={paymentsDialogOpen}
        onOpenChange={setPaymentsDialogOpen}
        patients={savedPatients.map((r) => r.patient)}
        patientSessions={patientSessionsMap}
        onSelectPatient={handleSelectPatient}
      />

      {showSaveAlert && (
        <div className='mb-6'>
          <Alert variant='success' title='¡Guardado exitoso!'>
            La historia clínica se ha guardado correctamente.
          </Alert>
        </div>
      )}

      <Section
        title='Acciones Rápidas'
        right={
          <div className='flex flex-wrap gap-2'>
            <Button onClick={handleNew} variant='primary' size='md'>
              <Plus size={16} />
              Nueva historia
            </Button>
            <Button
              onClick={handleSave}
              variant='secondary'
              size='md'
              disabled={!canSave}
            >
              <Save size={16} />
              Guardar
            </Button>
            <Button onClick={handlePreview} variant='ghost' size='md'>
              <FileDown size={16} />
              Imprimir
            </Button>
            <Button
              onClick={() => setSearchDialogOpen(true)}
              variant='secondary'
              size='md'
            >
              <Search size={16} />
              Buscar paciente
            </Button>
            <Button
              onClick={() => setPaymentsDialogOpen(true)}
              variant='secondary'
              size='md'
            >
              <Wallet size={16} />
              Cartera pendiente
            </Button>
          </div>
        }
      >
        <Alert variant='info'>
          <div className='flex items-start gap-2'>
            <FileText size={16} className='mt-0.5' />
            <div>
              <p className='font-medium mb-1'>Atajos útiles</p>
              <ol>
                <li>
                  Usa{" "}
                  <b>
                    <kbd className='px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs'>
                      Ctrl+S
                    </kbd>{" "}
                  </b>
                  para guardar la historia.
                </li>
                <li>
                  Usa{" "}
                  <b>
                    <kbd className='px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs'>
                      Ctrl+P
                    </kbd>{" "}
                  </b>
                  para vista previa/imprimir.
                </li>
                <li>
                  Usa{" "}
                  <b>
                    <kbd className='px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs'>
                      Ctrl+K
                    </kbd>{" "}
                  </b>
                  para buscar pacientes.{" "}
                  {savedPatients.length > 0 && (
                    <span className='ml-2 text-[hsl(var(--brand))] font-medium'>
                      {savedPatients.length} paciente
                      {savedPatients.length !== 1 ? "s" : ""} guardado
                      {savedPatients.length !== 1 ? "s" : ""}.
                    </span>
                  )}
                </li>
                <li>
                  Usa{" "}
                  <b>
                    <kbd className='px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-xs'>
                      Ctrl+N
                    </kbd>{" "}
                  </b>
                  para nueva historia clínica.
                </li>
              </ol>
            </div>
          </div>
        </Alert>
      </Section>

      {/* Datos del paciente */}
      <Section title='Datos del Paciente' icon={<User size={20} />}>
        <PatientForm value={patient} onChange={setPatient} />
        {!hasPatientData && (
          <Alert variant='warning' className='mt-4'>
            Por favor completa al menos el nombre y cédula del paciente para
            poder guardar.
          </Alert>
        )}
      </Section>

      {/* Motivo de consulta */}
      <Section title='Motivo de Consulta' icon={<Stethoscope size={20} />}>
        <div className='grid mb-4'>
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
                <SelectItem value='Dolor'>🦷 Dolor</SelectItem>
                <SelectItem value='Control'>✅ Control</SelectItem>
                <SelectItem value='Emergencia'>🚨 Emergencia</SelectItem>
                <SelectItem value='Estetica'>✨ Estética</SelectItem>
                <SelectItem value='Otro'>📋 Otro</SelectItem>
              </SelectContent>
            </SelectRoot>
          </div>
        </div>

        <Textarea
          label='Descripción detallada'
          value={visit.reasonDetail || ""}
          onChange={(e) =>
            setVisit((v) => ({ ...v, reasonDetail: e.target.value }))
          }
          placeholder='Describe el motivo de la consulta, síntomas, duración, etc.'
          className='min-h-[100px]'
        />
      </Section>

      {/* Odontograma */}
      <Section title='Odontograma por Cuadrantes' icon={<Activity size={20} />}>
        <Odontogram value={toothDx} onChange={onToothDxChange} />
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

        <DiagnosisArea
          value={manualDiagnosis}
          onChange={setManualDiagnosis}
          autoGenerated={Boolean(diagnosisFromTeeth)}
        />

        <div className='mt-3 p-3 bg-[hsl(var(--muted))] rounded text-sm text-[hsl(var(--muted-foreground))]'>
          <strong>💡 Nota:</strong> Al guardar, se combinarán las selecciones
          del odontograma con tus notas manuales en el campo{" "}
          <em>diagnóstico</em> de la visita.
        </div>
      </Section>

      {/* Evolución y procedimientos */}
      <Section title='Evolución y Procedimientos' icon={<Activity size={20} />}>
        <SessionsTable sessions={sessions} onSessionsChange={setSessions} />
      </Section>

      {/* Adjuntos */}
      <Section
        title='Adjuntos (Radiografías, Fotos, Documentos)'
        icon={<Paperclip size={20} />}
      >
        <Attachments />
      </Section>

      {/* Botones de acción al final */}
      <div className='flex justify-end gap-3 mt-8 p-6 bg-[hsl(var(--muted))] rounded-lg'>
        <Button onClick={handleNew} variant='ghost' size='lg'>
          <Plus size={18} />
          Nueva Historia
        </Button>
        <Button onClick={handlePreview} variant='secondary' size='lg'>
          <FileDown size={18} />
          Imprimir
        </Button>
        <Button
          onClick={handleSave}
          variant='primary'
          size='lg'
          disabled={!canSave}
        >
          <Save size={18} />
          Guardar Historia
        </Button>
      </div>
    </Layout>
  );
}
