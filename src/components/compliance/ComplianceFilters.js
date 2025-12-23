"use client";

import { Search } from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";
import { useTranslation } from "@/context/LanguageContext";

export default function ComplianceFilters({ filters, onFilterChange, onSearch }) {
  const { t } = useTranslation('compliance');

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">{t('filters.title')}</h2>
      <form className="md:flex">
        <div className="mb-2 md:mb-0 md:mr-4 w-full">
          <label className="text-sm font-medium text-gray-700 block mb-1">{t('filters.status')}</label>
          <select
            name="status"
            value={filters.status}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('filters.allStatuses')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="expiring soon">{t('status.expiringSoon')}</option>
            <option value="expired">{t('status.expired')}</option>
            <option value="pending">{t('status.pending')}</option>
          </select>
        </div>

        <div className="mb-2 md:mb-0 md:mr-4 w-full">
        <label className="text-sm font-medium text-gray-700 block mb-1">{t('filters.type')}</label>
          <select
            name="type"
            value={filters.type}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('filters.allTypes')}</option>
            {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2 md:mb-0 md:mr-4 w-full">
        <label className="text-sm font-medium text-gray-700 block mb-1">{t('filters.entity')}</label>
          <select
            name="entity"
            value={filters.entity}
            onChange={onFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('filters.allEntities')}</option>
            <option value="Vehicle">{t('filters.vehicles')}</option>
            <option value="Driver">{t('filters.drivers')}</option>
            <option value="Company">{t('entityTypes.company')}</option>
            <option value="Other">{t('entityTypes.other')}</option>
          </select>
        </div>

        <div className="relative flex-grow mb-2 md:mb-0 md:mr-4">
        <label className="text-sm font-medium text-gray-700 block mb-1">{t('filters.search')}</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={onSearch}
            className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('placeholders.searchRecords')}
          />
        </div>
      </form>
    </div>
  );
}