/* eslint-disable @next/next/no-img-element */
// src/components/dashboard/CompleteLoadForm.js
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, AlertCircle, CheckCircle, X, MapPin, Calendar, Clock,
  User, FileText, Upload, Download, Camera, Eye, Trash2, RefreshCw,
  Info, Save, DollarSign, Star, ChevronRight, Building, Truck, Package,
  Users, Loader2, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { getCurrentDateLocal, prepareDateForDB } from "@/lib/utils/dateUtils";
import { recordFactoredEarnings } from "@/lib/services/earningsService";
import { createInvoiceFromLoad } from "@/lib/services/loadInvoiceService";

// Helper to persist form data to localStorage
const saveFormToStorage = (formData, loadId) => {
  if (typeof window !== 'undefined') {
    try {
      const { podFiles, ...serializableData } = formData;

      const serializedData = {
        ...serializableData,
        podFileNames: podFiles ? podFiles.map(file =>
          typeof file === 'string' ? file : file.name
        ) : []
      };

      localStorage.setItem(`load_form_${loadId}`, JSON.stringify(serializedData));
    } catch (err) {
      console.error("Error saving form to storage:", err);
    }
  }
};

// Helper to load form data from localStorage
const loadFormFromStorage = (loadId) => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`load_form_${loadId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error("Error loading form from storage:", err);
      return null;
    }
  }
  return null;
};


// Star Rating Component
const StarRating = ({ rating, setRating, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && setRating(star)}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          className={`${disabled ? 'cursor-default' : 'cursor-pointer'} focus:outline-none p-1`}
          disabled={disabled}
          aria-label={`${star} stars`}
        >
          <Star
            size={24}
            className={`transition-colors duration-150 ${star <= (hoverRating || rating)
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300 dark:text-gray-600'
              }`}
          />
        </button>
      ))}
    </div>
  );
};

// Steps progress bar
const StepsProgress = ({ currentStep, totalSteps = 3 }) => {
  const steps = [
    { 
      number: 1, 
      title: "Delivery Info", 
      subtitle: "When & Who",
      icon: MapPin,
      description: "Enter delivery date, time, and receiver information"
    },
    { 
      number: 2, 
      title: "Proof of Delivery", 
      subtitle: "Upload POD",
      icon: Camera,
      description: "Upload photos or documents confirming delivery"
    },
    { 
      number: 3, 
      title: "Review & Submit", 
      subtitle: "Finalize Load",
      icon: CheckCircle,
      description: "Review charges and complete the load"
    }
  ];

  const currentStepData = steps.find(s => s.number === currentStep);

  return (
    <div className="w-full">
      {/* Compact Progress Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {currentStepData?.title}
          </h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 hidden md:block">
          {currentStepData?.description}
        </p>
      </div>

      {/* Compact Progress Steps */}
      <div className="relative max-w-lg mx-auto">
        {/* Progress Line Background */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-5 left-8 h-0.5 bg-blue-600 transition-all duration-500"
          style={{ 
            width: `calc(${((currentStep - 1) / (totalSteps - 1)) * 100}% - 32px)`,
            maxWidth: 'calc(100% - 64px)'
          }}
        />

        {/* Steps */}
        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex flex-col items-center">
                {/* Step Circle */}
                <div className="relative">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-600'
                      : isCompleted
                        ? 'bg-green-500 dark:bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <Check size={16} className="text-white" />
                    ) : isActive ? (
                      <span className="text-sm font-bold">{step.number}</span>
                    ) : (
                      <span className="text-xs font-medium">{step.number}</span>
                    )}
                  </div>
                  
                  {/* Small pulse effect for active step */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
                  )}
                </div>

                {/* Compact Step Label */}
                <p className={`text-xs font-medium mt-2 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Document Preview Modal
const DocumentPreviewModal = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  const fileUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
  const fileName = typeof file === 'string' ? file.split('/').pop() : file.name;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate max-w-[calc(100%-2rem)]">
            {fileName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
          {file && typeof file !== 'string' && file.type.startsWith('image/') ? (
            <img
              src={fileUrl}
              alt="Document Preview"
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : file && typeof file === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName) ? (
            <img
              src={fileUrl}
              alt="Document Preview"
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <FileText size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-700 dark:text-gray-300 mb-4">Preview not available for this file type</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg inline-flex items-center hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <Download className="mr-2" size={18} />
                Download Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Success modal
const CompletionSuccessModal = ({ isOpen, loadNumber, invoiceGenerated, useFactoring }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-8 text-center shadow-2xl transform transition-all">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Load Completed!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Load #{loadNumber} has been successfully marked as completed.
        </p>
        {useFactoring ? (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
            <p className="text-blue-800 dark:text-blue-300 font-medium">
              The earnings have been recorded for this factored load.
            </p>
          </div>
        ) : invoiceGenerated ? (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
            <p className="text-blue-800 dark:text-blue-300 font-medium">
              An invoice has been generated for this load.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg mb-6">
            <p className="text-yellow-800 dark:text-yellow-300 font-medium">
              Load marked as completed without generating an invoice.
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          You&#39;ll be redirected to the dispatching dashboard in a moment...
        </p>
      </div>
    </div>
  );
};

// Main component
export default function CompleteLoadForm({ loadId, loadDetails: initialLoadDetails = null }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadDetails, setLoadDetails] = useState(initialLoadDetails);
  const [error, setError] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Document preview state
  const [previewFile, setPreviewFile] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

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
    markPaid: false,
    useFactoring: false,
    factoringCompany: ""
  });

  // Form validation
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Load saved form data on initialization
  useEffect(() => {
    if (loadId) {
      const savedForm = loadFormFromStorage(loadId);
      if (savedForm) {
        setFormData(prev => ({
          ...savedForm,
          podFiles: prev.podFiles
        }));
      }
    }
  }, [loadId]);

  // Save form data when it changes
  useEffect(() => {
    if (loadId) {
      saveFormToStorage(formData, loadId);
    }
  }, [formData, loadId]);

  // Load data on mount if not provided
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Check if we already have load details
        if (initialLoadDetails) {
          setLoadDetails(initialLoadDetails);
          setLoading(false);
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);

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
          driverId: data.driver_id || null,
          rate: data.rate || 0,
          distance: data.distance || 0,
          description: data.description || '',
          truckId: data.vehicle_id || data.truck_id || null,
          truckInfo: data.truck_info || ''
        };

        setLoadDetails(formattedLoad);

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
    };

    if (loadId) {
      fetchData();
    }
  }, [loadId, router, initialLoadDetails]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      if (files && files.length > 0) {
        const fileArray = Array.from(files);

        setFormData(prev => ({
          ...prev,
          podFiles: [...prev.podFiles, ...fileArray]
        }));

        e.target.value = "";
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    setTouched(prev => ({ ...prev, [name]: true }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle file preview
  const handleFilePreview = (file) => {
    setPreviewFile(file);
    setPreviewModalOpen(true);
  };

  // Handle factoring toggle
  const handleFactoringToggle = (useFactoring) => {
    if (useFactoring) {
      setFormData(prev => ({
        ...prev,
        useFactoring: true,
        generateInvoice: false,
        markPaid: false
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        useFactoring: false,
        generateInvoice: true
      }));
    }
  };

  // Remove a file from the list
  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      podFiles: prev.podFiles.filter((_, i) => i !== index)
    }));
  };

  // Form validation
  const validateStep = () => {
    const newErrors = {};
    let isValid = true;

    switch (currentStep) {
      case 1:
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
        if (formData.podFiles.length === 0) {
          newErrors.podFiles = "At least one proof of delivery document is required";
          isValid = false;
        }
        break;

      case 3:
        if (formData.additionalCharges > 0 && !formData.additionalChargesDescription.trim()) {
          newErrors.additionalChargesDescription = "Description is required for additional charges";
          isValid = false;
        }

        if (formData.useFactoring && !formData.factoringCompany.trim()) {
          newErrors.factoringCompany = "Factoring company name is required";
          isValid = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Navigate to next step
  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo(0, 0);
    }
  };

  // Navigate to previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setSubmitting(true);
    try {
      let currentUserId = user?.id;

      // If we don't have a user ID, fetch the current user
      if (!currentUserId) {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          throw new Error("Authentication required. Please log in again.");
        }

        // Use the fetched user ID directly
        currentUserId = currentUser.id;

        // Update the state for future renders
        setUser(currentUser);
      }

      // Make sure we have a valid user ID
      if (!currentUserId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const deliveryDateTime = new Date(`${formData.deliveryDate}T${formData.deliveryTime}`);
      const totalRate = loadDetails.rate + parseFloat(formData.additionalCharges || 0);

      // Upload proof of delivery documents
      const podUrls = [];
      for (const file of formData.podFiles) {
        if (typeof file === 'string') {
          podUrls.push({ name: file.split('/').pop(), url: file });
          continue;
        }

        // Use currentUserId instead of user.id
        const fileName = `${currentUserId}/loads/${loadDetails.loadNumber}/pod/${Date.now()}-${file.name}`;

        const { data: fileData, error: fileError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (fileError) throw fileError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        podUrls.push({ name: file.name, url: publicUrl });
      }

      // Prepare load update data
      const loadUpdateData = {
        status: 'Completed',
        completed_at: new Date().toISOString(),
        completed_by: currentUserId,
        delivery_date: formData.deliveryDate, // Use delivery_date instead of actual_delivery_date
        received_by: formData.receivedBy,
        completion_notes: formData.notes,
        pod_documents: podUrls,
        delivery_rating: formData.deliveryRating,
        additional_mileage: parseFloat(formData.additionalMileage || 0),
        additional_charges: parseFloat(formData.additionalCharges || 0),
        additional_charges_description: formData.additionalChargesDescription || '',
        final_rate: totalRate,
        driver: loadDetails.driver,
        driver_id: loadDetails.driverId,
        vehicle_id: loadDetails.truckId,
        truck_info: loadDetails.truckInfo
      };

      // Add factoring information if applicable
      if (formData.useFactoring) {
        loadUpdateData.factored = true;
        loadUpdateData.factoring_company = formData.factoringCompany || null;
        loadUpdateData.factored_at = new Date().toISOString();
        loadUpdateData.factored_amount = totalRate;
      }

      // Update the load in Supabase
      const { data: updatedLoad, error: updateError } = await supabase
        .from('loads')
        .update(loadUpdateData)
        .eq('id', loadId)
        .select();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      // Process factoring or create invoice
      let invoiceCreated = false;

      if (formData.useFactoring) {
        try {
          const loadNum = loadDetails.loadNumber || loadDetails.load_number;
          await recordFactoredEarnings(
            currentUserId,
            loadId,
            totalRate,
            formData.factoringCompany || null,
            loadNum
          );
        } catch (factoringError) {
          // Silently handle - earnings may already exist
        }
      } else if (formData.generateInvoice) {
        // Generate invoice from the completed load
        try {
          const invoice = await createInvoiceFromLoad(currentUserId, loadId, {
            markAsPaid: formData.markPaid,
            dueInDays: 15,
            invoiceDate: formData.deliveryDate || new Date().toISOString().split('T')[0],
            notes: `Invoice for Load #${loadDetails.loadNumber}: ${loadDetails.origin} to ${loadDetails.destination}`
          });

          if (invoice) {
            console.log("Invoice created successfully:", invoice.id, invoice.invoice_number);
            invoiceCreated = true;
          }
        } catch (invoiceError) {
          console.error("Error generating invoice:", invoiceError);
          // Continue with the completion process even if invoice generation fails
          // but notify the user
          setError(`Load completed but invoice generation failed: ${invoiceError.message}`);
        }
      }

      // Clear form data
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`load_form_${loadId}`);
      }

      setSuccessModalOpen(true);

      setTimeout(() => {
        router.push('/dashboard/dispatching');
      }, 2500);
    } catch (err) {
      console.error('Error completing load:', err);
      // Better error handling to show the actual error
      let errorMessage = 'Failed to complete load';
      if (err && err.message) {
        errorMessage = err.message;
      } else if (err && err.error) {
        errorMessage = err.error;
      } else if (err && err.details) {
        errorMessage = err.details;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading load details...</p>
        </div>
      </div>
    );
  }

  if (error || !loadDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl w-full border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
            {!loadDetails ? "Load not found" : error}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            Unable to load the requested data. Please try again or contact support.
          </p>
          <Link
            href="/dashboard/dispatching"
            className="block text-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors w-48 mx-auto"
          >
            <ChevronLeft size={18} className="inline mr-2" />
            Return to Dispatching
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with gradient and info bar */}
      <div className="rounded-2xl overflow-hidden mx-4 mt-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600">
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/dashboard/dispatching"
                  className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} className="text-white" />
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-white">
                    Complete Load #{loadDetails.loadNumber || loadDetails.load_number || 'N/A'}
                  </h1>
                  <p className="text-sm text-blue-100 mt-0.5">
                    Mark this load as delivered and complete
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Load Info Bar */}
        <div className="bg-blue-50 dark:bg-blue-900/30">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <MapPin size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">{loadDetails.origin} → {loadDetails.destination}</span>
                </div>
                <div className="flex items-center">
                  <Building size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">{loadDetails.customer}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign size={16} className="text-green-600 dark:text-green-400 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">${loadDetails.rate?.toLocaleString() || '0'}</span>
                </div>
              </div>
              {loadDetails.driver && (
                <div className="flex items-center">
                  <Users size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">{loadDetails.driver}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

        <div className="max-w-5xl mx-auto px-4 pt-4">
          {/* Steps Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
            <StepsProgress currentStep={currentStep} />
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">

          <div className="p-6">
            {/* Step 1: Delivery Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500 p-6 text-white rounded-xl mx-4 mt-4">
                  <h2 className="text-xl font-semibold mb-2">When was the load delivered?</h2>
                  <p className="text-blue-100">Enter the actual delivery date and time</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar size={16} className="inline mr-1" />
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        id="deliveryDate"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleInputChange}
                        className={`block w-full px-4 py-3 border ${errors.deliveryDate
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                      />
                      {errors.deliveryDate && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          {errors.deliveryDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Clock size={16} className="inline mr-1" />
                        Delivery Time
                      </label>
                      <input
                        type="time"
                        id="deliveryTime"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleInputChange}
                        className={`block w-full px-4 py-3 border ${errors.deliveryTime
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                      />
                      {errors.deliveryTime && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          {errors.deliveryTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User size={16} className="inline mr-1" />
                      Who received the delivery?
                    </label>
                    <input
                      type="text"
                      id="receivedBy"
                      name="receivedBy"
                      value={formData.receivedBy}
                      onChange={handleInputChange}
                      placeholder="Enter receiver's full name"
                      className={`block w-full px-4 py-3 border ${errors.receivedBy
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                    />
                    {errors.receivedBy && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.receivedBy}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Star size={16} className="inline mr-1" />
                        Rate the delivery experience
                      </label>
                      <StarRating
                        rating={formData.deliveryRating}
                        setRating={(rating) => setFormData(prev => ({ ...prev, deliveryRating: rating }))}
                      />
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FileText size={16} className="inline mr-1" />
                        Additional notes (optional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any special circumstances or issues?"
                        className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Documentation */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-purple-400 dark:from-purple-600 dark:to-purple-500 p-6 text-white rounded-xl mx-4 mt-4">
                  <h2 className="text-xl font-semibold mb-2">Upload Proof of Delivery</h2>
                  <p className="text-purple-100">Add photos or documents that confirm the delivery</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <div className="space-y-2 text-center">
                      <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-base">
                        <label
                          htmlFor="podFiles"
                          className="relative cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                        >
                          <span>Click to upload</span>
                          <input
                            id="podFiles"
                            name="podFiles"
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/jpg"
                            className="sr-only"
                            onChange={handleInputChange}
                            ref={fileInputRef}
                          />
                        </label>
                        <p className="text-gray-600 dark:text-gray-400">or drag and drop</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                  {errors.podFiles && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.podFiles}
                    </p>
                  )}

                  {/* Display uploaded files */}
                  {formData.podFiles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
                        Uploaded Documents ({formData.podFiles.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formData.podFiles.map((file, index) => (
                          <div key={index} className="relative group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center">
                                    <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {typeof file === 'string' ? file.split('/').pop() : file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {typeof file !== 'string' ? `${(file.size / 1024).toFixed(1)} KB` : 'Uploaded'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleFilePreview(file)}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                    <div className="flex">
                      <Info size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          <strong>Tip:</strong> Include signed BOL, delivery receipts, or photos of delivered cargo for best documentation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Billing & Completion */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-500 to-green-400 dark:from-green-600 dark:to-green-500 p-6 text-white rounded-xl mx-4 mt-4">
                  <h2 className="text-xl font-semibold mb-2">Final Details & Billing</h2>
                  <p className="text-green-100">Review charges and complete the load</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Additional Charges Section - Compact */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <DollarSign size={14} className="text-blue-500 dark:text-blue-400 mr-1.5" />
                        Additional Charges
                        <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(Optional)</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Additional Mileage */}
                      <div>
                        <label htmlFor="additionalMileage" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Extra Miles
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            id="additionalMileage"
                            name="additionalMileage"
                            value={formData.additionalMileage}
                            onChange={handleInputChange}
                            min="0"
                            placeholder="0"
                            className="block w-full px-3 py-2 pr-14 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">miles</span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Charges */}
                      <div>
                        <label htmlFor="additionalCharges" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Extra Charges
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 dark:text-gray-500 text-sm">$</span>
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
                            className="block w-full pl-7 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">USD</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description field when charges > 0 */}
                    {parseFloat(formData.additionalCharges) > 0 && (
                      <div className="mt-3">
                        <label htmlFor="additionalChargesDescription" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Reason for Additional Charges *
                        </label>
                        <input
                          type="text"
                          id="additionalChargesDescription"
                          name="additionalChargesDescription"
                          value={formData.additionalChargesDescription}
                          onChange={handleInputChange}
                          placeholder="e.g., Detention time, lumper fees, toll charges..."
                          className={`block w-full px-3 py-2 border ${errors.additionalChargesDescription
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                            } rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                        />
                        {errors.additionalChargesDescription && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle size={12} className="mr-1" />
                            {errors.additionalChargesDescription}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Billing Summary Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <DollarSign size={20} className="mr-2 text-gray-600 dark:text-gray-400" />
                      Billing Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Base Rate</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">${loadDetails.rate.toLocaleString()}</span>
                      </div>
                      {parseFloat(formData.additionalCharges) > 0 && (
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600 dark:text-gray-400">Additional Charges</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">+${parseFloat(formData.additionalCharges).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 border-t border-gray-300 dark:border-gray-600">
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Amount</span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${(loadDetails.rate + parseFloat(formData.additionalCharges || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Options */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">How should we handle payment?</h3>

                    <div className="space-y-3">
                      <label className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        !formData.useFactoring ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}>
                        <input
                          type="radio"
                          id="useInvoiceSystem"
                          name="paymentMethod"
                          value="invoiceSystem"
                          checked={!formData.useFactoring}
                          onChange={() => handleFactoringToggle(false)}
                          className="h-4 w-4 text-blue-600 mt-0.5"
                        />
                        <div className="ml-3">
                          <span className="block font-medium text-gray-900 dark:text-gray-100">Generate Invoice</span>
                          <span className="block text-sm text-gray-600 dark:text-gray-400 mt-0.5">Create and track invoice in system</span>
                        </div>
                      </label>

                      <label className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.useFactoring ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}>
                        <input
                          type="radio"
                          id="useFactoring"
                          name="paymentMethod"
                          value="factoring"
                          checked={formData.useFactoring}
                          onChange={() => handleFactoringToggle(true)}
                          className="h-4 w-4 text-blue-600 mt-0.5"
                        />
                        <div className="ml-3">
                          <span className="block font-medium text-gray-900 dark:text-gray-100">Factoring Company</span>
                          <span className="block text-sm text-gray-600 dark:text-gray-400 mt-0.5">Record payment through factoring</span>
                        </div>
                      </label>
                    </div>

                    {!formData.useFactoring && formData.generateInvoice && (
                      <div className="mt-4 ml-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <label className="flex items-center cursor-pointer">
                          <input
                            id="markPaid"
                            name="markPaid"
                            type="checkbox"
                            checked={formData.markPaid}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Paid (COD)</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">For cash on delivery payments</span>
                          </div>
                        </label>
                      </div>
                    )}

                    {formData.useFactoring && (
                      <div className="mt-4 ml-8">
                        <label htmlFor="factoringCompany" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Factoring Company Name
                        </label>
                        <input
                          type="text"
                          id="factoringCompany"
                          name="factoringCompany"
                          value={formData.factoringCompany}
                          onChange={handleInputChange}
                          placeholder="e.g., ABC Factoring Inc."
                          className={`block w-full px-4 py-3 border ${errors.factoringCompany
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
                        />
                        {errors.factoringCompany && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {errors.factoringCompany}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ready to Complete */}
                  <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-6 mt-6">
                    <h3 className="text-base font-medium text-green-900 dark:text-green-300 mb-3 flex items-center">
                      <CheckCircle size={20} className="mr-2 text-green-600 dark:text-green-400" />
                      Ready to Complete
                    </h3>
                    <div className="space-y-2 text-sm text-green-800 dark:text-green-300">
                      <p className="font-medium">This will:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Mark load #{loadDetails.loadNumber} as completed</li>
                        <li>Save all delivery documentation</li>
                        {formData.generateInvoice && !formData.useFactoring && <li>Generate invoice for ${(loadDetails.rate + parseFloat(formData.additionalCharges || 0)).toLocaleString()}</li>}
                        {formData.useFactoring && <li>Record factored earnings</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between rounded-b-lg">
            <button
              type="button"
              onClick={currentStep > 1 ? handlePrevStep : () => router.push('/dashboard/dispatching')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
              disabled={submitting}
            >
              <ChevronLeft size={16} className="mr-2" />
              {currentStep > 1 ? "Previous" : "Cancel"}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center transition-colors"
              >
                Next Step
                <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Completing Load...
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

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        file={previewFile}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />

      {/* Success Modal */}
      <CompletionSuccessModal
        isOpen={successModalOpen}
        loadNumber={loadDetails?.loadNumber}
        invoiceGenerated={!formData.useFactoring && formData.generateInvoice}
        useFactoring={formData.useFactoring}
      />
    </div>
  );
}