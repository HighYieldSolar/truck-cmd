export const metadata = {
  title: 'Trucking Dispatch Software - Manage Loads & Drivers',
  description: 'Streamline your trucking dispatch operations. Track loads, assign drivers, manage routes, and monitor delivery status in real-time. Perfect for owner operators and small fleets.',
  keywords: [
    'trucking dispatch software',
    'load management system',
    'freight dispatch app',
    'trucking load board integration',
    'dispatch software for truckers',
    'owner operator dispatch',
    'fleet dispatch system',
    'truck load tracking',
    'transportation management software',
    'freight management system'
  ],
  openGraph: {
    title: 'Trucking Dispatch Software | Manage Loads Efficiently | Truck Command',
    description: 'Track loads, assign drivers, and monitor deliveries in real-time. Streamline your trucking dispatch operations.',
    url: 'https://truckcommand.com/features/dispatching',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/screenshots/dispatching-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Truck Command Dispatch Software - Load management dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trucking Dispatch Software | Truck Command',
    description: 'Track loads, assign drivers, and monitor deliveries in real-time. Perfect for owner operators and small fleets.',
    images: ['/images/screenshots/dispatching-dashboard.png'],
  },
  alternates: {
    canonical: 'https://truckcommand.com/features/dispatching',
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
      name: 'How do I add a new load?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click "Add Load" and enter pickup/delivery locations, dates, rate, and customer. Assign a driver and truck, then track the load through completion.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I track loads in real-time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! See all your loads on a visual board organized by status - Pending, In Transit, and Delivered. Filter by driver, customer, or date range.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it integrate with load boards?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our dispatch system is designed to work alongside your favorite load boards. Quickly enter load details from any source and track them in one central location.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when a load is completed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mark loads as delivered, capture proof of delivery, and instantly generate an invoice. All load data flows to your financial reports automatically.',
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
      name: 'Dispatching',
      item: 'https://truckcommand.com/features/dispatching',
    },
  ],
};

export default function DispatchingLayout({ children }) {
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
