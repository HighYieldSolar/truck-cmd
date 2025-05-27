"use client";

import { useState } from "react";
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
      active: pathname === "/dashboard/settings/profile"
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
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-4">
                  <h2 className="text-lg font-semibold text-white">Settings</h2>
                  <p className="text-sm text-blue-100">Manage your account preferences</p>
                </div>

                <nav className="p-2">
                  {settingsMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-md transition-colors ${item.active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <span className={`mr-3 ${item.active ? "text-blue-600" : "text-gray-500"}`}>
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
              <div className="bg-white rounded-lg shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-lg shadow-md p-6 text-white">
                  <h1 className="text-2xl font-semibold text-white">{activeMenuItem.name}</h1>
                  <p className="text-blue-100">Manage your {activeMenuItem.name.toLowerCase()} settings</p>
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