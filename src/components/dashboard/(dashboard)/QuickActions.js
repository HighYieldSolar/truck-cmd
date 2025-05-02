// src/components/dashboard/QuickActions.js
import Link from "next/link";
import { 
  FileText, 
  Truck, 
  Wallet, 
  Fuel, 
  Calculator, 
  CheckCircle 
} from "lucide-react";

/**
 * Quick Actions Component
 * Grid of quick action buttons for common tasks
 */
export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-700 flex items-center">
          <CheckCircle size={18} className="mr-2 text-blue-600" />
          Quick Actions
        </h3>
      </div>
      <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <QuickLink 
          icon={<FileText size={20} className="text-blue-600" />}
          title="Create Invoice"
          href="/dashboard/invoices/new"
        />
        <QuickLink 
          icon={<Truck size={20} className="text-green-600" />}
          title="Add Load"
          href="/dashboard/dispatching/new"
        />
        <QuickLink 
          icon={<Wallet size={20} className="text-red-600" />}
          title="Record Expense"
          href="/dashboard/expenses/new"
        />
        <QuickLink 
          icon={<Fuel size={20} className="text-yellow-600" />}
          title="Add Fuel"
          href="/dashboard/fuel"
        />
        <QuickLink 
          icon={<Calculator size={20} className="text-purple-600" />}
          title="IFTA Calculator"
          href="/dashboard/ifta"
        />
      </div>
    </div>
  );
}

/**
 * Quick Link Component
 * Individual action button in the quick actions grid
 */
function QuickLink({ icon, title, href }) {
  return (
    <Link 
      href={href}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
    >
      <span className="p-2 rounded-full bg-blue-50 text-blue-600 shadow-sm mb-2">
        {icon}
      </span>
      <span className="text-sm font-medium text-gray-700">{title}</span>
    </Link>
  );
}