/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { X, FileText, Clock, Download, ExternalLink, Shield, Building2, User, FileCheck } from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";

export default function ViewComplianceModal({ isOpen, onClose, compliance }) {
  const [imagePreviewExpanded, setImagePreviewExpanded] = useState(false);

  if (!isOpen || !compliance) return null;

  // Get type info from constants or use defaults
  const typeInfo = COMPLIANCE_TYPES[compliance.compliance_type] || {
    name: compliance.compliance_type || "Unknown Type",
    icon: <FileText size={18} className="text-gray-500 dark:text-gray-400" />,
    description: "Compliance document",
    frequency: "Unknown"
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'expiring soon':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'vehicle':
        return <FileCheck size={20} />;
      case 'driver':
        return <User size={20} />;
      case 'company':
        return <Building2 size={20} />;
      default:
        return <Shield size={20} />;
    }
  };

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDateForDisplayMMDDYYYY(dateString);
    } catch (error) {
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

  const daysUntilExpiration = getDaysUntilExpiration();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Compliance Details</h2>
              <p className="text-blue-100">{compliance.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(compliance.status)}`}>
              {compliance.status || "Active"}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {getEntityIcon(compliance.entity_type)}
              {compliance.entity_type || "Unknown"}
            </span>
            {daysUntilExpiration !== null && (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                ${daysUntilExpiration <= 0
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : daysUntilExpiration <= 7
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                }`}>
                <Clock size={16} className="mr-1" />
                {daysUntilExpiration <= 0
                  ? "Expired"
                  : daysUntilExpiration === 1
                    ? "1 day left"
                    : `${daysUntilExpiration} days left`}
              </span>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="space-y-6">
            {/* Compliance Information Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Shield size={20} className="mr-2 text-gray-600 dark:text-gray-400" />
                Compliance Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Compliance Type</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{typeInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Renewal Frequency</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{typeInfo.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Document Number</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{compliance.document_number || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Issuing Authority</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{compliance.issuing_authority || "—"}</p>
                </div>
              </div>
            </div>

            {/* Entity Information Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                {getEntityIcon(compliance.entity_type)}
                <span className="ml-2">Entity Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Entity Type</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{compliance.entity_type || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Entity Name</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{compliance.entity_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Issue Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {compliance.issue_date ? formatDate(compliance.issue_date) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expiration Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {compliance.expiration_date ? formatDate(compliance.expiration_date) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created On</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {compliance.created_at
                      ? new Date(compliance.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {compliance.notes && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <FileText size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Notes
                </h3>
                <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{compliance.notes}</p>
              </div>
            )}

            {/* Document Section */}
            {compliance.document_url && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FileText size={20} className="mr-2 text-gray-600 dark:text-gray-400" />
                  Document
                </h3>

                {/* Document Preview for images */}
                {isImageDocument() && (
                  <div className={`mb-4 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden ${
                    imagePreviewExpanded ? "max-h-none" : "max-h-60"
                  }`}>
                    <div className="bg-gray-800 dark:bg-gray-900 px-3 py-2 flex justify-between items-center">
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
                    <div className="bg-gray-100 dark:bg-gray-800 flex justify-center">
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

                {/* Document Actions */}
                <div className="flex flex-wrap gap-3">
                  {isPdfDocument() ? (
                    <a
                      href={compliance.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FileText size={16} className="mr-2" />
                      View PDF
                    </a>
                  ) : !isImageDocument() && (
                    <a
                      href={compliance.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      View Document
                    </a>
                  )}
                  <button
                    onClick={handleDownloadDocument}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
