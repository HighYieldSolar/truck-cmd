-- Truck Command Database Indexes Migration
-- Generated: 2026-01-24
-- This file creates all indexes for optimal query performance
-- Run this AFTER 001_schema.sql

-- ============================================
-- USER & COMPANY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON public.company_info USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON public.company_profiles USING btree (user_id);

-- ============================================
-- SUBSCRIPTION INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_processed_sessions_idempotency ON public.processed_sessions USING btree (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_processed_sessions_user_id ON public.processed_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_launch_waitlist_email ON public.launch_waitlist USING btree (email);
CREATE INDEX IF NOT EXISTS idx_launch_waitlist_notified ON public.launch_waitlist USING btree (notified_at) WHERE (notified_at IS NULL);

-- ============================================
-- DRIVER INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers USING btree (status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers USING btree (user_id);

-- ============================================
-- VEHICLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver ON public.vehicles USING btree (assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles USING btree (status);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles USING btree (user_id);

-- ============================================
-- CUSTOMER INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers USING btree (status);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers USING btree (user_id);

-- ============================================
-- LOAD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loads_completed_by ON public.loads USING btree (completed_by);
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON public.loads USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_delivery_date ON public.loads USING btree (delivery_date);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON public.loads USING btree (driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_load_number ON public.loads USING btree (load_number);
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON public.loads USING btree (pickup_date);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads USING btree (status);
CREATE INDEX IF NOT EXISTS idx_loads_user_id ON public.loads USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_loads_vehicle_id ON public.loads USING btree (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_load_stops_load_id ON public.load_stops USING btree (load_id);
CREATE INDEX IF NOT EXISTS idx_load_stops_scheduled_date ON public.load_stops USING btree (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_load_stops_status ON public.load_stops USING btree (status);

CREATE INDEX IF NOT EXISTS idx_load_documents_load_id ON public.load_documents USING btree (load_id);
CREATE INDEX IF NOT EXISTS idx_load_documents_uploaded_by ON public.load_documents USING btree (uploaded_by);

-- ============================================
-- EARNINGS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON public.earnings USING btree (user_id);

-- ============================================
-- EXPENSE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses USING btree (date);
CREATE INDEX IF NOT EXISTS idx_expenses_driver_id ON public.expenses USING btree (driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_load_id ON public.expenses USING btree (load_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON public.expenses USING btree (vehicle_id);

-- ============================================
-- FUEL ENTRY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_fuel_entries_date ON public.fuel_entries USING btree (date);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_driver_id ON public.fuel_entries USING btree (driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_expense_id ON public.fuel_entries USING btree (expense_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_user_id ON public.fuel_entries USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle_id ON public.fuel_entries USING btree (vehicle_id);

-- ============================================
-- INVOICE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices USING btree (invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_load_id ON public.invoices USING btree (load_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices USING btree (status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_activities_invoice_id ON public.invoice_activities USING btree (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_activities_user_id ON public.invoice_activities USING btree (user_id);

-- ============================================
-- PAYMENT INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments USING btree (date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments USING btree (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments USING btree (user_id);

-- ============================================
-- DRIVER MILEAGE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_end_date ON public.driver_mileage_trips USING btree (end_date);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_start_date ON public.driver_mileage_trips USING btree (start_date);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_status ON public.driver_mileage_trips USING btree (status);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_trips_user_id ON public.driver_mileage_trips USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_driver_mileage_crossings_crossing_date ON public.driver_mileage_crossings USING btree (crossing_date);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_crossings_trip_id ON public.driver_mileage_crossings USING btree (trip_id);

-- ============================================
-- IFTA INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ifta_trip_load_id ON public.ifta_trip_records USING btree (load_id);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_end_date ON public.ifta_trip_records USING btree (end_date);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_start_date ON public.ifta_trip_records USING btree (start_date);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_records_user_quarter ON public.ifta_trip_records USING btree (user_id, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_trips_mileage_trip_id ON public.ifta_trip_records USING btree (mileage_trip_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_mileage_import_by_state ON public.ifta_trip_records USING btree (user_id, quarter, mileage_trip_id, start_jurisdiction) WHERE (mileage_trip_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_ifta_trip_state_mileage_jurisdiction ON public.ifta_trip_state_mileage USING btree (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_state_mileage_trip ON public.ifta_trip_state_mileage USING btree (trip_id);
CREATE INDEX IF NOT EXISTS idx_ifta_trip_state_mileage_user ON public.ifta_trip_state_mileage USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_ifta_reports_status ON public.ifta_reports USING btree (status);
CREATE INDEX IF NOT EXISTS idx_ifta_reports_user_quarter ON public.ifta_reports USING btree (user_id, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_reports_year ON public.ifta_reports USING btree (year);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ifta_tax_rates_jurisdiction_date ON public.ifta_tax_rates USING btree (jurisdiction, effective_date);

CREATE INDEX IF NOT EXISTS idx_ifta_automated_mileage_eld_vehicle ON public.ifta_automated_mileage USING btree (eld_vehicle_id) WHERE (eld_vehicle_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ifta_automated_mileage_jurisdiction ON public.ifta_automated_mileage USING btree (jurisdiction);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ifta_automated_mileage_unique ON public.ifta_automated_mileage USING btree (user_id, COALESCE(eld_vehicle_id, (vehicle_id)::text), jurisdiction, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_automated_mileage_user_quarter ON public.ifta_automated_mileage USING btree (user_id, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_automated_mileage_vehicle ON public.ifta_automated_mileage USING btree (vehicle_id) WHERE (vehicle_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_ifta_automated_crossings_time ON public.ifta_automated_crossings USING btree (crossing_time DESC);
CREATE INDEX IF NOT EXISTS idx_ifta_automated_crossings_user_quarter ON public.ifta_automated_crossings USING btree (user_id, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_automated_crossings_vehicle ON public.ifta_automated_crossings USING btree (vehicle_id) WHERE (vehicle_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_ifta_realtime_mileage_org_quarter ON public.ifta_realtime_mileage USING btree (organization_id, quarter);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ifta_realtime_mileage_unique ON public.ifta_realtime_mileage USING btree (organization_id, COALESCE(eld_vehicle_id, (vehicle_id)::text), jurisdiction, quarter);
CREATE INDEX IF NOT EXISTS idx_ifta_realtime_mileage_vehicle ON public.ifta_realtime_mileage USING btree (organization_id, eld_vehicle_id);

-- ============================================
-- ELD CONNECTION INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_connections_provider ON public.eld_connections USING btree (provider);
CREATE INDEX IF NOT EXISTS idx_eld_connections_status ON public.eld_connections USING btree (status);
CREATE INDEX IF NOT EXISTS idx_eld_connections_user ON public.eld_connections USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_eld_driver_mappings_connection ON public.eld_driver_mappings USING btree (connection_id);

CREATE INDEX IF NOT EXISTS idx_eld_vehicle_mappings_connection ON public.eld_vehicle_mappings USING btree (connection_id);

CREATE INDEX IF NOT EXISTS idx_eld_entity_mappings_external ON public.eld_entity_mappings USING btree (entity_type, external_id);
CREATE INDEX IF NOT EXISTS idx_eld_entity_mappings_local ON public.eld_entity_mappings USING btree (entity_type, local_id);
CREATE INDEX IF NOT EXISTS idx_eld_entity_mappings_user ON public.eld_entity_mappings USING btree (user_id);

-- ============================================
-- ELD HOS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_date ON public.eld_hos_logs USING btree (log_date);
CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_driver_date ON public.eld_hos_logs USING btree (driver_mapping_id, log_date);
CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_status ON public.eld_hos_logs USING btree (duty_status);
CREATE INDEX IF NOT EXISTS idx_eld_hos_logs_user ON public.eld_hos_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_eld_hos_daily_date ON public.eld_hos_daily_logs USING btree (log_date DESC);
CREATE INDEX IF NOT EXISTS idx_eld_hos_daily_driver ON public.eld_hos_daily_logs USING btree (driver_id);
CREATE INDEX IF NOT EXISTS idx_eld_hos_daily_user ON public.eld_hos_daily_logs USING btree (user_id);

-- ============================================
-- ELD VEHICLE LOCATION INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_vehicle_locations_recorded ON public.eld_vehicle_locations USING btree (location_time DESC);
CREATE INDEX IF NOT EXISTS idx_eld_vehicle_locations_time ON public.eld_vehicle_locations USING btree (location_time);
CREATE INDEX IF NOT EXISTS idx_eld_vehicle_locations_user ON public.eld_vehicle_locations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_eld_vehicle_locations_vehicle_time ON public.eld_vehicle_locations USING btree (vehicle_mapping_id, location_time DESC);

-- ============================================
-- ELD IFTA MILEAGE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_dates ON public.eld_ifta_mileage USING btree (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_jurisdiction ON public.eld_ifta_mileage USING btree (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_quarter ON public.eld_ifta_mileage USING btree (quarter, year);
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_vehicle ON public.eld_ifta_mileage USING btree (vehicle_mapping_id);
CREATE INDEX IF NOT EXISTS idx_eld_ifta_mileage_year ON public.eld_ifta_mileage USING btree (year);

-- ============================================
-- ELD FAULT CODES INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_active ON public.eld_fault_codes USING btree (is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_severity ON public.eld_fault_codes USING btree (severity);
CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_user ON public.eld_fault_codes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_eld_fault_codes_vehicle ON public.eld_fault_codes USING btree (vehicle_mapping_id, first_observed_at DESC);

-- ============================================
-- ELD SYNC INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_sync_history_connection ON public.eld_sync_history USING btree (connection_id);

CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_connection ON public.eld_sync_jobs USING btree (connection_id);
CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_created ON public.eld_sync_jobs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_status ON public.eld_sync_jobs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_eld_sync_jobs_user ON public.eld_sync_jobs USING btree (user_id);

-- ============================================
-- ELD WEBHOOK INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_connection_id ON public.eld_webhook_events USING btree (connection_id);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_created_at ON public.eld_webhook_events USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_org_id ON public.eld_webhook_events USING btree (organization_id) WHERE (organization_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_provider_type ON public.eld_webhook_events USING btree (provider, event_type);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_status ON public.eld_webhook_events USING btree (status);
CREATE INDEX IF NOT EXISTS idx_eld_webhook_events_user_id ON public.eld_webhook_events USING btree (user_id);

-- ============================================
-- ELD GPS BREADCRUMBS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eld_gps_breadcrumbs_jurisdiction ON public.eld_gps_breadcrumbs USING btree (jurisdiction) WHERE (jurisdiction IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_eld_gps_breadcrumbs_recorded ON public.eld_gps_breadcrumbs USING btree (recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_eld_gps_breadcrumbs_user_vehicle ON public.eld_gps_breadcrumbs USING btree (user_id, eld_vehicle_id, recorded_at DESC);

-- ============================================
-- GPS BREADCRUMBS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_jurisdiction ON public.gps_breadcrumbs USING btree (jurisdiction, recorded_at DESC) WHERE (jurisdiction IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_org_time ON public.gps_breadcrumbs USING btree (organization_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_vehicle ON public.gps_breadcrumbs USING btree (organization_id, eld_vehicle_id, recorded_at DESC);

-- ============================================
-- VEHICLE CURRENT LOCATIONS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_org ON public.vehicle_current_locations USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_vehicle ON public.vehicle_current_locations USING btree (vehicle_id) WHERE (vehicle_id IS NOT NULL);

-- ============================================
-- VEHICLE ACTIVE FAULTS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vehicle_active_faults_active ON public.vehicle_active_faults USING btree (organization_id, is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_vehicle_active_faults_org ON public.vehicle_active_faults USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_active_faults_severity ON public.vehicle_active_faults USING btree (severity, is_active) WHERE (is_active = true);

-- ============================================
-- DRIVER HOS STATUS INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_driver_hos_status_driver ON public.driver_hos_status USING btree (driver_id) WHERE (driver_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_driver_hos_status_org ON public.driver_hos_status USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_hos_status_violation ON public.driver_hos_status USING btree (organization_id, has_violation) WHERE (has_violation = true);

-- ============================================
-- COMPLIANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS compliance_items_compliance_type_idx ON public.compliance_items USING btree (compliance_type);
CREATE INDEX IF NOT EXISTS compliance_items_expiration_date_idx ON public.compliance_items USING btree (expiration_date);
CREATE INDEX IF NOT EXISTS compliance_items_status_idx ON public.compliance_items USING btree (status);
CREATE INDEX IF NOT EXISTS compliance_items_user_id_idx ON public.compliance_items USING btree (user_id);

-- ============================================
-- MAINTENANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_maintenance_records_due_date ON public.maintenance_records USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_expense_id ON public.maintenance_records USING btree (expense_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON public.maintenance_records USING btree (status);
CREATE INDEX IF NOT EXISTS maintenance_truck_id_idx ON public.maintenance_records USING btree (truck_id);
CREATE INDEX IF NOT EXISTS maintenance_user_id_idx ON public.maintenance_records USING btree (user_id);

-- ============================================
-- REMINDER INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reminders_completed ON public.reminders USING btree (completed);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON public.reminders USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders USING btree (user_id);

-- ============================================
-- NOTIFICATION INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery ON public.notifications USING btree (created_at, delivered_at) WHERE (delivered_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_notifications_due_date ON public.notifications USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON public.notifications USING btree (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type_user ON public.notifications USING btree (notification_type, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_urgency ON public.notifications USING btree (urgency);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created ON public.notifications USING btree (user_id, notification_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);
