// src/components/expenses/ExpenseChart.js
"use client";

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, } from 'recharts';
import { ChevronDown, BarChart2, PieChart as PieChartIcon, Calendar } from 'lucide-react';

export default function ExpenseChart({ data = {}, period = "This Month" }) {
  const [chartType, setChartType] = useState('bar');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Prepare data for charts
  const chartData = Object.entries(data).map(([category, amount]) => ({
    name: category,
    value: parseFloat(amount)
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Custom colors for chart segments
  const COLORS = [
    '#FBBF24', // yellow-400 - Fuel
    '#3B82F6', // blue-500 - Maintenance
    '#10B981', // green-500 - Insurance
    '#8B5CF6', // purple-500 - Tolls
    '#6B7280', // gray-500 - Office
    '#6366F1', // indigo-500 - Permits
    '#EF4444', // red-500 - Meals
    '#9CA3AF'  // gray-400 - Other
  ];

  // Get color for a specific category
  const getCategoryColor = (category) => {
    const categoryColors = {
      'Fuel': '#FBBF24',
      'Maintenance': '#3B82F6',
      'Insurance': '#10B981',
      'Tolls': '#8B5CF6',
      'Office': '#6B7280',
      'Permits': '#6366F1',
      'Meals': '#EF4444',
      'Other': '#9CA3AF'
    };
    
    return categoryColors[category] || '#9CA3AF';
  };

  // Format currency for tooltips
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-gray-700">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Render empty state if no data
  if (chartData.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-gray-500">
        <Calendar size={48} className="mb-4 text-gray-300" />
        <p>No expense data available for {period}</p>
        <p className="text-sm mt-2">Add expenses to see your spending analysis</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <BarChart2 size={20} className="mr-2 text-blue-500" />
          Expense Analysis
        </h3>
        
        <div className="relative">
          <button 
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{chartType === 'bar' ? 'Bar Chart' : 'Pie Chart'}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-lg w-48">
              <div className="py-1">
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${chartType === 'bar' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => {
                    setChartType('bar');
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <BarChart2 size={16} className="mr-2" />
                    Bar Chart
                  </div>
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${chartType === 'pie' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => {
                    setChartType('pie');
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <PieChartIcon size={16} className="mr-2" />
                    Pie Chart
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-80">
        {chartType === 'bar' ? (
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
              <Bar dataKey="value" name="Amount">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {chartData.slice(0, 4).map((item, index) => (
          <div key={index} className="text-center">
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-600">{formatCurrency(item.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}