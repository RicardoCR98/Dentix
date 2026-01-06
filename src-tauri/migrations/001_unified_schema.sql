-- ============================================================================
-- OKLUS - UNIFIED SCHEMA v1.0
-- ============================================================================
-- Arquitectura: Tauri + SQLite (offline-first)
-- Descripción: Esquema unificado que combina todas las migraciones anteriores
-- Fecha: 2026-01-06
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 10000;
PRAGMA synchronous = NORMAL;

-- ============================================================================
-- DOCTOR PROFILE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctor_profile (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id             TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  email                 TEXT UNIQUE NOT NULL,
  clinic_name           TEXT NOT NULL,
  clinic_hours          TEXT,
  clinic_slogan         TEXT,
  phone                 TEXT,
  location              TEXT,
  app_version           TEXT,
  agreed_to_terms       INTEGER DEFAULT 0,
  last_sync             TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_doctor_profile_updated_at
AFTER UPDATE ON doctor_profile
FOR EACH ROW
BEGIN
  UPDATE doctor_profile SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- PATIENTS (+ TRIADA: debt tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name       TEXT NOT NULL,
  doc_id          TEXT UNIQUE NOT NULL,
  email           TEXT,
  phone           TEXT NOT NULL,
  emergency_phone TEXT,
  date_of_birth   TEXT NOT NULL,
  anamnesis       TEXT,
  allergy_detail  TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

  -- Debt tracking (TRIADA)
  debt_opened_at    TEXT,
  debt_archived     INTEGER NOT NULL DEFAULT 0,
  debt_archived_at  TEXT,
  last_contact_at   TEXT,
  last_contact_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_patients_doc_id ON patients(doc_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_debt_archived ON patients(debt_archived);
CREATE INDEX IF NOT EXISTS idx_patients_debt_opened_at ON patients(debt_opened_at);
CREATE INDEX IF NOT EXISTS idx_patients_last_contact_at ON patients(last_contact_at);

CREATE TRIGGER IF NOT EXISTS trg_patients_updated_at
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
  UPDATE patients SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- PAYMENT METHODS (Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_sort_order ON payment_methods(sort_order);

CREATE TRIGGER IF NOT EXISTS trg_payment_methods_updated_at
AFTER UPDATE ON payment_methods
FOR EACH ROW
BEGIN
  UPDATE payment_methods SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- SESSIONS (SNAPSHOTS) - Clinical and financial records
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id           INTEGER NOT NULL,
  date                 TEXT NOT NULL,

  -- Reason (snapshot)
  reason_type          TEXT,
  reason_detail        TEXT,

  -- Clinical data (snapshots)
  diagnosis_text       TEXT,
  auto_dx_text         TEXT,
  full_dx_text         TEXT,
  tooth_dx_json        TEXT,
  clinical_notes       TEXT,
  signer               TEXT,

  -- Financial (snapshot/calculated by app)
  budget               REAL NOT NULL DEFAULT 0,
  discount             REAL NOT NULL DEFAULT 0,
  payment              REAL NOT NULL DEFAULT 0,
  balance              REAL NOT NULL DEFAULT 0,
  cumulative_balance   REAL NOT NULL DEFAULT 0,
  payment_method_id    INTEGER,
  payment_notes        TEXT,

  -- Metadata
  is_saved             INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_saved ON sessions(is_saved);

CREATE TRIGGER IF NOT EXISTS trg_sessions_updated_at
AFTER UPDATE ON sessions
FOR EACH ROW
BEGIN
  UPDATE sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- PROCEDURE TEMPLATES (Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS procedure_templates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  default_price REAL NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_procedure_templates_active ON procedure_templates(active);

CREATE TRIGGER IF NOT EXISTS trg_procedure_templates_updated_at
AFTER UPDATE ON procedure_templates
FOR EACH ROW
BEGIN
  UPDATE procedure_templates SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- SESSION ITEMS (SNAPSHOT) - Procedure line items
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_items (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id              INTEGER NOT NULL,

  -- Billing (snapshot)
  name                    TEXT NOT NULL,
  unit_price              REAL NOT NULL,
  quantity                INTEGER NOT NULL DEFAULT 1,
  subtotal                REAL NOT NULL,
  is_active               INTEGER NOT NULL DEFAULT 1,

  -- Clinical metadata (optional)
  tooth_number            TEXT,
  procedure_notes         TEXT,

  -- Traceability (optional)
  procedure_template_id   INTEGER,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (procedure_template_id) REFERENCES procedure_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_session_items_session ON session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_session_items_active ON session_items(is_active);

-- ============================================================================
-- ATTACHMENTS (Files metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attachments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id   INTEGER NOT NULL,
  session_id   INTEGER,
  kind         TEXT,
  filename     TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  storage_key  TEXT NOT NULL,
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_patient ON attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_session ON attachments(session_id);

-- ============================================================================
-- SIGNERS (Catalog) - Doctors/dentists list
-- ============================================================================
CREATE TABLE IF NOT EXISTS signers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_signers_active ON signers(active);

CREATE TRIGGER IF NOT EXISTS trg_signers_updated_at
AFTER UPDATE ON signers
FOR EACH ROW
BEGIN
  UPDATE signers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- DIAGNOSIS OPTIONS (Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnosis_options (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT 'info',
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_options_active ON diagnosis_options(active);
CREATE INDEX IF NOT EXISTS idx_diagnosis_options_sort_order ON diagnosis_options(sort_order);

CREATE TRIGGER IF NOT EXISTS trg_diagnosis_options_updated_at
AFTER UPDATE ON diagnosis_options
FOR EACH ROW
BEGIN
  UPDATE diagnosis_options SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- REASON TYPES (Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reason_types (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reason_types_active ON reason_types(active);
CREATE INDEX IF NOT EXISTS idx_reason_types_sort_order ON reason_types(sort_order);

CREATE TRIGGER IF NOT EXISTS trg_reason_types_updated_at
AFTER UPDATE ON reason_types
FOR EACH ROW
BEGIN
  UPDATE reason_types SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- USER SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL,
  category   TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(key);
CREATE INDEX IF NOT EXISTS idx_user_settings_category ON user_settings(category);

CREATE TRIGGER IF NOT EXISTS trg_user_settings_updated_at
AFTER UPDATE ON user_settings
FOR EACH ROW
BEGIN
  UPDATE user_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- TEXT TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS text_templates (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  kind         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  tags         TEXT,
  source       TEXT NOT NULL DEFAULT 'system',
  is_favorite  INTEGER NOT NULL DEFAULT 0,
  active       INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_kind_active ON text_templates(kind, active);
CREATE INDEX IF NOT EXISTS idx_templates_favorite ON text_templates(is_favorite);
CREATE INDEX IF NOT EXISTS idx_templates_source ON text_templates(source);

CREATE TRIGGER IF NOT EXISTS trg_text_templates_updated_at
AFTER UPDATE ON text_templates
FOR EACH ROW
BEGIN
  UPDATE text_templates SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- TELEMETRY EVENTS (Offline buffer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS telemetry_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id       TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  event_data      TEXT NOT NULL,
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  sent            INTEGER DEFAULT 0,
  sent_at         TEXT,

  FOREIGN KEY (doctor_id) REFERENCES doctor_profile(doctor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_telemetry_flush ON telemetry_events(sent, timestamp);
CREATE INDEX IF NOT EXISTS idx_telemetry_doctor ON telemetry_events(doctor_id);

-- ============================================================================
-- ERROR LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id       TEXT NOT NULL,
  error_message   TEXT NOT NULL,
  stack_trace     TEXT,
  app_version     TEXT,
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  sent            INTEGER DEFAULT 0,
  sent_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_error_logs_flush ON error_logs(sent, timestamp);

-- ============================================================================
-- SYNC QUEUE (CDC casero)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name      TEXT NOT NULL,
  record_id       INTEGER NOT NULL,
  operation       TEXT NOT NULL,
  data            TEXT NOT NULL,
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  sent            INTEGER DEFAULT 0,
  sent_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_flush ON sync_queue(sent, timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);

-- ============================================================================
-- APPOINTMENTS (from migration 002)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id           INTEGER NOT NULL,

  -- Scheduling (ISO 8601)
  starts_at            TEXT NOT NULL,
  ends_at              TEXT NOT NULL,

  -- Appointment details
  procedure            TEXT NOT NULL,
  notes                TEXT,

  -- Status tracking
  status               TEXT NOT NULL DEFAULT 'scheduled',
  confirmed_at         TEXT,

  -- Reminder tracking
  reminder_1d_sent_at  TEXT,

  -- Metadata
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_appointments_date_range ON appointments(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_reminders ON appointments(reminder_1d_sent_at, status);
CREATE INDEX IF NOT EXISTS idx_appointments_overlap ON appointments(starts_at, ends_at, status);

CREATE TRIGGER IF NOT EXISTS trg_appointments_updated_at
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
  UPDATE appointments SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- MESSAGE QUEUE (from migration 003)
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_queue (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id          INTEGER NOT NULL,
  appointment_id      INTEGER,

  -- Message details
  type                TEXT NOT NULL,
  message_text        TEXT NOT NULL,

  -- Status tracking
  status              TEXT NOT NULL DEFAULT 'pending',
  sent_at             TEXT,

  -- Metadata
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_message_queue_patient ON message_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_appointment ON message_queue(appointment_id);

-- ============================================================================
-- INFORMED CONSENTS (from migration 005)
-- ============================================================================
CREATE TABLE IF NOT EXISTS informed_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  visit_id INTEGER,
  procedure_type TEXT NOT NULL,
  procedure_name TEXT,
  consent_template TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  signed_by TEXT NOT NULL,
  signed_at TEXT NOT NULL,
  witness_name TEXT,
  witness_signature TEXT,
  doctor_name TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_consents_patient ON informed_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_visit ON informed_consents(visit_id);
CREATE INDEX IF NOT EXISTS idx_consents_signed_at ON informed_consents(signed_at);
CREATE INDEX IF NOT EXISTS idx_consents_procedure_type ON informed_consents(procedure_type);

-- ============================================================================
-- CONSENT TEMPLATES (from migration 005)
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  procedure_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SEEDS: Default Data
-- ============================================================================

-- Procedure templates
INSERT OR IGNORE INTO procedure_templates (name, default_price) VALUES
  ('Curación', 0),
  ('Resinas simples', 0),
  ('Resinas compuestas', 0),
  ('Extracciones simples', 0),
  ('Extracciones complejas', 0),
  ('Correctivo inicial', 0),
  ('Control mensual', 0),
  ('Prótesis total', 0),
  ('Prótesis removible', 0),
  ('Prótesis fija', 0),
  ('Retenedor', 0),
  ('Endodoncia simple', 0),
  ('Endodoncia compleja', 0),
  ('Limpieza simple', 0),
  ('Limpieza compleja', 0),
  ('Reposición', 0),
  ('Pegada', 0);

-- Signers
INSERT OR IGNORE INTO signers (name) VALUES
  ('Dr. Ejemplo 1'),
  ('Dra. Ejemplo 2');

-- Diagnosis options
INSERT OR IGNORE INTO diagnosis_options (label, color, sort_order) VALUES
  ('Sano', 'success', 0),
  ('Caries', 'info', 1),
  ('Fractura', 'info', 2),
  ('Sensibilidad', 'info', 3),
  ('Obturación', 'info', 4),
  ('Corona', 'info', 5),
  ('Endodoncia', 'info', 6),
  ('Implante', 'info', 7),
  ('Ausente', 'info', 8);

-- Reason types
INSERT OR IGNORE INTO reason_types (name, sort_order) VALUES
  ('Dolor', 1),
  ('Control', 2),
  ('Emergencia', 3),
  ('Estética', 4),
  ('Otro', 5);

-- Payment methods
INSERT OR IGNORE INTO payment_methods (name, sort_order) VALUES
  ('Efectivo', 1),
  ('Transferencia bancaria', 2),
  ('Tarjeta débito', 3),
  ('Otro', 4);

-- User settings
INSERT OR IGNORE INTO user_settings (key, value, category) VALUES
  ('theme', 'light', 'appearance'),
  ('brandHsl', '172 49% 56%', 'appearance'),
  ('font', 'Inter', 'appearance'),
  ('size', '16', 'appearance'),
  ('layoutMode', 'tabs', 'appearance'),
  ('telemetry.enabled', 'true', 'telemetry'),
  ('telemetry.ga4_measurement_id', 'G-J9SZS4HVL4', 'telemetry'),
  ('telemetry.ga4_api_secret', 'KZkQhfwPRGubhNQUBUAyJw', 'telemetry');

-- Text templates: reason_detail
INSERT OR IGNORE INTO text_templates (kind, title, body, is_favorite, source, sort_order) VALUES
  ('reason_detail', 'Dolor agudo', 'Paciente {nombre} refiere dolor agudo en zona {pieza}, intensidad 8/10. Inicio hace 24h. No toma analgésicos actualmente.', 1, 'system', 1),
  ('reason_detail', 'Control de rutina', 'Control de rutina. Paciente no refiere molestias. Última visita hace 6 meses.', 1, 'system', 2),
  ('reason_detail', 'Emergencia - fractura', 'Emergencia por fractura dental traumática. Paciente refiere golpe hace 2h. Dolor moderado.', 0, 'system', 3),
  ('reason_detail', 'Sensibilidad dental', 'Paciente refiere sensibilidad dental a estímulos fríos y calientes. Molestia intermitente desde hace 1 semana.', 0, 'system', 4),
  ('reason_detail', 'Inflamación gingival', 'Paciente presenta inflamación y sangrado de encías. Refiere molestia al cepillado.', 0, 'system', 5);

-- Text templates: diagnosis
INSERT OR IGNORE INTO text_templates (kind, title, body, is_favorite, source, sort_order) VALUES
  ('diagnosis', 'Caries profunda', 'Se observa caries profunda en pieza {pieza}. Requiere tratamiento de conducto y posterior rehabilitación protésica.', 1, 'system', 1),
  ('diagnosis', 'Pulpitis irreversible', 'Diagnóstico: Pulpitis irreversible en pieza {pieza}. Respuesta positiva a pruebas térmicas. Se recomienda endodoncia.', 1, 'system', 2),
  ('diagnosis', 'Periodontitis crónica', 'Periodontitis crónica moderada. Sondaje promedio 5mm. Sangrado al sondaje positivo. Plan: raspado y alisado radicular.', 0, 'system', 3),
  ('diagnosis', 'Fractura coronaria', 'Fractura coronaria en pieza {pieza}. Compromiso pulpar. Se recomienda endodoncia y corona.', 0, 'system', 4),
  ('diagnosis', 'Absceso periapical', 'Absceso periapical agudo en pieza {pieza}. Tumefacción presente. Requiere drenaje y tratamiento de conducto.', 0, 'system', 5),
  ('diagnosis', 'Necrosis pulpar', 'Necrosis pulpar en pieza {pieza}. Sin respuesta a pruebas de vitalidad. Radiografía muestra lesión periapical.', 0, 'system', 6);

-- Text templates: clinical_notes
INSERT OR IGNORE INTO text_templates (kind, title, body, is_favorite, source, sort_order) VALUES
  ('clinical_notes', 'Primera consulta', 'Paciente: {nombre} ({edad} años). Fecha: {fecha}. Primera consulta. Se realiza examen clínico completo y se explica plan de tratamiento. Paciente comprende y acepta. Se programa próxima cita.', 1, 'system', 1),
  ('clinical_notes', 'Consentimiento obtenido', 'Se explican riesgos y beneficios del procedimiento. Paciente comprende y firma consentimiento informado. Se resuelven dudas.', 1, 'system', 2),
  ('clinical_notes', 'Control post-operatorio', 'Control post-operatorio. Paciente evoluciona favorablemente. No refiere dolor ni complicaciones. Se dan indicaciones de cuidado. Próximo control en 7 días.', 1, 'system', 3),
  ('clinical_notes', 'Procedimiento sin complicaciones', 'Procedimiento realizado sin complicaciones. Paciente tolera bien la intervención. Se dan indicaciones post-operatorias.', 0, 'system', 4),
  ('clinical_notes', 'Seguimiento de tratamiento', 'Paciente en seguimiento de tratamiento iniciado el {fecha}. Evolución favorable. Se continúa según plan establecido.', 0, 'system', 5);

-- Text templates: procedure_notes
INSERT OR IGNORE INTO text_templates (kind, title, body, is_favorite, source, sort_order) VALUES
  ('procedure_notes', 'Endodoncia estándar', 'Endodoncia en pieza {pieza}. Anestesia local. Aislamiento con dique de goma. Instrumentación y obturación de conductos. Paciente tolera bien el procedimiento. Se dan indicaciones post-operatorias.', 1, 'system', 1),
  ('procedure_notes', 'Resina compuesta', 'Resina compuesta en pieza {pieza}. Anestesia local. Remoción de tejido careado. Restauración con resina A3. Ajuste oclusal. Resultado estético satisfactorio.', 1, 'system', 2),
  ('procedure_notes', 'Extracción simple', 'Extracción simple de pieza {pieza}. Anestesia local efectiva. Extracción sin complicaciones. Hemostasia adecuada. Se dan indicaciones post-operatorias: frío local, analgésicos, dieta blanda.', 1, 'system', 3),
  ('procedure_notes', 'Limpieza dental', 'Profilaxis completa. Remoción de cálculo supra y subgingival. Pulido con pasta profiláctica. Se refuerzan técnicas de higiene oral.', 0, 'system', 4),
  ('procedure_notes', 'Corona provisional', 'Preparación de pieza {pieza} para corona. Tallado conservador. Toma de impresión. Colocación de corona provisional. Cita para prueba de metal.', 0, 'system', 5),
  ('procedure_notes', 'Curetaje periodontal', 'Raspado y alisado radicular en sextante {pieza}. Anestesia local. Remoción de cálculo subgingival. Irrigación con clorhexidina. Control en 2 semanas.', 0, 'system', 6);

-- Text templates: payment_notes
INSERT OR IGNORE INTO text_templates (kind, title, body, is_favorite, source, sort_order) VALUES
  ('payment_notes', 'Pago en efectivo', 'Pago recibido en efectivo. Monto: {monto}. Fecha: {fecha}.', 1, 'system', 1),
  ('payment_notes', 'Transferencia bancaria', 'Pago recibido vía transferencia bancaria. Monto: {monto}. Referencia: [pendiente]. Fecha: {fecha}.', 1, 'system', 2),
  ('payment_notes', 'Tarjeta débito/crédito', 'Pago recibido con tarjeta. Monto: {monto}. Últimos 4 dígitos: [pendiente]. Fecha: {fecha}.', 1, 'system', 3);

-- Text templates: whatsapp_message
INSERT OR IGNORE INTO text_templates (kind, title, body, is_favorite, source, sort_order) VALUES
  ('whatsapp_message', 'Mensaje estándar', 'Hola {nombre}. Te escribo de la clínica por tu saldo pendiente. ¿Podemos coordinar el pago?', 1, 'system', 1),
  ('whatsapp_message', 'Recordatorio amable', 'Hola {nombre}, buen día. Te recuerdo que tienes un saldo pendiente. ¿Conversamos sobre las opciones de pago?', 1, 'system', 2);

-- Consent templates
INSERT OR IGNORE INTO consent_templates (name, procedure_type, title, content) VALUES
(
  'Extracción Dental Simple',
  'extraccion',
  'CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DENTAL',
  'Yo, {paciente}, identificado(a) con cédula {cedula}, declaro que he sido informado(a) por el Dr./Dra. {doctor} sobre el procedimiento de extracción dental a realizarse.

NATURALEZA DEL PROCEDIMIENTO:
La extracción dental es un procedimiento quirúrgico menor que consiste en la remoción completa de una pieza dental de su alvéolo.

RIESGOS Y COMPLICACIONES:
He sido informado(a) de los siguientes riesgos:
• Dolor e inflamación postoperatoria
• Sangrado
• Infección
• Lesión de estructuras vecinas (nervios, dientes adyacentes)
• Comunicación oro-sinusal (en molares superiores)
• Alveolitis seca
• Fractura de instrumentos o raíces

CUIDADOS POSTOPERATORIOS:
Me comprometo a seguir las indicaciones postoperatorias:
• Morder la gasa por 30-60 minutos
• No enjuagar ni escupir por 24 horas
• Aplicar frío local
• Tomar medicamentos según prescripción
• Dieta blanda y fría
• No fumar ni consumir alcohol

AUTORIZACIÓN:
Autorizo al Dr./Dra. {doctor} a realizar el procedimiento de extracción dental, habiendo comprendido la información proporcionada y tenido la oportunidad de hacer preguntas.

Fecha: {fecha}
Procedimiento específico: {procedimiento}'
),
(
  'Endodoncia',
  'endodoncia',
  'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE CONDUCTOS (ENDODONCIA)',
  'Yo, {paciente}, identificado(a) con cédula {cedula}, declaro que he sido informado(a) por el Dr./Dra. {doctor} sobre el tratamiento de conductos a realizarse.

NATURALEZA DEL PROCEDIMIENTO:
El tratamiento de conductos (endodoncia) consiste en la remoción del tejido pulpar (nervio) del diente, limpieza, desinfección y sellado de los conductos radiculares.

RIESGOS Y COMPLICACIONES:
He sido informado(a) de los siguientes riesgos:
• Dolor e inflamación durante y después del tratamiento
• Fractura de instrumentos dentro del conducto
• Perforación de la raíz
• Fractura del diente durante o después del tratamiento
• Reacción alérgica a medicamentos
• Necesidad de retratamiento
• Posibilidad de que el tratamiento no tenga éxito
• Cambio de coloración del diente

ALTERNATIVAS DE TRATAMIENTO:
Las alternativas incluyen:
• No realizar tratamiento (evolución natural de la enfermedad)
• Extracción del diente

TRATAMIENTO POSTERIOR:
Comprendo que después del tratamiento de conductos será necesario:
• Restauración definitiva del diente (corona, resina)
• Controles radiográficos periódicos

AUTORIZACIÓN:
Autorizo al Dr./Dra. {doctor} a realizar el tratamiento de conductos, habiendo comprendido la información proporcionada.

Fecha: {fecha}
Diente a tratar: {procedimiento}'
),
(
  'Cirugía de Terceros Molares',
  'cirugia',
  'CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DE TERCEROS MOLARES (CORDALES)',
  'Yo, {paciente}, identificado(a) con cédula {cedula}, declaro que he sido informado(a) por el Dr./Dra. {doctor} sobre la cirugía de terceros molares a realizarse.

NATURALEZA DEL PROCEDIMIENTO:
La extracción quirúrgica de terceros molares (muelas del juicio) es un procedimiento que puede requerir incisión de tejidos blandos y remoción de hueso para extraer el diente.

RIESGOS Y COMPLICACIONES:
He sido informado(a) de los siguientes riesgos:
• Dolor, inflamación y hematomas postoperatorios
• Sangrado prolongado
• Infección
• Alveolitis seca (dolor intenso días después)
• Parestesia (pérdida de sensibilidad temporal o permanente) del labio, lengua o mentón
• Lesión del nervio dentario inferior
• Comunicación oro-sinusal
• Fractura mandibular (raro)
• Limitación de apertura bucal temporal
• Daño a dientes adyacentes

INDICACIONES POSTOPERATORIAS:
Me comprometo a seguir estrictamente:
• Reposo relativo las primeras 24-48 horas
• Aplicación de hielo intermitente
• Dieta líquida/blanda fría
• Higiene oral cuidadosa
• Medicación según prescripción
• No fumar ni consumir alcohol
• No realizar ejercicio físico intenso

AUTORIZACIÓN:
Autorizo al Dr./Dra. {doctor} a realizar la cirugía de extracción de terceros molares, habiendo comprendido la información.

Fecha: {fecha}
Dientes a extraer: {procedimiento}'
),
(
  'Implante Dental',
  'implante',
  'CONSENTIMIENTO INFORMADO PARA COLOCACIÓN DE IMPLANTE DENTAL',
  'Yo, {paciente}, identificado(a) con cédula {cedula}, declaro que he sido informado(a) por el Dr./Dra. {doctor} sobre el procedimiento de implante dental a realizarse.

NATURALEZA DEL PROCEDIMIENTO:
La colocación de implante dental es un procedimiento quirúrgico que consiste en insertar un tornillo de titanio en el hueso maxilar o mandibular para reemplazar la raíz de un diente perdido.

RIESGOS Y COMPLICACIONES:
He sido informado(a) de los siguientes riesgos:
• Dolor e inflamación postoperatoria
• Sangrado
• Infección
• Fallo en la osteointegración (rechazo del implante)
• Lesión del nervio dentario inferior (parestesia)
• Perforación del seno maxilar
• Fractura del implante
• Pérdida ósea periimplantaria
• Necesidad de injerto óseo adicional
• Mucositis o periimplantitis

FASES DEL TRATAMIENTO:
Comprendo que el tratamiento incluye:
1. Fase quirúrgica (colocación del implante)
2. Período de osteointegración (3-6 meses)
3. Fase protésica (colocación de la corona)

CUIDADOS Y MANTENIMIENTO:
Me comprometo a:
• Mantener excelente higiene oral
• Asistir a controles periódicos
• No fumar (aumenta riesgo de fracaso)
• Seguir indicaciones postoperatorias

AUTORIZACIÓN:
Autorizo al Dr./Dra. {doctor} a realizar la colocación de implante dental, habiendo comprendido la información.

Fecha: {fecha}
Ubicación del implante: {procedimiento}'
),
(
  'Blanqueamiento Dental',
  'estetica',
  'CONSENTIMIENTO INFORMADO PARA BLANQUEAMIENTO DENTAL',
  'Yo, {paciente}, identificado(a) con cédula {cedula}, declaro que he sido informado(a) por el Dr./Dra. {doctor} sobre el procedimiento de blanqueamiento dental a realizarse.

NATURALEZA DEL PROCEDIMIENTO:
El blanqueamiento dental es un tratamiento estético que utiliza agentes químicos (peróxido de hidrógeno o carbamida) para aclarar el color de los dientes.

RIESGOS Y EFECTOS SECUNDARIOS:
He sido informado(a) de:
• Sensibilidad dental temporal (común)
• Irritación de encías
• Resultados variables según el tipo de manchas
• No todos los dientes responden igual
• Necesidad de retoques periódicos
• No funciona en restauraciones (coronas, resinas)

CONTRAINDICACIONES:
Declaro no estar embarazada ni en período de lactancia, y no tener:
• Caries sin tratar
• Enfermedad periodontal activa
• Dientes muy sensibles
• Restauraciones extensas en dientes anteriores

COMPROMISO:
Me comprometo a:
• Evitar alimentos pigmentantes (café, té, vino) durante el tratamiento
• No fumar
• Mantener buena higiene oral
• Asistir a controles

AUTORIZACIÓN:
Autorizo al Dr./Dra. {doctor} a realizar el blanqueamiento dental, entendiendo que es un procedimiento estético y los resultados pueden variar.

Fecha: {fecha}
Tipo de blanqueamiento: {procedimiento}'
);
