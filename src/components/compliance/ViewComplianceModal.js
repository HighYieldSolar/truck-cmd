/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, Fragment } from "react";
import { X, FileText, Calendar, Clock, Download, ExternalLink } from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";
import StatusBadge from "./StatusBadge";

export default function ViewComplianceModal({ isOpen, onClose, compliance }) {
  const [imagePreviewExpanded, setImagePreviewExpanded] = useState(false);
  
  if (!isOpen || !compliance) return null;

  // Get type info from constants or use defaults
  const typeInfo = COMPLIANCE_TYPES[compliance.compliance_type] || {
    name: compliance.compliance_type || "Unknown Type",
    icon: <FileText size={18} className="text-gray-500" />,
    description: "Compliance document",
    frequency: "Unknown"
  };

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || "N/A";
    }
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = () => {
    if (!compliance.expiration_date) return null;
    
    const today = new Date();
    const expirationDate = new Date(compliance.expiration_date);
    const differenceInTime = expirationDate - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };

  // Check if document is an image or PDF
  const isImageDocument = () => {
    if (!compliance.document_url) return false;
    
    const url = compliance.document_url.toLowerCase();
    return url.endsWith('.jpg') || url.endsWith('.jpeg') || 
           url.endsWith('.png') || url.endsWith('.gif') || 
           url.endsWith('.webp');
  };

  const isPdfDocument = () => {
    if (!compliance.document_url) return false;
    
    return compliance.document_url.toLowerCase().endsWith('.pdf');
  };

  // Get file name from URL
  const getDocumentFileName = () => {
    if (!compliance.document_url) return "";
    
    const urlParts = compliance.document_url.split('/');
    return urlParts[urlParts.length - 1];
  };

  // Download document
  const handleDownloadDocument = () => {
    if (!compliance.document_url) return;
    
    const link = document.createElement('a');
    link.href = compliance.document_url;
    link.download = getDocumentFileName() || `compliance-document-${compliance.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? "" : "hidden"}`}>
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] p-6 border border-gray-200">
      
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">

<div className="mr-2 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              {typeInfo.icon}
            </div>
            <span className="truncate max-w-md">{compliance.title || typeInfo.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>


        <div className="p-6">
          {/* Status and days left */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={compliance.status || "Active"} />
            
            {getDaysUntilExpiration() !== null && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${getDaysUntilExpiration() <= 0 
                  ? "bg-red-100 text-red-800" 
                  : getDaysUntilExpiration() <= 7 
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                <Clock size={12} className="mr-1" />
                {getDaysUntilExpiration() <= 0 
                  ? "Expired" 
                  : getDaysUntilExpiration() === 1 
                    ? "1 day left" 
                    : `${getDaysUntilExpiration()} days left`}
              </span>
            )}
          </div>

          {/* Document Preview (if image) */}
          {isImageDocument() && (
            <div className={`mb-6 border rounded-lg overflow-hidden ${
              imagePreviewExpanded ? "max-h-none" : "max-h-60"
            }`}>
              <div className="bg-gray-800 px-3 py-2 flex justify-between items-center">
                <span className="text-white text-sm font-medium">Document Preview</span>
                <div className="flex items-center space-x-2">

<button
 onClick={() => setImagePreviewExpanded(!imagePreviewExpanded)}
                    className="text-white hover:text-gray-200 text-xs"
                  >
                    {imagePreviewExpanded ? "Collapse" : "Expand"}
                  </button>
                  <button
                    onClick={handleDownloadDocument}
                    className="text-white hover:text-gray-200"
                    title="Download Document"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 flex justify-center">
                <img
                    src={compliance.document_url}
                    alt="Document Preview"
                  className={`${
                    imagePreviewExpanded 
                      ? "max-h-[500px] w-auto" 
                      : "max-h-52 w-auto"
                  } object-contain`}
                />
              </div>
            </div>
          )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="block mb-4">
 <h3 className="text-sm font-medium mb-1">Entity Information</h3>
 <div className="bg-gray-50 p-3 rounded-md">
 <p className="text-sm  mb-1">
 <span className="font-medium">Type:</span> <span className="text-gray-500">{compliance.entity_type || "N/A"}</span>
 </p>
 <p className="text-sm  mb-1">
 <span className="font-medium">Name:</span> <span className="text-gray-500">{compliance.entity_name || "N/A"}</span>
 </p>
 </div>
 </div>

 <div className="block mb-4">
 <h3 className="text-sm font-medium mb-1">Document Information</h3>
 <div className="bg-gray-50 p-3 rounded-md">
 <p className="text-sm  mb-1">
 <span className="font-medium">Document Number:</span> <span className="text-gray-500">{compliance.document_number || "N/A"}</span>
 </p>
 <p className="text-sm  mb-1">
 <span className="font-medium">Issuing Authority:</span> <span className="text-gray-500">{compliance.issuing_authority || "N/A"}</span>
 </p>
 </div>
 </div>

 <div className="block mb-4">
 <h3 className="text-sm font-medium mb-1">Dates</h3>
 <div className="bg-gray-50 p-3 rounded-md">
 <div className="flex items-center mb-1">
 <Calendar size={14} className="text-gray-400 mr-1" />
 <p className="text-sm ">
 <span className="font-medium">Issue Date:</span>{" "}
 <span className="text-gray-500">{formatDate(compliance.issue_date)}</span>
 </p>
 </div>
 <div className="flex items-center">
 <Calendar size={14} className="text-gray-400 mr-1" />
 <p className="text-sm ">
 <span className="font-medium">Expiration Date:</span>{" "}
 <span className="text-gray-500">{formatDate(compliance.expiration_date)}</span>
 </p>
 </div>
 </div>
 </div>

 <div className="block mb-4">
 <h3 className="text-sm font-medium mb-1">Compliance Type</h3>
 <div className="bg-gray-50 p-3 rounded-md">
 <p className="text-sm  mb-1">
 <span className="font-medium">Type:</span> <span className="text-gray-500">{typeInfo.name}</span>
 </p>
 <p className="text-sm  mb-1">
 <span className="font-medium">Frequency:</span> <span className="text-gray-500">{typeInfo.frequency}</span>
 </p>
 </div>
 </div>

 <div className="md:col-span-2 block mb-4">
 <h3 className="text-sm font-medium mb-1">Notes</h3>
 <div className="bg-gray-50 p-3 rounded-md">
 <p className="text-sm text-gray-500 whitespace-pre-wrap">
 {compliance.notes || "No notes available."}
 </p>
 </div>
 </div>

            {compliance.document_url && !isImageDocument() && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Document</h3>
                <div className="bg-gray-50 p-3 rounded-md flex space-x-4">
                  {isPdfDocument() ? (
                    <a
                      href={compliance.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FileText size={16} className="mr-2" />
                      View PDF
                    </a>
                  ) : (
                    <>
                      <a
                        href={compliance.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <ExternalLink size={16} className="mr-2" />
                        View Document
                      </a>
                    </>
                  )}
                  <button
                    onClick={handleDownloadDocument}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
</div>
 );
}