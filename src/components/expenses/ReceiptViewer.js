// src/components/expenses/ReceiptViewer.js
"use client";

import { useState } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw, AlertCircle, FileText, Calendar, Clock } from "lucide-react";

export default function ReceiptViewer({ isOpen, onClose, receipt }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState(false);

  if (!isOpen || !receipt) return null;

  const hasReceipt = receipt.receipt_image && receipt.receipt_image.length > 0;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format date
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

  const handleZoomIn = () => {
    setZoomLevel(prevZoom => Math.min(prevZoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prevZoom => Math.max(prevZoom - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  const handleDownload = () => {
    if (!hasReceipt) return;
    
    const link = document.createElement('a');
    link.href = receipt.receipt_image;
    link.download = `receipt-${receipt.id || 'expense'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageError = () => {
    setError(true);
  };

  // Check if document is an image or PDF
  const isImageDocument = () => {
    if (!receipt.receipt_image) return false;
    
    const url = receipt.receipt_image.toLowerCase();
    return url.endsWith('.jpg') || url.endsWith('.jpeg') || 
           url.endsWith('.png') || url.endsWith('.gif') || 
           url.endsWith('.webp');
  };

  const isPdfDocument = () => {
    if (!receipt.receipt_image) return false;
    
    return receipt.receipt_image.toLowerCase().endsWith('.pdf');
  };

  // Get category style
  const getCategoryStyle = () => {
    const categoryStyles = {
      'Fuel': 'bg-yellow-100 text-yellow-800',
      'Maintenance': 'bg-blue-100 text-blue-800',
      'Insurance': 'bg-green-100 text-green-800',
      'Tolls': 'bg-purple-100 text-purple-800',
      'Office': 'bg-gray-100 text-gray-800',
      'Permits': 'bg-indigo-100 text-indigo-800',
      'Meals': 'bg-red-100 text-red-800'
    };
    
    return categoryStyles[receipt.category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? "" : "hidden"}`}>
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <span className="truncate max-w-md">Receipt for {receipt.description}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Document Preview (if image) */}
          {hasReceipt && isImageDocument() && !error && (
            <div className="mb-6 border rounded-lg overflow-hidden bg-gray-50">
              <div className="bg-gray-800 px-3 py-2 flex justify-between items-center">
                <span className="text-white text-sm font-medium">Receipt Image</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleZoomIn}
                    className="text-white hover:text-gray-200 p-1"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="text-white hover:text-gray-200 p-1"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="text-white hover:text-gray-200 p-1"
                    title="Rotate"
                  >
                    <RotateCw size={16} />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-white hover:text-gray-200 p-1"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 flex justify-center p-4">
                <div className="relative">
                  <img
                    src={receipt.receipt_image}
                    alt={`Receipt for ${receipt.description}`}
                    className="max-h-[400px] w-auto object-contain transition-all duration-300"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    }}
                    onError={handleImageError}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error state for image loading */}
          {hasReceipt && error && (
            <div className="mb-6 rounded-lg overflow-hidden bg-red-50 p-6 text-center border border-red-200">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium text-red-800 mb-2">Unable to display receipt image</h3>
              <p className="text-sm text-red-600 mb-4">The receipt image might be unavailable or in an unsupported format.</p>
              <a
                href={receipt.receipt_image}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <FileText size={16} className="mr-2" />
                Open in New Tab
              </a>
            </div>
          )}

          {/* PDF Document */}
          {hasReceipt && isPdfDocument() && (
            <div className="mb-6 rounded-lg overflow-hidden bg-blue-50 p-6 text-center border border-blue-200">
              <FileText size={48} className="mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">PDF Receipt</h3>
              <p className="text-sm text-blue-600 mb-4">This receipt is stored as a PDF document.</p>
              <div className="flex justify-center space-x-4">
                <a
                  href={receipt.receipt_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FileText size={16} className="mr-2" />
                  View PDF
                </a>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* No receipt state */}
          {!hasReceipt && (
            <div className="mb-6 rounded-lg overflow-hidden bg-gray-50 p-6 text-center border border-gray-200">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Receipt Available</h3>
              <p className="text-sm text-gray-600">This expense doesn&#39;t have an attached receipt.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Information */}
            <div className="block mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Expense Information</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm mb-1">
                  <span className="font-medium">Description:</span> <span className="text-gray-700">{receipt.description}</span>
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Amount:</span> <span className="text-gray-700">{formatCurrency(receipt.amount)}</span>
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Category:</span>{" "}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle()}`}>
                    {receipt.category}
                  </span>
                </p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="block mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Payment Information</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm mb-1">
                  <span className="font-medium">Payment Method:</span> <span className="text-gray-700">{receipt.payment_method}</span>
                </p>
                <div className="flex items-center text-sm mb-1">
                  <Calendar size={14} className="text-gray-400 mr-1 flex-shrink-0" />
                  <span className="font-medium">Date:</span>{" "}
                  <span className="text-gray-700 ml-1">{formatDate(receipt.date)}</span>
                </div>
                <p className="text-sm mb-1">
                  <span className="font-medium">Tax Deductible:</span>{" "}
                  <span className="text-gray-700">{receipt.deductible !== false ? "Yes" : "No"}</span>
                </p>
              </div>
            </div>

            {/* Vehicle Information */}
            {receipt.vehicle_id && (
              <div className="block mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Vehicle Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm mb-1">
                    <span className="font-medium">Vehicle ID:</span> <span className="text-gray-700">{receipt.vehicle_id}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="block mb-4 md:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {receipt.notes || "No notes available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}