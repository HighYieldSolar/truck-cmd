-- =====================================================
-- TRUCK COMMAND - ELD Webhook Infrastructure Migration
-- Generated: 2026-01-14
-- Purpose: Add webhook event logging and real-time support
-- =====================================================

-- =====================================================
-- PART 1: WEBHOOK EVENTS LOG TABLE
-- =====================================================

-- Stores all incoming webhook events for debugging and reprocessing
CREATE TABLE IF NOT EXISTS eld_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('motive', 'samsara', 'geotab', 'terminal')),
  event_type TEXT NOT NULL,
  organization_id UUID REFERENCES users(id) ON DELETE SET NULL,
  raw_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error', 'rejected')),
  error TEXT,
  result JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

COMMENT ON TABLE eld_webhook_events IS 'Logs all incoming ELD webhook events for debugging and reprocessing';
COMMENT ON COLUMN eld_webhook_events.provider IS 'Webhook source: motive, samsara, geotab, terminal';
COMMENT ON COLUMN eld_webhook_events.event_type IS 'Event type from provider (e.g., vehicle_location_updated)';
COMMENT ON COLUMN eld_webhook_events.status IS 'Processing status: pending, processing, processed, error, rejected';
COMMENT ON COLUMN eld_webhook_events.result IS 'JSON result from event processing';

-- Indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_status ON eld_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_provider_type ON eld_webhook_events(provider, event_type);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_created_at ON eld_webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_org_id ON eld_webhook_events(organization_id) WHERE organization_id IS NOT NULL;

-- Partial index for unprocessed events (for reprocessing)
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_unprocessed ON eld_webhook_events(created_at DESC)
  WHERE status IN ('pending', 'error');

-- =====================================================
-- PART 2: GPS BREADCRUMBS FOR DETAILED TRACKING
-- =====================================================

-- High-frequency GPS breadcrumbs for IFTA mileage calculations
CREATE TABLE IF NOT EXISTS gps_breadcrumbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  eld_vehicle_id TEXT NOT NULL,
  eld_provider TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  jurisdiction TEXT, -- State/province code (e.g., 'TX', 'ON')
  speed_mph DECIMAL(6, 2),
  heading INTEGER CHECK (heading IS NULL OR (heading >= 0 AND heading <= 360)),
  odometer_miles DECIMAL(12, 2),
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE gps_breadcrumbs IS 'High-frequency GPS breadcrumbs for IFTA mileage calculations';
COMMENT ON COLUMN gps_breadcrumbs.jurisdiction IS 'Detected US state or Canadian province code';

-- Indexes for GPS breadcrumbs
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_vehicle ON gps_breadcrumbs(organization_id, eld_vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_org_time ON gps_breadcrumbs(organization_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_jurisdiction ON gps_breadcrumbs(jurisdiction, recorded_at DESC) WHERE jurisdiction IS NOT NULL;

-- Partition hint: For production with high volume, consider partitioning by recorded_at

-- =====================================================
-- PART 3: REAL-TIME CURRENT VEHICLE LOCATIONS
-- =====================================================

-- Current location for each vehicle (upserted on each update)
CREATE TABLE IF NOT EXISTS vehicle_current_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  eld_vehicle_id TEXT NOT NULL,
  eld_provider TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  jurisdiction TEXT,
  speed_mph DECIMAL(6, 2),
  heading INTEGER,
  odometer_miles DECIMAL(12, 2),
  engine_hours DECIMAL(10, 2),
  address TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, eld_vehicle_id)
);

COMMENT ON TABLE vehicle_current_locations IS 'Current location for each vehicle (real-time updates)';

-- Indexes for current locations
CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_org ON vehicle_current_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_vehicle ON vehicle_current_locations(vehicle_id) WHERE vehicle_id IS NOT NULL;

-- =====================================================
-- PART 4: REAL-TIME DRIVER HOS STATUS
-- =====================================================

-- Current HOS status for each driver (upserted on each update)
CREATE TABLE IF NOT EXISTS driver_hos_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  eld_driver_id TEXT NOT NULL,
  eld_provider TEXT NOT NULL,
  duty_status TEXT NOT NULL CHECK (duty_status IN ('driving', 'on_duty', 'off_duty', 'sleeper', 'unknown')),
  status_started_at TIMESTAMPTZ NOT NULL,
  vehicle_id TEXT,
  location_description TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  drive_time_remaining_ms BIGINT,
  shift_time_remaining_ms BIGINT,
  cycle_time_remaining_ms BIGINT,
  break_time_remaining_ms BIGINT,
  has_violation BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, eld_driver_id)
);

COMMENT ON TABLE driver_hos_status IS 'Current HOS status for each driver (real-time updates)';
COMMENT ON COLUMN driver_hos_status.duty_status IS 'Normalized status: driving, on_duty, off_duty, sleeper';

-- Indexes for driver HOS status
CREATE INDEX IF NOT EXISTS idx_driver_hos_status_org ON driver_hos_status(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_hos_status_driver ON driver_hos_status(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_driver_hos_status_violation ON driver_hos_status(organization_id, has_violation) WHERE has_violation = TRUE;

-- =====================================================
-- PART 5: ACTIVE FAULT CODES (REAL-TIME)
-- =====================================================

-- Active fault codes table for real-time monitoring
CREATE TABLE IF NOT EXISTS vehicle_active_faults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES trucks(id) ON DELETE CASCADE,
  eld_vehicle_id TEXT NOT NULL,
  eld_provider TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('critical', 'warning', 'info')),
  source TEXT, -- 'engine', 'transmission', 'abs', etc.
  is_active BOOLEAN DEFAULT TRUE,
  first_observed_at TIMESTAMPTZ NOT NULL,
  last_observed_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, eld_vehicle_id, code)
);

COMMENT ON TABLE vehicle_active_faults IS 'Active vehicle fault codes for real-time monitoring';

-- Indexes for active faults
CREATE INDEX IF NOT EXISTS idx_vehicle_active_faults_org ON vehicle_active_faults(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_active_faults_active ON vehicle_active_faults(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_vehicle_active_faults_severity ON vehicle_active_faults(severity, is_active) WHERE is_active = TRUE;

-- =====================================================
-- PART 6: IFTA MILEAGE TRACKING (WEBHOOK-BASED)
-- =====================================================

-- Real-time IFTA mileage aggregation from webhooks
CREATE TABLE IF NOT EXISTS ifta_realtime_mileage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  eld_vehicle_id TEXT,
  jurisdiction TEXT NOT NULL,
  quarter TEXT NOT NULL, -- Format: '2026-Q1'
  miles DECIMAL(12, 2) NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'webhook' CHECK (source IN ('webhook', 'manual', 'import', 'eld_sync')),
  last_breadcrumb_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, COALESCE(eld_vehicle_id, vehicle_id::text), jurisdiction, quarter)
);

COMMENT ON TABLE ifta_realtime_mileage IS 'Real-time IFTA mileage from webhook GPS updates';

-- Indexes for IFTA mileage
CREATE INDEX IF NOT EXISTS idx_ifta_realtime_mileage_org_quarter ON ifta_realtime_mileage(organization_id, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_realtime_mileage_vehicle ON ifta_realtime_mileage(organization_id, eld_vehicle_id);

-- =====================================================
-- PART 7: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE eld_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_breadcrumbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_current_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_hos_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_active_faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE ifta_realtime_mileage ENABLE ROW LEVEL SECURITY;

-- Service role policies (for webhook processing)
DO $$ BEGIN
  -- Webhook events - service role only for insert/update
  DROP POLICY IF EXISTS "Service role manages webhook events" ON eld_webhook_events;
  CREATE POLICY "Service role manages webhook events"
    ON eld_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);

  -- GPS breadcrumbs
  DROP POLICY IF EXISTS "Users can view own GPS breadcrumbs" ON gps_breadcrumbs;
  CREATE POLICY "Users can view own GPS breadcrumbs"
    ON gps_breadcrumbs FOR SELECT TO authenticated USING (organization_id = auth.uid());

  DROP POLICY IF EXISTS "Service role manages GPS breadcrumbs" ON gps_breadcrumbs;
  CREATE POLICY "Service role manages GPS breadcrumbs"
    ON gps_breadcrumbs FOR ALL TO service_role USING (true) WITH CHECK (true);

  -- Current locations
  DROP POLICY IF EXISTS "Users can view own vehicle locations" ON vehicle_current_locations;
  CREATE POLICY "Users can view own vehicle locations"
    ON vehicle_current_locations FOR SELECT TO authenticated USING (organization_id = auth.uid());

  DROP POLICY IF EXISTS "Service role manages vehicle locations" ON vehicle_current_locations;
  CREATE POLICY "Service role manages vehicle locations"
    ON vehicle_current_locations FOR ALL TO service_role USING (true) WITH CHECK (true);

  -- Driver HOS status
  DROP POLICY IF EXISTS "Users can view own driver HOS" ON driver_hos_status;
  CREATE POLICY "Users can view own driver HOS"
    ON driver_hos_status FOR SELECT TO authenticated USING (organization_id = auth.uid());

  DROP POLICY IF EXISTS "Service role manages driver HOS" ON driver_hos_status;
  CREATE POLICY "Service role manages driver HOS"
    ON driver_hos_status FOR ALL TO service_role USING (true) WITH CHECK (true);

  -- Active faults
  DROP POLICY IF EXISTS "Users can view own vehicle faults" ON vehicle_active_faults;
  CREATE POLICY "Users can view own vehicle faults"
    ON vehicle_active_faults FOR SELECT TO authenticated USING (organization_id = auth.uid());

  DROP POLICY IF EXISTS "Service role manages vehicle faults" ON vehicle_active_faults;
  CREATE POLICY "Service role manages vehicle faults"
    ON vehicle_active_faults FOR ALL TO service_role USING (true) WITH CHECK (true);

  -- IFTA mileage
  DROP POLICY IF EXISTS "Users can view own IFTA mileage" ON ifta_realtime_mileage;
  CREATE POLICY "Users can view own IFTA mileage"
    ON ifta_realtime_mileage FOR SELECT TO authenticated USING (organization_id = auth.uid());

  DROP POLICY IF EXISTS "Users can manage own IFTA mileage" ON ifta_realtime_mileage;
  CREATE POLICY "Users can manage own IFTA mileage"
    ON ifta_realtime_mileage FOR ALL TO authenticated
    USING (organization_id = auth.uid()) WITH CHECK (organization_id = auth.uid());

  DROP POLICY IF EXISTS "Service role manages IFTA mileage" ON ifta_realtime_mileage;
  CREATE POLICY "Service role manages IFTA mileage"
    ON ifta_realtime_mileage FOR ALL TO service_role USING (true) WITH CHECK (true);

EXCEPTION WHEN others THEN NULL;
END $$;

-- =====================================================
-- PART 8: ENABLE SUPABASE REALTIME
-- =====================================================

-- Enable Realtime for live updates to frontend
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_current_locations;
  ALTER PUBLICATION supabase_realtime ADD TABLE driver_hos_status;
  ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_active_faults;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- PART 9: AUTO-UPDATE TRIGGERS
-- =====================================================

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_vehicle_current_locations_updated_at ON vehicle_current_locations;
  CREATE TRIGGER update_vehicle_current_locations_updated_at
    BEFORE UPDATE ON vehicle_current_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_driver_hos_status_updated_at ON driver_hos_status;
  CREATE TRIGGER update_driver_hos_status_updated_at
    BEFORE UPDATE ON driver_hos_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_vehicle_active_faults_updated_at ON vehicle_active_faults;
  CREATE TRIGGER update_vehicle_active_faults_updated_at
    BEFORE UPDATE ON vehicle_active_faults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_ifta_realtime_mileage_updated_at ON ifta_realtime_mileage;
  CREATE TRIGGER update_ifta_realtime_mileage_updated_at
    BEFORE UPDATE ON ifta_realtime_mileage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN NULL;
END $$;

-- =====================================================
-- PART 10: HELPER FUNCTIONS FOR WEBHOOK PROCESSING
-- =====================================================

-- Function to get or create organization from ELD connection
CREATE OR REPLACE FUNCTION get_org_id_from_eld_vehicle(p_provider TEXT, p_eld_vehicle_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Try to find organization via eld_connections and entity mappings
  SELECT ec.user_id INTO v_org_id
  FROM eld_connections ec
  JOIN eld_entity_mappings em ON em.connection_id = ec.id
  WHERE ec.provider = p_provider
    AND em.entity_type = 'vehicle'
    AND em.external_id = p_eld_vehicle_id
    AND ec.status = 'active'
  LIMIT 1;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create organization from ELD driver
CREATE OR REPLACE FUNCTION get_org_id_from_eld_driver(p_provider TEXT, p_eld_driver_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT ec.user_id INTO v_org_id
  FROM eld_connections ec
  JOIN eld_entity_mappings em ON em.connection_id = ec.id
  WHERE ec.provider = p_provider
    AND em.entity_type = 'driver'
    AND em.external_id = p_eld_driver_id
    AND ec.status = 'active'
  LIMIT 1;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- New tables:
--   - eld_webhook_events (webhook logging)
--   - gps_breadcrumbs (detailed GPS history)
--   - vehicle_current_locations (real-time locations)
--   - driver_hos_status (real-time HOS)
--   - vehicle_active_faults (real-time fault codes)
--   - ifta_realtime_mileage (webhook-based IFTA tracking)
--
-- Features enabled:
--   - Supabase Realtime on location/HOS/fault tables
--   - RLS policies for user data isolation
--   - Service role access for webhook processing
-- =====================================================
