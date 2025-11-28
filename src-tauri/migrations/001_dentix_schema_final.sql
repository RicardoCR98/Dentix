-- =========================
-- DENTIX - SCHEMA FINAL
-- =========================
-- Arquitectura: Tauri + SQLite (mono-doctor, offline-first)
-- Decisiones: Desnormalización intencional, un solo punto de escritura para cálculos
-- =========================

PRAGMA foreign_keys = ON;

-- =========================
-- DOCTOR PROFILE (Info única del doctor)
-- =========================
CREATE TABLE IF NOT EXISTS doctor_profile (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id             TEXT UNIQUE NOT NULL,     -- UUID global para sync
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

-- =========================
-- PATIENTS
-- =========================
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
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_patients_doc_id ON patients(doc_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- =========================
-- VISITS (Corazón de la app)
-- =========================
-- DECISIÓN: Desnormalizado intencionalmente
-- - reason_type: guardamos el TEXT como está hoy (snapshot)
-- - signer: guardamos el nombre como está hoy (snapshot)
-- - diagnosis, odontograma: guardamos snapshots (no cambian retroactivamente)
-- - balance/cumulative_balance: calculados por servicio centralizado
-- =========================
CREATE TABLE IF NOT EXISTS visits (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id           INTEGER NOT NULL,
  date                 TEXT NOT NULL,

  -- Motivo de consulta (snapshot del catálogo)
  reason_type          TEXT,              -- Ej: "Dolor", "Control" (copia, no FK)
  reason_detail        TEXT,

  -- Diagnósticos (snapshots)
  diagnosis_text       TEXT,
  auto_dx_text         TEXT,
  full_dx_text         TEXT,

  -- Odontograma (JSON snapshot)
  -- Formato: {"11": ["Caries", "Sensibilidad"], "12": ["Obturación"]}
  tooth_dx_json        TEXT,

  -- Financiero
  -- REGLA: Solo se actualizan desde servicio_financiero() en Rust
  budget               REAL NOT NULL DEFAULT 0,
  discount             REAL NOT NULL DEFAULT 0,
  payment              REAL NOT NULL DEFAULT 0,
  balance              REAL NOT NULL DEFAULT 0,      -- budget - discount - payment
  cumulative_balance   REAL NOT NULL DEFAULT 0,      -- suma de balances previos

  -- Responsable (snapshot)
  signer               TEXT,              -- Nombre del doctor que firmó (copia)

  -- Notas y control
  observations         TEXT,
  is_saved             INTEGER DEFAULT 0,            -- Sesión histórica o en progreso

  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_saved ON visits(is_saved);

-- =========================
-- VISIT PROCEDURES (Procedimientos por visita)
-- =========================
-- DECISIÓN: Desnormalizado
-- - name: guardamos el nombre como fue cobrado (snapshot)
-- - unit_price: precio ese día (no cambia si cambia el catálogo)
-- - procedure_template_id: opcional, para auditoría (saber de dónde vino)
-- =========================
CREATE TABLE IF NOT EXISTS visit_procedures (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id                INTEGER NOT NULL,
  name                    TEXT NOT NULL,             -- Snapshot: nombre al momento
  unit_price              REAL NOT NULL,             -- Snapshot: precio ese día
  quantity                INTEGER NOT NULL,
  subtotal                REAL NOT NULL,             -- unit_price * quantity
  procedure_template_id   INTEGER,                   -- Opcional: ref para auditoría
  sort_order              INTEGER DEFAULT 0,
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (procedure_template_id) REFERENCES procedure_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_visit_procedures_visit ON visit_procedures(visit_id);

-- =========================
-- ATTACHMENTS (Radiografías, fotos, documentos)
-- =========================
-- visit_id puede ser NULL: adjuntos solo del paciente (radiografía general, consentimientos)
-- =========================
CREATE TABLE IF NOT EXISTS attachments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id   INTEGER NOT NULL,
  visit_id     INTEGER,                  -- NULL = adjunto general del paciente
  kind         TEXT,                     -- "xray", "photo", "consent_form", "document"
  filename     TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,         -- Claridad: bytes del archivo
  storage_key  TEXT NOT NULL,            -- p_{id}/YYYY/MM/filename
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_patient ON attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_visit ON attachments(visit_id);

-- =========================
-- PROCEDURE TEMPLATES (Catálogo de procedimientos)
-- =========================
CREATE TABLE IF NOT EXISTS procedure_templates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  default_price REAL NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_procedure_templates_active ON procedure_templates(active);

-- =========================
-- SIGNERS (Doctores/responsables que firman)
-- =========================
CREATE TABLE IF NOT EXISTS signers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_signers_active ON signers(active);

-- =========================
-- DIAGNOSIS OPTIONS (Opciones de diagnóstico para odontograma)
-- =========================
CREATE TABLE IF NOT EXISTS diagnosis_options (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL UNIQUE,      -- Ej: "Caries", "Gingivitis"
  color      TEXT NOT NULL DEFAULT 'info',
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_options_active ON diagnosis_options(active);
CREATE INDEX IF NOT EXISTS idx_diagnosis_options_sort_order ON diagnosis_options(sort_order);

-- =========================
-- REASON TYPES (Motivos de consulta)
-- =========================
CREATE TABLE IF NOT EXISTS reason_types (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,      -- Ej: "Dolor", "Control", "Emergencia"
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reason_types_active ON reason_types(active);
CREATE INDEX IF NOT EXISTS idx_reason_types_sort_order ON reason_types(sort_order);

-- =========================
-- USER SETTINGS (Configuración de la app)
-- =========================
CREATE TABLE IF NOT EXISTS user_settings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL,
  category   TEXT NOT NULL,             -- "appearance", "sync", "notification"
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(key);
CREATE INDEX IF NOT EXISTS idx_user_settings_category ON user_settings(category);

-- =========================
-- TELEMETRY EVENTS (Buffer offline de eventos)
-- =========================
-- REGLA: Validación JSON en aplicación
-- Formato evento_data: {"event": "...", "patient_id": ..., ...}
-- =========================
CREATE TABLE IF NOT EXISTS telemetry_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id       TEXT NOT NULL,
  event_type      TEXT NOT NULL,        -- "patient_created", "visit_saved", etc.
  event_data      TEXT NOT NULL,        -- JSON válido (validado en app)
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  sent            INTEGER DEFAULT 0,
  sent_at         TEXT,

  FOREIGN KEY (doctor_id) REFERENCES doctor_profile(doctor_id) ON DELETE CASCADE
);

-- Índice para flushing rápido (WHERE sent=0 ORDER BY timestamp)
CREATE INDEX IF NOT EXISTS idx_telemetry_flush ON telemetry_events(sent, timestamp);
CREATE INDEX IF NOT EXISTS idx_telemetry_doctor ON telemetry_events(doctor_id);

-- =========================
-- ERROR LOGS (Errores para debugging remoto)
-- =========================
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

-- Índice para flushing rápido
CREATE INDEX IF NOT EXISTS idx_error_logs_flush ON error_logs(sent, timestamp);

-- =========================
-- SYNC QUEUE (CDC casero - Change Data Capture)
-- =========================
-- REGLA:
-- - operation: "INSERT", "UPDATE", "DELETE"
-- - data: JSON con estado COMPLETO del registro DESPUÉS de la op
-- - En DELETE: último estado conocido
-- =========================
CREATE TABLE IF NOT EXISTS sync_queue (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name      TEXT NOT NULL,        -- "patients", "visits", "attachments", etc.
  record_id       INTEGER NOT NULL,
  operation       TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data            TEXT NOT NULL,        -- JSON completo del registro
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  sent            INTEGER DEFAULT 0,
  sent_at         TEXT
);

-- Índice para flushing rápido
CREATE INDEX IF NOT EXISTS idx_sync_queue_flush ON sync_queue(sent, timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);

-- =========================
-- TRIGGERS para updated_at
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_doctor_profile_updated_at
AFTER UPDATE ON doctor_profile
FOR EACH ROW
BEGIN
  UPDATE doctor_profile SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_patients_updated_at
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
  UPDATE patients SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_visits_updated_at
AFTER UPDATE ON visits
FOR EACH ROW
BEGIN
  UPDATE visits SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_procedure_templates_updated_at
AFTER UPDATE ON procedure_templates
FOR EACH ROW
BEGIN
  UPDATE procedure_templates SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_signers_updated_at
AFTER UPDATE ON signers
FOR EACH ROW
BEGIN
  UPDATE signers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_diagnosis_options_updated_at
AFTER UPDATE ON diagnosis_options
FOR EACH ROW
BEGIN
  UPDATE diagnosis_options SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_reason_types_updated_at
AFTER UPDATE ON reason_types
FOR EACH ROW
BEGIN
  UPDATE reason_types SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_user_settings_updated_at
AFTER UPDATE ON user_settings
FOR EACH ROW
BEGIN
  UPDATE user_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- =========================
-- DATOS INICIALES
-- =========================

-- Plantillas de Procedimientos
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

-- Firmantes por defecto
INSERT OR IGNORE INTO signers (name) VALUES
  ('Dr. Ejemplo 1'),
  ('Dra. Ejemplo 2');

-- Opciones de Diagnóstico
INSERT OR IGNORE INTO diagnosis_options (label, color, sort_order) VALUES
  ('Caries', 'danger', 1),
  ('Gingivitis', 'warning', 2),
  ('Fractura', 'danger', 3),
  ('Pérdida', 'secondary', 4),
  ('Obturación', 'success', 5),
  ('Endodoncia', 'info', 6);

-- Motivos de Consulta
INSERT OR IGNORE INTO reason_types (name, sort_order) VALUES
  ('Dolor', 1),
  ('Control', 2),
  ('Emergencia', 3),
  ('Estética', 4),
  ('Otro', 5);

-- Configuración por defecto
INSERT OR IGNORE INTO user_settings (key, value, category) VALUES
  ('theme', 'dark', 'appearance'),
  ('brandHsl', '172 49% 56%', 'appearance'),
  ('font', 'Inter', 'appearance'),
  ('size', '16', 'appearance');
