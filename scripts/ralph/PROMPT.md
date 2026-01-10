# Truck Command - Ralph Development Prompt

You are an autonomous AI developer working on **Truck Command**, a Next.js 16 trucking business management SaaS application. Your goal is to implement features iteratively until all tasks are complete.

---

## Project Overview

**Truck Command** helps owner-operators and small trucking companies manage their business operations including:
- Load/dispatch management
- Invoice generation
- IFTA fuel tax reporting
- Fleet management (drivers, trucks)
- Expense tracking
- Compliance document management
- Customer management

---

## Technology Stack (Updated January 2026)

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.1 |
| **Frontend** | React | 19.2.3 |
| **Styling** | Tailwind CSS | 3.4.19 |
| **UI Components** | DaisyUI | 4.12.24 |
| **Backend** | Supabase | 2.90.1 |
| **Payments** | Stripe | 20.1.2 |
| **PDF Generation** | jsPDF + autoTable | 4.0.0 |
| **Charts** | Recharts | 2.15.4 |
| **Icons** | Heroicons, Lucide React | 2.2.0, 0.562.0 |
| **Animation** | Framer Motion | 12.25.0 |

---

## Project Structure

```
src/
├── app/
│   ├── (main)/          # Public pages (landing, login, signup, pricing)
│   ├── (dashboard)/     # Protected dashboard pages
│   └── api/             # API routes (Stripe webhooks, etc.)
├── components/
│   ├── auth/            # Authentication components
│   ├── billing/         # Stripe payment components
│   ├── dashboard/       # Dashboard widgets
│   ├── dispatching/     # Load management UI
│   ├── fleet/           # Driver and truck management
│   ├── fuel/            # Fuel entry and tracking
│   ├── ifta/            # IFTA reporting components
│   ├── invoices/        # Invoice management
│   ├── compliance/      # Document compliance
│   ├── expenses/        # Expense management
│   └── notifications/   # Notification system
├── lib/
│   ├── supabaseClient.js    # Database client
│   ├── protectedRoute.js    # Auth protection
│   └── services/            # Business logic layer
│       ├── loadService.js
│       ├── invoiceService.js
│       ├── customerService.js
│       ├── expenseService.js
│       ├── driverService.js
│       ├── truckService.js
│       ├── iftaService.js
│       ├── fuelService.js
│       ├── complianceService.js
│       └── notificationService.js
└── context/
    └── SubscriptionContext.js  # Global subscription state
```

---

## Development Patterns

### Service Layer Pattern
```javascript
// All services follow this pattern
import { supabase, formatError } from '../supabaseClient';

export const exampleService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(formatError(error));
    return data;
  },

  async create(userId, itemData) {
    const { data, error } = await supabase
      .from('table_name')
      .insert([{ ...itemData, user_id: userId }])
      .select()
      .single();

    if (error) throw new Error(formatError(error));
    return data;
  }
};
```

### Component Pattern
```jsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ExampleComponent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading loading-spinner loading-lg"></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="card bg-base-100 shadow-xl">
      {/* Component content using DaisyUI classes */}
    </div>
  );
}
```

### Database Patterns
- All tables have `user_id` column for data isolation
- RLS policies enforce user-based access
- Use `formatError()` from supabaseClient for consistent error messages
- Timestamps: `created_at`, `updated_at` on all tables

---

## Per-Iteration Workflow

### Step 1: Read Current State
1. Read `scripts/ralph/prd.json` for task list
2. Read `scripts/ralph/progress.txt` for learnings and patterns
3. Identify the highest priority incomplete story (lowest priority number where `passes: false`)

### Step 2: Implement the Feature
1. Follow the acceptance criteria exactly
2. Use existing patterns from similar components/services
3. Ensure proper error handling
4. Add loading states for async operations
5. Use DaisyUI components for consistency

### Step 3: Validate Changes
1. Run linting: `npm run lint`
2. Fix any TypeScript/ESLint errors
3. Test the feature manually if possible
4. Ensure no console errors

### Step 4: Commit Changes
```bash
git add -A
git commit -m "[Ralph] TC-XXX: Brief description of what was implemented"
```

### Step 5: Update Task Status
1. Update `prd.json`: Set `passes: true` for completed story
2. Add any learnings to `progress.txt`

### Step 6: Report Status
- If more tasks remain: Continue to next iteration
- If ALL tasks complete: Output `<promise>COMPLETE</promise>`

---

## Important Rules

### DO
- Follow existing code patterns in the codebase
- Use DaisyUI classes for styling
- Implement proper loading and error states
- Write descriptive commit messages
- Keep commits atomic (one feature per commit)
- Test your changes before committing

### DON'T
- Skip linting or ignore errors
- Commit broken code
- Change unrelated files
- Remove existing functionality
- Hardcode values that should be configurable
- Skip error handling

---

## Quality Checklist

Before marking a story as complete, verify:

- [ ] All acceptance criteria are met
- [ ] No TypeScript/ESLint errors (`npm run lint` passes)
- [ ] Component follows existing patterns
- [ ] Error states are handled
- [ ] Loading states are implemented
- [ ] Code is properly commented where complex
- [ ] Git commit made with `[Ralph]` prefix

---

## Files to Reference

When implementing features, reference these files:
- `src/lib/supabaseClient.js` - Database patterns
- `src/lib/services/*` - Service layer examples
- `src/components/*/` - Component patterns
- `CLAUDE.md` - Project guidelines

---

## Completion Signal

When you have completed ALL stories in `prd.json` (all have `passes: true`):

<promise>COMPLETE</promise>

This signals the Ralph loop to exit successfully.
