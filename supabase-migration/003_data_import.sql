-- Truck Command Complete Data Import
-- Generated: 2026-01-24
-- Run this AFTER 001_schema.sql and 002_indexes.sql
-- IMPORTANT: Run in order - users first, then dependent tables

-- ============================================
-- DISABLE TRIGGERS TEMPORARILY (for faster import)
-- ============================================
SET session_replication_role = replica;

-- ============================================
-- USERS (5 records)
-- ============================================
INSERT INTO users (id, full_name, email, phone, company_name, address, city, state, zip, fleet_size, subscription_tier, stripe_customer_id, avatar_url, created_at, updated_at, dismissed_tutorials, has_demo_data, demo_data_created_at, operator_type, primary_focus, onboarding_completed, onboarding_completed_at, setup_checklist_dismissed) VALUES
('c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'User', 'jeramymp@gmail.com', '9515051147', 'Truck Command LLC', '', '', '', '', NULL, 'free', NULL, NULL, '2025-03-13T23:40:46.641613+00:00', '2026-01-08T06:41:37.18+00:00', ARRAY['dashboard','dispatching','invoices','expenses','customers','compliance','ifta','fuel','mileage','trucks'], false, NULL, NULL, NULL, false, NULL, true),
('1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Jeramy Perez', 'rapidreadytransport1@yahoo.com', '5555555555', 'Tc', '', '', '', '', NULL, 'free', NULL, 'https://mkqtcrbthmwqmdtrxjtc.supabase.co/storage/v1/object/public/avatars/1c8bac68-8ca7-4170-8cec-3b323cead6d5-1764819937959.png', '2025-04-15T23:55:12.802976+00:00', '2026-01-17T05:43:14.976+00:00', ARRAY['dashboard','dispatching','mileage','invoices','expenses','ifta','fuel','customers','compliance','trucks','drivers'], false, NULL, NULL, NULL, false, NULL, true),
('e95b4799-4dbe-45d0-988b-06d7c819fbda', NULL, 'b3astfortnite@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'free', NULL, NULL, '2025-04-18T00:15:10.8414+00:00', '2025-04-18T00:15:10.8414+00:00', ARRAY[]::text[], false, NULL, NULL, NULL, false, NULL, false),
('1f905997-d652-40b5-91f7-5b1bfc3fbe29', NULL, 'infinityman0000@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'free', NULL, NULL, '2025-04-27T04:46:44.593146+00:00', '2025-04-27T04:46:44.593146+00:00', ARRAY[]::text[], false, NULL, NULL, NULL, false, NULL, false),
('91cf55e7-48f8-43ad-bd06-5bf12946ccee', NULL, 'support@truckcommand.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'free', NULL, NULL, '2025-12-28T05:45:12.935164+00:00', '2026-01-04T01:52:19.069+00:00', ARRAY['dashboard','ifta','mileage','compliance','dispatching'], false, NULL, NULL, NULL, false, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUBSCRIPTIONS (4 records)
-- ============================================
INSERT INTO subscriptions (id, user_id, status, plan, billing_cycle, amount, stripe_customer_id, stripe_subscription_id, card_last_four, trial_starts_at, trial_ends_at, current_period_starts_at, current_period_ends_at, created_at, updated_at, checkout_session_id, cancel_at_period_end, canceled_at, checkout_initiated_at, cancellation_reason, cancellation_feedback, scheduled_amount, paused_at, pause_resumes_at, payment_failed_at, payment_failure_count, next_payment_retry_at, trial_ending_notified_at) VALUES
('2f82c7e5-a73d-47c5-9028-efa34689d2ee', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'active', 'fleet', 'yearly', 720, 'cus_TaxUwFzqwSuCW5', 'sub_1SgWvTDmeHB0tOmvxMPSmnAB', NULL, NULL, NULL, '2025-12-20T20:38:55+00:00', '2026-12-20T20:38:55+00:00', NULL, '2025-12-20T20:39:15.773979+00:00', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
('def47246-e000-44a8-b836-7ed3b48f9b2e', '91cf55e7-48f8-43ad-bd06-5bf12946ccee', 'active', 'fleet', 'monthly', 20, 'cus_TgZQqIrAA3eP4E', 'sub_1SkzBHDmeHB0tOmvckBW5d56', NULL, NULL, NULL, '2026-01-02T03:37:39+00:00', '2026-02-02T03:37:39+00:00', '2025-12-28T05:45:30.266+00:00', '2026-01-04T22:21:46.105443+00:00', NULL, false, '2026-01-03T02:38:40+00:00', '2026-01-02T03:38:53.647+00:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
('3b74fdbc-7dae-4cfd-99b8-cd04a14cd65f', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'active', 'fleet', 'yearly', 720, 'cus_TaxeBbi3Lx9PoC', 'sub_1SdljKDmeHB0tOmvb68rRGKd', NULL, NULL, NULL, '2025-12-13T06:27:03+00:00', '2026-12-13T06:27:03+00:00', NULL, '2026-01-04T22:23:18.787215+00:00', NULL, false, NULL, NULL, 'Too expensive', NULL, 336, NULL, NULL, NULL, 0, NULL, NULL),
('19f818b0-2318-4c3e-9678-d5efbc0d25df', '1f905997-d652-40b5-91f7-5b1bfc3fbe29', 'active', 'premium-trial', NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-27T04:46:44.593+00:00', NULL, NULL, '2026-01-16T05:21:13.09+00:00', '2026-01-16T05:21:47.912512+00:00', NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMPANY PROFILES (1 record)
-- ============================================
INSERT INTO company_profiles (id, user_id, name, address, city, state, zip_code, country, mc_number, dot_number, ein, created_at, updated_at) VALUES
('fce6b334-683e-4772-a66e-7b9860b2ab18', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'Truck Command', '13949 cameo dr ', 'fonatna', 'ca', '92337', 'United States', '523523532', '255423532', '532532532', '2025-03-14T00:05:42.98+00:00', '2025-03-14T00:05:41.697+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- USER PREFERENCES (3 records)
-- ============================================
INSERT INTO user_preferences (id, user_id, theme, created_at, updated_at) VALUES
('6a85831c-18ce-4b4b-a28b-dcdc099d6b8c', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'dark', '2025-06-01T06:37:56.035381+00:00', '2025-12-13T05:20:36.689339+00:00'),
('1b472855-4a32-4292-8b18-34393bf2487f', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'dark', '2025-07-19T04:00:19.010715+00:00', '2025-12-23T06:34:11.391276+00:00'),
('3ba377cd-ae13-41fa-bfb9-1259270890c8', '91cf55e7-48f8-43ad-bd06-5bf12946ccee', 'dark', '2026-01-02T05:00:15.35943+00:00', '2026-01-02T05:00:15.817+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DRIVERS (7 records)
-- ============================================
INSERT INTO drivers (id, user_id, name, phone, email, license, license_expiry, address, city, state, zip, status, notes, created_at, updated_at, license_number, license_state, medical_card_expiry, position, hire_date, emergency_contact, emergency_phone, image_url, eld_external_id, eld_provider, hos_status, hos_available_drive_minutes, hos_available_shift_minutes, hos_available_cycle_minutes, hos_last_updated_at) VALUES
('d73131f0-b3dd-4c21-8463-56c91f24c585', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'Jeramy Perez', '9515051147', 'jeramymp@gmail.com', NULL, '2025-05-03', NULL, 'Fontana', 'California', NULL, 'Active', NULL, '2025-03-14T01:19:08.909+00:00', '2025-03-14T01:19:08.909+00:00', '543254325', 'CA', '2025-05-24', 'Owner-Operator', '2025-03-13', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('bfbca642-39f3-45ac-aea6-1feb985ca38e', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'Jeramy Perez', '9515051147', 'jeramymp@gmail.com', NULL, '2025-10-11', NULL, 'Fontana', 'California', NULL, 'Active', NULL, '2025-04-19T05:56:31.836+00:00', '2025-04-19T05:56:31.836+00:00', '1312', 'ca', '2025-10-25', 'Driver', '2025-04-25', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('ec14f7b5-620a-4fe5-bb4a-98076debfc01', '1f905997-d652-40b5-91f7-5b1bfc3fbe29', 'Jeramy Perez', '9515051147', 'jeramymp@gmail.com', NULL, '2025-11-20', NULL, 'Fontana', 'California', NULL, 'Active', NULL, '2025-04-30T23:38:18.941+00:00', '2025-04-30T23:38:18.941+00:00', '341242341234', 'ca', '2026-01-02', 'Driver', '2025-04-30', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('aa447616-c7cf-4ab8-a5be-f9a2cb429327', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Angel Hirugamu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2026-01-17T05:40:36.519+00:00', '2026-01-17T05:40:36.587048+00:00', NULL, NULL, NULL, 'Driver', NULL, NULL, NULL, NULL, '2703919', 'motive', NULL, NULL, NULL, NULL, NULL),
('4ffa4039-53da-441b-bfae-6a08fd2c420b', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Ramon Perez', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', NULL, '2026-01-17T05:40:36.93+00:00', '2026-01-17T05:40:36.995373+00:00', NULL, NULL, NULL, 'Driver', NULL, NULL, NULL, NULL, '4412488', 'motive', NULL, NULL, NULL, NULL, NULL),
('abe53c4b-d6ff-4856-8af5-18a633659438', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Andrew', '9093714933', 'rapidreadytransport1@yahoo.com', NULL, '2026-07-11', NULL, 'Fontana', 'CA', NULL, 'Active', NULL, '2025-07-04T00:48:25.117+00:00', '2025-07-04T00:50:40.732+00:00', 'A9992611 ', 'Ca', '2026-07-11', 'Driver', '2023-10-30', '', '', NULL, '6012120', 'terminal', NULL, NULL, NULL, NULL, NULL),
('d41057bc-805c-467f-8d12-b7d746383f5f', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Jeramy ', '9518405191', 'rapidreadytransport1@yahoo.com', NULL, '2026-12-05', NULL, 'Fontana', 'CA', NULL, 'Active', NULL, '2025-04-16T00:02:34.617+00:00', '2025-07-04T00:46:13.027+00:00', 'B5204111', 'Ca', '2026-11-25', 'Owner-Operator', '2004-02-01', '', '', NULL, '12205840', 'terminal', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VEHICLES (12 records)
-- ============================================
INSERT INTO vehicles (id, user_id, name, type, make, model, year, vin, license_plate, status, color, mpg, fuel_type, tank_capacity, notes, created_at, updated_at, image_url, registration_expiry, insurance_expiry, inspection_expiry, assigned_driver_id, eld_external_id, eld_provider, eld_device_serial, last_known_location, last_location_at, eld_last_sync_at) VALUES
('1f57e40c-1dde-40b3-891e-1e89de2c0e8a', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'Blue', NULL, 'FrieghtLiner', 'Cascadia', 2025, '12333333333333333', 'Tx-32432', 'Active', NULL, NULL, 'Diesel', NULL, NULL, '2025-03-14T01:13:48.619+00:00', '2025-03-14T01:13:48.619+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('d2c45b29-d8f7-44df-8619-fe49caf31c2f', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'Red', NULL, 'PeterBuilt', '757', 2023, '12333333333333334', 'Tx-12311', 'Active', NULL, NULL, 'Diesel', NULL, NULL, '2025-03-28T02:31:16.026+00:00', '2025-03-28T02:31:16.026+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('c0b03f98-5df1-4378-82f3-37fc8cf8c835', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'red', NULL, 'frieghtliner', 'cascadia', 2025, '11111111111111111', 'tx-1234', 'Active', NULL, NULL, 'Diesel', NULL, NULL, '2025-04-19T05:57:17.115+00:00', '2025-04-19T05:57:17.115+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('b29c5b7e-9b02-49d5-b124-ab7f85ec2710', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'blueee', NULL, 'frieghtliner', 'cascadia', 2025, '19247583554433287', 'tx-1234', 'Active', NULL, NULL, 'Diesel', NULL, NULL, '2025-04-25T05:26:15.089+00:00', '2025-04-25T05:26:15.089+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('30eecdca-dad7-406b-b44e-e11123817ba4', '1f905997-d652-40b5-91f7-5b1bfc3fbe29', 'red', NULL, 'frieghtliner', 'cascadia', 2025, '12345667890000000', 'tx-1234', 'Active', NULL, NULL, 'Diesel', NULL, NULL, '2025-04-30T23:37:15.613+00:00', '2025-04-30T23:37:15.613+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('fd141cb9-ee60-4945-bf83-67aeb259e578', '1f905997-d652-40b5-91f7-5b1bfc3fbe29', 'blueee', NULL, 'kenworth', 'dsa', 2025, '12345667890000000', 'tx-1234', 'In Maintenance', NULL, NULL, 'Diesel', NULL, NULL, '2025-04-30T23:39:45.521+00:00', '2025-04-30T23:39:45.521+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('71f58125-b1d2-4a16-ac16-d8d435ff0c31', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Stepdeck ', NULL, 'Wilson', 'Stepdeck ', 2020, '1W15532A5L6628836', '4SK5484', 'Active', NULL, NULL, 'Other', NULL, NULL, '2025-07-18T03:43:00.334+00:00', '2025-07-18T03:43:00.335+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('df499a58-d10c-4f36-be9f-fcbe02543d21', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'RGN', NULL, 'Specialized ', '90 HDE', 2024, '4U3J04821RL022916', 'C395334', 'Active', NULL, NULL, 'Other', NULL, NULL, '2025-07-18T03:47:01.326+00:00', '2025-07-18T03:47:01.326+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('fae5055b-5c81-4085-a66a-a711b2749f85', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Office Subscriptions and operating costs ', NULL, 'Me', '01', 101, '12345678910111233', '456', 'Active', NULL, NULL, 'Other', NULL, NULL, '2025-09-03T03:28:04.875+00:00', '2025-09-03T03:28:04.875+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('568621d2-801f-4a3d-b710-957d34c848c9', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', '2020 Pete', NULL, 'Peterbilt ', '389', 2025, '1XPXD49X1LD648534', 'XP69264', 'Active', NULL, NULL, 'Diesel', NULL, NULL, '2025-04-16T00:01:04.472+00:00', '2025-04-16T00:01:04.472+00:00', NULL, NULL, NULL, NULL, NULL, '1399362', 'motive', NULL, NULL, NULL, NULL),
('18fd924d-b0db-472e-95cc-350822498941', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', '2017 Chevy', NULL, 'Alke''', 'Silverado ', 2022, '1GC4K0CY3HF245414', '97230H2', 'Active', NULL, NULL, 'Diesel', NULL, NULL, '2025-07-04T00:42:57.107+00:00', '2025-07-04T00:42:57.107+00:00', NULL, NULL, NULL, NULL, NULL, '2521060', 'motive', NULL, NULL, NULL, NULL),
('42f77659-6fb5-4635-b49b-46c4536f8b14', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', '2015 KW', NULL, 'Alke''', 'T680', 2022, '1XKYD49X0FJ459521', 'YP19625 ', 'Active', NULL, NULL, 'Diesel', NULL, '', '2025-06-14T22:45:38.385+00:00', '2025-12-03T07:07:08.698+00:00', 'https://mkqtcrbthmwqmdtrxjtc.supabase.co/storage/v1/object/public/vehicles/1c8bac68-8ca7-4170-8cec-3b323cead6d5/trucks/1764745628226_TC.png', NULL, NULL, NULL, NULL, '2521060', 'motive', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INVOICES (2 records)
-- ============================================
INSERT INTO invoices (id, user_id, invoice_number, customer, customer_id, load_id, invoice_date, due_date, po_number, terms, notes, subtotal, tax_rate, tax_amount, total, amount_paid, payment_date, status, last_sent, customer_email, customer_address, created_at, updated_at, payment_terms) VALUES
('727a1c3a-7a7a-41ce-b14e-1e161771c2e2', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'INV-2025-0001', 'Test', NULL, 'b25db3f5-59e4-438d-bfcb-4b6561e31143', '2025-05-27', '2025-06-11', '', 'Payment is due within 15 days of invoice date. Please make check payable to Your Company Name.', '', 5000, 0, 0, 5000, 5000, '2025-05-27', 'Paid', NULL, 'rapidreadytransport1@yahoo.com', '13949 Cameo Dr
Fontana, CA 92337', '2025-05-27T23:42:15.460391+00:00', '2025-05-27T23:42:15.460391+00:00', 'Net 30'),
('93b3c341-643a-48ac-8b4b-aef24ef94b2b', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'INV-2025-000156', 'TC', NULL, '10177dd9-ae20-411f-ba9a-322c45e21d43', '2025-12-13', '2025-12-28', '', 'Payment is due within 15 days of invoice date.', '', 5000, 0, 0, 5000, 0, NULL, 'overdue', NULL, 'infinityman0000@gmail.com', '', '2025-12-13T19:58:02.382854+00:00', '2025-12-13T19:58:02.382854+00:00', 'Net 15')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INVOICE ITEMS (2 records)
-- ============================================
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, created_at, updated_at) VALUES
('98a75732-f586-435d-91ab-74bf71c3fe11', '727a1c3a-7a7a-41ce-b14e-1e161771c2e2', 'Trucking Services - Load #LC-20250507-2254 - Fontana, Ca to Dallas, Tx', 1, 5000, 0, '2025-05-27T23:42:15.650655+00:00', '2025-05-27T23:42:15.650655+00:00'),
('5b0e5170-df1d-41f7-90f3-7504bab11cd7', '93b3c341-643a-48ac-8b4b-aef24ef94b2b', 'Trucking Services - Load #343243242 - Fontana, Ca to Dallas, Tx', 1, 5000, 0, '2025-12-13T19:58:02.628863+00:00', '2025-12-13T19:58:02.628863+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PAYMENTS (1 record)
-- ============================================
INSERT INTO payments (id, user_id, invoice_id, amount, date, method, reference, description, notes, status, created_at, updated_at) VALUES
('4b59e333-4c32-48f9-8337-7a6b683adee1', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', '727a1c3a-7a7a-41ce-b14e-1e161771c2e2', 5000, '2025-05-27', 'credit_card', '', 'Payment for invoice INV-2025-0001', '', 'completed', '2025-05-27T23:42:52.770219+00:00', '2025-05-27T23:42:52.770219+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMPLIANCE ITEMS (6 records)
-- ============================================
INSERT INTO compliance_items (id, user_id, title, compliance_type, entity_type, entity_name, document_number, issue_date, expiration_date, issuing_authority, notes, status, document_url, created_at, updated_at) VALUES
('54f3cf7c-cbfb-4af1-aeb3-654ec55f830e', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'vehicles regis', 'REGISTRATION', 'Vehicle', 'Redd', '23123213', '2025-04-26', '2026-04-26', 'dmv', NULL, 'Active', 'https://mkqtcrbthmwqmdtrxjtc.supabase.co/storage/v1/object/public/documents/e95b4799-4dbe-45d0-988b-06d7c819fbda/1745708940041.png', '2025-04-26T23:09:01.049947+00:00', '2025-04-26T23:09:01.049947+00:00'),
('d798d33b-22f0-42a0-81f6-56bc08cda5f6', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'vehicles regis', 'REGISTRATION', 'Vehicle', 'Redd', '23123213', '2025-05-01', '2025-05-12', 'DOT', NULL, 'Expired', NULL, '2025-05-14T01:18:48.095264+00:00', '2025-05-14T01:18:48.095264+00:00'),
('828351d5-f772-464c-b4d6-bbabd0dc5665', '1c8bac68-8ca7-4170-8cec-3b323cead6d5', 'Registration ', 'REGISTRATION', 'Vehicle', '1', '123', '2025-04-15', '2025-04-18', 'Dmv', NULL, 'Expired', NULL, '2025-04-16T00:25:32.685298+00:00', '2025-04-16T00:25:32.685298+00:00'),
('dc2fec38-8b76-4e40-b2da-55f04ce1dc23', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'test', 'REGISTRATION', 'Vehicle', 'test', '', '2025-11-30', '2025-12-10', NULL, NULL, 'Active', NULL, '2025-12-10T03:00:54.797+00:00', '2025-12-10T03:00:54.797+00:00'),
('321886bf-6707-490d-9bbc-3cba0dc0612a', '91cf55e7-48f8-43ad-bd06-5bf12946ccee', 'test', 'REGISTRATION', 'Vehicle', 'test', '324', '2025-12-16', '2026-01-04', 'dmv', NULL, 'Active', NULL, '2026-01-02T05:07:10.515+00:00', '2026-01-02T05:07:10.515+00:00'),
('878d6c2c-438f-42eb-911e-fd24caac6de9', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'test', 'INSURANCE', 'Vehicle', 'test', '4324234', '2025-12-28', '2026-01-14', 'insurance', NULL, 'Active', NULL, '2026-01-12T22:44:51.093+00:00', '2026-01-12T22:44:51.093+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTIFICATION PREFERENCES (2 records)
-- ============================================
INSERT INTO notification_preferences (id, user_id, preferences, created_at, updated_at) VALUES
('43b1637e-5fc6-4583-81cd-8d1735811eb8', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', '{"categories":{"fuel":{"sms":false,"push":true,"email":false},"ifta":{"sms":false,"push":true,"email":true},"loads":{"sms":false,"push":true,"email":false},"system":{"sms":false,"push":true,"email":false},"billing":{"sms":false,"push":true,"email":true},"drivers":{"sms":false,"push":true,"email":true},"compliance":{"sms":false,"push":true,"email":true},"maintenance":{"sms":false,"push":true,"email":false}},"digest_mode":"instant","quiet_hours":{"end":"07:00","start":"22:00","enabled":false},"sms_enabled":false,"push_enabled":true,"email_enabled":true}', '2025-12-02T06:43:18.028384+00:00', '2025-12-02T06:43:25.118+00:00'),
('4387e5c8-fd26-4b6d-9d65-da1f65cd2ebb', '91cf55e7-48f8-43ad-bd06-5bf12946ccee', '{"categories":{"fuel":{"sms":false,"push":true,"email":true},"ifta":{"sms":false,"push":true,"email":true},"loads":{"sms":false,"push":true,"email":true},"system":{"sms":false,"push":true,"email":true},"billing":{"sms":false,"push":true,"email":true},"drivers":{"sms":false,"push":true,"email":true},"compliance":{"sms":false,"push":true,"email":true},"maintenance":{"sms":false,"push":true,"email":true}},"digest_mode":"instant","quiet_hours":{"end":"07:00","start":"22:00","enabled":false},"sms_enabled":false,"push_enabled":true,"email_enabled":true}', '2026-01-02T08:27:48.387432+00:00', '2026-01-02T08:41:50.371+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INVOICE ACTIVITIES (4 records)
-- ============================================
INSERT INTO invoice_activities (id, invoice_id, user_id, user_name, activity_type, description, created_at) VALUES
('3a28ecdc-3180-4cfc-a8ac-90174b3550fb', '727a1c3a-7a7a-41ce-b14e-1e161771c2e2', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'User', 'created', 'Invoice created', '2025-05-27T23:42:15.816922+00:00'),
('d5d072f2-2f4e-45f5-9857-8274e8496a73', '727a1c3a-7a7a-41ce-b14e-1e161771c2e2', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'b3astfortnite@gmail.com', 'payment', 'Payment of $5000.00 recorded', '2025-05-27T23:42:53.034126+00:00'),
('d835eaad-00f8-40e0-bcb4-a00ac33cf6ba', '727a1c3a-7a7a-41ce-b14e-1e161771c2e2', 'e95b4799-4dbe-45d0-988b-06d7c819fbda', 'b3astfortnite@gmail.com', 'payment', 'Payment of $5000.00 recorded', '2025-05-27T23:42:53.124453+00:00'),
('c8f7478a-418a-47f5-ace3-18fc20393c78', '93b3c341-643a-48ac-8b4b-aef24ef94b2b', 'c28daa67-75a7-4760-9a31-f9d904dbe6bc', 'User', 'created', 'Invoice created', '2025-12-13T19:58:02.819617+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LAUNCH WAITLIST (1 record)
-- ============================================
INSERT INTO launch_waitlist (id, email, name, source, created_at, notified_at, subscribed) VALUES
('00000000-0000-0000-0000-000000000001', 'example@email.com', NULL, 'signup_page', now(), NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RE-ENABLE TRIGGERS
-- ============================================
SET session_replication_role = DEFAULT;

-- ============================================
-- LARGE TABLES - IMPORT SEPARATELY
-- ============================================
-- The following large tables have been exported to separate JSON files:
--
-- 1. customers (36 rows) - See 004_customers_data.json
-- 2. earnings (63 rows) - See 005_earnings_data.json
-- 3. notifications (17 rows) - See 006_notifications_data.json
-- 4. ifta_trip_records (42 rows) - See 007_ifta_trip_records_data.json
-- 5. driver_mileage_trips (32 rows) - See 008_driver_mileage_trips_data.json
-- 6. driver_mileage_crossings (138 rows) - See 009_driver_mileage_crossings_data.json
-- 7. vehicle_active_faults (20 rows) - See 010_vehicle_active_faults_data.json
-- 8. processed_sessions (9 rows) - See 011_processed_sessions_data.json
-- 9. loads (69 rows) - See data/loads.json
-- 10. expenses (484 rows) - See data/expenses.json
-- 11. fuel_entries (106 rows) - See data/fuel_entries.json
--
-- To import these, use the json_populate_recordset function in your new Supabase:
-- INSERT INTO table_name SELECT * FROM json_populate_recordset(null::table_name, 'JSON_DATA_HERE'::json);
