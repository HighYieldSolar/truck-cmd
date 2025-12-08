"use client";

import Navigation from '@/components/navigation';
import Footer from '@/components/footer';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}