-- Add refresh_token_expires_at tracking to quickbooks_connections
-- Intuit refresh tokens expire after 100 days. We need to track this so we
-- can proactively alert users and mark connections as expired.

ALTER TABLE quickbooks_connections
  ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ;

-- Backfill existing active connections with 100 days from created_at
-- (safe default since that's Intuit's refresh token TTL)
UPDATE quickbooks_connections
SET refresh_token_expires_at = created_at + INTERVAL '100 days'
WHERE refresh_token_expires_at IS NULL
  AND refresh_token IS NOT NULL;

-- Index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_qb_connections_refresh_expires_at
  ON quickbooks_connections (refresh_token_expires_at)
  WHERE status = 'active';

COMMENT ON COLUMN quickbooks_connections.refresh_token_expires_at IS
  'When the QuickBooks refresh token expires (100 days from last grant). Connection is unrecoverable after this and user must re-authorize.';
