// src/components/common/StatCard.js
"use client";

/**
 * A reusable stat card component for dashboards.
 */
export default function StatCard({ title, value, icon, color, change, positive }) {
  // Define color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-600 dark:text-blue-400',
          lightBg: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-100 dark:border-blue-800',
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          text: 'text-green-600 dark:text-green-400',
          lightBg: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-100 dark:border-green-800',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600 dark:text-yellow-400',
          lightBg: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-100 dark:border-yellow-800',
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600 dark:text-red-400',
          lightBg: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-100 dark:border-red-800',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          text: 'text-purple-600 dark:text-purple-400',
          lightBg: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-100 dark:border-purple-800',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-600 dark:text-gray-400',
          lightBg: 'bg-gray-50 dark:bg-gray-800',
          borderColor: 'border-gray-100 dark:border-gray-700',
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow duration-200`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses.lightBg} ${colorClasses.borderColor} border`}>
          <div className={`${colorClasses.text}`}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {change && (
              <div className="ml-2 flex items-center">
                {positive ? (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {change}%
                  </span>
                ) : (
                  <span className="text-xs text-red-600 dark:text-red-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {change}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}