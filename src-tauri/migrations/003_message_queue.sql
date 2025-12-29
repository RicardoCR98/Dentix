-- ============================================================================
-- OKLUS - MIGRATION 003: MESSAGE QUEUE FOR REMINDERS
-- ============================================================================
-- Adds message queue for semi-automatic WhatsApp reminders
-- ============================================================================

-- =========================
-- MESSAGE QUEUE TABLE
-- =========================
CREATE TABLE IF NOT EXISTS message_queue (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id          INTEGER NOT NULL,
  appointment_id      INTEGER,              -- Optional: link to appointment

  -- Message details
  type                TEXT NOT NULL,        -- 'reminder_1d' | 'availability' | 'custom'
  message_text        TEXT NOT NULL,        -- Pre-generated message ready to send

  -- Status tracking
  status              TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'sent' | 'skipped'
  sent_at             TEXT,                 -- When user marked as sent

  -- Metadata
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- =========================
-- INDEXES
-- =========================
-- For pending messages inbox
CREATE INDEX IF NOT EXISTS idx_message_queue_status
  ON message_queue(status, created_at);

-- For patient-specific queries
CREATE INDEX IF NOT EXISTS idx_message_queue_patient
  ON message_queue(patient_id);

-- For appointment-linked messages
CREATE INDEX IF NOT EXISTS idx_message_queue_appointment
  ON message_queue(appointment_id);
