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
  ArrowLeft,
  AlertCircle 
} from "lucide-react";

export default function CompleteLoadForm({ loadId, onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    completionDate: new Date().toISOString().split('T')[0],
    totalMiles: "",
    comments: "",
    invoiceAmount: "",
    factored: false,
    factoringFee: "",
    documents: []
  });
  
  // Refs for file inputs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event bubbling
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Create preview URLs and add files to state
    const newDocuments = [...formData.documents];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newDocuments.push({
        file,
        name: file.name,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
        uploading: false,
        uploaded: false
      });
    }
    
    setFormData(prev => ({
      ...prev,
      documents: newDocuments
    }));
    
    // Reset the input value so the same file can be selected again
    e.target.value = null;
  };
  
  // Trigger file input click
  const openFileDialog = (e) => {
    e.preventDefault(); // Prevent form submission
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Trigger camera input click
  const openCamera = (e) => {
    e.preventDefault(); // Prevent form submission
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };
  
  // Remove a document from the list
  const removeDocument = (index) => {
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
  };
  
  // Go to next step
  const goToNextStep = (e) => {
    e.preventDefault(); // Prevent form submission
    // Validation for step 1
    if (currentStep === 1) {
      if (!formData.completionDate || !formData.totalMiles) {
        setError("Please fill in all required fields");
        return;
      }
    }
    
    setError(null);
    setCurrentStep(prev => prev + 1);
  };
  
  // Go to previous step
  const goToPreviousStep = (e) => {
    e.preventDefault(); // Prevent form submission
    setCurrentStep(prev => prev - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    try {
      setLoading(true);
      setError(null);
      
      // Upload documents first
      const documentUrls = [];
      for (const doc of formData.documents) {
        if (doc.file) {
          // Create a safe filename
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${loadId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
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
        }
      }
      
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
      
      // Call the onComplete callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing load:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Add event listener to prevent form submission on mobile
  useEffect(() => {
    const handleFormSubmit = (e) => {
      e.preventDefault();
      return false;
    };
    
    const formElement = document.getElementById('complete-load-form');
    if (formElement) {
      formElement.addEventListener('submit', handleFormSubmit);
    }
    
    return () => {
      if (formElement) {
        formElement.removeEventListener('submit', handleFormSubmit);
      }
      
      // Clean up object URLs on unmount
      formData.documents.forEach(doc => {
        if (doc.previewUrl) {
          URL.revokeObjectURL(doc.previewUrl);
        }
      });
    };
  }, [formData.documents]);
  
  // Success view
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Load</h2>
      
      {/* Progress Steps */}
      <div className="flex mb-8">
        <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Truck className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm">Load Details</p>
        </div>
        <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm">Documentation</p>
        </div>
        <div className={`flex-1 text-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm">Payment</p>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Form */}
      <form 
        id="complete-load-form"
        onSubmit={(e) => e.preventDefault()}
        encType="multipart/form-data"
      >
        {/* Step 1: Load Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
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
                onClick={goToNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Upload Documents */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">
                Upload proof of delivery, receipts, and other documents
              </p>
              
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose Files
                </button>
                
                <button
                  type="button"
                  onClick={openCamera}
                  className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </button>
              </div>
              
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                onClick={(e) => e.stopPropagation()}
                className="hidden"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                onClick={(e) => e.stopPropagation()}
                className="hidden"
                accept="image/*"
                capture="environment"
              />
              
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
                    <li key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                      <FileText className="h-5 w-5 text-gray-500 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {doc.file ? `${Math.round(doc.file.size / 1024)} KB` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Payment Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
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
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Load
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}