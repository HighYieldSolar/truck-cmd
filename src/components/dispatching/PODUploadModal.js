// src/components/dispatching/PODUploadModal.js
"use client";

import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from "@/lib/supabaseClient";
import { NotificationService, NOTIFICATION_TYPES, URGENCY_LEVELS } from "@/lib/services/notificationService";

export default function PODUploadModal({ loadId, loadNumber, onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    e.target.value = "";
    setError(null);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Authentication required");

      // Get existing POD documents
      const { data: loadData, error: loadError } = await supabase
        .from('loads')
        .select('pod_documents')
        .eq('id', loadId)
        .single();

      if (loadError) throw loadError;

      const existingDocs = loadData?.pod_documents || [];
      const newDocs = [];

      // Upload each file
      for (const file of files) {
        const fileName = `${user.id}/loads/${loadNumber}/pod/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        newDocs.push({ name: file.name, url: publicUrl });
      }

      // Update the load with new documents
      const { error: updateError } = await supabase
        .from('loads')
        .update({
          pod_documents: [...existingDocs, ...newDocs],
          updated_at: new Date().toISOString()
        })
        .eq('id', loadId);

      if (updateError) throw updateError;

      // Create notification for POD upload
      try {
        // Get load details for notification
        const { data: loadDetails } = await supabase
          .from('loads')
          .select('origin, destination, customer')
          .eq('id', loadId)
          .single();

        await NotificationService.createNotification({
          userId: user.id,
          title: `POD Uploaded - Load ${loadNumber}`,
          message: loadDetails
            ? `Proof of Delivery uploaded for ${loadDetails.customer || 'load'} (${loadDetails.origin} → ${loadDetails.destination}). ${newDocs.length} document(s) added.`
            : `Proof of Delivery uploaded for load ${loadNumber}. ${newDocs.length} document(s) added.`,
          type: NOTIFICATION_TYPES.DELIVERY_UPCOMING, // Using existing type for delivery-related
          entityType: 'load',
          entityId: loadId,
          linkTo: `/dashboard/dispatching`,
          urgency: URGENCY_LEVELS.NORMAL
        });
      } catch (notifError) {
        // Don't fail the main operation if notification fails
      }

      setSuccess(true);
      setFiles([]);

      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Upload Proof of Delivery
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Load #{loadNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Upload Successful!
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Your documents have been uploaded successfully.
              </p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle size={20} className="text-red-500 dark:text-red-400 mr-2" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div
                className="flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-2 text-center">
                  <div className="mx-auto h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Camera className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                      Click to upload
                    </span>
                    <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/jpg,.pdf"
                      className="sr-only"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      disabled={uploading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                    Selected Files ({files.length})
                  </h4>
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText size={18} className="text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          disabled={uploading}
                          className="ml-2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 rounded-b-xl">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Upload Documents
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
