# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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