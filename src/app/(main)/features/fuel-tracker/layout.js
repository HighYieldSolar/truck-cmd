export const metadata = {
  title: 'Trucking Fuel Tracker - Monitor Fuel Costs & MPG',
  description: 'Track fuel purchases, monitor MPG, and optimize fuel costs. Automatic IFTA integration, receipt photo storage, and fuel expense categorization for tax purposes.',
  keywords: [
    'trucking fuel tracker',
    'fuel cost management',
    'trucker fuel log',
    'MPG tracker trucking',
    'fuel receipt tracker',
    'diesel fuel tracker',
    'fleet fuel management',
    'fuel expense tracker',
    'IFTA fuel tracking',
    'trucking fuel efficiency'
  ],
  openGraph: {
    title: 'Trucking Fuel Tracker | Monitor Fuel Costs | Truck Command',
    description: 'Track fuel purchases, monitor MPG, and optimize fuel costs. Automatic IFTA integration and receipt storage.',
    url: 'https://truckcommand.com/features/fuel-tracker',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/fuel-tracker-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command Fuel Tracker - Fuel cost management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trucking Fuel Tracker | Truck Command',
    description: 'Track fuel purchases, monitor MPG, and optimize fuel costs. Automatic IFTA integration.',
    images: ['/images/screenshots/fuel-tracker-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/fuel-tracker',
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
      name: 'How do I log a fuel purchase?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Enter the date, location (state), gallons, price per gallon, and total cost. Optionally upload a receipt photo. The entry automatically syncs with IFTA and expenses.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it calculate my MPG?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Track fuel efficiency over time with automatic MPG calculations. Monitor trends by vehicle, route, or time period to optimize your fuel costs.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does it integrate with IFTA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every fuel purchase is tagged with the state of purchase and automatically flows into your IFTA calculations. No manual re-entry required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I track fuel for multiple vehicles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Track fuel purchases for your entire fleet. Filter reports by vehicle to see individual fuel costs and efficiency metrics.',
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
      name: 'Fuel Tracker',
      item: 'https://truckcommand.com/features/fuel-tracker',
    },
  ],
};

export default function FuelTrackerLayout({ children }) {
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
