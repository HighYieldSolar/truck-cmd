export const metadata = {
  title: 'State Mileage Tracker for Truckers - IFTA Mileage Reporting',
  description: 'Track miles driven in each state for IFTA reporting. Automatic state line detection, trip logging, and quarterly mileage reports for all 48 IFTA jurisdictions.',
  keywords: [
    'state mileage tracker',
    'IFTA mileage reporting',
    'trucking mileage log',
    'interstate mileage tracker',
    'state by state mileage',
    'IFTA jurisdiction tracking',
    'trucking trip log',
    'commercial mileage tracker',
    'fleet mileage management',
    'US state mileage'
  ],
  openGraph: {
    title: 'State Mileage Tracker for IFTA Reporting | Truck Command',
    description: 'Track miles by state for IFTA. Automatic state line detection and quarterly mileage reports.',
    url: 'https://truckcommand.com/features/state-mileage',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/state-mileage-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command State Mileage Tracker - IFTA mileage reporting',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'State Mileage Tracker | Truck Command',
    description: 'Track miles by state for IFTA. Automatic state line detection and quarterly reports.',
    images: ['/images/screenshots/state-mileage-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/state-mileage',
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
      name: 'How does state mileage tracking work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start a trip by entering your beginning location and odometer reading. As you cross state lines, log each entry point. The system calculates miles driven in each jurisdiction automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which jurisdictions are supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All 48 contiguous US states that participate in IFTA. Complete coverage for your interstate routes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this connect to my IFTA reporting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! All state mileage data flows directly into the IFTA calculator. Your quarterly reports are automatically populated with accurate mileage by jurisdiction.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I track multiple vehicles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Track mileage for your entire fleet. Each vehicle maintains its own trip history and jurisdiction breakdown for accurate IFTA reporting.',
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
      name: 'State Mileage',
      item: 'https://truckcommand.com/features/state-mileage',
    },
  ],
};

export default function StateMileageLayout({ children }) {
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
