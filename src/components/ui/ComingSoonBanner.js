'use client';

import { Clock, Bell, Sparkles } from 'lucide-react';

/**
 * ComingSoonBanner - Display a coming soon message for features under development
 *
 * @param {string} title - Feature title
 * @param {string} description - Feature description
 * @param {string} expectedDate - Expected release date/timeframe (optional)
 * @param {React.ReactNode} icon - Custom icon (optional)
 * @param {string} variant - 'default' | 'compact' | 'card'
 */
export default function ComingSoonBanner({
  title,
  description,
  expectedDate,
  icon: CustomIcon,
  variant = 'default',
  className = ''
}) {
  const Icon = CustomIcon || Sparkles;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${className}`}>
        <Clock size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
          Coming Soon
        </span>
        {expectedDate && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            · {expectedDate}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex-shrink-0">
            <Icon size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                <Clock size={10} />
                Coming Soon
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {description}
            </p>
            {expectedDate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Expected: {expectedDate}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`text-center py-8 px-6 ${className}`}>
      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-amber-600 dark:text-amber-400" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-full mb-3">
        <Clock size={14} />
        Coming Soon
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
        {description}
      </p>

      {expectedDate && (
        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
          Expected: {expectedDate}
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Bell size={12} />
        <span>We'll notify you when this feature is available</span>
      </div>
    </div>
  );
}
