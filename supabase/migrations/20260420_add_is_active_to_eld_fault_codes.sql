-- Add is_active column to eld_fault_codes
--
-- The webhook event handler in src/lib/services/eld/webhooks/webhookEventHandlers.js
-- writes `is_active` on every fault_code_opened/closed event, but the column was
-- never created in the initial schema (20260102_eld_integration_schema.sql).
-- Without this, every fault-code webhook upsert silently fails.
--
-- Default TRUE because a row only exists once a fault has been observed, and
-- existing rows without a resolved_at timestamp represent active faults.

ALTER TABLE eld_fault_codes
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Backfill: faults with a resolved_at are not active, all others are
UPDATE eld_fault_codes
SET is_active = (resolved_at IS NULL)
WHERE is_active IS NULL;

CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_active
  ON eld_fault_codes(is_active)
  WHERE is_active = TRUE;

COMMENT ON COLUMN eld_fault_codes.is_active IS 'Whether this fault code is currently active (open). Derived from Motive status==open or Samsara DtcOn events.';
