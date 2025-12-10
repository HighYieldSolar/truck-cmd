// src/components/fuel/ReceiptViewerModal.js
"use client";

import { useState, useRef } from "react";
import {
  X,
  Download,
  Share2,
  Printer,
  Maximize2,
  Fuel,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  Info,
  Loader2
} from "lucide-react";
import SupabaseImage from "./SupabaseImage";

export default function ReceiptViewerModal({ isOpen, onClose, receipt, vehicleInfo }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  
  const imageRef = useRef(null);

  if (!isOpen || !receipt) return null;

  const handleDownload = async () => {
    if (!receipt.receipt_image || isDownloading) return;

    // Validate URL
    try {
      new URL(receipt.receipt_image);
    } catch (_) {
      return; // Invalid URL - silently abort download
    }

    setIsDownloading(true);

    try {
      // Fetch the image as a blob to force instant download
      const response = await fetch(receipt.receipt_image);

      if (!response.ok) {
        throw new Error('Failed to fetch receipt');
      }

      const blob = await response.blob();

      // Determine file extension from content type
      const contentType = blob.type || 'image/jpeg';
      let extension = 'jpg';
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('gif')) extension = 'gif';
      else if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('pdf')) extension = 'pdf';

      // Create filename
      const date = new Date(receipt.date).toISOString().split('T')[0];
      const location = (receipt.location || 'fuel').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `receipt_${date}_${location}.${extension}`;

      // Create blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback: open in new tab if blob download fails
      window.open(receipt.receipt_image, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    // Create a temporary window for printing just the receipt
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      // Write HTML for the print window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fuel Receipt - ${receipt.location}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt-container { max-width: 850px; margin: 0 auto; }
            .receipt-header { text-align: center; margin-bottom: 20px; }
            .receipt-image { max-width: 100%; height: auto; margin-bottom: 20px; }
            .receipt-details { border-top: 1px solid #ddd; padding-top: 20px; }
            .receipt-row { display: flex; margin-bottom: 10px; }
            .receipt-label { font-weight: bold; width: 150px; }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>Fuel Receipt</h1>
              <h2>${receipt.location} - ${new Date(receipt.date).toLocaleDateString()}</h2>
            </div>
            <img src="${receipt.receipt_image}" class="receipt-image" />
            <div class="receipt-details">
              <div class="receipt-row">
                <div class="receipt-label">Date:</div>
                <div>${new Date(receipt.date).toLocaleDateString()}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Location:</div>
                <div>${receipt.location}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">State:</div>
                <div>${receipt.state_name} (${receipt.state})</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Gallons:</div>
                <div>${receipt.gallons.toFixed(3)}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Price/Gallon:</div>
                <div>$${receipt.price_per_gallon.toFixed(3)}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Total Amount:</div>
                <div>$${receipt.total_amount.toFixed(2)}</div>
              </div>
              <div class="receipt-row">
                <div class="receipt-label">Vehicle:</div>
                <div>${receipt.vehicle_id || 'Not specified'}</div>
              </div>
            </div>
            <button onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px 20px; background: #007BFF; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Receipt
            </button>
          </div>
          <script>
            // Auto-trigger print dialog
            setTimeout(() => window.print(), 500);
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    }
  };
  
  const handleShare = async () => {
    if (!receipt.receipt_image) return;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        // Try to share just the text if file sharing fails
        await navigator.share({
          title: `Fuel Receipt - ${receipt.location}`,
          text: `Fuel receipt from ${receipt.location} on ${new Date(receipt.date).toLocaleDateString()}: $${receipt.total_amount.toFixed(2)} for ${receipt.gallons.toFixed(3)} gallons`
        });
      } catch (shareError) {
        alert('Unable to share the receipt.');
      }
    } else {
      // Web Share API not available
      alert('Share functionality is not supported on this browser.');
    }
  };
  
  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  return (
    <div className={`fixed inset-0 bg-gray-900/95 dark:bg-black/95 flex items-center justify-center z-50 ${fullScreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col ${fullScreen ? 'w-full h-full rounded-none' : 'max-w-5xl w-full max-h-[90vh]'}`}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center">
            <Fuel size={20} className="text-blue-600 dark:text-blue-400 mr-2" />
            Fuel Receipt - {receipt.location}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-100 dark:bg-gray-700/50 p-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-end">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleDownload}
              className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 tooltip-wrapper disabled:opacity-50"
              title={isDownloading ? "Downloading..." : "Download"}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Download size={20} />
              )}
              <span className="tooltip">{isDownloading ? "Downloading..." : "Download"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 tooltip-wrapper"
              title="Print"
            >
              <Printer size={20} />
              <span className="tooltip">Print</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 tooltip-wrapper"
              title="Share"
            >
              <Share2 size={20} />
              <span className="tooltip">Share</span>
            </button>
            <button
              onClick={toggleFullScreen}
              className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 tooltip-wrapper"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={20} />
              <span className="tooltip">Fullscreen</span>
            </button>
          </div>
        </div>
        
        {/* Image Viewer */}
        <div className="flex-1 overflow-auto bg-gray-900 dark:bg-gray-900 flex items-center justify-center">
          {receipt.receipt_image ? (
            <div className="flex items-center justify-center" style={{ height: '60vh' }}>
              <SupabaseImage
                src={receipt.receipt_image}
                alt="Fuel receipt"
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
                timestamp={
                  receipt.updated_at
                    ? new Date(receipt.updated_at).getTime()
                    : new Date(receipt.created_at).getTime()
                }
              />
            </div>
          ) : (
            <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
              No receipt image available
            </div>
          )}
        </div>

        {/* Receipt Details */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                <Calendar size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                Date
              </div>
              <div className="text-gray-900 dark:text-gray-100 text-lg font-semibold">{new Date(receipt.date).toLocaleDateString()}</div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                <MapPin size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                State
              </div>
              <div className="text-gray-900 dark:text-gray-100 text-lg font-semibold">{receipt.state_name} ({receipt.state})</div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                <Fuel size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                Gallons
              </div>
              <div className="text-gray-900 dark:text-gray-100 text-lg font-semibold">{receipt.gallons.toFixed(3)}</div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                <DollarSign size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                Total
              </div>
              <div className="text-gray-900 dark:text-gray-100 text-lg font-semibold">${receipt.total_amount.toFixed(2)}</div>
            </div>
          </div>
          
          {/* Additional details if available */}
          {(vehicleInfo || receipt.vehicle_id || receipt.odometer || receipt.notes) && (
            <div className="mt-4 bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex flex-wrap gap-4">
                {(vehicleInfo || receipt.vehicle_id) && (
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                      <Truck size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                      Vehicle
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {vehicleInfo ? (
                        <>
                          {vehicleInfo.name && <span className="font-medium">{vehicleInfo.name}</span>}
                          {vehicleInfo.name && vehicleInfo.license_plate && <span className="mx-1">-</span>}
                          {vehicleInfo.license_plate && <span className="text-gray-700 dark:text-gray-300">{vehicleInfo.license_plate}</span>}
                        </>
                      ) : receipt.vehicle_id}
                    </div>
                  </div>
                )}

                {receipt.odometer && (
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                      <Info size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                      Odometer
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">{receipt.odometer.toLocaleString()} mi</div>
                  </div>
                )}

                {receipt.price_per_gallon && (
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                      <DollarSign size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                      Price Per Gallon
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">${receipt.price_per_gallon.toFixed(3)}</div>
                  </div>
                )}
              </div>

              {receipt.notes && (
                <div className="mt-3">
                  <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                    <Info size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                    Notes
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-600 p-2 rounded border border-gray-100 dark:border-gray-500">
                    {receipt.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Additional CSS styles */}
      <style jsx>{`
        .tooltip-wrapper {
          position: relative;
        }
        
        .tooltip {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #222;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          z-index: 50;
        }
        
        .tooltip-wrapper:hover .tooltip {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </div>
  );
}