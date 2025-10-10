-- 001_initial_schema.sql
PRAGMA foreign_keys = ON;

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT NOT NULL,
  doc_id        TEXT UNIQUE,
  phone         TEXT,
  age           INTEGER,
  anamnesis     TEXT,
  allergy_detail TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_patients_doc_id ON patients(doc_id);

-- Tabla de visitas (motivos de consulta)
CREATE TABLE IF NOT EXISTS visits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id    INTEGER NOT NULL,
  date          TEXT NOT NULL,
  reason_type   TEXT NOT NULL,
  reason_detail TEXT,
  diagnosis     TEXT,
  tooth_dx_json TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);

-- Tabla de sesiones (procedimientos)
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id   INTEGER NOT NULL,
  date       TEXT NOT NULL,
  auto       INTEGER NOT NULL DEFAULT 1,
  budget     INTEGER NOT NULL DEFAULT 0,
  payment    INTEGER NOT NULL DEFAULT 0,
  balance    INTEGER NOT NULL DEFAULT 0,
  signer     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_visit_id ON sessions(visit_id);

-- Tabla de items de sesión (procedimientos específicos)
CREATE TABLE IF NOT EXISTS session_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL,
  name        TEXT NOT NULL,
  unit        INTEGER NOT NULL DEFAULT 0,
  qty         INTEGER NOT NULL DEFAULT 0,
  sub         INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_items_session_id ON session_items(session_id);

-- Triggers para updated_at
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

CREATE TRIGGER IF NOT EXISTS trg_sessions_updated_at
AFTER UPDATE ON sessions
FOR EACH ROW
BEGIN
  UPDATE sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;