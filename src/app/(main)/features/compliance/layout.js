export const metadata = {
  title: 'Trucking Compliance Management Software - DOT & FMCSA Compliance',
  description: 'Stay DOT and FMCSA compliant with automated document tracking. Monitor CDL expirations, medical cards, vehicle inspections, and insurance renewals. Never miss a compliance deadline.',
  keywords: [
    'trucking compliance software',
    'DOT compliance management',
    'FMCSA compliance tracker',
    'CDL expiration tracking',
    'fleet compliance software',
    'trucking document management',
    'driver qualification files',
    'DOT inspection tracking',
    'commercial driver compliance',
    'trucking safety compliance'
  ],
  openGraph: {
    title: 'Trucking Compliance Management Software | Truck Command',
    description: 'Stay DOT and FMCSA compliant with automated document tracking. Never miss a compliance deadline.',
    url: 'https://truckcommand.com/features/compliance',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/compliance-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command Compliance Management - DOT compliance tracking',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trucking Compliance Management Software | Truck Command',
    description: 'Stay DOT and FMCSA compliant with automated document tracking. Never miss a compliance deadline.',
    images: ['/images/screenshots/compliance-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/compliance',
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
      name: 'What documents can I track?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Track CDL licenses, medical cards, vehicle registrations, insurance policies, annual inspections, permits, and any other documents with expiration dates.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do expiration alerts work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Set custom alert windows (30, 60, 90 days) for each document type. Receive notifications before documents expire so you never miss a renewal.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I store copies of documents?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Upload PDF or image copies of all your compliance documents. Access them anytime from your dashboard or mobile device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this compliant with DOT requirements?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our system helps you maintain proper driver qualification files and vehicle documentation as required by FMCSA regulations. Always consult current regulations for specific requirements.',
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
      name: 'Compliance',
      item: 'https://truckcommand.com/features/compliance',
    },
  ],
};

export default function ComplianceLayout({ children }) {
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
