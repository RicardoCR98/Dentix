-- ============================================================================
-- OKLUS - SCHEMA 001
-- ============================================================================
-- Arquitectura: Tauri + SQLite (offline-first)
-- Filosofía:
--  - SNAPSHOTS INMUTABLES en sessions
--  - TRIADA mínima de cobros vive en patients (operacional)
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 10000;
PRAGMA synchronous = NORMAL;

-- =========================
-- DOCTOR PROFILE
-- =========================
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

-- =========================
-- PATIENTS (+ TRIADA)
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
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

  debt_opened_at    TEXT,                        -- se setea con session.date cuando abre deuda
  debt_archived     INTEGER NOT NULL DEFAULT 0,  -- 0=activo, 1=archivado
  debt_archived_at  TEXT,
  last_contact_at   TEXT,                        -- se setea al abrir WhatsApp/llamada
  last_contact_type TEXT                         -- 'whatsapp' | 'call' | 'email' | 'in_person'
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

-- =========================
-- PAYMENT METHODS (Catalog)
-- =========================
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

-- =========================
-- SESSIONS (SNAPSHOTS)
-- =========================
CREATE TABLE IF NOT EXISTS sessions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id           INTEGER NOT NULL,
  date                 TEXT NOT NULL,

  -- MOTIVO (snapshot)
  reason_type          TEXT,
  reason_detail        TEXT,

  -- CLÍNICO (snapshots)
  diagnosis_text       TEXT,
  auto_dx_text         TEXT,
  full_dx_text         TEXT,
  tooth_dx_json        TEXT,
  clinical_notes       TEXT,
  signer               TEXT,                 -- snapshot: nombre del doctor que firmó

  -- FINANCIERO (snapshot / calculados por app)
  budget               REAL NOT NULL DEFAULT 0,
  discount             REAL NOT NULL DEFAULT 0,
  payment              REAL NOT NULL DEFAULT 0,
  balance              REAL NOT NULL DEFAULT 0,
  cumulative_balance   REAL NOT NULL DEFAULT 0,
  payment_method_id    INTEGER,
  payment_notes        TEXT,

  -- METADATA
  is_saved             INTEGER NOT NULL DEFAULT 0, -- 0=borrador, 1=guardado inmutable
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

-- =========================
-- PROCEDURE TEMPLATES (Catalog)
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

CREATE TRIGGER IF NOT EXISTS trg_procedure_templates_updated_at
AFTER UPDATE ON procedure_templates
FOR EACH ROW
BEGIN
  UPDATE procedure_templates SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- =========================
-- SESSION ITEMS (SNAPSHOT)
-- =========================
CREATE TABLE IF NOT EXISTS session_items (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id              INTEGER NOT NULL,

  -- FACTURACIÓN (snapshot)
  name                    TEXT NOT NULL,
  unit_price              REAL NOT NULL,
  quantity                INTEGER NOT NULL DEFAULT 1,
  subtotal                REAL NOT NULL,
  is_active               INTEGER NOT NULL DEFAULT 1, -- 1=cuenta en presupuesto, 0=inactivo

  -- METADATA CLÍNICA (opcional)
  tooth_number            TEXT,
  procedure_notes         TEXT,

  -- Trazabilidad (opcional)
  procedure_template_id   INTEGER,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (procedure_template_id) REFERENCES procedure_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_session_items_session ON session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_session_items_active ON session_items(is_active);

-- =========================
-- ATTACHMENTS
-- =========================
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

-- =========================
-- SIGNERS (Catalog)
-- =========================
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

-- =========================
-- DIAGNOSIS OPTIONS (Catalog)
-- =========================
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

-- =========================
-- REASON TYPES (Catalog)
-- =========================
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

-- =========================
-- USER SETTINGS
-- =========================
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

-- =========================
-- TEXT TEMPLATES
-- =========================
CREATE TABLE IF NOT EXISTS text_templates (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  kind         TEXT NOT NULL,                -- diagnosis | clinical_notes | reason_detail | procedure_notes
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  tags         TEXT,
  source       TEXT NOT NULL DEFAULT 'system', -- system | user
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

-- =========================
-- TELEMETRY EVENTS (Offline buffer)
-- =========================
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

-- =========================
-- ERROR LOGS
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

CREATE INDEX IF NOT EXISTS idx_error_logs_flush ON error_logs(sent, timestamp);

-- =========================
-- SYNC QUEUE (CDC casero)
-- =========================
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

-- =========================
-- SEEDS (mínimos)
-- =========================
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

INSERT OR IGNORE INTO signers (name) VALUES
  ('Dr. Ejemplo 1'),
  ('Dra. Ejemplo 2');

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

INSERT OR IGNORE INTO reason_types (name, sort_order) VALUES
  ('Dolor', 1),
  ('Control', 2),
  ('Emergencia', 3),
  ('Estética', 4),
  ('Otro', 5);

INSERT OR IGNORE INTO payment_methods (name, sort_order) VALUES
  ('Efectivo', 1),
  ('Transferencia bancaria', 2),
  ('Tarjeta débito', 3),
  ('Otro', 4);

INSERT OR IGNORE INTO user_settings (key, value, category) VALUES
  ('theme', 'dark', 'appearance'),
  ('brandHsl', '172 49% 56%', 'appearance'),
  ('font', 'Inter', 'appearance'),
  ('size', '16', 'appearance'),
  ('layoutMode', 'vertical', 'appearance');

-- Seeds mínimos de text_templates
INSERT OR IGNORE INTO text_templates (kind, title, body, source, sort_order) VALUES
  ('diagnosis', 'Caries extensa', 'Se observa caries extensa en pieza dental, requiere tratamiento de endodoncia', 'system', 1),
  ('diagnosis', 'Fractura coronaria', 'Fractura coronaria severa. Se recomienda extracción y posterior rehabilitación protésica', 'system', 2),
  ('clinical_notes', 'Procedimiento rutinario', 'Procedimiento realizado sin complicaciones. Paciente tolera bien la intervención', 'system', 1),
  ('clinical_notes', 'Recomendaciones post-operatorias', 'Se dan indicaciones de cuidados post-operatorios. Control en 7 días', 'system', 2),
  ('reason_detail', 'Dolor agudo', 'Paciente refiere dolor agudo en cuadrante superior derecho, intensidad 8/10', 'system', 1),
  ('procedure_notes', 'Anestesia aplicada', 'Se aplica anestesia local. Paciente responde favorablemente', 'system', 1);
