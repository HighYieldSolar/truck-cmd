"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle, FileText, AlertCircle, Calendar, Info } from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";

export default function ComplianceFormModal({ isOpen, onClose, compliance, onSave, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: "",
    compliance_type: "REGISTRATION",
    entity_type: "Vehicle",
    entity_name: "",
    document_number: "",
    issue_date: "",
    expiration_date: "",
    issuing_authority: "",
    notes: "",
    status: "Active",
    error: "",
    document_file: null
  });

  // Initialize form when editing existing compliance item
  useEffect(() => {
    if (compliance) {
      setFormData({
        title: compliance.title || "",
        compliance_type: compliance.compliance_type || "REGISTRATION",
        entity_type: compliance.entity_type || "Vehicle",
        entity_name: compliance.entity_name || "",
        document_number: compliance.document_number || "",
        issue_date: compliance.issue_date || "",
        expiration_date: compliance.expiration_date || "",
        issuing_authority: compliance.issuing_authority || "",
        notes: compliance.notes || "",
        status: compliance.status || "Active",
        error: "",
        document_file: null // Reset file input when editing
      });
    } else {
      // Reset form for new compliance item
      setFormData({
        title: "",
        compliance_type: "REGISTRATION",
        entity_type: "Vehicle",
        entity_name: "",
        document_number: "",
        issue_date: "",
        expiration_date: "",
        issuing_authority: "",
        notes: "",
        status: "Active",
        error: "",
        document_file: null
      });
    }
  }, [compliance, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && files?.length > 0) {
      setFormData({
        ...formData,
        document_file: files[0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${isOpen ? "" : "hidden"}`}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center">
            <FileText size={20} className="mr-2" />
            {compliance ? "Edit Compliance Record" : "Add Compliance Record"}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-white hover:bg-blue-500 rounded-full transition-colors focus:outline-none"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form content */}
        <div className="p-6">
          {formData.error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{formData.error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
                <Info size={18} className="mr-2 text-blue-500" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Vehicle Registration for Truck #12"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="compliance_type" className="block text-sm font-medium text-gray-700 mb-1">
                      Compliance Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="compliance_type"
                      name="compliance_type"
                      value={formData.compliance_type}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    >
                      {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Entity Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
                <CheckCircle size={18} className="mr-2 text-green-500" />
                Entity Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="entity_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="entity_type"
                    name="entity_type"
                    value={formData.entity_type}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="Vehicle">Vehicle</option>
                    <option value="Driver">Driver</option>
                    <option value="Company">Company</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="entity_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="entity_name"
                    name="entity_name"
                    value={formData.entity_name}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Truck #12 or John Smith"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Document Number
                  </label>
                  <input
                    type="text"
                    id="document_number"
                    name="document_number"
                    value={formData.document_number}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. License or Permit Number"
                  />
                </div>
                
                <div>
                  <label htmlFor="issuing_authority" className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Authority
                  </label>
                  <input
                    type="text"
                    id="issuing_authority"
                    name="issuing_authority"
                    value={formData.issuing_authority}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. DMV or DOT"
                  />
                </div>
              </div>
            </div>
            
            {/* Dates Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
                <Calendar size={18} className="mr-2 text-orange-500" />
                Important Dates
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    id="issue_date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="expiration_date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Document Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center border-b border-gray-200 pb-2">
                <FileText size={18} className="mr-2 text-blue-500" />
                Document Details
              </h3>
              
              <div>
                <label htmlFor="document_file" className="block text-sm font-medium text-gray-700 mb-1">
                  Document File
                </label>
                <input
                  type="file"
                  id="document_file"
                  name="document_file"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none"
                />
                {formData.document_file && (
                  <p className="mt-1 text-sm text-gray-500 flex items-center">
                    <CheckCircle size={14} className="text-green-500 mr-1" />
                    Selected file: {formData.document_file.name}
                  </p>
                )}
                {compliance?.document_url && !formData.document_file && (
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <FileText size={14} className="text-blue-500 mr-1" />
                    Current document on file
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Any additional information"
                ></textarea>
              </div>
            </div>
            
            {/* Form actions */}
            <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    {compliance ? "Update Record" : "Save Record"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}