export const metadata = {
  title: 'Fleet Management Software for Trucking - Track Vehicles & Drivers',
  description: 'Manage your trucking fleet efficiently. Track vehicles, monitor driver assignments, schedule maintenance, and manage vehicle documents. Perfect for small to medium trucking fleets.',
  keywords: [
    'fleet management software',
    'trucking fleet tracker',
    'vehicle management system',
    'driver management software',
    'fleet maintenance tracker',
    'truck fleet management',
    'commercial fleet software',
    'owner operator fleet',
    'small fleet management',
    'trucking asset management'
  ],
  openGraph: {
    title: 'Fleet Management Software | Track Vehicles & Drivers | Truck Command',
    description: 'Manage vehicles, drivers, and maintenance schedules. Complete fleet management for trucking companies.',
    url: 'https://truckcommand.com/features/fleet-tracking',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/fleet-management-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command Fleet Management - Vehicle and driver tracking',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fleet Management Software | Truck Command',
    description: 'Manage vehicles, drivers, and maintenance schedules. Complete fleet management for trucking.',
    images: ['/images/screenshots/fleet-management-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/fleet-tracking',
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
      name: 'What vehicle information can I track?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Track make, model, year, VIN, license plate, registration, insurance, inspection dates, and maintenance history for each vehicle in your fleet.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does driver management work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Store driver profiles with CDL information, medical card expiration, contact details, and document copies. Assign drivers to vehicles and track their load history.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I schedule maintenance reminders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Set maintenance schedules by miles or date. Get alerts for oil changes, inspections, tire rotations, and any custom maintenance items.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it integrate with compliance tracking?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Vehicle documents and driver qualifications flow into the compliance dashboard. See all expiring documents in one place with automated alerts.',
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
      name: 'Fleet Management',
      item: 'https://truckcommand.com/features/fleet-tracking',
    },
  ],
};

export default function FleetTrackingLayout({ children }) {
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
