# Truck Command Project Structure

This document outlines the new project structure for the Truck Command application.

## Directory Structure

```
src/
├── app/
│   ├── (main)/          # Route group for main public-facing pages
│   │   ├── layout.js    # Layout for all pages within (main)
│   │   ├── page.js      # Landing page
│   │   ├── login/       # Login page
│   │   ├── signup/      # Signup page
│   │   ├── pricing/     # Pricing page
│   │   ├── billing/     # Billing page
│   │   ├── dashboard/   # Dashboard page
│   │   ├── verify-email/# Email verification page
│   │   └── ...          # Other main pages
│   ├── globals.css      # Global CSS styles
│   └── layout.js        # Root layout
├── components/
│   ├── auth/            # Authentication components
│   │   ├── LoginForm.js
│   │   ├── SignupForm.js
│   │   └── VerifyEmail.js
│   ├── billing/         # Billing components
│   │   ├── PaymentForm.js
│   │   └── PlanSelection.js
│   ├── dashboard/       # Dashboard components
│   │   ├── Sidebar.js
│   │   ├── StatsOverview.js
│   │   └── RecentInvoices.js
│   ├── footer.js        # Global footer component
│   ├── layout.js        # General layout component (if needed)
│   ├── navigation.js    # Global navigation component
│   ├── pricing/         # Pricing components
│   │   ├── BillingToggle.js
│   │   └── PlanCard.js
│   ├── sections.js      # Reusable page sections
│   └── ui.js            # UI components
├── lib/
│   ├── metadata.js      # SEO metadata utilities
│   ├── supabaseClient.js# Supabase client
│   └── stripe.js        # Stripe integration
└── ...
```

## Component Structure

### Layout Components

- **MainLayout**: Wraps all pages within the (main) route group
- **DashboardLayout**: Specific layout for dashboard pages

### Page Components

Each page should:

1. Import and use shared components
2. Handle page-specific state
3. Connect to data sources if needed

### Shared Components

Components are organized by feature/domain to make them easier to find and maintain.

## Naming Conventions

- **Files**: Use camelCase for file names
- **Components**: Use PascalCase for component names
- **Directories**: Use camelCase for directory names
- **Consistent Naming Patterns**:
  - Page components: `page.js`
  - Layout components: `layout.js`
  - Route groups: `(groupName)`

## State Management

- Use React's built-in state management for component-level state
- Supabase for auth state and data fetching

## Styling Approach

- Using Tailwind CSS for styling
- Consistent color scheme and spacing

## Best Practices

1. Keep components focused on a single responsibility
2. Separate UI and logic concerns
3. Reuse components whenever possible
4. Maintain consistent naming and structure
5. Use Next.js features like layout and route groups effectively

## SEO Strategy

- Use metadata.js to define and maintain SEO metadata
- Implement page-specific metadata when needed
