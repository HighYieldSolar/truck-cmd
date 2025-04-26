"use client";

import { CheckCircle, AlertTriangle, Clock, FileText, PauseCircle } from "lucide-react";

export default function ComplianceSummary({ stats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <FileText size={20} className="text-blue-600" />
                    </div>
                </div>
                <div className="px-4 py-2 bg-gray-50">
                    <span className="text-xs text-gray-500">All compliance documents</span>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Active</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-xl">
                        <CheckCircle size={20} className="text-green-600" />
                    </div>
                </div>
                <div className="px-4 py-2 bg-gray-50">
                    <span className="text-xs text-gray-500">Valid documents</span>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Expiring Soon</p>
                        <p className="text-2xl font-bold text-orange-500 mt-1">{stats.expiringSoon}</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-xl">
                        <Clock size={20} className="text-orange-600" />
                    </div>
                </div>
                <div className="px-4 py-2 bg-gray-50">
                    <span className="text-xs text-gray-500">Due in 30 days or less</span>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Expired</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-xl">
                        <AlertTriangle size={20} className="text-red-600" />
                    </div>
                </div>
                <div className="px-4 py-2 bg-gray-50">
                    <span className="text-xs text-gray-500">Needs immediate attention</span>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Pending</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{stats.pending}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-xl">
                        <PauseCircle size={20} className="text-purple-600" />
                    </div>
                </div>
                <div className="px-4 py-2 bg-gray-50">
                    <span className="text-xs text-gray-500">Awaiting processing</span>
                </div>
            </div>
        </div>
    );
}