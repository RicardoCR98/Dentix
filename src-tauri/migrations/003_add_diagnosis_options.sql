-- =========================
-- MIGRACIÓN 003: Opciones de Diagnóstico Personalizables
-- =========================

-- 1. Tabla de opciones de diagnóstico
CREATE TABLE IF NOT EXISTS diagnosis_options (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT 'success',  -- 'success', 'info', 'warning', 'danger', 'default'
  active     INTEGER NOT NULL DEFAULT 1,       -- 1=activo, 0=inactivo
  sort_order INTEGER NOT NULL DEFAULT 0,       -- Para mantener el orden personalizado
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Triggers para updated_at
CREATE TRIGGER IF NOT EXISTS trg_diagnosis_options_updated_at
AFTER UPDATE ON diagnosis_options
FOR EACH ROW
BEGIN
  UPDATE diagnosis_options SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- 3. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_diagnosis_options_active ON diagnosis_options(active);
CREATE INDEX IF NOT EXISTS idx_diagnosis_options_sort_order ON diagnosis_options(sort_order);

-- 4. Insertar opciones por defecto (las que ya estaban hardcodeadas)
INSERT OR IGNORE INTO diagnosis_options (label, color, sort_order) VALUES
  ('Caries', 'info', 1),
  ('Gingivitis', 'info', 2),
  ('Fractura', 'info', 3),
  ('Pérdida', 'info', 4),
  ('Obturación', 'info', 5),
  ('Endodoncia', 'info', 6);
