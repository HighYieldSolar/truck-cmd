// src/components/ifta/IFTAFuelToggle.js
"use client";

import Link from "next/link";
import { Route, Fuel } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function IFTAFuelToggle({ currentPage = 'ifta', currentQuarter = '' }) {
  const { t } = useTranslation('ifta');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-2">
        <Link
          href={`/dashboard/ifta${currentQuarter ? `?quarter=${currentQuarter}` : ''}`}
          className={`flex items-center justify-center space-x-2 p-4 font-medium transition-all ${currentPage === 'ifta'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'
            }`}
        >
          <Route size={20} />
          <span>{t('toggle.iftaTracker')}</span>
        </Link>

        <Link
          href={`/dashboard/fuel${currentQuarter ? `?quarter=${currentQuarter}` : ''}`}
          className={`flex items-center justify-center space-x-2 p-4 font-medium transition-all ${currentPage === 'fuel'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'
            }`}
        >
          <Fuel size={20} />
          <span>{t('toggle.fuelTracker')}</span>
        </Link>
      </div>
    </div>
  );
}