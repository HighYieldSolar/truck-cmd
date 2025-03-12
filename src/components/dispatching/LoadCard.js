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
  Trash2
} from "lucide-react";
import StatusBadge from './StatusBadge';

export default function LoadCard({ load, onSelect, onDelete }) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(load)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900">#{load.loadNumber}</h3>
          <StatusBadge status={load.status} />
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-500">Customer: <span className="text-gray-900">{load.customer}</span></p>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin size={16} className="text-gray-400 mr-1" />
          <span className="truncate">{load.origin}</span>
          <ArrowRight size={14} className="mx-1" />
          <span className="truncate">{load.destination}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Calendar size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">{load.pickupDate}</span>
          </div>
          <div className="flex items-center">
            <Clock size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">{load.deliveryDate}</span>
          </div>
          <div className="flex items-center">
            <Truck size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">{load.driver || "Unassigned"}</span>
          </div>
          <div className="flex items-center">
            <DollarSign size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-900">${load.rate.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Show completion date for completed loads */}
        {load.status === "Completed" && load.completedAt && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="flex items-center">
              <CheckCircleIcon size={12} className="text-green-500 mr-1" /> 
              Completed on {new Date(load.completedAt).toLocaleDateString()}
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
          {/* Add Complete button to Load Card */}
          {load.status !== "Completed" && load.status !== "Cancelled" && (
            <Link
              href={`/dashboard/dispatching/complete/${load.id}`}
              className="text-sm text-green-600 hover:text-green-800 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircleIcon size={14} className="mr-1" />
              Mark Complete
            </Link>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(load);
            }}
            className="text-red-600 hover:text-red-800 text-sm inline-flex items-center"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}