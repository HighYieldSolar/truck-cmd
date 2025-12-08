export const metadata = {
  title: 'Trucking Expense Tracking Software - Track Business Expenses',
  description: 'Track all your trucking business expenses in one place. Categorize fuel, maintenance, insurance, and operating costs. Generate tax-ready reports and maximize deductions.',
  keywords: [
    'trucking expense tracker',
    'owner operator expense management',
    'trucker tax deductions',
    'fleet expense software',
    'trucking business expenses',
    'per diem tracker trucking',
    'fuel expense tracker',
    'trucking cost management',
    'transportation expense software',
    'truck driver expense app'
  ],
  openGraph: {
    title: 'Trucking Expense Tracking Software | Truck Command',
    description: 'Track all trucking expenses in one place. Categorize costs, generate tax-ready reports, and maximize deductions.',
    url: 'https://truckcommand.com/features/expense-tracking',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/expense-tracking-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command Expense Tracking - Business expense management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trucking Expense Tracking Software | Truck Command',
    description: 'Track all trucking expenses in one place. Categorize costs, generate tax-ready reports, and maximize deductions.',
    images: ['/images/screenshots/expense-tracking-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/expense-tracking',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// FAQ structured data for rich snippets
const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What expense categories are included?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Track fuel, maintenance, insurance, tolls, permits, equipment, office expenses, and more. Create custom categories to match your business needs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I attach receipts to expenses?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Upload photos of receipts directly from your phone. Keep all your documentation organized and ready for tax time or audits.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does it help with taxes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All expenses are categorized for easy tax preparation. Export reports by category, date range, or vehicle. Your accountant will thank you.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does fuel automatically sync from fuel tracker?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Fuel purchases logged in the fuel tracker automatically appear in your expenses. No double entry required.',
      },
    },
  ],
};

// Breadcrumb structured data
const breadcrumbStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://truckcommand.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Features',
      item: 'https://truckcommand.com/features',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Expense Tracking',
      item: 'https://truckcommand.com/features/expense-tracking',
    },
  ],
};

export default function ExpenseTrackingLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      {children}
    </>
  );
}
