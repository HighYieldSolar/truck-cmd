"use client";

import { useTranslation } from "@/context/LanguageContext";

export default function ComplianceTypes({ types, complianceItems, onTypeSelect }) {
  const { t } = useTranslation('compliance');

  const hasItems = Object.entries(types).some(([key]) =>
    complianceItems.some(item => item.compliance_type === key)
  );
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">{t('types.complianceTypes')}</h2>
      <div className="md:flex md:flex-wrap">
        {hasItems ? (
          Object.entries(types).map(([key, type]) => {
            const count = complianceItems.filter(item => item.compliance_type === key).length;
            if (count === 0) return null;
            return (
              <div
                key={key}
                className="bg-gray-50 rounded-md p-4 flex items-center justify-between w-full mb-4 md:w-1/2 md:mr-4 last:mr-0"
                onClick={() => onTypeSelect(key)}
              >
                <div className="flex items-center">
                  {type.icon}
                  <span key={`${key}-name`} className="ml-2 text-sm font-semibold text-gray-700">{type.name}</span>
                </div>
                <span key={`${key}-count`} className="text-xs text-gray-500">
                  {count} {count !== 1 ? t('itemCount.items') : t('itemCount.item')}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">{t('emptyState.noComplianceItems')}</p>
        )}
      </div>
    </div>
  );
}