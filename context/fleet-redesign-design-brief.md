# Fleet UX Redesign — Design Brief

**For:** Web-based design tool (visual/UX design phase only)
**Product:** TruckCommand — TMS for owner-operators and small fleets (1–12 trucks)
**Scope:** Redesign the Fleet section. Six pages. Keep the existing visual language; modernize the table layouts; surface live data that exists but isn't being shown today.

This brief is purely for visual/UX design. It describes what to draw, how it should behave, what data appears in each cell, and the states to cover. It does not describe how to wire it up.

---

## 1. Product context (read first)

TruckCommand helps owner-operators and small-fleet owners run their trucking business: dispatch loads, generate invoices, track expenses, file IFTA, monitor driver/vehicle compliance, and connect to ELDs (Motive, Samsara) for live HOS, GPS, fault codes, and IFTA mileage.

The Fleet section is where users manage their drivers, vehicles, and maintenance schedules. It's the most-visited section after the main dashboard. Today it's mostly CRUD lists with modal forms — functional but flat. The redesign keeps the same routes and same brand, but rebuilds the table experience and surfaces ELD-sourced data (HOS status, live location, fault codes, etc.) that the backend already pulls hourly but the UI never shows.

**The core insight that should drive every design decision:** users open the fleet page to know *what needs their attention today.* They don't open it to read a long alphabetical list of drivers. The redesign should surface action over inventory.

---

## 2. Visual language (don't reinvent)

- **Brand feel:** practical, dense, scannable. Stripe / Linear / Notion energy, not Salesforce.
- **Type:** Inter (or system fonts). Numbers in tabular figures inside tables.
- **Color:** Tailwind palette. Neutrals are slate. Accents are emerald (success/active), amber (warning/manual flag), rose (critical/expired), yellow (medium urgency).
- **Status pulse:** active/driving statuses get a pulsing emerald dot. (Reference: the State Mileage Logger redesign — flat cards with a single pulsing dot beat heavily-styled gradient cards every time.)
- **Off-ELD / manual marker:** amber chip. Anything not auto-synced from an ELD provider (manual trip, manual fuel entry, manually-added vehicle) gets this small amber chip so the user can audit data provenance.
- **Icons:** Lucide React. Clean line icons, no filled.
- **Gradients:** sparingly. The hero header on each page can have a subtle slate gradient. Cards are flat.
- **Dark mode:** required. All status colors must read on both light and dark backgrounds.
- **Density:** lean toward dense. 16px base body, 14px in tables, 13px in chip labels. Do not pad the tables out — fleet operators want more rows visible.

---

## 3. Information architecture

**One fleet page.** Everything lives at `/fleet` — drivers, vehicles, maintenance, and the action queue all coexist on a single screen with tab switching. No separate overview page, no separate detail routes.

```
/fleet
├── Page header (title + subtitle + "+ Add ▾" split button)
├── Status strip (5 count chips: driving · on duty · in motion · faults · violations)
├── Action Queue (embedded, collapsible — same FKActionQueue atom as the bell-icon slide-out)
├── Tabs: [ Drivers · 32 ] [ Vehicles · 28 ] [ Maintenance · 5 ]
├── Filter bar (per-tab)
├── Table (per-tab — drivers / vehicles / maintenance)
├── Footer (pagination)
└── Drawer (slide-in detail when a row is clicked — the only detail surface)
```

URL state: `/fleet?tab=vehicles&status=active&row=V-118`. Notification deep links and cross-page links target this pattern.

**Why one page, not six?** The existing app sells itself on simplicity. Six pages with separate routes for drivers/vehicles/maintenance + their detail routes overcomplicates a section that an owner-operator visits 20 times a day. A tab-switched single page lets them stay oriented; the drawer collapses every "detail page" into an inline preview that's faster than a navigation. The user's existing pages already use this top-header-then-data shape — the redesign extends that pattern, not breaks it.

Wherever the current UI uses "Trucks" in copy or labels, change to "Vehicles." (Trailers exist; the broader term is more accurate.) Routes stay the same to preserve links — `/fleet/drivers`, `/fleet/trucks`, etc. still resolve, but redirect to `/fleet?tab=…` and the matching drawer.

---

## 4. The new table — the centerpiece

This is the biggest redesign target. Every list page (Drivers / Vehicles / Maintenance) uses the same table component with different columns. Design it once.

### 4.1 Anatomy

```
┌────────────────────────────────────────────────────────────────────────┐
│  [page header — title, subtitle, primary CTA "Add Driver"]            │  hero
├────────────────────────────────────────────────────────────────────────┤
│  [Total: 12]  [Issues: 3]                                              │  stat strip (2 chips, not 4 cards)
├────────────────────────────────────────────────────────────────────────┤
│  🔍 Search…    [Filters · 2]  [Columns]  [Density]  [⋯ More]          │  command bar (sticky)
│  [Status: Active ×] [License: Expiring ×]                Clear all     │  active filter chips
├────────────────────────────────────────────────────────────────────────┤
│  ☐  Name ↕    HOS         Status   License   Medical   Phone     ⋯    │  table header (sticky)
├────────────────────────────────────────────────────────────────────────┤
│  ☐ ◉ J. Doe   🟢 Driving  Active   ✓ Valid   ⚠ 12d    555-…       ⋯   │  rows
│  ☐ ◉ M. Lee   ⏸ Off duty  On Leave ✗ Expired ✓ Valid  555-…       ⋯   │
│  …                                                                     │
├────────────────────────────────────────────────────────────────────────┤
│  Showing 1–25 of 187    ◀ 1 2 3 … 8 ▶            25 per page ▾        │  footer
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Behaviors to design

- **Sticky elements:** command bar pins to top of viewport. Table header pins below it. First column pins on horizontal scroll.
- **Density toggle:** three icon buttons in command bar — comfortable (52px row) / default (44px) / compact (36px).
- **Column show/hide:** dropdown menu listing every column with a checkbox.
- **Column resize:** drag the right edge of a header cell. Show a visible drag handle on hover.
- **Column reorder:** drag the column header itself.
- **Sort:** click header to toggle asc → desc → none. Indicator arrow to right of label. Multi-sort state when 2+ columns sort (show small index numbers).
- **Filter:** a filter button per applicable column appears in the header dropdown. Active filters appear as removable chips above the header row.
- **Search:** global search box in command bar with `⌘K` hint. Matches all string columns.
- **Bulk select:** header checkbox = select all on page. Shift-click row = range select. When 1+ rows selected, command bar swaps to a selection toolbar:
  ```
  [3 selected]  [Edit ▾]  [Export]  [Archive]  [Delete]    [Cancel]
  ```
- **Row click:** opens the **drawer** (see §5). Click on the Name link goes to the detail page. Cmd/Ctrl-click opens detail page in a new tab.
- **Triple-dot menu:** always visible on every row at the right edge — never hover-only. Menu: View · Edit · Duplicate · Archive · Delete.
- **Inline status edit:** click the Status pill to get a small dropdown menu. Optimistic update with an undo toast.
- **Empty state:** centered icon + headline + helper sentence + primary CTA. Two variants: no data ("No drivers yet — add your first driver to get started") and no matches ("No drivers match these filters") with a Clear filters link.
- **Loading state:** skeleton matches the final layout — real header, 8 pulse-animated rows. Not a single pulse block.
- **Error state:** inline banner above the table with a Reload button. Table dims but stays mounted.
- **Pagination:** 25 (default) / 50 / 100. Page state persists in the URL (`?page=3&size=50&sort=name:asc`).

### 4.3 Cell types (build a kit, reuse everywhere)

| Cell | Anatomy | Use |
|---|---|---|
| **Identity** | small avatar (or icon if no image) + primary text + faint secondary text | Driver: name + position. Vehicle: name + plate. |
| **Status pill** | filled colored dot + label, all in one rounded pill | Active / Inactive / On Leave / etc. |
| **Days chip** | icon (✓ / ⚠ / ✗) + "valid" or "12d" or "Expired", colored by urgency | Document expiries. Tooltip on hover shows exact date. |
| **HOS chip** | icon + duty status + remaining time, e.g. `🚛 Driving · 4h 12m left`. Pulsing emerald dot when driving. | Driver rows. Hidden if user's tier doesn't include ELD. |
| **Health chip** | green ✓ "Healthy" / amber `⚠ 2 warnings` / rose `✗ 1 critical` | Vehicle rows. Tooltip lists top 3 fault codes. |
| **Location-age chip** | text ("Now" / "2m ago" / "1h ago" / "Stale 3d") colored by recency | Vehicle rows. Live <5m green, <30m slate, >30m amber, >24h rose. |
| **Currency** | right-aligned, mono digits, 2 decimals, `$` prefix | Cost / rate. |
| **Date** | formatted as "Apr 24, 2026" with relative tooltip ("3 days ago") | Hire date, completed date. |
| **Empty value** | em dash `—` in slate-400 | Anywhere data is missing. Never blank. |

### 4.4 Columns by table

**Drivers** — Checkbox, **Name** (identity), **HOS** (NEW — chip), **Status** (pill), **License** (days chip), **Medical** (days chip), Phone, Email, Hire date, **Current load** (NEW — link), **Vehicle** (NEW — link to assigned vehicle), Actions (triple-dot).

Default-shown: Checkbox, Name, HOS, Status, License, Medical, Vehicle, Actions. Others available via Columns menu.

**Vehicles** — Checkbox, **Name** (identity with truck icon), **Make/Model/Year** (two-line), **Status** (pill), **Health** (NEW — chip), **Location** (NEW — text + age chip), **Odometer** (NEW — number + "mi"), **Driver** (assigned, link), License plate (mono), VIN (mono, copy-on-click), **Reg expires** (days chip), **Insurance** (days chip), **Next maintenance** (days chip), Actions.

Default-shown: Checkbox, Name, Status, Health, Location, Driver, Next maintenance, Actions.

**Maintenance — Upcoming tab** — Checkbox, **Vehicle** (identity), **Type** (text), **Due** (days chip; row tinted rose if overdue), **Status** (pill), Provider, **Odometer at due** (NEW — "+8,400 mi since last"), Cost (est), Actions (includes inline "Mark Complete").

**Maintenance — History tab** — Same as Upcoming but Due column → Completed date, Cost (actual), and a small ✓ icon column showing "synced to expense."

### 4.5 Mobile / tablet behavior

- **Mobile (< 768px):** the table becomes a **card list**. Each card is one row's data, columns become labeled rows inside the card. Primary text (Name, Status, key chip) is large; secondary fields fold into an expandable section. The triple-dot menu becomes a swipe-action or a button at the bottom of the card.
- **Tablet (768–1279px):** horizontal scroll table with sticky first column. Some columns hidden by default.
- **Desktop (≥ 1280px):** full table, all default columns visible.

---

## 5. The drawer (right slide-in)

This replaces the current "open a modal to view a driver" pattern. Designed to make scrubbing through records feel fast.

- **Width:** 480px on desktop. 100% on mobile. 80% on tablet.
- **Animation:** slides in from the right in 220ms ease-out. Scrim fades 0 → 0.4 opacity behind it.
- **Trigger:** clicking a row (anywhere except the Name link or triple-dot).
- **Behavior:** clicking another row updates the drawer in place (no close-then-open). Esc closes. Scrim click closes. Focus trapped inside.
- **Header:** avatar + name + primary status pill + "Open full page →" link top-right + close × .
- **Tabs:** match the eventual form tabs (e.g. for driver: Basic / Contact / License). Read-only by default. An Edit toggle in the top-right of the body flips inputs to editable. Save / Cancel pinned at bottom.
- **Footer (when editing):** sticky Save/Cancel pair.
- **Body content (driver drawer):**
  - Live HOS card (current duty status + remaining time + last update age)
  - Identity: name, position, hire date, status
  - License: number, state, expiry (with days chip)
  - Medical: expiry (with days chip)
  - Recent loads (last 5, mini list with date + origin → destination + status)
  - Assigned vehicle (with link)
- **Body content (vehicle drawer):**
  - Live Health card (active faults summary, count by severity)
  - Identity: name, make, model, year, color, fuel type
  - Compliance: registration / insurance / inspection (each with days chip)
  - Live odometer + engine hours + last update age
  - Assigned driver
  - Recent locations (last 10 GPS pings, address + age)
  - Recent maintenance (last 5)
  - Recent fuel entries (last 5)

**Add-new** flows stay in a centered modal (not a drawer). Reason: "Add" is a focused, one-shot task; drawer scrubbing makes less sense there.

---

## 6. Page wireframe — single fleet page

The page reads top-to-bottom like the user's existing pages: a tall header explaining what the page is, then the data. No separate overview, drivers, vehicles, maintenance, or detail routes. Just one page that flows.

### 6.1 Page header
Same vertical rhythm as the user's current pages. Title "Fleet" + a small subtitle ("Drivers, vehicles, and maintenance — one page.") + primary CTA on the right. CTA is a split button: `+ Add ▾` opens a menu of *Add driver · Add vehicle · Schedule maintenance*.

Use the same `FKDriversHeader` shape as the design reference — rename the atom to `FKFleetHeader` since it now serves the whole section.

### 6.2 Status strip (the "Now" row)
Single horizontal row directly below the header. Five clickable count chips, all live:

- 🚛 **Driving** (count, pulsing emerald dot) → switches to Drivers tab, filters HOS = Driving.
- ⏸ **On duty** (count) → Drivers tab, filtered.
- 📍 **In motion** (count of vehicles >5 mph) → Vehicles tab, filtered.
- ⚠ **Active faults** (count of critical + warning) → Vehicles tab, filtered to Has-faults.
- ✗ **HOS violations today** → Drivers tab, filtered.

When zero, the chips render in slate at 0 with no pulse — no celebratory styling, no hidden chips. The dispatcher learns where to look.

### 6.3 Action Queue (embedded, above the tabs)
Bordered card. Top 3 items by default with a `View all (5) ▾` link if there are more. Same `FKActionQueue` atom as the global bell-icon slide-out — one component, two placement contexts.

Each item: severity icon · type label · headline · relative time · primary action button · snooze. Severity-first sort, then age. Snoozed items go to a hidden Snoozed tab inside the queue. Empty state ✅ "All clear — no fleet actions needed today" with a 1-liner outlook ("Next: 3 docs expire in the next 7 days").

The queue mixes signal across all three entity types — driver license expired, vehicle fault active, maintenance overdue — so the dispatcher's morning triage happens here, not by clicking through three tabs.

### 6.4 Tab switcher
Three tabs, each showing a live count: `[ Drivers · 32 ] [ Vehicles · 28 ] [ Maintenance · 5 ]`. Active tab gets a 2px slate-900 underline; inactive tabs in slate-500. Counts always visible.

Switching tabs:
- Filter bar contents change (filters are per-table)
- Table column set changes (drivers / vehicles / maintenance — same `FKTable` shell, different `RowComp`)
- Drawer keeps its current state if open; clicking a different tab does **not** close it

URL syncs: `/fleet?tab=vehicles`. Direct links possible: `/fleet?tab=drivers&row=D-1031` opens the page with that driver's drawer pre-opened.

### 6.5 Filter bar (`FKFilterBar`)
Same component, content varies by tab. Density toggle in the top-right of the bar (matches the reference). Active filters render as chips above the table header.

- **Drivers tab:** Status (Active / Inactive / On Leave / Onboarding / Suspended) · HOS state · Document status · Search.
- **Vehicles tab:** Status (Active / In Maintenance / Out of Service / Idle) · Health (Healthy / Has warnings / Has critical) · Location-age · Search.
- **Maintenance tab:** Status · Type · Vehicle · Due-date range · Search. Plus a small **Upcoming / History** sub-tab strip at the top of the maintenance table only.

Selection mode: when 1+ rows selected, the filter bar swaps for `FKSelectionBar` (matches the reference design's "03 · Bulk selection" artboard).

### 6.6 Table
Same `FKTable` + `FKRowB` (two-line avatar-led row) at comfortable density (44px) by default. Compact (36px) collapses second-line chips into proper columns and shrinks avatars to 24px — exact reference behavior.

Per-tab column defaults: see §4.4 of this brief. The HOS chip belongs only on the Drivers table; the Health chip and Location-age chip belong only on the Vehicles table.

Footer is `FKTableFooter`: page count + page-size selector.

### 6.7 Drawer — the only detail surface
Slides in from the right when a row is clicked. 480px desktop, full-screen mobile. **Edit-led header** matching the reference: breadcrumb back to list (showing the current tab) · prev/next stepper through the visible filtered list · primary Edit button.

Critically, **there is no separate detail page**. Everything that lived on `/fleet/drivers/[id]` and `/fleet/trucks/[id]` is now in the drawer. No "Open full page →" link is needed because there is no full page; the drawer carries the full set of data sections.

#### Driver drawer body
- **Live HOS card** — current duty status (pulsing if driving), remaining drive / shift / cycle as three large tabular numbers, last update age, "Connected to Motive" / "Connected to Samsara" footer chip
- **Contact** — email, phone, hire date, status, address
- **Compliance** — license + medical card with days chips. Expired badge when any cert is past due (the design's "Aaliyah Washington" pattern).
- **Assignment** — currently assigned vehicle + active load (links highlight the corresponding row when clicked)
- **Today's HOS log** — small timeline of duty status changes, last 24h
- **Recent loads** — last 5 with mini-cards

#### Vehicle drawer body
- **Live Health card** — active faults count by severity + top 3 active faults with code · description · first-seen · severity. Empty state ✅ "Healthy — no active faults."
- **Live location** — 200×200 Mapbox mini-map with current pin · address · speed · heading · last update age. "View history" expands to last 10 pings.
- **Live odometer & engine hours** — two large tabular numbers + last update age
- **Basic info** — make, model, year, color, type, fuel type, tank capacity, MPG
- **Compliance** — registration · insurance · inspection (each with days chip)
- **Assignment** — assigned driver with their HOS chip inline
- **Recent maintenance** — last 5
- **Recent fuel** — last 5 (amber chip on `source = 'manual'`)
- **IFTA this quarter** — top 3 jurisdictions by miles + total + "View all in IFTA →" link to `/dashboard/ifta`

#### Maintenance drawer body
- Vehicle (link, opens vehicle drawer in same panel)
- Type · description · due date (days chip) · status pill · cost · provider · invoice number
- Synced-to-expense indicator
- Primary CTA: "Mark complete" if status is pending/scheduled

### 6.8 FleetMap (Vehicles tab only, Fleet tier+)
When the Vehicles tab is active, a 320px-tall Mapbox map slots between the filter bar and the table. Toggleable hide/show via a small button on the filter bar. Click a pin → highlights and scrolls to its row. Click a row → highlights its pin. Clusters when zoomed out.

For Premium and Basic tiers, render a faded preview of the map with the upgrade card overlay (see §7 `<TierGate>`). The preview should be pretty enough to want.

### 6.9 Page flow checklist
A morning-of-Monday dispatcher should be able to do all of these in under a minute, without leaving the page:

1. Glance at the status strip — "8 driving, 2 active faults, 1 HOS violation."
2. Read the top 3 Action Queue items — clear two with one-click actions, snooze one.
3. Click the **Vehicles** tab — see the map + table, identify the truck with the active fault.
4. Click that vehicle row → drawer opens with Health card + active fault detail + assigned driver's HOS.
5. Click the prev/next stepper to scrub through three more vehicles.
6. Switch the **Drivers** tab in the same session — drawer stays mounted but updates context.
7. Done. Never opened a modal. Never navigated away.

---

## 7. New components to design (component library)

These are reused across pages. Design them as a kit.

### `<HosStatusBadge />`
- States: Driving (pulsing emerald dot), On Duty (amber dot), Off Duty (slate dot), Sleeper (slate dot), Not connected (gray, "Connect ELD" tooltip).
- Anatomy: dot + status label + " · " + remaining time.
- Sizes: small (in-row), medium (in cards), large (hero card on driver detail).
- Tooltip on hover: full breakdown (drive remaining / shift remaining / cycle remaining), location text, last update age.

### `<VehicleHealthBadge />`
- States: Healthy (green ✓), Warnings only (amber ⚠ count), Has critical (rose ✗ count + critical label).
- Tooltip on hover: list top 3 fault codes with descriptions.

### `<DocStatusChip />`
- Props: a date and a doc type label.
- Output:
  - `✓ Valid` (emerald) when more than 30 days out
  - `⚠ 12d` (amber) when within 30 days, color shifts to deeper amber inside 14 days, rose at 7 days
  - `✗ Expired` (rose) when past
- Tooltip: "Expires Apr 30, 2026 · 12 days from now"

### `<LocationCell />`
- Anatomy: address text (truncated to 1 line, full in tooltip) + age chip on the right.
- Click to expand → inline 200×200 mini-map appears below the row.

### `<FleetMap />`
- Mapbox base map with clustered pins (clusters when zoomed out, individual pins when zoomed in).
- Pin design described in §6.1.
- Map controls: zoom +/−, recenter to fleet bounds, fullscreen toggle.
- "Last updated: 2 min ago" small text bottom-left + "Refresh" link.

### `<ActionQueue />`
- Vertical list of priority-sorted action items.
- Each item: severity icon (left, color-coded) + type label + headline + relative time + primary action button + snooze button.
- Critical items have a soft rose left-border accent.
- Empty state: green check + "All clear — no fleet actions needed today" + 1-liner about next-7-days outlook.
- Snoozed footer accordion.

### `<IftaProgressStrip />`
- Horizontal strip with: total miles big number on left + top 5 jurisdictions as inline horizontal bars on right.
- Each bar: state code (e.g. "TX") + bar visual + miles number. Sorted by miles descending.
- "Compare to last quarter ▾" toggle adds delta arrows next to each.
- Click strip → jumps to `/dashboard/ifta` for current quarter.

### `<DispatchHosCheck />` (cross-page — used on Dispatch / load creation)
- Inline component shown next to a driver dropdown when assigning a driver.
- Three states:
  - ✓ "8h 14m available — eligible" (emerald)
  - ⚠ "1h 02m left, may need split rest" (amber)
  - ✗ "0 hours — driver not eligible" (rose)
- Doesn't block assignment; warns user.

### `<TierGate />` (wrapper)
- When access denied: render the protected UI faded to ~50% opacity with a centered overlay card containing: lock icon + headline ("Live GPS tracking is a Fleet plan feature") + 2-line value prop + "Upgrade to Fleet" button.
- Don't hide the feature — make it visible, valuable, gated.

---

## 8. Severity / urgency color system

Use this everywhere status is shown. Consistency across pages = trust.

| Level | Color | Use |
|---|---|---|
| **Critical** | rose-600 | Expired docs, active critical faults, HOS violations today |
| **High** | amber-600 | ≤7 days to expiry, warning faults, overdue maintenance |
| **Medium** | yellow-500 | ≤14 days to expiry |
| **Normal** | slate-500 | ≤30 days to expiry, info |
| **Low** | slate-400 | Informational, completed |
| **Success** | emerald-500 | Active, valid, healthy, completed |
| **Off-ELD/manual marker** | amber-500 (chip) | Manual entries flagged for audit |
| **Live/active pulse** | emerald-500 with pulse animation | Currently driving, currently moving |

Status meaning must always be encoded redundantly: color **and** icon **and** text. Never color-only — fails accessibility and color-blind users.

---

## 9. States to design (every component, every page)

For each page and component, design these explicitly:

1. **Empty state** — no data yet. Friendly illustration + headline + helper + primary CTA.
2. **No-results state** — data exists but filters return nothing. "Clear filters" affordance.
3. **Loading state** — skeleton matching final layout. 8 skeleton rows for tables.
4. **Error state** — inline banner with reload button. Don't blow away the page.
5. **Partial-data state** — some sections loaded, some still loading. Each section has its own skeleton.
6. **Tier-gated state** — feature requires upgrade. Show faded preview + upgrade card overlay.
7. **Permission-denied state** — feature exists but this user doesn't have access. Different from gated — uses different copy.
8. **Disconnected-ELD state** — ELD-dependent UI when no ELD connected. "Connect Motive or Samsara to see live HOS and GPS" with a connect link.
9. **Resource-limit state** — at max trucks/drivers for tier. "1 of 1 used — upgrade to add more."

---

## 10. Responsive specifics

- **Mobile:** 375–767px. Card list instead of tables. Drawer becomes full-screen modal. FleetMap collapses behind a "Show map" toggle. Two-column layouts stack to one column. Stat strip wraps to 2 rows.
- **Tablet:** 768–1279px. Tables horizontal-scroll with sticky first column. Drawer is 80% width. Map is 240px tall.
- **Desktop:** ≥ 1280px. Full table, all default columns. Drawer 480px. Map 480px tall.

Touch targets minimum 44×44 on touch devices.

---

## 11. Accessibility

- Color contrast: 4.5:1 minimum for body text, 3:1 for UI elements and large text.
- Status meaning: color + icon + text (never color alone).
- Focus rings on every interactive element. Custom: 2px emerald-500 with 2px offset.
- Keyboard navigation throughout: tab order matches visual order; tables support arrow keys; Esc closes drawers.
- Reduced motion: respect `prefers-reduced-motion`. No pulse, no slide, no map auto-rotation.
- Form fields: real labels (not placeholder-as-label), error messages associated semantically.
- Live regions: action queue announces new items politely; HOS violations announce assertively.

---

## 12. Tier gating cheat sheet

The product has four tiers. Some fleet features are gated. Design the gated affordances visibly — don't hide.

| Feature | Required tier |
|---|---|
| Driver/vehicle/maintenance CRUD | Basic (1 truck, 1 driver) |
| Compliance, IFTA, State Mileage | Premium (3 trucks, 3 drivers) |
| ELD connection + HOS tracking + IFTA auto-import | Premium |
| **Live GPS tracking (FleetMap)** | **Fleet (12 trucks, 12 drivers)** |
| **Vehicle fault codes / diagnostics** | **Fleet** |
| **Maintenance scheduling** | **Fleet** |
| **Saved table views** | **Fleet** |
| **Bulk actions** | **Fleet** |
| **Fleet reports / CSV export** | **Fleet** |

When a Premium user lands on `/fleet`, the FleetMap zone shows a faded preview + upgrade card. The HOS column on the drivers table is fully visible (Premium has HOS). The Health column on vehicles table shows a "Fleet plan" lock chip in each cell.

---

## 13. Reference patterns

These exist already — design should extend them, not contradict them.

1. **The user's "Drivers redesign" HTML** (`Drivers redesign.html`, kept locally) — the **primary visual reference** for this redesign. It establishes the FK\* atom set, the two-line avatar-led row (`FKRowB`), the edit-led drawer with breadcrumb + prev/next, the comfortable/compact density modes (44px / 36px), the status pills, the HOS chip, the days-to-expiry chip, and the bulk-selection toolbar swap. Treat this as canon: every layout in this brief uses these atoms, just rearranged for the single-page architecture and extended to vehicles + maintenance contexts.
2. **State Mileage Logger redesign** (commit `922671b`, shipped). The most recent in-product reference. Flat cards with one pulsing dot for status. Vertical timeline for state crossings. Status pill + 3-stat strip header. Amber "Off-ELD" badge for manual entries.
3. **"Auto-flow over import buttons" rule** — when downstream data flows automatically, demote sync/import buttons to small footer links + last-sync-time text. Don't put them in the page header.
4. **Notification urgency colors** — match exactly so cross-page consistency holds (see §8).

---

## 14. Out of scope for the design phase

Don't design these — they're separate features being tracked elsewhere:

- DVIR (driver vehicle inspection report) workflows
- Driver settlements / payroll
- Multi-user RBAC permissions
- Document image/PDF upload (placeholder card on driver detail is OK)
- Driver mobile companion app
- New ELD providers UI
- Backend admin / tenant management

---

## 15. What "good" looks like

The redesign is successful if a Fleet-tier user can answer all of these in under 5 seconds without leaving the fleet pages:

1. Which of my drivers are driving right now?
2. Which of my drivers will run out of HOS hours in the next 2 hours?
3. Which of my vehicles have an active critical fault?
4. Which documents expire in the next 7 days?
5. Which vehicle is closest to its next maintenance interval?
6. How many miles have I run in California this quarter?
7. Is driver X eligible for a load picking up in 4 hours?

Today, none of those questions can be answered from the fleet pages.

---

## 16. Decisions already made (don't redesign these)

- **Architecture:** One fleet page at `/fleet`. Tab switching for Drivers / Vehicles / Maintenance. No separate detail pages — drawer is the only detail surface. The status strip + Action Queue sit above the tabs, always visible. Old detail routes (`/fleet/drivers/[id]`, `/fleet/trucks/[id]`) redirect to `/fleet?tab=…&row=…`.
- **Visual system:** FK\* atoms from the user's "Drivers redesign" HTML — `FKShell`, `FKFleetHeader` (renamed from `FKDriversHeader`), `FKFilterBar`, `FKSelectionBar`, `FKTable` + `FKRowB` (two-line avatar-led row), `FKTableFooter`, `FKDrawer` (edit-led header with breadcrumb + prev/next), `FKEmptyState`, `FKSkeletonTable`, `FKActionQueue`, `FKStatusPill`, `FKHosChip`, `FKDaysChip`, `FKAvatar`, `FKBtn`, `FKIcon`, `FKMobileCard`. Don't redesign these — extend them for vehicle and maintenance contexts.
- **Density:** Comfortable 44px and Compact 36px. Toggle in filter bar top-right. Compact collapses second-line chips into proper columns and shrinks avatars to 24px.
- **Days-chip thresholds:** `<0` red, `0–7` rose, `8–30` amber, `>30` slate. Always tabular-numeric.
- **Map provider:** Mapbox.
- **Terminology:** "Vehicles" in copy and labels (routes stay `/fleet/trucks` for redirect compatibility).
- **Drawer-default for view + edit.** Modal stays for "Add new" only.
- **Saved views = Fleet tier.**
- **Tier limits:** Match `tierConfig.js` (Basic 1/1, Premium 3/3, Fleet 12/12, Enterprise unlimited).
- **Action queue snooze:** 24h fixed for v1.

---

## 17. Why this redesign exists (the ELD integration story)

The single biggest reason for this redesign is to surface ELD-sourced data the user already pays for but never sees in the UI. The fleet pages today are a competent CRUD layer; the redesign turns them into a real fleet-operations surface.

These fields are synced hourly (or via webhooks) and are completely absent from the current fleet pages:

| Data | Where it's already stored | Where it appears in the redesign |
|---|---|---|
| Driver duty status (Driving / On Duty / Off Duty / Sleeper) | `driver_hos_status.duty_status` | Status strip count, HOS chip in driver rows, HOS card in driver drawer |
| Remaining drive / shift / cycle time | `drivers.hos_available_drive_minutes` (+ daily logs) | HOS chip remaining-time, HOS card three-number layout, dispatch HOS check |
| HOS violations today | `eld_hos_daily_logs.has_violation` | Status strip violation count, Action Queue item, driver drawer flag |
| Live GPS location | `vehicle_current_locations`, `eld_vehicle_locations` | Vehicles-tab FleetMap, Location-age chip, vehicle drawer mini-map |
| Live odometer + engine hours | `vehicles.odometer_miles`, `engine_hours` | Vehicle row column, vehicle drawer top stat |
| Active fault codes / DTCs | `vehicle_active_faults` | Status strip fault count, Health chip in vehicle row, Health card in vehicle drawer, Action Queue items |
| Per-vehicle quarterly IFTA miles | `eld_ifta_mileage` (verified columns: `miles, quarter, eld_vehicle_id`) | Vehicle drawer "IFTA this quarter" section |
| Fuel source attribution | `fuel_entries.source = 'eld' \| 'manual'` | Amber chip on manual entries in vehicle drawer fuel list |
| Connection / sync health | `eld_connections.last_sync_at` | Footer link "Synced 4 min ago" + manual refresh — never as a hero CTA |

Two cross-page integrations close the loop:

1. **Dispatch HOS check** — when assigning a driver to a load on `/dashboard/dispatching`, an inline `<DispatchHosCheck>` shows whether the driver is HOS-eligible for that load before the assignment commits. Pulls from `getAvailableTime()` which already exists.
2. **Notification deep links** — every fleet notification (document expiring, maintenance due, fault active, HOS violation) opens `/fleet?tab=…&row=…` with the relevant drawer pre-opened. No more landing on a list and hunting.

If those data points are visible in the redesign, the redesign succeeded. If they aren't, it didn't.

---

*End of brief.*
