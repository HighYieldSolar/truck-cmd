// src/components/fuel/FuelChart.js
"use client";
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function FuelChart({ data, period = 'This Quarter' }) {
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  
  // Format data for charts
  const formatChartData = () => {
    return Object.entries(data).map(([state, amount]) => ({
      state,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);
  };
  
  const chartData = formatChartData();
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
  
  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="text-sm font-semibold">{`${label}`}</p>
          <p className="text-sm text-blue-600">{`Amount: $${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Format data for specific chart types
  const getPieData = () => {
    // Limit to top 7 states, group others
    if (chartData.length <= 7) return chartData;
    
    const topStates = chartData.slice(0, 7);
    const otherStates = chartData.slice(7);
    
    const otherAmount = otherStates.reduce((sum, item) => sum + item.amount, 0);
    
    return [
      ...topStates,
      { state: 'Other States', amount: otherAmount }
    ];
  };

  return (
    <div>
      {/* Chart type selector */}
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">{`Fuel Expenses by State (${period})`}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded-md ${
              chartType === 'bar' 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-sm rounded-md ${
              chartType === 'pie' 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pie Chart
          </button>
        </div>
      </div>
      
      {/* Chart display */}
      <div className="w-full h-80">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No data available for chart</p>
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" name="Amount ($)" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getPieData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
                nameKey="state"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {getPieData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Total amount display */}
      <div className="mt-4 text-right text-gray-700">
        <span className="font-medium">Total: </span>
        <span className="text-lg font-bold">
          ${Object.values(data).reduce((sum, amount) => sum + parseFloat(amount), 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}