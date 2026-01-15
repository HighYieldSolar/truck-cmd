-- Phase 3: Automated IFTA - Jurisdiction Detection Infrastructure
-- This migration adds support for automatic state/province mileage calculation
-- using GPS data from ELD providers

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- JURISDICTION BOUNDARIES TABLE
-- Stores GeoJSON boundaries for US states and Canadian provinces
-- ============================================================================
CREATE TABLE IF NOT EXISTS ifta_jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,           -- State/province code (e.g., 'TX', 'ON')
    name VARCHAR(100) NOT NULL,                  -- Full name (e.g., 'Texas', 'Ontario')
    country VARCHAR(2) NOT NULL DEFAULT 'US',    -- 'US' or 'CA'
    boundary GEOMETRY(MultiPolygon, 4326),       -- PostGIS geometry (WGS84)
    centroid GEOMETRY(Point, 4326),              -- Center point for quick lookups
    is_ifta_member BOOLEAN DEFAULT true,         -- IFTA participating jurisdiction
    tax_rate NUMERIC(6,4),                       -- Current fuel tax rate ($ per gallon)
    tax_rate_effective_date DATE,                -- When current rate became effective
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast point-in-polygon queries
CREATE INDEX IF NOT EXISTS idx_ifta_jurisdictions_boundary
    ON ifta_jurisdictions USING GIST (boundary);

CREATE INDEX IF NOT EXISTS idx_ifta_jurisdictions_code
    ON ifta_jurisdictions (code);

-- ============================================================================
-- ELD GPS BREADCRUMBS TABLE
-- Stores GPS position history from ELD providers for jurisdiction detection
-- ============================================================================
CREATE TABLE IF NOT EXISTS eld_gps_breadcrumbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    eld_connection_id UUID REFERENCES eld_connections(id) ON DELETE SET NULL,

    -- GPS Data
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    ) STORED,

    -- Position metadata
    heading NUMERIC(5,2),                        -- Direction in degrees (0-360)
    speed_mph NUMERIC(6,2),                      -- Speed at this point
    odometer NUMERIC(12,2),                      -- Odometer reading if available
    accuracy_meters NUMERIC(8,2),                -- GPS accuracy

    -- Jurisdiction (computed)
    jurisdiction VARCHAR(10),                    -- Detected state/province code
    jurisdiction_detected_at TIMESTAMPTZ,        -- When jurisdiction was computed

    -- Timestamps
    recorded_at TIMESTAMPTZ NOT NULL,            -- When GPS reading was taken
    received_at TIMESTAMPTZ DEFAULT NOW(),       -- When we received from ELD
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Provider reference
    provider VARCHAR(50),                        -- 'motive', 'samsara', 'keeptruckin'
    external_id VARCHAR(255)                     -- Provider's ID for this reading
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_eld_breadcrumbs_user_vehicle
    ON eld_gps_breadcrumbs (user_id, vehicle_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_eld_breadcrumbs_location
    ON eld_gps_breadcrumbs USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_eld_breadcrumbs_recorded_at
    ON eld_gps_breadcrumbs (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_eld_breadcrumbs_jurisdiction
    ON eld_gps_breadcrumbs (user_id, jurisdiction, recorded_at);

-- ============================================================================
-- AUTOMATED JURISDICTION CROSSINGS TABLE
-- Records detected state/province boundary crossings from GPS data
-- ============================================================================
CREATE TABLE IF NOT EXISTS ifta_automated_crossings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    -- Crossing details
    from_jurisdiction VARCHAR(10) NOT NULL,      -- State/province exited
    to_jurisdiction VARCHAR(10) NOT NULL,        -- State/province entered
    crossing_timestamp TIMESTAMPTZ NOT NULL,     -- When crossing occurred

    -- GPS coordinates at crossing point
    crossing_latitude NUMERIC(10,7) NOT NULL,
    crossing_longitude NUMERIC(10,7) NOT NULL,
    crossing_location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(crossing_longitude, crossing_latitude), 4326)
    ) STORED,

    -- Odometer tracking
    odometer_at_crossing NUMERIC(12,2),          -- Odometer at crossing point

    -- Breadcrumb references
    before_breadcrumb_id UUID REFERENCES eld_gps_breadcrumbs(id),
    after_breadcrumb_id UUID REFERENCES eld_gps_breadcrumbs(id),

    -- Processing metadata
    detection_method VARCHAR(50) DEFAULT 'interpolation', -- 'interpolation', 'direct', 'estimated'
    confidence_score NUMERIC(3,2),               -- 0.00-1.00 confidence in crossing accuracy

    -- Quarter tracking for IFTA
    quarter VARCHAR(7),                          -- 'YYYY-QN' format

    -- IFTA integration
    ifta_trip_id UUID REFERENCES ifta_trip_records(id) ON DELETE SET NULL,
    is_processed BOOLEAN DEFAULT false,          -- Has this been added to IFTA records?
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_crossing UNIQUE (vehicle_id, crossing_timestamp, from_jurisdiction, to_jurisdiction)
);

-- Indexes for crossing queries
CREATE INDEX IF NOT EXISTS idx_ifta_crossings_user_vehicle
    ON ifta_automated_crossings (user_id, vehicle_id, crossing_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ifta_crossings_quarter
    ON ifta_automated_crossings (user_id, quarter);

CREATE INDEX IF NOT EXISTS idx_ifta_crossings_unprocessed
    ON ifta_automated_crossings (user_id, is_processed)
    WHERE is_processed = false;

-- ============================================================================
-- AUTOMATED IFTA MILEAGE TABLE
-- Aggregated mileage by vehicle, jurisdiction, and quarter
-- ============================================================================
CREATE TABLE IF NOT EXISTS ifta_automated_mileage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Period and jurisdiction
    quarter VARCHAR(7) NOT NULL,                 -- 'YYYY-QN' format
    jurisdiction VARCHAR(10) NOT NULL,           -- State/province code

    -- Mileage data
    total_miles NUMERIC(12,2) DEFAULT 0,         -- Total miles in this jurisdiction
    gps_miles NUMERIC(12,2) DEFAULT 0,           -- Miles calculated from GPS
    odometer_miles NUMERIC(12,2) DEFAULT 0,      -- Miles calculated from odometer

    -- Tracking
    entry_count INTEGER DEFAULT 0,               -- Number of GPS entries
    crossing_count INTEGER DEFAULT 0,            -- Number of crossings in/out
    first_entry_at TIMESTAMPTZ,                  -- First GPS point in jurisdiction
    last_entry_at TIMESTAMPTZ,                   -- Last GPS point in jurisdiction

    -- Status
    is_finalized BOOLEAN DEFAULT false,          -- Locked for IFTA report
    finalized_at TIMESTAMPTZ,

    -- Audit
    last_calculated_at TIMESTAMPTZ,
    calculation_method VARCHAR(50),              -- 'gps', 'odometer', 'hybrid'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_vehicle_quarter_jurisdiction
        UNIQUE (user_id, vehicle_id, quarter, jurisdiction)
);

-- Indexes for mileage queries
CREATE INDEX IF NOT EXISTS idx_ifta_auto_mileage_quarter
    ON ifta_automated_mileage (user_id, quarter);

CREATE INDEX IF NOT EXISTS idx_ifta_auto_mileage_vehicle
    ON ifta_automated_mileage (user_id, vehicle_id, quarter);

-- ============================================================================
-- FUNCTIONS FOR JURISDICTION DETECTION
-- ============================================================================

-- Function to determine jurisdiction from GPS coordinates
CREATE OR REPLACE FUNCTION get_jurisdiction_for_point(
    p_latitude NUMERIC,
    p_longitude NUMERIC
) RETURNS VARCHAR(10) AS $$
DECLARE
    v_jurisdiction VARCHAR(10);
    v_point GEOMETRY;
BEGIN
    -- Create point geometry
    v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);

    -- Find containing jurisdiction
    SELECT code INTO v_jurisdiction
    FROM ifta_jurisdictions
    WHERE ST_Contains(boundary, v_point)
    LIMIT 1;

    RETURN v_jurisdiction;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to detect jurisdiction and update breadcrumb
CREATE OR REPLACE FUNCTION detect_breadcrumb_jurisdiction()
RETURNS TRIGGER AS $$
BEGIN
    -- Detect jurisdiction for new breadcrumb
    NEW.jurisdiction := get_jurisdiction_for_point(NEW.latitude, NEW.longitude);
    NEW.jurisdiction_detected_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-detect jurisdiction on breadcrumb insert
DROP TRIGGER IF EXISTS trigger_detect_jurisdiction ON eld_gps_breadcrumbs;
CREATE TRIGGER trigger_detect_jurisdiction
    BEFORE INSERT ON eld_gps_breadcrumbs
    FOR EACH ROW
    EXECUTE FUNCTION detect_breadcrumb_jurisdiction();

-- Function to process breadcrumbs and detect crossings
CREATE OR REPLACE FUNCTION process_jurisdiction_crossings(
    p_user_id UUID,
    p_vehicle_id UUID,
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_crossings_found INTEGER := 0;
    v_prev_jurisdiction VARCHAR(10);
    v_prev_timestamp TIMESTAMPTZ;
    v_prev_lat NUMERIC;
    v_prev_lon NUMERIC;
    v_prev_odometer NUMERIC;
    v_current RECORD;
    v_quarter VARCHAR(7);
BEGIN
    -- Get ordered breadcrumbs for this vehicle
    FOR v_current IN (
        SELECT
            id,
            latitude,
            longitude,
            jurisdiction,
            recorded_at,
            odometer
        FROM eld_gps_breadcrumbs
        WHERE user_id = p_user_id
          AND vehicle_id = p_vehicle_id
          AND jurisdiction IS NOT NULL
          AND (p_start_time IS NULL OR recorded_at >= p_start_time)
          AND (p_end_time IS NULL OR recorded_at <= p_end_time)
        ORDER BY recorded_at ASC
    ) LOOP
        -- Check for jurisdiction change
        IF v_prev_jurisdiction IS NOT NULL
           AND v_current.jurisdiction != v_prev_jurisdiction THEN

            -- Calculate quarter
            v_quarter := TO_CHAR(v_current.recorded_at, 'YYYY') || '-Q' ||
                        CEIL(EXTRACT(MONTH FROM v_current.recorded_at) / 3.0)::INTEGER;

            -- Insert crossing record
            INSERT INTO ifta_automated_crossings (
                user_id,
                vehicle_id,
                from_jurisdiction,
                to_jurisdiction,
                crossing_timestamp,
                crossing_latitude,
                crossing_longitude,
                odometer_at_crossing,
                quarter,
                detection_method,
                confidence_score
            ) VALUES (
                p_user_id,
                p_vehicle_id,
                v_prev_jurisdiction,
                v_current.jurisdiction,
                v_current.recorded_at,
                -- Interpolate crossing point (midpoint for now)
                (v_prev_lat + v_current.latitude) / 2,
                (v_prev_lon + v_current.longitude) / 2,
                v_current.odometer,
                v_quarter,
                'interpolation',
                0.85
            ) ON CONFLICT (vehicle_id, crossing_timestamp, from_jurisdiction, to_jurisdiction)
              DO NOTHING;

            v_crossings_found := v_crossings_found + 1;
        END IF;

        -- Update previous values
        v_prev_jurisdiction := v_current.jurisdiction;
        v_prev_timestamp := v_current.recorded_at;
        v_prev_lat := v_current.latitude;
        v_prev_lon := v_current.longitude;
        v_prev_odometer := v_current.odometer;
    END LOOP;

    RETURN v_crossings_found;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate mileage for a quarter
CREATE OR REPLACE FUNCTION calculate_automated_ifta_mileage(
    p_user_id UUID,
    p_vehicle_id UUID,
    p_quarter VARCHAR(7)
) RETURNS TABLE (
    jurisdiction VARCHAR(10),
    total_miles NUMERIC,
    entry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH crossing_segments AS (
        -- Get all crossings for this vehicle/quarter
        SELECT
            c.to_jurisdiction as jurisdiction,
            c.crossing_timestamp,
            c.odometer_at_crossing,
            LEAD(c.odometer_at_crossing) OVER (ORDER BY c.crossing_timestamp) as next_odometer,
            LEAD(c.crossing_timestamp) OVER (ORDER BY c.crossing_timestamp) as next_timestamp
        FROM ifta_automated_crossings c
        WHERE c.user_id = p_user_id
          AND c.vehicle_id = p_vehicle_id
          AND c.quarter = p_quarter
        ORDER BY c.crossing_timestamp
    ),
    mileage_calc AS (
        SELECT
            cs.jurisdiction,
            COALESCE(cs.next_odometer - cs.odometer_at_crossing, 0) as miles
        FROM crossing_segments cs
        WHERE cs.next_odometer IS NOT NULL
    )
    SELECT
        mc.jurisdiction,
        SUM(mc.miles)::NUMERIC as total_miles,
        COUNT(*)::INTEGER as entry_count
    FROM mileage_calc mc
    GROUP BY mc.jurisdiction;
END;
$$ LANGUAGE plpgsql;

-- Function to increment IFTA mileage atomically
CREATE OR REPLACE FUNCTION increment_ifta_mileage(
    p_user_id UUID,
    p_vehicle_id UUID,
    p_quarter VARCHAR(7),
    p_jurisdiction VARCHAR(10),
    p_miles NUMERIC
) RETURNS UUID AS $$
DECLARE
    v_record_id UUID;
BEGIN
    INSERT INTO ifta_automated_mileage (
        user_id,
        vehicle_id,
        quarter,
        jurisdiction,
        total_miles,
        gps_miles,
        entry_count,
        last_calculated_at,
        calculation_method
    ) VALUES (
        p_user_id,
        p_vehicle_id,
        p_quarter,
        p_jurisdiction,
        p_miles,
        p_miles,
        1,
        NOW(),
        'gps'
    )
    ON CONFLICT (user_id, vehicle_id, quarter, jurisdiction)
    DO UPDATE SET
        total_miles = ifta_automated_mileage.total_miles + EXCLUDED.total_miles,
        gps_miles = ifta_automated_mileage.gps_miles + EXCLUDED.gps_miles,
        entry_count = ifta_automated_mileage.entry_count + 1,
        last_calculated_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_record_id;

    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE ifta_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eld_gps_breadcrumbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ifta_automated_crossings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ifta_automated_mileage ENABLE ROW LEVEL SECURITY;

-- Jurisdictions are public read
CREATE POLICY "Anyone can read jurisdictions"
    ON ifta_jurisdictions FOR SELECT
    USING (true);

-- GPS Breadcrumbs - user owns their data
CREATE POLICY "Users can view own breadcrumbs"
    ON eld_gps_breadcrumbs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own breadcrumbs"
    ON eld_gps_breadcrumbs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Automated Crossings - user owns their data
CREATE POLICY "Users can view own crossings"
    ON ifta_automated_crossings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crossings"
    ON ifta_automated_crossings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crossings"
    ON ifta_automated_crossings FOR UPDATE
    USING (auth.uid() = user_id);

-- Automated Mileage - user owns their data
CREATE POLICY "Users can view own automated mileage"
    ON ifta_automated_mileage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own automated mileage"
    ON ifta_automated_mileage FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE ifta_jurisdictions IS 'US states and Canadian provinces with PostGIS boundaries for IFTA jurisdiction detection';
COMMENT ON TABLE eld_gps_breadcrumbs IS 'GPS position history from ELD providers for automatic jurisdiction tracking';
COMMENT ON TABLE ifta_automated_crossings IS 'Detected state/province boundary crossings from GPS data';
COMMENT ON TABLE ifta_automated_mileage IS 'Aggregated mileage by vehicle, jurisdiction, and quarter from automated tracking';

COMMENT ON FUNCTION get_jurisdiction_for_point IS 'Returns the state/province code for a given GPS coordinate';
COMMENT ON FUNCTION process_jurisdiction_crossings IS 'Processes GPS breadcrumbs to detect jurisdiction boundary crossings';
COMMENT ON FUNCTION calculate_automated_ifta_mileage IS 'Calculates total mileage by jurisdiction for a quarter';
COMMENT ON FUNCTION increment_ifta_mileage IS 'Atomically increments mileage for a jurisdiction (used by webhooks)';

-- ============================================================================
-- FUNCTION TO UPSERT JURISDICTION BOUNDARIES
-- Used by the boundary loader service
-- ============================================================================
CREATE OR REPLACE FUNCTION upsert_jurisdiction_boundary(
    p_code VARCHAR(10),
    p_name VARCHAR(100),
    p_country VARCHAR(2),
    p_boundary_geojson TEXT,
    p_centroid_wkt TEXT,
    p_is_ifta_member BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_boundary GEOMETRY;
    v_centroid GEOMETRY;
BEGIN
    -- Parse GeoJSON boundary
    IF p_boundary_geojson IS NOT NULL THEN
        v_boundary := ST_Multi(ST_GeomFromGeoJSON(p_boundary_geojson));
        v_boundary := ST_SetSRID(v_boundary, 4326);
    END IF;

    -- Parse WKT centroid
    IF p_centroid_wkt IS NOT NULL THEN
        v_centroid := ST_GeomFromEWKT(p_centroid_wkt);
    ELSIF v_boundary IS NOT NULL THEN
        -- Calculate centroid from boundary if not provided
        v_centroid := ST_Centroid(v_boundary);
    END IF;

    -- Upsert the jurisdiction record
    INSERT INTO ifta_jurisdictions (
        code,
        name,
        country,
        boundary,
        centroid,
        is_ifta_member,
        updated_at
    ) VALUES (
        p_code,
        p_name,
        p_country,
        v_boundary,
        v_centroid,
        p_is_ifta_member,
        NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        boundary = EXCLUDED.boundary,
        centroid = EXCLUDED.centroid,
        is_ifta_member = EXCLUDED.is_ifta_member,
        updated_at = NOW()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to batch lookup jurisdictions for multiple points
CREATE OR REPLACE FUNCTION get_jurisdictions_for_points(
    p_latitudes NUMERIC[],
    p_longitudes NUMERIC[]
) RETURNS VARCHAR(10)[] AS $$
DECLARE
    v_results VARCHAR(10)[];
    v_point GEOMETRY;
    v_jurisdiction VARCHAR(10);
    i INTEGER;
BEGIN
    -- Initialize result array
    v_results := ARRAY[]::VARCHAR(10)[];

    -- Process each coordinate pair
    FOR i IN 1..array_length(p_latitudes, 1) LOOP
        v_point := ST_SetSRID(ST_MakePoint(p_longitudes[i], p_latitudes[i]), 4326);

        SELECT code INTO v_jurisdiction
        FROM ifta_jurisdictions
        WHERE ST_Contains(boundary, v_point)
        LIMIT 1;

        v_results := array_append(v_results, v_jurisdiction);
    END LOOP;

    RETURN v_results;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION upsert_jurisdiction_boundary IS 'Upserts a jurisdiction boundary from GeoJSON';
COMMENT ON FUNCTION get_jurisdictions_for_points IS 'Batch lookup jurisdictions for multiple GPS coordinates';
