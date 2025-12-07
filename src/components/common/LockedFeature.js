// src/components/common/LockedFeature.js
import { Lock } from "lucide-react";
import Link from "next/link";

export default function LockedFeature({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Lock size={24} className="text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || "Feature Locked"}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        {description || "Your free trial has ended. Please subscribe to access this feature."}
      </p>
      <Link
        href="/dashboard/upgrade"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        View Subscription Plans
      </Link>
    </div>
  );
}