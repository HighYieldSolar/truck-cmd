// Default metadata for the site
const defaultMetadata = {
  title: 'Truck Command - Trucking Business Management Software',
  description: 'Streamline your trucking operations with invoicing, dispatching, expense tracking, and more.',
  keywords: 'trucking software, fleet management, trucking business, IFTA calculator, load management',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://truckcommand.com',
    siteName: 'Truck Command',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Truck Command - Trucking Business Management Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@truckcommand',
  },
};

// Helper function to merge default metadata with page-specific metadata
export function createMetadata(pageMetadata = {}) {
  return {
    ...defaultMetadata,
    ...pageMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      ...pageMetadata.openGraph,
    },
    twitter: {
      ...defaultMetadata.twitter,
      ...pageMetadata.twitter,
    },
  };
}

// Predefined metadata for common pages
export const pageMetadata = {
  home: createMetadata({
    title: 'Truck Command - Simplify Your Trucking Business',
    description: 'Manage invoices, expenses, dispatching, IFTA calculations, and customer relationships—all in one easy-to-use platform.',
  }),
  
  login: createMetadata({
    title: 'Login to Truck Command | Trucking Business Management Software',
    description: 'Sign in to your Truck Command account to manage your trucking business efficiently.',
  }),
  
  signup: createMetadata({
    title: 'Sign Up for Truck Command | Start Your Free Trial',
    description: 'Create your Truck Command account and start your 7-day free trial. No credit card required.',
  }),
  
  pricing: createMetadata({
    title: 'Truck Command Pricing | Plans for Every Trucking Business',
    description: 'Choose the right Truck Command plan for your trucking business. Simple, transparent pricing with no hidden fees.',
  }),
  
  dashboard: createMetadata({
    title: 'Truck Command Dashboard | Manage Your Trucking Business',
    description: 'Your command center for tracking earnings, expenses, and managing your trucking operations.',
  }),
  
  invoicing: createMetadata({
    title: 'Trucking Invoicing Software | Truck Command',
    description: 'Create professional invoices, track payments, and get paid faster with our easy-to-use invoicing system for trucking companies.',
  }),
};