# Truck Command SEO Strategy Report

## Executive Summary

This comprehensive SEO report analyzes the current state of Truck Command's landing pages and provides a detailed action plan to achieve top Google search rankings. Your site already has a solid foundation with metadata, structured data, sitemap, and robots.txt. However, there are significant opportunities to improve, particularly with page-specific metadata and keyword targeting.

---

## Table of Contents

1. [Current SEO Audit](#1-current-seo-audit)
2. [Critical Issues to Fix](#2-critical-issues-to-fix)
3. [Keyword Strategy](#3-keyword-strategy)
4. [Technical SEO Recommendations](#4-technical-seo-recommendations)
5. [On-Page SEO for Each Feature Page](#5-on-page-seo-for-each-feature-page)
6. [Content Optimization](#6-content-optimization)
7. [Implementation Priority](#7-implementation-priority)
8. [Monitoring & Analytics](#8-monitoring--analytics)

---

## 1. Current SEO Audit

### What's Working Well

| Element | Status | Notes |
|---------|--------|-------|
| Root Metadata | Good | Title, description, keywords defined |
| Open Graph | Good | Facebook/LinkedIn sharing configured |
| Twitter Cards | Good | Large image card type |
| JSON-LD Structured Data | Good | Organization, WebSite, SoftwareApplication |
| Sitemap | Good | Dynamic sitemap.js includes all pages |
| Robots.txt | Good | Properly blocks /dashboard/ and /api/ |
| Google Verification | Good | Search Console verified |
| Canonical URLs | Good | metadataBase configured |

### Critical Gaps Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| Feature pages lack unique metadata | HIGH | All feature pages share same title/description |
| Pages use "use client" without metadata export | HIGH | Search engines may not see optimized meta tags |
| No FAQ structured data | MEDIUM | Missing rich snippet opportunities |
| No breadcrumb structured data | MEDIUM | Missing navigation rich snippets |
| Missing alt text on images | MEDIUM | Accessibility and image SEO |
| No local business schema | LOW | Missing local SEO signals |

---

## 2. Critical Issues to Fix

### Issue #1: Feature Pages Missing Unique Metadata (HIGHEST PRIORITY)

**Problem:** All feature pages are client components ("use client") and don't export their own metadata. This means they all use the default title "Truck Command - Trucking Business Management Software".

**Solution:** Create separate metadata files for each feature page.

**Example Implementation for `/features/invoicing/page.js`:**

Create a new file: `src/app/(main)/features/invoicing/metadata.js`
```javascript
export const metadata = {
  title: 'Trucking Invoice Software | Create Professional Invoices',
  description: 'Generate professional trucking invoices in minutes. Track payments, send automated reminders, and get paid faster. Free trial for owner-operators.',
  keywords: ['trucking invoice software', 'trucking invoicing', 'freight invoice generator', 'owner operator invoicing', 'trucking billing software'],
  openGraph: {
    title: 'Trucking Invoice Software | Truck Command',
    description: 'Generate professional trucking invoices in minutes. Track payments and get paid faster.',
    url: 'https://truckcommand.com/features/invoicing',
    images: ['/images/features/invoicing-og.png'],
  },
  alternates: {
    canonical: '/features/invoicing',
  },
};
```

Then update the page structure:
```
/features/invoicing/
  ├── layout.js      # Contains metadata export
  └── page.js        # Client component with "use client"
```

### Issue #2: Missing Page-Specific Structured Data

**Problem:** Only global structured data exists. Each feature page should have its own schema.

**Solution:** Add FAQ schema to each feature page (appears in Google as expandable Q&A).

```javascript
// Add to each feature page layout
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does trucking invoice software work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Trucking invoice software allows you to create professional invoices..."
      }
    }
    // Add all FAQ items
  ]
};
```

---

## 3. Keyword Strategy

### Primary Keywords by Page

Based on trucking industry search patterns, here are the recommended target keywords:

#### Homepage
| Primary Keyword | Search Intent | Difficulty |
|----------------|---------------|------------|
| trucking software | Commercial | High |
| trucking business management software | Commercial | Medium |
| owner operator software | Commercial | Medium |
| fleet management software small business | Commercial | Medium |

#### Feature Pages

| Page | Primary Keyword | Secondary Keywords |
|------|-----------------|-------------------|
| **Invoicing** | trucking invoice software | freight invoice generator, trucking billing software, owner operator invoicing |
| **Dispatching** | trucking dispatch software | load board software, freight dispatching, truck dispatch system |
| **IFTA Calculator** | IFTA calculator | IFTA fuel tax calculator, IFTA reporting software, quarterly IFTA filing |
| **Expense Tracking** | trucking expense tracker | owner operator expense tracking, trucking tax deductions, per diem tracker |
| **Compliance** | trucking compliance software | DOT compliance tracker, trucking document management, CDL tracking |
| **Fuel Tracker** | trucking fuel tracker | fuel tax tracking, MPG calculator trucking, diesel fuel log |
| **State Mileage** | state mileage tracker IFTA | IFTA mileage reporting, state by state mileage, fuel tax mileage |
| **Fleet Management** | small fleet management software | truck fleet tracker, fleet maintenance software, driver management |
| **Customer CRM** | trucking CRM software | freight broker CRM, shipper management, trucking customer database |

### Long-Tail Keywords to Target

These lower-competition keywords can drive qualified traffic:

1. "free trucking invoice template" → Lead to invoicing feature
2. "how to calculate IFTA fuel tax" → Lead to IFTA calculator
3. "owner operator expense tracking spreadsheet" → Lead to expense tracking
4. "trucking compliance checklist" → Lead to compliance feature
5. "best software for small trucking company" → Lead to homepage
6. "fleet management for 5 trucks" → Lead to fleet management
7. "fuel tax reporting for owner operators" → Lead to fuel tracker
8. "trucking business startup software" → Lead to pricing/homepage

### Keyword Implementation Checklist

For each page, ensure keywords appear in:
- [ ] Title tag (primary keyword near beginning)
- [ ] Meta description (primary + secondary keyword)
- [ ] H1 heading (primary keyword, natural phrasing)
- [ ] First paragraph of content
- [ ] At least one H2 subheading
- [ ] Image alt text
- [ ] URL slug (already done)

---

## 4. Technical SEO Recommendations

### 4.1 Page-Level Metadata Structure

Create this file structure for each feature:

```
src/app/(main)/features/[feature-name]/
├── layout.js      # Server component with metadata export
├── page.js        # Client component ("use client")
└── schema.js      # JSON-LD structured data
```

**Example layout.js:**
```javascript
import { generateFeatureMetadata } from '@/lib/seo/featureMetadata';
import FeatureSchema from './schema';

export const metadata = generateFeatureMetadata('invoicing');

export default function InvoicingLayout({ children }) {
  return (
    <>
      <FeatureSchema />
      {children}
    </>
  );
}
```

### 4.2 Core Web Vitals Optimization

| Metric | Target | Current Actions Needed |
|--------|--------|----------------------|
| LCP (Largest Contentful Paint) | < 2.5s | Optimize hero images, use next/image |
| FID (First Input Delay) | < 100ms | Minimize JS bundle size |
| CLS (Cumulative Layout Shift) | < 0.1 | Add width/height to images |

**Recommended Actions:**
1. Replace all placeholder divs with actual `<Image>` components with defined dimensions
2. Use `priority` attribute on above-the-fold images
3. Implement font-display: swap for custom fonts
4. Add `loading="lazy"` to below-fold images

### 4.3 URL Structure

Current URL structure is good:
- `/features/invoicing`
- `/features/ifta-calculator`
- `/features/expense-tracking`

**Recommendation:** Create alternate URL paths for keyword targeting:
- `/trucking-invoice-software` → redirect or canonical to `/features/invoicing`
- `/ifta-fuel-tax-calculator` → redirect or canonical to `/features/ifta-calculator`

### 4.4 Internal Linking Strategy

Add contextual internal links between related features:

| From Page | Link To | Anchor Text |
|-----------|---------|-------------|
| Invoicing | Dispatching | "dispatch and invoice management" |
| IFTA Calculator | Fuel Tracker | "fuel purchase tracking" |
| IFTA Calculator | State Mileage | "state mileage tracking" |
| Fleet Management | Compliance | "compliance document tracking" |
| Expense Tracking | Fuel Tracker | "fuel expense tracking" |
| Expense Tracking | Fleet Management | "per-vehicle expense tracking" |

---

## 5. On-Page SEO for Each Feature Page

### 5.1 Invoicing Page

**Target Keyword:** "trucking invoice software"

```javascript
export const metadata = {
  title: 'Trucking Invoice Software - Create Professional Invoices | Truck Command',
  description: 'Generate professional trucking invoices in under 2 minutes. Automated payment tracking, email delivery, and PDF export. Start your free trial today.',
  keywords: ['trucking invoice software', 'freight invoice generator', 'trucking billing', 'owner operator invoice'],
  openGraph: {
    title: 'Trucking Invoice Software | Get Paid Faster',
    description: 'Create professional invoices, track payments, and get paid faster with automated reminders.',
  },
};
```

**H1:** "Professional Trucking Invoice Software"
**H2s to include:**
- "Create Invoices in Under 2 Minutes"
- "Track Payments & Send Reminders"
- "Professional PDF Invoices"

---

### 5.2 IFTA Calculator Page

**Target Keyword:** "IFTA calculator"

```javascript
export const metadata = {
  title: 'Free IFTA Calculator - Quarterly Fuel Tax Reporting | Truck Command',
  description: 'Calculate your IFTA fuel tax in minutes. Automatic state-by-state mileage and fuel calculations. Export quarterly IFTA reports instantly.',
  keywords: ['IFTA calculator', 'IFTA fuel tax calculator', 'IFTA reporting software', 'quarterly IFTA'],
  openGraph: {
    title: 'Free IFTA Calculator | Truck Command',
    description: 'Calculate your quarterly IFTA fuel tax in minutes. Automatic mileage tracking and reporting.',
  },
};
```

**H1:** "IFTA Calculator - Simplify Your Fuel Tax Reporting"
**H2s to include:**
- "How the IFTA Calculator Works"
- "Automatic State-by-State Calculations"
- "Export IFTA Reports Instantly"

---

### 5.3 Expense Tracking Page

**Target Keyword:** "trucking expense tracker"

```javascript
export const metadata = {
  title: 'Trucking Expense Tracker - Maximize Tax Deductions | Truck Command',
  description: 'Track all your trucking expenses in one place. Categorize expenses, attach receipts, and export tax-ready reports. Never miss a deduction.',
  keywords: ['trucking expense tracker', 'owner operator expenses', 'trucking tax deductions', 'per diem tracker'],
  openGraph: {
    title: 'Trucking Expense Tracker | Never Miss a Deduction',
    description: 'Track expenses, attach receipts, and maximize your tax deductions.',
  },
};
```

---

### 5.4 Compliance Page

**Target Keyword:** "trucking compliance software"

```javascript
export const metadata = {
  title: 'Trucking Compliance Software - Never Miss an Expiration | Truck Command',
  description: 'Track all DOT compliance documents in one place. Automated expiration alerts for licenses, insurance, and medical cards. Stay compliant effortlessly.',
  keywords: ['trucking compliance software', 'DOT compliance tracker', 'CDL tracking', 'trucking document management'],
  openGraph: {
    title: 'Trucking Compliance Software | Stay DOT Ready',
    description: 'Track documents, get expiration alerts, and stay compliant without the stress.',
  },
};
```

---

### 5.5 Fuel Tracker Page

**Target Keyword:** "trucking fuel tracker"

```javascript
export const metadata = {
  title: 'Trucking Fuel Tracker - Log Fuel & Calculate MPG | Truck Command',
  description: 'Track fuel purchases by state for IFTA compliance. Calculate MPG, monitor fuel costs, and export fuel tax reports. Integrated with IFTA calculator.',
  keywords: ['trucking fuel tracker', 'fuel tax tracking', 'trucker MPG calculator', 'diesel fuel log'],
  openGraph: {
    title: 'Trucking Fuel Tracker | IFTA-Ready Fuel Logging',
    description: 'Track fuel purchases, calculate MPG, and simplify IFTA reporting.',
  },
};
```

---

### 5.6 State Mileage Page

**Target Keyword:** "state mileage tracker IFTA"

```javascript
export const metadata = {
  title: 'State Mileage Tracker for IFTA - Track Miles by Jurisdiction | Truck Command',
  description: 'Track state-by-state mileage for accurate IFTA reporting. Record border crossings, calculate miles automatically, and export IFTA-ready reports.',
  keywords: ['state mileage tracker', 'IFTA mileage', 'miles by state trucking', 'IFTA mileage reporting'],
  openGraph: {
    title: 'State Mileage Tracker | IFTA Mileage Made Easy',
    description: 'Track miles by jurisdiction for accurate IFTA quarterly filings.',
  },
};
```

---

### 5.7 Fleet Management Page

**Target Keyword:** "small fleet management software"

```javascript
export const metadata = {
  title: 'Small Fleet Management Software - Trucks, Drivers & Maintenance | Truck Command',
  description: 'Manage your entire fleet in one place. Track vehicles, drivers, and maintenance schedules. Perfect for fleets of 1-50 trucks.',
  keywords: ['small fleet management software', 'truck fleet tracker', 'fleet maintenance software', 'driver management'],
  openGraph: {
    title: 'Small Fleet Management Software | Truck Command',
    description: 'Track vehicles, manage drivers, and schedule maintenance all in one platform.',
  },
};
```

---

### 5.8 Customer CRM Page

**Target Keyword:** "trucking CRM software"

```javascript
export const metadata = {
  title: 'Trucking CRM Software - Manage Brokers & Shippers | Truck Command',
  description: 'Keep all your trucking customers organized. Track brokers, shippers, and contacts. See your top customers and grow your business.',
  keywords: ['trucking CRM software', 'freight broker CRM', 'shipper management', 'trucking customer database'],
  openGraph: {
    title: 'Trucking CRM Software | Grow Your Customer Base',
    description: 'Organize brokers and shippers, track relationships, and identify your best customers.',
  },
};
```

---

### 5.9 Dispatching Page

**Target Keyword:** "trucking dispatch software"

```javascript
export const metadata = {
  title: 'Trucking Dispatch Software - Manage Loads & Deliveries | Truck Command',
  description: 'Streamline your trucking dispatch operations. Manage loads, track deliveries, and optimize routes. Built for owner-operators and small fleets.',
  keywords: ['trucking dispatch software', 'load management', 'freight dispatching', 'truck dispatch system'],
  openGraph: {
    title: 'Trucking Dispatch Software | Truck Command',
    description: 'Manage loads, track deliveries, and streamline your dispatch operations.',
  },
};
```

---

## 6. Content Optimization

### 6.1 Add FAQ Structured Data

Each feature page has FAQ sections. Add JSON-LD FAQ schema to enable rich snippets:

```javascript
// src/lib/seo/faqSchema.js
export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
```

### 6.2 Add Breadcrumb Structured Data

```javascript
// src/lib/seo/breadcrumbSchema.js
export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Usage for Invoicing page:
const breadcrumbs = [
  { name: "Home", url: "https://truckcommand.com" },
  { name: "Features", url: "https://truckcommand.com/features" },
  { name: "Invoicing", url: "https://truckcommand.com/features/invoicing" }
];
```

### 6.3 Add Product Review Schema

Update the SoftwareApplication schema with actual reviews:

```javascript
{
  "@type": "SoftwareApplication",
  "name": "Truck Command",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "127",
    "bestRating": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Mike T." },
      "reviewRating": { "@type": "Rating", "ratingValue": "5" },
      "reviewBody": "Best trucking software I've used. The IFTA calculator alone saves me hours."
    }
  ]
}
```

### 6.4 Image Optimization

Replace all ScreenshotPlaceholder components with real images:

```javascript
// Instead of:
<ScreenshotPlaceholder title="Invoice List" />

// Use:
<Image
  src="/images/features/invoicing/invoice-list.webp"
  alt="Truck Command invoice list showing payment status and quick actions"
  width={800}
  height={500}
  loading="lazy"
  className="rounded-2xl shadow-lg"
/>
```

**Image naming convention:**
- `/images/features/invoicing/invoice-list.webp`
- `/images/features/invoicing/create-invoice.webp`
- `/images/features/ifta-calculator/quarterly-report.webp`

---

## 7. Implementation Priority

### Phase 1: Critical (Week 1)

1. **Create layout.js with metadata for each feature page**
   - Invoicing
   - IFTA Calculator
   - Dispatching
   - Expense Tracking

2. **Add FAQ schema to each feature page**

3. **Verify all images have alt text**

### Phase 2: High Priority (Week 2)

4. **Add remaining feature page metadata**
   - Compliance
   - Fuel Tracker
   - State Mileage
   - Fleet Management
   - Customer CRM

5. **Add breadcrumb schema**

6. **Create and add real screenshots** (replace placeholders)

### Phase 3: Optimization (Week 3-4)

7. **Add review schema with real testimonials**

8. **Create blog/resource section** for long-tail keyword targeting

9. **Implement internal linking strategy**

10. **Set up Google Search Console monitoring**

### Phase 4: Ongoing

11. **Create content calendar** for regular updates

12. **Monitor rankings and adjust**

13. **Build backlinks** through trucking industry resources

---

## 8. Monitoring & Analytics

### Google Search Console Setup

Track these queries for each feature page:

| Page | Queries to Monitor |
|------|-------------------|
| Invoicing | trucking invoice, freight invoice, trucking billing |
| IFTA | IFTA calculator, fuel tax calculator, IFTA reporting |
| Expenses | trucking expenses, owner operator deductions |
| Fleet | fleet management, fleet tracking software |

### Key Metrics to Track

1. **Organic Search Traffic** - Google Analytics
2. **Keyword Rankings** - Search Console or SEMrush
3. **Click-Through Rate (CTR)** - Search Console
4. **Core Web Vitals** - PageSpeed Insights
5. **Indexed Pages** - Search Console Coverage report

### Monthly Review Checklist

- [ ] Check Search Console for crawl errors
- [ ] Review top queries and optimize underperforming pages
- [ ] Monitor Core Web Vitals scores
- [ ] Check for any 404 errors
- [ ] Review competitor rankings

---

## Sources & References

- [SaaS Technical SEO Guide](https://www.wetalkthetalk.co/blog/saas-technical-seo)
- [SEO for Landing Pages Best Practices](https://analytify.io/seo-landing-page/)
- [On-Page SEO for SaaS 2025](https://www.flowversity.tech/blog/on-page-seo-best-practices-for-saas-homepages-and-landing-pages-in-2025)
- [Next.js SEO Metadata](https://nextjs.org/learn/seo/metadata)
- [Next.js 15 SEO Checklist](https://dev.to/vrushikvisavadiya/nextjs-15-seo-checklist-for-developers-in-2025-with-code-examples-57i1)
- [Trucking SEO Strategy](https://www.truckingmarketing.com/blog/use-this-simple-trucking-seo-strategy-to-increase-google-search-traffic)
- [SEO for Logistics Companies](https://www.virayo.com/blog/seo-for-logistics)

---

## Next Steps

1. Review this report and approve the keyword strategy
2. Begin Phase 1 implementation (feature page metadata)
3. Schedule weekly SEO reviews
4. Consider hiring a photographer/designer for real screenshots

This SEO strategy, when fully implemented, positions Truck Command to rank for high-intent trucking software keywords and capture qualified leads actively searching for these solutions.
