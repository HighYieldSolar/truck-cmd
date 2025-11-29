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

#### 9. BrowserMCP Browser Automation (`mcp__browsermcp__`)

**Purpose**: Browser automation for visual testing, debugging, and interaction testing.

**When to Use**:
- Visual verification after UI changes
- Debugging console errors in the browser
- Testing user interaction flows
- Capturing screenshots for documentation
- Testing responsive design at different viewports

**Key Tools**:
```javascript
// Navigation
mcp__browsermcp__browser_navigate(url)
mcp__browsermcp__browser_go_back()
mcp__browsermcp__browser_go_forward()

// Screenshots & Snapshots
mcp__browsermcp__browser_screenshot()
mcp__browsermcp__browser_snapshot()              // Accessibility tree (preferred for interactions)

// Interaction
mcp__browsermcp__browser_click(element, ref)
mcp__browsermcp__browser_type(element, ref, text, submit)
mcp__browsermcp__browser_hover(element, ref)
mcp__browsermcp__browser_select_option(element, ref, values)
mcp__browsermcp__browser_press_key(key)

// Debugging
mcp__browsermcp__browser_get_console_logs()

// Browser Control
mcp__browsermcp__browser_wait(time)
```

---

### MCP Usage Workflows

#### Starting a New Task
1. **Check Obsidian** for relevant notes, requirements, or specs
2. **Search Ref** for documentation on technologies being used
3. **Review Supabase** schema if database work is involved
4. **Check ShadCN** for existing components if building UI

#### During Development
1. **Use Ref** to verify API usage and best practices
2. **Search DuckDuckGo** for error messages or edge cases
3. **Run Semgrep** security checks on new code
4. **Test with BrowserMCP** for UI changes

#### Before Committing
1. **Run Semgrep** `security_check` on all changed files
2. **Check Supabase** advisories if schema changed
3. **Visual verify** with BrowserMCP screenshots
4. **Check console** for errors with `browser_get_console_logs`

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

- **Trial Management**: 7-day trials created automatically for new users
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
2. **Navigate to affected pages** - Use `mcp__browsermcp__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take screenshot with `mcp__browsermcp__browser_screenshot` of each changed view
7. **Check for errors** - Run `mcp__browsermcp__browser_get_console_logs` ⚠️

This verification ensures changes meet design standards and user requirements.

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

### BrowserMCP Integration

#### Essential Commands for UI Testing

```javascript
// Navigation & Screenshots
mcp__browsermcp__browser_navigate(url);    // Navigate to page
mcp__browsermcp__browser_screenshot();      // Capture visual evidence
mcp__browsermcp__browser_go_back();         // Navigate back
mcp__browsermcp__browser_go_forward();      // Navigate forward

// Interaction Testing
mcp__browsermcp__browser_click(element, ref);           // Test clicks
mcp__browsermcp__browser_type(element, ref, text, submit); // Test input
mcp__browsermcp__browser_hover(element, ref);           // Test hover states
mcp__browsermcp__browser_select_option(element, ref, values); // Select dropdowns
mcp__browsermcp__browser_press_key(key);                // Keyboard input

// Validation
mcp__browsermcp__browser_get_console_logs(); // Check for errors
mcp__browsermcp__browser_snapshot();          // Accessibility tree (best for interactions)
mcp__browsermcp__browser_wait(time);          // Wait for loading
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
