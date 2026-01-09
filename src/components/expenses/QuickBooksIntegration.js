'use client';

import Image from 'next/image';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import {
  Clock,
  FileText,
  RefreshCw,
  Receipt,
  BarChart3,
  Bell
} from 'lucide-react';

/**
 * QuickBooksIntegration - Shows Coming Soon state for QuickBooks integration
 *
 * The QuickBooks integration feature is under development. This component displays
 * a preview of what's coming and the benefits users can expect.
 * Gated to Premium+ tier.
 */
export default function QuickBooksIntegration({ onSyncComplete }) {
  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('quickbooksIntegration');

  // Features that will be available with QuickBooks integration
  const upcomingFeatures = [
    {
      icon: Receipt,
      name: 'Expense Sync',
      description: 'Automatically sync expenses to QuickBooks'
    },
    {
      icon: FileText,
      name: 'Invoice Sync',
      description: 'Push invoices directly to QuickBooks'
    },
    {
      icon: RefreshCw,
      name: 'Auto Category Mapping',
      description: 'Map expense categories to your Chart of Accounts'
    },
    {
      icon: BarChart3,
      name: 'Financial Reports',
      description: 'Keep your books accurate for tax time'
    }
  ];

  // If no access, show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <div className="h-5 w-5 rounded overflow-hidden">
            <Image
              src="/images/eld/QuickBooksLogo.png"
              alt="QuickBooks"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">QuickBooks Integration</span>
        </div>
        <div className="p-4">
          <FeatureGate feature="quickbooksIntegration" fallback="prompt" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* QuickBooks Logo */}
          <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 bg-white p-0.5">
            <Image
              src="/images/eld/QuickBooksLogo.png"
              alt="QuickBooks logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">QuickBooks</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
              <Clock className="h-3 w-3" />
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Coming Soon Message */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
            <div className="w-8 h-8 rounded overflow-hidden">
              <Image
                src="/images/eld/QuickBooksLogo.png"
                alt="QuickBooks"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            QuickBooks Integration Coming Soon
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            We're building seamless QuickBooks Online integration. Sync your expenses and invoices
            directly to keep your books accurate and save hours on data entry.
          </p>
        </div>

        {/* Feature Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
            What You'll Get
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {upcomingFeatures.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="p-1.5 bg-[#2CA01C]/10 rounded-md flex-shrink-0">
                    <FeatureIcon size={14} className="text-[#2CA01C]" />
                  </div>
                  <div className="min-w-0">
                    <h6 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
                      {feature.name}
                    </h6>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification Footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Bell size={12} />
          <span>We'll notify you when this feature is available</span>
        </div>
      </div>
    </div>
  );
}
