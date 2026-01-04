import './globals.css';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { LanguageProvider } from '@/context/LanguageContext';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://truckcommand.com';

export const metadata = {
  // Basic metadata
  title: {
    default: 'Truck Command - Trucking Business Management Software',
    template: '%s | Truck Command',
  },
  description: 'Streamline your trucking operations with all-in-one software for invoicing, dispatching, expense tracking, IFTA calculations, fleet management, and compliance reporting. Start your free trial today.',
  keywords: [
    'trucking software',
    'fleet management',
    'trucking business management',
    'dispatching software',
    'trucking invoicing',
    'IFTA calculator',
    'fuel tracking',
    'DOT compliance',
    'expense tracking for truckers',
    'owner operator software',
    'trucking company management',
  ],
  authors: [{ name: 'Truck Command' }],
  creator: 'Truck Command',
  publisher: 'Truck Command',

  // Favicon and icons
  icons: {
    icon: [
      { url: '/images/TC_pfp.png', type: 'image/png', sizes: '32x32' },
      { url: '/images/TC_pfp.png', type: 'image/png', sizes: '192x192' },
      { url: '/images/TC_pfp.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/images/TC_pfp.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/images/TC_pfp.png',
  },

  // Open Graph - for Facebook, LinkedIn, etc.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Truck Command',
    title: 'Truck Command - Trucking Business Management Software',
    description: 'All-in-one trucking software for invoicing, dispatching, expense tracking, IFTA calculations, and fleet management. Join thousands of truckers simplifying their business.',
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Truck Command - Trucking Business Management Software',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Truck Command - Trucking Business Management Software',
    description: 'All-in-one trucking software for invoicing, dispatching, expense tracking, IFTA calculations, and fleet management.',
    images: [`${siteUrl}/images/og-image.png`],
    creator: '@truckcommand',
  },

  // Robots
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

  // Canonical URL
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },

  // Verification
  verification: {
    google: 'j0nlELrKJMR3F1Ol3dbZIaBCiOZXINJ8cWlAdrutDnU',
  },

  // App-specific
  applicationName: 'Truck Command',
  category: 'Business Software',
};

// Structured data for SEO (JSON-LD)
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Truck Command',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/TC.png`,
        width: 512,
        height: 512,
      },
      description: 'All-in-one trucking business management software for invoicing, dispatching, expense tracking, IFTA calculations, and fleet management.',
      foundingDate: '2025',
      sameAs: [
        // Add your social media URLs here
        // 'https://twitter.com/truckcommand',
        // 'https://facebook.com/truckcommand',
        // 'https://linkedin.com/company/truckcommand',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Truck Command',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      description: 'Trucking business management software',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Truck Command',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: '30-day free trial',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        ratingCount: '6',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Invoicing',
        'Dispatching',
        'Expense Tracking',
        'Fleet Management',
        'IFTA Calculator',
        'Fuel Tracking',
        'DOT Compliance',
        'Customer Management',
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <LanguageProvider>
          <SubscriptionProvider>
            <ThemeProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </ThemeProvider>
          </SubscriptionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}