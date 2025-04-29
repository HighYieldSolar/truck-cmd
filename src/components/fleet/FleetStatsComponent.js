"use client";

import {
  Truck,
  Activity,
  FileCog,
  AlertTriangle,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Stat Card Component
const StatCard = ({ title, value, icon, color, change, changeType, changeText }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`bg-${color}-100 p-3 rounded-xl`}>
          {icon}
        </div>
      </div>
      <div className="px-4 py-2 bg-gray-50">
        {change ? (
          <div className="flex items-center">
            {changeType === 'increase' ? (
              <ArrowUpRight size={14} className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'} />
            ) : (
              <ArrowDownRight size={14} className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'} />
            )}
            <span className={`text-xs ml-1 ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change} {changeText || ''}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-500">Fleet status overview</span>
        )}
      </div>
    </div>
  );
};

export default function FleetStatsComponent({ truckStats, driverStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        title="Total Vehicles"
        value={truckStats.total}
        icon={<Truck size={20} className="text-blue-600" />}
        color="blue"
      />
      <StatCard
        title="Active Vehicles"
        value={truckStats.active}
        icon={<Activity size={20} className="text-green-600" />}
        color="green"
        change={truckStats.active > 0 && truckStats.total > 0 ? `${Math.round((truckStats.active / truckStats.total) * 100)}%` : "0%"}
        changeType="positive"
        changeText="utilization rate"
      />
      <StatCard
        title="In Maintenance"
        value={truckStats.maintenance}
        icon={<FileCog size={20} className="text-yellow-600" />}
        color="yellow"
      />
      <StatCard
        title="Out of Service"
        value={truckStats.outOfService}
        icon={<AlertTriangle size={20} className="text-red-600" />}
        color="red"
      />
      <StatCard
        title="Total Drivers"
        value={driverStats.total}
        icon={<Users size={20} className="text-purple-600" />}
        color="purple"
      />
    </div>
  );
}