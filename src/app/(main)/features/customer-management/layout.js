export const metadata = {
  title: 'Trucking CRM Software - Customer & Broker Management',
  description: 'Manage customers, brokers, and shippers in one place. Track contact information, view load history, identify top customers, and grow your trucking business relationships.',
  keywords: [
    'trucking CRM software',
    'freight customer management',
    'broker management system',
    'trucking customer database',
    'shipper management software',
    'logistics CRM',
    'transportation customer tracking',
    'freight broker CRM',
    'trucking business contacts',
    'carrier customer management'
  ],
  openGraph: {
    title: 'Trucking CRM Software | Customer Management | Truck Command',
    description: 'Manage customers, brokers, and shippers. Track contacts, view load history, and grow business relationships.',
    url: 'https://truckcommand.com/features/customer-management',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/customer-management-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command CRM - Customer and broker management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trucking CRM Software | Truck Command',
    description: 'Manage customers, brokers, and shippers. Track contacts and grow business relationships.',
    images: ['/images/screenshots/customer-management-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/customer-management',
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
      name: 'What customer information can I store?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Store company name, contact person, phone, email, address, MC number, payment terms, and notes. Track whether they\'re a broker, shipper, or both.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I see load history by customer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! View all past loads, invoices, and revenue for each customer. Quickly identify your top customers and most profitable relationships.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does it help with repeat business?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Keep detailed notes on customer preferences and past interactions. When they call with a load, instantly pull up their history and rate information.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I export my customer list?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Export your entire customer database to CSV for backup, marketing campaigns, or importing into other systems.',
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
      name: 'Customer Management',
      item: 'https://truckcommand.com/features/customer-management',
    },
  ],
};

export default function CustomerManagementLayout({ children }) {
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
