"use client";
import Navigation from './navigation';
import Footer from './footer';

export default function Layout({ children }) {
  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      <Navigation />
      {children}
      <Footer />
    </main>
  );
}