/* eslint-disable @next/next/no-img-element */
"use client";

import { X, Download, Share2, Printer, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useState } from "react";

export default function ReceiptViewerModal({ isOpen, onClose, receipt }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !receipt) return null;
  
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 20, 200));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 20, 60));
  };
  
  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl p-0 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">
            Fuel Receipt - {receipt.location}
          </h2>
          <button 
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="bg-neutral p-2 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleZoomIn}
              className="btn btn-sm btn-circle btn-ghost text-base-content"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button 
              onClick={handleZoomOut}
              className="btn btn-sm btn-circle btn-ghost text-base-content"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <button 
              onClick={handleRotate}
              className="btn btn-sm btn-circle btn-ghost text-base-content"
              title="Rotate"
            >
              <RotateCw size={18} />
            </button>
            <div className="text-base-content text-sm">{zoom}%</div>
            <div className="divider divider-horizontal"></div>
            <button 
              className="btn btn-sm btn-circle btn-ghost text-base-content"
              title="Download"
            >
              <Download size={18} />
            </button>
            <button 
              className="btn btn-sm btn-circle btn-ghost text-base-content"
              title="Print"
            >
              <Printer size={18} />
            </button>
            <button 
              className="btn btn-sm btn-circle btn-ghost text-base-content"
              title="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-base-200">
          <div 
            className="relative"
            style={{
              width: `${zoom}%`,
              maxWidth: '100%',
              transition: 'transform 0.3s ease'
            }}
          >
            <img
              src={receipt.receipt_image} 
              alt="Fuel receipt" 
              className="w-full object-contain"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            />
          </div>
        </div>
        
        <div className="border-t p-4 bg-base-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Date:</p>
              <p>{new Date(receipt.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium">State:</p>
              <p>{receipt.state_name} ({receipt.state})</p>
            </div>
            <div>
              <p className="font-medium">Gallons:</p>
              <p>{receipt.gallons.toFixed(3)}</p>
            </div>
            <div>
              <p className="font-medium">Total:</p>
              <p>${receipt.total_amount.toFixed(2)}</p>
            </div>
          </div>
          <div className="modal-action">
            <button 
              onClick={onClose}
              className="btn"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}