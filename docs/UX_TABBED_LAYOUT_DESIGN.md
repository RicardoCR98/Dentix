# Diseño UX: Layout con Pestañas para PatientsPage

**Fecha:** 2025-12-10
**Aplicación:** Oklus - Sistema de gestión dental
**Componente:** `src/pages/PatientsPage.tsx`
**Objetivo:** Reducir scroll vertical, mejorar organización visual y facilitar navegación

---

## 1. ANÁLISIS DEL PROBLEMA ACTUAL

### 1.1 Problemas identificados

**Layout actual (vertical lineal):**
- Scroll excesivo (toda la información visible simultáneamente)
- Dificultad para ubicar secciones específicas rápidamente
- Información crítica (datos del paciente) desaparece al hacer scroll
- Fatiga visual por densidad de información
- Sesiones ocupan mucho espacio vertical con paginación

**Flujo de trabajo actual:**
1. Buscar paciente (Ctrl+K)
2. Ver/editar datos demográficos
3. Registrar motivo de consulta
4. Trabajar en odontograma + diagnóstico
5. Crear/editar sesión financiera
6. Adjuntar archivos
7. Guardar (Ctrl+S)

**Usuario objetivo:**
- Dentistas y personal administrativo
- Uso frecuente (varias veces al día)
- Necesidad de acceso rápido a datos específicos
- Contexto: consultorio con interrupciones frecuentes

---

## 2. PROPUESTA DE DISEÑO

### 2.1 Estructura jerárquica

```
┌─────────────────────────────────────────────────────────────┐
│ [SECCIÓN FIJA - SIEMPRE VISIBLE]                           │
│                                                              │
│  Acciones Rápidas:  [Nueva] [Guardar] [Buscar] [Cartera]   │
│  Datos Paciente:    [Card compacto con info clave]          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [TABS - NAVEGACIÓN]                                         │
│  [Clínico] [Evolución] [Finanzas] [Adjuntos]               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [CONTENIDO DEL TAB ACTIVO]                                │
│   - Odontograma + Diagnóstico                               │
│   - Tabla de sesiones + procedimientos                      │
│   - Historial financiero resumido                           │
│   - Galería de adjuntos                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ESPECIFICACIÓN DETALLADA DE COMPONENTES

### 3.1 Sección Fija Superior (Sticky)

**Altura:** ~140px (sin paciente) / ~220px (con paciente)
**Posición:** `position: sticky; top: 0; z-index: 10`
**Fondo:** `bg-[hsl(var(--background))]` con `backdrop-blur-sm`

#### 3.1.1 Barra de Acciones Rápidas

```tsx
<div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-[hsl(var(--border))]">
  <div className="flex items-center gap-2">
    <Button variant="primary" onClick={handleNew} size="default">
      <Plus size={16} />
      Nueva Historia
    </Button>

    <Button variant="secondary" onClick={handleSave} size="default">
      <Save size={16} />
      Guardar (Ctrl+S)
    </Button>

    <Button variant="ghost" onClick={handleExport} size="default">
      <FileDown size={16} />
      Imprimir
    </Button>
  </div>

  <div className="flex items-center gap-2">
    <Button variant="ghost" onClick={() => setSearchDialogOpen(true)} size="default">
      <Search size={16} />
      Buscar (Ctrl+K)
    </Button>

    <Button variant="ghost" onClick={() => setPaymentsDialogOpen(true)} size="default">
      <Wallet size={16} />
      Cartera
    </Button>

    <ThemePanel /> {/* Icono de tema */}
  </div>
</div>
```

**Comportamiento:**
- Botones con tooltips al hover (3s delay)
- Shortcuts visibles en los labels
- Feedback visual en click (scale 0.98)
- Disabled state cuando no hay datos

#### 3.1.2 Card Compacto de Paciente

**Casos de visualización:**

**A) Sin paciente seleccionado:**
```tsx
<Alert variant="info" className="mx-6 my-3">
  <div className="flex items-center gap-3">
    <User size={20} />
    <span>No hay paciente seleccionado. Usa <kbd>Ctrl+K</kbd> para buscar o crea uno nuevo.</span>
  </div>
</Alert>
```

**B) Con paciente seleccionado (modo compacto):**
```tsx
<div className="mx-6 my-3 p-4 rounded-lg border-2 border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:shadow-md transition-shadow">
  <div className="flex items-center gap-4">
    {/* Avatar */}
    <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand)/0.3)] flex items-center justify-center text-white font-bold text-xl shrink-0 border-2 border-[hsl(var(--brand))]">
      {patient.full_name?.charAt(0)?.toUpperCase() || "?"}
    </div>

    {/* Info principal */}
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-base truncate">
        {patient.full_name.toUpperCase() || "Sin nombre"}
      </h4>
      <div className="flex flex-wrap gap-3 text-xs text-[hsl(var(--muted-foreground))]">
        <span className="flex items-center gap-1">
          <CreditCard size={10} /> {patient.doc_id}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={10} /> {calculateAge(patient.date_of_birth)} años
        </span>
        <span className="flex items-center gap-1">
          <Phone size={10} /> {patient.phone}
        </span>
      </div>
    </div>

    {/* Alertas críticas */}
    {patient.allergy_detail && (
      <Badge variant="danger" className="animate-pulse">
        <AlertTriangle size={12} />
        Alergia
      </Badge>
    )}

    {/* Acción de editar */}
    <Button variant="ghost" size="sm" onClick={handleEditPatient}>
      Editar datos
    </Button>
  </div>

  {/* Anamnesis y alergias (colapsables) */}
  {(patient.anamnesis || patient.allergy_detail) && (
    <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] grid gap-2 md:grid-cols-2">
      {patient.anamnesis && (
        <div className="text-xs">
          <span className="font-semibold">Anamnesis:</span> {patient.anamnesis}
        </div>
      )}
      {patient.allergy_detail && (
        <div className="text-xs text-red-700 dark:text-red-400">
          <span className="font-semibold">Alergia:</span> {patient.allergy_detail}
        </div>
      )}
    </div>
  )}
</div>
```

**C) Nuevo paciente (formulario completo):**
- Mostrar `<PatientForm />` completo inline
- Validación en tiempo real
- Campos obligatorios marcados con asterisco
- Auto-focus en campo "Nombre completo"

---

### 3.2 Sistema de Pestañas

**Componente base:** `<Tabs>` de Radix UI (ya implementado en `src/components/ui/Tabs.tsx`)

#### 3.2.1 Estructura de Tabs

```tsx
<Tabs defaultValue="clinico" className="px-6 mt-4">
  <TabsList className="w-full grid grid-cols-4 border-b border-[hsl(var(--border))]">
    <TabsTrigger value="clinico" className="gap-2">
      <Stethoscope size={16} />
      <span>Clínico</span>
      {/* Badge si hay diagnóstico */}
      {(toothDx.length > 0 || manualDiagnosis) && (
        <Badge variant="success" className="ml-2">✓</Badge>
      )}
    </TabsTrigger>

    <TabsTrigger value="evolucion" className="gap-2">
      <Activity size={16} />
      <span>Evolución</span>
      {/* Badge con número de sesiones */}
      {sessions.length > 0 && (
        <Badge variant="info" className="ml-2">{sessions.length}</Badge>
      )}
    </TabsTrigger>

    <TabsTrigger value="finanzas" className="gap-2">
      <Wallet size={16} />
      <span>Finanzas</span>
      {/* Badge de saldo pendiente */}
      {totalBalance > 0 && (
        <Badge variant="danger" className="ml-2">${totalBalance}</Badge>
      )}
    </TabsTrigger>

    <TabsTrigger value="adjuntos" className="gap-2">
      <Paperclip size={16} />
      <span>Adjuntos</span>
      {/* Badge con número de archivos */}
      {attachments.length > 0 && (
        <Badge variant="default" className="ml-2">{attachments.length}</Badge>
      )}
    </TabsTrigger>
  </TabsList>

  {/* Contenido de cada tab */}
  <TabsContent value="clinico">
    {/* Ver sección 3.3 */}
  </TabsContent>

  <TabsContent value="evolucion">
    {/* Ver sección 3.4 */}
  </TabsContent>

  <TabsContent value="finanzas">
    {/* Ver sección 3.5 */}
  </TabsContent>

  <TabsContent value="adjuntos">
    {/* Ver sección 3.6 */}
  </TabsContent>
</Tabs>
```

**Diseño de TabsTrigger (ya implementado en Tabs.tsx):**
- Altura: 48px
- Padding: 12px 16px
- Indicador inferior animado (línea azul 2px)
- Transición suave (300ms ease-out)
- Hover state: fondo muted
- Active state: texto primary + indicador visible
- Focus: ring outline (accesibilidad)

---

### 3.3 Tab 1: Clínico

**Objetivo:** Captura de información clínica (odontograma + diagnóstico)

**Layout interno:**
```tsx
<TabsContent value="clinico" className="py-6 space-y-6">
  {/* Motivo de consulta */}
  <Section
    icon={<FileText size={20} />}
    title="Motivo de Consulta"
    collapsible
    defaultOpen
  >
    <div className="grid md:grid-cols-2 gap-4">
      <ReasonTypeSelect
        value={session.reason_type}
        onChange={(val) => setSession({...session, reason_type: val})}
        reasonTypes={reasonTypes}
        onReasonTypesChange={loadReasonTypes}
      />
      <Textarea
        label="Detalle adicional"
        value={session.reason_detail}
        onChange={(e) => setSession({...session, reason_detail: e.target.value})}
        placeholder="Ej: Dolor agudo en molar superior derecho hace 3 días"
        rows={2}
      />
    </div>
  </Section>

  {/* Odontograma */}
  <Section
    icon={<Stethoscope size={20} />}
    title="Odontograma"
    collapsible
    defaultOpen
  >
    <Odontogram
      value={toothDx}
      onChange={onToothDxChange}
      mode="permanent"
    />
  </Section>

  {/* Diagnóstico */}
  <Section
    icon={<FileText size={20} />}
    title="Diagnóstico Clínico"
    collapsible
    defaultOpen
  >
    <DiagnosisArea
      autoGenerated={diagnosisFromTeeth}
      manualDiagnosis={manualDiagnosis}
      onManualChange={setManualDiagnosis}
      fullDiagnosis={fullDiagnosis}
    />
  </Section>
</TabsContent>
```

**Características:**
- Secciones colapsables (reducir scroll si es necesario)
- Auto-save del odontograma en `localStorage` cada 30s
- Preview en tiempo real del diagnóstico generado
- Validación visual de campos obligatorios

---

### 3.4 Tab 2: Evolución y Procedimientos

**Objetivo:** Historial de sesiones con procedimientos y montos

**Layout interno:**
```tsx
<TabsContent value="evolucion" className="py-6">
  <SessionsTable
    sessions={sessions}
    onSessionsChange={setSessions}
    procedureTemplates={procedureTemplates}
    onUpdateTemplates={updateProcedureTemplates}
    signers={signers}
    onSignersChange={loadSigners}
    reasonTypes={reasonTypes}
    paymentMethods={paymentMethods}
    onReasonTypesChange={loadReasonTypes}
  />
</TabsContent>
```

**Mejoras específicas para este tab:**
- **Vista compacta por defecto** (solo header de sesión visible)
- **Expandir sesión al click** (accordión)
- **Indicadores visuales:**
  - Badge "BORRADOR" en sesiones no guardadas
  - Badge "PAGADO" si balance = 0
  - Badge "PENDIENTE $XXX" si hay saldo
- **Paginación mejorada:**
  - 5 sesiones por página (ya implementado)
  - Indicador de página actual
  - Botones Primero/Anterior/Siguiente/Último
- **Sticky header** dentro del tab (cuando hay scroll)

**Optimización UX:**
- La sesión más reciente se expande automáticamente
- Scroll suave al crear nueva sesión
- Confirmación antes de eliminar borrador
- Auto-cálculo de montos en tiempo real

---

### 3.5 Tab 3: Historial Financiero

**Objetivo:** Vista consolidada de transacciones y saldos

**Layout interno:**
```tsx
<TabsContent value="finanzas" className="py-6 space-y-6">
  {/* Resumen financiero */}
  <div className="grid md:grid-cols-4 gap-4">
    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
      <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Presupuestado</div>
      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">${totalBudget}</div>
    </div>

    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
      <div className="text-xs text-green-600 dark:text-green-400 mb-1">Total Abonado</div>
      <div className="text-2xl font-bold text-green-700 dark:text-green-300">${totalPayment}</div>
    </div>

    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
      <div className="text-xs text-red-600 dark:text-red-400 mb-1">Saldo Pendiente</div>
      <div className="text-2xl font-bold text-red-700 dark:text-red-300">${totalBalance}</div>
    </div>

    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
      <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Descuentos</div>
      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">${totalDiscount}</div>
    </div>
  </div>

  {/* Botón de abono rápido */}
  <div className="flex justify-end">
    <Button variant="primary" onClick={() => setQuickPaymentOpen(true)}>
      <DollarSign size={16} />
      Registrar Abono Rápido
    </Button>
  </div>

  {/* Tabla de transacciones */}
  <FinancialHistoryBlock
    sessions={savedSessions}
    allSessions={sessions}
    onQuickPayment={() => setQuickPaymentOpen(true)}
  />

  {/* Gráfico de evolución de saldo (opcional - v2) */}
  {/* <BalanceChart sessions={savedSessions} /> */}
</TabsContent>
```

**Características:**
- **Cards de resumen** con colores semánticos
- **Tabla de transacciones** con scroll horizontal en móviles
- **Filtros temporales:** Último mes, Último año, Todo
- **Exportar a PDF/Excel** (botón secundario)
- **Botón CTA prominente** para abono rápido

**Accesibilidad:**
- Contraste WCAG AA en todos los badges
- Tabindex correcto para navegación por teclado
- Screen reader labels descriptivos

---

### 3.6 Tab 4: Adjuntos

**Objetivo:** Gestión de archivos (radiografías, fotos, documentos)

**Layout interno:**
```tsx
<TabsContent value="adjuntos" className="py-6">
  <Attachments
    files={attachments}
    onFilesChange={setAttachments}
    onFileDelete={deleteAttachment}
    patientName={patient.full_name}
    readOnly={false}
  />
</TabsContent>
```

**Características actuales (ya implementadas):**
- Drag & drop zone
- Preview de imágenes en thumbnails
- Separación por tipo (Imágenes/Documentos) con sub-tabs
- Información de archivo (nombre, tamaño, fecha)
- Botón de apertura con app del sistema
- Badge "Nuevo" para archivos pendientes de guardar

**Mejora propuesta:**
- **Vista de galería** para imágenes (grid 3 columnas en desktop)
- **Lightbox/Modal** al click en imagen (zoom)
- **Indicador de carga** al arrastrar archivos
- **Límite de tamaño** visual (ej: máx 10MB por archivo)

---

## 4. COMPORTAMIENTO Y ESTADOS

### 4.1 Navegación entre Tabs

**Triggers para cambio automático de tab:**

1. **Al buscar paciente (Ctrl+K):**
   - Cargar datos
   - Activar tab "Clínico" (resetear a inicio)
   - Focus en campo "Motivo de consulta"

2. **Al crear "Nueva Historia":**
   - Limpiar estado
   - Activar tab "Clínico"
   - Mostrar formulario de paciente nuevo (inline)

3. **Al hacer click en "Cartera":**
   - Activar tab "Finanzas" automáticamente

4. **Al click en "Ver sesión" desde historial:**
   - Activar tab "Evolución"
   - Expandir sesión específica
   - Scroll suave a sesión

**Preservación de estado:**
- El tab seleccionado se guarda en `localStorage`
- Al recargar página, restaurar último tab activo
- Estado de secciones colapsables también se persiste

### 4.2 Validación Visual por Tab

**Indicadores de completitud:**

```tsx
// Tab "Clínico"
const isClinicComplete =
  session.reason_type &&
  (Object.keys(toothDx).length > 0 || manualDiagnosis);

// Tab "Evolución"
const hasSessionData = sessions.length > 0;

// Tab "Finanzas"
const hasFinancialData = savedSessions.length > 0;

// Tab "Adjuntos"
const hasAttachments = attachments.length > 0;
```

**Visualización:**
- Check verde (✓) en tab completado
- Badge con número en tabs con datos
- Animación sutil al completar sección

### 4.3 Estados de Loading

**Carga inicial:**
```tsx
{isLoadingPatient && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]" />
    <span className="ml-3 text-sm text-[hsl(var(--muted-foreground))]">
      Cargando datos del paciente...
    </span>
  </div>
)}
```

**Guardando:**
- Overlay translúcido sobre tabs
- Spinner + mensaje "Guardando historia clínica..."
- Desactivar botones y tabs durante guardado

**Error:**
```tsx
<Alert variant="danger" className="mb-4">
  <AlertTriangle size={20} />
  <div>
    <h4 className="font-semibold">Error al guardar</h4>
    <p className="text-sm">{errorMessage}</p>
    <Button variant="ghost" size="sm" className="mt-2" onClick={retry}>
      Reintentar
    </Button>
  </div>
</Alert>
```

---

## 5. RESPONSIVE DESIGN

### 5.1 Breakpoints

```css
/* Móvil: < 768px */
- Tabs en scroll horizontal (swipe)
- Card de paciente en layout vertical
- Botones con solo íconos (ocultar texto)
- Formularios en 1 columna

/* Tablet: 768px - 1024px */
- Tabs visibles en grid 4 columnas
- Card de paciente en 2 columnas
- Formularios en 2 columnas
- SessionCard expandida verticalmente

/* Desktop: > 1024px */
- Layout óptimo según diseño
- Sidebar opcional con navegación rápida (v2)
```

### 5.2 Ajustes Mobile

**Tabs en móvil:**
```tsx
<TabsList className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap flex md:grid md:grid-cols-4">
  {/* Tabs con scroll horizontal en móvil */}
</TabsList>
```

**Acciones rápidas en móvil:**
- Botones colapsados en menú hamburguesa
- Solo mostrar: Nueva, Guardar, Buscar
- Otras opciones en menú contextual

**Odontograma en móvil:**
- Zoom pinch habilitado
- Scroll horizontal para ver dientes completos
- Selector de arcada (Superior/Inferior) como tabs

---

## 6. ACCESIBILIDAD (WCAG 2.1 AA)

### 6.1 Navegación por Teclado

**Shortcuts globales:**
- `Ctrl+K`: Buscar paciente
- `Ctrl+S`: Guardar
- `Ctrl+N`: Nueva historia
- `Ctrl+P`: Imprimir/Exportar
- `Ctrl+1`: Ir a tab Clínico
- `Ctrl+2`: Ir a tab Evolución
- `Ctrl+3`: Ir a tab Finanzas
- `Ctrl+4`: Ir a tab Adjuntos

**Navegación en tabs:**
- `Tab`: Mover entre controles
- `Shift+Tab`: Mover atrás
- `Arrow Left/Right`: Cambiar entre tabs (cuando TabsList tiene focus)
- `Enter/Space`: Activar tab
- `Escape`: Cerrar modales/popovers

### 6.2 ARIA Labels

```tsx
<Tabs
  defaultValue="clinico"
  aria-label="Secciones de historia clínica"
>
  <TabsList aria-label="Navegación de pestañas">
    <TabsTrigger
      value="clinico"
      aria-label="Pestaña de información clínica"
      aria-controls="clinico-panel"
    >
      Clínico
    </TabsTrigger>
    {/* ... */}
  </TabsList>

  <TabsContent
    value="clinico"
    id="clinico-panel"
    role="tabpanel"
    aria-labelledby="clinico-tab"
  >
    {/* Contenido */}
  </TabsContent>
</Tabs>
```

### 6.3 Contraste de Color

**Ratios mínimos (WCAG AA):**
- Texto normal: 4.5:1
- Texto grande (18px+): 3:1
- Elementos interactivos: 3:1

**Validación de colores:**
```tsx
// Usar variables CSS con contraste validado
--primary: 217 91% 60%;        // Azul accesible
--success: 142 71% 45%;        // Verde accesible
--danger: 0 84% 60%;           // Rojo accesible
--muted-foreground: 215 16% 42%; // Gris accesible
```

### 6.4 Focus Indicators

```tsx
// Ya implementado en Tabs.tsx línea 46
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-[hsl(var(--primary))]
focus-visible:ring-offset-2
```

**Visible en todos los elementos interactivos:**
- Botones
- Inputs
- Tabs
- Links
- Cards clicables

---

## 7. ANIMACIONES Y TRANSICIONES

### 7.1 Cambio de Tab

```tsx
// Ya implementado en TabsContent (línea 63)
animate-in fade-in-50 duration-300
```

**Comportamiento:**
- Fade in del contenido nuevo (300ms)
- Slide sutil desde abajo (opcional)
- Sin fade out del contenido anterior (evitar flicker)

### 7.2 Apertura de Sección Colapsable

```tsx
<Collapsible>
  <CollapsibleTrigger className="transition-transform duration-200">
    {/* Icono chevron rota 180deg al expandir */}
  </CollapsibleTrigger>
  <CollapsibleContent className="animate-in slide-in-from-top duration-200">
    {/* Contenido */}
  </CollapsibleContent>
</Collapsible>
```

### 7.3 Guardado Exitoso

```tsx
// Feedback visual al guardar
<Button
  variant="primary"
  onClick={handleSave}
  className="transition-all duration-200 active:scale-95"
>
  {isSaving ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
      Guardando...
    </>
  ) : (
    <>
      <Save size={16} />
      Guardar
    </>
  )}
</Button>

{/* Toast de éxito */}
toast.success("Historia clínica guardada", "Los cambios se guardaron correctamente");
```

### 7.4 Principio de Diseño: Movimiento Mínimo

**Guidelines:**
- Animaciones < 300ms (imperceptibles pero suaves)
- Sin animaciones en hover (solo transiciones de color/sombra)
- Reducir motion respetando `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. IMPLEMENTACIÓN TÉCNICA

### 8.1 Estructura de Archivos

```
src/pages/
└── PatientsPage.tsx (refactorizado)
    ├── usePatientState.ts (custom hook - estado)
    ├── usePatientsKeyboard.ts (shortcuts)
    └── components/
        ├── PatientHeader.tsx (sección fija)
        ├── PatientTabs.tsx (sistema de tabs)
        └── tabs/
            ├── ClinicTab.tsx
            ├── EvolutionTab.tsx
            ├── FinancesTab.tsx
            └── AttachmentsTab.tsx
```

### 8.2 Estado Global (mantener en PatientsPage)

```tsx
// Estado principal (sin cambios respecto a código actual)
const [patient, setPatient] = useState<Patient>(initialPatient);
const [session, setSession] = useState<Session>(initialSession);
const [toothDx, setToothDx] = useState<ToothDx>({});
const [sessions, setSessions] = useState<VisitWithProcedures[]>([]);
const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

// NUEVO: Tab activo
const [activeTab, setActiveTab] = useState<string>("clinico");

// NUEVO: Estado de UI
const [isPatientFormExpanded, setIsPatientFormExpanded] = useState(false);
```

### 8.3 Custom Hook: Keyboard Shortcuts

```tsx
// src/pages/PatientsPage/usePatientsKeyboard.ts
export function usePatientsKeyboard(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch();
      }

      if (mod && e.key === 's') {
        e.preventDefault();
        handlers.onSave();
      }

      if (mod && e.key === 'n') {
        e.preventDefault();
        handlers.onNew();
      }

      // Tab shortcuts
      if (mod && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const tabMap = { '1': 'clinico', '2': 'evolucion', '3': 'finanzas', '4': 'adjuntos' };
        handlers.onTabChange(tabMap[e.key as keyof typeof tabMap]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

### 8.4 Persistencia de Estado de UI

```tsx
// Guardar tab activo en localStorage
useEffect(() => {
  localStorage.setItem('dentix_active_tab', activeTab);
}, [activeTab]);

// Restaurar al montar
useEffect(() => {
  const savedTab = localStorage.getItem('dentix_active_tab');
  if (savedTab) setActiveTab(savedTab);
}, []);
```

---

## 9. TESTING Y VALIDACIÓN

### 9.1 Checklist de Funcionalidad

- [ ] Cambio de tabs preserva datos
- [ ] Shortcuts de teclado funcionan en todos los tabs
- [ ] Validación de formulario en tab Clínico
- [ ] Guardado funciona desde cualquier tab
- [ ] Búsqueda de paciente resetea vista correctamente
- [ ] SessionsTable mantiene funcionalidad actual
- [ ] Attachments mantiene drag & drop
- [ ] Modal de abono rápido funciona desde tab Finanzas

### 9.2 Checklist de UX

- [ ] Transiciones suaves (< 300ms)
- [ ] Sin flash visual al cambiar tabs
- [ ] Feedback visual en todas las acciones
- [ ] Loading states claramente visibles
- [ ] Error states con acción de recuperación
- [ ] Scroll suave al navegar a elementos
- [ ] Focus management correcto (no perder focus al cambiar tab)

### 9.3 Checklist de Accesibilidad

- [ ] Navegación completa por teclado
- [ ] ARIA labels en todos los tabs
- [ ] Focus indicators visibles
- [ ] Contraste WCAG AA en todos los elementos
- [ ] Screen reader anuncia cambios de tab
- [ ] Shortcuts documentados en modal de ayuda

### 9.4 Checklist de Performance

- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] No re-renders innecesarios al cambiar tabs
- [ ] Lazy loading de componentes pesados (Odontogram)
- [ ] Debounce en campos de búsqueda/filtros
- [ ] Virtualización de listas largas (SessionsTable)

---

## 10. PLAN DE MIGRACIÓN

### Fase 1: Preparación (1 día)
1. Crear estructura de componentes nuevos
2. Extraer lógica de estado a custom hooks
3. Implementar PatientHeader.tsx (sección fija)

### Fase 2: Implementación de Tabs (2 días)
1. Implementar PatientTabs.tsx con Radix Tabs
2. Migrar contenido a ClinicTab.tsx
3. Migrar SessionsTable a EvolutionTab.tsx
4. Migrar FinancialHistoryBlock a FinancesTab.tsx
5. Migrar Attachments a AttachmentsTab.tsx

### Fase 3: Funcionalidad (1 día)
1. Implementar keyboard shortcuts
2. Conectar callbacks entre componentes
3. Validación de datos cross-tab
4. Persistencia de UI state

### Fase 4: Testing y Refinamiento (1 día)
1. Testing de funcionalidad completa
2. Testing de accesibilidad
3. Testing responsive
4. Ajustes finales de animaciones

### Fase 5: Documentación (0.5 días)
1. Actualizar CLAUDE.md con nuevos patrones
2. Documentar componentes nuevos
3. Screenshot de diseño final

**Total estimado:** 5.5 días de desarrollo

---

## 11. MÉTRICAS DE ÉXITO

### 11.1 Cuantitativas

- **Reducción de scroll:** De ~4000px a ~1500px (62% reducción)
- **Tiempo de búsqueda:** De 8 clicks promedio a 3 clicks (62% reducción)
- **Carga cognitiva:** De 6 secciones simultáneas a 1 sección enfocada
- **Tiempo de navegación:** < 0.5s entre tabs

### 11.2 Cualitativas

- **Feedback de usuarios:** Encuesta post-implementación
- **Reducción de errores:** Menos datos guardados en sección incorrecta
- **Satisfacción:** Escala Likert 1-5 (objetivo: 4.5+)

---

## 12. CONSIDERACIONES FUTURAS (v2)

### 12.1 Sidebar de Navegación Rápida

```
┌────┬─────────────────────────────────────┐
│    │ [HEADER FIJO]                       │
│ S  ├─────────────────────────────────────┤
│ I  │ [TABS]                              │
│ D  ├─────────────────────────────────────┤
│ E  │                                     │
│ B  │ [CONTENIDO]                         │
│ A  │                                     │
│ R  │                                     │
│    │                                     │
└────┴─────────────────────────────────────┘
```

**Contenido de sidebar:**
- Mini-mapa de secciones
- Indicadores de completitud
- Atajos rápidos
- Solo visible en desktop > 1280px

### 12.2 Vista Split de Sesiones

- Tab "Evolución" con split view:
  - Izquierda: Lista de sesiones
  - Derecha: Detalle expandido
- Solo en desktop > 1024px

### 12.3 Templates de Historia Clínica

- Guardar estado completo como template
- Aplicar template a paciente nuevo
- Útil para procedimientos recurrentes

### 12.4 Modo Compacto/Expandido

- Toggle en header para cambiar densidad
- Modo compacto: padding reducido, fuentes más pequeñas
- Útil en pantallas pequeñas

---

## APÉNDICE A: Wireframes ASCII

### Vista Desktop (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Nueva] [Guardar] [Imprimir]           [Buscar] [Cartera] [Theme]   │
├──────────────────────────────────────────────────────────────────────┤
│  📋 Juan Pérez Gómez · CI: 1234567890 · 35 años · Tel: 099123456    │
│      [Alergia] Penicilina                             [Editar datos] │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  [🩺 Clínico✓]  [📊 Evolución(3)]  [💰 Finanzas($150)]  [📎 Adjuntos(5)]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  MOTIVO DE CONSULTA                                                  │
│  ┌──────────────────┐  ┌────────────────────────────────────────┐   │
│  │ [Dolor      ▾]   │  │ Dolor en molar superior derecho...     │   │
│  └──────────────────┘  └────────────────────────────────────────┘   │
│                                                                       │
│  ODONTOGRAMA                                                         │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  18  17  16  15  14  13  12  11  │  21  22  23  24  25  26  27  28 │
│  │  [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] │ [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] │
│  │  [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] │ [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] [🦷] │
│  │  48  47  46  45  44  43  42  41  │  31  32  33  34  35  36  37  38 │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  DIAGNÓSTICO                                                         │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Diente 16: Caries profunda                                  │     │
│  │ Diente 26: Endodoncia pendiente                             │     │
│  │                                                              │     │
│  │ + [Agregar notas adicionales...]                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Vista Mobile (375px)

```
┌─────────────────────────────┐
│ [≡] Oklus         [🔍] [☰] │
├─────────────────────────────┤
│ 📋 Juan Pérez               │
│    CI: 1234567890           │
│    ⚠️ Alergia               │
├─────────────────────────────┤
│ ← [🩺] [📊] [💰] [📎] →      │
├─────────────────────────────┤
│                             │
│ MOTIVO DE CONSULTA          │
│ [Dolor            ▾]        │
│ ┌─────────────────────────┐ │
│ │ Detalle...              │ │
│ └─────────────────────────┘ │
│                             │
│ ODONTOGRAMA                 │
│ ← [Superior] [Inferior] →   │
│ ┌─────────────────────────┐ │
│ │ 18 17 16 15 14 13 12 11│ │
│ │ [🦷][🦷][🦷][🦷][🦷][🦷][🦷][🦷]│ │
│ └─────────────────────────┘ │
│                             │
│ [Guardar cambios]           │
│                             │
└─────────────────────────────┘
```

---

## APÉNDICE B: Paleta de Colores

```css
/* Variables HSL (ya definidas en index.css) */
:root {
  /* Neutrales */
  --background: 220 18% 97%;
  --foreground: 222 47% 11%;
  --muted: 220 16% 92%;
  --border: 220 13% 85%;

  /* Brand */
  --brand: 217 91% 60%;        /* Azul primario */

  /* Semánticos */
  --success: 142 71% 45%;      /* Verde */
  --warning: 38 92% 50%;       /* Amarillo */
  --danger: 0 84% 60%;         /* Rojo */
  --info: 199 89% 48%;         /* Azul cielo */
}

/* Tabs específicos */
.tab-clinico { color: hsl(199 89% 48%); }     /* Info blue */
.tab-evolucion { color: hsl(142 71% 45%); }   /* Success green */
.tab-finanzas { color: hsl(38 92% 50%); }     /* Warning amber */
.tab-adjuntos { color: hsl(217 91% 60%); }    /* Brand blue */
```

---

## CONCLUSIÓN

Este diseño con pestañas ofrece:

✅ **Mejor organización** - Información agrupada semánticamente
✅ **Menos scroll** - Reducción de 62% en altura vertical
✅ **Navegación rápida** - Shortcuts y tabs accesibles
✅ **Escalabilidad** - Fácil agregar nuevas secciones
✅ **Accesibilidad** - WCAG 2.1 AA compliant
✅ **Responsive** - Funciona en todos los dispositivos
✅ **Performance** - Lazy loading de componentes pesados

**Siguiente paso:** Implementar prototipo funcional en `PatientsPage.tsx`
