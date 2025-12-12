# Plan de Implementación: Visit Snapshot y Mejoras de Historial

**Fecha de creación:** 2024-12-04
**Estado:** Planificación completada ✅
**Prioridad:** Alta

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Problema Identificado](#problema-identificado)
3. [Solución Propuesta](#solución-propuesta)
4. [Arquitectura y Componentes](#arquitectura-y-componentes)
5. [Ruta de Desarrollo Detallada](#ruta-de-desarrollo-detallada)
6. [Especificaciones Técnicas](#especificaciones-técnicas)
7. [Casos de Uso](#casos-de-uso)
8. [Consideraciones de UX](#consideraciones-de-ux)

---

## 🎯 Resumen Ejecutivo

### Objetivo Principal
Implementar un sistema completo de **visualización de historial médico** que permita al odontólogo:
- Ver snapshots (fotografías congeladas en el tiempo) de visitas anteriores
- Reutilizar información de consultas previas cuando sea apropiado
- Mantener un historial claro y profesional sin saturar la interfaz principal

### Componentes a Desarrollar
1. **Botones "Cargar último"** en Motivo y Diagnóstico
2. **VisitSnapshot Component** - Vista completa de una visita histórica
3. **Mejoras en SessionCard** - Integración del botón "ojo" con snapshot

### Tiempo Estimado Total
**4-5 horas de desarrollo**

---

## 🔍 Problema Identificado

### Situación Actual
Cuando se carga un paciente en el sistema:
- ✅ El odontograma se precarga del último snapshot (útil)
- ✅ Las sesiones históricas se muestran en el SessionsTable
- ❌ No hay forma de ver el contexto completo de una visita anterior
- ❌ El motivo y diagnóstico siempre están vacíos (hay que escribir desde cero)

### Necesidades del Odontólogo
1. **Ver historial completo:** Revisar qué se diagnosticó, qué procedimientos se hicieron, y qué motivo tenía el paciente en consultas anteriores
2. **Reutilizar información:** En casos de seguimiento, no tener que reescribir el mismo motivo/diagnóstico
3. **Imprimir snapshots:** Generar reportes de visitas específicas para el paciente o para auditoría
4. **Contexto financiero:** Ver el estado de pagos hasta una fecha específica

---

## 💡 Solución Propuesta

### 1. Botones "Cargar Último" (Funcionalidad de Reutilización)

#### Ubicación
- **Motivo de Consulta:** Botón al lado del campo de tipo
- **Diagnóstico:** Botón en el header de la sección

#### Comportamiento
```
ESTADO INICIAL (paciente cargado)
├─ Motivo: [VACÍO]
├─ Diagnóstico: [VACÍO]
└─ Muestra preview del último registro debajo de cada campo

DESPUÉS DE CLIC EN "CARGAR ÚLTIMO"
├─ Motivo: [Se llena con reason_type + reason_detail del último snapshot]
├─ Diagnóstico: [Se llena con diagnosis_text del último snapshot]
└─ El odontólogo puede editar libremente
```

#### Casos de Uso
- ✅ **Seguimiento:** Paciente vuelve por el mismo problema → Un clic carga todo
- ✅ **Consulta nueva:** Paciente viene por algo diferente → Campos vacíos, escribe nuevo
- ✅ **Consulta mixta:** Carga el anterior y modifica lo necesario

---

### 2. VisitSnapshot Component (Vista Histórica Completa)

#### Características Principales

**Vista Completa en la Misma Hoja (NO modal)**
- Reemplaza temporalmente el formulario principal
- Muestra toda la información de UNA visita específica
- Solo lectura (snapshot congelado en el tiempo)
- Botón grande y visible para regresar al estado actual

#### Información Mostrada

##### A) Datos del Paciente
```typescript
- Nombre completo
- Cédula
- Edad / Fecha de nacimiento
- Alergias (destacadas si existen)
- Teléfonos de contacto
```

##### B) Motivo de Consulta
```typescript
- Tipo (Dolor, Control, Emergencia, etc.)
- Detalle completo
- Fecha de la visita
```

##### C) Odontograma
```typescript
- Estado dental en ESA fecha específica
- Visualización del odontograma permanente/deciduo
- Solo lectura (no editable)
```

##### D) Diagnóstico
```typescript
- Diagnóstico automático del odontograma
- Diagnóstico manual del odontólogo
- Texto completo sin truncar
```

##### E) Procedimientos Realizados
```typescript
- Solo las sesiones HASTA esa fecha
- Ejemplo: Si estoy viendo snapshot del 2024-06-15
  └─ Mostrar sesiones: 2024-01-10, 2024-03-20, 2024-06-15
  └─ NO mostrar sesiones posteriores (2024-08-01, 2024-10-12)

- Para cada sesión:
  ├─ Fecha
  ├─ Procedimientos (nombre, cantidad, precio)
  ├─ Presupuesto
  ├─ Descuento
  ├─ Abono
  └─ Saldo
```

##### F) Información Financiera Acumulada
```typescript
- Total presupuestado hasta esa fecha
- Total abonado hasta esa fecha
- Saldo total hasta esa fecha
```

##### G) Adjuntos
```typescript
- Solo archivos adjuntados HASTA esa visita
- Filtrado por fecha: attachment.created_at <= visit.date
- Visualización:
  ├─ Imágenes: Thumbnail + click para ampliar
  ├─ PDFs: Icono + nombre + opción de abrir
  └─ Otros: Icono genérico + descargar
```

##### H) Acciones
```typescript
- [🖨️ IMPRIMIR ESTE SNAPSHOT] → Imprime exactamente lo que se ve
- [◀ REGRESAR AL ESTADO ACTUAL] → Vuelve al formulario principal (botón flotante grande)
```

#### Comportamiento de Botones Deshabilitados

Cuando está en modo VisitSnapshot:
```typescript
// Header buttons
- [Búsqueda de pacientes]  → DESHABILITADO (opacidad 50%, cursor not-allowed)
- [Cartera de pendientes]  → DESHABILITADO
- [Nueva historia]         → DESHABILITADO

// Solo disponibles
- [◀ REGRESAR]            → HABILITADO (destacado)
- [🖨️ IMPRIMIR]           → HABILITADO
- [Panel de temas]        → HABILITADO (permite cambiar tema incluso en snapshot)
```

---

## 🏗️ Arquitectura y Componentes

### Estructura de Archivos

```
src/
├── components/
│   ├── VisitSnapshot.tsx          (NUEVO - Componente principal del snapshot)
│   ├── SnapshotHeader.tsx         (NUEVO - Header con botón regresar)
│   ├── SnapshotOdontogram.tsx     (NUEVO - Odontograma en solo lectura)
│   ├── SnapshotSessions.tsx       (NUEVO - Sesiones hasta esa fecha)
│   ├── SnapshotAttachments.tsx    (NUEVO - Adjuntos filtrados)
│   │
│   ├── sessions/
│   │   ├── SessionsTable.tsx      (EXISTENTE - Modificar onViewReadOnly)
│   │   └── SessionCard.tsx        (EXISTENTE - Botón ojo solo en guardadas)
│   │
│   └── ui/
│       └── FloatingActionButton.tsx (NUEVO - Botón regresar flotante)
│
├── App.tsx                         (MODIFICAR - Estado de snapshot mode)
└── lib/
    └── snapshot-utils.ts           (NUEVO - Utilidades para filtrar datos por fecha)
```

### Estado en App.tsx

```typescript
// Estado nuevo para snapshot mode
const [snapshotMode, setSnapshotMode] = useState(false);
const [snapshotVisitId, setSnapshotVisitId] = useState<number | null>(null);

// Estado existente para cargar último
const [lastVisit, setLastVisit] = useState<Visit | null>(null);

// Funciones nuevas
const handleLoadPreviousReason = useCallback(() => { ... });
const handleLoadPreviousDiagnosis = useCallback(() => { ... });
const handleViewSnapshot = useCallback((visitId: number) => {
  setSnapshotVisitId(visitId);
  setSnapshotMode(true);
});
const handleExitSnapshot = useCallback(() => {
  setSnapshotMode(false);
  setSnapshotVisitId(null);
});
```

### Render Condicional

```typescript
export default function App() {
  // ... estado ...

  // Si estamos en modo snapshot, renderizar VisitSnapshot
  if (snapshotMode && snapshotVisitId) {
    return (
      <VisitSnapshot
        visitId={snapshotVisitId}
        patientId={patient.id!}
        onExit={handleExitSnapshot}
      />
    );
  }

  // Renderizado normal del formulario
  return (
    <Layout>
      {/* Formulario actual */}
    </Layout>
  );
}
```

---

## 🛣️ Ruta de Desarrollo Detallada

### FASE 1: Preparación y Utilidades (30 min)

#### 1.1 Crear utilidades de snapshot
**Archivo:** `src/lib/snapshot-utils.ts`

```typescript
/**
 * Filtra sesiones hasta una fecha específica
 */
export function filterSessionsUntilDate(
  sessions: VisitWithProcedures[],
  targetDate: string
): VisitWithProcedures[] {
  return sessions.filter(s => (s.visit.date ?? '') <= targetDate);
}

/**
 * Filtra adjuntos hasta una fecha específica
 */
export function filterAttachmentsUntilDate(
  attachments: AttachmentFile[],
  targetDate: string
): AttachmentFile[] {
  return attachments.filter(att => {
    const attDate = att.uploadDate || att.created_at || '';
    return attDate <= targetDate;
  });
}

/**
 * Calcula totales financieros de sesiones filtradas
 */
export function calculateFinancialTotals(
  sessions: VisitWithProcedures[]
): { totalBudget: number; totalPaid: number; totalBalance: number } {
  return sessions.reduce(
    (acc, s) => ({
      totalBudget: acc.totalBudget + (s.visit.budget || 0),
      totalPaid: acc.totalPaid + (s.visit.payment || 0),
      totalBalance: acc.totalBalance + (s.visit.balance || 0),
    }),
    { totalBudget: 0, totalPaid: 0, totalBalance: 0 }
  );
}
```

**Tiempo:** 30 min
**Pruebas:** Unit tests básicos

---

### FASE 2: Botones "Cargar Último" (1 hora)

#### 2.1 Modificar App.tsx - Estado y Funciones (20 min)

```typescript
// En handleSelectPatient, guardar lastVisit
const [lastVisit, setLastVisit] = useState<Visit | null>(null);

const handleSelectPatient = useCallback(async (selectedPatient: Patient) => {
  // ... código existente ...

  const list = await repo.getVisitsByPatient(p.id!);

  if (list.length > 0) {
    const last = list[0];
    setLastVisit(last); // ✅ NUEVO: Guardar para referencia

    // Cargar solo odontograma, NO motivo/diagnóstico
    setVisit({
      date: today,
      reason_type: undefined,
      reason_detail: "",
      diagnosis_text: "",
      tooth_dx_json: last.tooth_dx_json || "",
      // ...
    });
  } else {
    setLastVisit(null);
  }
}, []);

// Funciones para cargar anterior
const handleLoadPreviousReason = useCallback(() => {
  if (!lastVisit) return;

  setVisit(prev => ({
    ...prev,
    reason_type: lastVisit.reason_type,
    reason_detail: lastVisit.reason_detail || "",
  }));
}, [lastVisit]);

const handleLoadPreviousDiagnosis = useCallback(() => {
  if (!lastVisit) return;

  setManualDiagnosis(lastVisit.diagnosis_text || "");
}, [lastVisit]);
```

**Tiempo:** 20 min

#### 2.2 UI - Sección Motivo de Consulta (20 min)

**Ubicación en App.tsx:** Buscar la sección "Motivo de consulta"

```tsx
<Section title="Motivo de consulta" icon={<Stethoscope size={20} />}>
  <div className="space-y-3">
    {/* Tipo de motivo + Botón cargar */}
    <div className="flex items-center gap-2">
      <Label className="flex-shrink-0 w-16">Tipo</Label>
      <div className="flex-1">
        <ReasonTypeSelect
          value={visit.reason_type}
          onChange={(value) => setVisit({ ...visit, reason_type: value })}
          reasonTypes={reasonTypes}
          onReasonTypesChange={reloadReasonTypes}
        />
      </div>

      {/* Botón cargar último motivo */}
      {lastVisit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLoadPreviousReason}
          title={`Cargar motivo de la última visita (${lastVisit.date})`}
          className="shrink-0"
        >
          <FileDown size={16} />
          Cargar último
        </Button>
      )}
    </div>

    {/* Detalle del motivo */}
    <div>
      <Label>Detalle</Label>
      <Textarea
        value={visit.reason_detail || ""}
        onChange={(e) => setVisit({ ...visit, reason_detail: e.target.value })}
        placeholder="Describe el motivo de la consulta..."
        rows={2}
      />

      {/* Preview del último motivo */}
      {lastVisit?.reason_detail && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 italic">
          Último: "{lastVisit.reason_detail}" ({lastVisit.date})
        </p>
      )}
    </div>
  </div>
</Section>
```

**Imports necesarios:**
```typescript
import { FileDown } from "lucide-react";
```

**Tiempo:** 20 min

#### 2.3 UI - Sección Diagnóstico (20 min)

**Ubicación en App.tsx:** Buscar la sección "Diagnóstico"

```tsx
<Section title="Diagnóstico" icon={<FileText size={20} />}>
  <div className="space-y-2">
    {/* Header con botón cargar */}
    <div className="flex items-center justify-between">
      <Label>Diagnóstico del odontólogo</Label>

      {lastVisit?.diagnosis_text && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLoadPreviousDiagnosis}
          title={`Cargar diagnóstico de la última visita (${lastVisit.date})`}
        >
          <FileDown size={16} />
          Cargar último
        </Button>
      )}
    </div>

    {/* Área de diagnóstico */}
    <DiagnosisArea
      toothDx={toothDx}
      manualDiagnosis={manualDiagnosis}
      onManualDiagnosisChange={setManualDiagnosis}
    />

    {/* Preview del último diagnóstico */}
    {lastVisit?.diagnosis_text && (
      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1 p-2 bg-[hsl(var(--muted))] rounded">
        <span className="font-medium">Último diagnóstico:</span> "
        {lastVisit.diagnosis_text.length > 100
          ? `${lastVisit.diagnosis_text.substring(0, 100)}...`
          : lastVisit.diagnosis_text}
        " ({lastVisit.date})
      </div>
    )}
  </div>
</Section>
```

**Tiempo:** 20 min

**✅ CHECKPOINT FASE 2:** Probar que los botones cargan correctamente la información

---

### FASE 3: Componente VisitSnapshot - Estructura Base (1.5 horas)

#### 3.1 Crear SnapshotHeader Component (20 min)

**Archivo:** `src/components/SnapshotHeader.tsx`

```typescript
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface SnapshotHeaderProps {
  visitDate: string;
  patientName: string;
  onExit: () => void;
  onPrint: () => void;
}

export default function SnapshotHeader({
  visitDate,
  patientName,
  onExit,
  onPrint,
}: SnapshotHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Botón regresar */}
          <Button
            variant="primary"
            size="lg"
            onClick={onExit}
            className="gap-2"
          >
            <ArrowLeft size={20} />
            REGRESAR AL ESTADO ACTUAL
          </Button>

          {/* Título del snapshot */}
          <div className="flex items-center gap-3">
            <Badge variant="info" className="text-sm px-3 py-1">
              MODO SNAPSHOT - SOLO LECTURA
            </Badge>
            <div className="text-right">
              <h2 className="font-bold text-lg">{patientName}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Visita del {visitDate}
              </p>
            </div>
          </div>

          {/* Botón imprimir */}
          <Button
            variant="secondary"
            size="lg"
            onClick={onPrint}
            className="gap-2"
          >
            <Printer size={20} />
            IMPRIMIR SNAPSHOT
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Tiempo:** 20 min

#### 3.2 Crear VisitSnapshot Component - Estructura (40 min)

**Archivo:** `src/components/VisitSnapshot.tsx`

```typescript
import { useEffect, useState, useCallback } from "react";
import { getRepository } from "../lib/storage/TauriSqliteRepository";
import SnapshotHeader from "./SnapshotHeader";
import Section from "./Section";
import PatientForm from "./PatientForm";
import Odontogram from "./Odontogram";
import DiagnosisArea from "./DiagnosisArea";
import SplashScreen from "./SplashScreen";
import ErrorScreen from "./ErrorScreen";
import {
  filterSessionsUntilDate,
  filterAttachmentsUntilDate,
  calculateFinancialTotals,
} from "../lib/snapshot-utils";
import type {
  Patient,
  Visit,
  ToothDx,
  VisitWithProcedures,
  AttachmentFile,
} from "../lib/types";

interface VisitSnapshotProps {
  visitId: number;
  patientId: number;
  onExit: () => void;
}

export default function VisitSnapshot({
  visitId,
  patientId,
  onExit,
}: VisitSnapshotProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Datos del snapshot
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [toothDx, setToothDx] = useState<ToothDx>({});
  const [sessions, setSessions] = useState<VisitWithProcedures[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Cargar datos del snapshot
  useEffect(() => {
    async function loadSnapshot() {
      try {
        setLoading(true);
        const repo = await getRepository();

        // 1. Cargar paciente
        const p = await repo.findPatientById(patientId);
        if (!p) throw new Error("Paciente no encontrado");
        setPatient(p);

        // 2. Cargar la visita específica
        const visits = await repo.getVisitsByPatient(patientId);
        const targetVisit = visits.find((v) => v.id === visitId);
        if (!targetVisit) throw new Error("Visita no encontrada");
        setVisit(targetVisit);

        // 3. Parse odontograma
        const dx = targetVisit.tooth_dx_json
          ? JSON.parse(targetVisit.tooth_dx_json)
          : {};
        setToothDx(dx);

        // 4. Cargar TODAS las sesiones y filtrar hasta esta fecha
        const allSessions = await repo.getSessionsByPatient(patientId);
        const filteredSessions = filterSessionsUntilDate(
          allSessions,
          targetVisit.date ?? ""
        );
        setSessions(filteredSessions);

        // 5. Cargar TODOS los adjuntos y filtrar hasta esta fecha
        const allAttachments = await repo.getAttachmentsByPatient(patientId);
        const attachmentFiles: AttachmentFile[] = allAttachments.map((att) => ({
          id: `saved-${att.id}`,
          name: att.filename,
          size: att.size_bytes || 0,
          type: att.mime_type || "",
          url: "",
          uploadDate: att.created_at || "",
          storage_key: att.storage_key,
          db_id: att.id,
        }));
        const filteredAttachments = filterAttachmentsUntilDate(
          attachmentFiles,
          targetVisit.date ?? ""
        );
        setAttachments(filteredAttachments);

        setLoading(false);
      } catch (err) {
        console.error("Error loading snapshot:", err);
        setError(err as Error);
        setLoading(false);
      }
    }

    loadSnapshot();
  }, [visitId, patientId]);

  // Función para imprimir
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) return <SplashScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!patient || !visit) return <ErrorScreen error={new Error("Datos incompletos")} />;

  const financialTotals = calculateFinancialTotals(sessions);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header sticky */}
      <SnapshotHeader
        visitDate={visit.date ?? ""}
        patientName={patient.full_name}
        onExit={onExit}
        onPrint={handlePrint}
      />

      {/* Contenido del snapshot */}
      <div className="container mx-auto px-4 py-6 space-y-6 print:p-0">
        {/* Datos del paciente */}
        <Section title="Datos del Paciente">
          <PatientForm
            patient={patient}
            onPatientChange={() => {}} // No-op en snapshot
            disabled={true} // Todo deshabilitado
          />
        </Section>

        {/* Motivo de consulta */}
        <Section title="Motivo de Consulta">
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Tipo:</span>{" "}
              {visit.reason_type || "No especificado"}
            </div>
            {visit.reason_detail && (
              <div>
                <span className="font-semibold">Detalle:</span>{" "}
                {visit.reason_detail}
              </div>
            )}
          </div>
        </Section>

        {/* Odontograma */}
        <Section title="Odontograma">
          <Odontogram
            value={toothDx}
            onChange={() => {}} // No-op en snapshot
            disabled={true}
          />
        </Section>

        {/* Diagnóstico */}
        <Section title="Diagnóstico">
          <DiagnosisArea
            toothDx={toothDx}
            manualDiagnosis={visit.diagnosis_text || ""}
            onManualDiagnosisChange={() => {}} // No-op
            disabled={true}
          />
        </Section>

        {/* Procedimientos realizados hasta esta fecha */}
        <Section title="Procedimientos Realizados Hasta Esta Fecha">
          {/* TODO: Implementar en FASE 4 */}
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {sessions.length} sesión(es) registrada(s) hasta esta fecha
          </p>
        </Section>

        {/* Resumen financiero */}
        <Section title="Resumen Financiero Acumulado">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-md bg-[hsl(var(--muted))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                Total Presupuestado
              </div>
              <div className="text-2xl font-bold">${financialTotals.totalBudget}</div>
            </div>
            <div className="text-center p-4 rounded-md bg-[hsl(var(--muted))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                Total Abonado
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${financialTotals.totalPaid}
              </div>
            </div>
            <div className="text-center p-4 rounded-md bg-[hsl(var(--muted))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                Saldo Total
              </div>
              <div className="text-2xl font-bold text-red-600">
                ${financialTotals.totalBalance}
              </div>
            </div>
          </div>
        </Section>

        {/* Adjuntos */}
        <Section title="Adjuntos de Esta Visita">
          {/* TODO: Implementar en FASE 4 */}
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {attachments.length} archivo(s) adjunto(s)
          </p>
        </Section>
      </div>

      {/* Botón flotante para regresar (móvil) */}
      <button
        onClick={onExit}
        className="fixed bottom-6 right-6 bg-[hsl(var(--brand))] text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all lg:hidden"
      >
        <ArrowLeft className="inline mr-2" size={20} />
        REGRESAR
      </button>
    </div>
  );
}
```

**Tiempo:** 40 min

#### 3.3 Integrar VisitSnapshot en App.tsx (30 min)

**Modificaciones en App.tsx:**

```typescript
// Imports
import VisitSnapshot from "./components/VisitSnapshot";

// Estado
const [snapshotMode, setSnapshotMode] = useState(false);
const [snapshotVisitId, setSnapshotVisitId] = useState<number | null>(null);

// Función para entrar en snapshot mode
const handleViewSnapshot = useCallback((visitId: number) => {
  setSnapshotVisitId(visitId);
  setSnapshotMode(true);
}, []);

// Función para salir de snapshot mode
const handleExitSnapshot = useCallback(() => {
  setSnapshotMode(false);
  setSnapshotVisitId(null);
}, []);

// En el render principal (ANTES del return del Layout)
if (snapshotMode && snapshotVisitId && patient.id) {
  return (
    <VisitSnapshot
      visitId={snapshotVisitId}
      patientId={patient.id}
      onExit={handleExitSnapshot}
    />
  );
}

// Pasar handleViewSnapshot a SessionsTable
<SessionsTable
  sessions={sessions}
  onSessionsChange={setSessions}
  procedureTemplates={procedureTemplates}
  onUpdateTemplates={handleUpdateTemplates}
  signers={signers}
  onSignersChange={reloadSigners}
  onViewReadOnly={handleViewSnapshot} // ✅ Conectar aquí
/>
```

**Tiempo:** 30 min

**✅ CHECKPOINT FASE 3:** Verificar que al hacer clic en el ojo se abre el snapshot básico

---

### FASE 4: Completar VisitSnapshot - Procedimientos y Adjuntos (1.5 horas)

#### 4.1 Crear SnapshotSessions Component (40 min)

**Archivo:** `src/components/SnapshotSessions.tsx`

```typescript
import { useMemo } from "react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { VisitWithProcedures } from "../lib/types";

interface SnapshotSessionsProps {
  sessions: VisitWithProcedures[];
}

export default function SnapshotSessions({ sessions }: SnapshotSessionsProps) {
  // Ordenar sesiones por fecha (descendente)
  const sortedSessions = useMemo(() => {
    const copy = [...sessions];
    copy.sort((a, b) => {
      const da = a.visit.date ?? "";
      const db = b.visit.date ?? "";
      return db.localeCompare(da);
    });
    return copy;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        <p>No hay procedimientos registrados hasta esta fecha</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedSessions.map((session, idx) => {
        const activeProcs = session.items.filter((it) => it.quantity > 0);
        const sessionNumber = sortedSessions.length - idx;

        return (
          <Card
            key={session.visit.id || `session-${idx}`}
            className="p-4 bg-[hsl(var(--muted))]"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              {/* Header de la sesión */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[hsl(var(--brand))] flex items-center justify-center text-white font-bold shrink-0">
                  {sessionNumber}
                </div>
                <div>
                  <div className="font-semibold">
                    Sesión del {session.visit.date}
                  </div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    {activeProcs.length} procedimiento(s) realizado(s)
                  </div>
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="flex gap-4 text-sm">
                <div className="text-right">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Presupuesto
                  </div>
                  <div className="font-semibold">${session.visit.budget}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Abono
                  </div>
                  <div className="font-semibold text-green-600">
                    ${session.visit.payment}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Saldo
                  </div>
                  <div className="font-semibold text-red-600">
                    ${session.visit.balance}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de procedimientos */}
            {activeProcs.length > 0 && (
              <div className="space-y-1">
                {activeProcs.map((proc, procIdx) => (
                  <div
                    key={proc.id || `proc-${procIdx}`}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 text-sm px-2 py-1 bg-[hsl(var(--background))] rounded"
                  >
                    <div>{proc.name}</div>
                    <div className="text-center">${proc.unit_price}</div>
                    <div className="text-center">x{proc.quantity}</div>
                    <div className="text-right font-semibold">
                      ${proc.subtotal}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Observaciones si existen */}
            {session.visit.observations && (
              <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
                <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">
                  Observaciones:
                </div>
                <div className="text-sm">{session.visit.observations}</div>
              </div>
            )}

            {/* Firmante si existe */}
            {session.visit.signer && (
              <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                Firmante: <span className="font-medium">{session.visit.signer}</span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
```

**Tiempo:** 40 min

#### 4.2 Crear SnapshotAttachments Component (40 min)

**Archivo:** `src/components/SnapshotAttachments.tsx`

```typescript
import { FileIcon, ImageIcon, FileTextIcon, DownloadIcon } from "lucide-react";
import { Button } from "./ui/Button";
import { openWithOS, revealInOS } from "../lib/files/attachments";
import type { AttachmentFile } from "../lib/types";

interface SnapshotAttachmentsProps {
  attachments: AttachmentFile[];
}

export default function SnapshotAttachments({
  attachments,
}: SnapshotAttachmentsProps) {
  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        <p>No hay archivos adjuntos hasta esta fecha</p>
      </div>
    );
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon size={24} />;
    if (type === "application/pdf") return <FileTextIcon size={24} />;
    return <FileIcon size={24} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="border border-[hsl(var(--border))] rounded-lg p-3 hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <div className="flex items-start gap-3">
            {/* Icono */}
            <div className="text-[hsl(var(--muted-foreground))]">
              {getFileIcon(file.type)}
            </div>

            {/* Info del archivo */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate" title={file.name}>
                {file.name}
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                {formatFileSize(file.size)}
              </div>
              {file.uploadDate && (
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {new Date(file.uploadDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => file.storage_key && openWithOS(file.storage_key)}
              className="flex-1"
              title="Abrir archivo"
            >
              <DownloadIcon size={14} />
              Abrir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => file.storage_key && revealInOS(file.storage_key)}
              title="Mostrar en carpeta"
            >
              📁
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Tiempo:** 40 min

#### 4.3 Integrar en VisitSnapshot (10 min)

**En VisitSnapshot.tsx:**

```typescript
// Imports
import SnapshotSessions from "./SnapshotSessions";
import SnapshotAttachments from "./SnapshotAttachments";

// Reemplazar los TODOs:

{/* Procedimientos realizados hasta esta fecha */}
<Section title="Procedimientos Realizados Hasta Esta Fecha">
  <SnapshotSessions sessions={sessions} />
</Section>

{/* Adjuntos */}
<Section title="Adjuntos de Esta Visita">
  <SnapshotAttachments attachments={attachments} />
</Section>
```

**Tiempo:** 10 min

**✅ CHECKPOINT FASE 4:** Verificar que el snapshot muestra procedimientos y adjuntos correctamente

---

### FASE 5: Estilos de Impresión y Refinamientos (30 min)

#### 5.1 Agregar estilos de impresión (20 min)

**Archivo:** `src/index.css`

Al final del archivo, agregar:

```css
/* ==========================================
   ESTILOS DE IMPRESIÓN PARA VISIT SNAPSHOT
   ========================================== */

@media print {
  /* Ocultar elementos no necesarios en la impresión */
  .no-print,
  button:not(.print-visible),
  .sticky {
    display: none !important;
  }

  /* Ajustes de página */
  @page {
    size: A4;
    margin: 1cm;
  }

  body {
    background: white !important;
    color: black !important;
  }

  /* Forzar colores en impresión */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Evitar saltos de página en secciones */
  .print-section {
    page-break-inside: avoid;
  }

  /* Headers más compactos en impresión */
  h1 {
    font-size: 18pt;
  }
  h2 {
    font-size: 16pt;
  }
  h3 {
    font-size: 14pt;
  }

  /* Badges y badges visibles */
  .badge {
    border: 1px solid #000 !important;
  }

  /* Asegurar que las cards no se partan */
  .card {
    page-break-inside: avoid;
  }
}
```

**En SnapshotHeader.tsx:**

```tsx
// Agregar clase no-print al header para que no se imprima
<div className="sticky top-0 z-50 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] shadow-md no-print">
```

**En VisitSnapshot.tsx:**

```tsx
// Agregar clase print-section a cada Section
<Section title="..." className="print-section">
```

**Tiempo:** 20 min

#### 5.2 Añadir título de impresión (10 min)

**En VisitSnapshot.tsx:**

```tsx
// Dentro del return, al inicio del contenido
<div className="container mx-auto px-4 py-6 space-y-6 print:p-0">
  {/* Título solo visible en impresión */}
  <div className="hidden print:block mb-6">
    <h1 className="text-2xl font-bold text-center">
      GREENAPPLEDENTAL - Historia Clínica
    </h1>
    <div className="text-center text-sm mt-2">
      Paciente: {patient.full_name} | CI: {patient.doc_id}
    </div>
    <div className="text-center text-sm">
      Fecha de visita: {visit.date}
    </div>
    <hr className="my-4" />
  </div>

  {/* Resto del contenido... */}
</div>
```

**Tiempo:** 10 min

**✅ CHECKPOINT FASE 5:** Probar la funcionalidad de impresión (Ctrl+P o botón imprimir)

---

### FASE 6: Pruebas y Ajustes Finales (30 min)

#### 6.1 Checklist de pruebas

```
✅ FUNCIONALIDAD
□ Botón "Cargar último motivo" funciona correctamente
□ Botón "Cargar último diagnóstico" funciona correctamente
□ Preview de último motivo/diagnóstico se muestra
□ Click en ojo abre VisitSnapshot
□ VisitSnapshot muestra datos del paciente
□ VisitSnapshot muestra motivo completo
□ VisitSnapshot muestra odontograma correcto
□ VisitSnapshot muestra diagnóstico completo
□ VisitSnapshot filtra sesiones hasta la fecha correcta
□ VisitSnapshot calcula totales financieros correctamente
□ VisitSnapshot filtra adjuntos hasta la fecha correcta
□ Botón "REGRESAR" vuelve al estado actual
□ Botón "IMPRIMIR" genera PDF correcto

✅ NAVEGACIÓN
□ Botones del header están deshabilitados en snapshot mode
□ Solo "REGRESAR" y "IMPRIMIR" están activos
□ El formulario principal se restaura correctamente al salir

✅ UI/UX
□ Los botones "Cargar último" tienen tooltips claros
□ El preview del último registro no satura la interfaz
□ El VisitSnapshot es claro y legible
□ Los badges de "Solo lectura" son visibles
□ El botón flotante de regresar funciona en móvil

✅ IMPRESIÓN
□ El snapshot se imprime correctamente
□ Los botones no aparecen en la impresión
□ Los colores se mantienen en el PDF
□ No hay saltos de página indeseados
□ El título de la clínica aparece en la impresión

✅ EDGE CASES
□ Funciona con paciente sin visitas previas (lastVisit = null)
□ Funciona con visitas sin adjuntos
□ Funciona con visitas sin procedimientos
□ Funciona con visitas sin diagnóstico/motivo
□ Maneja fechas correctamente (comparación de strings YYYY-MM-DD)
```

**Tiempo:** 30 min

---

## 🔧 Especificaciones Técnicas

### Filtrado por Fecha

**Lógica de comparación:**
```typescript
// Las fechas en la BD están en formato YYYY-MM-DD
// La comparación de strings funciona correctamente:
"2024-01-15" <= "2024-06-20" // true
"2024-08-01" <= "2024-06-20" // false

// Filtrar sesiones
sessions.filter(s => (s.visit.date ?? '') <= targetDate)

// Filtrar adjuntos
attachments.filter(att => (att.created_at ?? '') <= targetDate)
```

### Estado de Snapshot Mode

```typescript
// App.tsx mantiene el estado global
const [snapshotMode, setSnapshotMode] = useState(false);
const [snapshotVisitId, setSnapshotVisitId] = useState<number | null>(null);

// Render condicional
if (snapshotMode && snapshotVisitId) {
  return <VisitSnapshot ... />;
}
return <Layout>...</Layout>;
```

### Deshabilitación de Botones

```typescript
// En Layout.tsx o donde estén los botones del header
const isSnapshotMode = /* pasar como prop desde App */;

<Button disabled={isSnapshotMode}>Búsqueda</Button>
<Button disabled={isSnapshotMode}>Cartera</Button>
<Button disabled={isSnapshotMode}>Nueva Historia</Button>
```

---

## 📚 Casos de Uso

### Caso 1: Seguimiento de Tratamiento

**Escenario:**
- Paciente viene por segunda vez por el mismo problema
- El odontólogo quiere reutilizar el motivo/diagnóstico anterior

**Flujo:**
1. Selecciona al paciente → Campos vacíos
2. Ve preview: "Último: Dolor en molar inferior (2024-11-20)"
3. Click en "Cargar último motivo"
4. Motivo se autocompleta
5. Modifica si es necesario
6. Continúa con la consulta

**Ahorro de tiempo:** ~30 segundos por consulta

---

### Caso 2: Revisión de Historial

**Escenario:**
- Paciente pregunta "¿Qué me hicieron en junio?"
- El odontólogo necesita revisar esa visita específica

**Flujo:**
1. En SessionsTable, busca la sesión de junio
2. Click en el ojo 👁️
3. Se abre VisitSnapshot de junio
4. Ve motivo, diagnóstico, procedimientos, adjuntos
5. Click en "REGRESAR"
6. Vuelve al estado actual

**Beneficio:** Contexto completo sin salir del sistema

---

### Caso 3: Auditoría/Reporte

**Escenario:**
- Seguro médico pide reporte de una visita específica
- Necesitan documentación impresa de qué se hizo

**Flujo:**
1. Selecciona al paciente
2. Click en ojo 👁️ de la visita solicitada
3. Se abre VisitSnapshot
4. Click en "IMPRIMIR SNAPSHOT"
5. Genera PDF con toda la información
6. Entrega al paciente/seguro

**Beneficio:** Reporte profesional en 1 minuto

---

### Caso 4: Consulta Nueva

**Escenario:**
- Paciente viene por primera vez o por algo completamente diferente
- No quiere reutilizar información anterior

**Flujo:**
1. Selecciona al paciente → Campos vacíos
2. Ignora los botones "Cargar último"
3. Escribe motivo nuevo desde cero
4. Continúa normalmente

**Beneficio:** Sin interferencia, workflow natural

---

## 🎨 Consideraciones de UX

### Principios de Diseño

1. **No invasivo:**
   - Los botones "Cargar último" NO autocargan
   - El odontólogo decide conscientemente si reutiliza

2. **Contexto visual:**
   - Preview del último registro siempre visible
   - Fecha del último registro mostrada claramente

3. **Reversibilidad:**
   - Botón "REGRESAR" siempre visible y destacado
   - Sin confirmaciones molestas al salir del snapshot

4. **Claridad:**
   - Badge "SOLO LECTURA" en snapshot
   - Botones deshabilitados con opacidad visual
   - Tooltips explicativos en todos los botones

5. **Profesionalismo:**
   - Impresión limpia y clara
   - Información bien organizada
   - Sin elementos innecesarios en el PDF

### Accesibilidad

```tsx
// Todos los botones tienen title/aria-label
<Button
  title="Cargar motivo de la última visita"
  aria-label="Cargar último motivo de consulta"
>
  Cargar último
</Button>

// Badges tienen role="status"
<Badge role="status">SOLO LECTURA</Badge>

// Shortcuts de teclado (opcional para futuro)
// Ctrl+P = Imprimir
// Esc = Salir de snapshot
```

### Responsive Design

```css
/* Desktop: Header sticky con botones grandes */
@media (min-width: 1024px) {
  .snapshot-header { /* sticky */ }
  .floating-back-button { display: none; }
}

/* Móvil: Botón flotante visible */
@media (max-width: 1023px) {
  .snapshot-header { /* no sticky */ }
  .floating-back-button { display: block; }
}
```

---

## 📊 Estimación de Impacto

### Ahorro de Tiempo
- **Por paciente de seguimiento:** ~30 segundos (reutilizar motivo/diagnóstico)
- **Por auditoría/reporte:** ~5 minutos (snapshot vs buscar manualmente)
- **Estimado mensual (50 consultas de seguimiento):** ~25 minutos ahorrados

### Mejora de Calidad
- ✅ Menos errores de transcripción
- ✅ Consistencia en terminología médica
- ✅ Historial más completo y profesional
- ✅ Mejor experiencia del paciente

### Profesionalización
- ✅ Reportes impresos de calidad
- ✅ Cumplimiento con auditorías
- ✅ Mejor gestión de seguros
- ✅ Imagen profesional de la clínica

---

## 🚀 Siguiente Pasos Después de Implementar

### Mejoras Futuras (Fase 2)

1. **Comparación de Snapshots:**
   - Ver dos snapshots lado a lado
   - Identificar cambios en el tiempo

2. **Exportar a PDF:**
   - Generar PDF directamente (sin usar window.print)
   - Personalizar encabezados/pies de página

3. **Timeline Visual:**
   - Línea de tiempo gráfica de visitas
   - Click en punto → Abre snapshot

4. **Estadísticas:**
   - Gráfico de evolución de tratamientos
   - Análisis de costos por paciente

5. **Búsqueda en Historial:**
   - Buscar por procedimiento realizado
   - Buscar por rango de fechas
   - Filtros avanzados

---

## ✅ Checklist de Implementación

```
FASE 1: Preparación (30 min)
□ Crear snapshot-utils.ts
□ Implementar filterSessionsUntilDate
□ Implementar filterAttachmentsUntilDate
□ Implementar calculateFinancialTotals
□ Pruebas unitarias básicas

FASE 2: Botones "Cargar Último" (1 hora)
□ Agregar estado lastVisit en App.tsx
□ Implementar handleLoadPreviousReason
□ Implementar handleLoadPreviousDiagnosis
□ UI: Botón en sección Motivo
□ UI: Preview en sección Motivo
□ UI: Botón en sección Diagnóstico
□ UI: Preview en sección Diagnóstico
□ Imports de iconos (FileDown)

FASE 3: VisitSnapshot Base (1.5 horas)
□ Crear SnapshotHeader.tsx
□ Crear VisitSnapshot.tsx (estructura)
□ Implementar carga de datos
□ Integrar con App.tsx (estado snapshotMode)
□ Conectar onViewReadOnly en SessionsTable
□ Render condicional en App.tsx

FASE 4: Procedimientos y Adjuntos (1.5 horas)
□ Crear SnapshotSessions.tsx
□ Crear SnapshotAttachments.tsx
□ Integrar en VisitSnapshot
□ Validar filtrado correcto por fecha
□ Validar cálculos financieros

FASE 5: Impresión (30 min)
□ Estilos CSS de impresión
□ Clase no-print en elementos
□ Título de impresión
□ Probar generación de PDF
□ Ajustar saltos de página

FASE 6: Pruebas (30 min)
□ Ejecutar checklist completo
□ Probar edge cases
□ Validar en diferentes navegadores
□ Pruebas de impresión
□ Ajustes finales de UI

TOTAL ESTIMADO: 4-5 horas
```

---

## 📝 Notas Finales

### Dependencias Existentes (No Requieren Instalación)
- `lucide-react` - Iconos
- `@tauri-apps/plugin-sql` - Base de datos
- `@tauri-apps/plugin-fs` - Sistema de archivos

### Archivos que NO se Modifican
- `TauriSqliteRepository.ts` - Lógica de BD ya está completa
- `types.ts` - Tipos ya existen
- Componentes de UI base (Button, Badge, etc.)

### Archivos que SÍ se Modifican
- `App.tsx` - Agregar estado y lógica de snapshot
- Secciones de Motivo y Diagnóstico en App.tsx
- `index.css` - Estilos de impresión

### Archivos Nuevos a Crear
- `VisitSnapshot.tsx`
- `SnapshotHeader.tsx`
- `SnapshotSessions.tsx`
- `SnapshotAttachments.tsx`
- `snapshot-utils.ts`

---

**Documento creado por:** Claude Code Assistant
**Fecha:** 2024-12-04
**Versión:** 1.0
**Estado:** Listo para implementación ✅
