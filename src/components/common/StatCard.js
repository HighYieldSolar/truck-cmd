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
          text: 'text-blue-600',
          lightBg: 'bg-blue-50',
          borderColor: 'border-blue-100',
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          text: 'text-green-600',
          lightBg: 'bg-green-50',
          borderColor: 'border-green-100',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600',
          lightBg: 'bg-yellow-50',
          borderColor: 'border-yellow-100',
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          lightBg: 'bg-red-50',
          borderColor: 'border-red-100',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          text: 'text-purple-600',
          lightBg: 'bg-purple-50',
          borderColor: 'border-purple-100',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-600',
          lightBg: 'bg-gray-50',
          borderColor: 'border-gray-100',
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses.lightBg} ${colorClasses.borderColor} border`}>
          <div className={`${colorClasses.text}`}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className="ml-2 flex items-center">
                {positive ? (
                  <span className="text-xs text-green-600 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {change}%
                  </span>
                ) : (
                  <span className="text-xs text-red-600 flex items-center">
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