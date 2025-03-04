"use client";

import Navigation from '@/components/navigation';
import Footer from '@/components/footer';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5] text-[#222222]">
      <Navigation />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}