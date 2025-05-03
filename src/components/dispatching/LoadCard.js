// src/components/dispatching/LoadCard.js
"use client";

import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Truck, 
  DollarSign,
  CheckCircle as CheckCircleIcon,
  Trash2,
  Users,
  Package,
  AlertCircle
} from "lucide-react";
import StatusBadge from './StatusBadge';

export default function LoadCard({ load, onSelect, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 border-green-200';
      case 'In Transit': return 'bg-blue-50 border-blue-200';
      case 'Cancelled': return 'bg-red-50 border-red-200';
      case 'Delayed': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div 
      className={`rounded-xl shadow-sm border ${getStatusColor(load.status)} hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden`}
      onClick={() => onSelect(load)}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package size={18} className="mr-2 text-blue-500" />
              #{load.loadNumber}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {load.customer}
            </p>
          </div>
          <StatusBadge status={load.status} />
        </div>
        
        {/* Route Information */}
        <div className="flex items-center text-sm text-gray-600 py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
          <MapPin size={16} className="text-gray-400 flex-shrink-0" />
          <span className="ml-2 flex-1 truncate">{load.origin}</span>
          <ArrowRight size={16} className="mx-3 text-gray-400" />
          <span className="flex-1 truncate text-right">{load.destination}</span>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm">
            <Calendar size={14} className="text-gray-400 mr-2" />
            <span className="text-gray-700">Pickup: </span>
            <span className="font-medium text-gray-900 ml-1">
              {new Date(load.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock size={14} className="text-gray-400 mr-2" />
            <span className="text-gray-700">Delivery: </span>
            <span className="font-medium text-gray-900 ml-1">
              {new Date(load.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Users size={14} className="text-gray-400 mr-2" />
            <span className="text-gray-700">Driver: </span>
            <span className={`font-medium ml-1 ${load.driver ? 'text-gray-900' : 'text-gray-400'}`}>
              {load.driver || "Unassigned"}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <DollarSign size={14} className="text-gray-400 mr-2" />
            <span className="text-gray-700">Rate: </span>
            <span className="font-medium text-gray-900 ml-1">
              ${load.rate.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Truck Info */}
        {load.truckInfo && (
          <div className="mb-3 text-sm text-gray-600 flex items-center">
            <Truck size={14} className="text-gray-400 mr-2" />
            <span className="truncate">{load.truckInfo}</span>
          </div>
        )}
        
        {/* Completion Info */}
        {load.status === "Completed" && load.completedAt && (
          <div className="text-sm text-green-600 flex items-center mb-3">
            <CheckCircleIcon size={14} className="mr-2" />
            Completed on {new Date(load.completedAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
        
        {/* Delayed Status */}
        {load.status === "Delayed" && (
          <div className="text-sm text-orange-600 flex items-center mb-3">
            <AlertCircle size={14} className="mr-2" />
            Load is delayed - check details
          </div>
        )}
      </div>
      
      {/* Card Footer */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex justify-between items-center">
          {/* Complete Button */}
          {load.status !== "Completed" && load.status !== "Cancelled" && (
            <Link
              href={`/dashboard/dispatching/complete/${load.id}`}
              className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircleIcon size={14} className="mr-1" />
              Mark Complete
            </Link>
          )}
          
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(load);
            }}
            className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium transition-colors ml-auto"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}