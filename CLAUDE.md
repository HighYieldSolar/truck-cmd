# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP Server Integration

This project leverages multiple MCP (Model Context Protocol) servers to enhance development precision and automate workflows. **Always utilize these tools proactively** when they can improve task quality.

### Docker Container MCPs (`mcp__MCP_DOCKER__`)

These MCPs run in a Docker container and provide specialized functionality:

#### 1. DuckDuckGo Web Search

**Purpose**: Deep research, documentation lookup, troubleshooting, and staying current with best practices.

**When to Use**:
- Researching unfamiliar APIs, libraries, or error messages
- Finding current best practices for trucking industry regulations (IFTA, DOT compliance)
- Investigating security vulnerabilities or CVEs
- Looking up Stripe/Supabase/Next.js updates and changes

**Key Tools**:
```javascript
mcp__MCP_DOCKER__search(query, max_results)     // Search the web
mcp__MCP_DOCKER__fetch_content(url)              // Fetch and parse webpage content
```

#### 2. Obsidian Notes Vault

**Purpose**: Access project notes, goals, roadmap, and task tracking for Truck Command SaaS.

**When to Use**:
- Before starting any feature - check for existing requirements/specs
- Understanding project priorities and business goals
- Reviewing past decisions and rationale
- Finding TODO items and planned features

**Key Tools**:
```javascript
mcp__MCP_DOCKER__obsidian_list_files_in_vault()           // See all notes
mcp__MCP_DOCKER__obsidian_list_files_in_dir(dirpath)      // List directory contents
mcp__MCP_DOCKER__obsidian_get_file_contents(filepath)     // Read specific note
mcp__MCP_DOCKER__obsidian_simple_search(query)            // Search notes by text
mcp__MCP_DOCKER__obsidian_complex_search(query)           // Advanced JsonLogic search
mcp__MCP_DOCKER__obsidian_get_recent_changes(limit, days) // Recently modified notes
mcp__MCP_DOCKER__obsidian_append_content(filepath, content) // Add to notes
mcp__MCP_DOCKER__obsidian_get_periodic_note(period)       // Daily/weekly notes
```

**Workflow Integration**:
- **Start of session**: Check Obsidian for relevant project context
- **Feature work**: Look for specs, requirements, or design notes
- **After completion**: Update notes with implementation details if needed

### Obsidian Knowledge Management System

This project uses a structured Obsidian vault as its knowledge base. The vault is organized for instant AI context pickup and persistent project memory.

#### Session Start Protocol (MANDATORY)
At the start of EVERY coding session, read these notes in order:
1. `Truck Command HQ.md` - Master control note with project overview and system explanation
2. `01 - Active Sprint/Current Sprint.md` - What is actively being worked on
3. `01 - Active Sprint/Blocked Items.md` - Check if anything has been unblocked

#### Session End Protocol
Before ending a session:
1. Update `01 - Active Sprint/Current Sprint.md` with any status changes
2. Create or update a session log in `02 - Work Log/` using the template in `08 - Templates/Session Log Template.md`
3. Move completed items from "In Progress" to "Done This Sprint"
4. Add any new blocked items to `01 - Active Sprint/Blocked Items.md`

#### Vault Structure
```
Truck Command HQ.md              <- Read first (master control)
00 - Maps of Content/            <- Index notes by domain (features, architecture, integrations, legal, work log)
01 - Active Sprint/              <- Current Sprint + Blocked Items (read second)
02 - Work Log/                   <- Session logs (write at end of session)
03 - Architecture/               <- Tech stack, services, DB schema, API routes, subscription tiers
04 - Features/                   <- One note per product feature
05 - Integrations/               <- One note per third-party integration
06 - Research/                   <- Deep research docs and analysis
07 - Launch/                     <- Launch checklists, sprint plans, legal
08 - Templates/                  <- Reusable templates for session logs and feature specs
09 - Archive/                    <- Deprecated notes
```

#### When to Read Specific Notes
- **Working on a feature**: Read the note in `04 - Features/` for that feature
- **Working on an integration**: Read the note in `05 - Integrations/` for that integration
- **Need to understand code structure**: Read `03 - Architecture/Service Layer Map.md`
- **Need database info**: Read `03 - Architecture/Database Schema.md` or query Supabase MCP
- **Need API route info**: Read `03 - Architecture/API Routes Map.md`
- **Need subscription/tier info**: Read `03 - Architecture/Subscription Tiers.md`
- **Need legal/compliance context**: Read `00 - Maps of Content/Compliance & Legal MOC.md`
- **Need historical context**: Read `00 - Maps of Content/Work Log MOC.md` or search work logs

#### Wikilink Convention
All notes use `[[wikilinks]]` to connect to related notes. When creating or updating notes, always add wikilinks to related content. This powers Obsidian's graph view and makes the knowledge base navigable.

#### Tags Convention
- Status: `#status/shipped` `#status/in-progress` `#status/blocked` `#status/planned`
- Domain: `#domain/backend` `#domain/frontend` `#domain/integrations` `#domain/infrastructure`
- Priority: `#priority/critical` `#priority/high` `#priority/medium` `#priority/low`

#### 3. Semgrep Security Scanner

**Purpose**: Ensure code security, identify vulnerabilities, and maintain OWASP compliance for user safety.

**When to Use**:
- **ALWAYS** after writing new code - run security scan before committing
- When implementing authentication, authorization, or data handling
- Before deploying to production
- When handling user input, API endpoints, or database queries
- Reviewing third-party code or dependencies

**Key Tools**:
```javascript
mcp__MCP_DOCKER__security_check(code_files)                    // Quick security scan
mcp__MCP_DOCKER__semgrep_scan(code_files, config)              // Full Semgrep scan
mcp__MCP_DOCKER__semgrep_scan_local(code_files, config)        // Scan local files by path
mcp__MCP_DOCKER__semgrep_scan_with_custom_rule(code_files, rule) // Custom rule scan
mcp__MCP_DOCKER__semgrep_findings(repos, severities, status)   // Get existing findings
mcp__MCP_DOCKER__semgrep_rule_schema()                         // Get rule schema
mcp__MCP_DOCKER__get_abstract_syntax_tree(code, language)      // AST analysis
mcp__MCP_DOCKER__get_supported_languages()                     // Supported languages
```

**Security Workflow**:
1. Write/modify code
2. Run `security_check` on changed files
3. If issues found - **MUST FIX** before proceeding
4. For critical features (auth, payments, user data) - run full `semgrep_scan`

#### 4. Stripe Billing Backend

**Purpose**: Manage subscriptions, customers, invoices, and all payment operations.

**When to Use**:
- Debugging subscription issues
- Creating/managing products and prices
- Handling customer billing inquiries
- Testing payment flows
- Investigating failed payments or disputes

**Key Tools**:
```javascript
// Customer Management
mcp__MCP_DOCKER__list_customers(limit, email)
mcp__MCP_DOCKER__create_customer(name, email)

// Products & Pricing
mcp__MCP_DOCKER__list_products(limit)
mcp__MCP_DOCKER__create_product(name, description)
mcp__MCP_DOCKER__list_prices(product, limit)
mcp__MCP_DOCKER__create_price(product, unit_amount, currency)

// Subscriptions
mcp__MCP_DOCKER__list_subscriptions(customer, status, limit)
mcp__MCP_DOCKER__update_subscription(subscription, items, proration_behavior)
mcp__MCP_DOCKER__cancel_subscription(subscription)

// Invoicing
mcp__MCP_DOCKER__list_invoices(customer, limit)
mcp__MCP_DOCKER__create_invoice(customer, days_until_due)
mcp__MCP_DOCKER__create_invoice_item(customer, price, invoice)
mcp__MCP_DOCKER__finalize_invoice(invoice)

// Payments & Refunds
mcp__MCP_DOCKER__list_payment_intents(customer, limit)
mcp__MCP_DOCKER__create_payment_link(price, quantity, redirect_url)
mcp__MCP_DOCKER__create_refund(payment_intent, amount)

// Disputes & Coupons
mcp__MCP_DOCKER__list_disputes(charge, payment_intent, limit)
mcp__MCP_DOCKER__update_dispute(dispute, evidence, submit)
mcp__MCP_DOCKER__list_coupons(limit)
mcp__MCP_DOCKER__create_coupon(name, percent_off, amount_off, duration)

// Account
mcp__MCP_DOCKER__retrieve_balance()
mcp__MCP_DOCKER__search_stripe_documentation(question, language)
```

---

### Standalone MCPs

#### 5. Supabase Database (`mcp__supabase__`)

**Purpose**: Direct database access, schema management, migrations, and security advisories.

**When to Use**:
- Modifying database schema (tables, columns, indexes)
- Debugging data issues with direct SQL queries
- Creating and applying migrations
- Checking security advisories and RLS policies
- Generating TypeScript types after schema changes

**Key Tools**:
```javascript
mcp__supabase__list_tables(schemas)              // List all tables
mcp__supabase__execute_sql(query)                // Run SQL queries
mcp__supabase__apply_migration(name, query)      // Apply DDL migrations
mcp__supabase__list_migrations()                 // View migration history
mcp__supabase__get_advisors(type)                // Security/performance advisories
mcp__supabase__list_extensions()                 // Database extensions
mcp__supabase__generate_typescript_types()       // Generate TS types
mcp__supabase__get_project_url()                 // Get API URL
mcp__supabase__get_anon_key()                    // Get anon key
mcp__supabase__get_logs(service)                 // Debug logs (api, postgres, auth, etc.)
mcp__supabase__search_docs(graphql_query)        // Search Supabase docs
```

**Database Workflow**:
1. Before schema changes - check existing tables with `list_tables`
2. Apply changes via `apply_migration` (never raw DDL in production)
3. After changes - run `get_advisors('security')` to check for RLS issues
4. Generate new types with `generate_typescript_types`

#### 6. Vercel Hosting (`mcp__vercel__`)

**Purpose**: Deployment management, hosting configuration, and production debugging.

**When to Use**:
- Deploying to production or preview environments
- Debugging deployment failures (build logs)
- Managing environment variables and domains
- Investigating production issues
- Checking deployment status

**Key Tools**:
```javascript
mcp__vercel__deploy_to_vercel()                           // Deploy current project
mcp__vercel__list_teams()                                 // List user's teams
mcp__vercel__list_projects(teamId)                        // List projects
mcp__vercel__get_project(projectId, teamId)               // Get project details
mcp__vercel__list_deployments(projectId, teamId)          // List deployments
mcp__vercel__get_deployment(idOrUrl, teamId)              // Get deployment details
mcp__vercel__get_deployment_build_logs(idOrUrl, teamId, limit) // Debug build failures
mcp__vercel__get_access_to_vercel_url(url)                // Access protected deployments
mcp__vercel__web_fetch_vercel_url(url)                    // Fetch protected URLs
mcp__vercel__check_domain_availability_and_price(names)   // Domain availability
mcp__vercel__search_vercel_documentation(topic, tokens)   // Search Vercel docs
```

#### 7. Ref Documentation (`mcp__Ref__`)

**Purpose**: Access up-to-date documentation for APIs, libraries, frameworks, and design specs.

**When to Use**:
- Looking up API documentation (Supabase, Stripe, Next.js, etc.)
- Checking library usage and examples
- Researching bug reports and known issues
- Finding design specifications and requirements
- Verifying correct implementation patterns

**Key Tools**:
```javascript
mcp__Ref__ref_search_documentation(query)  // Search docs (include language/framework)
mcp__Ref__ref_read_url(url)                // Read content from documentation URL
```

**Best Practices**:
- Include framework/library name in search: "Next.js 15 app router middleware"
- Use `ref_read_url` with exact URLs from search results (including #hash)
- Search before implementing unfamiliar APIs

#### 8. ShadCN UI Components (`mcp__shadcn__`)

**Purpose**: Access UI component libraries for consistent, high-quality interface design.

**When to Use**:
- Building new UI components
- Finding pre-built component patterns
- Looking for component examples and demos
- Ensuring consistent design language
- Getting CLI commands for component installation

**Key Tools**:
```javascript
mcp__shadcn__get_project_registries()                      // Get configured registries
mcp__shadcn__list_items_in_registries(registries, limit)   // List available components
mcp__shadcn__search_items_in_registries(registries, query) // Search for components
mcp__shadcn__view_items_in_registries(items)               // View component details
mcp__shadcn__get_item_examples_from_registries(registries, query) // Get usage examples
mcp__shadcn__get_add_command_for_items(items)              // Get install command
mcp__shadcn__get_audit_checklist()                         // Post-creation checklist
```

**UI Development Workflow**:
1. Search for existing components before building custom
2. View examples to understand usage patterns
3. Use `get_add_command` to install components
4. Run `get_audit_checklist` after adding new components

#### 9. Chrome DevTools MCP Browser Automation (`mcp__chrome-devtools__`)

**This replaces the deprecated BrowserMCP.** Chrome DevTools MCP is the official Google ChromeDevTools project (v0.26+, plugin 1.0.1) that exposes the full DevTools protocol to coding agents — not just clicks and screenshots, but performance traces, Lighthouse audits, network inspection, heap snapshots, source-mapped console errors, CrUX field data, and Chrome extension testing. Treat it as your live browser eyes, hands, and profiler.

**Purpose**: Full-fidelity browser automation, debugging, performance analysis, accessibility auditing, and visual verification against a real Chromium instance.

**When to Use**:
- After any UI change — verify it in the browser before declaring complete
- Reproducing a console error or runtime exception in a real page context
- Performance debugging (LCP, CLS, INP, slow loads, jank, memory growth)
- Accessibility audits before shipping (WCAG, focus order, tap targets, contrast)
- Inspecting network requests (auth headers, API responses, redirects, failed calls)
- Testing responsive design at mobile/tablet/desktop breakpoints
- Debugging memory leaks via heap snapshots
- Smoke testing critical flows (auth → load creation → invoicing → billing)

**Key Tool Categories** (full reference: `npx chrome-devtools-mcp@latest --help`):

```javascript
// --- Navigation & Page Management ---
mcp__chrome-devtools__list_pages()                      // See open tabs
mcp__chrome-devtools__new_page(url)                     // Open a new tab
mcp__chrome-devtools__navigate_page(url, type, ...)     // Navigate, reload, back/forward
mcp__chrome-devtools__select_page(pageIdx)              // Switch tab context
mcp__chrome-devtools__close_page(pageIdx)
mcp__chrome-devtools__wait_for(text|selector)           // Wait for content to appear

// --- Inspection (PREFER snapshot over screenshot for automation) ---
mcp__chrome-devtools__take_snapshot()                   // a11y-tree text snapshot, returns uid for every element
mcp__chrome-devtools__take_screenshot({uid?, fullPage?, format, filePath})
mcp__chrome-devtools__evaluate_script(fn, args)         // Run JS in page, can take uids as args

// --- Interaction (uid comes from snapshot) ---
mcp__chrome-devtools__click(uid, {dblClick?, includeSnapshot?})
mcp__chrome-devtools__fill(uid, value)                  // Input text or select option
mcp__chrome-devtools__fill_form([{uid, value}, ...])    // Bulk-fill multiple inputs in one call
mcp__chrome-devtools__hover(uid)
mcp__chrome-devtools__drag(srcUid, dstUid)
mcp__chrome-devtools__press_key("Enter" | "Control+A" | ...)
mcp__chrome-devtools__type_text("hello", {submitKey?})
mcp__chrome-devtools__upload_file(uid, path)
mcp__chrome-devtools__handle_dialog("accept" | "dismiss", {promptText?})

// --- Console & Debugging ---
mcp__chrome-devtools__list_console_messages({types, includePreservedMessages, pageSize, pageIdx})
mcp__chrome-devtools__get_console_message(id)

// --- Network ---
mcp__chrome-devtools__list_network_requests({resourceTypes, pageSize, pageIdx, includePreservedRequests})
mcp__chrome-devtools__get_network_request({reqid, requestFilePath?, responseFilePath?})

// --- Performance (NEW — major upgrade vs BrowserMCP) ---
mcp__chrome-devtools__performance_start_trace({reload, autoStop, filePath?})
mcp__chrome-devtools__performance_stop_trace({filePath?})
mcp__chrome-devtools__performance_analyze_insight(insightSetId, insightName)
  // Insights: LCPBreakdown, DocumentLatency, RenderBlocking, LCPDiscovery, CLSCulprits, etc.

// --- Lighthouse (NEW — integrated, no extension needed) ---
mcp__chrome-devtools__lighthouse_audit({mode: "navigation"|"snapshot"|"timespan", device, outputDirPath})
  // Returns a11y, performance, SEO, best-practices, PWA scores + failing audits with selectors

// --- Emulation ---
mcp__chrome-devtools__emulate({networkConditions, cpuThrottlingRate, colorScheme, viewport, userAgent, geolocation})
mcp__chrome-devtools__resize_page(w, h)

// --- Memory (requires --experimentalMemory) ---
mcp__chrome-devtools__take_memory_snapshot(filePath)
// Plus get_heapsnapshot_summary / details / retainers / class_nodes for analysis
```

**Configuration & Flags** (set in the plugin's `.mcp.json`):

| Flag | Default | When to set |
|------|---------|-------------|
| `--isolated` | off | Use a clean throwaway profile (CI, parallel runs) |
| `--userDataDir <path>` | `$HOME/.cache/chrome-devtools-mcp/...` | Persistent profile (logged-in sessions) |
| `--channel` | `stable` | `canary`/`dev`/`beta` for testing new APIs |
| `--headless` | off | Headless mode for CI; off locally so you can watch |
| `--viewport 1440x900` | — | Pin a viewport for deterministic screenshots |
| `--logFile <path>` | — | Capture debug logs when troubleshooting |
| `--acceptInsecureCerts` | off | Local HTTPS dev with self-signed certs |
| `--proxyServer` | — | Route traffic through a proxy |
| `--redactNetworkHeaders` | off | Strip sensitive headers from network logs |
| `--no-usage-statistics` | (on) | Opt out of Google telemetry |
| `--no-performance-crux` | (on) | Disable CrUX field-data lookups during traces |
| `--experimentalMemory` | off | **Enable for memory leak debugging on TruckCommand** |
| `--experimentalScreencast` | off | Video recording of flows (needs ffmpeg) |
| `--experimentalVision` | off | `click_at(x,y)` coordinate clicking |
| `--categoryExtensions` | off | Test Chrome extensions (pipe connection only) |
| `--slim` | off | Minimal 3-tool subset — **do not use**, kills most features |

**Recommended TruckCommand config** (add `.mcp.json` at project root to override the plugin default):
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--viewport=1440x900",
        "--experimentalMemory"
      ]
    }
  }
}
```
This pins viewport for consistent screenshots and unlocks heap-snapshot tools for memory debugging.

**Bundled Skills** (auto-trigger via Skill tool when relevant):
- `chrome-devtools-mcp:chrome-devtools` — general debugging/automation playbook
- `chrome-devtools-mcp:a11y-debugging` — semantic HTML, ARIA, tap targets, contrast workflow
- `chrome-devtools-mcp:debug-optimize-lcp` — LCP breakdown (TTFB / load delay / load duration / render delay)
- `chrome-devtools-mcp:memory-leak-debugging` — heap-snapshot capture + memlab analysis
- `chrome-devtools-mcp:chrome-devtools-cli` — shell-based access for scripts
- `chrome-devtools-mcp:troubleshooting` — when the server won't start or connect

**Browser Lifecycle Notes**:
- Chrome launches lazily on the first tool call and persists across calls within the session.
- `take_snapshot` returns a fresh accessibility tree with `uid`s — always re-snapshot after navigation, dialogs, or DOM mutations; stale `uid`s fail silently.
- Send tool calls in parallel where possible, but preserve order: navigate → wait → snapshot → interact.
- Use `filePath` parameters for screenshots/traces to keep large payloads out of context.

---

### MCP Usage Workflows

#### Starting a New Task
1. **Check Obsidian** for relevant notes, requirements, or specs
2. **Search Ref** for documentation on technologies being used
3. **Review Supabase** schema if database work is involved
4. **Check ShadCN** for existing components if building UI

#### During Development
1. **Use Ref / Context7** to verify API usage and best practices
2. **Search DuckDuckGo** for error messages or edge cases
3. **Run Semgrep** security checks on new code
4. **Test with Chrome DevTools MCP** for UI changes (snapshot → interact → screenshot)

#### Before Committing
1. **Run Semgrep** `security_check` on all changed files
2. **Check Supabase** advisories if schema changed
3. **Visual verify** with `mcp__chrome-devtools__take_screenshot` of every changed view
4. **Check console** for errors with `mcp__chrome-devtools__list_console_messages` (filter `types: ["error", "warning"]`)
5. **Run `lighthouse_audit`** on changed routes for any significant UI work (catch a11y/perf regressions before merge)

#### Debugging Production Issues
1. **Check Vercel** build logs and deployment status
2. **Review Supabase** logs for database/auth errors
3. **Use Stripe** tools to check payment/subscription status
4. **Search DuckDuckGo** for similar issues and solutions

---

## Development Commands

- **Development server**: `npm run dev` (uses Next.js with Turbopack)
- **Build**: `npm run build`
- **Production server**: `npm start`
- **Linting**: `npm run lint`

## Project Architecture

This is a **Next.js 15** trucking business management application using the **App Router** with route groups for organization.

### Key Technologies

- **Frontend**: Next.js 15, React 19, Tailwind CSS, DaisyUI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **Payments**: Stripe integration with subscription management
- **UI Components**: Headless UI, Heroicons, Lucide React
- **PDF Generation**: jsPDF with autoTable for invoices/reports
- **Charts**: Recharts for analytics

### Database & Authentication

- **Supabase Client**: `src/lib/supabaseClient.js` - Main database client with connection testing
- **Authentication**: Integrated with Supabase Auth, protected routes via `src/lib/protectedRoute.js`
- **Global State**: `SubscriptionContext.js` manages user subscription state with real-time updates
- **Environment Variables Required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`

### Route Structure

- **`(main)`** route group: Public pages (landing, login, signup, pricing)
- **`(dashboard)`** route group: Protected dashboard pages with dedicated layout
- **`/api`** routes: Stripe webhook handling, billing operations, subscription management

### Service Layer Architecture

The application uses a comprehensive service layer in `src/lib/services/` organized by business domains:

#### Core Business Operations

- **Load Management**: `loadService.js`, `loadCompletionService.js`, `loadInvoiceService.js`
- **Invoicing**: `invoiceService.js`, `invoiceDeleteService.js`
- **Customer Management**: `customerService.js`
- **Expense Tracking**: `expenseService.js`

#### Fleet & Compliance

- **Fleet Management**: `driverService.js`, `truckService.js`
- **Regulatory Compliance**: `iftaService.js`, `complianceService.js`, `mileageService.js`
- **Fuel Tracking**: `fuelService.js` with IFTA integration

#### Cross-Domain Integration

- **Fuel-to-Expense Sync**: `expenseFuelIntegration.js`
- **Load-to-IFTA Integration**: `loadIftaService.js`, `iftaMileageService.js`
- **Financial Analytics**: `dashboardService.js`
- **Notifications**: `notificationService.js` for compliance alerts

#### Key Integration Patterns

- Load completion triggers either invoicing or factoring workflows
- Fuel purchases automatically sync to expense records for tax compliance
- IFTA mileage tracking is integrated with load assignments
- Document expiration monitoring with automated notifications
- All services enforce user-based data isolation

### Component Organization

Components are organized by feature domain in `src/components/`:

- `auth/` - Authentication forms
- `billing/` - Stripe payment components
- `dashboard/` - Main dashboard widgets
- `dispatching/` - Load management UI
- `fleet/` - Driver and truck management
- `fuel/` - Fuel entry and tracking
- `ifta/` - IFTA reporting components
- `invoices/` - Invoice management
- `compliance/` - Document compliance tracking
- `expenses/` - Expense management
- `notifications/` - Real-time notification system

### Subscription System

- **Trial Management**: 30-day trials created automatically for new users
- **Real-time Updates**: Subscription changes via Stripe webhooks update UI immediately
- **Feature Gating**: Components check subscription status to control access
- **Billing Integration**: Stripe Customer Portal for subscription management

### Development Guidelines

- **Component Structure**: Follow existing patterns in each domain folder
- **Service Integration**: Use existing service layer patterns for new features
- **Styling**: Tailwind CSS with DaisyUI components, maintain consistent color scheme
- **Error Handling**: Use `formatError()` utility from supabaseClient for consistent error messages
- **Authentication**: Always check user state in protected components
- **File Uploads**: Use Supabase storage, follow existing patterns in fuel/compliance components

## Visual Development & Testing

### Design System

The project follows S-Tier SaaS design standards inspired by Stripe, Airbnb, and Linear. All UI development must adhere to:

- **Design Principles**: `/context/design-principles.md` - Comprehensive checklist for world-class UI
- **Component Library**: NextUI with custom Tailwind configuration

### Quick Visual Check

**IMMEDIATELY after implementing any front-end change:**

1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - `mcp__chrome-devtools__navigate_page` (or `new_page` if no tab open) to each changed view
3. **Snapshot the page** - `mcp__chrome-devtools__take_snapshot` to verify structure and grab element `uid`s
4. **Verify design compliance** - Compare against `/context/design-principles.md`
5. **Validate feature implementation** - Drive the feature with `click` / `fill` / `press_key` and confirm the end state
6. **Capture evidence** - `mcp__chrome-devtools__take_screenshot({fullPage: true, filePath: "..."})` of each changed view
7. **Check for errors** - `mcp__chrome-devtools__list_console_messages({types: ["error", "warning"]})` ⚠️
8. **Check the network** - `mcp__chrome-devtools__list_network_requests({resourceTypes: ["Fetch", "XHR"]})` to verify API calls succeed (no 4xx/5xx)

This verification ensures changes meet design standards and user requirements.

### Performance & Accessibility Spot-Check

For non-trivial UI work, also run:

- `mcp__chrome-devtools__lighthouse_audit({mode: "navigation", device: "mobile"})` — catches a11y, SEO, perf, best-practice regressions in a single call. Save the JSON with `outputDirPath` and grep the failed audits.
- `mcp__chrome-devtools__performance_start_trace({reload: true, autoStop: true})` followed by `performance_analyze_insight(setId, "LCPBreakdown")` — required for any change touching the landing page, dashboard, or large list views.
- `mcp__chrome-devtools__emulate({networkConditions: "Fast 3G", cpuThrottlingRate: 4})` — re-run the trace under throttling to surface mobile-class regressions before they reach production.

### Comprehensive Design Review

For significant UI changes or before merging PRs, use the design review agent:

```bash
# Option 1: Use the slash command
/design-review

# Option 2: Invoke the agent directly
@agent-design-review
```

The design review agent will:

- Test all interactive states and user flows
- Verify responsiveness (desktop/tablet/mobile)
- Check accessibility (WCAG 2.1 AA compliance)
- Validate visual polish and consistency
- Test edge cases and error states
- Provide categorized feedback (Blockers/High/Medium/Nitpicks)

### Chrome DevTools MCP Integration

#### Essential Commands for UI Testing

```javascript
// --- Navigation & Snapshots ---
mcp__chrome-devtools__navigate_page({url});               // Navigate the active tab
mcp__chrome-devtools__new_page({url});                    // Open a fresh tab
mcp__chrome-devtools__navigate_page({type: "back"});      // History controls
mcp__chrome-devtools__take_snapshot();                    // Accessibility tree + uids (use this BEFORE interactions)
mcp__chrome-devtools__take_screenshot({fullPage: true, filePath: "shot.png"});

// --- Interaction Testing (uid from take_snapshot) ---
mcp__chrome-devtools__click({uid});
mcp__chrome-devtools__fill({uid, value});
mcp__chrome-devtools__fill_form({elements: [{uid, value}, ...]}); // Bulk fill
mcp__chrome-devtools__hover({uid});
mcp__chrome-devtools__press_key({key: "Enter"});

// --- Validation ---
mcp__chrome-devtools__list_console_messages({types: ["error", "warning"]});
mcp__chrome-devtools__list_network_requests({resourceTypes: ["Fetch", "XHR"]});

// --- Lighthouse & Performance ---
mcp__chrome-devtools__lighthouse_audit({mode: "navigation", device: "mobile", outputDirPath: "./lh"});
mcp__chrome-devtools__performance_start_trace({reload: true, autoStop: true});
mcp__chrome-devtools__performance_analyze_insight(setId, "LCPBreakdown");

// --- Responsive / Emulation ---
mcp__chrome-devtools__resize_page({width: 375, height: 812});   // iPhone
mcp__chrome-devtools__emulate({colorScheme: "dark", networkConditions: "Fast 3G"});

// --- Waiting ---
mcp__chrome-devtools__wait_for({text: "Saved", timeout: 5000});
```

#### Snapshot-First Discipline

`take_snapshot` is your source of truth — it returns a text accessibility tree where every element has a `uid` you pass to `click`/`fill`/`hover`. Re-snapshot after every navigation, dialog, or DOM mutation. Stale uids fail without a clear error.

```
uid=1_0 RootWebArea "TruckCommand Dashboard" url="https://..."
  uid=1_1 button "Add Load"
  uid=1_2 textbox "Customer" required
```

### Design Compliance Checklist

When implementing UI features, verify:

- [ ] **Visual Hierarchy**: Clear focus flow, appropriate spacing
- [ ] **Consistency**: Uses design tokens, follows patterns
- [ ] **Responsiveness**: Works on mobile (375px), tablet (768px), desktop (1440px)
- [ ] **Accessibility**: Keyboard navigable, proper contrast, semantic HTML
- [ ] **Performance**: Fast load times, smooth animations (150-300ms)
- [ ] **Error Handling**: Clear error states, helpful messages
- [ ] **Polish**: Micro-interactions, loading states, empty states

## When to Use Automated Visual Testing

### Use Quick Visual Check for:

- Every front-end change, no matter how small
- After implementing new components or features
- When modifying existing UI elements
- After fixing visual bugs
- Before committing UI changes

### Use Comprehensive Design Review for:

- Major feature implementations
- Before creating pull requests with UI changes
- When refactoring component architecture
- After significant design system updates
- When accessibility compliance is critical

### Skip Visual Testing for:

- Backend-only changes (API, database)
- Configuration file updates
- Documentation changes
- Test file modifications
- Non-visual utility functions
