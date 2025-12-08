"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function FleetHealthScoreComponent({
  drivers = [],
  vehicles = [],
  documentReminders = []
}) {
  const [healthData, setHealthData] = useState({
    score: 100,
    status: 'excellent',
    totalItems: 0,
    compliantItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    issues: []
  });

  useEffect(() => {
    calculateHealthScore();
  }, [drivers, vehicles]);

  const calculateHealthScore = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let totalItems = 0;
    let compliantItems = 0;
    let expiringItems = 0;
    let expiredItems = 0;
    const issues = [];

    // Check driver documents
    drivers.forEach(driver => {
      // License expiry
      if (driver.license_expiry) {
        totalItems++;
        const licenseDate = new Date(driver.license_expiry);
        if (licenseDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: driver.name, doc: 'CDL License', date: driver.license_expiry });
        } else if (licenseDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: driver.name, doc: 'CDL License', date: driver.license_expiry });
        } else {
          compliantItems++;
        }
      }

      // Medical card expiry
      if (driver.medical_card_expiry) {
        totalItems++;
        const medicalDate = new Date(driver.medical_card_expiry);
        if (medicalDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: driver.name, doc: 'Medical Card', date: driver.medical_card_expiry });
        } else if (medicalDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: driver.name, doc: 'Medical Card', date: driver.medical_card_expiry });
        } else {
          compliantItems++;
        }
      }
    });

    // Check vehicle documents
    vehicles.forEach(vehicle => {
      // Registration expiry
      if (vehicle.registration_expiry) {
        totalItems++;
        const regDate = new Date(vehicle.registration_expiry);
        if (regDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: vehicle.name, doc: 'Registration', date: vehicle.registration_expiry });
        } else if (regDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: vehicle.name, doc: 'Registration', date: vehicle.registration_expiry });
        } else {
          compliantItems++;
        }
      }

      // Insurance expiry
      if (vehicle.insurance_expiry) {
        totalItems++;
        const insDate = new Date(vehicle.insurance_expiry);
        if (insDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: vehicle.name, doc: 'Insurance', date: vehicle.insurance_expiry });
        } else if (insDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: vehicle.name, doc: 'Insurance', date: vehicle.insurance_expiry });
        } else {
          compliantItems++;
        }
      }

      // Inspection expiry
      if (vehicle.inspection_expiry) {
        totalItems++;
        const inspDate = new Date(vehicle.inspection_expiry);
        if (inspDate < today) {
          expiredItems++;
          issues.push({ type: 'expired', entity: vehicle.name, doc: 'DOT Inspection', date: vehicle.inspection_expiry });
        } else if (inspDate <= thirtyDaysFromNow) {
          expiringItems++;
          issues.push({ type: 'expiring', entity: vehicle.name, doc: 'DOT Inspection', date: vehicle.inspection_expiry });
        } else {
          compliantItems++;
        }
      }
    });

    // Calculate score
    let score = 100;
    if (totalItems > 0) {
      // Expired items reduce score significantly
      // Expiring items reduce score moderately
      const expiredPenalty = (expiredItems / totalItems) * 50;
      const expiringPenalty = (expiringItems / totalItems) * 20;
      score = Math.max(0, Math.round(100 - expiredPenalty - expiringPenalty));
    }

    // Determine status
    let status = 'excellent';
    if (score < 50) status = 'critical';
    else if (score < 70) status = 'warning';
    else if (score < 90) status = 'good';

    // Sort issues by severity (expired first, then by date)
    issues.sort((a, b) => {
      if (a.type === 'expired' && b.type !== 'expired') return -1;
      if (a.type !== 'expired' && b.type === 'expired') return 1;
      return new Date(a.date) - new Date(b.date);
    });

    setHealthData({
      score,
      status,
      totalItems,
      compliantItems,
      expiringItems,
      expiredItems,
      issues: issues.slice(0, 3) // Show top 3 issues
    });
  };

  const getStatusConfig = () => {
    switch (healthData.status) {
      case 'critical':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          ringColor: 'stroke-red-500',
          label: 'Critical'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-800',
          ringColor: 'stroke-amber-500',
          label: 'Needs Attention'
        };
      case 'good':
        return {
          icon: ShieldCheck,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          border: 'border-blue-200 dark:border-blue-800',
          ringColor: 'stroke-blue-500',
          label: 'Good'
        };
      default:
        return {
          icon: ShieldCheck,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800',
          ringColor: 'stroke-green-500',
          label: 'Excellent'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  // Calculate the circumference for the progress ring
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (healthData.score / 100) * circumference;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border ${config.border}`}>
      <div className={`${config.bg} px-5 py-4`}>
        <h3 className={`font-semibold flex items-center ${config.color}`}>
          <StatusIcon size={18} className="mr-2" />
          Fleet Health Score
        </h3>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-center mb-4">
          {/* Circular Progress Ring */}
          <div className="relative w-28 h-28">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={config.ringColor}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            {/* Score text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${config.color}`}>{healthData.score}%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{config.label}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">{healthData.compliantItems}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Valid</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
            <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{healthData.expiringItems}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expiring</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{healthData.expiredItems}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expired</p>
          </div>
        </div>

        {/* Issues List */}
        {healthData.issues.length > 0 && (
          <div className="space-y-2 mb-3">
            {healthData.issues.map((issue, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                  issue.type === 'expired'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                }`}
              >
                <span className="truncate">{issue.entity} - {issue.doc}</span>
                <span className="font-medium ml-2 whitespace-nowrap">
                  {issue.type === 'expired' ? 'Expired' : 'Soon'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* No issues message */}
        {healthData.issues.length === 0 && healthData.totalItems > 0 && (
          <div className="text-center py-2 text-sm text-green-600 dark:text-green-400">
            All documents are up to date!
          </div>
        )}

        {/* No documents tracked message */}
        {healthData.totalItems === 0 && (
          <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
            No documents being tracked yet
          </div>
        )}

        {/* View Details Link */}
        <Link
          href="/dashboard/compliance"
          className="mt-2 flex items-center justify-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          View Compliance Details
          <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
}
