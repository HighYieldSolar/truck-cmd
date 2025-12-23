'use client';

import { useState } from 'react';
import { useTranslation } from "@/context/LanguageContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

/**
 * Expense Chart Component
 *
 * A modern, visually appealing chart for expense analysis.
 * Features horizontal bar chart (default) and pie chart views.
 * Inspired by shadcn/ui chart design patterns.
 */
export default function ExpenseChart({ data = {}, period = 'This Month' }) {
  const { t } = useTranslation('expenses');
  const [chartType, setChartType] = useState('bar');

  // Category colors matching the expense system
  const categoryColors = {
    Fuel: { color: '#F59E0B', bg: 'bg-amber-500' },
    Maintenance: { color: '#3B82F6', bg: 'bg-blue-500' },
    Insurance: { color: '#10B981', bg: 'bg-emerald-500' },
    Tolls: { color: '#8B5CF6', bg: 'bg-purple-500' },
    Office: { color: '#6B7280', bg: 'bg-gray-500' },
    Permits: { color: '#6366F1', bg: 'bg-indigo-500' },
    Meals: { color: '#EF4444', bg: 'bg-red-500' },
    Other: { color: '#64748B', bg: 'bg-slate-500' }
  };

  // Prepare and sort data for charts
  const chartData = Object.entries(data)
    .map(([category, amount]) => ({
      category,
      amount: parseFloat(amount),
      fill: categoryColors[category]?.color || categoryColors.Other.color
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Calculate total for percentage display
  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.amount / totalAmount) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {data.category}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(data.amount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {percentage}% {t('chartWidget.ofTotal')}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.amount / totalAmount) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {data.category}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(data.amount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {percentage}% {t('chartWidget.ofTotal')}
          </p>
        </div>
      );
    }
    return null;
  };

  // Empty state
  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('chartWidget.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{period}</p>
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            {t('chartWidget.noData')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {t('chartWidget.addExpenses')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('chartWidget.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{period}</p>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              {t('chartWidget.bar')}
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                chartType === 'pie'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <PieChartIcon className="h-4 w-4" />
              {t('chartWidget.pie')}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {chartType === 'bar' ? (
          /* Horizontal Bar Chart - shadcn mixed style */
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }}
                  width={90}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                />
                <Bar
                  dataKey="amount"
                  radius={[0, 6, 6, 0]}
                  barSize={32}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Pie Chart */
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="category"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="none"
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {chartData.slice(0, 8).map((item, index) => {
              const percentage = ((item.amount / totalAmount) * 100).toFixed(0);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {item.category}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.amount)} ({percentage}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with trend indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(totalAmount)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {t('chartWidget.totalFor')} {period.toLowerCase()}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {chartData.length} {chartData.length === 1 ? t('chartWidget.category') : t('chartWidget.categories')}
          </span>
        </div>
      </div>
    </div>
  );
}
