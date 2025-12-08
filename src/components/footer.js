"use client";
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/tc white-logo with name.png"
              alt="Truck Command"
              width={140}
              height={46}
              className="h-10 w-auto mb-4"
            />
            <p className="text-sm mb-4">
              Efficiency in Motion,<br />Profit in Command
            </p>
            <p className="text-sm">
              Trucking management software for fleets of all sizes.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features/invoicing" className="hover:text-white transition-colors">Invoicing</Link></li>
              <li><Link href="/features/dispatching" className="hover:text-white transition-colors">Load Management</Link></li>
              <li><Link href="/features/ifta-calculator" className="hover:text-white transition-colors">IFTA Calculator</Link></li>
              <li><Link href="/features/expense-tracking" className="hover:text-white transition-colors">Expense Tracking</Link></li>
              <li><Link href="/features/compliance" className="hover:text-white transition-colors">Compliance</Link></li>
              <li><Link href="/features/fuel-tracker" className="hover:text-white transition-colors">Fuel Tracker</Link></li>
              <li><Link href="/features/state-mileage" className="hover:text-white transition-colors">State Mileage</Link></li>
              <li><Link href="/features/fleet-tracking" className="hover:text-white transition-colors">Fleet Management</Link></li>
              <li><Link href="/features/customer-management" className="hover:text-white transition-colors">Customer CRM</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Truck Command. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">support@truckcommand.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
