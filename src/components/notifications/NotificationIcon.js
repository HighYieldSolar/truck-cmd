"use client";

import { Bell } from "lucide-react";

export default function NotificationIcon({ onIconClick, hasUnread }) {
  return (
    <button
      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none relative"
      onClick={onIconClick}
      aria-label="Notifications"
    >
      <Bell size={20} />
      {hasUnread && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
      )}
    </button>
  );
} 