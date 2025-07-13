// src/components/dashboard/EarningsBreakdown.js
import { BarChart2, FileText, Truck, DollarSign } from "lucide-react";

/**
 * Earnings Breakdown Component
 * Shows the distribution of earnings between completed loads (factored/invoiced) and standalone invoices
 * 
 * @param {Object} props Component props
 * @param {Object} props.stats Dashboard statistics containing earnings data
 */
export default function EarningsBreakdown({ stats }) {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calculate total earnings from all sources
  const totalLoadEarnings = stats.loadEarnings || 0;
  const standaloneInvoiceEarnings = stats.standaloneInvoiceEarnings || 0;
  const factoredEarnings = stats.factoredEarnings || 0;
  const invoicedLoadEarnings = stats.invoicedLoadEarnings || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm mb-6 p-5 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <BarChart2 size={20} className="mr-2 text-blue-500" />
        Earnings Breakdown
      </h3>
      
      {/* Main earnings sources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500">Factored Loads</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(factoredEarnings)}</p>
          </div>
          <Truck size={22} className="text-green-600" />
        </div>
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500">Invoiced Loads</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(invoicedLoadEarnings)}</p>
          </div>
          <FileText size={22} className="text-blue-600" />
        </div>
      </div>
      
      {/* Standalone invoices if any */}
      {standaloneInvoiceEarnings > 0 && (
        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Other Invoice Payments</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(standaloneInvoiceEarnings)}</p>
          </div>
          <DollarSign size={22} className="text-purple-600" />
        </div>
      )}
      
      {/* Progress bar visualization */}
      {stats.earnings > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Earnings Distribution</p>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 float-left"
              style={{ width: `${(factoredEarnings / stats.earnings) * 100}%` }}
              title={`Factored Loads: ${formatCurrency(factoredEarnings)}`}
            ></div>
            <div 
              className="h-full bg-blue-500 float-left"
              style={{ width: `${(invoicedLoadEarnings / stats.earnings) * 100}%` }}
              title={`Invoiced Loads: ${formatCurrency(invoicedLoadEarnings)}`}
            ></div>
            {standaloneInvoiceEarnings > 0 && (
              <div 
                className="h-full bg-purple-500 float-left"
                style={{ width: `${(standaloneInvoiceEarnings / stats.earnings) * 100}%` }}
                title={`Other Invoices: ${formatCurrency(standaloneInvoiceEarnings)}`}
              ></div>
            )}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Factored ({stats.earnings > 0 ? Math.round((factoredEarnings / stats.earnings) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span>Invoiced ({stats.earnings > 0 ? Math.round((invoicedLoadEarnings / stats.earnings) * 100) : 0}%)</span>
            </div>
            {standaloneInvoiceEarnings > 0 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                <span>Other ({stats.earnings > 0 ? Math.round((standaloneInvoiceEarnings / stats.earnings) * 100) : 0}%)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}