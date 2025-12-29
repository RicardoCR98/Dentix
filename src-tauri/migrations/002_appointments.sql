-- ============================================================================
-- OKLUS - MIGRATION 002: APPOINTMENTS MODULE
-- ============================================================================
-- Adds appointment scheduling with overlap detection and reminder tracking
-- ============================================================================

-- =========================
-- APPOINTMENTS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS appointments (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id           INTEGER NOT NULL,

  -- Scheduling (ISO 8601 datetime with timezone offset or UTC)
  starts_at            TEXT NOT NULL,  -- e.g. "2025-01-15T10:00:00-03:00" or "2025-01-15T13:00:00Z"
  ends_at              TEXT NOT NULL,  -- e.g. "2025-01-15T10:30:00-03:00" or "2025-01-15T13:30:00Z"

  -- Appointment details
  procedure            TEXT NOT NULL,  -- "Limpieza dental", "Endodoncia", etc.
  notes                TEXT,           -- Optional notes for the appointment

  -- Status tracking
  status               TEXT NOT NULL DEFAULT 'scheduled',
                                       -- 'scheduled' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
  confirmed_at         TEXT,           -- Timestamp when patient confirmed (manual or via WhatsApp)

  -- Reminder tracking
  reminder_1d_sent_at  TEXT,           -- Timestamp when 1-day reminder was sent

  -- Metadata
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================
-- Critical for date range queries (calendar view)
CREATE INDEX IF NOT EXISTS idx_appointments_date_range
  ON appointments(starts_at, ends_at);

-- For patient-specific queries
CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON appointments(patient_id);

-- For status filtering (pending, confirmed, etc.)
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(status);

-- For finding appointments needing reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminders
  ON appointments(reminder_1d_sent_at, status);

-- Composite index for overlap detection queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_appointments_overlap
  ON appointments(starts_at, ends_at, status);

-- =========================
-- UPDATE TRIGGER
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_appointments_updated_at
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
  UPDATE appointments SET updated_at = datetime('now') WHERE id = NEW.id;
END;
