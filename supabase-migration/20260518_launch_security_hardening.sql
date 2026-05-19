-- ============================================================================
-- 20260518_launch_security_hardening.sql
-- Pre-launch security hardening pass — resolves all Supabase ERROR-level
-- security advisors and the highest-value WARN findings.
--
-- Run order: top to bottom. Each block is wrapped in its own transaction
-- so you can copy-paste any single section in isolation.
--
-- Sections:
--   1. Move PostGIS extension from `public` schema to `extensions`
--   2. Storage bucket policy cleanup (dedupe + LIST hardening)
--   3. Close launch_waitlist anon INSERT (re-open before ads)
--   4. Set explicit search_path on the 13 app functions
-- ============================================================================


-- ============================================================================
-- SECTION 1 — Move PostGIS to `extensions` schema
-- ----------------------------------------------------------------------------
-- Why: Supabase flags `rls_disabled_in_public` on the postgis-owned
-- `spatial_ref_sys` table. RLS cannot be enabled on an extension-owned table,
-- so the only fix is to move the extension out of `public`.
--
-- Tables that use postgis types and will be affected:
--   - eld_gps_breadcrumbs.location (geometry)
--   - ifta_automated_crossings.crossing_location (geometry)
--   - ifta_jurisdictions.boundary (geometry)
--   - ifta_jurisdictions.centroid (geometry)
--
-- Columns continue to work after the move because Postgres stores the type
-- OID, not the schema-qualified name. The only breakage risk is unqualified
-- references to `geometry`, `geography`, or `ST_*` functions inside our own
-- PL/pgSQL bodies. We fix that by extending the role-level search_path so
-- the resolver finds them in `extensions`.
--
-- Apply in this order (Supabase Studio → SQL editor):
-- ============================================================================

BEGIN;

-- 1a. Make sure the `extensions` schema exists (Supabase creates it by default).
CREATE SCHEMA IF NOT EXISTS extensions;

-- 1b. Grant the runtime roles USAGE so RPCs can still resolve postgis types.
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 1c. Move the extension.
--     This relocates all postgis functions, types, operators, AND the
--     spatial_ref_sys / geography_columns / geometry_columns tables.
ALTER EXTENSION postgis SET SCHEMA extensions;

-- 1d. Extend the search_path on every role that runs application SQL so any
--     existing unqualified `geometry::extensions.geometry` references in our
--     PL/pgSQL function bodies continue to resolve.
ALTER ROLE postgres        SET search_path = public, extensions;
ALTER ROLE anon            SET search_path = public, extensions;
ALTER ROLE authenticated   SET search_path = public, extensions;
ALTER ROLE service_role    SET search_path = public, extensions;

-- 1e. Verify: spatial_ref_sys should now live in `extensions`, not `public`.
--     (Returns one row with schema = 'extensions'.)
-- SELECT n.nspname AS schema, c.relname AS table
-- FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
-- WHERE c.relname = 'spatial_ref_sys';

COMMIT;

-- POST-APPLY SMOKE TEST (run in a separate query window):
--   SELECT extensions.ST_AsText(location) FROM public.eld_gps_breadcrumbs LIMIT 1;
--   SELECT count(*) FROM public.ifta_jurisdictions WHERE boundary IS NOT NULL;
-- If both succeed, the move is clean. If either errors with "type geometry
-- does not exist", run:
--   SET search_path = public, extensions;
-- in your session and re-test, then verify ALTER ROLE took effect by
-- reconnecting and running `SHOW search_path;`.


-- ============================================================================
-- SECTION 2 — Storage bucket policies
-- ----------------------------------------------------------------------------
-- Current state (queried 2026-05-18):
--   avatars  : public=true,  2 redundant SELECT policies
--   drivers  : public=true,  2 redundant SELECT policies
--   vehicles : public=true,  2 redundant SELECT policies
--   documents: public=true,  no LIST policy → still exposed by bucket flag
--   receipts : public=true,  no LIST policy → still exposed by bucket flag
--
-- Advisor flagged avatars/drivers/vehicles for `public_bucket_allows_listing`
-- because they have 2 policies (advisor counts policy duplication as an
-- enumeration risk surface).
--
-- DECISION (per launch plan):
--   - avatars, drivers, vehicles: keep public READ (URLs are uuid-paths, low
--     enumeration risk after dedupe), drop duplicate policies.
--   - documents, receipts: KEEP PUBLIC FOR NOW because the app currently
--     renders these via plain CDN URLs (ReceiptViewerModal, ReceiptDirectory).
--     Migrating them to signed URLs is an app-side change scoped for the
--     POST-LAUNCH security pass — see [[Current Sprint]] 2026-05-18 entry.
--
-- This section ONLY dedupes the redundant policies; the documents/receipts
-- exposure is intentionally left as a tracked post-launch item.
-- ============================================================================

BEGIN;

-- 2a. Dedupe avatars (keep "Allow public read access to avatars", drop the
--     unnamed "Public Access" duplicate which predates the named policy).
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 2b. Dedupe drivers (keep the descriptive named policy).
DROP POLICY IF EXISTS "Allow public read access to drivers" ON storage.objects;

-- 2c. Dedupe vehicles (keep the descriptive named policy).
DROP POLICY IF EXISTS "Allow public read access to vehicles" ON storage.objects;

-- 2d. Also drop the redundant INSERT/UPDATE/DELETE policies that lack tenant
--     scoping. The "Avatar * for authenticated users" variants already scope
--     to `(storage.foldername(name))[1] = auth.uid()::text`, which is the
--     correct tenant-isolated policy. The unscoped duplicates let any
--     authenticated user touch any other user's files.
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete avatar files"     ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update avatar files"     ON storage.objects;

-- Drivers + vehicles do NOT have the per-user-folder-scoped equivalent yet
-- (the policies just check bucket_id). If your app stores driver/vehicle
-- assets under a per-user prefix, you can drop these as well and replace
-- with a scoped variant. Leaving them as-is for launch since changing
-- write semantics is higher risk than read.
-- DROP POLICY IF EXISTS "Allow authenticated uploads to drivers" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete driver images"         ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update driver images"         ON storage.objects;
-- DROP POLICY IF EXISTS "Users can upload driver images"         ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated uploads to vehicles" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete vehicle images"         ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update vehicle images"         ON storage.objects;
-- DROP POLICY IF EXISTS "Users can upload vehicle images"         ON storage.objects;

COMMIT;

-- POST-APPLY VERIFY:
--   SELECT bucket_id, policyname, cmd, roles::text
--   FROM (SELECT *, regexp_replace(qual, '.*bucket_id = ''([^'']+)''.*', '\1') AS bucket_id FROM pg_policies WHERE schemaname='storage' AND tablename='objects') p
--   WHERE bucket_id IN ('avatars','drivers','vehicles')
--   ORDER BY bucket_id, cmd, policyname;
-- Expected: exactly 1 SELECT policy per bucket; INSERT/UPDATE/DELETE only via
-- the per-user-scoped policies for avatars.


-- ============================================================================
-- SECTION 3 — Close launch_waitlist anon INSERT (re-open before ads)
-- ----------------------------------------------------------------------------
-- Current state:
--   "Allow anonymous insert to waitlist" — anon role, with_check = true
--   "Allow authenticated users to view waitlist" — auth role, qual = true
--
-- Both are too permissive. We're closing INSERT entirely until the launch
-- date so the form is dormant (any attempt returns 42501/permission denied).
-- The view policy is also tightened so only the project owner can read the
-- waitlist (auth.uid() check); replace the uuid below with your own user_id
-- if you want >1 admin to see it.
-- ============================================================================

BEGIN;

-- 3a. Drop the open anon insert.
DROP POLICY IF EXISTS "Allow anonymous insert to waitlist" ON public.launch_waitlist;

-- 3b. Replace the open authenticated SELECT with an owner-only policy.
DROP POLICY IF EXISTS "Allow authenticated users to view waitlist" ON public.launch_waitlist;

-- TODO before applying: replace this email with your own admin email, OR
-- swap the policy to use a role check (e.g. join to a `app_admins` table).
-- For now, hardcoding the project owner.
CREATE POLICY "Admin can view waitlist"
  ON public.launch_waitlist
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'jeramymp@gmail.com');

-- Note: RLS stays ON. With no INSERT policy in place, all anon and
-- authenticated INSERT attempts will be blocked. To re-open before launch,
-- run the SECTION 3-REOPEN block below.

COMMIT;

-- TO RE-OPEN BEFORE ADS GO LIVE (Section 3-REOPEN — copy/paste then):
-- BEGIN;
-- CREATE POLICY "Anon can insert to waitlist"
--   ON public.launch_waitlist
--   FOR INSERT
--   TO anon
--   WITH CHECK (
--     email IS NOT NULL
--     AND length(email) BETWEEN 5 AND 320
--     AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
--   );
-- COMMIT;


-- ============================================================================
-- SECTION 4 — Set explicit search_path on the 13 app functions
-- ----------------------------------------------------------------------------
-- Why: Without an explicit `search_path`, a user with CREATE on `public`
-- could shadow a function (e.g. `now()`) and trick a SECURITY DEFINER
-- function into calling the shadow. Setting `search_path = public, extensions`
-- locks resolution to known-safe schemas.
--
-- The 13 functions (queried 2026-05-18):
-- ============================================================================

BEGIN;

ALTER FUNCTION public.calculate_automated_ifta_mileage(uuid, uuid, varchar)
  SET search_path = public, extensions;

ALTER FUNCTION public.detect_breadcrumb_jurisdiction()
  SET search_path = public, extensions;

ALTER FUNCTION public.get_jurisdiction_for_point(numeric, numeric)
  SET search_path = public, extensions;

ALTER FUNCTION public.get_jurisdictions_for_points(numeric[], numeric[])
  SET search_path = public, extensions;

ALTER FUNCTION public.get_org_id_from_eld_driver(text, text)
  SET search_path = public, extensions;

ALTER FUNCTION public.get_org_id_from_eld_vehicle(text, text)
  SET search_path = public, extensions;

ALTER FUNCTION public.get_quarter_string(integer, integer)
  SET search_path = public, extensions;

ALTER FUNCTION public.increment_ifta_mileage(uuid, uuid, varchar, varchar, numeric)
  SET search_path = public, extensions;

ALTER FUNCTION public.process_jurisdiction_crossings(uuid, uuid, timestamptz, timestamptz)
  SET search_path = public, extensions;

ALTER FUNCTION public.should_send_notification(uuid, text, text)
  SET search_path = public, extensions;

ALTER FUNCTION public.update_eld_updated_at()
  SET search_path = public, extensions;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, extensions;

ALTER FUNCTION public.upsert_jurisdiction_boundary(varchar, varchar, varchar, text, text, boolean)
  SET search_path = public, extensions;

COMMIT;

-- POST-APPLY VERIFY (should return 0 rows):
--   SELECT p.proname
--   FROM pg_proc p
--   JOIN pg_namespace n ON p.pronamespace = n.oid
--   LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
--   WHERE n.nspname = 'public' AND p.prokind = 'f' AND d.objid IS NULL
--     AND (p.proconfig IS NULL OR NOT EXISTS (
--       SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
--     ));


-- ============================================================================
-- POST-APPLY: Re-run advisors and confirm
--   - ERROR count: 1 → 0   (rls_disabled_in_public on spatial_ref_sys cleared)
--   - WARN count : 68 → ~45-50
--     • extension_in_public: 1 → 0
--     • function_search_path_mutable: 13 → 0
--     • public_bucket_allows_listing: 3 → 0 (after dedupe re-evaluation)
--     • rls_policy_always_true: 1 → 0 (after launch_waitlist policy swap)
--     • anon/authenticated_security_definer_function_executable: 50 still
--       present — these are intentional RPCs; review case-by-case post-launch.
-- ============================================================================
