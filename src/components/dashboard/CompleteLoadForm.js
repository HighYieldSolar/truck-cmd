"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  FileText, 
  Upload, 
  Camera, 
  Truck, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X
} from "lucide-react";

export default function CompleteLoadForm({ loadId, onComplete, onCancel }) {
  // Form data with default values
  const [formData, setFormData] = useState({
    completionDate: new Date().toISOString().split('T')[0],
    totalMiles: "",
    comments: "",
    invoiceAmount: "",
    factored: false,
    factoringFee: "",
    documents: []
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sections, setSections] = useState({
    details: true,
    documents: true,
    payment: true
  });
  const [uploadProgress, setUploadProgress] = useState({});
  const [debug, setDebug] = useState([]);
  
  // Refs for file inputs - placed OUTSIDE the main form
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const formRef = useRef(null);
  
  // Debug logging - useful for troubleshooting on devices
  const logDebug = (message) => {
    console.log(message);
    setDebug(prev => [
      `${new Date().toTimeString().split(' ')[0]}: ${message}`, 
      ...prev.slice(0, 9)
    ]);
  };
  
  // Load form data from sessionStorage on mount
  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem(`load-form-${loadId}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Create new File objects from the cached data if needed
        if (parsedData.documents) {
          // We can't fully restore File objects, but we can keep the metadata
          parsedData.documents = parsedData.documents.map(doc => ({
            ...doc,
            file: doc.file ? null : null, // Can't restore File objects from storage
          }));
        }
        setFormData(parsedData);
        logDebug("Restored form data from session storage");
      }
    } catch (err) {
      logDebug(`Error loading saved form: ${err.message}`);
    }
  }, [loadId]);
  
  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      // Create a copy we can serialize
      const dataToSave = { ...formData };
      
      // Remove file objects which can't be serialized
      if (dataToSave.documents) {
        dataToSave.documents = dataToSave.documents.map(doc => ({
          ...doc,
          file: doc.file ? null : null, // Can't save File objects
        }));
      }
      
      sessionStorage.setItem(`load-form-${loadId}`, JSON.stringify(dataToSave));
      logDebug("Saved form data to session storage");
    } catch (err) {
      logDebug(`Error saving form: ${err.message}`);
    }
  }, [formData, loadId]);
  
  // Handle input field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Toggle section visibility
  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // ======= FILE HANDLING FOR ANDROID COMPATIBILITY =======
  
  // Use a completely isolated approach for file handling
  const handleFileSelection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    logDebug("File selection started");
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      logDebug("No files selected");
      return;
    }
    
    logDebug(`Selected ${files.length} files`);
    
    // Create safe copies of the files and add to state
    const newDocuments = [...formData.documents];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        
        // Create a preview URL
        let previewUrl = null;
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (err) {
          logDebug(`Failed to create preview URL: ${err.message}`);
        }
        
        newDocuments.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          previewUrl,
          uploading: false,
          uploaded: false
        });
        
        logDebug(`Added file: ${file.name} (${file.type})`);
      } catch (err) {
        logDebug(`Error processing file ${i}: ${err.message}`);
      }
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      documents: newDocuments
    }));
    
    // Reset the input value so the same file can be selected again
    try {
      e.target.value = null;
    } catch (err) {
      logDebug(`Error resetting file input: ${err.message}`);
    }
  };
  
  // Open file dialog safely
  const openFileDialog = (e) => {
    e.preventDefault();
    logDebug("Opening file dialog");
    
    // Save current form state explicitly before opening
    try {
      const dataToSave = { ...formData };
      
      // Remove file objects which can't be serialized
      if (dataToSave.documents) {
        dataToSave.documents = dataToSave.documents.map(doc => ({
          ...doc,
          file: doc.file ? null : null,
        }));
      }
      
      sessionStorage.setItem(`load-form-${loadId}`, JSON.stringify(dataToSave));
    } catch (err) {
      logDebug(`Error saving before file dialog: ${err.message}`);
    }
    
    // Delay slightly to ensure state is saved
    setTimeout(() => {
      if (fileInputRef.current) {
        try {
          fileInputRef.current.click();
        } catch (err) {
          logDebug(`Error opening file dialog: ${err.message}`);
        }
      }
    }, 50);
  };
  
  // Open camera safely
  const openCamera = (e) => {
    e.preventDefault();
    logDebug("Opening camera");
    
    // Save current form state explicitly before opening
    try {
      const dataToSave = { ...formData };
      
      // Remove file objects which can't be serialized
      if (dataToSave.documents) {
        dataToSave.documents = dataToSave.documents.map(doc => ({
          ...doc,
          file: doc.file ? null : null,
        }));
      }
      
      sessionStorage.setItem(`load-form-${loadId}`, JSON.stringify(dataToSave));
    } catch (err) {
      logDebug(`Error saving before camera: ${err.message}`);
    }
    
    // Delay slightly to ensure state is saved
    setTimeout(() => {
      if (cameraInputRef.current) {
        try {
          cameraInputRef.current.click();
        } catch (err) {
          logDebug(`Error opening camera: ${err.message}`);
        }
      }
    }, 50);
  };
  
  // Remove a document from the list
  const removeDocument = (index) => {
    try {
      const newDocuments = [...formData.documents];
      // Revoke the object URL to avoid memory leaks
      if (newDocuments[index].previewUrl) {
        URL.revokeObjectURL(newDocuments[index].previewUrl);
      }
      newDocuments.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        documents: newDocuments
      }));
      logDebug(`Removed document at index ${index}`);
    } catch (err) {
      logDebug(`Error removing document: ${err.message}`);
    }
  };
  
  // Form validation
  const validateForm = () => {
    if (!formData.completionDate) {
      setError("Completion date is required");
      return false;
    }
    
    if (!formData.totalMiles) {
      setError("Total miles is required");
      return false;
    }
    
    if (formData.factored && !formData.factoringFee) {
      setError("Factoring fee is required when load is factored");
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    logDebug("Form submission started");
    
    // Validate form
    if (!validateForm()) {
      logDebug("Form validation failed");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      logDebug("Uploading documents");
      
      // Upload documents first
      const documentUrls = [];
      for (const [index, doc] of formData.documents.entries()) {
        if (doc.file) {
          try {
            // Update progress state
            setUploadProgress(prev => ({
              ...prev,
              [index]: { status: 'uploading', progress: 0 }
            }));
            
            // Create a safe filename
            const fileExt = doc.file.name.split('.').pop();
            const fileName = `${loadId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            
            logDebug(`Uploading document: ${fileName}`);
            
            // Upload file to Supabase Storage
            const { data, error } = await supabase.storage
              .from('receipts')
              .upload(`load-documents/${fileName}`, doc.file);
              
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('receipts')
              .getPublicUrl(`load-documents/${fileName}`);
              
            documentUrls.push({
              url: urlData.publicUrl,
              name: doc.name,
              type: doc.type
            });
            
            // Update progress state
            setUploadProgress(prev => ({
              ...prev,
              [index]: { status: 'completed', progress: 100 }
            }));
            
            logDebug(`Document uploaded successfully: ${fileName}`);
          } catch (err) {
            logDebug(`Error uploading document: ${err.message}`);
            // Update progress state
            setUploadProgress(prev => ({
              ...prev,
              [index]: { status: 'error', error: err.message }
            }));
          }
        }
      }
      
      logDebug("Updating load in database");
      
      // Update load in the database
      const { error: updateError } = await supabase
        .from('loads')
        .update({
          status: 'Completed',
          completion_date: formData.completionDate,
          total_miles: formData.totalMiles,
          comments: formData.comments,
          invoice_amount: formData.invoiceAmount || null,
          factored: formData.factored,
          factoring_fee: formData.factored ? formData.factoringFee : null,
          documents: documentUrls.length > 0 ? documentUrls : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', loadId);
        
      if (updateError) throw updateError;
      
      // Show success message
      setSuccess(true);
      logDebug("Load completed successfully");
      
      // Clear the session storage
      sessionStorage.removeItem(`load-form-${loadId}`);
      
      // Call the onComplete callback
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      logDebug(`Error completing load: ${err.message}`);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      formData.documents.forEach(doc => {
        if (doc.previewUrl) {
          URL.revokeObjectURL(doc.previewUrl);
        }
      });
    };
  }, [formData.documents]);
  
  // Render success view
  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Load Completed Successfully!</h2>
          <p className="text-gray-600 mb-6">The load has been marked as completed and all documents have been saved.</p>
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Loads
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Load</h2>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Hidden file inputs - OUTSIDE the main form */}
      <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelection}
          onClick={(e) => e.stopPropagation()}
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileSelection}
          onClick={(e) => e.stopPropagation()}
          accept="image/*"
          capture="environment"
        />
      </div>
      
      {/* The main form */}
      <form
        ref={formRef}
        id="complete-load-form"
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
      >
        {/* Section 1: Load Details */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('details')}
            className="w-full flex justify-between items-center p-4 bg-gray-50 text-left border-b font-medium"
          >
            <span className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-blue-600" />
              Load Details
            </span>
            <span>{sections.details ? '−' : '+'}</span>
          </button>
          
          {sections.details && (
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700">
                  Completion Date *
                </label>
                <input
                  id="completionDate"
                  name="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={handleChange}
                  className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="totalMiles" className="block text-sm font-medium text-gray-700">
                  Total Miles *
                </label>
                <input
                  id="totalMiles"
                  name="totalMiles"
                  type="number"
                  min="0"
                  value={formData.totalMiles}
                  onChange={handleChange}
                  className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                  Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  rows="3"
                  value={formData.comments}
                  onChange={handleChange}
                  className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Section 2: Upload Documents */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('documents')}
            className="w-full flex justify-between items-center p-4 bg-gray-50 text-left border-b font-medium"
          >
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Documentation
            </span>
            <span>{sections.documents ? '−' : '+'}</span>
          </button>
          
          {sections.documents && (
            <div className="p-4 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-gray-600 mb-4">
                  Upload proof of delivery, receipts, and other documents
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Choose Files
                  </button>
                  
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </button>
                </div>
                
                <p className="text-sm text-gray-500">
                  Supported formats: JPG, PNG, PDF, DOC
                </p>
              </div>
              
              {/* Document previews */}
              {formData.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Selected Documents ({formData.documents.length})
                  </h3>
                  <ul className="space-y-2">
                    {formData.documents.map((doc, index) => (
                      <li key={doc.id || index} className="flex items-center p-3 bg-gray-50 rounded-md">
                        <FileText className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name || `Document ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {doc.file ? `${Math.round(doc.file.size / 1024)} KB` : ''}
                            {uploadProgress[index]?.status === 'uploading' && ' - Uploading...'}
                            {uploadProgress[index]?.status === 'completed' && ' - Uploaded'}
                            {uploadProgress[index]?.status === 'error' && ' - Failed to upload'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          aria-label="Remove"
                        >
                          <X size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Section 3: Payment Information */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('payment')}
            className="w-full flex justify-between items-center p-4 bg-gray-50 text-left border-b font-medium"
          >
            <span className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Payment Information
            </span>
            <span>{sections.payment ? '−' : '+'}</span>
          </button>
          
          {sections.payment && (
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="invoiceAmount" className="block text-sm font-medium text-gray-700">
                  Invoice Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    id="invoiceAmount"
                    name="invoiceAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.invoiceAmount}
                    onChange={handleChange}
                    className="p-2 block w-full pl-7 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="factored"
                  name="factored"
                  type="checkbox"
                  checked={formData.factored}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="factored" className="ml-2 block text-sm text-gray-700">
                  Load was factored
                </label>
              </div>
              
              {formData.factored && (
                <div>
                  <label htmlFor="factoringFee" className="block text-sm font-medium text-gray-700">
                    Factoring Fee
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      id="factoringFee"
                      name="factoringFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.factoringFee}
                      onChange={handleChange}
                      className="p-2 block w-full pl-7 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-700">
                  Completing this load will mark it as finished and generate the appropriate financial records.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Form Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} className="mr-2" />
                Complete Load
              </>
            )}
          </button>
        </div>
        
        {/* Debug Information - remove in production */}
        {debug.length > 0 && (
          <div className="mt-6 p-2 bg-gray-100 rounded text-xs font-mono">
            <details>
              <summary className="cursor-pointer font-bold">Debug Log</summary>
              <div className="mt-2 max-h-40 overflow-y-auto">
                {debug.map((msg, i) => (
                  <div key={i} className="truncate">{msg}</div>
                ))}
              </div>
            </details>
          </div>
        )}
      </form>
    </div>
  );
}