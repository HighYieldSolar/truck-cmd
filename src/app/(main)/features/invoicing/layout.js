export const metadata = {
  title: 'Trucking Invoice Software - Create Professional Invoices in Minutes',
  description: 'Generate professional trucking invoices in under 2 minutes. Automated payment tracking, email delivery, PDF export, and QuickBooks-ready formats. Start your free trial today.',
  keywords: [
    'trucking invoice software',
    'freight invoice generator',
    'trucking billing software',
    'owner operator invoicing',
    'transportation invoice template',
    'trucking invoice app',
    'freight billing system',
    'truck driver invoice software',
    'hauling invoice generator',
    'load invoice creator'
  ],
  openGraph: {
    title: 'Trucking Invoice Software | Get Paid Faster | Truck Command',
    description: 'Create professional trucking invoices in under 2 minutes. Track payments, send by email, and export to PDF or QuickBooks.',
    url: 'https://truckcommand.com/features/invoicing',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/invoicing-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command Invoicing Dashboard - Professional trucking invoice software',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trucking Invoice Software | Get Paid Faster',
    description: 'Create professional trucking invoices in under 2 minutes. Track payments, send by email, and export to PDF.',
    images: ['/images/screenshots/invoicing-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/invoicing',
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
      name: 'How long does it take to create an invoice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most invoices can be created in under 2 minutes. If you\'re invoicing a completed load, simply click "Create Invoice" and all the details are pre-filled automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I customize my invoice template?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Your company name, logo, address, and payment terms are automatically included on every invoice. You can also add custom notes and payment instructions.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment tracking features are included?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Track invoice status (sent, viewed, paid), set payment due dates, send payment reminders, and see your accounts receivable aging report at a glance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I export invoices for my accountant?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Export individual invoices as PDFs or bulk export your invoice data to CSV for QuickBooks, Excel, or any accounting software.',
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
      name: 'Invoicing',
      item: 'https://truckcommand.com/features/invoicing',
    },
  ],
};

export default function InvoicingLayout({ children }) {
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
