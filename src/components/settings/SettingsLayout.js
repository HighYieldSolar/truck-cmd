"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  User,
  PaintBucket,
  CreditCard,
  Shield,
  Settings,
  Bell
} from "lucide-react";

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  // Define the settings menu items
  const settingsMenu = [
    {
      name: "Profile",
      href: "/dashboard/settings/profile",
      icon: <User size={20} />,
      active: pathname === "/dashboard/settings/profile" || pathname === "/dashboard/settings"
    },
    {
      name: "Appearance",
      href: "/dashboard/settings/appearance",
      icon: <PaintBucket size={20} />,
      active: pathname === "/dashboard/settings/appearance"
    },
    {
      name: "Account",
      href: "/dashboard/settings/account",
      icon: <Settings size={20} />,
      active: pathname === "/dashboard/settings/account"
    },
    {
      name: "Privacy",
      href: "/dashboard/settings/privacy",
      icon: <Shield size={20} />,
      active: pathname === "/dashboard/settings/privacy"
    },
    {
      name: "Billing",
      href: "/dashboard/settings/billing",
      icon: <CreditCard size={20} />,
      active: pathname === "/dashboard/settings/billing"
    },
    {
      name: "Notifications",
      href: "/dashboard/settings/notifications",
      icon: <Bell size={20} />,
      active: pathname === "/dashboard/settings/notifications"
    }
  ];

  // Find the active menu item
  const activeMenuItem = settingsMenu.find(item => item.active) || settingsMenu[0];

  return (
    <DashboardLayout activePage="settings">
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 p-4">
                  <h2 className="text-lg font-semibold text-white">Settings</h2>
                  <p className="text-sm text-blue-100 dark:text-blue-200">Manage your account preferences</p>
                </div>

                <nav className="p-2">
                  {settingsMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${item.active
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`}
                    >
                      <span className={`mr-3 ${item.active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {/* Right content area */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-xl shadow-md p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold text-white">{activeMenuItem.name}</h1>
                      <p className="text-blue-100 dark:text-blue-200">Manage your {activeMenuItem.name.toLowerCase()} settings</p>
                    </div>
                    {pathname === "/dashboard/settings/billing" && (
                      <div className="mt-3 md:mt-0">
                        <Link
                          href="/dashboard/upgrade"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          <CreditCard size={16} className="mr-2" />
                          View All Plans
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
