/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw, AlertCircle } from "lucide-react";

export default function ReceiptViewer({ isOpen, onClose, receipt }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState(false);

  if (!isOpen || !receipt) return null;

  const hasReceipt = receipt.receipt_image && receipt.receipt_image.length > 0;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Receipt for {receipt.description}
          </h2>
          <div className="flex space-x-2">
            {hasReceipt && !error && (
              <>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  title="Rotate"
                >
                  <RotateCw size={20} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  title="Download"
                >
                  <Download size={20} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-100">
          {hasReceipt ? (
            error ? (
              <div className="text-center p-8">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="text-gray-700 mb-2">Unable to display receipt image</p>
                <p className="text-sm text-gray-500 mt-1">The receipt image might be unavailable or in an unsupported format.</p>
                <a
                  href={receipt.receipt_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Opening in New Tab
                </a>
              </div>
            ) : (
              <div className="relative max-w-full max-h-full">
                <img
                  src={receipt.receipt_image}
                  alt={`Receipt for ${receipt.description}`}
                  className="max-w-full max-h-[calc(90vh-120px)] object-contain transition-all duration-300"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                  onError={handleImageError}
                />
              </div>
            )
          ) : (
            <div className="text-center p-8">
              <div className="mx-auto mb-4 w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-700 mb-2">No receipt image available</p>
              <p className="text-sm text-gray-500">This expense doesn&#39;t have an attached receipt.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Expense Details</p>
              <p className="text-base font-semibold text-gray-900">{receipt.description}</p>
              <p className="text-sm text-gray-600">{new Date(receipt.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount</p>
              <p className="text-base font-semibold text-gray-900">${parseFloat(receipt.amount).toFixed(2)}</p>
              <p className="text-sm text-gray-600">{receipt.category} - {receipt.payment_method}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}