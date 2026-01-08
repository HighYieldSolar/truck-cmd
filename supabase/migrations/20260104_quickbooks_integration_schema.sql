-- QuickBooks Online Integration Tables
-- Created: 2026-01-04
-- Purpose: Store OAuth tokens, category mappings, and sync records for QuickBooks integration

-- ============================================================================
-- Table 1: quickbooks_connections
-- Stores OAuth tokens and connection status for each user's QB connection
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- OAuth tokens (should be encrypted at rest in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- QuickBooks company info
  realm_id TEXT NOT NULL,
  company_name TEXT,

  -- Connection status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'token_expired', 'error', 'disconnected')),
  error_message TEXT,

  -- Sync settings
  auto_sync_expenses BOOLEAN DEFAULT true,
  auto_sync_invoices BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One connection per user
  UNIQUE(user_id)
);

-- ============================================================================
-- Table 2: quickbooks_account_mappings
-- Maps Truck Command expense categories to QuickBooks Chart of Accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_account_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Mapping details
  tc_category TEXT NOT NULL,  -- Fuel, Maintenance, Insurance, Tolls, Office, Permits, Meals, Other
  qb_account_id TEXT NOT NULL,
  qb_account_name TEXT,
  qb_account_type TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each category can only be mapped once per connection
  UNIQUE(connection_id, tc_category)
);

-- ============================================================================
-- Table 3: quickbooks_sync_records
-- Tracks individual synced items to prevent duplicates and show sync status
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_sync_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entity reference (links to expenses or invoices table)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('expense', 'invoice')),
  local_entity_id UUID NOT NULL,

  -- QuickBooks reference
  qb_entity_id TEXT NOT NULL,
  qb_entity_type TEXT,  -- Purchase, Invoice, etc.

  -- Sync status
  sync_status TEXT NOT NULL DEFAULT 'synced'
    CHECK (sync_status IN ('synced', 'failed', 'pending')),
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,

  -- For tracking if local entity was updated since last sync
  local_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each local entity synced once per connection
  UNIQUE(connection_id, entity_type, local_entity_id)
);

-- ============================================================================
-- Table 4: quickbooks_sync_history
-- Logs sync operations for debugging and user visibility
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'auto', 'bulk')),
  entity_types TEXT[] DEFAULT '{}',  -- ['expense', 'invoice']

  -- Results
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'partial', 'failed')),
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_account_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_sync_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_sync_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for quickbooks_connections
-- ============================================================================
CREATE POLICY "Users can view own QB connections" ON quickbooks_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own QB connections" ON quickbooks_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own QB connections" ON quickbooks_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own QB connections" ON quickbooks_connections
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for quickbooks_account_mappings
-- ============================================================================
CREATE POLICY "Users can manage own QB mappings" ON quickbooks_account_mappings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for quickbooks_sync_records
-- ============================================================================
CREATE POLICY "Users can manage own QB sync records" ON quickbooks_sync_records
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for quickbooks_sync_history
-- ============================================================================
CREATE POLICY "Users can view own QB sync history" ON quickbooks_sync_history
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_qb_connections_user_id ON quickbooks_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_qb_connections_status ON quickbooks_connections(status);
CREATE INDEX IF NOT EXISTS idx_qb_mappings_connection ON quickbooks_account_mappings(connection_id);
CREATE INDEX IF NOT EXISTS idx_qb_sync_connection ON quickbooks_sync_records(connection_id);
CREATE INDEX IF NOT EXISTS idx_qb_sync_entity ON quickbooks_sync_records(entity_type, local_entity_id);
CREATE INDEX IF NOT EXISTS idx_qb_sync_status ON quickbooks_sync_records(sync_status);
CREATE INDEX IF NOT EXISTS idx_qb_history_connection ON quickbooks_sync_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_qb_history_started ON quickbooks_sync_history(started_at DESC);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_quickbooks_connections_updated_at ON quickbooks_connections;
CREATE TRIGGER update_quickbooks_connections_updated_at
  BEFORE UPDATE ON quickbooks_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quickbooks_account_mappings_updated_at ON quickbooks_account_mappings;
CREATE TRIGGER update_quickbooks_account_mappings_updated_at
  BEFORE UPDATE ON quickbooks_account_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quickbooks_sync_records_updated_at ON quickbooks_sync_records;
CREATE TRIGGER update_quickbooks_sync_records_updated_at
  BEFORE UPDATE ON quickbooks_sync_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
