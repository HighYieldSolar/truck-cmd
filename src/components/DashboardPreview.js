"use client";

import { 
  BarChart2, 
  TrendingUp, 
  Truck, 
  FileText, 
  Wallet, 
  Calendar, 
  DollarSign, 
  Settings,
  Bell,
  Search,
  User,
  Package,
  CheckCircle,
  Clock
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden select-none pointer-events-none">
      {/* Dashboard Header */}
      <div className="h-12 bg-white border-b shadow-sm px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-6 w-28 bg-blue-600 rounded-sm"></div>
          <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-100 rounded-md w-48">
            <Search size={14} className="text-gray-400 mr-2" />
            <div className="h-3 w-32 bg-gray-300 rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Bell size={16} className="text-gray-500" />
          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={14} className="text-blue-600" />
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex h-[calc(100%-3rem)]">
        {/* Sidebar */}
        <div className="hidden md:block w-12 lg:w-40 bg-white shadow-sm p-2">
          <div className="space-y-3">
            <div className="p-1.5 rounded bg-blue-50 flex items-center justify-center lg:justify-start">
              <BarChart2 size={16} className="text-blue-600" />
              <div className="hidden lg:block ml-2 h-3 w-16 bg-blue-200 rounded-full"></div>
            </div>
            <div className="p-1.5 rounded flex items-center justify-center lg:justify-start">
              <Truck size={16} className="text-gray-400" />
              <div className="hidden lg:block ml-2 h-3 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="p-1.5 rounded flex items-center justify-center lg:justify-start">
              <FileText size={16} className="text-gray-400" />
              <div className="hidden lg:block ml-2 h-3 w-14 bg-gray-200 rounded-full"></div>
            </div>
            <div className="p-1.5 rounded flex items-center justify-center lg:justify-start">
              <Wallet size={16} className="text-gray-400" />
              <div className="hidden lg:block ml-2 h-3 w-18 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden p-2 md:p-4">
          {/* Welcome Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="mb-2 md:mb-0">
              <div className="h-4 w-56 bg-gray-300 rounded-full mb-1.5"></div>
              <div className="h-3 w-36 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-8 w-20 bg-blue-600 rounded flex items-center justify-center">
                <div className="h-3 w-12 bg-blue-400 rounded-full"></div>
              </div>
              <div className="h-8 w-24 bg-blue-100 rounded flex items-center justify-center">
                <div className="h-3 w-16 bg-blue-200 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-3 w-24 bg-gray-200 rounded-full mb-2"></div>
                  <div className="h-5 w-16 bg-green-100 rounded-full"></div>
                </div>
                <DollarSign size={18} className="text-green-500" />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-3 w-24 bg-gray-200 rounded-full mb-2"></div>
                  <div className="h-5 w-12 bg-red-100 rounded-full"></div>
                </div>
                <TrendingUp size={18} className="text-red-500" />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-3 w-24 bg-gray-200 rounded-full mb-2"></div>
                  <div className="h-5 w-8 bg-blue-100 rounded-full"></div>
                </div>
                <Truck size={18} className="text-blue-500" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Activity Feed */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-3">
                <div className="h-4 w-32 bg-gray-300 rounded-full"></div>
                <div className="h-3 w-14 bg-blue-100 rounded-full"></div>
              </div>
              
              {/* Activity Items */}
              <div className="space-y-3">
                {[1, 2, 3].map(item => (
                  <div key={item} className="flex items-start space-x-3 py-2 border-b">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {item === 1 && <FileText size={14} className="text-blue-600" />}
                      {item === 2 && <Truck size={14} className="text-green-600" />}
                      {item === 3 && <Wallet size={14} className="text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="h-3 w-40 bg-gray-300 rounded-full mb-1.5"></div>
                      <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-2 w-10 bg-gray-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Section */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-3">
                <div className="h-4 w-32 bg-gray-300 rounded-full"></div>
                <div className="h-3 w-14 bg-blue-100 rounded-full"></div>
              </div>
              
              {/* Upcoming Items */}
              <div className="space-y-3">
                {[1, 2, 3].map(item => (
                  <div key={item} className="flex items-start space-x-2 py-2 border-b">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {item === 1 && <Package size={12} className="text-blue-600" />}
                      {item === 2 && <CheckCircle size={12} className="text-green-600" />}
                      {item === 3 && <Clock size={12} className="text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="h-3 w-28 bg-gray-300 rounded-full mb-1"></div>
                      <div className="h-2 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}