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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <CheckCircle size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
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
          href="/dashboard/dispatching"
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
      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
    >
      <span className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm mb-2">
        {icon}
      </span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
    </Link>
  );
}