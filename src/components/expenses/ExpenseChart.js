import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';

const ExpenseChart = ({ data = {}, period = "This Month" }) => {
  const [chartType, setChartType] = useState('category');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Prepare data based on chart type
  const chartData = React.useMemo(() => {
    if (chartType === 'category') {
      // Format data for category breakdown
      return Object.entries(data).map(([category, amount]) => ({
        name: category,
        amount: parseFloat(amount)
      })).sort((a, b) => b.amount - a.amount);
    } else {
      // This would be time-based data if you had it
      // For now, just use the same data
      return Object.entries(data).map(([category, amount]) => ({
        name: category,
        amount: parseFloat(amount)
      })).sort((a, b) => b.amount - a.amount);
    }
  }, [data, chartType]);

  // Get custom colors for bars
  const getBarColor = (category) => {
    const colorMap = {
      'Fuel': '#FBBF24',      // yellow-400
      'Maintenance': '#3B82F6', // blue-500
      'Insurance': '#10B981',  // green-500
      'Tolls': '#8B5CF6',     // purple-500
      'Office': '#6B7280',    // gray-500
      'Permits': '#6366F1',   // indigo-500
      'Meals': '#EF4444',     // red-500
      'Other': '#9CA3AF'      // gray-400
    };
    
    return colorMap[category] || '#9CA3AF';
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{payload[0].payload.name}</p>
          <p className="text-gray-700">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Calendar size={20} className="mr-2 text-blue-500" />
          Expense Analysis
        </h3>
        
        <div className="relative">
          <button 
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{chartType === 'category' ? 'By Category' : 'By Timeline'}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-lg w-48">
              <div className="py-1">
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${chartType === 'category' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => {
                    setChartType('category');
                    setIsDropdownOpen(false);
                  }}
                >
                  By Category
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${chartType === 'timeline' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => {
                    setChartType('timeline');
                    setIsDropdownOpen(false);
                  }}
                >
                  By Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-72">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="amount" 
                name="Amount" 
                fill={chartType === 'category' ? "#3B82F6" : "#3B82F6"}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Calendar size={48} className="mb-4 text-gray-300" />
            <p>No expense data available for {period}</p>
            <p className="text-sm mt-2">Add expenses to see your spending analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseChart;