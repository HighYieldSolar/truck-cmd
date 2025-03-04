"use client";
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#222222] text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Image
              src="/images/tc white-logo with name.png"
              alt="Truck Command Logo"
              width={150}
              height={50}
              className="h-12 mb-6"
            />
            <p className="text-gray-400 mb-4">
              Efficiency in Motion, Profit in Command
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">FB</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">TW</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">IG</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">LI</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Features</h4>
            <ul className="space-y-3">
              <li><Link href="/features/invoicing" className="text-gray-400 hover:text-white transition-colors">Invoicing</Link></li>
              <li><Link href="/features/dispatching" className="text-gray-400 hover:text-white transition-colors">Dispatching</Link></li>
              <li><Link href="/features/expense-tracking" className="text-gray-400 hover:text-white transition-colors">Expense Tracking</Link></li>
              <li><Link href="/features/fleet-tracking" className="text-gray-400 hover:text-white transition-colors">Fleet Tracking</Link></li>
              <li><Link href="/features/compliance" className="text-gray-400 hover:text-white transition-colors">Compliance</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/feedback" className="text-gray-400 hover:text-white transition-colors">Feedback</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">&copy; {new Date().getFullYear()} Truck Command. All rights reserved.</p>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}