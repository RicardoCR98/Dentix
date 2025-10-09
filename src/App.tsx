import { useCallback, useMemo, useState } from "react";
import Layout from "./components/Layout";
import Section from "./components/Section";
import PatientForm from "./components/PatientForm";
import DiagnosisArea from "./components/DiagnosisArea";
import Odontogram from "./components/Odontogram";
import SessionsTable from "./components/SessionsTable";
import Attachments from "./components/Attachments";
import ThemePanel from "./components/ThemePanel";
import { DateField } from "./components/ui/DateField";
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
  Eye, 
  FileText, 
  User, 
  Stethoscope,
  Calendar,
  Paperclip,
  Activity
} from "lucide-react";
import type { Patient, Visit, ToothDx } from "./lib/types";

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
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const diagnosisFromTeeth = useMemo(() => {
    const lines = Object.keys(toothDx)
      .sort((a, b) => +a - +b)
      .map((n) =>
        toothDx[n]?.length ? `Diente ${n}: ${toothDx[n].join(", ")}` : ""
      )
      .filter(Boolean);
    return lines.join("\n");
  }, [toothDx]);

  const onToothDxChange = useCallback(
    (next: ToothDx) => {
      setToothDx(next);
      setVisit((v) => ({
        ...v,
        toothDx: next,
        diagnosis: diagnosisFromTeeth || v.diagnosis,
      }));
    },
    [diagnosisFromTeeth]
  );

  const handleNew = useCallback(() => {
    if (
      !confirm("¿Crear una nueva historia? Se perderán cambios no guardados.")
    )
      return;
    setPatient(initialPatient);
    setVisit({ ...initialVisit, date: new Date().toISOString().slice(0, 10) });
    setToothDx({});
    setShowSaveAlert(false);
  }, []);

  const handleSave = useCallback(() => {
    console.log("Guardado (placeholder):", { patient, visit, toothDx });
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  }, [patient, visit, toothDx]);

  const handlePreview = useCallback(() => {
    window.print();
  }, []);

  // Validación básica del formulario
  const hasPatientData = patient.full_name && patient.doc_id;
  const canSave = hasPatientData;

  return (
    <Layout
      clinicName="GREENAPPLEDENTAL"
      slogan="Magic in your smile"
      schedule="10:00 - 1:00 / 3:00 - 7:00"
    >
      <ThemePanel />

      {/* Alert de guardado exitoso */}
      {showSaveAlert && (
        <div className="mb-6">
          <Alert variant="success" title="¡Guardado exitoso!">
            La historia clínica se ha guardado correctamente.
          </Alert>
        </div>
      )}

      {/* Barra de acciones */}
      <Section
        title="Acciones Rápidas"
        right={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleNew}
              variant="primary"
              size="md"
            >
              <Plus size={16} />
              Nueva historia
            </Button>
            <Button
              onClick={handleSave}
              variant="secondary"
              size="md"
              disabled={!canSave}
            >
              <Save size={16} />
              Guardar
            </Button>
            <Button
              onClick={handlePreview}
              variant="ghost"
              size="md"
            >
              <Eye size={16} />
              Vista previa
            </Button>
          </div>
        }
      >
        <Alert variant="info">
          <div className="flex items-start gap-2">
            <FileText size={16} className="mt-0.5" />
            <div>
              <p className="font-medium mb-1">Sistema de historias clínicas</p>
              <p className="text-sm">
                Completa los datos del paciente y guarda la información. 
                Próximamente se conectará con SQLite para almacenamiento persistente.
              </p>
            </div>
          </div>
        </Alert>
      </Section>

      {/* Datos del paciente */}
      <Section 
        title="Datos del Paciente"
        icon={<User size={20} />}
      >
        <PatientForm value={patient} onChange={setPatient} />
        
        {!hasPatientData && (
          <Alert variant="warning" className="mt-4">
            Por favor completa al menos el nombre y cédula del paciente para poder guardar.
          </Alert>
        )}
      </Section>

      {/* Motivo de consulta */}
      <Section 
        title="Motivo de Consulta"
        icon={<Stethoscope size={20} />}
      >
        <div className="grid md:grid-cols-2 gap-4 mb-4">
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

          <div>
            <Label required>Fecha de consulta</Label>
            <DateField
              value={visit.date || new Date().toISOString().slice(0, 10)}
              onChange={(e) =>
                setVisit((v) => ({ ...v, date: e.target.value }))
              }
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
      <Section 
        title="Odontograma por Cuadrantes"
        icon={<Activity size={20} />}
      >
        <Odontogram value={toothDx} onChange={onToothDxChange} />
        
        <div className="mt-4 p-4 bg-[hsl(var(--muted))] rounded-lg">
          <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <FileText size={14} />
            <span>
              <strong>Instrucciones:</strong> Haz clic en cualquier pieza dental para 
              seleccionar diagnósticos. Los cambios se reflejarán automáticamente en 
              la sección de diagnóstico.
            </span>
          </p>
        </div>
      </Section>

            {/* Diagnóstico */}
      <Section 
        title="Diagnóstico"
        icon={<FileText size={20} />}
      >
        <DiagnosisArea
          value={visit.diagnosis || diagnosisFromTeeth}
          onChange={(t) => setVisit((v) => ({ ...v, diagnosis: t }))}
        />
        
        {diagnosisFromTeeth && (
          <Alert variant="info" className="mt-3">
            <div className="flex items-start gap-2">
              <Calendar size={16} className="mt-0.5" />
              <div className="text-sm">
                <strong>Diagnóstico automático del odontograma:</strong>
                <p className="mt-1 whitespace-pre-line">{diagnosisFromTeeth}</p>
              </div>
            </div>
          </Alert>
        )}
      </Section>

      {/* Evolución y procedimientos */}
      <Section 
        title="Evolución y Procedimientos"
        icon={<Activity size={20} />}
      >
        <SessionsTable />
      </Section>

      {/* Adjuntos */}
      <Section 
        title="Adjuntos (Radiografías, Fotos, Documentos)"
        icon={<Paperclip size={20} />}
      >
        <Attachments />
      </Section>

      {/* Botones de acción al final */}
      <div className="flex justify-end gap-3 mt-8 p-6 bg-[hsl(var(--muted))] rounded-lg">
        <Button
          onClick={handleNew}
          variant="ghost"
          size="lg"
        >
          <Plus size={18} />
          Nueva Historia
        </Button>
        <Button
          onClick={handlePreview}
          variant="secondary"
          size="lg"
        >
          <Eye size={18} />
          Vista Previa
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          size="lg"
          disabled={!canSave}
        >
          <Save size={18} />
          Guardar Historia
        </Button>
      </div>
    </Layout>
  );
}