"use client";

import { 
  Download,
  BarChart2,
  FileCog,
  AlertTriangle,
  FileText,
  ArrowRight,
  Calendar
} from "lucide-react";

export default function FleetReportsComponent() {
  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 flex items-center">
          <FileText size={18} className="mr-2 text-blue-600" />
          Fleet Reports
        </h3>
        <button
          onClick={() => alert('Export functionality would be implemented here')}
          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Download size={16} className="mr-1.5" />
          Export Fleet Data
        </button>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer p-5">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <BarChart2 size={20} className="text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Fleet Summary Report</h4>
            <p className="text-sm text-gray-600 mb-3">Complete overview of all vehicles and drivers with current status.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Last generated: April 25, 2025</span>
              <button className="text-blue-600 hover:text-blue-800">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer p-5">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <FileCog size={20} className="text-orange-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Maintenance Schedule</h4>
            <p className="text-sm text-gray-600 mb-3">Upcoming maintenance activities for all vehicles in your fleet.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Last generated: April 27, 2025</span>
              <button className="text-blue-600 hover:text-blue-800">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer p-5">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Document Expiration Report</h4>
            <p className="text-sm text-gray-600 mb-3">List of all documents expiring in the next 90 days.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Last generated: April 28, 2025</span>
              <button className="text-blue-600 hover:text-blue-800">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Report Schedule</h4>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
            <Calendar size={18} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800">Reports are automatically generated every Monday at 6:00 AM.</p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1">
                Change Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}