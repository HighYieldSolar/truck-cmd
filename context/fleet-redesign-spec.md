# Fleet UX Redesign Spec — TruckCommand

**Audience:** Claude design (separate instance) — this is a self-contained briefing.
**Goal:** Redesign the Fleet section UI/UX while preserving the existing TruckCommand visual language. Main targets: replace the legacy table layouts with denser, more scannable, more accessible tables; surface the ELD-synced data that already exists but isn't shown; tighten cross-page integration with Dispatch, IFTA, Mileage, and Compliance.
**Reference design system:** `/context/design-principles.md` (S-Tier SaaS standards inspired by Stripe, Airbnb, Linear) and the recent State Mileage Logger redesign (see §6 "Reference patterns").

---

## 1. Context — What TruckCommand Is

TruckCommand is a TMS for owner-operators and small fleets (1–12 trucks). Three product pillars: **Loads/Invoicing**, **Compliance/IFTA**, **Fleet**. Fleet is the least mature pillar (~75% per the team's self-assessment) and the most visible to daily users. Subscription tiers cap fleet size: **Basic 1 truck/1 driver, Premium 3/3, Fleet 12/12, Enterprise unlimited.** Many redesign decisions are tier-aware — see §10.

The codebase is **Next.js 15 (App Router) + Supabase + Tailwind + DaisyUI + Framer Motion + Lucide icons**. Tables today are HTML-table-based with custom row styling. Modal-driven CRUD. Real-time updates via Supabase channel subscriptions on `vehicles` and `drivers` tables.

---

## 2. What Already Exists (Don't Reinvent)

### Routes
- `/dashboard/fleet` — overview page (FleetManagementPage, 465 lines)
- `/dashboard/fleet/drivers` — drivers list (DriversPage, 982 lines)
- `/dashboard/fleet/drivers/[id]` — driver detail (DriverDetailPage, 818 lines)
- `/dashboard/fleet/trucks` — vehicles list (TrucksPage, 1008 lines)
- `/dashboard/fleet/trucks/[id]` — vehicle detail (VehicleDetailPage, 694 lines)
- `/dashboard/fleet/maintenance` — maintenance records (MaintenancePage, 1073 lines)

### Service layer
- `driverService.js` — fetchDrivers, getDriverById, createDriver, updateDriver, deleteDriver, uploadDriverImage, checkDriverDocumentStatus, getDriverStats. Auto-creates document expiry notifications (CRITICAL/HIGH/MEDIUM/NORMAL urgency by days-until-expiry).
- `truckService.js` — fetchTrucks, getTruckById, CRUD, getTruckStats. Same notification pattern for registration/insurance/inspection.
- `maintenanceService.js` — fetchMaintenanceRecords, CRUD, completeMaintenanceRecord, getMaintenanceStats, getUpcomingMaintenance, getOverdueMaintenance. Exports `MAINTENANCE_TYPES` and `MAINTENANCE_STATUSES` enums. Auto-syncs completed records with cost > 0 to expenses.
- `complianceService.js` — fetchComplianceItems, getExpiringItems, CRUD. Tracks CDL, Medical Card, Registration, Insurance, IFTA Decal, IRP, Annual Inspection.

### ELD / GPS / HOS / IFTA services (heavily wired but mostly invisible to fleet UI)
- `eldConnectionService.js` — OAuth, token refresh, connection lifecycle. Helper: `getActiveEldConnection(userId)`.
- `eldSyncService.js` (1300+ lines) — orchestrates `syncAll()`: vehicles → drivers → GPS locations → HOS logs (14d window) → IFTA mileage (current + prev quarter) → fault codes (30d) → fuel purchases.
- `eldHosService.js` — `getAllDriversHosStatus`, `getDriverHosDetails`, `getAvailableTime`, `checkHosCompliance`, `getHosDashboard`.
- `eldGpsService.js` — `getAllVehicleLocations`, `getVehicleLocationHistory`, `refreshLocations`, `getVehiclesNearLocation`, `getGpsDashboard`. Tracks `isStale` (>30 min) and `isMoving` (>5 mph).
- Providers: Motive (`gomotive.com/v1` — vehicles, drivers, GPS, HOS, IFTA, fault codes, fuel, webhooks) and Samsara. Motive is **production-hardened as of 2026-04-24 and connected to a live dummy fleet**.

### Database tables ELD writes to (verified column names, post-2026-04-24 hardening)
| Table | Key columns |
|---|---|
| `eld_connections` | provider, access_token, refresh_token, status, last_sync_at, metadata.webhook_secret |
| `eld_entity_mappings` | provider, connection_id, external_id, entity_type, internal_id |
| `eld_vehicle_locations` | `eld_vehicle_id, speed_mph, location_time, odometer` (NOT `external_vehicle_id`/`speed`/`recorded_at`) |
| `vehicle_current_locations` | latest snapshot per vehicle |
| `eld_hos_logs` | `eld_driver_id, log_date` |
| `eld_hos_daily_logs` | daily HOS summaries with violation flags |
| `driver_hos_status` | duty_status, status_started_at, location_description, latitude, longitude |
| `eld_ifta_mileage` | `miles, quarter, eld_vehicle_id` (NOT `total_miles`/`month`) |
| `eld_fault_codes` | code, description, severity, source_address_name, is_active |
| `vehicle_active_faults` | currently active faults per vehicle |
| `eld_sync_jobs` | sync audit trail |

Local rows that ELD updates:
- `vehicles.eld_external_id, last_known_location (JSON), last_location_at, odometer_miles, engine_hours`
- `drivers.eld_external_id, hos_status, hos_available_drive_minutes, hos_last_updated_at`
- `fuel_entries.source = 'eld' | 'manual', state, eld_connection_id`

### Subscription gating (canonical: `src/config/tierConfig.js` — the Fleet feature note is stale)
| Feature | Required tier | Flag |
|---|---|---|
| Fleet basics (CRUD on drivers/trucks) | Basic | — |
| Compliance tracking, IFTA, State Mileage | Premium | — |
| **ELD connection (OAuth, sync)** | **Premium+** | `eldIntegration` |
| **HOS tracking** | **Premium+** | `eldHosTracking` |
| **IFTA auto-import** | **Premium+** | `eldIftaSync` |
| **GPS map / live tracking** | **Fleet+** | `eldGpsTracking` |
| **Diagnostics / fault codes** | **Fleet+** | `eldDiagnostics` |
| Maintenance scheduling | Fleet | `maintenanceScheduling` |
| Fleet reports / CSV export | Fleet | `fleetReports`, `exportCSV` |
| SMS notifications, quiet hours | Fleet | — |

---

## 3. The Honest Gaps (What the Redesign Should Address)

### A. Data exists, UI doesn't show it
This is the single biggest opportunity. All of the following are synced hourly (or via webhooks) but are **not surfaced anywhere a fleet user looks**:

1. **Driver duty status** (driving / on-duty / off-duty / sleeper) — already in `driver_hos_status`, never rendered on driver cards or list rows.
2. **Available drive / shift / cycle time** — calculated and stored on `drivers.hos_available_drive_minutes`, never shown.
3. **Active vehicle fault codes / DTCs** — `vehicle_active_faults` is populated; no alert badge anywhere on vehicle list or detail.
4. **Live odometer + engine hours** — synced on every GPS update, not displayed.
5. **Quarterly IFTA progress per vehicle** — `eld_ifta_mileage` rolled up by jurisdiction, no widget.
6. **GPS location** — recently fixed FleetMap shows pins on the main dashboard, but the fleet page itself has no map. Vehicle detail has no map.
7. **Fuel source attribution** — `fuel_entries.source = 'eld'` is populated; no badge on entries, no reconciliation view.
8. **Driver↔load HOS gating** — at dispatch time, no "is this driver legal to take this load?" check despite the data being one join away.

### B. UX patterns the current pages get wrong
- **Stat cards above tables compete for attention** — five cards on the overview, four cards on each list page; visual noise without telling the user what to do next.
- **Tables are flat: every row looks the same.** No grouping (by status, urgency, assigned driver), no sticky header, no column resize, no row density toggle, no inline preview, no keyboard navigation.
- **Bulk-select checkboxes exist but no bulk actions are wired** — dead UI affordance.
- **Modals for everything.** Add/edit/delete/complete are all modals; no inline-edit, no drawer pattern. On mobile this is especially heavy.
- **Document status is shown as text + color but not as urgency-sorted alerts.** "Expires in 12 days" sits at row 47 of 200 alphabetically.
- **No empty-state-with-data-coaching.** "No drivers yet" — but doesn't say "your tier supports up to 1 driver, here's how to add or upgrade."
- **No skeletons matching final layout** — loading skeleton is a single pulse block that doesn't match the eventual columns.
- **Inconsistent terminology:** "Trucks" in code, "Vehicles" in UI, both interchangeably. Pick one (recommend "Vehicles" — broader, includes trailers).

### C. Feature gaps explicitly called out in the roadmap
From `06 - Research/Deep Research & Missing Features.md`:
1. **DVIR (Driver Vehicle Inspection Report)** — not implemented; common Motive feature; visible to drivers in pre-trip / post-trip flows.
2. **Driver performance scoring** — speeding events, hard braking, idling, fuel economy ranking. ELD provides events; nothing aggregates them.
3. **Driver settlements module** — pay calculations, deductions, pay periods, PDF statements. High priority for Fleet-tier customers with employee drivers.
4. **Multi-user RBAC** — Owner / Dispatcher / Accountant / Driver / View-only. The whole app currently assumes single user per account.
5. **Document upload** — driver license, medical card, registration, insurance images/PDFs. Today only the expiry date is stored.
6. **Maintenance forecasting** — engine_hours and odometer_miles are streaming in; no predictive maintenance schedules use them.

### D. Schema-level gap blocking driver self-service
- `drivers.auth_user_id` doesn't exist. The driver mobile app plan calls this *"the biggest finding"* and *"the first non-UI piece of work."* Not a redesign blocker, but worth noting because any UI element that says "driver can see this" is currently false.

---

## 4. Information Architecture — Single-Page Restructure

Collapse the existing four-route fleet section (`/fleet`, `/fleet/drivers`, `/fleet/trucks`, `/fleet/maintenance`) plus the two detail routes into **one page at `/fleet`** with tab switching and an inline drawer for detail.

### Why one page
The user's product principle is simplicity for owner-operators and small fleets. Six fleet routes with separate detail pages overcomplicates a section that gets visited many times per day. Single-page reduces navigation, keeps the user oriented, lets the drawer carry detail without a route change, and lets the morning-triage Action Queue sit at the top of *the* fleet page instead of a separate overview.

### Page structure (top-to-bottom)
```
/fleet
├── FleetHeader                           — title, subtitle, "+ Add ▾" split button
├── StatusStrip                           — 5 live count chips (driving / on duty / in motion / faults / violations)
├── ActionQueue (embedded, top 3 + view all)  — same atom as the bell-icon slide-out
├── Tabs                                  — Drivers · 32 | Vehicles · 28 | Maintenance · 5
├── FilterBar (per-tab) | SelectionBar    — selection bar swaps in when 1+ rows selected
├── FleetMap (Vehicles tab only, Fleet+)  — 320px Mapbox, hide-toggle in filter bar
├── FleetTable                            — same shell, RowComp varies per tab
├── TableFooter                           — pagination
└── FleetDrawer                           — right slide-in, only detail surface
```

### URL state
- `/fleet?tab=drivers` (default tab is drivers)
- `/fleet?tab=vehicles&status=active&row=V-118` (open vehicle V-118 drawer)
- Filters and sort persist in URL: `…&sort=name:asc&page=3&size=50`
- Old routes still resolve via redirect:
  - `/fleet/drivers` → `/fleet?tab=drivers`
  - `/fleet/trucks` → `/fleet?tab=vehicles`
  - `/fleet/maintenance` → `/fleet?tab=maintenance`
  - `/fleet/drivers/[id]` → `/fleet?tab=drivers&row=[id]`
  - `/fleet/trucks/[id]` → `/fleet?tab=vehicles&row=[id]`

### What lives where
| Element | Location |
|---|---|
| Action Queue | Embedded above the tabs (always visible). Same atom served from the bell icon slide-out for global access. |
| Driver detail (HOS card, contact, compliance, assignment, recent loads, today's HOS log) | Drawer (Drivers tab, edit-led header with breadcrumb + prev/next stepper) |
| Vehicle detail (Health card, live location mini-map, odometer/engine hours, basic info, compliance, recent maintenance/fuel, IFTA this quarter) | Drawer (Vehicles tab) |
| Maintenance detail (vehicle, type, dates, status, cost, mark-complete CTA) | Drawer (Maintenance tab) |
| Maintenance Upcoming/History split | Sub-tab strip at top of the maintenance table only |

The drawer is the only detail surface. There is no "open full page" link because there is no full page.

---

## 5. The New Table — Detailed Component Spec

The table is the centerpiece. Same architectural slot, completely new behavior. Build as a single reusable component (`FleetTable`) that drivers, vehicles, and maintenance all consume.

### 5.1 Anatomy
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Cmd-bar]  Search…    Filters ▾   Columns ▾   Density ▾   Export ▾   │  ← 48px sticky toolbar
├─────────────────────────────────────────────────────────────────────────┤
│  ☐  Name ↕     Status     License ↕   Medical ↕   Phone     ⋯  Actions│  ← sticky 36px header
├─────────────────────────────────────────────────────────────────────────┤
│  ☐  ◉ J. Doe    🟢 Active   ✓ Valid    ⚠ 12d      555-…       ⋯       │  ← 48px row (compact: 36px)
│  ☐  ◉ M. Lee    🟡 On Leave ✗ Expired  ✓ Valid    555-…       ⋯       │
│  …                                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Showing 1–25 of 187          ◀  1  2  3 … 8  ▶          25 per page ▾│  ← 40px footer
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Required behaviors
| Behavior | Spec |
|---|---|
| **Sticky header** | Header pins below the cmd-bar when scrolling. Border-bottom on scroll, no shadow. |
| **Sticky first column** | The Name column pins on horizontal scroll (mobile/tablet). |
| **Density toggle** | Three steps: comfortable (52px row), default (44px), compact (36px). Persists per-table in localStorage. |
| **Column show/hide** | Dropdown menu listing every column with checkbox. Persists in localStorage. Defaults are role-aware (see §5.4). |
| **Column resize** | Drag handle on header right edge. Min 80px, max 480px. Persists. |
| **Column reorder** | Drag column header. Persists. |
| **Sort** | Click header sorts ascending; second click descending; third click clears (default order). Multi-sort via shift-click. Up to 3 sort keys stack. |
| **Filter** | Per-column filter chip via header dropdown. Active filters render as removable chips above table. AND across columns. |
| **Search** | Global search box matches all string columns; debounced 200ms. ⌘/Ctrl-K opens search globally. |
| **Bulk select** | Header checkbox toggles current page; shift-click row selects range. Selected count appears in cmd-bar with bulk-action menu. |
| **Row click** | Opens the **inline drawer** by default. Cmd/Ctrl-click opens detail page in a new tab. Click on Name link goes to detail page directly. |
| **Row actions menu** | Triple-dot at row end. Always visible (not hover-only — failing accessibility heuristic). Menu items: View, Edit, Duplicate (where applicable), Archive, Delete. |
| **Inline status edit** | Click status badge → menu → change in place. Optimistic update with undo toast. |
| **Empty state** | Centered icon + headline ("No drivers yet" / "No drivers match your filters") + helper text + primary CTA. If filters are active, show "Clear filters" link. |
| **Loading state** | Skeleton matches final column layout. Header is real; rows are pulse-animated. 8 rows by default. |
| **Error state** | Inline banner above table with reload button. Table dims but stays mounted so partial state is visible. |
| **Pagination** | Server-driven via existing service layer. Page-size options: 25 (default) / 50 / 100. URL-synced (`?page=3&size=50&sort=name:asc`). |
| **Saved views** | Fleet+ tier — name + save current filter/sort/columns combo. Quick-switch in cmd-bar. |
| **Keyboard navigation** | Arrow keys move active row, Enter opens drawer, Space toggles selection, Esc closes drawer, `/` focuses search. Show shortcuts modal on `?`. |

### 5.3 Cell types (use across tables)
- **Identity cell**: avatar/icon + primary text + secondary text (e.g., name + position OR vehicle name + plate).
- **Status pill**: filled circle dot + label. Colors are semantic: emerald (active/valid), amber (warning/on-leave/expiring), rose (inactive/expired/critical), slate (idle/draft).
- **Days chip**: ✓ / ⚠ Nd / ✗ Expired. Tooltip shows exact expiry date + days delta.
- **HOS chip** (drivers): icon + duty status + remaining time. e.g., `🚛 Driving · 4h 12m left`. Pulsing emerald dot if currently driving (matches recent State Mileage Logger pattern).
- **Health chip** (vehicles): green ✓ if no active faults; amber `⚠ 2 warnings`; rose `✗ 1 critical` for active faults from `vehicle_active_faults`.
- **Location-age chip** (vehicles): `Now`, `2m ago`, `1h ago`, `Stale (3d)` — colored by staleness threshold (live <5m green, recent <30m slate, stale >30m amber, lost >24h rose).
- **Currency cell**: right-aligned, mono font, dollar sign, two decimals.
- **Date cell**: "Apr 24, 2026" with relative tooltip ("3 days ago"). Use ISO-aware Date utilities, not raw strings.
- **Empty value**: render `—` (em dash, slate-400), not blank.

### 5.4 Per-table column defaults

#### Drivers table
| Column | Default | Source | Notes |
|---|---|---|---|
| Checkbox | always | client | bulk select |
| Name | always | `drivers.name` + `position` | identity cell w/ avatar from `image_url` |
| **HOS status** | **NEW** | `drivers.hos_status` + `hos_available_drive_minutes` | pulsing dot if driving, hidden for non-ELD users |
| Status | always | `drivers.status` | Active/Inactive/On Leave |
| License | default | `license_expiry` + `checkDriverDocumentStatus` | days chip |
| Medical | default | `medical_card_expiry` | days chip |
| Phone | optional | `phone` | tel: link |
| Email | optional | `email` | mailto: link |
| Hire date | optional | `hire_date` | date cell |
| **Current load** | **NEW** | `loads WHERE assigned_driver_id = … AND status IN ('On-Trip', 'Available')` | links to load |
| **Vehicle** | **NEW** | join `vehicles WHERE assigned_driver_id = …` | links to vehicle detail |
| Actions | always | client | triple-dot |

#### Vehicles table
| Column | Default | Source | Notes |
|---|---|---|---|
| Checkbox | always | client | |
| Name | always | `vehicles.name` | identity cell w/ avatar from `image_url` or default truck icon |
| Make/Model/Year | default | `make` + `model` + `year` | combined cell, two lines |
| Status | always | `vehicles.status` | Active/In Maintenance/Out of Service/Idle |
| **Health** | **NEW** | `vehicle_active_faults` count by severity | green/amber/rose chip |
| **Location** | **NEW** | `vehicles.last_known_location.address` + `last_location_at` | text + age chip |
| **Odometer** | **NEW** | `vehicles.odometer_miles` | number cell with mi unit |
| Driver | default | `assigned_driver_id` join | links to driver detail |
| License plate | default | `license_plate` | mono font |
| VIN | optional | `vin` | mono font, copy-on-click |
| Reg expires | optional | `registration_expiry` | days chip |
| Insurance | optional | `insurance_expiry` | days chip |
| Next maintenance | default | min(`maintenance_records.due_date` WHERE status != 'Completed') | days chip |
| Actions | always | client | |

#### Maintenance table (Upcoming tab)
| Column | Default | Source | Notes |
|---|---|---|---|
| Checkbox | always | client | |
| Vehicle | always | `vehicles.name` via `truck_id` | identity cell |
| Type | always | `maintenance_type` | enum from MAINTENANCE_TYPES |
| Due | always | `due_date` | days chip; row tinted rose if overdue |
| Status | always | `status` | enum from MAINTENANCE_STATUSES |
| Provider | optional | `service_provider` | text |
| **Odometer at due** | **NEW** | computed: `vehicles.odometer_miles` vs prior service | hint cell, "+8,400 mi since last" |
| Cost (est) | optional | `cost` if filled | currency |
| Actions | always | client | includes Mark Complete inline action |

#### Maintenance table (History tab)
Replace Due column with Completed date, add Cost (actual), add Synced-to-expense indicator (✓ icon if `expense_id IS NOT NULL`).

### 5.5 Inline drawer (right slide-in)
- Width: 480px desktop, 100% mobile.
- Animation: 220ms ease-out, scrim 0 → 0.4 opacity.
- Trap focus, Esc closes, scrim click closes.
- Tabs at top match the form modal tabs (Basic / License / etc.) but read-only by default with an Edit toggle that flips inputs to editable. Save/Cancel pinned at bottom.
- Header: avatar + name + status + "Open full page" link top-right.
- Driver drawer adds a live HOS card and "Recent loads (5)" mini-list — these come from existing services, just wire them through.
- Vehicle drawer adds a Health card (active faults summary) and "Recent locations (10)" with age.

---

## 6. Reference Patterns to Reuse

These are already in production and define the visual language to extend, not deviate from.

### 6.1 State Mileage Logger redesign (commit `922671b`, 2026-04-24)
The most recent design reference — small-fleet operator UI done right.
- **No gradient overload.** Trip cards are flat with a single colored accent (pulsing emerald dot) for status.
- **Demoted secondary actions.** "+ New Trip" is a small ghost button, not a hero.
- **Vertical timeline for state crossings.** Connected rail line, color-coded dots, "X mi in previous state" annotations between dots.
- **Status pill + 3-stat strip.** `Active · 412 mi · 3 states · in TX`. Replace any "stat card row" temptation with this single dense strip.
- **Tabular bars for breakdown.** Mileage by state uses cleaner tabular bars, not separate cards.
- **Off-ELD amber badge.** Trips marked `is_off_eld` get an amber chip so dispatcher can audit. Same chip pattern applies to manual fuel entries vs ELD-sourced ones.

### 6.2 Auto-flow over import buttons (rule from same session)
> *"When downstream data flows automatically, prominent 'sync'/'import' buttons clutter the UI and create duplicate rows. Demote to passive info text + small secondary action."*

**Apply to fleet redesign:**
- "Sync from ELD" should be a footer link, not a header CTA, on driver and vehicle pages.
- Show last-sync time and an optional "Refresh now" link instead of a primary button.
- Drivers/vehicles auto-created from ELD should display a small "Synced from Motive" chip so users understand provenance.

### 6.3 Tier upgrade affordances
Where a feature is gated (GPS map, fault codes, fleet reports), render the actual UI region with:
- Faded preview (50% opacity) of representative content.
- Centered overlay card: lock icon + headline + 2-line value prop + "Upgrade to Fleet" button.
- Don't hide the feature entirely — discoverability is part of conversion.

### 6.4 Notification urgency colors
Match `notificationService` urgency levels exactly so cross-page consistency holds:
- **CRITICAL** — rose-600 (already expired, active critical fault, HOS violation today)
- **HIGH** — amber-600 (≤7 days, warning fault)
- **MEDIUM** — yellow-500 (≤14 days)
- **NORMAL** — slate-500 (≤30 days, info)
- **LOW** — slate-400 (informational, completed)

---

## 7. Command Bar — Single Filter/Sort/Action Surface

The current page has a row of dropdowns + a search box + a refresh button + an export dropdown spread across the top. Consolidate into one **Command Bar** component, height 48px, sticky:

```
[ Search drivers… ]   [ Filters · 2 ]   [ Columns ]   [ Density ]   [ ⋯ More ]
                                         active filters as chips below ↓
[ Status: Active × ]  [ License: Expiring × ]                    Clear all
```

- **Search** — left, 320px wide, with leading icon and ⌘K hint.
- **Filters** — opens a popover with grouped filter controls (multi-select status, document status, hire-date range, etc.). Counter pill shows active filter count.
- **Columns** — checklist popover.
- **Density** — three-icon segmented control.
- **More** — dropdown for Export, Refresh, Saved views (Fleet+).
- **Selection mode** — when 1+ rows selected, the cmd-bar swaps to: `[ 3 selected ] [ Edit ▾ ] [ Export ] [ Archive ] [ Delete ] [ Cancel ]`. Don't add a separate bulk-action toolbar.

---

## 8. New Components to Build

### 8.1 `<HosStatusBadge driverId />`
Reads `driver_hos_status` (or accepts the row directly).
- Dot + label + remaining time. Pulsing dot if `duty_status = 'driving'`.
- Tooltip: full breakdown (drive / on-duty / cycle remaining), location, last update age.
- "Not connected" gray state when driver has no `eld_external_id`.

### 8.2 `<VehicleHealthBadge vehicleId />`
Reads `vehicle_active_faults`.
- 0 active → green ✓ "Healthy".
- Else → highest severity color + count: `⚠ 2 warnings`, `✗ 1 critical`.
- Tooltip: list top 3 faults with code + description.

### 8.3 `<LocationCell vehicleId />`
Reads `vehicles.last_known_location` and `last_location_at`.
- Address (truncated, full in tooltip) + age chip.
- Click expands to a 200×200 inline mini-map (Mapbox or Google Maps Static API).

### 8.4 `<DocStatusChip date type />`
Generic days-until-expiry chip used everywhere documents expire.
- Inputs: `date`, `type` (license / medical / registration / insurance / inspection).
- Computes urgency from days delta + matches notification urgency colors.

### 8.5 `<FleetMap vehicles />`
Promote `FleetStatusWidget` into a full component used on `/fleet` and on `/fleet/trucks/[id]`.
- Mapbox or Google Maps with clustered pins.
- Pin color matches vehicle status. Pin shape encodes movement (arrow if moving with heading, dot if stopped).
- Hover card: vehicle name + driver + speed + last update + active faults count.
- Click pin: scrolls/highlights matching row in the table below (or opens drawer).
- Auto-refresh every 60s (poll); upgrade to Supabase Realtime on `eld_vehicle_locations` post-redesign.

### 8.6 `<ActionQueue />`
The new fleet overview hero. Single ranked feed of items needing attention.
- Each item: severity icon + one-line summary + relative time + dismiss/snooze button + primary action button.
- Sources: expiring docs, overdue maintenance, HOS violations, active critical faults, stale vehicles.
- Empty state: ✅ "All clear — no fleet actions needed today."
- Snoozed items go to a collapsed "Snoozed (3)" footer.

### 8.7 `<IftaProgressStrip />` (Fleet overview only)
Horizontal strip showing current quarter:
- Total miles this quarter (large number)
- Top 5 jurisdictions as inline bars with state code + miles
- "Compare to last quarter" toggle showing delta arrows
- Click → `/dashboard/ifta` deep-linked to current quarter

### 8.8 `<DispatchHosCheck driverId loadId />` (used on Dispatch page, cross-page)
Inline component shown when assigning a driver to a load.
- Calls `getAvailableTime(userId)` for the driver.
- Shows: ✓ "8h 14m available — eligible" OR ⚠ "1h 02m left, may need split rest" OR ✗ "0 hours — driver not eligible".
- Doesn't block assignment; warns user. This is the single highest-leverage cross-page integration.

---

## 9. Cross-Page Integration Map

| From | New surface | To | What it does |
|---|---|---|---|
| Main dashboard | Action queue (mini, top 5) | `/fleet` | Click item → fleet overview with that item highlighted |
| Main dashboard | Live driver count chip | `/fleet/drivers?duty=driving` | filter pre-applied |
| **Dispatch / load create** | `<DispatchHosCheck>` next to driver dropdown | inline | warns on illegal assignment |
| **Dispatch / load detail** | "Assigned driver HOS" card | inline | live status, available time, last 7d compliance |
| **IFTA** | "By vehicle" tab | `/fleet/trucks/[id]?tab=ifta` | drill into per-vehicle quarterly miles |
| **State Mileage** | "View vehicle" link on each trip | `/fleet/trucks/[id]?tab=trips` | trip history per vehicle |
| **Compliance** | Document row click | `/fleet/drivers/[id]` or `/fleet/trucks/[id]` | unify document tracking with entity detail |
| **Expenses** | Maintenance-sourced expense row | `/fleet/maintenance/[id]` | bidirectional (maintenance already links to expense) |
| **Fuel** | Vehicle filter on entries list | `/fleet/trucks/[id]?tab=fuel` | already partial — just deep-link |
| **Notifications** | All entity links open the **drawer**, not a new page | drawer | preserves user context |

---

## 10. Tier Gating in the UI

Bake gating into the design system, don't hand-code per-feature.

- Use a `<TierGate feature="eldGpsTracking" minTier="Fleet">` wrapper component.
- When access denied: render the upgrade affordance (see §6.3) inline rather than hiding.
- Driver/vehicle list rows: HOS chip and Health chip are hidden for tiers below Premium / Fleet respectively. Don't grey them out — that suggests "loading" or "no data".
- Map: full preview blurred to 8px with overlay for Premium users; full live for Fleet+.
- Maintenance scheduling and Fleet Reports: same gated-preview pattern.
- Resource limit affordances: when at max trucks/drivers (`canAccess` returns limit-reached), add-button shows "1 of 1 used — upgrade for more" with tier-target CTA. Already partially implemented; standardize.

---

## 11. Accessibility Requirements (WCAG 2.1 AA)

- Color contrast: minimum 4.5:1 for body text, 3:1 for large text and UI elements. Status pills must pass against both light and dark mode backgrounds.
- All status meaning encoded redundantly (color + icon + text). Color-blind users should never need to infer status from color alone.
- Keyboard navigation: tab order matches visual order; all interactive elements reachable; focus rings always visible (no `outline: none` without replacement). Custom focus ring: 2px solid emerald-500 with 2px offset.
- Tables: proper `<th scope="col">`, `aria-sort`, row count via `aria-rowcount` and `aria-rowindex` on virtualized rows.
- Modals/drawers: trap focus, restore on close, `aria-modal="true"`, escape closes, scrim has `aria-hidden="true"`.
- Live regions: action queue and notifications use `aria-live="polite"` for new items; HOS violations use `aria-live="assertive"`.
- Form fields: associated labels (no `placeholder`-as-label), error messages linked via `aria-describedby`, required fields marked semantically not just visually.
- Touch targets: minimum 44×44 CSS pixels for any tap target on touch devices.
- Reduced motion: respect `prefers-reduced-motion` — disable pulse animations, slide-in transitions, map auto-rotation.

---

## 12. Responsive Breakpoints

Three breakpoints match existing project conventions:
- Mobile: 375–767px
- Tablet: 768–1279px
- Desktop: 1280px+

### Behavior at each breakpoint
| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Fleet overview | Single column, action queue first, map collapsible | Two columns: queue + map stacked, summary cards below | Three-zone layout as specced |
| Tables | Card list (one card per row, columns become labeled rows inside card) | Horizontal scroll with sticky first column | Full table, all default columns visible |
| Drawer | Full screen modal | 80% width slide | 480px slide |
| Cmd bar | Search full-width, filters in bottom sheet | Search + filters inline, columns in overflow | All controls inline |
| Map | Hidden by default, "Show map" toggle | 240px tall | 480px tall |
| Stat strip | 2-row wrap | Single row | Single row |

---

## 13. Implementation Phasing (Recommended)

The redesign is large. Sequence work so the user feels improvement on day 1:

**Phase 1 — Table foundation (1–2 weeks)**
- Build `FleetTable` reusable component with all behaviors from §5.2.
- Migrate Drivers, Vehicles, Maintenance lists onto it.
- Build `<HosStatusBadge>`, `<VehicleHealthBadge>`, `<DocStatusChip>`, `<LocationCell>`.
- Wire up command bar.
- Ship behind a feature flag `fleetUiV2` — Fleet-tier accounts opt in first.

**Phase 2 — Overview redesign (1 week)**
- Build `<ActionQueue>`, `<FleetMap>` (promote from dashboard widget), `<IftaProgressStrip>`.
- Replace FleetManagementPage layout.

**Phase 3 — Detail pages (1 week)**
- Add HOS card to driver detail.
- Add Health card + GPS history to vehicle detail.
- Build inline drawer (replaces modal as default).

**Phase 4 — Cross-page integrations (1 week)**
- `<DispatchHosCheck>` in load assignment flow.
- Compliance page deep-links into fleet.
- Notification entity-clicks open drawer.

**Phase 5 — Polish (ongoing)**
- Saved views (Fleet+).
- Bulk actions wiring.
- Real-time Supabase subscriptions replacing 60s map polling.
- Mobile card-mode tables.

---

## 14. Out of Scope for This Redesign

These came up in the audit but are bigger than UI:

- **DVIR module** — separate feature, requires schema work + driver mobile app integration. Track separately.
- **Driver settlements** — a full module, not a UI tweak.
- **Multi-user RBAC** — touches every page, not just fleet.
- **Document upload + storage** for license/medical card images — needs storage policy + RLS work; can be bolted on after the redesign with a single new tab in driver/vehicle drawers.
- **`drivers.auth_user_id`** schema migration — required for the driver mobile app, not for this redesign.
- **New ELD providers** (Geotab, ISAAC, J.J. Keller) — not UI.
- **Driver performance scoring** — needs aggregation pipeline first; reserve a slot in the driver detail page for it (right rail, "Performance" card placeholder).

---

## 15. Confirmed Decisions

1. **Architecture:** Single fleet page at `/fleet`. Tabs for Drivers / Vehicles / Maintenance. Drawer is the only detail surface. Old routes redirect to `/fleet?tab=…&row=…`.
2. **Visual system:** FK\* atoms from the user's "Drivers redesign" HTML reference. The drawer is edit-led with breadcrumb + prev/next stepper; no "Open full page" link (because there is no full page).
3. **Density:** Comfortable 44px / Compact 36px. Toggle in filter bar.
4. **Days-chip thresholds:** `<0` red · `0–7` rose · `8–30` amber · `>30` slate. Tabular-numeric throughout.
5. **Map provider:** Mapbox. FleetMap appears within the Vehicles tab (320px tall) for Fleet tier+, gated preview for lower tiers.
6. **Terminology:** "Vehicles" in copy. Routes stay `/fleet/trucks` for redirect compatibility.
7. **Modal vs drawer:** Drawer for view + edit. Modal for "Add new" only.
8. **Saved views:** Fleet tier+.
9. **Tier limits:** Match `tierConfig.js` (Basic 1/1, Premium 3/3, Fleet 12/12, Enterprise unlimited). Stale `Fleet Management.md` Obsidian note to be updated to match.
10. **Action queue snooze duration:** 24h fixed for v1.

---

## 16. Files Claude Code Will Touch (Reference)

### Single-page restructure
The four legacy fleet routes consolidate into one. Old routes redirect; their components are replaced by tab/drawer state on the new single page.

**New canonical route**
- `src/app/(dashboard)/dashboard/fleet/page.js` — rewritten as the single fleet page. Reads `?tab=`, `?row=`, filter/sort params from URL.

**Routes that become redirects**
- `src/app/(dashboard)/dashboard/fleet/drivers/page.js` → `redirect('/dashboard/fleet?tab=drivers')`
- `src/app/(dashboard)/dashboard/fleet/drivers/[id]/page.js` → `redirect('/dashboard/fleet?tab=drivers&row=[id]')`
- `src/app/(dashboard)/dashboard/fleet/trucks/page.js` → `redirect('/dashboard/fleet?tab=vehicles')`
- `src/app/(dashboard)/dashboard/fleet/trucks/[id]/page.js` → `redirect('/dashboard/fleet?tab=vehicles&row=[id]')`
- `src/app/(dashboard)/dashboard/fleet/maintenance/page.js` → `redirect('/dashboard/fleet?tab=maintenance')`

**Components retired** (data/logic salvaged into new tab views; old files deleted)
- `src/components/fleet/FleetManagementPage.js` (overview content lifts into the new page header + status strip + Action Queue)
- `src/components/fleet/DriversPage.js` (becomes `<DriversTab />`)
- `src/components/fleet/TrucksPage.js` (becomes `<VehiclesTab />`)
- `src/components/fleet/MaintenancePage.js` (becomes `<MaintenanceTab />`)
- `src/components/fleet/DriverDetailPage.js` (sections lift into `<FleetDrawer mode="driver">`)
- `src/components/fleet/VehicleDetailPage.js` (sections lift into `<FleetDrawer mode="vehicle">`)
- `src/components/fleet/FleetSidebarWidget.js` (replaced by Action Queue)
- `src/components/fleet/FleetStatsComponent.js` (replaced by Status Strip)
- `src/components/fleet/VehicleListComponent.js`, `DriverListComponent.js` (replaced by table tabs)

### New components (`src/components/fleet/`)

Build the FK\* atom set from the user's HTML reference, mapped to project filenames:

**Atoms / shared**
- `FleetShell.jsx` — wraps the fleet page (uses existing DashboardLayout sidebar; this is the inner shell)
- `FleetHeader.jsx` (`FKFleetHeader`) — title + subtitle + "+ Add ▾" split button
- `StatusStrip.jsx` — 5 live count chips
- `FilterBar.jsx` (`FKFilterBar`) — per-tab filters + density toggle + columns menu
- `SelectionBar.jsx` (`FKSelectionBar`) — swaps in when rows selected
- `FleetTable.jsx` (`FKTable`) — sticky shell, accepts `RowComp` per tab
- `FleetTableFooter.jsx` (`FKTableFooter`)
- `FleetDrawer.jsx` (`FKDrawer`) — edit-led, breadcrumb + prev/next stepper. Three internal modes: `driver`, `vehicle`, `maintenance`
- `FleetEmptyState.jsx` (`FKEmptyState`) — empty / no-results variants
- `FleetSkeletonTable.jsx` (`FKSkeletonTable`)
- `ActionQueue.jsx` (`FKActionQueue`) — used embedded on /fleet AND inside the global bell-icon slide-out
- `MobileFleetCard.jsx` (`FKMobileCard`)

**Cells / chips**
- `StatusPill.jsx` (`FKStatusPill`)
- `HosChip.jsx` (`FKHosChip`)
- `DaysChip.jsx` (`FKDaysChip`)
- `HealthChip.jsx`
- `LocationCell.jsx`
- `Avatar.jsx` (`FKAvatar`)
- `Btn.jsx` (`FKBtn`)
- `Icon.jsx` (`FKIcon`)

**Tab content components**
- `DriversTab.jsx` — RowComp for drivers + columns
- `VehiclesTab.jsx` — RowComp for vehicles + FleetMap slot + columns
- `MaintenanceTab.jsx` — Upcoming/History sub-tabs + RowComp for maintenance + columns
- `FleetMap.jsx` (Vehicles tab only)
- `IftaProgressStrip.jsx` (vehicle drawer "IFTA this quarter" section)

**Cross-cutting**
- `TierGate.jsx`

### Cross-page additions
- `src/components/dispatching/DispatchHosCheck.jsx` — inline HOS eligibility check next to driver dropdown on load assignment
- `src/components/notifications/NotificationItem.jsx` (existing) — update deep links to `/fleet?tab=…&row=…`
- `src/components/dashboard/(dashboard)/FleetStatusWidget.js` — refactored to use the shared `FleetMap` component

### Hooks
- `useFleetUrlState.js` — read/write `?tab=`, `?row=`, filters, sort, page from URL
- `useFleetTable.js` — density / column visibility / column order persistence (localStorage)
- `useDriverHos.js` — wraps `getAllDriversHosStatus` with TanStack Query
- `useVehicleHealth.js` — wraps `vehicle_active_faults` query
- `useFleetMap.js` — wraps `getAllVehicleLocations` with 60s refresh + Realtime subscription
- `useActionQueue.js` — joins document expiries + maintenance + HOS violations + faults + stale vehicles into a single ranked list

### Service work
None net-new. All data already exposed by:
- `eldHosService.js`, `eldGpsService.js`, `eldSyncService.js`
- `driverService.js`, `truckService.js`, `maintenanceService.js`, `complianceService.js`
- `loadService.js` for HOS-vs-load joins
- `notificationService.js` for queue source aggregation

---

## 17. Success Criteria

The redesign is done when a Fleet-tier user can answer all of these in <5 seconds without leaving the fleet pages:

1. Which of my drivers are driving right now?
2. Which of my drivers will run out of HOS hours in the next 2 hours?
3. Which of my vehicles have an active critical fault?
4. Which documents expire in the next 7 days?
5. Which vehicle is closest to the next maintenance interval?
6. How many miles have I run in CA this quarter?
7. Is driver X eligible for a load picking up in 4 hours?

Each of these requires zero new backend work — it's all already there. The whole spec is about closing the UI gap.

---

*End of spec.*
