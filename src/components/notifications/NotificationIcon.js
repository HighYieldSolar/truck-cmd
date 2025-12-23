"use client";

import { Bell } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function NotificationIcon({ onIconClick, hasUnread }) {
  const { t } = useTranslation('common');

  return (
    <button
      className="p-2.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
      onClick={onIconClick}
      aria-label={t('accessibility.notifications')}
    >
      <Bell size={22} className="sm:w-5 sm:h-5" />
      {hasUnread && (
        <span className="absolute top-1 sm:top-0.5 right-1 sm:right-1.5 block h-2.5 w-2.5 sm:h-2 sm:w-2 rounded-full bg-red-500"></span>
      )}
    </button>
  );
} 