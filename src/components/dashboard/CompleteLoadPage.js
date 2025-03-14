/* eslint-disable @next/next/no-img-element */
// src/components/dashboard/CompleteLoadPage.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/dispatching/StatusBadge";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  Upload,
  Download,
  Camera,
  Eye,
  Trash2,
  RefreshCw,
  Info,
  Save,
  DollarSign,
  Star,
  ChevronRight,
  Building,
  Truck
} from "lucide-react";

// Star Rating Component
const StarRating = ({ rating, setRating, disabled = false }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && setRating(star)}
          className={`${disabled ? 'cursor-default' : 'cursor-pointer'} focus:outline-none`}
          disabled={disabled}
        >
          <Star
            size={24}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Form step indicator component
const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[...Array(totalSteps)].map((_, index) => {
          const step = index + 1;
          return (
            <div 
              key={step} 
              className={`flex-1 ${step < totalSteps ? 'relative' : ''}`}
            >
              <div 
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                  step < currentStep 
                    ? 'bg-green-500 text-white' 
                    : step === currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? (
                  <CheckCircle size={20} />
                ) : (
                  step
                )}
              </div>
              
              <div className="text-center mt-2">
                <span className={`text-sm font-medium ${
                  step <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step === 1 && "Delivery Details"}
                  {step === 2 && "Documentation"}
                  {step === 3 && "Billing & Completion"}
                </span>
              </div>
              
              {step < totalSteps && (
                <div className="hidden sm:block absolute top-5 w-full">
                  <div className={`h-0.5 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

// File upload preview component
const FilePreview = ({ files, onRemove, onPreview }) => {
  if (files.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
      <ul className="border rounded-md divide-y divide-gray-200">
        {files.map((file, index) => (
          <li key={index} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <FileText size={20} className="text-green-500 mr-3" />
              <span className="text-sm text-gray-700">{file.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onPreview(file)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Eye size={18} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Preview modal component
const PreviewModal = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;
  
  const fileUrl = URL.createObjectURL(file);
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Document Preview: {file.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex justify-center bg-gray-100">
          {file.type.startsWith('image/') ? (
            <img 
              src={fileUrl} 
              alt="Document Preview" 
              className="max-h-[70vh] max-w-full object-contain" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <FileText size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-700">
                Preview not available for {file.type} files
              </p>
              <a 
                href={fileUrl} 
                download={file.name}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Success modal component
const SuccessModal = ({ isOpen, loadNumber, hasInvoice }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Load Successfully Completed!</h3>
        <p className="text-gray-600 mb-6">
          Load #{loadNumber} has been marked as completed.
          {hasInvoice && " An invoice has been generated."}
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to dispatching dashboard...
        </p>
      </div>
    </div>
  );
};

// Main component
export default function CompleteLoadPage({ params }) {
  const router = useRouter();
  const loadId = params?.id;
  
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadDetails, setLoadDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: new Date().toTimeString().slice(0, 5),
    receivedBy: "",
    notes: "",
    deliveryRating: 5,
    podFiles: [],
    additionalMileage: 0,
    additionalCharges: 0,
    additionalChargesDescription: "",
    generateInvoice: true,
    markPaid: false
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Load data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Fetch load details
        if (!loadId) {
          throw new Error("Load ID is required");
        }
        
        const { data, error } = await supabase
          .from('loads')
          .select('*')
          .eq('id', loadId)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          throw new Error("Load not found");
        }
        
        // Map database schema to component-friendly format
        const formattedLoad = {
          id: data.id,
          loadNumber: data.load_number,
          customer: data.customer,
          origin: data.origin || '',
          destination: data.destination || '',
          pickupDate: data.pickup_date,
          deliveryDate: data.delivery_date,
          status: data.status,
          driver: data.driver || '',
          rate: data.rate || 0,
          distance: data.distance || 0,
          description: data.description || ''
        };
        
        setLoadDetails(formattedLoad);
        
        // Pre-fill the delivery date with the scheduled delivery date
        if (data.delivery_date) {
          setFormData(prev => ({
            ...prev,
            deliveryDate: data.delivery_date
          }));
        }
      } catch (err) {
        console.error('Error fetching load details:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [loadId, router]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      // Handle file uploads
      if (files && files.length > 0) {
        setFormData(prev => ({
          ...prev,
          podFiles: [...prev.podFiles, ...Array.from(files)]
        }));
      }
    } else if (type === 'checkbox') {
      // Handle checkboxes
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Handle regular inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  // Handle rating change
  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      deliveryRating: rating
    }));
  };
  
  // Handle file removal
  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      podFiles: prev.podFiles.filter((_, i) => i !== index)
    }));
  };
  
  // Handle file preview
  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };
  
  // Validate the current step
  const validateStep = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    switch (currentStep) {
      case 1:
        // Delivery Details validation
        if (!formData.deliveryDate) {
          newErrors.deliveryDate = "Delivery date is required";
          isValid = false;
        }
        
        if (!formData.deliveryTime) {
          newErrors.deliveryTime = "Delivery time is required";
          isValid = false;
        }
        
        if (!formData.receivedBy.trim()) {
          newErrors.receivedBy = "Receiver name is required";
          isValid = false;
        }
        break;
        
      case 2:
        // Documentation validation
        if (formData.podFiles.length === 0) {
          newErrors.podFiles = "At least one proof of delivery document is required";
          isValid = false;
        }
        break;
        
      case 3:
        // Billing validation
        if (formData.additionalCharges > 0 && !formData.additionalChargesDescription.trim()) {
          newErrors.additionalChargesDescription = "Description is required for additional charges";
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  }, [currentStep, formData]);
  
  // Navigate to next step
  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      // Scroll to top when changing steps
      window.scrollTo(0, 0);
    }
  };
  
  // Navigate to previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    // Scroll to top when changing steps
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Final validation
    if (!validateStep()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Calculate the final delivery date and time
      const deliveryDateTime = new Date(`${formData.deliveryDate}T${formData.deliveryTime}`);
      
      // Calculate any additional charges
      const totalRate = loadDetails.rate + parseFloat(formData.additionalCharges || 0);
      
      // Upload POD files to storage
      const podUrls = [];
      for (const file of formData.podFiles) {
        const fileName = `${user.id}/loads/${loadDetails.loadNumber}/pod/${Date.now()}-${file.name}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);
          
        if (fileError) throw fileError;
        
        // Get public URL for the file
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
          
        podUrls.push({ name: file.name, url: publicUrl });
      }
      
      // Update the load in the database with a minimal set of fields
      // that are most likely to exist in your schema
      const { data: updatedLoad, error: updateError } = await supabase
        .from('loads')
        .update({
          status: "Completed",
          // Store delivery information in the notes field as JSON
          notes: JSON.stringify({
            completionInfo: {
              deliveryDate: formData.deliveryDate,
              deliveryTime: formData.deliveryTime,
              receivedBy: formData.receivedBy,
              notes: formData.notes,
              rating: formData.deliveryRating,
              additionalMileage: parseFloat(formData.additionalMileage || 0),
              additionalCharges: parseFloat(formData.additionalCharges || 0),
              additionalChargesDescription: formData.additionalChargesDescription,
              podUrls: podUrls
            }
          }),
          // Most basic fields that should exist
          completed_at: new Date().toISOString(),
          // Use the rate field that definitely exists
          rate: totalRate
        })
        .eq('id', loadId)
        .select();
        
      if (updateError) throw updateError;
      
      // Create invoice if requested
      let invoiceCreated = false;
      if (formData.generateInvoice) {
        // Create an invoice in the database
        const invoiceData = {
          user_id: user.id,
          invoice_number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          customer: loadDetails.customer,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
          status: formData.markPaid ? "Paid" : "Pending",
          total: totalRate,
          amount_paid: formData.markPaid ? totalRate : 0,
          load_id: loadId,
          notes: `Invoice for Load #${loadDetails.loadNumber}: ${loadDetails.origin} to ${loadDetails.destination}`,
          created_at: new Date().toISOString()
        };
        
        const { data: invoiceResult, error: invoiceError } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select();
          
        if (invoiceError) {
          console.error("Error creating invoice:", invoiceError);
        } else {
          invoiceCreated = true;
        }
      }
      
      // Show success modal
      setSuccessModalOpen(true);
      
      // Redirect after delay
      setTimeout(() => {
        router.push('/dashboard/dispatching');
      }, 2000);
      
    } catch (err) {
      console.error('Error completing load:', err);
      setError('Failed to complete load: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error || !loadDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h1>
        <p className="text-gray-600 mb-4">{error || "Load not found or has been deleted"}</p>
        <Link
          href="/dashboard/dispatching"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Dispatching
        </Link>
      </div>
    );
  }
  
  return (
    <DashboardLayout activePage="dispatching">
      <div className="p-4 bg-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link
                href="/dashboard/dispatching"
                className="mr-4 p-2 rounded-full hover:bg-gray-200"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Complete Load #{loadDetails.loadNumber}</h1>
            </div>
            <StatusBadge status={loadDetails.status} />
          </div>
          
          {/* Load Summary Card */}
          <div className="bg-white rounded-lg shadow-sm mb-6 p-4 border-l-4 border-blue-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Load Information</h2>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Building size={16} className="text-gray-400 mr-2" />
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Customer:</span> {loadDetails.customer}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Truck size={16} className="text-gray-400 mr-2" />
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Driver:</span> {loadDetails.driver || "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <DollarSign size={16} className="text-gray-400 mr-2" />
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Rate:</span> ${loadDetails.rate.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Route Details</h2>
                <div className="space-y-1">
                  <div className="flex items-start">
                    <MapPin size={16} className="text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Origin:</span> {loadDetails.origin}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Destination:</span> {loadDetails.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Planned Delivery:</span> {loadDetails.deliveryDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Steps */}
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
          
          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Step 1: Delivery Details */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-4">Delivery Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Actual Delivery Date*
                      </label>
                      <input
                        type="date"
                        id="deliveryDate"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.deliveryDate 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-md shadow-sm text-sm`}
                      />
                      {errors.deliveryDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.deliveryDate}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Actual Delivery Time*
                      </label>
                      <input
                        type="time"
                        id="deliveryTime"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-2 border ${
                          errors.deliveryTime 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-md shadow-sm text-sm`}
                      />
                      {errors.deliveryTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.deliveryTime}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-700 mb-1">
                      Received By (Name)*
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="receivedBy"
                        name="receivedBy"
                        value={formData.receivedBy}
                        onChange={handleInputChange}
                        placeholder="Enter receiver's name"
                        className={`block w-full pl-10 px-3 py-2 border ${
                          errors.receivedBy 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-md shadow-sm text-sm`}
                      />
                    </div>
                    {errors.receivedBy && (
                      <p className="mt-1 text-sm text-red-600">{errors.receivedBy}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional information about the delivery"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Rating
                    </label>
                    <div className="mt-1">
                      <StarRating 
                        rating={formData.deliveryRating} 
                        setRating={handleRatingChange}
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      How would you rate the overall delivery experience?
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Documentation */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-4">Proof of Delivery Documentation</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Proof of Delivery Documents*
                  </label>
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                    errors.podFiles 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  } border-dashed rounded-md`}>
                    <div className="space-y-1 text-center">
                      <Upload 
                        className="mx-auto h-12 w-12 text-gray-400"
                        strokeWidth={1.5}
                      />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="podFiles"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="podFiles"
                            name="podFiles"
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            className="sr-only"
                            onChange={handleInputChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF up to 10MB
                      </p>
                    </div>
                  </div>
                  {errors.podFiles && (
                    <p className="mt-1 text-sm text-red-600">{errors.podFiles}</p>
                  )}
                </div>
                
                {/* Display uploaded files */}
                <FilePreview 
                  files={formData.podFiles}
                  onRemove={handleRemoveFile}
                  onPreview={handlePreviewFile}
                />
                
                <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info size={20} className="text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Important</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Proof of delivery documents are essential for invoicing and potential dispute resolution. 
                          Recommended documents include:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Signed delivery receipt</li>
                          <li>Bill of lading (BOL)</li>
                          <li>Photos of cargo at delivery</li>
                          <li>Receiver signature capture</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Digital Signature Capture - Feature placeholder */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capture Signature (Optional)
                  </label>
                  <div className="border-2 border-gray-300 border-dashed rounded-md p-4 text-center">
                    <Camera size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Feature coming soon. For now, please upload a photo of the signed delivery receipt.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Billing & Completion */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-4">Billing & Completion</h2>
                
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="additionalMileage" className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Mileage
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="additionalMileage"
                        name="additionalMileage"
                        value={formData.additionalMileage}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                        className="block w-full pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">miles</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter additional miles beyond the planned route
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="additionalCharges" className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Charges
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="additionalCharges"
                        name="additionalCharges"
                        value={formData.additionalCharges}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">USD</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter any additional charges (detention, layover, etc.)
                    </p>
                  </div>
                  
                  {parseFloat(formData.additionalCharges) > 0 && (
                    <div className="md:col-span-2">
                      <label htmlFor="additionalChargesDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Charges Description*
                      </label>
                      <input
                        type="text"
                        id="additionalChargesDescription"
                        name="additionalChargesDescription"
                        value={formData.additionalChargesDescription}
                        onChange={handleInputChange}
                        placeholder="Explain additional charges"
                        className={`block w-full px-3 py-2 border ${
                          errors.additionalChargesDescription 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-md shadow-sm text-sm`}
                      />
                      {errors.additionalChargesDescription && (
                        <p className="mt-1 text-sm text-red-600">{errors.additionalChargesDescription}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Billing Summary */}
                <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Billing Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Rate:</span>
                      <span className="font-medium">${loadDetails.rate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Additional Charges:</span>
                      <span className="font-medium">${parseFloat(formData.additionalCharges || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>${(loadDetails.rate + parseFloat(formData.additionalCharges || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Options */}
                <div className="mb-6">
                  <div className="relative flex items-start mb-4">
                    <div className="flex items-center h-5">
                      <input
                        id="generateInvoice"
                        name="generateInvoice"
                        type="checkbox"
                        checked={formData.generateInvoice}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="generateInvoice" className="font-medium text-gray-700">Generate Invoice Automatically</label>
                      <p className="text-gray-500">Create an invoice immediately upon load completion</p>
                    </div>
                  </div>
                  
                  {formData.generateInvoice && (
                    <div className="ml-7 relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="markPaid"
                          name="markPaid"
                          type="checkbox"
                          checked={formData.markPaid}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="markPaid" className="font-medium text-gray-700">Mark Invoice as Paid</label>
                        <p className="text-gray-500">Use this for COD (Cash on Delivery) loads</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Final Confirmation */}
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle size={20} className="text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Ready to Complete</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          You&apos;re about to mark this load as completed. This action will:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Update the load status to &quot;Completed&quot;</li>
                          <li>Save all delivery documentation</li>
                          {formData.generateInvoice && <li>Generate an invoice automatically</li>}
                          <li>Make this load available for reporting</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={currentStep > 1 ? handlePrevStep : () => router.push('/dashboard/dispatching')}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                disabled={isSubmitting}
              >
                <ChevronLeft size={16} className="mr-1" />
                {currentStep > 1 ? "Back" : "Cancel"}
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Complete Load
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      <PreviewModal 
        file={previewFile} 
        isOpen={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
      />
      
      {/* Success Modal */}
      <SuccessModal 
        isOpen={successModalOpen}
        loadNumber={loadDetails?.loadNumber}
        hasInvoice={formData.generateInvoice}
      />
    </DashboardLayout>
  );
}