// src/components/factoring/FactoringForm.js
import { useState } from 'react';
import { DollarSign, Building, Calendar, FileText, Info } from 'lucide-react';

export default function FactoringForm({ loadDetails, onFactoringDataChange }) {
  const [factoringData, setFactoringData] = useState({
    factoringCompany: '',
    amount: loadDetails?.rate || 0,
    factorDate: new Date().toISOString().split('T')[0],
    feeAmount: 0,
    referenceNumber: '',
    notes: ''
  });
  
  // Calculate fee percentage and net amount
  const feePercentage = factoringData.amount > 0 
    ? ((factoringData.feeAmount / factoringData.amount) * 100).toFixed(2)
    : 0;
    
  const netAmount = (factoringData.amount - factoringData.feeAmount).toFixed(2);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...factoringData,
      [name]: value
    };
    
    setFactoringData(updatedData);
    
    // Notify parent component
    if (onFactoringDataChange) {
      onFactoringDataChange(updatedData);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info size={18} className="text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              When using factoring, the load is marked as completed and the net amount 
              (after factoring fees) will be recorded as earnings on your dashboard.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="factoringCompany" className="block text-sm font-medium text-gray-700 mb-1">
            Factoring Company*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="factoringCompany"
              name="factoringCompany"
              value={factoringData.factoringCompany}
              onChange={handleChange}
              placeholder="Enter factoring company name"
              className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="factorDate" className="block text-sm font-medium text-gray-700 mb-1">
            Factoring Date*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="factorDate"
              name="factorDate"
              value={factoringData.factorDate}
              onChange={handleChange}
              className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Total Amount*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={16} className="text-gray-400" />
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              value={factoringData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="feeAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Factoring Fee
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={16} className="text-gray-400" />
            </div>
            <input
              type="number"
              id="feeAmount"
              name="feeAmount"
              value={factoringData.feeAmount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">{feePercentage}%</span>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Reference Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="referenceNumber"
              name="referenceNumber"
              value={factoringData.referenceNumber}
              onChange={handleChange}
              placeholder="Optional reference or transaction ID"
              className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
        
        <div className="md:col-span-2 bg-green-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-green-800 font-medium">Net Amount (After Fees):</span>
            <span className="text-green-800 font-bold text-xl">${netAmount}</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            This is the amount that will be recorded as earnings.
          </p>
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={factoringData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Enter any additional notes about this factoring transaction"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
}