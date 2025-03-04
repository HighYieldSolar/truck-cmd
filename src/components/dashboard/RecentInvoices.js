"use client";

import Link from 'next/link';

export default function RecentInvoices({ invoices = [] }) {
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-black">Recent Invoices</h3>
        <Link href="/dashboard/invoices" className="text-sm text-blue-500 hover:text-blue-700">
          View All
        </Link>
      </div>
      
      {invoices.length > 0 ? (
        <ul>
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex justify-between border-b p-2 text-black">
              <span>Invoice #{invoice.number}</span> 
              <span className="text-green-600">${invoice.amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 py-2">No recent invoices found.</p>
      )}
    </div>
  );
}