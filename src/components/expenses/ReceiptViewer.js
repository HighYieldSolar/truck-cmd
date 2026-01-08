/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/context/LanguageContext";
import { supabase } from '@/lib/supabaseClient';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Calendar,
  Truck,
  Loader2
} from 'lucide-react';

/**
 * Receipt Viewer Modal
 *
 * Modal for viewing expense receipts with zoom and rotate controls.
 * Supports dark mode.
 */
export default function ReceiptViewer({ isOpen, onClose, receipt }) {
  const { t } = useTranslation('expenses');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // Fetch vehicle info when modal opens with a vehicle_id
  useEffect(() => {
    async function fetchVehicleInfo() {
      if (!isOpen || !receipt?.vehicle_id) {
        setVehicleInfo(null);
        return;
      }

      // Skip if it's not a valid UUID (e.g., it's already a name)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(receipt.vehicle_id)) {
        // Not a UUID, might be a vehicle name already
        setVehicleInfo({ name: receipt.vehicle_id, license_plate: null });
        return;
      }

      setVehicleLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('name, license_plate, make, model')
          .eq('id', receipt.vehicle_id)
          .single();

        if (!error && data) {
          setVehicleInfo(data);
        } else {
          setVehicleInfo(null);
        }
      } catch (err) {
        console.error('Error fetching vehicle info:', err);
        setVehicleInfo(null);
      } finally {
        setVehicleLoading(false);
      }
    }

    fetchVehicleInfo();
  }, [isOpen, receipt?.vehicle_id]);

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

  const handleDownload = async () => {
    if (!hasReceipt || isDownloading) return;

    setIsDownloading(true);

    try {
      // Fetch the image as a blob to force download (bypasses cross-origin issues)
      const response = await fetch(receipt.receipt_image);

      if (!response.ok) {
        throw new Error('Failed to fetch receipt');
      }

      const blob = await response.blob();

      // Determine file extension from content type or URL
      const contentType = blob.type || 'image/jpeg';
      let extension = 'jpg';
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('gif')) extension = 'gif';
      else if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('pdf')) extension = 'pdf';

      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `receipt-${receipt.id || 'expense'}-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in new tab if blob download fails
      window.open(receipt.receipt_image, '_blank');
    } finally {
      setIsDownloading(false);
    }
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

  // Format notes to replace vehicle UUID with vehicle name
  const formatNotes = (notes) => {
    if (!notes) return null;
    if (!vehicleInfo || !receipt.vehicle_id) return notes;

    // Replace the UUID pattern in notes with vehicle name
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

    // Build the display name
    const displayName = vehicleInfo.license_plate
      ? `${vehicleInfo.name} (${vehicleInfo.license_plate})`
      : vehicleInfo.name;

    return notes.replace(uuidRegex, displayName);
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
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-xl sticky top-0 z-10">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{t('receiptViewer.title')}</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Receipt Preview Section */}
            {hasReceipt ? (
              <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {isImageDocument() && !error ? (
                  <div>
                    {/* Image Controls */}
                    <div className="bg-gray-800 dark:bg-gray-900 px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
                      <span className="text-white text-xs sm:text-sm font-medium truncate">{t('receiptViewer.receiptImage')}</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={handleZoomIn}
                          className="p-2 sm:p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                          title={t('receiptViewer.zoomIn')}
                        >
                          <ZoomIn className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={handleZoomOut}
                          className="p-2 sm:p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                          title={t('receiptViewer.zoomOut')}
                        >
                          <ZoomOut className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={handleRotate}
                          className="p-2 sm:p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                          title={t('receiptViewer.rotate')}
                        >
                          <RotateCw className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={handleDownload}
                          disabled={isDownloading}
                          className="p-2 sm:p-1.5 text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                          title={isDownloading ? t('receiptViewer.downloading') : t('receiptViewer.download')}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Download className="h-5 w-5 sm:h-4 sm:w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {/* Image Container - Click to download */}
                    <div
                      className="bg-gray-50 dark:bg-gray-900 flex justify-center p-3 sm:p-6 min-h-[200px] sm:min-h-[250px] overflow-hidden cursor-pointer"
                      onClick={handleDownload}
                      title={t('receiptViewer.clickToDownload')}
                    >
                      <img
                        src={receipt.receipt_image}
                        alt={`Receipt for ${receipt.description}`}
                        className="max-h-[300px] sm:max-h-[400px] w-auto object-contain transition-all duration-300 hover:opacity-90"
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
                      {t('receiptViewer.pdfReceipt')}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                      {t('receiptViewer.pdfStored')}
                    </p>
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isDownloading ? t('receiptViewer.downloading') : t('receiptViewer.downloadPdf')}
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 dark:bg-amber-900/20 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-amber-500 dark:text-amber-400" />
                    <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">
                      {t('receiptViewer.documentStored')}
                    </h3>
                    <p className="text-sm text-amber-600 dark:text-amber-300 mb-4">
                      {t('receiptViewer.clickToDownloadDocument')}
                    </p>
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isDownloading ? t('receiptViewer.downloading') : t('receiptViewer.downloadDocument')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 p-8 bg-gray-50 dark:bg-gray-700/50 text-center rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {t('receiptViewer.noReceiptAvailable')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('receiptViewer.noReceiptAttached')}
                </p>
              </div>
            )}

            {/* Expense Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Expense Information */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  {t('receiptViewer.expenseInformation')}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('common.description')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                      {receipt.description || t('common.na')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('common.amount')}</p>
                    <p className="text-base sm:text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(receipt.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('common.category')}</p>
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
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  {t('receiptViewer.paymentInformation')}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('common.paymentMethod')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {receipt.payment_method || t('common.na')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('common.date')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(receipt.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('common.taxDeductible')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {receipt.deductible !== false ? t('common.yes') : t('common.no')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information (if available) */}
              {receipt.vehicle_id && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    {t('receiptViewer.vehicleInformation')}
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-3">
                    {vehicleLoading ? (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : vehicleInfo ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('receiptViewer.vehicle')}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {vehicleInfo.name}
                            {vehicleInfo.make && vehicleInfo.model && (
                              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1 text-xs sm:text-sm">
                                ({vehicleInfo.make} {vehicleInfo.model})
                              </span>
                            )}
                          </p>
                        </div>
                        {vehicleInfo.license_plate && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('receiptViewer.licensePlate')}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {vehicleInfo.license_plate}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t('receiptViewer.vehicle')}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {receipt.vehicle_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className={receipt.vehicle_id ? '' : 'sm:col-span-2'}>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  {t('receiptViewer.notes')}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {formatNotes(receipt.notes) || t('receiptViewer.noNotesAvailable')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                {t('receiptViewer.close')}
              </button>
              {hasReceipt && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isDownloading ? t('receiptViewer.downloading') : t('receiptViewer.downloadReceipt')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
