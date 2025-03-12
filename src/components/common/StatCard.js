// src/components/common/StatCard.js
"use client";

/**
 * A reusable stat card component for dashboards.
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the stat card
 * @param {string|number} props.value - The value to display
 * @param {ReactNode} props.icon - Icon component to display
 * @param {string} props.color - Color theme for the card (blue, green, yellow, red, purple)
 * @param {string} [props.change] - Optional percentage change to display
 * @param {boolean} [props.positive] - Whether the change is positive or negative
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
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          text: 'text-green-600',
          lightBg: 'bg-green-50',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600',
          lightBg: 'bg-yellow-50',
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          lightBg: 'bg-red-50',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          text: 'text-purple-600',
          lightBg: 'bg-purple-50',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-600',
          lightBg: 'bg-gray-50',
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses.lightBg} mr-4`}>
          <div className={`w-8 h-8 rounded-lg ${colorClasses.bg} bg-opacity-10 flex items-center justify-center ${colorClasses.text}`}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          
          {change && (
            <div className="flex items-center mt-1">
              {positive ? (
                <span className="text-xs text-green-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  {change}% from last month
                </span>
              ) : (
                <span className="text-xs text-red-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {change}% from last month
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}