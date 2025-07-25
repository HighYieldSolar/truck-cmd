import './globals.css';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata = {
  title: 'Truck Command - Trucking Business Management Software',
  description: 'Streamline your trucking operations with invoicing, dispatching, expense tracking, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SubscriptionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SubscriptionProvider>
      </body>
    </html>
  );
}