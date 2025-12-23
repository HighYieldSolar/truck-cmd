// src/components/common/LockedFeature.js
"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function LockedFeature({ title, description }) {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <Lock size={24} className="text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title || t('lockedFeature.title')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {description || t('lockedFeature.description')}
      </p>
      <Link
        href="/dashboard/upgrade"
        className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      >
        {t('lockedFeature.viewPlans')}
      </Link>
    </div>
  );
}