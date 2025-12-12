-- =========================
-- DENTIX - SCHEMA FINAL v2.0
-- =========================
-- Fecha: 09 Diciembre 2024
-- Arquitectura: Tauri + SQLite (offline-first)
-- Decisión: Separación visual Clínica/Finanzas en UI, esquema híbrido en BD
-- =========================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 10000;
PRAGMA synchronous = NORMAL;

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
-- SESSIONS (antes "visits")
-- =========================
-- Corazón de la app: combina info clínica + financiera
-- Cada sesión representa un evento (visita clínica, pago, presupuesto, etc.)
-- =========================
CREATE TABLE IF NOT EXISTS sessions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id           INTEGER NOT NULL,
  date                 TEXT NOT NULL,

  -- MOTIVO (específico de esta sesión)
  reason_type          TEXT,              -- "Dolor", "Control", "Emergencia", "Abono a cuenta", etc.
  reason_detail        TEXT,              -- Descripción detallada del motivo

  -- CLÍNICO (snapshots para inmutabilidad)
  diagnosis_text       TEXT,              -- Diagnóstico general
  auto_dx_text         TEXT,              -- Diagnóstico auto-generado del odontograma
  full_dx_text         TEXT,              -- Diagnóstico completo (auto + manual)
  tooth_dx_json        TEXT,              -- Snapshot del odontograma: {"16": ["Caries"], "17": ["Obturación"]}
  clinical_notes       TEXT,              -- Notas clínicas del doctor (antes "observations")
  signer               TEXT,              -- Nombre del doctor que firmó (snapshot)

  -- FINANCIERO (calculados automáticamente por el sistema)
  budget               REAL NOT NULL DEFAULT 0,      -- Presupuesto total (suma de items activos)
  discount             REAL NOT NULL DEFAULT 0,      -- Descuento aplicado
  payment              REAL NOT NULL DEFAULT 0,      -- Abono/pago de esta sesión
  balance              REAL NOT NULL DEFAULT 0,      -- Saldo de esta sesión (budget - discount - payment)
  cumulative_balance   REAL NOT NULL DEFAULT 0,      -- Saldo acumulado histórico
  payment_method_id    INTEGER,                      -- FK a payment_methods
  payment_notes        TEXT,                         -- Notas específicas del pago

  -- METADATA
  is_saved             INTEGER DEFAULT 0,            -- 0 = borrador editable, 1 = guardado inmutable
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_saved ON sessions(is_saved);
CREATE INDEX IF NOT EXISTS idx_sessions_reason_type ON sessions(reason_type);

-- =========================
-- SESSION_ITEMS (antes "visit_procedures")
-- =========================
-- Items de facturación con metadata clínica opcional
-- Cada item representa un procedimiento cobrado/realizado
-- =========================
CREATE TABLE IF NOT EXISTS session_items (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id              INTEGER NOT NULL,

  -- FACTURACIÓN (snapshots - precio del día)
  name                    TEXT NOT NULL,             -- Nombre del procedimiento (snapshot de template)
  unit_price              REAL NOT NULL,             -- Precio unitario ese día (snapshot)
  quantity                INTEGER NOT NULL,          -- Cantidad realizada
  subtotal                REAL NOT NULL,             -- unit_price * quantity (calculado)
  is_active               INTEGER NOT NULL DEFAULT 1, -- 1 = cuenta para presupuesto, 0 = inactivo

  -- METADATA CLÍNICA (opcional)
  tooth_number            TEXT,                      -- En qué diente se aplicó (ej: "16", "11-12")
  procedure_notes         TEXT,                      -- Notas específicas del procedimiento

  -- AUDITORÍA
  procedure_template_id   INTEGER,                   -- Referencia a plantilla (opcional, para tracking)
  sort_order              INTEGER DEFAULT 0,         -- Orden de visualización
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (procedure_template_id) REFERENCES procedure_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_session_items_session ON session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_session_items_active ON session_items(is_active);

-- =========================
-- ATTACHMENTS (Radiografías, fotos, documentos)
-- =========================
-- Archivos adjuntos del paciente
-- session_id puede ser NULL (adjuntos generales no vinculados a sesión específica)
-- =========================
CREATE TABLE IF NOT EXISTS attachments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id   INTEGER NOT NULL,
  session_id   INTEGER,                  -- NULL = adjunto general del paciente
  kind         TEXT,                     -- "xray", "photo", "consent_form", "document"
  filename     TEXT NOT NULL,            -- Nombre del archivo original
  mime_type    TEXT NOT NULL,            -- Tipo MIME (image/jpeg, application/pdf, etc.)
  size_bytes   INTEGER NOT NULL,         -- Tamaño del archivo en bytes
  storage_key  TEXT NOT NULL,            -- Ruta relativa: p_{id}/YYYY/MM/timestamp_filename
  note         TEXT,                     -- Nota/descripción del adjunto
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_patient ON attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_session ON attachments(session_id);

-- =========================
-- PROCEDURE_TEMPLATES (Catálogo global de procedimientos)
-- =========================
-- Plantilla reutilizable de procedimientos
-- Los precios aquí son valores por defecto, el precio real se guarda en session_items
-- =========================
CREATE TABLE IF NOT EXISTS procedure_templates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,    -- Nombre del procedimiento (ej: "Endodoncia")
  default_price REAL NOT NULL DEFAULT 0, -- Precio por defecto (sugerido)
  active        INTEGER NOT NULL DEFAULT 1, -- 1 = activo, 0 = desactivado
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_procedure_templates_active ON procedure_templates(active);

-- =========================
-- SIGNERS (Doctores/responsables que firman)
-- =========================
-- Catálogo de doctores que pueden firmar sesiones
-- =========================
CREATE TABLE IF NOT EXISTS signers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,      -- Nombre completo del doctor
  active     INTEGER NOT NULL DEFAULT 1, -- 1 = activo, 0 = desactivado
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_signers_active ON signers(active);

-- =========================
-- DIAGNOSIS_OPTIONS (Opciones para odontograma)
-- =========================
-- Catálogo de estados/diagnósticos de dientes
-- Solo estados, NO tratamientos (Caries, Obturación, etc.)
-- =========================
CREATE TABLE IF NOT EXISTS diagnosis_options (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL UNIQUE,      -- "Caries", "Obturación", "Corona", "Sano", etc.
  color      TEXT NOT NULL DEFAULT 'info', -- Color del badge: info, danger, warning, success, secondary
  active     INTEGER NOT NULL DEFAULT 1, -- 1 = activo, 0 = desactivado
  sort_order INTEGER NOT NULL DEFAULT 0, -- Orden de visualización
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_options_active ON diagnosis_options(active);
CREATE INDEX IF NOT EXISTS idx_diagnosis_options_sort_order ON diagnosis_options(sort_order);

-- =========================
-- REASON_TYPES (Motivos de consulta)
-- =========================
-- Catálogo de motivos por los que el paciente visita la clínica
-- =========================
CREATE TABLE IF NOT EXISTS reason_types (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,      -- "Dolor", "Control", "Emergencia", "Abono a cuenta", etc.
  active     INTEGER NOT NULL DEFAULT 1, -- 1 = activo, 0 = desactivado
  sort_order INTEGER NOT NULL DEFAULT 0, -- Orden de visualización
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reason_types_active ON reason_types(active);
CREATE INDEX IF NOT EXISTS idx_reason_types_sort_order ON reason_types(sort_order);

-- =========================
-- PAYMENT_METHODS (Métodos de pago)
-- =========================
-- Catálogo de formas de pago aceptadas
-- =========================
CREATE TABLE IF NOT EXISTS payment_methods (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,      -- "Efectivo", "Tarjeta débito", "Transferencia", etc.
  active     INTEGER NOT NULL DEFAULT 1, -- 1 = activo, 0 = desactivado
  sort_order INTEGER NOT NULL DEFAULT 0, -- Orden de visualización
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_sort_order ON payment_methods(sort_order);

-- =========================
-- USER_SETTINGS (Configuración de la app)
-- =========================
CREATE TABLE IF NOT EXISTS user_settings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,      -- Clave de configuración
  value      TEXT NOT NULL,             -- Valor de configuración (JSON o texto)
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
  event_type      TEXT NOT NULL,        -- "patient_created", "session_saved", etc.
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
  table_name      TEXT NOT NULL,        -- "patients", "sessions", "attachments", etc.
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

CREATE TRIGGER IF NOT EXISTS trg_sessions_updated_at
AFTER UPDATE ON sessions
FOR EACH ROW
BEGIN
  UPDATE sessions SET updated_at = datetime('now') WHERE id = NEW.id;
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

CREATE TRIGGER IF NOT EXISTS trg_payment_methods_updated_at
AFTER UPDATE ON payment_methods
FOR EACH ROW
BEGIN
  UPDATE payment_methods SET updated_at = datetime('now') WHERE id = NEW.id;
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

-- Plantillas de Procedimientos (precios en 0, se configuran después)
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

-- Opciones de Diagnóstico (solo estados del diente, sin tratamientos)
INSERT OR IGNORE INTO diagnosis_options (label, color, sort_order) VALUES
  ('Sano', 'success', 0),
  ('Caries', 'danger', 1),
  ('Fractura', 'danger', 2),
  ('Sensibilidad', 'warning', 3),
  ('Obturación', 'info', 4),
  ('Corona', 'info', 5),
  ('Endodoncia', 'info', 6),
  ('Implante', 'secondary', 7),
  ('Ausente', 'secondary', 8);

-- Motivos de Consulta
INSERT OR IGNORE INTO reason_types (name, sort_order) VALUES
  ('Dolor', 1),
  ('Control', 2),
  ('Emergencia', 3),
  ('Estética', 4),
  ('Ortodoncia', 5),
  ('Abono a cuenta', 6),
  ('Presupuesto', 7),
  ('Otro', 8);

-- Métodos de Pago
INSERT OR IGNORE INTO payment_methods (name, sort_order) VALUES
  ('Efectivo', 1),
  ('Tarjeta débito', 2),
  ('Tarjeta crédito', 3),
  ('Transferencia bancaria', 4),
  ('Cheque', 5),
  ('Otro', 6);

-- Configuración por defecto (tema, fuente, etc.)
INSERT OR IGNORE INTO user_settings (key, value, category) VALUES
  ('theme', 'dark', 'appearance'),
  ('brandHsl', '172 49% 56%', 'appearance'),
  ('font', 'Inter', 'appearance'),
  ('size', '16', 'appearance');
