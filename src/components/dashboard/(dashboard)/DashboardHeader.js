// src/components/dashboard/DashboardHeader.js
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Dashboard Header Component
 *
 * @param {Object} props Component props
 * @param {Object} props.user Current user object
 */
export default function DashboardHeader({ user }) {
  const { t } = useTranslation('dashboard');

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-700 dark:to-blue-500 rounded-xl shadow-md p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold mb-1">
            {t('header.greeting')}{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-blue-100">{t('header.todayOverview')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/dispatching"
            className="px-4 py-3 sm:py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium min-h-[44px]"
          >
            <Plus size={20} className="mr-2 sm:mr-2" />
            {t('header.newLoad')}
          </Link>
        </div>
      </div>
    </div>
  );
}