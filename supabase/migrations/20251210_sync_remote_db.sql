-- =====================================================
-- TRUCK COMMAND - Remote Database Sync Migration
-- Generated: 2025-12-10
-- Run this in your REMOTE Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: ENSURE ALL COLUMNS EXIST
-- (These use ADD COLUMN IF NOT EXISTS pattern)
-- =====================================================

-- Subscriptions table - scheduled plan columns
DO $$ BEGIN
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS checkout_initiated_at TIMESTAMPTZ;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS scheduled_plan VARCHAR;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS scheduled_billing_cycle VARCHAR;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS scheduled_amount NUMERIC;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add comments to subscription columns
COMMENT ON COLUMN subscriptions.cancellation_reason IS 'Reason provided by user for cancelling subscription';
COMMENT ON COLUMN subscriptions.cancellation_feedback IS 'Additional feedback provided by user when cancelling';
COMMENT ON COLUMN subscriptions.scheduled_plan IS 'Plan that will take effect at next billing cycle (for downgrades)';
COMMENT ON COLUMN subscriptions.scheduled_billing_cycle IS 'Billing cycle that will take effect at next billing cycle (for downgrades)';
COMMENT ON COLUMN subscriptions.scheduled_amount IS 'Amount that will be charged at next billing cycle when a scheduled plan change takes effect';

-- Vehicles table - document expiry and driver assignment columns
DO $$ BEGIN
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_expiry DATE;
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspection_expiry DATE;
  ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES drivers(id);
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN vehicles.registration_expiry IS 'Vehicle registration expiration date';
COMMENT ON COLUMN vehicles.insurance_expiry IS 'Vehicle insurance policy expiration date';
COMMENT ON COLUMN vehicles.inspection_expiry IS 'DOT/Annual inspection expiration date';
COMMENT ON COLUMN vehicles.assigned_driver_id IS 'Primary driver assigned to this vehicle';

-- Drivers table - image_url column
DO $$ BEGIN
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS image_url TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Maintenance records - expense_id column
DO $$ BEGIN
  ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id);
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN maintenance_records.expense_id IS 'Reference to the corresponding expense entry when maintenance is completed and synced';

-- Fuel entries - expense_id and payment_method
DO $$ BEGIN
  ALTER TABLE fuel_entries ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id);
  ALTER TABLE fuel_entries ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Credit Card';
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN fuel_entries.expense_id IS 'Reference to the corresponding expense entry if this fuel purchase has been synced';

-- Notifications - delivery tracking columns
DO $$ BEGIN
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT FALSE;
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN notifications.email_sent IS 'Whether email notification was successfully sent';
COMMENT ON COLUMN notifications.sms_sent IS 'Whether SMS notification was successfully sent';
COMMENT ON COLUMN notifications.delivered_at IS 'Timestamp when notification was delivered via email/SMS';

-- IFTA trip records - import tracking columns
DO $$ BEGIN
  ALTER TABLE ifta_trip_records ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE;
  ALTER TABLE ifta_trip_records ADD COLUMN IF NOT EXISTS mileage_trip_id UUID REFERENCES driver_mileage_trips(id);
  ALTER TABLE ifta_trip_records ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN ifta_trip_records.is_imported IS 'Flag indicating if this record was imported from another source like state mileage tracker or load data';
COMMENT ON COLUMN ifta_trip_records.mileage_trip_id IS 'Reference to the state mileage trip that this IFTA record was imported from';
COMMENT ON COLUMN ifta_trip_records.source IS 'Source of the imported data, e.g., "mileage_tracker", "load_management"';

-- Driver mileage crossings - crossing_date column
DO $$ BEGIN
  ALTER TABLE driver_mileage_crossings ADD COLUMN IF NOT EXISTS crossing_date DATE;
EXCEPTION WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN driver_mileage_crossings.crossing_date IS 'Date when the driver crossed into this state (user-specified)';

-- =====================================================
-- PART 2: UNIQUE CONSTRAINTS
-- =====================================================

-- Subscriptions user_id unique constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_unique') THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- User settings unique constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_user_id_setting_key_unique') THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_setting_key_unique UNIQUE (user_id, setting_key);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- =====================================================
-- PART 3: INDEXES
-- =====================================================

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_due_date ON notifications(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_urgency ON notifications(urgency);
CREATE INDEX IF NOT EXISTS idx_notifications_type_user ON notifications(notification_type, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created ON notifications(user_id, notification_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery ON notifications(created_at, delivered_at) WHERE delivered_at IS NULL;

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);

-- Drivers indexes
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- Loads indexes
CREATE INDEX IF NOT EXISTS idx_loads_user_id ON loads(user_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON loads(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_vehicle_id ON loads(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX IF NOT EXISTS idx_loads_delivery_date ON loads(delivery_date);
CREATE INDEX IF NOT EXISTS idx_loads_load_number ON loads(load_number);
CREATE INDEX IF NOT EXISTS idx_loads_completed_by ON loads(completed_by);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_load_id ON invoices(load_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Invoice items/activities indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_activities_invoice_id ON invoice_activities(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_activities_user_id ON invoice_activities(user_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_driver_id ON expenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_load_id ON expenses(load_id);

-- Fuel entries indexes
CREATE INDEX IF NOT EXISTS idx_fuel_entries_user_id ON fuel_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_date ON fuel_entries(date);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle_id ON fuel_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_driver_id ON fuel_entries(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_expense_id ON fuel_entries(expense_id);

-- IFTA indexes
CREATE INDEX IF NOT EXISTS idx_ifta_reports_user_quarter ON ifta_reports(user_id, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_reports_year ON ifta_reports(year);
CREATE INDEX IF NOT EXISTS idx_ifta_reports_status ON ifta_reports(status);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_user_quarter ON ifta_trip_records(user_id, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_start_date ON ifta_trip_records(start_date);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_end_date ON ifta_trip_records(end_date);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_load_id ON ifta_trip_records(load_id);
CREATE INDEX IF NOT EXISTS idx_ifta_trips_mileage_trip_id ON ifta_trip_records(mileage_trip_id);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_state_mileage_trip ON ifta_trip_state_mileage(trip_id);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_state_mileage_user ON ifta_trip_state_mileage(user_id);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_state_mileage_jurisdiction ON ifta_trip_state_mileage(jurisdiction);

-- Driver mileage indexes
CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_user_id ON driver_mileage_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_status ON driver_mileage_trips(status);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_start_date ON driver_mileage_trips(start_date);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_end_date ON driver_mileage_trips(end_date);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_crossings_trip_id ON driver_mileage_crossings(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_crossings_crossing_date ON driver_mileage_crossings(crossing_date);

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS maintenance_user_id_idx ON maintenance_records(user_id);
CREATE INDEX IF NOT EXISTS maintenance_truck_id_idx ON maintenance_records(truck_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_due_date ON maintenance_records(due_date);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS compliance_items_user_id_idx ON compliance_items(user_id);
CREATE INDEX IF NOT EXISTS compliance_items_status_idx ON compliance_items(status);
CREATE INDEX IF NOT EXISTS compliance_items_expiration_date_idx ON compliance_items(expiration_date);
CREATE INDEX IF NOT EXISTS compliance_items_compliance_type_idx ON compliance_items(compliance_type);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);

-- Earnings indexes
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);

-- Load documents/stops indexes
CREATE INDEX IF NOT EXISTS idx_load_documents_load_id ON load_documents(load_id);
CREATE INDEX IF NOT EXISTS idx_load_documents_uploaded_by ON load_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_load_stops_load_id ON load_stops(load_id);
CREATE INDEX IF NOT EXISTS idx_load_stops_scheduled_date ON load_stops(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_load_stops_status ON load_stops(status);

-- Processed sessions indexes
CREATE INDEX IF NOT EXISTS idx_processed_sessions_user_id ON processed_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_sessions_idempotency ON processed_sessions(idempotency_key);

-- Company/user indexes
CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON company_info(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- PART 4: UNIQUE INDEXES (for business logic)
-- =====================================================

-- Unique indexes (these may already exist, so use IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ifta_tax_rates_jurisdiction_date ON ifta_tax_rates(jurisdiction, effective_date);
CREATE UNIQUE INDEX IF NOT EXISTS ifta_report_details_report_id_state_key ON ifta_report_details(report_id, state);
CREATE UNIQUE INDEX IF NOT EXISTS unique_load_earnings ON earnings(load_id, source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_mileage_import_by_state ON ifta_trip_records(user_id, quarter, mileage_trip_id, start_jurisdiction) WHERE mileage_trip_id IS NOT NULL;

-- =====================================================
-- PART 5: HELPER FUNCTIONS
-- =====================================================

-- Create notification function
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_title text,
    p_message text,
    p_notification_type text DEFAULT 'GENERAL_REMINDER',
    p_entity_type text DEFAULT NULL,
    p_entity_id text DEFAULT NULL,
    p_link_to text DEFAULT NULL,
    p_due_date timestamp with time zone DEFAULT NULL,
    p_urgency text DEFAULT 'NORMAL'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (
        user_id, title, message, notification_type, entity_type,
        entity_id, link_to, due_date, urgency, is_read, created_at
    ) VALUES (
        p_user_id, p_title, p_message, p_notification_type, p_entity_type,
        p_entity_id, p_link_to, p_due_date, p_urgency, false,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO notification_id;
    RETURN notification_id;
END;
$function$;

-- Cleanup old notifications function
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE is_read = true
        AND read_at < (CURRENT_TIMESTAMP - INTERVAL '90 days');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$;

-- Get notification category helper
CREATE OR REPLACE FUNCTION public.get_notification_category(notification_type text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  CASE notification_type
    WHEN 'DOCUMENT_EXPIRY_COMPLIANCE' THEN RETURN 'compliance';
    WHEN 'DOCUMENT_EXPIRY_DRIVER_LICENSE' THEN RETURN 'drivers';
    WHEN 'DOCUMENT_EXPIRY_DRIVER_MEDICAL' THEN RETURN 'drivers';
    WHEN 'DOCUMENT_EXPIRY_VEHICLE' THEN RETURN 'vehicles';
    WHEN 'IFTA_DEADLINE' THEN RETURN 'ifta';
    WHEN 'DELIVERY_UPCOMING' THEN RETURN 'deliveries';
    WHEN 'INVOICE_DUE' THEN RETURN 'invoices';
    WHEN 'PAYMENT_RECEIVED' THEN RETURN 'payments';
    WHEN 'MAINTENANCE_DUE' THEN RETURN 'maintenance';
    ELSE RETURN 'general';
  END CASE;
END;
$function$;

-- =====================================================
-- PART 6: STORAGE BUCKETS
-- =====================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('company_assets', 'company_assets', false, false, NULL, NULL),
  ('documents', 'documents', false, false, NULL, NULL),
  ('drivers', 'drivers', true, false, NULL, NULL),
  ('receipts', 'receipts', false, false, NULL, NULL),
  ('vehicles', 'vehicles', true, false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 7: STORAGE POLICIES
-- =====================================================

-- Avatars bucket policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Avatar update for authenticated users" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Avatar delete for authenticated users" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Avatar upload for authenticated users" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar update for authenticated users" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar delete for authenticated users" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- DONE!
-- =====================================================
SELECT 'Remote database sync complete!' as status;
