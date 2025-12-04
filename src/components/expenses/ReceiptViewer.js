/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertCircle,
  FileText,
  Calendar,
  Truck,
  ExternalLink
} from 'lucide-react';

/**
 * Receipt Viewer Modal
 *
 * Modal for viewing expense receipts with zoom and rotate controls.
 * Supports dark mode.
 */
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
    }).format(value || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString || 'N/A';
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
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

  const isImageDocument = () => {
    if (!receipt.receipt_image) return false;
    const url = receipt.receipt_image.toLowerCase();
    return (
      url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.png') ||
      url.endsWith('.gif') ||
      url.endsWith('.webp')
    );
  };

  const isPdfDocument = () => {
    if (!receipt.receipt_image) return false;
    return receipt.receipt_image.toLowerCase().endsWith('.pdf');
  };

  // Get category style with dark mode
  const getCategoryStyle = () => {
    const styles = {
      Fuel: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
      Maintenance: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      Insurance: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      Tolls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      Office: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      Permits: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      Meals: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      Other: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300'
    };
    return styles[receipt.category] || styles.Other;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Receipt Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Receipt Preview Section */}
            {hasReceipt ? (
              <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {isImageDocument() && !error ? (
                  <div>
                    {/* Image Controls */}
                    <div className="bg-gray-800 dark:bg-gray-900 px-4 py-3 flex justify-between items-center">
                      <span className="text-white text-sm font-medium">Receipt Image</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleZoomIn}
                          className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleZoomOut}
                          className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleRotate}
                          className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                          title="Rotate"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleDownload}
                          className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Image Container */}
                    <div className="bg-gray-50 dark:bg-gray-900 flex justify-center p-6 min-h-[200px] overflow-hidden">
                      <img
                        src={receipt.receipt_image}
                        alt={`Receipt for ${receipt.description}`}
                        className="max-h-[400px] w-auto object-contain transition-all duration-300"
                        style={{
                          transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                        }}
                        onError={handleImageError}
                      />
                    </div>
                  </div>
                ) : isPdfDocument() ? (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-blue-500 dark:text-blue-400" />
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                      PDF Receipt
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                      This receipt is stored as a PDF document.
                    </p>
                    <div className="flex justify-center gap-4">
                      <a
                        href={receipt.receipt_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View PDF
                      </a>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-red-50 dark:bg-red-900/20 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 dark:text-red-400" />
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                      Unable to display receipt
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                      The image might be unavailable or in an unsupported format.
                    </p>
                    <a
                      href={receipt.receipt_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 p-8 bg-gray-50 dark:bg-gray-700/50 text-center rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  No Receipt Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This expense doesn&apos;t have an attached receipt.
                </p>
              </div>
            )}

            {/* Expense Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expense Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Expense Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {receipt.description || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(receipt.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle()}`}
                    >
                      {receipt.category || 'Other'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Payment Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Method</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {receipt.payment_method || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(receipt.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tax Deductible</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {receipt.deductible !== false ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information (if available) */}
              {receipt.vehicle_id && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    Vehicle Information
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vehicle ID</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {receipt.vehicle_id}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className={receipt.vehicle_id ? '' : 'md:col-span-2'}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Notes
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {receipt.notes || 'No notes available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl flex justify-end gap-3">
            {hasReceipt && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
