"use client";

import Link from 'next/link';
import { 
  LayoutDashboard, 
  Calculator, 
  Truck, 
  FileText, 
  Wallet, 
  Users, 
  Bell 
} from 'lucide-react';

export default function DashboardSidebar({ activePage = 'dashboard' }) {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
    { name: 'Load Management', href: '/dashboard/loads', icon: <Truck size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'Reminders', href: '/dashboard/reminders', icon: <Bell size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg p-4 h-screen">
      <h2 className="text-xl font-bold mb-6 text-black">Truck Command</h2>
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className={`flex items-center p-2 rounded ${
                  activePage === item.name.toLowerCase() 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-200 text-black'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}