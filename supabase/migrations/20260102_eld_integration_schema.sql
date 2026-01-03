-- =====================================================
-- TRUCK COMMAND - ELD Integration Schema Migration
-- Generated: 2026-01-02
-- Updated: 2026-01-03 (Multi-provider OAuth support)
-- Purpose: Add tables and columns for ELD API integration
-- Providers: Motive (KeepTruckin), Samsara - Direct API integrations
-- =====================================================

-- =====================================================
-- PART 1: NEW TABLES FOR ELD INTEGRATION
-- =====================================================

-- ELD Provider Connections (stores OAuth tokens per user)
CREATE TABLE IF NOT EXISTS eld_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'motive',
  -- OAuth 2.0 token storage
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  -- Legacy token field (for backwards compatibility)
  connection_token TEXT,
  external_connection_id VARCHAR(255),
  company_name VARCHAR(255),
  eld_provider_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  permissions JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INTEGER DEFAULT 60,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

COMMENT ON TABLE eld_connections IS 'Stores ELD provider OAuth connections per user';
COMMENT ON COLUMN eld_connections.provider IS 'Direct ELD provider (motive, samsara) or aggregator (terminal, truckercloud)';
COMMENT ON COLUMN eld_connections.access_token IS 'OAuth 2.0 access token for API calls';
COMMENT ON COLUMN eld_connections.refresh_token IS 'OAuth 2.0 refresh token for token renewal';
COMMENT ON COLUMN eld_connections.token_expires_at IS 'Timestamp when access token expires';
COMMENT ON COLUMN eld_connections.connection_token IS 'Legacy connection token (for aggregators)';
COMMENT ON COLUMN eld_connections.external_connection_id IS 'Provider-assigned connection ID';
COMMENT ON COLUMN eld_connections.eld_provider_name IS 'Name of the actual ELD provider (Motive, Samsara, etc.)';
COMMENT ON COLUMN eld_connections.status IS 'Connection status: pending, active, disconnected, error, token_expired';

-- ELD Sync Jobs (tracks sync history and status)
CREATE TABLE IF NOT EXISTS eld_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES eld_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE eld_sync_jobs IS 'Tracks ELD data sync jobs and their status';
COMMENT ON COLUMN eld_sync_jobs.sync_type IS 'Type of sync: full, incremental, ifta, hos, gps, vehicles, drivers';
COMMENT ON COLUMN eld_sync_jobs.status IS 'Job status: pending, running, completed, failed';

-- GPS Location Events (aggregated, not raw breadcrumbs)
CREATE TABLE IF NOT EXISTS eld_vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID REFERENCES eld_connections(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  external_vehicle_id VARCHAR(255),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  speed_mph DECIMAL(5, 1),
  heading INTEGER,
  odometer_miles DECIMAL(12, 1),
  engine_hours DECIMAL(10, 1),
  address TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE eld_vehicle_locations IS 'GPS location history from ELD devices';
COMMENT ON COLUMN eld_vehicle_locations.heading IS 'Direction in degrees (0-360)';
COMMENT ON COLUMN eld_vehicle_locations.odometer_miles IS 'ECM odometer reading in miles';

-- HOS (Hours of Service) Logs
CREATE TABLE IF NOT EXISTS eld_hos_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID REFERENCES eld_connections(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  external_driver_id VARCHAR(255),
  duty_status VARCHAR(20) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  location_name TEXT,
  location_description TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  vehicle_id UUID REFERENCES vehicles(id),
  external_vehicle_id VARCHAR(255),
  annotations TEXT,
  log_date DATE NOT NULL,
  origin VARCHAR(20) DEFAULT 'eld',
  provider VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE eld_hos_logs IS 'Individual HOS duty status changes from ELD';
COMMENT ON COLUMN eld_hos_logs.duty_status IS 'Normalized status: driving, on_duty, off_duty, sleeper';
COMMENT ON COLUMN eld_hos_logs.origin IS 'Data origin: eld, driver_edit, automatic';
COMMENT ON COLUMN eld_hos_logs.provider IS 'ELD provider name (motive, samsara)';

-- HOS Daily Summaries
CREATE TABLE IF NOT EXISTS eld_hos_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID REFERENCES eld_connections(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  external_driver_id VARCHAR(255),
  log_date DATE NOT NULL,
  driving_minutes INTEGER DEFAULT 0,
  on_duty_minutes INTEGER DEFAULT 0,
  sleeper_minutes INTEGER DEFAULT 0,
  off_duty_minutes INTEGER DEFAULT 0,
  available_drive_minutes INTEGER,
  available_shift_minutes INTEGER,
  available_cycle_minutes INTEGER,
  violations JSONB DEFAULT '[]',
  certified BOOLEAN DEFAULT FALSE,
  certified_at TIMESTAMPTZ,
  cycle_type VARCHAR(20) DEFAULT '70_8',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, log_date)
);

COMMENT ON TABLE eld_hos_daily_logs IS 'Daily HOS summaries with available hours and violations';
COMMENT ON COLUMN eld_hos_daily_logs.available_drive_minutes IS 'Remaining under 11-hour driving rule';
COMMENT ON COLUMN eld_hos_daily_logs.available_shift_minutes IS 'Remaining under 14-hour shift rule';
COMMENT ON COLUMN eld_hos_daily_logs.available_cycle_minutes IS 'Remaining under 60/70-hour cycle rule';
COMMENT ON COLUMN eld_hos_daily_logs.cycle_type IS '60_7 for 7-day cycle, 70_8 for 8-day cycle';

-- IFTA Jurisdiction Mileage (from ELD)
CREATE TABLE IF NOT EXISTS eld_ifta_mileage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID REFERENCES eld_connections(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  external_vehicle_id VARCHAR(255),
  jurisdiction VARCHAR(5) NOT NULL,
  jurisdiction_name VARCHAR(100),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  quarter VARCHAR(7),
  total_miles DECIMAL(12, 2) NOT NULL,
  taxable_miles DECIMAL(12, 2),
  exempt_miles DECIMAL(12, 2) DEFAULT 0,
  fuel_gallons DECIMAL(10, 3) DEFAULT 0,
  source VARCHAR(20) DEFAULT 'eld',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, jurisdiction, year, month)
);

COMMENT ON TABLE eld_ifta_mileage IS 'Jurisdiction mileage data from ELD for IFTA reporting';
COMMENT ON COLUMN eld_ifta_mileage.quarter IS 'Quarter in YYYY-QN format for easy IFTA grouping';
COMMENT ON COLUMN eld_ifta_mileage.source IS 'Data source: eld, manual, gps_calculated';
COMMENT ON COLUMN eld_ifta_mileage.exempt_miles IS 'Miles exempt from IFTA (toll roads, off-highway)';

-- Vehicle Diagnostics / Fault Codes
CREATE TABLE IF NOT EXISTS eld_fault_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID REFERENCES eld_connections(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  external_vehicle_id VARCHAR(255),
  fault_code VARCHAR(50) NOT NULL,
  fault_code_type VARCHAR(20),
  spn INTEGER,
  fmi INTEGER,
  description TEXT,
  severity VARCHAR(20),
  first_observed_at TIMESTAMPTZ NOT NULL,
  last_observed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  occurrence_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE eld_fault_codes IS 'Vehicle diagnostic fault codes from ELD';
COMMENT ON COLUMN eld_fault_codes.fault_code_type IS 'Code type: J1939, OBD2';
COMMENT ON COLUMN eld_fault_codes.spn IS 'Suspect Parameter Number (J1939)';
COMMENT ON COLUMN eld_fault_codes.fmi IS 'Failure Mode Identifier (J1939)';
COMMENT ON COLUMN eld_fault_codes.severity IS 'Severity: critical, warning, info';

-- External ID Mappings (maps Terminal IDs to local IDs)
CREATE TABLE IF NOT EXISTS eld_entity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID REFERENCES eld_connections(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL,
  local_id UUID NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  external_name VARCHAR(255),
  auto_matched BOOLEAN DEFAULT FALSE,
  match_confidence DECIMAL(3, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, entity_type, external_id)
);

COMMENT ON TABLE eld_entity_mappings IS 'Maps external ELD entity IDs to local vehicle/driver IDs';
COMMENT ON COLUMN eld_entity_mappings.entity_type IS 'Entity type: vehicle, driver';
COMMENT ON COLUMN eld_entity_mappings.auto_matched IS 'Whether match was automatic (by VIN, license) or manual';
COMMENT ON COLUMN eld_entity_mappings.match_confidence IS 'Confidence score for auto-match (0.00-1.00)';

-- =====================================================
-- PART 2: ADD COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add ELD columns to vehicles table
DO $$ BEGIN
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS eld_external_id VARCHAR(255);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS eld_provider VARCHAR(50);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS eld_device_serial VARCHAR(100);
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_known_location JSONB;
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS eld_last_sync_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN vehicles.eld_external_id IS 'External ID from ELD provider';
COMMENT ON COLUMN vehicles.eld_provider IS 'ELD provider name (motive, samsara)';
COMMENT ON COLUMN vehicles.eld_device_serial IS 'Serial number of ELD device';
COMMENT ON COLUMN vehicles.last_known_location IS 'Latest GPS location as JSON {lat, lng, address, speed}';
COMMENT ON COLUMN vehicles.last_location_at IS 'Timestamp of last known location';

-- Add ELD columns to drivers table
DO $$ BEGIN
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS eld_external_id VARCHAR(255);
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS eld_provider VARCHAR(50);
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_status VARCHAR(20);
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_available_drive_minutes INTEGER;
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_available_shift_minutes INTEGER;
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_available_cycle_minutes INTEGER;
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_last_updated_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN drivers.eld_external_id IS 'External ID from ELD provider';
COMMENT ON COLUMN drivers.eld_provider IS 'ELD provider name (motive, samsara)';
COMMENT ON COLUMN drivers.hos_status IS 'Current HOS status: OFF, SB, D, ON';
COMMENT ON COLUMN drivers.hos_available_drive_minutes IS 'Available driving minutes (11-hour rule)';
COMMENT ON COLUMN drivers.hos_available_shift_minutes IS 'Available shift minutes (14-hour rule)';
COMMENT ON COLUMN drivers.hos_available_cycle_minutes IS 'Available cycle minutes (70-hour rule)';

-- Add ELD source tracking to IFTA trip records
DO $$ BEGIN
  ALTER TABLE ifta_trip_records ADD COLUMN IF NOT EXISTS eld_connection_id UUID REFERENCES eld_connections(id);
  ALTER TABLE ifta_trip_records ADD COLUMN IF NOT EXISTS eld_ifta_mileage_id UUID REFERENCES eld_ifta_mileage(id);
  ALTER TABLE ifta_trip_records ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'manual';
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN ifta_trip_records.eld_connection_id IS 'ELD connection this record was imported from';
COMMENT ON COLUMN ifta_trip_records.eld_ifta_mileage_id IS 'Reference to ELD IFTA mileage record';
COMMENT ON COLUMN ifta_trip_records.data_source IS 'Data source: manual, eld, load_import, mileage_tracker';

-- =====================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- =====================================================

-- ELD Connections indexes
CREATE INDEX IF NOT EXISTS idx_eld_connections_user ON eld_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_eld_connections_status ON eld_connections(status);
CREATE INDEX IF NOT EXISTS idx_eld_connections_provider ON eld_connections(provider);

-- ELD Sync Jobs indexes
CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_connection ON eld_sync_jobs(connection_id);
CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_user ON eld_sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_status ON eld_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_created ON eld_sync_jobs(created_at DESC);

-- Vehicle Locations indexes
CREATE INDEX IF NOT EXISTS idx_eld_vehicle_locations_vehicle_time ON eld_vehicle_locations(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_eld_vehicle_locations_user ON eld_vehicle_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_eld_vehicle_locations_recorded ON eld_vehicle_locations(recorded_at DESC);

-- HOS Logs indexes
CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_driver_date ON eld_hos_logs(driver_id, log_date);
CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_user ON eld_hos_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_status ON eld_hos_logs(duty_status);
CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_time ON eld_hos_logs(start_time DESC);

-- HOS Daily Logs indexes
CREATE INDEX IF NOT EXISTS idx_eld_hos_daily_driver ON eld_hos_daily_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_eld_hos_daily_date ON eld_hos_daily_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_eld_hos_daily_user ON eld_hos_daily_logs(user_id);

-- IFTA Mileage indexes
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_quarter ON eld_ifta_mileage(user_id, quarter);
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_vehicle ON eld_ifta_mileage(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_jurisdiction ON eld_ifta_mileage(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_year_month ON eld_ifta_mileage(year, month);

-- Fault Codes indexes
CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_vehicle ON eld_fault_codes(vehicle_id, first_observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_user ON eld_fault_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_severity ON eld_fault_codes(severity);
CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_unresolved ON eld_fault_codes(vehicle_id) WHERE resolved_at IS NULL;

-- Entity Mappings indexes
CREATE INDEX IF NOT EXISTS idx_eld_entity_mappings_user ON eld_entity_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_eld_entity_mappings_local ON eld_entity_mappings(entity_type, local_id);
CREATE INDEX IF NOT EXISTS idx_eld_entity_mappings_external ON eld_entity_mappings(entity_type, external_id);

-- Vehicle ELD columns indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_eld_external ON vehicles(eld_external_id) WHERE eld_external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_eld_provider ON vehicles(eld_provider) WHERE eld_provider IS NOT NULL;

-- Driver ELD columns indexes
CREATE INDEX IF NOT EXISTS idx_drivers_eld_external ON drivers(eld_external_id) WHERE eld_external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_hos_status ON drivers(hos_status) WHERE hos_status IS NOT NULL;

-- IFTA trip records ELD source index
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_data_source ON ifta_trip_records(data_source);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_eld_connection ON ifta_trip_records(eld_connection_id) WHERE eld_connection_id IS NOT NULL;

-- =====================================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE eld_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_hos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_hos_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_ifta_mileage ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_fault_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_entity_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
DO $$ BEGIN
  -- eld_connections policies
  DROP POLICY IF EXISTS "Users can view own ELD connections" ON eld_connections;
  CREATE POLICY "Users can view own ELD connections" ON eld_connections FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own ELD connections" ON eld_connections;
  CREATE POLICY "Users can insert own ELD connections" ON eld_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own ELD connections" ON eld_connections;
  CREATE POLICY "Users can update own ELD connections" ON eld_connections FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete own ELD connections" ON eld_connections;
  CREATE POLICY "Users can delete own ELD connections" ON eld_connections FOR DELETE USING (auth.uid() = user_id);

  -- eld_sync_jobs policies
  DROP POLICY IF EXISTS "Users can view own sync jobs" ON eld_sync_jobs;
  CREATE POLICY "Users can view own sync jobs" ON eld_sync_jobs FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own sync jobs" ON eld_sync_jobs;
  CREATE POLICY "Users can insert own sync jobs" ON eld_sync_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own sync jobs" ON eld_sync_jobs;
  CREATE POLICY "Users can update own sync jobs" ON eld_sync_jobs FOR UPDATE USING (auth.uid() = user_id);

  -- eld_vehicle_locations policies
  DROP POLICY IF EXISTS "Users can view own vehicle locations" ON eld_vehicle_locations;
  CREATE POLICY "Users can view own vehicle locations" ON eld_vehicle_locations FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own vehicle locations" ON eld_vehicle_locations;
  CREATE POLICY "Users can insert own vehicle locations" ON eld_vehicle_locations FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- eld_hos_logs policies
  DROP POLICY IF EXISTS "Users can view own HOS logs" ON eld_hos_logs;
  CREATE POLICY "Users can view own HOS logs" ON eld_hos_logs FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own HOS logs" ON eld_hos_logs;
  CREATE POLICY "Users can insert own HOS logs" ON eld_hos_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- eld_hos_daily_logs policies
  DROP POLICY IF EXISTS "Users can view own HOS daily logs" ON eld_hos_daily_logs;
  CREATE POLICY "Users can view own HOS daily logs" ON eld_hos_daily_logs FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own HOS daily logs" ON eld_hos_daily_logs;
  CREATE POLICY "Users can insert own HOS daily logs" ON eld_hos_daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own HOS daily logs" ON eld_hos_daily_logs;
  CREATE POLICY "Users can update own HOS daily logs" ON eld_hos_daily_logs FOR UPDATE USING (auth.uid() = user_id);

  -- eld_ifta_mileage policies
  DROP POLICY IF EXISTS "Users can view own IFTA mileage" ON eld_ifta_mileage;
  CREATE POLICY "Users can view own IFTA mileage" ON eld_ifta_mileage FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own IFTA mileage" ON eld_ifta_mileage;
  CREATE POLICY "Users can insert own IFTA mileage" ON eld_ifta_mileage FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own IFTA mileage" ON eld_ifta_mileage;
  CREATE POLICY "Users can update own IFTA mileage" ON eld_ifta_mileage FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete own IFTA mileage" ON eld_ifta_mileage;
  CREATE POLICY "Users can delete own IFTA mileage" ON eld_ifta_mileage FOR DELETE USING (auth.uid() = user_id);

  -- eld_fault_codes policies
  DROP POLICY IF EXISTS "Users can view own fault codes" ON eld_fault_codes;
  CREATE POLICY "Users can view own fault codes" ON eld_fault_codes FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own fault codes" ON eld_fault_codes;
  CREATE POLICY "Users can insert own fault codes" ON eld_fault_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own fault codes" ON eld_fault_codes;
  CREATE POLICY "Users can update own fault codes" ON eld_fault_codes FOR UPDATE USING (auth.uid() = user_id);

  -- eld_entity_mappings policies
  DROP POLICY IF EXISTS "Users can view own entity mappings" ON eld_entity_mappings;
  CREATE POLICY "Users can view own entity mappings" ON eld_entity_mappings FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own entity mappings" ON eld_entity_mappings;
  CREATE POLICY "Users can insert own entity mappings" ON eld_entity_mappings FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own entity mappings" ON eld_entity_mappings;
  CREATE POLICY "Users can update own entity mappings" ON eld_entity_mappings FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete own entity mappings" ON eld_entity_mappings;
  CREATE POLICY "Users can delete own entity mappings" ON eld_entity_mappings FOR DELETE USING (auth.uid() = user_id);

EXCEPTION WHEN others THEN NULL;
END $$;

-- =====================================================
-- PART 5: HELPER FUNCTIONS
-- =====================================================

-- Function to get quarter string from year and month
CREATE OR REPLACE FUNCTION get_quarter_string(p_year INTEGER, p_month INTEGER)
RETURNS VARCHAR(7)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_year::TEXT || '-Q' || CEIL(p_month / 3.0)::INTEGER::TEXT;
END;
$$;

COMMENT ON FUNCTION get_quarter_string IS 'Converts year and month to quarter string (e.g., 2025-Q1)';

-- Function to update vehicle last location from eld_vehicle_locations
CREATE OR REPLACE FUNCTION update_vehicle_last_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.vehicle_id IS NOT NULL THEN
    UPDATE vehicles
    SET
      last_known_location = jsonb_build_object(
        'lat', NEW.latitude,
        'lng', NEW.longitude,
        'speed', NEW.speed_mph,
        'heading', NEW.heading,
        'address', NEW.address
      ),
      last_location_at = NEW.recorded_at
    WHERE id = NEW.vehicle_id
    AND (last_location_at IS NULL OR last_location_at < NEW.recorded_at);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-update vehicle location
DROP TRIGGER IF EXISTS trg_update_vehicle_location ON eld_vehicle_locations;
CREATE TRIGGER trg_update_vehicle_location
AFTER INSERT ON eld_vehicle_locations
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_last_location();

-- Function to update driver HOS status from eld_hos_daily_logs
CREATE OR REPLACE FUNCTION update_driver_hos_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    UPDATE drivers
    SET
      hos_available_drive_minutes = NEW.available_drive_minutes,
      hos_available_shift_minutes = NEW.available_shift_minutes,
      hos_available_cycle_minutes = NEW.available_cycle_minutes,
      hos_last_updated_at = NOW()
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-update driver HOS status
DROP TRIGGER IF EXISTS trg_update_driver_hos ON eld_hos_daily_logs;
CREATE TRIGGER trg_update_driver_hos
AFTER INSERT OR UPDATE ON eld_hos_daily_logs
FOR EACH ROW
EXECUTE FUNCTION update_driver_hos_status();

-- Function to auto-set quarter on eld_ifta_mileage
CREATE OR REPLACE FUNCTION set_ifta_mileage_quarter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.quarter := get_quarter_string(NEW.year, NEW.month);
  RETURN NEW;
END;
$$;

-- Trigger to auto-set quarter
DROP TRIGGER IF EXISTS trg_set_ifta_quarter ON eld_ifta_mileage;
CREATE TRIGGER trg_set_ifta_quarter
BEFORE INSERT OR UPDATE ON eld_ifta_mileage
FOR EACH ROW
EXECUTE FUNCTION set_ifta_mileage_quarter();

-- =====================================================
-- PART 6: UPDATED_AT TRIGGERS
-- =====================================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_eld_connections_updated_at ON eld_connections;
CREATE TRIGGER update_eld_connections_updated_at
BEFORE UPDATE ON eld_connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eld_hos_daily_logs_updated_at ON eld_hos_daily_logs;
CREATE TRIGGER update_eld_hos_daily_logs_updated_at
BEFORE UPDATE ON eld_hos_daily_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eld_ifta_mileage_updated_at ON eld_ifta_mileage;
CREATE TRIGGER update_eld_ifta_mileage_updated_at
BEFORE UPDATE ON eld_ifta_mileage
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eld_entity_mappings_updated_at ON eld_entity_mappings;
CREATE TRIGGER update_eld_entity_mappings_updated_at
BEFORE UPDATE ON eld_entity_mappings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- New tables created:
--   - eld_connections
--   - eld_sync_jobs
--   - eld_vehicle_locations
--   - eld_hos_logs
--   - eld_hos_daily_logs
--   - eld_ifta_mileage
--   - eld_fault_codes
--   - eld_entity_mappings
--
-- Modified tables:
--   - vehicles (added ELD columns)
--   - drivers (added ELD/HOS columns)
--   - ifta_trip_records (added ELD source columns)
-- =====================================================
