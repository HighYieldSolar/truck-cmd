export const metadata = {
  title: 'IFTA Calculator & Reporting Software for Truckers',
  description: 'Simplify IFTA tax reporting with automatic fuel tax calculations. Track miles by state, calculate fuel tax liability, and generate quarterly reports. Supports all 48 IFTA jurisdictions plus Canada.',
  keywords: [
    'IFTA calculator',
    'IFTA reporting software',
    'fuel tax calculator trucking',
    'IFTA quarterly report generator',
    'trucker tax software',
    'IFTA mileage tracker',
    'fuel tax compliance',
    'IFTA filing software',
    'interstate fuel tax',
    'owner operator IFTA'
  ],
  openGraph: {
    title: 'IFTA Calculator & Reporting Software | Truck Command',
    description: 'Automatic IFTA fuel tax calculations for all 48 jurisdictions plus Canada. Generate quarterly reports in minutes.',
    url: 'https://truckcommand.com/features/ifta-calculator',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/ifta-calculator-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command IFTA Calculator - Automated fuel tax reporting',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IFTA Calculator & Reporting Software | Truck Command',
    description: 'Automatic IFTA fuel tax calculations for all 48 jurisdictions plus Canada. Generate quarterly reports in minutes.',
    images: ['/images/screenshots/ifta-calculator-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/ifta-calculator',
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
      name: 'How does the IFTA calculator work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simply enter your fuel purchases and miles driven by state. Our calculator automatically applies current tax rates for each jurisdiction and calculates your net tax liability or refund.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which states and provinces are supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All 48 contiguous US states plus 10 Canadian provinces that participate in IFTA. Tax rates are updated quarterly to ensure accurate calculations.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I generate my quarterly IFTA report?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Generate complete IFTA quarterly reports with one click. Reports include all required information for filing with your base jurisdiction.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it integrate with mileage tracking?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Miles from your state mileage tracker flow directly into IFTA calculations. Fuel purchases are also automatically pulled from your fuel tracker.',
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
      name: 'IFTA Calculator',
      item: 'https://truckcommand.com/features/ifta-calculator',
    },
  ],
};

export default function IFTACalculatorLayout({ children }) {
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
