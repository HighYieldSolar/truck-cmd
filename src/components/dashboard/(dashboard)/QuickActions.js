// src/components/dashboard/QuickActions.js
"use client";

import Link from "next/link";
import {
  FileText,
  Truck,
  Wallet,
  Fuel,
  Calculator,
  CheckCircle
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Quick Actions Component
 * Grid of quick action buttons for common tasks
 */
export default function QuickActions() {
  const { t } = useTranslation('dashboard');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 rounded-t-xl">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <CheckCircle size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
          {t('quickActions.title')}
        </h3>
      </div>
      <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <QuickLink
          icon={<FileText size={20} />}
          title={t('quickActions.createInvoice')}
          href="/dashboard/invoices/new"
          color="blue"
        />
        <QuickLink
          icon={<Truck size={20} />}
          title={t('quickActions.addLoad')}
          href="/dashboard/dispatching"
          color="green"
        />
        <QuickLink
          icon={<Wallet size={20} />}
          title={t('quickActions.recordExpense')}
          href="/dashboard/expenses"
          color="red"
        />
        <QuickLink
          icon={<Fuel size={20} />}
          title={t('quickActions.addFuel')}
          href="/dashboard/fuel"
          color="yellow"
        />
        <QuickLink
          icon={<Calculator size={20} />}
          title={t('quickActions.iftaCalculator')}
          href="/dashboard/ifta"
          color="purple"
        />
      </div>
    </div>
  );
}

/**
 * Quick Link Component
 * Individual action button in the quick actions grid
 */
function QuickLink({ icon, title, href, color = "blue" }) {
  // Define color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          icon: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700'
        };
      case 'green':
        return {
          icon: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20',
          hover: 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700'
        };
      case 'red':
        return {
          icon: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20',
          hover: 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-700'
        };
      case 'yellow':
        return {
          icon: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          hover: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-700'
        };
      case 'purple':
        return {
          icon: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700'
        };
      default:
        return {
          icon: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700'
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 ${colorClasses.hover} transition-colors`}
    >
      <span className={`p-2 rounded-full ${colorClasses.bg} ${colorClasses.icon} shadow-sm mb-2`}>
        {icon}
      </span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{title}</span>
    </Link>
  );
}