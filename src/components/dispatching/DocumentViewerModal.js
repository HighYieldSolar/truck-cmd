// src/components/dispatching/DocumentViewerModal.js
import React, { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, Image as ImageIcon, Download } from 'lucide-react';
import { supabase } from "@/lib/supabaseClient";

// Helper to check if a URL points to an image
const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
};

// Helper to check if a URL points to a PDF
const isPdfUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.pdf$/i.test(url);
};

export default function DocumentViewerModal({ loadId, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loadDetails, setLoadDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch documents for the load when the modal opens
  useEffect(() => {
    async function fetchDocuments() {
      if (!loadId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the load to get pod_documents field
        const { data: loadData, error: loadError } = await supabase
          .from('loads')
          .select('pod_documents, load_number')
          .eq('id', loadId)
          .single();
          
        if (loadError) throw loadError;
        
        // Set documents from the pod_documents field
        setDocuments(loadData?.pod_documents || []);
        setLoadDetails(loadData);
        
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDocuments();
  }, [loadId]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Documents for Load #{loadDetails?.load_number || 'N/A'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
              {error}
            </div>
          ) : documents.length > 0 ? (
            <ul className="space-y-4">
              {documents.map((doc, index) => (
                <li key={index} className="border border-gray-200 rounded-md overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-medium text-gray-700 truncate max-w-xs">
                      {doc.name || `Document ${index + 1}`}
                    </span>
                    <div className="flex space-x-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
                        title="Open in new tab"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <a
                        href={doc.url}
                        download
                        className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {isImageUrl(doc.url) ? (
                      <div className="flex justify-center">
                        <img
                          src={doc.url}
                          alt={doc.name || `Document ${index + 1}`}
                          className="max-h-96 max-w-full object-contain rounded"
                        />
                      </div>
                    ) : isPdfUrl(doc.url) ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded">
                        <FileText size={48} className="text-red-500 mb-4" />
                        <p className="text-gray-600 mb-4">PDF Document</p>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center"
                        >
                          <ExternalLink size={16} className="mr-2" />
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded">
                        <FileText size={48} className="text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-4">Unknown document type</p>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center"
                        >
                          <ExternalLink size={16} className="mr-2" />
                          Open Document
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={48} className="text-gray-300 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h4>
              <p className="text-gray-500 max-w-md">
                There are no proof of delivery documents available for this load.
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}