-- Enable PostGIS extension first
create extension if not exists "postgis" with schema "public";

-- Handle PostGIS types that might already exist
DO $$ 
BEGIN
    -- Only create geometry_dump if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry_dump') THEN
        create type "public"."geometry_dump" as ("path" integer[], "geom" geometry);
    END IF;
    
    -- Only create valid_detail if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'valid_detail') THEN
        create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" geometry);
    END IF;
END $$;

-- Now include the rest of the schema


create sequence "public"."processed_sessions_id_seq";

create table "public"."company_info" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "legal_name" text,
    "dba_name" text,
    "logo_url" text,
    "address" text,
    "city" text,
    "state" text,
    "zip" text,
    "phone" text,
    "email" text,
    "website" text,
    "mc_number" text,
    "dot_number" text,
    "ein" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_info" enable row level security;

create table "public"."company_profiles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text,
    "address" text,
    "city" text,
    "state" text,
    "zip_code" text,
    "country" text,
    "mc_number" text,
    "dot_number" text,
    "ein" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_profiles" enable row level security;

create table "public"."compliance_items" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "title" text not null,
    "compliance_type" text not null,
    "entity_type" text not null,
    "entity_name" text not null,
    "document_number" text,
    "issue_date" date,
    "expiration_date" date not null,
    "issuing_authority" text,
    "notes" text,
    "status" text not null,
    "document_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."compliance_items" enable row level security;

create table "public"."customers" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "company_name" text not null,
    "contact_name" text,
    "email" text,
    "phone" text,
    "address" text,
    "city" text,
    "state" text,
    "zip" text,
    "customer_type" text,
    "status" text default 'Active'::text,
    "notes" text,
    "tax_exempt" boolean default false,
    "tax_id" text,
    "payment_terms" text default 'Net 15'::text,
    "credit_limit" numeric(10,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."customers" enable row level security;

create table "public"."driver_mileage_crossings" (
    "id" uuid not null default uuid_generate_v4(),
    "trip_id" uuid not null,
    "state" text not null,
    "state_name" text,
    "odometer" integer not null,
    "timestamp" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "crossing_date" date not null
);


alter table "public"."driver_mileage_crossings" enable row level security;

create table "public"."driver_mileage_trips" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "vehicle_id" text not null,
    "status" text not null default 'active'::text,
    "start_date" date not null,
    "end_date" date,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."driver_mileage_trips" enable row level security;

create table "public"."drivers" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "phone" text,
    "email" text,
    "license" text,
    "license_expiry" date,
    "address" text,
    "city" text,
    "state" text,
    "zip" text,
    "status" text default 'Active'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "license_number" character varying,
    "license_state" character varying,
    "medical_card_expiry" date,
    "position" character varying default 'Driver'::character varying,
    "hire_date" date,
    "emergency_contact" character varying,
    "emergency_phone" character varying
);


alter table "public"."drivers" enable row level security;

create table "public"."earnings" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "load_id" uuid,
    "amount" numeric not null,
    "date" date not null,
    "source" text not null default 'Factoring'::text,
    "description" text,
    "factoring_company" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."earnings" enable row level security;

create table "public"."expense_categories" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "name" text not null,
    "description" text,
    "is_default" boolean default false,
    "icon" text,
    "color" text,
    "tax_deductible" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."expense_categories" enable row level security;

create table "public"."expenses" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "date" date not null,
    "amount" numeric(10,2) not null,
    "category" text not null,
    "description" text not null,
    "payment_method" text,
    "vehicle_id" uuid,
    "deductible" boolean default true,
    "receipt_image" text,
    "notes" text,
    "load_id" uuid,
    "driver_id" uuid,
    "location" text,
    "tax_category" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."expenses" enable row level security;

create table "public"."fuel_entries" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "vehicle_id" uuid,
    "driver_id" uuid,
    "date" date not null,
    "gallons" numeric(10,3) not null,
    "price_per_gallon" numeric(10,3) not null,
    "total_amount" numeric(10,2) not null,
    "odometer" numeric(10,1),
    "state" text,
    "state_name" text,
    "location" text,
    "fuel_type" text,
    "is_complete_fill" boolean default true,
    "notes" text,
    "receipt_image" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "expense_id" uuid,
    "payment_method" text default 'Credit Card'::text
);


alter table "public"."fuel_entries" enable row level security;

create table "public"."ifta_report_details" (
    "id" uuid not null default uuid_generate_v4(),
    "report_id" uuid not null,
    "state" text not null,
    "miles" numeric(10,2) default 0,
    "gallons" numeric(10,3) default 0,
    "tax_rate" numeric(10,4) default 0,
    "tax_due" numeric(10,2) default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ifta_report_details" enable row level security;

create table "public"."ifta_reports" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "quarter" text not null,
    "year" integer not null,
    "total_miles" numeric(10,2),
    "total_gallons" numeric(10,3),
    "total_tax" numeric(10,2),
    "status" text default 'draft'::text,
    "submitted_at" timestamp with time zone,
    "jurisdiction_data" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ifta_reports" enable row level security;

create table "public"."ifta_tax_rates" (
    "id" uuid not null default uuid_generate_v4(),
    "jurisdiction" text not null,
    "base_rate" numeric(10,3) not null,
    "surcharge" numeric(10,3) default 0,
    "total_rate" numeric(10,3),
    "effective_date" date not null,
    "expiration_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."ifta_trip_records" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "quarter" text not null,
    "start_date" date not null,
    "end_date" date,
    "vehicle_id" uuid,
    "driver_id" uuid,
    "load_id" uuid,
    "start_jurisdiction" text,
    "end_jurisdiction" text,
    "total_miles" numeric(10,2),
    "gallons" numeric(10,3),
    "fuel_cost" numeric(10,2),
    "starting_odometer" numeric(10,2),
    "ending_odometer" numeric(10,2),
    "is_fuel_only" boolean default false,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_imported" boolean default false,
    "mileage_trip_id" uuid,
    "source" character varying(50) default NULL::character varying
);


alter table "public"."ifta_trip_records" enable row level security;

create table "public"."ifta_trip_state_mileage" (
    "id" uuid not null default uuid_generate_v4(),
    "trip_id" uuid,
    "user_id" uuid,
    "jurisdiction" text not null,
    "miles" numeric(10,2) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ifta_trip_state_mileage" enable row level security;

create table "public"."invoice_activities" (
    "id" uuid not null default uuid_generate_v4(),
    "invoice_id" uuid not null,
    "user_id" uuid,
    "user_name" text,
    "activity_type" text not null,
    "description" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."invoice_activities" enable row level security;

create table "public"."invoice_items" (
    "id" uuid not null default uuid_generate_v4(),
    "invoice_id" uuid not null,
    "description" text not null,
    "quantity" numeric(10,2) not null default 1,
    "unit_price" numeric(10,2) not null default 0,
    "tax_rate" numeric(5,2) default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."invoice_items" enable row level security;

create table "public"."invoices" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "invoice_number" text not null,
    "customer" text not null,
    "customer_id" uuid,
    "load_id" uuid,
    "invoice_date" date not null,
    "due_date" date not null,
    "po_number" text,
    "terms" text,
    "notes" text,
    "subtotal" numeric(10,2) default 0,
    "tax_rate" numeric(5,2) default 0,
    "tax_amount" numeric(10,2) default 0,
    "total" numeric(10,2) default 0,
    "amount_paid" numeric(10,2) default 0,
    "payment_date" date,
    "status" text default 'Draft'::text,
    "last_sent" timestamp with time zone,
    "customer_email" text,
    "customer_address" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "payment_terms" text default 'Net 15'::text
);


alter table "public"."invoices" enable row level security;

create table "public"."load_documents" (
    "id" uuid not null default uuid_generate_v4(),
    "load_id" uuid not null,
    "document_type" text not null,
    "file_name" text,
    "file_path" text not null,
    "uploaded_by" uuid,
    "description" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."load_documents" enable row level security;

create table "public"."load_stops" (
    "id" uuid not null default uuid_generate_v4(),
    "load_id" uuid not null,
    "stop_number" integer not null,
    "location" text not null,
    "address" text,
    "city" text,
    "state" text,
    "zip" text,
    "scheduled_date" timestamp with time zone,
    "actual_date" timestamp with time zone,
    "stop_type" text,
    "notes" text,
    "status" text default 'Pending'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."load_stops" enable row level security;

create table "public"."loads" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "load_number" text not null,
    "customer" text not null,
    "customer_id" uuid,
    "status" text default 'Pending'::text,
    "origin" text,
    "destination" text,
    "distance" numeric(10,2),
    "pickup_date" date,
    "delivery_date" date,
    "rate" numeric(10,2) default 0,
    "driver" text,
    "driver_id" uuid,
    "vehicle_id" uuid,
    "description" text,
    "notes" text,
    "completed_at" timestamp with time zone,
    "completed_by" uuid,
    "actual_delivery_date" timestamp with time zone,
    "received_by" text,
    "completion_notes" text,
    "pod_documents" jsonb,
    "delivery_rating" integer,
    "additional_mileage" numeric(10,2) default 0,
    "additional_charges" numeric(10,2) default 0,
    "additional_charges_description" text,
    "final_rate" numeric(10,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "factored" boolean default false,
    "factoring_company" text,
    "factored_at" timestamp with time zone,
    "factored_amount" numeric,
    "truck_info" text,
    "actual_delivery_time" time without time zone
);


alter table "public"."loads" enable row level security;

create table "public"."maintenance_records" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "truck_id" uuid not null,
    "maintenance_type" character varying not null,
    "description" text,
    "due_date" date,
    "completed_date" date,
    "status" character varying default 'Pending'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "vehicle_id" uuid,
    "odometer_at_service" numeric,
    "cost" numeric,
    "service_provider" character varying,
    "invoice_number" character varying
);


create table "public"."notification_preferences" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "preferences" jsonb not null default '{"app": {"expenses": true, "invoices": true, "documents": true, "reminders": true}, "sms": {"expenses": false, "invoices": false, "documents": false, "reminders": true}, "email": {"expenses": true, "invoices": true, "documents": true, "reminders": true}}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."notification_preferences" enable row level security;

create table "public"."notifications" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "title" text not null,
    "message" text not null,
    "is_read" boolean not null default false,
    "read_at" timestamp with time zone,
    "notification_type" text not null,
    "entity_type" text,
    "entity_id" text,
    "created_at" timestamp with time zone default now(),
    "link_to" text,
    "due_date" timestamp with time zone,
    "urgency" text default 'NORMAL'::text
);


alter table "public"."notifications" enable row level security;

create table "public"."payments" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "invoice_id" uuid,
    "amount" numeric(10,2) not null,
    "date" date not null,
    "method" text not null,
    "reference" text,
    "description" text,
    "notes" text,
    "status" text default 'completed'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."payments" enable row level security;

create table "public"."processed_sessions" (
    "id" bigint not null default nextval('processed_sessions_id_seq'::regclass),
    "idempotency_key" text not null,
    "user_id" uuid not null,
    "session_id" text,
    "processed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."processed_sessions" enable row level security;

create table "public"."reminders" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "title" text not null,
    "description" text,
    "due_date" date not null,
    "completed" boolean default false,
    "completed_at" timestamp with time zone,
    "priority" text default 'Medium'::text,
    "reminder_type" text,
    "entity_type" text,
    "entity_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."reminders" enable row level security;

create table "public"."subscriptions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "status" character varying(50) not null default 'trial'::character varying,
    "plan" character varying(50),
    "billing_cycle" character varying(20),
    "amount" numeric(10,2),
    "stripe_customer_id" character varying(255),
    "stripe_subscription_id" character varying(255),
    "card_last_four" character varying(4),
    "trial_starts_at" timestamp with time zone,
    "trial_ends_at" timestamp with time zone,
    "current_period_starts_at" timestamp with time zone,
    "current_period_ends_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "checkout_session_id" text,
    "cancel_at_period_end" boolean default false,
    "canceled_at" timestamp with time zone,
    "checkout_initiated_at" timestamp with time zone,
    "cancellation_reason" text,
    "cancellation_feedback" text
);


alter table "public"."subscriptions" enable row level security;

create table "public"."trucks" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "name" character varying not null,
    "make" character varying,
    "model" character varying,
    "year" character varying,
    "vin" character varying,
    "license_plate" character varying,
    "status" character varying default 'Active'::character varying,
    "purchase_date" date,
    "odometer" numeric,
    "fuel_type" character varying default 'Diesel'::character varying,
    "image" character varying,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "vehicle_id" uuid default uuid_generate_v4()
);


create table "public"."user_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "theme" character varying(10) default 'system'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_preferences" enable row level security;

create table "public"."user_settings" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "setting_key" text not null,
    "setting_value" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_settings" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "full_name" text,
    "email" text not null,
    "phone" text,
    "company_name" text,
    "address" text,
    "city" text,
    "state" text,
    "zip" text,
    "fleet_size" text,
    "subscription_tier" text default 'free'::text,
    "stripe_customer_id" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

create table "public"."vehicles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text,
    "type" text,
    "make" text,
    "model" text,
    "year" integer,
    "vin" text,
    "license_plate" text,
    "status" text default 'Active'::text,
    "color" text,
    "mpg" numeric(10,2),
    "fuel_type" text,
    "tank_capacity" numeric(10,2),
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."vehicles" enable row level security;

alter sequence "public"."processed_sessions_id_seq" owned by "public"."processed_sessions"."id";

CREATE UNIQUE INDEX company_info_pkey ON public.company_info USING btree (id);

CREATE UNIQUE INDEX company_profiles_pkey ON public.company_profiles USING btree (id);

CREATE INDEX compliance_items_compliance_type_idx ON public.compliance_items USING btree (compliance_type);

CREATE INDEX compliance_items_expiration_date_idx ON public.compliance_items USING btree (expiration_date);

CREATE UNIQUE INDEX compliance_items_pkey ON public.compliance_items USING btree (id);

CREATE INDEX compliance_items_status_idx ON public.compliance_items USING btree (status);

CREATE INDEX compliance_items_user_id_idx ON public.compliance_items USING btree (user_id);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX driver_mileage_crossings_pkey ON public.driver_mileage_crossings USING btree (id);

CREATE UNIQUE INDEX driver_mileage_trips_pkey ON public.driver_mileage_trips USING btree (id);

CREATE UNIQUE INDEX drivers_pkey ON public.drivers USING btree (id);

CREATE UNIQUE INDEX earnings_pkey ON public.earnings USING btree (id);

CREATE UNIQUE INDEX expense_categories_pkey ON public.expense_categories USING btree (id);

CREATE UNIQUE INDEX expense_categories_user_id_name_key ON public.expense_categories USING btree (user_id, name);

CREATE UNIQUE INDEX expenses_pkey ON public.expenses USING btree (id);

CREATE UNIQUE INDEX fuel_entries_pkey ON public.fuel_entries USING btree (id);

CREATE INDEX idx_company_profiles_user_id ON public.company_profiles USING btree (user_id);

CREATE INDEX idx_driver_mileage_crossings_crossing_date ON public.driver_mileage_crossings USING btree (crossing_date);

CREATE INDEX idx_driver_mileage_crossings_trip_id ON public.driver_mileage_crossings USING btree (trip_id);

CREATE INDEX idx_driver_mileage_trips_user_id ON public.driver_mileage_trips USING btree (user_id);

CREATE INDEX idx_fuel_entries_expense_id ON public.fuel_entries USING btree (expense_id);

CREATE INDEX idx_ifta_reports_user_quarter ON public.ifta_reports USING btree (user_id, quarter);

CREATE UNIQUE INDEX idx_ifta_tax_rates_jurisdiction_date ON public.ifta_tax_rates USING btree (jurisdiction, effective_date);

CREATE INDEX idx_ifta_trip_load_id ON public.ifta_trip_records USING btree (load_id);

CREATE INDEX idx_ifta_trip_records_user_quarter ON public.ifta_trip_records USING btree (user_id, quarter);

CREATE INDEX idx_ifta_trip_state_mileage_trip ON public.ifta_trip_state_mileage USING btree (trip_id);

CREATE INDEX idx_ifta_trip_state_mileage_user ON public.ifta_trip_state_mileage USING btree (user_id);

CREATE INDEX idx_ifta_trips_mileage_trip_id ON public.ifta_trip_records USING btree (mileage_trip_id);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);

CREATE INDEX idx_notifications_due_date ON public.notifications USING btree (due_date);

CREATE INDEX idx_notifications_entity ON public.notifications USING btree (entity_type, entity_id);

CREATE INDEX idx_notifications_type_user ON public.notifications USING btree (notification_type, user_id);

CREATE INDEX idx_notifications_urgency ON public.notifications USING btree (urgency);

CREATE INDEX idx_processed_sessions_idempotency ON public.processed_sessions USING btree (idempotency_key);

CREATE INDEX idx_processed_sessions_user_id ON public.processed_sessions USING btree (user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

CREATE UNIQUE INDEX idx_unique_mileage_import_by_state ON public.ifta_trip_records USING btree (user_id, quarter, mileage_trip_id, start_jurisdiction) WHERE (mileage_trip_id IS NOT NULL);

CREATE UNIQUE INDEX ifta_report_details_pkey ON public.ifta_report_details USING btree (id);

CREATE UNIQUE INDEX ifta_report_details_report_id_state_key ON public.ifta_report_details USING btree (report_id, state);

CREATE UNIQUE INDEX ifta_reports_pkey ON public.ifta_reports USING btree (id);

CREATE UNIQUE INDEX ifta_tax_rates_pkey ON public.ifta_tax_rates USING btree (id);

CREATE UNIQUE INDEX ifta_trip_records_pkey ON public.ifta_trip_records USING btree (id);

CREATE UNIQUE INDEX ifta_trip_state_mileage_pkey ON public.ifta_trip_state_mileage USING btree (id);

CREATE UNIQUE INDEX invoice_activities_pkey ON public.invoice_activities USING btree (id);

CREATE UNIQUE INDEX invoice_items_pkey ON public.invoice_items USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX load_documents_pkey ON public.load_documents USING btree (id);

CREATE UNIQUE INDEX load_stops_pkey ON public.load_stops USING btree (id);

CREATE UNIQUE INDEX loads_pkey ON public.loads USING btree (id);

CREATE UNIQUE INDEX maintenance_records_pkey ON public.maintenance_records USING btree (id);

CREATE INDEX maintenance_truck_id_idx ON public.maintenance_records USING btree (truck_id);

CREATE INDEX maintenance_user_id_idx ON public.maintenance_records USING btree (user_id);

CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX processed_sessions_idempotency_key_key ON public.processed_sessions USING btree (idempotency_key);

CREATE UNIQUE INDEX processed_sessions_pkey ON public.processed_sessions USING btree (id);

CREATE UNIQUE INDEX reminders_pkey ON public.reminders USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions USING btree (user_id);

CREATE UNIQUE INDEX trucks_pkey ON public.trucks USING btree (id);

CREATE INDEX trucks_user_id_idx ON public.trucks USING btree (user_id);

CREATE UNIQUE INDEX unique_load_earnings ON public.earnings USING btree (load_id, source);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);

CREATE UNIQUE INDEX user_settings_user_id_setting_key_key ON public.user_settings USING btree (user_id, setting_key);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX vehicles_pkey ON public.vehicles USING btree (id);

alter table "public"."company_info" add constraint "company_info_pkey" PRIMARY KEY using index "company_info_pkey";

alter table "public"."company_profiles" add constraint "company_profiles_pkey" PRIMARY KEY using index "company_profiles_pkey";

alter table "public"."compliance_items" add constraint "compliance_items_pkey" PRIMARY KEY using index "compliance_items_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."driver_mileage_crossings" add constraint "driver_mileage_crossings_pkey" PRIMARY KEY using index "driver_mileage_crossings_pkey";

alter table "public"."driver_mileage_trips" add constraint "driver_mileage_trips_pkey" PRIMARY KEY using index "driver_mileage_trips_pkey";

alter table "public"."drivers" add constraint "drivers_pkey" PRIMARY KEY using index "drivers_pkey";

alter table "public"."earnings" add constraint "earnings_pkey" PRIMARY KEY using index "earnings_pkey";

alter table "public"."expense_categories" add constraint "expense_categories_pkey" PRIMARY KEY using index "expense_categories_pkey";

alter table "public"."expenses" add constraint "expenses_pkey" PRIMARY KEY using index "expenses_pkey";

alter table "public"."fuel_entries" add constraint "fuel_entries_pkey" PRIMARY KEY using index "fuel_entries_pkey";

alter table "public"."ifta_report_details" add constraint "ifta_report_details_pkey" PRIMARY KEY using index "ifta_report_details_pkey";

alter table "public"."ifta_reports" add constraint "ifta_reports_pkey" PRIMARY KEY using index "ifta_reports_pkey";

alter table "public"."ifta_tax_rates" add constraint "ifta_tax_rates_pkey" PRIMARY KEY using index "ifta_tax_rates_pkey";

alter table "public"."ifta_trip_records" add constraint "ifta_trip_records_pkey" PRIMARY KEY using index "ifta_trip_records_pkey";

alter table "public"."ifta_trip_state_mileage" add constraint "ifta_trip_state_mileage_pkey" PRIMARY KEY using index "ifta_trip_state_mileage_pkey";

alter table "public"."invoice_activities" add constraint "invoice_activities_pkey" PRIMARY KEY using index "invoice_activities_pkey";

alter table "public"."invoice_items" add constraint "invoice_items_pkey" PRIMARY KEY using index "invoice_items_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."load_documents" add constraint "load_documents_pkey" PRIMARY KEY using index "load_documents_pkey";

alter table "public"."load_stops" add constraint "load_stops_pkey" PRIMARY KEY using index "load_stops_pkey";

alter table "public"."loads" add constraint "loads_pkey" PRIMARY KEY using index "loads_pkey";

alter table "public"."maintenance_records" add constraint "maintenance_records_pkey" PRIMARY KEY using index "maintenance_records_pkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_pkey" PRIMARY KEY using index "notification_preferences_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."processed_sessions" add constraint "processed_sessions_pkey" PRIMARY KEY using index "processed_sessions_pkey";

alter table "public"."reminders" add constraint "reminders_pkey" PRIMARY KEY using index "reminders_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."trucks" add constraint "trucks_pkey" PRIMARY KEY using index "trucks_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."vehicles" add constraint "vehicles_pkey" PRIMARY KEY using index "vehicles_pkey";

alter table "public"."company_info" add constraint "company_info_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."company_info" validate constraint "company_info_user_id_fkey";

alter table "public"."company_profiles" add constraint "company_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."company_profiles" validate constraint "company_profiles_user_id_fkey";

alter table "public"."compliance_items" add constraint "compliance_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."compliance_items" validate constraint "compliance_items_user_id_fkey";

alter table "public"."customers" add constraint "customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_user_id_fkey";

alter table "public"."driver_mileage_crossings" add constraint "driver_mileage_crossings_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES driver_mileage_trips(id) ON DELETE CASCADE not valid;

alter table "public"."driver_mileage_crossings" validate constraint "driver_mileage_crossings_trip_id_fkey";

alter table "public"."driver_mileage_trips" add constraint "driver_mileage_trips_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."driver_mileage_trips" validate constraint "driver_mileage_trips_user_id_fkey";

alter table "public"."drivers" add constraint "drivers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."drivers" validate constraint "drivers_user_id_fkey";

alter table "public"."earnings" add constraint "earnings_load_id_fkey" FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE not valid;

alter table "public"."earnings" validate constraint "earnings_load_id_fkey";

alter table "public"."earnings" add constraint "earnings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."earnings" validate constraint "earnings_user_id_fkey";

alter table "public"."earnings" add constraint "unique_load_earnings" UNIQUE using index "unique_load_earnings";

alter table "public"."expense_categories" add constraint "expense_categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."expense_categories" validate constraint "expense_categories_user_id_fkey";

alter table "public"."expense_categories" add constraint "expense_categories_user_id_name_key" UNIQUE using index "expense_categories_user_id_name_key";

alter table "public"."expenses" add constraint "expenses_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL not valid;

alter table "public"."expenses" validate constraint "expenses_driver_id_fkey";

alter table "public"."expenses" add constraint "expenses_load_id_fkey" FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE SET NULL not valid;

alter table "public"."expenses" validate constraint "expenses_load_id_fkey";

alter table "public"."expenses" add constraint "expenses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."expenses" validate constraint "expenses_user_id_fkey";

alter table "public"."expenses" add constraint "expenses_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL not valid;

alter table "public"."expenses" validate constraint "expenses_vehicle_id_fkey";

alter table "public"."fuel_entries" add constraint "fk_expense_id" FOREIGN KEY (expense_id) REFERENCES expenses(id) not valid;

alter table "public"."fuel_entries" validate constraint "fk_expense_id";

alter table "public"."fuel_entries" add constraint "fuel_entries_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL not valid;

alter table "public"."fuel_entries" validate constraint "fuel_entries_driver_id_fkey";

alter table "public"."fuel_entries" add constraint "fuel_entries_expense_id_fkey" FOREIGN KEY (expense_id) REFERENCES expenses(id) not valid;

alter table "public"."fuel_entries" validate constraint "fuel_entries_expense_id_fkey";

alter table "public"."fuel_entries" add constraint "fuel_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."fuel_entries" validate constraint "fuel_entries_user_id_fkey";

alter table "public"."fuel_entries" add constraint "fuel_entries_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL not valid;

alter table "public"."fuel_entries" validate constraint "fuel_entries_vehicle_id_fkey";

alter table "public"."ifta_report_details" add constraint "ifta_report_details_report_id_state_key" UNIQUE using index "ifta_report_details_report_id_state_key";

alter table "public"."ifta_reports" add constraint "ifta_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ifta_reports" validate constraint "ifta_reports_user_id_fkey";

alter table "public"."ifta_trip_records" add constraint "check_positive_miles" CHECK ((total_miles >= (0)::numeric)) not valid;

alter table "public"."ifta_trip_records" validate constraint "check_positive_miles";

alter table "public"."ifta_trip_records" add constraint "fk_ifta_trip_load" FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE SET NULL not valid;

alter table "public"."ifta_trip_records" validate constraint "fk_ifta_trip_load";

alter table "public"."ifta_trip_records" add constraint "ifta_trip_records_mileage_trip_id_fkey" FOREIGN KEY (mileage_trip_id) REFERENCES driver_mileage_trips(id) ON DELETE SET NULL not valid;

alter table "public"."ifta_trip_records" validate constraint "ifta_trip_records_mileage_trip_id_fkey";

alter table "public"."ifta_trip_records" add constraint "ifta_trip_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ifta_trip_records" validate constraint "ifta_trip_records_user_id_fkey";

alter table "public"."ifta_trip_state_mileage" add constraint "ifta_trip_state_mileage_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES ifta_trip_records(id) ON DELETE CASCADE not valid;

alter table "public"."ifta_trip_state_mileage" validate constraint "ifta_trip_state_mileage_trip_id_fkey";

alter table "public"."ifta_trip_state_mileage" add constraint "ifta_trip_state_mileage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."ifta_trip_state_mileage" validate constraint "ifta_trip_state_mileage_user_id_fkey";

alter table "public"."invoice_activities" add constraint "invoice_activities_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_activities" validate constraint "invoice_activities_invoice_id_fkey";

alter table "public"."invoice_activities" add constraint "invoice_activities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."invoice_activities" validate constraint "invoice_activities_user_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoices" add constraint "invoices_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_customer_id_fkey";

alter table "public"."invoices" add constraint "invoices_load_id_fkey" FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_load_id_fkey";

alter table "public"."invoices" add constraint "invoices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_user_id_fkey";

alter table "public"."load_documents" add constraint "load_documents_load_id_fkey" FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE not valid;

alter table "public"."load_documents" validate constraint "load_documents_load_id_fkey";

alter table "public"."load_documents" add constraint "load_documents_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."load_documents" validate constraint "load_documents_uploaded_by_fkey";

alter table "public"."load_stops" add constraint "load_stops_load_id_fkey" FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE not valid;

alter table "public"."load_stops" validate constraint "load_stops_load_id_fkey";

alter table "public"."loads" add constraint "loads_completed_by_fkey" FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."loads" validate constraint "loads_completed_by_fkey";

alter table "public"."loads" add constraint "loads_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."loads" validate constraint "loads_customer_id_fkey";

alter table "public"."loads" add constraint "loads_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL not valid;

alter table "public"."loads" validate constraint "loads_driver_id_fkey";

alter table "public"."loads" add constraint "loads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."loads" validate constraint "loads_user_id_fkey";

alter table "public"."loads" add constraint "loads_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL not valid;

alter table "public"."loads" validate constraint "loads_vehicle_id_fkey";

alter table "public"."maintenance_records" add constraint "maintenance_records_truck_id_fkey" FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_records" validate constraint "maintenance_records_truck_id_fkey";

alter table "public"."maintenance_records" add constraint "maintenance_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_records" validate constraint "maintenance_records_user_id_fkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."notification_preferences" validate constraint "notification_preferences_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."payments" add constraint "payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_invoice_id_fkey";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."processed_sessions" add constraint "processed_sessions_idempotency_key_key" UNIQUE using index "processed_sessions_idempotency_key_key";

alter table "public"."processed_sessions" add constraint "processed_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."processed_sessions" validate constraint "processed_sessions_user_id_fkey";

alter table "public"."reminders" add constraint "reminders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."reminders" validate constraint "reminders_user_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."trucks" add constraint "trucks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."trucks" validate constraint "trucks_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_theme_check" CHECK (((theme)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_theme_check";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

alter table "public"."user_settings" add constraint "user_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_settings_user_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_setting_key_key" UNIQUE using index "user_settings_user_id_setting_key_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."vehicles" add constraint "vehicles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."vehicles" validate constraint "vehicles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.api_create_expense(p_expense jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_expense_id UUID;
  new_expense JSONB;
BEGIN
  -- Insert the expense
  INSERT INTO expenses (
    user_id,
    date,
    amount,
    category,
    description,
    payment_method,
    vehicle_id,
    deductible,
    receipt_image,
    notes,
    load_id,
    driver_id,
    location,
    tax_category
  ) VALUES (
    auth.uid(),
    COALESCE((p_expense->>'date')::DATE, CURRENT_DATE),
    (p_expense->>'amount')::DECIMAL,
    p_expense->>'category',
    p_expense->>'description',
    p_expense->>'payment_method',
    (p_expense->>'vehicle_id')::UUID,
    COALESCE((p_expense->>'deductible')::BOOLEAN, TRUE),
    p_expense->>'receipt_image',
    p_expense->>'notes',
    (p_expense->>'load_id')::UUID,
    (p_expense->>'driver_id')::UUID,
    p_expense->>'location',
    p_expense->>'tax_category'
  )
  RETURNING id INTO new_expense_id;
  
  -- Get the full expense data
  SELECT row_to_json(e)::JSONB INTO new_expense
  FROM expenses e
  WHERE e.id = new_expense_id;
  
  RETURN new_expense;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.api_get_expense_report(p_filters jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  query_text TEXT;
  filter_category TEXT;
  filter_start_date TEXT;
  filter_end_date TEXT;
  filter_vehicle_id TEXT;
  filter_driver_id TEXT;
  filter_deductible BOOLEAN;
BEGIN
  -- Extract filter parameters
  filter_category := p_filters->>'category';
  filter_start_date := p_filters->>'startDate';
  filter_end_date := p_filters->>'endDate';
  filter_vehicle_id := p_filters->>'vehicleId';
  filter_driver_id := p_filters->>'driverId';
  filter_deductible := (p_filters->>'deductible')::BOOLEAN;
  
  -- Build the query
  query_text := '
    WITH expense_data AS (
      SELECT
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = auth.uid()';
  
  -- Add filters
  IF filter_category IS NOT NULL THEN
    query_text := query_text || ' AND category = ' || quote_literal(filter_category);
  END IF;
  
  IF filter_start_date IS NOT NULL THEN
    query_text := query_text || ' AND date >= ' || quote_literal(filter_start_date);
  END IF;
  
  IF filter_end_date IS NOT NULL THEN
    query_text := query_text || ' AND date <= ' || quote_literal(filter_end_date);
  END IF;
  
  IF filter_vehicle_id IS NOT NULL THEN
    query_text := query_text || ' AND vehicle_id = ' || quote_literal(filter_vehicle_id);
  END IF;
  
  IF filter_driver_id IS NOT NULL THEN
    query_text := query_text || ' AND driver_id = ' || quote_literal(filter_driver_id);
  END IF;
  
  IF filter_deductible IS NOT NULL THEN
    query_text := query_text || ' AND deductible = ' || filter_deductible;
  END IF;
  
  -- Finish the query
  query_text := query_text || '
      GROUP BY category
      ORDER BY total DESC
    ),
    expense_total AS (
      SELECT COALESCE(SUM(total), 0) as grand_total
      FROM expense_data
    )
    SELECT jsonb_build_object(
      ''total'', (SELECT grand_total FROM expense_total),
      ''byCategory'', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            ''category'', category,
            ''total'', total,
            ''count'', count,
            ''percentage'', ROUND((total / NULLIF((SELECT grand_total FROM expense_total), 0)) * 100, 2)
          )
        ),
        ''[]''::jsonb
      )
    ) FROM expense_data';
  
  -- Execute the query
  EXECUTE query_text INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.api_upload_receipt(p_expense_id uuid, p_file_path text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  success BOOLEAN;
BEGIN
  -- Verify that the expense belongs to the user
  IF NOT EXISTS (SELECT 1 FROM expenses WHERE id = p_expense_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Expense not found or access denied';
  END IF;
  
  -- Update the expense with the receipt image
  UPDATE expenses
  SET 
    receipt_image = p_file_path,
    updated_at = NOW()
  WHERE id = p_expense_id AND user_id = auth.uid();
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_factored_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only trigger when factored changes from false to true
  IF NEW.factored = TRUE AND (OLD.factored = FALSE OR OLD.factored IS NULL) THEN
    -- Insert an earnings record
    INSERT INTO earnings (
      user_id, 
      load_id, 
      amount, 
      date, 
      source, 
      description, 
      factoring_company, 
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.id,
      COALESCE(NEW.factored_amount, NEW.rate, 0),
      COALESCE(NEW.factored_at, NEW.completed_at, CURRENT_DATE),
      'Factoring',
      'Factored load #' || NEW.load_number || ': ' || COALESCE(NEW.origin, '') || ' to ' || COALESCE(NEW.destination, ''),
      NEW.factoring_company,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_ifta_trip_records_table()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the table already exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ifta_trip_records') THEN
    RETURN TRUE;
  END IF;

  -- Create the IFTA trip records table
  CREATE TABLE public.ifta_trip_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    quarter TEXT NOT NULL,
    trip_date DATE NOT NULL,
    vehicle_id TEXT,
    load_id TEXT,
    start_jurisdiction TEXT,
    end_jurisdiction TEXT,
    total_miles NUMERIC,
    gallons NUMERIC,
    fuel_cost NUMERIC,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Add RLS policy
  ALTER TABLE public.ifta_trip_records ENABLE ROW LEVEL SECURITY;

  -- Add policy for users to select their own records
  CREATE POLICY select_own_trips ON public.ifta_trip_records
    FOR SELECT USING (auth.uid() = user_id);

  -- Add policy for users to insert their own records
  CREATE POLICY insert_own_trips ON public.ifta_trip_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Add policy for users to update their own records
  CREATE POLICY update_own_trips ON public.ifta_trip_records
    FOR UPDATE USING (auth.uid() = user_id);

  -- Add policy for users to delete their own records
  CREATE POLICY delete_own_trips ON public.ifta_trip_records
    FOR DELETE USING (auth.uid() = user_id);

  -- Create the IFTA reports table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ifta_reports') THEN
    CREATE TABLE public.ifta_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      quarter TEXT NOT NULL,
      year INTEGER NOT NULL,
      total_miles NUMERIC DEFAULT 0,
      total_gallons NUMERIC DEFAULT 0,
      total_tax NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'draft',
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add RLS policy
    ALTER TABLE public.ifta_reports ENABLE ROW LEVEL SECURITY;

    -- Add policy for users to select their own records
    CREATE POLICY select_own_reports ON public.ifta_reports
      FOR SELECT USING (auth.uid() = user_id);

    -- Add policy for users to insert their own records
    CREATE POLICY insert_own_reports ON public.ifta_reports
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Add policy for users to update their own records
    CREATE POLICY update_own_reports ON public.ifta_reports
      FOR UPDATE USING (auth.uid() = user_id);

    -- Add policy for users to delete their own records
    CREATE POLICY delete_own_reports ON public.ifta_reports
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating IFTA tables: %', SQLERRM;
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_title text, p_message text, p_notification_type text DEFAULT 'GENERAL_REMINDER'::text, p_entity_type text DEFAULT NULL::text, p_entity_id text DEFAULT NULL::text, p_link_to text DEFAULT NULL::text, p_due_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_urgency text DEFAULT 'NORMAL'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        notification_type,
        entity_type,
        entity_id,
        link_to,
        due_date,
        urgency,
        is_read,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_title,
        p_message,
        p_notification_type,
        p_entity_type,
        p_entity_id,
        p_link_to,
        p_due_date,
        p_urgency,
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_compliance_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notification_count INTEGER := 0;
    compliance_record RECORD;
    driver_record RECORD;
    notification_title TEXT;
    notification_message TEXT;
    link_url TEXT;
    urgency_level TEXT;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Check compliance_items for expiring documents
    FOR compliance_record IN 
        SELECT 
            ci.*,
            (ci.expiration_date - current_date) as days_until_expiry
        FROM compliance_items ci
        WHERE ci.expiration_date IS NOT NULL 
            AND ci.expiration_date >= current_date
            AND (ci.expiration_date - current_date) IN (30, 7, 1, 0) -- 30 days, 7 days, 1 day, and today
            AND ci.status != 'Expired'
    LOOP
        -- Determine urgency and message based on days until expiry
        CASE compliance_record.days_until_expiry
            WHEN 30 THEN
                urgency_level := 'LOW';
                notification_title := format('%s - Expiring in 30 Days', compliance_record.title);
                notification_message := format('Your %s for %s (%s) will expire in 30 days on %s. Please plan for renewal.',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            WHEN 7 THEN
                urgency_level := 'MEDIUM';
                notification_title := format('%s - Expiring in 7 Days', compliance_record.title);
                notification_message := format('ATTENTION: Your %s for %s (%s) will expire in 7 days on %s. Please renew immediately.',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            WHEN 1 THEN
                urgency_level := 'HIGH';
                notification_title := format('%s - Expires Tomorrow!', compliance_record.title);
                notification_message := format('URGENT: Your %s for %s (%s) expires TOMORROW (%s). Immediate action required!',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            WHEN 0 THEN
                urgency_level := 'CRITICAL';
                notification_title := format('%s - EXPIRES TODAY!', compliance_record.title);
                notification_message := format('CRITICAL: Your %s for %s (%s) EXPIRES TODAY (%s). Take immediate action!',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            ELSE
                CONTINUE;
        END CASE;

        link_url := '/dashboard/compliance';

        -- Check if notification already exists for this item and time period
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = compliance_record.user_id 
                AND entity_type = 'compliance_item'
                AND entity_id = compliance_record.id::text
                AND notification_type = 'DOCUMENT_EXPIRY_COMPLIANCE'
                AND due_date = compliance_record.expiration_date
                AND urgency = urgency_level
        ) THEN
            -- Create notification
            PERFORM public.create_notification(
                compliance_record.user_id,
                notification_title,
                notification_message,
                'DOCUMENT_EXPIRY_COMPLIANCE',
                'compliance_item',
                compliance_record.id::text,
                link_url,
                compliance_record.expiration_date::timestamp with time zone,
                urgency_level
            );
            
            notification_count := notification_count + 1;
        END IF;
    END LOOP;

    -- Check drivers table for expiring licenses and medical cards
    FOR driver_record IN 
        SELECT 
            d.*,
            CASE 
                WHEN d.license_expiry IS NOT NULL AND (d.license_expiry - current_date) IN (30, 7, 1, 0) THEN 'license'
                WHEN d.medical_card_expiry IS NOT NULL AND (d.medical_card_expiry - current_date) IN (30, 7, 1, 0) THEN 'medical_card'
                ELSE NULL
            END as expiry_type,
            CASE 
                WHEN d.license_expiry IS NOT NULL THEN (d.license_expiry - current_date)
                WHEN d.medical_card_expiry IS NOT NULL THEN (d.medical_card_expiry - current_date)
                ELSE NULL
            END as days_until_expiry,
            CASE 
                WHEN d.license_expiry IS NOT NULL THEN d.license_expiry
                WHEN d.medical_card_expiry IS NOT NULL THEN d.medical_card_expiry
                ELSE NULL
            END as expiry_date
        FROM drivers d
        WHERE d.status = 'Active'
            AND (
                (d.license_expiry IS NOT NULL AND d.license_expiry >= current_date AND (d.license_expiry - current_date) IN (30, 7, 1, 0))
                OR
                (d.medical_card_expiry IS NOT NULL AND d.medical_card_expiry >= current_date AND (d.medical_card_expiry - current_date) IN (30, 7, 1, 0))
            )
    LOOP
        -- Skip if no expiry type determined
        CONTINUE WHEN driver_record.expiry_type IS NULL;

        -- Determine urgency and message based on days until expiry
        CASE driver_record.days_until_expiry
            WHEN 30 THEN
                urgency_level := 'LOW';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - Expiring in 30 Days', driver_record.name);
                    notification_message := format('Driver %s''s license will expire in 30 days on %s. Please plan for renewal.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - Expiring in 30 Days', driver_record.name);
                    notification_message := format('Driver %s''s medical card will expire in 30 days on %s. Please schedule medical exam.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            WHEN 7 THEN
                urgency_level := 'MEDIUM';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - Expiring in 7 Days', driver_record.name);
                    notification_message := format('ATTENTION: Driver %s''s license will expire in 7 days on %s. Renew immediately.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - Expiring in 7 Days', driver_record.name);
                    notification_message := format('ATTENTION: Driver %s''s medical card will expire in 7 days on %s. Schedule medical exam immediately.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            WHEN 1 THEN
                urgency_level := 'HIGH';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - Expires Tomorrow!', driver_record.name);
                    notification_message := format('URGENT: Driver %s''s license expires TOMORROW (%s). Immediate action required!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - Expires Tomorrow!', driver_record.name);
                    notification_message := format('URGENT: Driver %s''s medical card expires TOMORROW (%s). Immediate action required!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            WHEN 0 THEN
                urgency_level := 'CRITICAL';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - EXPIRES TODAY!', driver_record.name);
                    notification_message := format('CRITICAL: Driver %s''s license EXPIRES TODAY (%s). Driver cannot operate!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - EXPIRES TODAY!', driver_record.name);
                    notification_message := format('CRITICAL: Driver %s''s medical card EXPIRES TODAY (%s). Driver cannot operate!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            ELSE
                CONTINUE;
        END CASE;

        link_url := '/dashboard/fleet';

        -- Check if notification already exists for this driver and document type
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = driver_record.user_id 
                AND entity_type = 'driver'
                AND entity_id = driver_record.id::text
                AND notification_type = CASE 
                    WHEN driver_record.expiry_type = 'license' THEN 'DOCUMENT_EXPIRY_DRIVER_LICENSE'
                    ELSE 'DOCUMENT_EXPIRY_DRIVER_MEDICAL'
                END
                AND due_date = driver_record.expiry_date::timestamp with time zone
                AND urgency = urgency_level
        ) THEN
            -- Create notification
            PERFORM public.create_notification(
                driver_record.user_id,
                notification_title,
                notification_message,
                CASE 
                    WHEN driver_record.expiry_type = 'license' THEN 'DOCUMENT_EXPIRY_DRIVER_LICENSE'
                    ELSE 'DOCUMENT_EXPIRY_DRIVER_MEDICAL'
                END,
                'driver',
                driver_record.id::text,
                link_url,
                driver_record.expiry_date::timestamp with time zone,
                urgency_level
            );
            
            notification_count := notification_count + 1;
        END IF;
    END LOOP;

    RETURN notification_count;
END;
$function$
;


CREATE OR REPLACE FUNCTION public.get_all_notifications(p_user_id uuid, p_page_number integer DEFAULT 1, p_page_size integer DEFAULT 15, p_filter_types text[] DEFAULT NULL::text[], p_filter_read_status boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notifications_data jsonb;
    total_count integer;
    offset_count integer;
BEGIN
    -- Calculate offset
    offset_count := (p_page_number - 1) * p_page_size;
    
    -- Get total count for pagination
    SELECT COUNT(*) INTO total_count
    FROM notifications 
    WHERE user_id = p_user_id
        AND (p_filter_types IS NULL OR notification_type = ANY(p_filter_types))
        AND (p_filter_read_status IS NULL OR is_read = p_filter_read_status);
    
    -- Get notifications data
    WITH notification_data AS (
        SELECT 
            id,
            title,
            message,
            notification_type,
            entity_type,
            entity_id,
            link_to,
            due_date,
            urgency,
            is_read,
            read_at,
            created_at,
            updated_at
        FROM notifications 
        WHERE user_id = p_user_id
            AND (p_filter_types IS NULL OR notification_type = ANY(p_filter_types))
            AND (p_filter_read_status IS NULL OR is_read = p_filter_read_status)
        ORDER BY 
            CASE WHEN urgency = 'CRITICAL' THEN 1
                 WHEN urgency = 'HIGH' THEN 2
                 WHEN urgency = 'MEDIUM' THEN 3
                 WHEN urgency = 'LOW' THEN 4
                 ELSE 5 END,
            is_read ASC,
            created_at DESC
        LIMIT p_page_size
        OFFSET offset_count
    )
    SELECT jsonb_build_object(
        'notifications', jsonb_agg(
            jsonb_build_object(
                'id', nd.id,
                'title', nd.title,
                'message', nd.message,
                'type', nd.notification_type,
                'entity_type', nd.entity_type,
                'entity_id', nd.entity_id,
                'link_to', nd.link_to,
                'due_date', nd.due_date,
                'urgency', nd.urgency,
                'is_read', nd.is_read,
                'read_at', nd.read_at,
                'created_at', nd.created_at,
                'updated_at', nd.updated_at
            )
        ),
        'pagination', jsonb_build_object(
            'current_page', p_page_number,
            'page_size', p_page_size,
            'total_count', total_count,
            'total_pages', CEIL(total_count::float / p_page_size::float)
        )
    ) INTO notifications_data
    FROM notification_data nd;
    
    -- Handle case where no notifications found
    IF notifications_data IS NULL THEN
        SELECT jsonb_build_object(
            'notifications', '[]'::jsonb,
            'pagination', jsonb_build_object(
                'current_page', p_page_number,
                'page_size', p_page_size,
                'total_count', 0,
                'total_pages', 0
            )
        ) INTO notifications_data;
    END IF;
    
    RETURN notifications_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_compliance_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    summary jsonb;
    current_date DATE := CURRENT_DATE;
BEGIN
    WITH compliance_stats AS (
        SELECT 
            COUNT(*) as total_items,
            COUNT(CASE WHEN expiration_date < current_date THEN 1 END) as expired,
            COUNT(CASE WHEN expiration_date >= current_date AND expiration_date <= current_date + INTERVAL '30 days' THEN 1 END) as expiring_soon,
            COUNT(CASE WHEN expiration_date > current_date + INTERVAL '30 days' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending
        FROM compliance_items 
        WHERE user_id = p_user_id
    ),
    driver_stats AS (
        SELECT 
            COUNT(*) as total_drivers,
            COUNT(CASE WHEN license_expiry < current_date OR medical_card_expiry < current_date THEN 1 END) as expired_docs,
            COUNT(CASE WHEN 
                (license_expiry >= current_date AND license_expiry <= current_date + INTERVAL '30 days') OR
                (medical_card_expiry >= current_date AND medical_card_expiry <= current_date + INTERVAL '30 days')
                THEN 1 END) as expiring_soon_docs
        FROM drivers 
        WHERE user_id = p_user_id AND status = 'Active'
    ),
    recent_expirations AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ordered_items.id,
                'title', ordered_items.title,
                'entity_name', ordered_items.entity_name,
                'entity_type', ordered_items.entity_type,
                'expiration_date', ordered_items.expiration_date,
                'days_until_expiry', ordered_items.days_until_expiry
            )
        ) as items
        FROM (
            SELECT 
                id,
                title,
                entity_name,
                entity_type,
                expiration_date,
                (expiration_date - current_date) as days_until_expiry
            FROM compliance_items
            WHERE user_id = p_user_id 
                AND expiration_date >= current_date
                AND expiration_date <= current_date + INTERVAL '30 days'
            ORDER BY expiration_date ASC
            LIMIT 10
        ) as ordered_items
    )
    SELECT jsonb_build_object(
        'compliance', jsonb_build_object(
            'total_items', COALESCE(cs.total_items, 0),
            'expired', COALESCE(cs.expired, 0),
            'expiring_soon', COALESCE(cs.expiring_soon, 0),
            'active', COALESCE(cs.active, 0),
            'pending', COALESCE(cs.pending, 0)
        ),
        'drivers', jsonb_build_object(
            'total_drivers', COALESCE(ds.total_drivers, 0),
            'expired_docs', COALESCE(ds.expired_docs, 0),
            'expiring_soon_docs', COALESCE(ds.expiring_soon_docs, 0)
        ),
        'recent_expirations', COALESCE(re.items, '[]'::jsonb)
    ) INTO summary
    FROM compliance_stats cs
    CROSS JOIN driver_stats ds
    CROSS JOIN recent_expirations re;
    
    RETURN summary;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_invoices_stats(p_user_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_status text DEFAULT NULL::text)
 RETURNS TABLE(total numeric, paid numeric, pending numeric, overdue numeric, count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  now_date DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  WITH invoice_data AS (
    SELECT
      i.id,
      i.total,
      i.amount_paid,
      i.status,
      i.due_date,
      CASE
        WHEN i.status = 'Paid' OR i.status = 'Partially Paid' THEN i.amount_paid
        ELSE 0
      END as paid_amount,
      CASE
        WHEN i.status = 'Pending' AND i.due_date >= now_date THEN i.total - COALESCE(i.amount_paid, 0)
        ELSE 0
      END as pending_amount,
      CASE
        WHEN (i.status = 'Pending' OR i.status = 'Overdue') AND i.due_date < now_date THEN i.total - COALESCE(i.amount_paid, 0)
        ELSE 0
      END as overdue_amount
    FROM invoices i
    WHERE 
      i.user_id = p_user_id AND
      (p_start_date IS NULL OR i.invoice_date >= p_start_date) AND
      (p_end_date IS NULL OR i.invoice_date <= p_end_date) AND
      (p_status IS NULL OR i.status = p_status)
  )
  SELECT
    COALESCE(SUM(total), 0) as total,
    COALESCE(SUM(paid_amount), 0) as paid,
    COALESCE(SUM(pending_amount), 0) as pending,
    COALESCE(SUM(overdue_amount), 0) as overdue,
    COUNT(id)::INTEGER as count
  FROM invoice_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recent_notifications(p_user_id uuid, p_limit integer DEFAULT 5)
 RETURNS SETOF notifications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM notifications
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    summary jsonb;
BEGIN
    WITH notification_stats AS (
        SELECT 
            COUNT(*) as total_unread,
            COUNT(CASE WHEN urgency = 'CRITICAL' THEN 1 END) as critical,
            COUNT(CASE WHEN urgency = 'HIGH' THEN 1 END) as high,
            COUNT(CASE WHEN urgency = 'MEDIUM' THEN 1 END) as medium,
            COUNT(CASE WHEN urgency = 'LOW' THEN 1 END) as low,
            COUNT(CASE WHEN notification_type LIKE 'DOCUMENT_EXPIRY%' THEN 1 END) as document_expiry,
            COUNT(CASE WHEN due_date <= CURRENT_DATE THEN 1 END) as overdue
        FROM notifications 
        WHERE user_id = p_user_id 
            AND is_read = false
    )
    SELECT jsonb_build_object(
        'total_unread', COALESCE(ns.total_unread, 0),
        'by_urgency', jsonb_build_object(
            'critical', COALESCE(ns.critical, 0),
            'high', COALESCE(ns.high, 0),
            'medium', COALESCE(ns.medium, 0),
            'low', COALESCE(ns.low, 0)
        ),
        'document_expiry', COALESCE(ns.document_expiry, 0),
        'overdue', COALESCE(ns.overdue, 0)
    ) INTO summary
    FROM notification_stats ns;
    
    RETURN summary;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, new.created_at, new.updated_at);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."ifta_trips_with_mileage" as  SELECT t.id,
    t.user_id,
    t.quarter,
    t.start_date,
    t.end_date,
    t.vehicle_id,
    t.driver_id,
    t.load_id,
    t.start_jurisdiction,
    t.end_jurisdiction,
    t.total_miles,
    t.gallons,
    t.fuel_cost,
    t.starting_odometer,
    t.ending_odometer,
    t.is_fuel_only,
    t.notes,
    t.created_at,
    t.updated_at,
    t.is_imported,
    t.mileage_trip_id,
    t.source,
    m.start_date AS mileage_start_date,
    m.end_date AS mileage_end_date,
    m.vehicle_id AS mileage_vehicle_id,
    ( SELECT count(*) AS count
           FROM driver_mileage_crossings c
          WHERE (c.trip_id = m.id)) AS crossing_count
   FROM (ifta_trip_records t
     LEFT JOIN driver_mileage_trips m ON ((t.mileage_trip_id = m.id)));


CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    updated_count integer;
BEGIN
    UPDATE notifications 
    SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id 
        AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE notifications 
    SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_notification_id 
        AND user_id = p_user_id
        AND is_read = false;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  invoice_record RECORD;
  total_paid DECIMAL(10, 2);
BEGIN
  -- Get the invoice
  SELECT * INTO invoice_record FROM invoices WHERE id = NEW.invoice_id;
  
  -- Calculate total paid amount including this payment
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id AND status = 'completed';
  
  -- Add the new payment if it's being inserted and is completed
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    total_paid := total_paid + NEW.amount;
  END IF;
  
  -- Update the invoice amount_paid and status
  UPDATE invoices
  SET 
    amount_paid = total_paid,
    status = CASE
      WHEN total_paid >= invoice_record.total THEN 'Paid'
      WHEN total_paid > 0 THEN 'Partially Paid'
      ELSE invoice_record.status
    END,
    payment_date = CASE
      WHEN total_paid >= invoice_record.total THEN CURRENT_DATE
      ELSE invoice_record.payment_date
    END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_invoice_status_on_due_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- If invoice is already paid, don't change
  IF NEW.status = 'Paid' THEN
    RETURN NEW;
  END IF;
  
  -- Check if due date has passed and update to Overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status = 'Pending' THEN
    NEW.status := 'Overdue';
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_load_completion_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  total_stops INTEGER;
  completed_stops INTEGER;
  load_record RECORD;
BEGIN
  -- Count total and completed stops
  SELECT COUNT(*) INTO total_stops
  FROM load_stops
  WHERE load_id = NEW.load_id;
  
  SELECT COUNT(*) INTO completed_stops
  FROM load_stops
  WHERE load_id = NEW.load_id AND status = 'Completed';
  
  -- If all stops are completed, update load status
  IF total_stops > 0 AND total_stops = completed_stops THEN
    SELECT * INTO load_record FROM loads WHERE id = NEW.load_id;
    
    -- Only update if load isn't already completed
    IF load_record.status != 'Completed' THEN
      UPDATE loads
      SET 
        status = 'Delivered',
        updated_at = NOW()
      WHERE id = NEW.load_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;


grant delete on table "public"."company_info" to "anon";

grant insert on table "public"."company_info" to "anon";

grant references on table "public"."company_info" to "anon";

grant select on table "public"."company_info" to "anon";

grant trigger on table "public"."company_info" to "anon";

grant truncate on table "public"."company_info" to "anon";

grant update on table "public"."company_info" to "anon";

grant delete on table "public"."company_info" to "authenticated";

grant insert on table "public"."company_info" to "authenticated";

grant references on table "public"."company_info" to "authenticated";

grant select on table "public"."company_info" to "authenticated";

grant trigger on table "public"."company_info" to "authenticated";

grant truncate on table "public"."company_info" to "authenticated";

grant update on table "public"."company_info" to "authenticated";

grant delete on table "public"."company_info" to "service_role";

grant insert on table "public"."company_info" to "service_role";

grant references on table "public"."company_info" to "service_role";

grant select on table "public"."company_info" to "service_role";

grant trigger on table "public"."company_info" to "service_role";

grant truncate on table "public"."company_info" to "service_role";

grant update on table "public"."company_info" to "service_role";

grant delete on table "public"."company_profiles" to "anon";

grant insert on table "public"."company_profiles" to "anon";

grant references on table "public"."company_profiles" to "anon";

grant select on table "public"."company_profiles" to "anon";

grant trigger on table "public"."company_profiles" to "anon";

grant truncate on table "public"."company_profiles" to "anon";

grant update on table "public"."company_profiles" to "anon";

grant delete on table "public"."company_profiles" to "authenticated";

grant insert on table "public"."company_profiles" to "authenticated";

grant references on table "public"."company_profiles" to "authenticated";

grant select on table "public"."company_profiles" to "authenticated";

grant trigger on table "public"."company_profiles" to "authenticated";

grant truncate on table "public"."company_profiles" to "authenticated";

grant update on table "public"."company_profiles" to "authenticated";

grant delete on table "public"."company_profiles" to "service_role";

grant insert on table "public"."company_profiles" to "service_role";

grant references on table "public"."company_profiles" to "service_role";

grant select on table "public"."company_profiles" to "service_role";

grant trigger on table "public"."company_profiles" to "service_role";

grant truncate on table "public"."company_profiles" to "service_role";

grant update on table "public"."company_profiles" to "service_role";

grant delete on table "public"."compliance_items" to "anon";

grant insert on table "public"."compliance_items" to "anon";

grant references on table "public"."compliance_items" to "anon";

grant select on table "public"."compliance_items" to "anon";

grant trigger on table "public"."compliance_items" to "anon";

grant truncate on table "public"."compliance_items" to "anon";

grant update on table "public"."compliance_items" to "anon";

grant delete on table "public"."compliance_items" to "authenticated";

grant insert on table "public"."compliance_items" to "authenticated";

grant references on table "public"."compliance_items" to "authenticated";

grant select on table "public"."compliance_items" to "authenticated";

grant trigger on table "public"."compliance_items" to "authenticated";

grant truncate on table "public"."compliance_items" to "authenticated";

grant update on table "public"."compliance_items" to "authenticated";

grant delete on table "public"."compliance_items" to "service_role";

grant insert on table "public"."compliance_items" to "service_role";

grant references on table "public"."compliance_items" to "service_role";

grant select on table "public"."compliance_items" to "service_role";

grant trigger on table "public"."compliance_items" to "service_role";

grant truncate on table "public"."compliance_items" to "service_role";

grant update on table "public"."compliance_items" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."driver_mileage_crossings" to "anon";

grant insert on table "public"."driver_mileage_crossings" to "anon";

grant references on table "public"."driver_mileage_crossings" to "anon";

grant select on table "public"."driver_mileage_crossings" to "anon";

grant trigger on table "public"."driver_mileage_crossings" to "anon";

grant truncate on table "public"."driver_mileage_crossings" to "anon";

grant update on table "public"."driver_mileage_crossings" to "anon";

grant delete on table "public"."driver_mileage_crossings" to "authenticated";

grant insert on table "public"."driver_mileage_crossings" to "authenticated";

grant references on table "public"."driver_mileage_crossings" to "authenticated";

grant select on table "public"."driver_mileage_crossings" to "authenticated";

grant trigger on table "public"."driver_mileage_crossings" to "authenticated";

grant truncate on table "public"."driver_mileage_crossings" to "authenticated";

grant update on table "public"."driver_mileage_crossings" to "authenticated";

grant delete on table "public"."driver_mileage_crossings" to "service_role";

grant insert on table "public"."driver_mileage_crossings" to "service_role";

grant references on table "public"."driver_mileage_crossings" to "service_role";

grant select on table "public"."driver_mileage_crossings" to "service_role";

grant trigger on table "public"."driver_mileage_crossings" to "service_role";

grant truncate on table "public"."driver_mileage_crossings" to "service_role";

grant update on table "public"."driver_mileage_crossings" to "service_role";

grant delete on table "public"."driver_mileage_trips" to "anon";

grant insert on table "public"."driver_mileage_trips" to "anon";

grant references on table "public"."driver_mileage_trips" to "anon";

grant select on table "public"."driver_mileage_trips" to "anon";

grant trigger on table "public"."driver_mileage_trips" to "anon";

grant truncate on table "public"."driver_mileage_trips" to "anon";

grant update on table "public"."driver_mileage_trips" to "anon";

grant delete on table "public"."driver_mileage_trips" to "authenticated";

grant insert on table "public"."driver_mileage_trips" to "authenticated";

grant references on table "public"."driver_mileage_trips" to "authenticated";

grant select on table "public"."driver_mileage_trips" to "authenticated";

grant trigger on table "public"."driver_mileage_trips" to "authenticated";

grant truncate on table "public"."driver_mileage_trips" to "authenticated";

grant update on table "public"."driver_mileage_trips" to "authenticated";

grant delete on table "public"."driver_mileage_trips" to "service_role";

grant insert on table "public"."driver_mileage_trips" to "service_role";

grant references on table "public"."driver_mileage_trips" to "service_role";

grant select on table "public"."driver_mileage_trips" to "service_role";

grant trigger on table "public"."driver_mileage_trips" to "service_role";

grant truncate on table "public"."driver_mileage_trips" to "service_role";

grant update on table "public"."driver_mileage_trips" to "service_role";

grant delete on table "public"."drivers" to "anon";

grant insert on table "public"."drivers" to "anon";

grant references on table "public"."drivers" to "anon";

grant select on table "public"."drivers" to "anon";

grant trigger on table "public"."drivers" to "anon";

grant truncate on table "public"."drivers" to "anon";

grant update on table "public"."drivers" to "anon";

grant delete on table "public"."drivers" to "authenticated";

grant insert on table "public"."drivers" to "authenticated";

grant references on table "public"."drivers" to "authenticated";

grant select on table "public"."drivers" to "authenticated";

grant trigger on table "public"."drivers" to "authenticated";

grant truncate on table "public"."drivers" to "authenticated";

grant update on table "public"."drivers" to "authenticated";

grant delete on table "public"."drivers" to "service_role";

grant insert on table "public"."drivers" to "service_role";

grant references on table "public"."drivers" to "service_role";

grant select on table "public"."drivers" to "service_role";

grant trigger on table "public"."drivers" to "service_role";

grant truncate on table "public"."drivers" to "service_role";

grant update on table "public"."drivers" to "service_role";

grant delete on table "public"."earnings" to "anon";

grant insert on table "public"."earnings" to "anon";

grant references on table "public"."earnings" to "anon";

grant select on table "public"."earnings" to "anon";

grant trigger on table "public"."earnings" to "anon";

grant truncate on table "public"."earnings" to "anon";

grant update on table "public"."earnings" to "anon";

grant delete on table "public"."earnings" to "authenticated";

grant insert on table "public"."earnings" to "authenticated";

grant references on table "public"."earnings" to "authenticated";

grant select on table "public"."earnings" to "authenticated";

grant trigger on table "public"."earnings" to "authenticated";

grant truncate on table "public"."earnings" to "authenticated";

grant update on table "public"."earnings" to "authenticated";

grant delete on table "public"."earnings" to "service_role";

grant insert on table "public"."earnings" to "service_role";

grant references on table "public"."earnings" to "service_role";

grant select on table "public"."earnings" to "service_role";

grant trigger on table "public"."earnings" to "service_role";

grant truncate on table "public"."earnings" to "service_role";

grant update on table "public"."earnings" to "service_role";

grant delete on table "public"."expense_categories" to "anon";

grant insert on table "public"."expense_categories" to "anon";

grant references on table "public"."expense_categories" to "anon";

grant select on table "public"."expense_categories" to "anon";

grant trigger on table "public"."expense_categories" to "anon";

grant truncate on table "public"."expense_categories" to "anon";

grant update on table "public"."expense_categories" to "anon";

grant delete on table "public"."expense_categories" to "authenticated";

grant insert on table "public"."expense_categories" to "authenticated";

grant references on table "public"."expense_categories" to "authenticated";

grant select on table "public"."expense_categories" to "authenticated";

grant trigger on table "public"."expense_categories" to "authenticated";

grant truncate on table "public"."expense_categories" to "authenticated";

grant update on table "public"."expense_categories" to "authenticated";

grant delete on table "public"."expense_categories" to "service_role";

grant insert on table "public"."expense_categories" to "service_role";

grant references on table "public"."expense_categories" to "service_role";

grant select on table "public"."expense_categories" to "service_role";

grant trigger on table "public"."expense_categories" to "service_role";

grant truncate on table "public"."expense_categories" to "service_role";

grant update on table "public"."expense_categories" to "service_role";

grant delete on table "public"."expenses" to "anon";

grant insert on table "public"."expenses" to "anon";

grant references on table "public"."expenses" to "anon";

grant select on table "public"."expenses" to "anon";

grant trigger on table "public"."expenses" to "anon";

grant truncate on table "public"."expenses" to "anon";

grant update on table "public"."expenses" to "anon";

grant delete on table "public"."expenses" to "authenticated";

grant insert on table "public"."expenses" to "authenticated";

grant references on table "public"."expenses" to "authenticated";

grant select on table "public"."expenses" to "authenticated";

grant trigger on table "public"."expenses" to "authenticated";

grant truncate on table "public"."expenses" to "authenticated";

grant update on table "public"."expenses" to "authenticated";

grant delete on table "public"."expenses" to "service_role";

grant insert on table "public"."expenses" to "service_role";

grant references on table "public"."expenses" to "service_role";

grant select on table "public"."expenses" to "service_role";

grant trigger on table "public"."expenses" to "service_role";

grant truncate on table "public"."expenses" to "service_role";

grant update on table "public"."expenses" to "service_role";

grant delete on table "public"."fuel_entries" to "anon";

grant insert on table "public"."fuel_entries" to "anon";

grant references on table "public"."fuel_entries" to "anon";

grant select on table "public"."fuel_entries" to "anon";

grant trigger on table "public"."fuel_entries" to "anon";

grant truncate on table "public"."fuel_entries" to "anon";

grant update on table "public"."fuel_entries" to "anon";

grant delete on table "public"."fuel_entries" to "authenticated";

grant insert on table "public"."fuel_entries" to "authenticated";

grant references on table "public"."fuel_entries" to "authenticated";

grant select on table "public"."fuel_entries" to "authenticated";

grant trigger on table "public"."fuel_entries" to "authenticated";

grant truncate on table "public"."fuel_entries" to "authenticated";

grant update on table "public"."fuel_entries" to "authenticated";

grant delete on table "public"."fuel_entries" to "service_role";

grant insert on table "public"."fuel_entries" to "service_role";

grant references on table "public"."fuel_entries" to "service_role";

grant select on table "public"."fuel_entries" to "service_role";

grant trigger on table "public"."fuel_entries" to "service_role";

grant truncate on table "public"."fuel_entries" to "service_role";

grant update on table "public"."fuel_entries" to "service_role";

grant delete on table "public"."ifta_report_details" to "anon";

grant insert on table "public"."ifta_report_details" to "anon";

grant references on table "public"."ifta_report_details" to "anon";

grant select on table "public"."ifta_report_details" to "anon";

grant trigger on table "public"."ifta_report_details" to "anon";

grant truncate on table "public"."ifta_report_details" to "anon";

grant update on table "public"."ifta_report_details" to "anon";

grant delete on table "public"."ifta_report_details" to "authenticated";

grant insert on table "public"."ifta_report_details" to "authenticated";

grant references on table "public"."ifta_report_details" to "authenticated";

grant select on table "public"."ifta_report_details" to "authenticated";

grant trigger on table "public"."ifta_report_details" to "authenticated";

grant truncate on table "public"."ifta_report_details" to "authenticated";

grant update on table "public"."ifta_report_details" to "authenticated";

grant delete on table "public"."ifta_report_details" to "service_role";

grant insert on table "public"."ifta_report_details" to "service_role";

grant references on table "public"."ifta_report_details" to "service_role";

grant select on table "public"."ifta_report_details" to "service_role";

grant trigger on table "public"."ifta_report_details" to "service_role";

grant truncate on table "public"."ifta_report_details" to "service_role";

grant update on table "public"."ifta_report_details" to "service_role";

grant delete on table "public"."ifta_reports" to "anon";

grant insert on table "public"."ifta_reports" to "anon";

grant references on table "public"."ifta_reports" to "anon";

grant select on table "public"."ifta_reports" to "anon";

grant trigger on table "public"."ifta_reports" to "anon";

grant truncate on table "public"."ifta_reports" to "anon";

grant update on table "public"."ifta_reports" to "anon";

grant delete on table "public"."ifta_reports" to "authenticated";

grant insert on table "public"."ifta_reports" to "authenticated";

grant references on table "public"."ifta_reports" to "authenticated";

grant select on table "public"."ifta_reports" to "authenticated";

grant trigger on table "public"."ifta_reports" to "authenticated";

grant truncate on table "public"."ifta_reports" to "authenticated";

grant update on table "public"."ifta_reports" to "authenticated";

grant delete on table "public"."ifta_reports" to "service_role";

grant insert on table "public"."ifta_reports" to "service_role";

grant references on table "public"."ifta_reports" to "service_role";

grant select on table "public"."ifta_reports" to "service_role";

grant trigger on table "public"."ifta_reports" to "service_role";

grant truncate on table "public"."ifta_reports" to "service_role";

grant update on table "public"."ifta_reports" to "service_role";

grant delete on table "public"."ifta_tax_rates" to "anon";

grant insert on table "public"."ifta_tax_rates" to "anon";

grant references on table "public"."ifta_tax_rates" to "anon";

grant select on table "public"."ifta_tax_rates" to "anon";

grant trigger on table "public"."ifta_tax_rates" to "anon";

grant truncate on table "public"."ifta_tax_rates" to "anon";

grant update on table "public"."ifta_tax_rates" to "anon";

grant delete on table "public"."ifta_tax_rates" to "authenticated";

grant insert on table "public"."ifta_tax_rates" to "authenticated";

grant references on table "public"."ifta_tax_rates" to "authenticated";

grant select on table "public"."ifta_tax_rates" to "authenticated";

grant trigger on table "public"."ifta_tax_rates" to "authenticated";

grant truncate on table "public"."ifta_tax_rates" to "authenticated";

grant update on table "public"."ifta_tax_rates" to "authenticated";

grant delete on table "public"."ifta_tax_rates" to "service_role";

grant insert on table "public"."ifta_tax_rates" to "service_role";

grant references on table "public"."ifta_tax_rates" to "service_role";

grant select on table "public"."ifta_tax_rates" to "service_role";

grant trigger on table "public"."ifta_tax_rates" to "service_role";

grant truncate on table "public"."ifta_tax_rates" to "service_role";

grant update on table "public"."ifta_tax_rates" to "service_role";

grant delete on table "public"."ifta_trip_records" to "anon";

grant insert on table "public"."ifta_trip_records" to "anon";

grant references on table "public"."ifta_trip_records" to "anon";

grant select on table "public"."ifta_trip_records" to "anon";

grant trigger on table "public"."ifta_trip_records" to "anon";

grant truncate on table "public"."ifta_trip_records" to "anon";

grant update on table "public"."ifta_trip_records" to "anon";

grant delete on table "public"."ifta_trip_records" to "authenticated";

grant insert on table "public"."ifta_trip_records" to "authenticated";

grant references on table "public"."ifta_trip_records" to "authenticated";

grant select on table "public"."ifta_trip_records" to "authenticated";

grant trigger on table "public"."ifta_trip_records" to "authenticated";

grant truncate on table "public"."ifta_trip_records" to "authenticated";

grant update on table "public"."ifta_trip_records" to "authenticated";

grant delete on table "public"."ifta_trip_records" to "service_role";

grant insert on table "public"."ifta_trip_records" to "service_role";

grant references on table "public"."ifta_trip_records" to "service_role";

grant select on table "public"."ifta_trip_records" to "service_role";

grant trigger on table "public"."ifta_trip_records" to "service_role";

grant truncate on table "public"."ifta_trip_records" to "service_role";

grant update on table "public"."ifta_trip_records" to "service_role";

grant delete on table "public"."ifta_trip_state_mileage" to "anon";

grant insert on table "public"."ifta_trip_state_mileage" to "anon";

grant references on table "public"."ifta_trip_state_mileage" to "anon";

grant select on table "public"."ifta_trip_state_mileage" to "anon";

grant trigger on table "public"."ifta_trip_state_mileage" to "anon";

grant truncate on table "public"."ifta_trip_state_mileage" to "anon";

grant update on table "public"."ifta_trip_state_mileage" to "anon";

grant delete on table "public"."ifta_trip_state_mileage" to "authenticated";

grant insert on table "public"."ifta_trip_state_mileage" to "authenticated";

grant references on table "public"."ifta_trip_state_mileage" to "authenticated";

grant select on table "public"."ifta_trip_state_mileage" to "authenticated";

grant trigger on table "public"."ifta_trip_state_mileage" to "authenticated";

grant truncate on table "public"."ifta_trip_state_mileage" to "authenticated";

grant update on table "public"."ifta_trip_state_mileage" to "authenticated";

grant delete on table "public"."ifta_trip_state_mileage" to "service_role";

grant insert on table "public"."ifta_trip_state_mileage" to "service_role";

grant references on table "public"."ifta_trip_state_mileage" to "service_role";

grant select on table "public"."ifta_trip_state_mileage" to "service_role";

grant trigger on table "public"."ifta_trip_state_mileage" to "service_role";

grant truncate on table "public"."ifta_trip_state_mileage" to "service_role";

grant update on table "public"."ifta_trip_state_mileage" to "service_role";

grant delete on table "public"."invoice_activities" to "anon";

grant insert on table "public"."invoice_activities" to "anon";

grant references on table "public"."invoice_activities" to "anon";

grant select on table "public"."invoice_activities" to "anon";

grant trigger on table "public"."invoice_activities" to "anon";

grant truncate on table "public"."invoice_activities" to "anon";

grant update on table "public"."invoice_activities" to "anon";

grant delete on table "public"."invoice_activities" to "authenticated";

grant insert on table "public"."invoice_activities" to "authenticated";

grant references on table "public"."invoice_activities" to "authenticated";

grant select on table "public"."invoice_activities" to "authenticated";

grant trigger on table "public"."invoice_activities" to "authenticated";

grant truncate on table "public"."invoice_activities" to "authenticated";

grant update on table "public"."invoice_activities" to "authenticated";

grant delete on table "public"."invoice_activities" to "service_role";

grant insert on table "public"."invoice_activities" to "service_role";

grant references on table "public"."invoice_activities" to "service_role";

grant select on table "public"."invoice_activities" to "service_role";

grant trigger on table "public"."invoice_activities" to "service_role";

grant truncate on table "public"."invoice_activities" to "service_role";

grant update on table "public"."invoice_activities" to "service_role";

grant delete on table "public"."invoice_items" to "anon";

grant insert on table "public"."invoice_items" to "anon";

grant references on table "public"."invoice_items" to "anon";

grant select on table "public"."invoice_items" to "anon";

grant trigger on table "public"."invoice_items" to "anon";

grant truncate on table "public"."invoice_items" to "anon";

grant update on table "public"."invoice_items" to "anon";

grant delete on table "public"."invoice_items" to "authenticated";

grant insert on table "public"."invoice_items" to "authenticated";

grant references on table "public"."invoice_items" to "authenticated";

grant select on table "public"."invoice_items" to "authenticated";

grant trigger on table "public"."invoice_items" to "authenticated";

grant truncate on table "public"."invoice_items" to "authenticated";

grant update on table "public"."invoice_items" to "authenticated";

grant delete on table "public"."invoice_items" to "service_role";

grant insert on table "public"."invoice_items" to "service_role";

grant references on table "public"."invoice_items" to "service_role";

grant select on table "public"."invoice_items" to "service_role";

grant trigger on table "public"."invoice_items" to "service_role";

grant truncate on table "public"."invoice_items" to "service_role";

grant update on table "public"."invoice_items" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."load_documents" to "anon";

grant insert on table "public"."load_documents" to "anon";

grant references on table "public"."load_documents" to "anon";

grant select on table "public"."load_documents" to "anon";

grant trigger on table "public"."load_documents" to "anon";

grant truncate on table "public"."load_documents" to "anon";

grant update on table "public"."load_documents" to "anon";

grant delete on table "public"."load_documents" to "authenticated";

grant insert on table "public"."load_documents" to "authenticated";

grant references on table "public"."load_documents" to "authenticated";

grant select on table "public"."load_documents" to "authenticated";

grant trigger on table "public"."load_documents" to "authenticated";

grant truncate on table "public"."load_documents" to "authenticated";

grant update on table "public"."load_documents" to "authenticated";

grant delete on table "public"."load_documents" to "service_role";

grant insert on table "public"."load_documents" to "service_role";

grant references on table "public"."load_documents" to "service_role";

grant select on table "public"."load_documents" to "service_role";

grant trigger on table "public"."load_documents" to "service_role";

grant truncate on table "public"."load_documents" to "service_role";

grant update on table "public"."load_documents" to "service_role";

grant delete on table "public"."load_stops" to "anon";

grant insert on table "public"."load_stops" to "anon";

grant references on table "public"."load_stops" to "anon";

grant select on table "public"."load_stops" to "anon";

grant trigger on table "public"."load_stops" to "anon";

grant truncate on table "public"."load_stops" to "anon";

grant update on table "public"."load_stops" to "anon";

grant delete on table "public"."load_stops" to "authenticated";

grant insert on table "public"."load_stops" to "authenticated";

grant references on table "public"."load_stops" to "authenticated";

grant select on table "public"."load_stops" to "authenticated";

grant trigger on table "public"."load_stops" to "authenticated";

grant truncate on table "public"."load_stops" to "authenticated";

grant update on table "public"."load_stops" to "authenticated";

grant delete on table "public"."load_stops" to "service_role";

grant insert on table "public"."load_stops" to "service_role";

grant references on table "public"."load_stops" to "service_role";

grant select on table "public"."load_stops" to "service_role";

grant trigger on table "public"."load_stops" to "service_role";

grant truncate on table "public"."load_stops" to "service_role";

grant update on table "public"."load_stops" to "service_role";

grant delete on table "public"."loads" to "anon";

grant insert on table "public"."loads" to "anon";

grant references on table "public"."loads" to "anon";

grant select on table "public"."loads" to "anon";

grant trigger on table "public"."loads" to "anon";

grant truncate on table "public"."loads" to "anon";

grant update on table "public"."loads" to "anon";

grant delete on table "public"."loads" to "authenticated";

grant insert on table "public"."loads" to "authenticated";

grant references on table "public"."loads" to "authenticated";

grant select on table "public"."loads" to "authenticated";

grant trigger on table "public"."loads" to "authenticated";

grant truncate on table "public"."loads" to "authenticated";

grant update on table "public"."loads" to "authenticated";

grant delete on table "public"."loads" to "service_role";

grant insert on table "public"."loads" to "service_role";

grant references on table "public"."loads" to "service_role";

grant select on table "public"."loads" to "service_role";

grant trigger on table "public"."loads" to "service_role";

grant truncate on table "public"."loads" to "service_role";

grant update on table "public"."loads" to "service_role";

grant delete on table "public"."maintenance_records" to "anon";

grant insert on table "public"."maintenance_records" to "anon";

grant references on table "public"."maintenance_records" to "anon";

grant select on table "public"."maintenance_records" to "anon";

grant trigger on table "public"."maintenance_records" to "anon";

grant truncate on table "public"."maintenance_records" to "anon";

grant update on table "public"."maintenance_records" to "anon";

grant delete on table "public"."maintenance_records" to "authenticated";

grant insert on table "public"."maintenance_records" to "authenticated";

grant references on table "public"."maintenance_records" to "authenticated";

grant select on table "public"."maintenance_records" to "authenticated";

grant trigger on table "public"."maintenance_records" to "authenticated";

grant truncate on table "public"."maintenance_records" to "authenticated";

grant update on table "public"."maintenance_records" to "authenticated";

grant delete on table "public"."maintenance_records" to "service_role";

grant insert on table "public"."maintenance_records" to "service_role";

grant references on table "public"."maintenance_records" to "service_role";

grant select on table "public"."maintenance_records" to "service_role";

grant trigger on table "public"."maintenance_records" to "service_role";

grant truncate on table "public"."maintenance_records" to "service_role";

grant update on table "public"."maintenance_records" to "service_role";

grant delete on table "public"."notification_preferences" to "anon";

grant insert on table "public"."notification_preferences" to "anon";

grant references on table "public"."notification_preferences" to "anon";

grant select on table "public"."notification_preferences" to "anon";

grant trigger on table "public"."notification_preferences" to "anon";

grant truncate on table "public"."notification_preferences" to "anon";

grant update on table "public"."notification_preferences" to "anon";

grant delete on table "public"."notification_preferences" to "authenticated";

grant insert on table "public"."notification_preferences" to "authenticated";

grant references on table "public"."notification_preferences" to "authenticated";

grant select on table "public"."notification_preferences" to "authenticated";

grant trigger on table "public"."notification_preferences" to "authenticated";

grant truncate on table "public"."notification_preferences" to "authenticated";

grant update on table "public"."notification_preferences" to "authenticated";

grant delete on table "public"."notification_preferences" to "service_role";

grant insert on table "public"."notification_preferences" to "service_role";

grant references on table "public"."notification_preferences" to "service_role";

grant select on table "public"."notification_preferences" to "service_role";

grant trigger on table "public"."notification_preferences" to "service_role";

grant truncate on table "public"."notification_preferences" to "service_role";

grant update on table "public"."notification_preferences" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."processed_sessions" to "anon";

grant insert on table "public"."processed_sessions" to "anon";

grant references on table "public"."processed_sessions" to "anon";

grant select on table "public"."processed_sessions" to "anon";

grant trigger on table "public"."processed_sessions" to "anon";

grant truncate on table "public"."processed_sessions" to "anon";

grant update on table "public"."processed_sessions" to "anon";

grant delete on table "public"."processed_sessions" to "authenticated";

grant insert on table "public"."processed_sessions" to "authenticated";

grant references on table "public"."processed_sessions" to "authenticated";

grant select on table "public"."processed_sessions" to "authenticated";

grant trigger on table "public"."processed_sessions" to "authenticated";

grant truncate on table "public"."processed_sessions" to "authenticated";

grant update on table "public"."processed_sessions" to "authenticated";

grant delete on table "public"."processed_sessions" to "service_role";

grant insert on table "public"."processed_sessions" to "service_role";

grant references on table "public"."processed_sessions" to "service_role";

grant select on table "public"."processed_sessions" to "service_role";

grant trigger on table "public"."processed_sessions" to "service_role";

grant truncate on table "public"."processed_sessions" to "service_role";

grant update on table "public"."processed_sessions" to "service_role";

grant delete on table "public"."reminders" to "anon";

grant insert on table "public"."reminders" to "anon";

grant references on table "public"."reminders" to "anon";

grant select on table "public"."reminders" to "anon";

grant trigger on table "public"."reminders" to "anon";

grant truncate on table "public"."reminders" to "anon";

grant update on table "public"."reminders" to "anon";

grant delete on table "public"."reminders" to "authenticated";

grant insert on table "public"."reminders" to "authenticated";

grant references on table "public"."reminders" to "authenticated";

grant select on table "public"."reminders" to "authenticated";

grant trigger on table "public"."reminders" to "authenticated";

grant truncate on table "public"."reminders" to "authenticated";

grant update on table "public"."reminders" to "authenticated";

grant delete on table "public"."reminders" to "service_role";

grant insert on table "public"."reminders" to "service_role";

grant references on table "public"."reminders" to "service_role";

grant select on table "public"."reminders" to "service_role";

grant trigger on table "public"."reminders" to "service_role";

grant truncate on table "public"."reminders" to "service_role";

grant update on table "public"."reminders" to "service_role";

grant delete on table "public"."spatial_ref_sys" to "anon";

grant insert on table "public"."spatial_ref_sys" to "anon";

grant references on table "public"."spatial_ref_sys" to "anon";

grant select on table "public"."spatial_ref_sys" to "anon";

grant trigger on table "public"."spatial_ref_sys" to "anon";

grant truncate on table "public"."spatial_ref_sys" to "anon";

grant update on table "public"."spatial_ref_sys" to "anon";

grant delete on table "public"."spatial_ref_sys" to "authenticated";

grant insert on table "public"."spatial_ref_sys" to "authenticated";

grant references on table "public"."spatial_ref_sys" to "authenticated";

grant select on table "public"."spatial_ref_sys" to "authenticated";

grant trigger on table "public"."spatial_ref_sys" to "authenticated";

grant truncate on table "public"."spatial_ref_sys" to "authenticated";

grant update on table "public"."spatial_ref_sys" to "authenticated";

grant delete on table "public"."spatial_ref_sys" to "postgres";

grant insert on table "public"."spatial_ref_sys" to "postgres";

grant references on table "public"."spatial_ref_sys" to "postgres";

grant select on table "public"."spatial_ref_sys" to "postgres";

grant trigger on table "public"."spatial_ref_sys" to "postgres";

grant truncate on table "public"."spatial_ref_sys" to "postgres";

grant update on table "public"."spatial_ref_sys" to "postgres";

grant delete on table "public"."spatial_ref_sys" to "service_role";

grant insert on table "public"."spatial_ref_sys" to "service_role";

grant references on table "public"."spatial_ref_sys" to "service_role";

grant select on table "public"."spatial_ref_sys" to "service_role";

grant trigger on table "public"."spatial_ref_sys" to "service_role";

grant truncate on table "public"."spatial_ref_sys" to "service_role";

grant update on table "public"."spatial_ref_sys" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."trucks" to "anon";

grant insert on table "public"."trucks" to "anon";

grant references on table "public"."trucks" to "anon";

grant select on table "public"."trucks" to "anon";

grant trigger on table "public"."trucks" to "anon";

grant truncate on table "public"."trucks" to "anon";

grant update on table "public"."trucks" to "anon";

grant delete on table "public"."trucks" to "authenticated";

grant insert on table "public"."trucks" to "authenticated";

grant references on table "public"."trucks" to "authenticated";

grant select on table "public"."trucks" to "authenticated";

grant trigger on table "public"."trucks" to "authenticated";

grant truncate on table "public"."trucks" to "authenticated";

grant update on table "public"."trucks" to "authenticated";

grant delete on table "public"."trucks" to "service_role";

grant insert on table "public"."trucks" to "service_role";

grant references on table "public"."trucks" to "service_role";

grant select on table "public"."trucks" to "service_role";

grant trigger on table "public"."trucks" to "service_role";

grant truncate on table "public"."trucks" to "service_role";

grant update on table "public"."trucks" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant references on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant trigger on table "public"."user_settings" to "anon";

grant truncate on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant references on table "public"."user_settings" to "authenticated";

grant select on table "public"."user_settings" to "authenticated";

grant trigger on table "public"."user_settings" to "authenticated";

grant truncate on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";

grant insert on table "public"."user_settings" to "service_role";

grant references on table "public"."user_settings" to "service_role";

grant select on table "public"."user_settings" to "service_role";

grant trigger on table "public"."user_settings" to "service_role";

grant truncate on table "public"."user_settings" to "service_role";

grant update on table "public"."user_settings" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."vehicles" to "anon";

grant insert on table "public"."vehicles" to "anon";

grant references on table "public"."vehicles" to "anon";

grant select on table "public"."vehicles" to "anon";

grant trigger on table "public"."vehicles" to "anon";

grant truncate on table "public"."vehicles" to "anon";

grant update on table "public"."vehicles" to "anon";

grant delete on table "public"."vehicles" to "authenticated";

grant insert on table "public"."vehicles" to "authenticated";

grant references on table "public"."vehicles" to "authenticated";

grant select on table "public"."vehicles" to "authenticated";

grant trigger on table "public"."vehicles" to "authenticated";

grant truncate on table "public"."vehicles" to "authenticated";

grant update on table "public"."vehicles" to "authenticated";

grant delete on table "public"."vehicles" to "service_role";

grant insert on table "public"."vehicles" to "service_role";

grant references on table "public"."vehicles" to "service_role";

grant select on table "public"."vehicles" to "service_role";

grant trigger on table "public"."vehicles" to "service_role";

grant truncate on table "public"."vehicles" to "service_role";

grant update on table "public"."vehicles" to "service_role";

create policy "Users can create their own company info"
on "public"."company_info"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own company info"
on "public"."company_info"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own company info"
on "public"."company_info"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own company info"
on "public"."company_info"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "company_profiles_user_policy"
on "public"."company_profiles"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can delete their own compliance items"
on "public"."compliance_items"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own compliance items"
on "public"."compliance_items"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own compliance items"
on "public"."compliance_items"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own compliance items"
on "public"."compliance_items"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own customers"
on "public"."customers"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own customers"
on "public"."customers"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own customers"
on "public"."customers"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own customers"
on "public"."customers"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete crossings for their own trips"
on "public"."driver_mileage_crossings"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM driver_mileage_trips
  WHERE ((driver_mileage_trips.id = driver_mileage_crossings.trip_id) AND (driver_mileage_trips.user_id = auth.uid())))));


create policy "Users can insert crossings for their own trips"
on "public"."driver_mileage_crossings"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM driver_mileage_trips
  WHERE ((driver_mileage_trips.id = driver_mileage_crossings.trip_id) AND (driver_mileage_trips.user_id = auth.uid())))));


create policy "Users can update crossings for their own trips"
on "public"."driver_mileage_crossings"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM driver_mileage_trips
  WHERE ((driver_mileage_trips.id = driver_mileage_crossings.trip_id) AND (driver_mileage_trips.user_id = auth.uid())))));


create policy "Users can view crossings for their own trips"
on "public"."driver_mileage_crossings"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM driver_mileage_trips
  WHERE ((driver_mileage_trips.id = driver_mileage_crossings.trip_id) AND (driver_mileage_trips.user_id = auth.uid())))));


create policy "Users can delete their own trips"
on "public"."driver_mileage_trips"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own trips"
on "public"."driver_mileage_trips"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own trips"
on "public"."driver_mileage_trips"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own trips"
on "public"."driver_mileage_trips"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own drivers"
on "public"."drivers"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own drivers"
on "public"."drivers"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own drivers"
on "public"."drivers"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own drivers"
on "public"."drivers"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete their own earnings"
on "public"."earnings"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own earnings"
on "public"."earnings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own earnings"
on "public"."earnings"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own earnings"
on "public"."earnings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own expense categories"
on "public"."expense_categories"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own expense categories"
on "public"."expense_categories"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own expense categories"
on "public"."expense_categories"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view default and their own expense categories"
on "public"."expense_categories"
as permissive
for select
to public
using (((user_id IS NULL) OR (auth.uid() = user_id)));


create policy "Users can create their own expenses"
on "public"."expenses"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own expenses"
on "public"."expenses"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own expenses"
on "public"."expenses"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own expenses"
on "public"."expenses"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own fuel entries"
on "public"."fuel_entries"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own fuel entries"
on "public"."fuel_entries"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own fuel entries"
on "public"."fuel_entries"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own fuel entries"
on "public"."fuel_entries"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own IFTA reports"
on "public"."ifta_reports"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own IFTA reports"
on "public"."ifta_reports"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own IFTA reports"
on "public"."ifta_reports"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own IFTA reports"
on "public"."ifta_reports"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own IFTA trip records"
on "public"."ifta_trip_records"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own IFTA trip records"
on "public"."ifta_trip_records"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own IFTA trip records"
on "public"."ifta_trip_records"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own IFTA trip records"
on "public"."ifta_trip_records"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create IFTA trip state mileage they own"
on "public"."ifta_trip_state_mileage"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete IFTA trip state mileage they own"
on "public"."ifta_trip_state_mileage"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update IFTA trip state mileage they own"
on "public"."ifta_trip_state_mileage"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view IFTA trip state mileage they own"
on "public"."ifta_trip_state_mileage"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create invoice activities they own"
on "public"."invoice_activities"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_activities.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can view invoice activities they own"
on "public"."invoice_activities"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_activities.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can create invoice items they own"
on "public"."invoice_items"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can delete invoice items they own"
on "public"."invoice_items"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can update invoice items they own"
on "public"."invoice_items"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can view invoice items they own"
on "public"."invoice_items"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can create their own invoices"
on "public"."invoices"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own invoices"
on "public"."invoices"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own invoices"
on "public"."invoices"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own invoices"
on "public"."invoices"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create load documents they own"
on "public"."load_documents"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_documents.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can delete load documents they own"
on "public"."load_documents"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_documents.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can update load documents they own"
on "public"."load_documents"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_documents.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can view load documents they own"
on "public"."load_documents"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_documents.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can create load stops they own"
on "public"."load_stops"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_stops.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can delete load stops they own"
on "public"."load_stops"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_stops.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can update load stops they own"
on "public"."load_stops"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_stops.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can view load stops they own"
on "public"."load_stops"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM loads
  WHERE ((loads.id = load_stops.load_id) AND (loads.user_id = auth.uid())))));


create policy "Users can create their own loads"
on "public"."loads"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own loads"
on "public"."loads"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own loads"
on "public"."loads"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own loads"
on "public"."loads"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "notification_preferences_user_policy"
on "public"."notification_preferences"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can delete their own notifications"
on "public"."notifications"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own payments"
on "public"."payments"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own payments"
on "public"."payments"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own payments"
on "public"."payments"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own payments"
on "public"."payments"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Anyone can insert processed sessions"
on "public"."processed_sessions"
as permissive
for insert
to public
with check (true);


create policy "Users can view their own processed sessions"
on "public"."processed_sessions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own reminders"
on "public"."reminders"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own reminders"
on "public"."reminders"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own reminders"
on "public"."reminders"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own reminders"
on "public"."reminders"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Service role can access all subscriptions"
on "public"."subscriptions"
as permissive
for all
to public
using (((auth.jwt() ? 'service_role'::text) IS NOT NULL));


create policy "Users can delete their own subscriptions"
on "public"."subscriptions"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own subscriptions"
on "public"."subscriptions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own subscriptions"
on "public"."subscriptions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own subscriptions"
on "public"."subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "insert_own_subscriptions"
on "public"."subscriptions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "select_own_subscriptions"
on "public"."subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "subscriptions_select_policy"
on "public"."subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "subscriptions_update_policy"
on "public"."subscriptions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "update_own_subscriptions"
on "public"."subscriptions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Service role can do anything"
on "public"."user_preferences"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can insert their own preferences"
on "public"."user_preferences"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own preferences"
on "public"."user_preferences"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own preferences"
on "public"."user_preferences"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own settings"
on "public"."user_settings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own settings"
on "public"."user_settings"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own settings"
on "public"."user_settings"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own settings"
on "public"."user_settings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update their own profile"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can create their own vehicles"
on "public"."vehicles"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own vehicles"
on "public"."vehicles"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own vehicles"
on "public"."vehicles"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own vehicles"
on "public"."vehicles"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER check_invoice_due_date_on_insert BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_invoice_status_on_due_date();

CREATE TRIGGER check_invoice_due_date_on_update BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_invoice_status_on_due_date();

CREATE TRIGGER update_load_status_on_stop_completion AFTER UPDATE OF status ON public.load_stops FOR EACH ROW WHEN (((old.status <> 'Completed'::text) AND (new.status = 'Completed'::text))) EXECUTE FUNCTION update_load_completion_status();

CREATE TRIGGER loads_factoring_trigger AFTER UPDATE ON public.loads FOR EACH ROW EXECUTE FUNCTION create_factored_earnings();

CREATE TRIGGER update_invoice_payment_on_insert AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


create policy "Users can delete their own company assets"
on "storage"."objects"
as permissive
for delete
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'company_assets'::text)));


create policy "Users can delete their own documents"
on "storage"."objects"
as permissive
for delete
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'documents'::text)));


create policy "Users can delete their own receipts"
on "storage"."objects"
as permissive
for delete
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'receipts'::text)));


create policy "Users can insert their own company assets"
on "storage"."objects"
as permissive
for insert
to public
with check (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'company_assets'::text)));


create policy "Users can insert their own documents"
on "storage"."objects"
as permissive
for insert
to public
with check (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'documents'::text)));


create policy "Users can insert their own receipts"
on "storage"."objects"
as permissive
for insert
to public
with check (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'receipts'::text)));


create policy "Users can read their own company assets"
on "storage"."objects"
as permissive
for select
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'company_assets'::text)));


create policy "Users can read their own documents"
on "storage"."objects"
as permissive
for select
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'documents'::text)));


create policy "Users can read their own receipts"
on "storage"."objects"
as permissive
for select
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'receipts'::text)));


create policy "Users can update their own company assets"
on "storage"."objects"
as permissive
for update
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'company_assets'::text)));


create policy "Users can update their own documents"
on "storage"."objects"
as permissive
for update
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'documents'::text)));


create policy "Users can update their own receipts"
on "storage"."objects"
as permissive
for update
to public
using (((auth.uid() = ((storage.foldername(name))[1])::uuid) AND (bucket_id = 'receipts'::text)));




