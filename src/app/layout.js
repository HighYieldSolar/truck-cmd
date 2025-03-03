// This file sets up the Root Layout for the entire application
// It's the only required file in the app/ directory

import './globals.css';
import { Inter } from 'next/font/google';

// Use Inter font with Latin subset
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Truck Command - Trucking Business Management Software',
  description: 'Streamline your trucking operations with invoicing, dispatching, expense tracking, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}