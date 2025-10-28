-- =========================
-- MIGRACIÓN 004: Teléfono de Emergencia
-- =========================

-- Agregar campo emergency_phone a la tabla patients
ALTER TABLE patients ADD COLUMN emergency_phone TEXT;
