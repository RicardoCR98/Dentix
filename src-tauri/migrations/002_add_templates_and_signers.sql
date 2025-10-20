-- =========================
-- MIGRACIÓN 002: Templates, Signers y Descuento
-- =========================

-- 1. Agregar campo discount a sessions
ALTER TABLE sessions ADD COLUMN discount INTEGER NOT NULL DEFAULT 0;

-- 2. Tabla de firmantes/responsables
CREATE TABLE IF NOT EXISTS signers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  active     INTEGER NOT NULL DEFAULT 1,  -- 1=activo, 0=inactivo
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Tabla de plantillas de procedimientos
CREATE TABLE IF NOT EXISTS procedure_templates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  default_price INTEGER NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1,  -- 1=activo, 0=inactivo
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Triggers para updated_at
CREATE TRIGGER IF NOT EXISTS trg_signers_updated_at
AFTER UPDATE ON signers
FOR EACH ROW
BEGIN
  UPDATE signers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_procedure_templates_updated_at
AFTER UPDATE ON procedure_templates
FOR EACH ROW
BEGIN
  UPDATE procedure_templates SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- 5. Datos iniciales para procedure_templates (los que ya estaban hardcodeados)
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

-- 6. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_procedure_templates_active ON procedure_templates(active);
CREATE INDEX IF NOT EXISTS idx_signers_active ON signers(active);
