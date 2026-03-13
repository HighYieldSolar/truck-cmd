# Truck Command Database Migration Guide

This guide helps you migrate your Truck Command database to a new Supabase project.

## Migration Files

1. **001_schema.sql** - Creates all database tables with proper constraints
2. **002_indexes.sql** - Creates all performance indexes
3. **data/** - Contains data export files (to be populated)

## Step-by-Step Migration Process

### Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Name your project (e.g., "truck-command")
5. Set a secure database password (save this!)
6. Choose a region close to your users
7. Wait for the project to be created

### Step 2: Enable Required Extensions

In your new Supabase project:

1. Go to **Database** > **Extensions**
2. Enable the following extensions:
   - `uuid-ossp` - For UUID generation
   - `postgis` - For geographic data (if available)

### Step 3: Run Schema Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `001_schema.sql`
3. Paste and run the SQL
4. Verify tables were created by checking **Table Editor**

### Step 4: Run Index Migration

1. In **SQL Editor**, copy the contents of `002_indexes.sql`
2. Paste and run the SQL
3. This creates all performance indexes

### Step 5: Export Data from Current Database

To export your data, run these queries in your **current** Supabase project's SQL Editor:

#### Export Core Tables (copy results as JSON):

```sql
-- Users (run and save result)
SELECT json_agg(t) FROM users t;

-- Subscriptions
SELECT json_agg(t) FROM subscriptions t;

-- Company Profiles
SELECT json_agg(t) FROM company_profiles t;

-- User Preferences
SELECT json_agg(t) FROM user_preferences t;

-- Drivers
SELECT json_agg(t) FROM drivers t;

-- Vehicles
SELECT json_agg(t) FROM vehicles t;

-- Customers
SELECT json_agg(t) FROM customers t;

-- Loads
SELECT json_agg(t) FROM loads t;

-- Expenses
SELECT json_agg(t) FROM expenses t;

-- Fuel Entries
SELECT json_agg(t) FROM fuel_entries t;

-- Earnings
SELECT json_agg(t) FROM earnings t;

-- Invoices
SELECT json_agg(t) FROM invoices t;

-- Invoice Items
SELECT json_agg(t) FROM invoice_items t;

-- Payments
SELECT json_agg(t) FROM payments t;

-- Compliance Items
SELECT json_agg(t) FROM compliance_items t;

-- Notifications
SELECT json_agg(t) FROM notifications t;

-- IFTA Trip Records
SELECT json_agg(t) FROM ifta_trip_records t;

-- Driver Mileage Trips
SELECT json_agg(t) FROM driver_mileage_trips t;

-- Driver Mileage Crossings
SELECT json_agg(t) FROM driver_mileage_crossings t;
```

### Step 6: Import Data to New Database

For each table's JSON data, run an INSERT statement in your **new** Supabase SQL Editor:

```sql
-- Example for users table (replace JSON_DATA with your exported data)
INSERT INTO users
SELECT * FROM json_populate_recordset(null::users, 'JSON_DATA'::json);
```

**Important:** Import tables in this order to respect foreign key relationships:

1. `users` (first - no dependencies)
2. `subscriptions`
3. `company_profiles`
4. `user_preferences`
5. `drivers`
6. `vehicles`
7. `customers`
8. `loads`
9. `expenses`
10. `fuel_entries`
11. `earnings`
12. `invoices`
13. `invoice_items`
14. `payments`
15. `compliance_items`
16. `notifications`
17. `notification_preferences`
18. `ifta_trip_records`
19. `driver_mileage_trips`
20. `driver_mileage_crossings`

### Step 7: Update Application Configuration

1. Get your new Supabase project credentials:
   - Go to **Settings** > **API**
   - Copy the **Project URL** and **anon/public** key

2. Update your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
   ```

3. If using Stripe webhooks, update the webhook endpoint URL in Stripe Dashboard

### Step 8: Set Up Row Level Security (RLS)

After importing data, enable RLS policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;
-- ... repeat for other tables

-- Example policy for user-owned data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own drivers" ON drivers
  FOR ALL USING (auth.uid() = user_id);
```

## Syncing Across Devices

Once migrated, both your laptop and PC will connect to the same Supabase database:

1. Clone your repository on both devices
2. Set the same environment variables on both
3. Changes made on one device will be visible on the other after a page refresh
4. Real-time subscriptions (if used) will sync changes immediately

## Table Statistics (Current Database)

| Table | Row Count |
|-------|-----------|
| users | 5 |
| subscriptions | 4 |
| company_profiles | 1 |
| user_preferences | 3 |
| drivers | 7 |
| vehicles | 12 |
| customers | 36 |
| loads | 69 |
| expenses | 484 |
| fuel_entries | 106 |
| earnings | 63 |
| invoices | 2 |
| invoice_items | 2 |
| payments | 1 |
| compliance_items | 6 |
| notifications | 17 |
| notification_preferences | 2 |
| ifta_trip_records | 42 |
| driver_mileage_trips | 32 |
| driver_mileage_crossings | 138 |
| vehicle_active_faults | 20 |
| invoice_activities | 4 |
| processed_sessions | 9 |
| launch_waitlist | 1 |

## Troubleshooting

### "Duplicate key" errors during import
- Data already exists in the table
- Truncate the table first: `TRUNCATE TABLE tablename CASCADE;`

### Foreign key constraint errors
- Import tables in the correct order (see Step 6)
- Parent records must exist before child records

### Missing extensions
- Make sure `uuid-ossp` is enabled before running schema

### Auth users not syncing
- Supabase Auth users are separate from the `users` table
- Users will need to sign up again on the new project
- Their user IDs will be different, requiring data updates

## Support

For issues with this migration, check:
1. Supabase documentation: https://supabase.com/docs
2. SQL errors in the Supabase dashboard logs
3. Application errors in browser console
