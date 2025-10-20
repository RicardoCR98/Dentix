PRAGMA foreign_keys = ON;

-- =========================
-- PACIENTES
-- =========================
CREATE TABLE IF NOT EXISTS patients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name       TEXT NOT NULL,
  doc_id          TEXT UNIQUE,
  phone           TEXT,
  age             INTEGER,
  anamnesis       TEXT,
  allergy_detail  TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_patients_doc_id ON patients(doc_id);

-- =========================
-- VISITAS (incluye campos de DX y odontograma opcional)
-- =========================
CREATE TABLE IF NOT EXISTS visits (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id     INTEGER NOT NULL,
  date           TEXT NOT NULL,
  reason_type    TEXT NOT NULL,
  reason_detail  TEXT,
  diagnosis      TEXT,
  tooth_dx_json  TEXT,   -- odontograma opcional (JSON)
  -- Dx desglosado y combinado
  auto_dx_text    TEXT,
  manual_dx_text  TEXT,
  full_dx_text    TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);

-- =========================
-- SESIONES
-- =========================
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id   INTEGER NOT NULL,
  date       TEXT NOT NULL,
  auto       INTEGER NOT NULL DEFAULT 1,   -- 1=true, 0=false
  budget     INTEGER NOT NULL DEFAULT 0,   -- enteros (USD sin centavos)
  payment    INTEGER NOT NULL DEFAULT 0,
  balance    INTEGER NOT NULL DEFAULT 0,
  signer     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_visit_id ON sessions(visit_id);

-- =========================
-- ÍTEMS DE SESIÓN
-- =========================
CREATE TABLE IF NOT EXISTS session_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL,
  name        TEXT NOT NULL,
  unit        INTEGER NOT NULL DEFAULT 0,  -- precio unitario entero
  qty         INTEGER NOT NULL DEFAULT 0,
  sub         INTEGER NOT NULL DEFAULT 0,  -- unit * qty
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_session_items_session_id ON session_items(session_id);

-- =========================
-- ADJUNTOS (archivos en disco, guardamos la referencia)
-- =========================
CREATE TABLE IF NOT EXISTS attachments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id   INTEGER NOT NULL,
  visit_id     INTEGER,        -- puede ser NULL si es general del paciente
  kind         TEXT,           -- "xray", "photo", "doc", etc.
  filename     TEXT NOT NULL,  -- nombre visible
  mime_type    TEXT NOT NULL,
  bytes        INTEGER NOT NULL,
  storage_key  TEXT NOT NULL,  -- clave relativa p_{id}/YYYY/MM/archivo
  checksum     TEXT,           -- opcional
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id)  REFERENCES visits(id)   ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_attachments_patient_id ON attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_visit_id   ON attachments(visit_id);

-- =========================
-- TRIGGERS updated_at
-- =========================
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

CREATE TRIGGER IF NOT EXISTS trg_attachments_updated_at
AFTER UPDATE ON attachments
FOR EACH ROW
BEGIN
  UPDATE attachments SET updated_at = datetime('now') WHERE id = NEW.id;
END;
