"use client";

export default function ComplianceTypes({ types, complianceItems, onTypeSelect }) {
  return (
    <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Compliance Types</h2>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {Object.entries(types).map(([key, type]) => {
            const count = complianceItems.filter(
              item => item.compliance_type === key
            ).length;
            
            if (count === 0) return null;
            
            return (
              <div 
                key={key}
                className="text-black flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => onTypeSelect(key)}
              >
                <div className="flex items-center">
                  {type.icon}
                  <span className="ml-2 text-sm text-gray-700">{type.name}</span>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}