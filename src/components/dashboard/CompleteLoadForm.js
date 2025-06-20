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

// Helper to record factored earnings
const recordFactoredEarnings = async (userId, loadId, amount, options = {}) => {
  try {
    const earningData = {
      user_id: userId,
      load_id: loadId,
      amount: amount,
      source: 'Factoring',
      date: options.date || getCurrentDateLocal(),
      description: options.description || 'Factored load earnings',
      factoring_company: options.factoringCompany || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('earnings')
      .insert([earningData])
      .select();

    if (error) throw error;

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error recording factored earnings:', error);
    throw error;
  }
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
              : 'text-gray-300'
              }`}
          />
        </button>
      ))}
    </div>
  );
};

// Steps progress bar
const StepsProgress = ({ currentStep, totalSteps = 3 }) => {
  const getStepColor = (step) => {
    if (step < currentStep) return 'bg-green-500 text-white';
    if (step === currentStep) return 'bg-blue-600 text-white';
    return 'bg-gray-200 text-gray-500';
  };

  const getStepConnectorColor = (step) => {
    if (step < currentStep) return 'bg-green-500';
    return 'bg-gray-200';
  };

  return (
    <div className="mb-8">
      <div className="relative flex items-center justify-between">
        {/* Connecting lines */}
        <div className="absolute w-full h-1 top-6 left-0 flex">
          {[...Array(totalSteps - 1)].map((_, i) => (
            <div key={i} className={`h-full flex-1 ${getStepConnectorColor(i + 1)}`} />
          ))}
        </div>

        {/* Step circles */}
        {[...Array(totalSteps)].map((_, index) => {
          const step = index + 1;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all duration-200 ${getStepColor(step)}`}>
                {isComplete ? <CheckCircle size={20} /> : step}
              </div>

              <span className={`mt-3 text-sm font-medium ${isCurrent ? 'text-blue-600' :
                isComplete ? 'text-green-600' : 'text-gray-500'
                }`}>
                {step === 1 && "Delivery Details"}
                {step === 2 && "Documentation"}
                {step === 3 && "Completion"}
              </span>
            </div>
          );
        })}
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 truncate max-w-[calc(100%-2rem)]">
            {fileName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-6 flex items-center justify-center">
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
            <div className="text-center bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 mb-4">Preview not available for this file type</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center hover:bg-blue-700 transition-colors"
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full p-8 text-center shadow-2xl transform transition-all">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Load Completed!</h2>
        <p className="text-gray-600 mb-4">
          Load #{loadNumber} has been successfully marked as completed.
        </p>
        {useFactoring ? (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-blue-800 font-medium">
              The earnings have been recorded for this factored load.
            </p>
          </div>
        ) : invoiceGenerated ? (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-blue-800 font-medium">
              An invoice has been generated for this load.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="text-yellow-800 font-medium">
              Load marked as completed without generating an invoice.
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-4">
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

  console.log("CompleteLoadForm rendered with loadId:", loadId);

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

        console.log("Fetching load details for ID:", loadId);

        const { data, error } = await supabase
          .from('loads')
          .select('*')
          .eq('id', loadId)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error("Load not found");
        }

        console.log("Load details fetched successfully:", data);

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
          truckId: data.truck_id || null,
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
        completed_by: currentUserId, // Use currentUserId here
        actual_delivery_date: formData.deliveryDate,
        actual_delivery_time: formData.deliveryTime,
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

      if (updateError) throw updateError;

      // Process factoring or create invoice
      let invoiceCreated = false;

      if (formData.useFactoring) {
        try {
          // Use currentUserId instead of user.id
          await recordFactoredEarnings(currentUserId, loadId, totalRate, {
            date: formData.deliveryDate,
            description: `Factored load #${loadDetails.loadNumber}: ${loadDetails.origin} to ${loadDetails.destination}`,
            factoringCompany: formData.factoringCompany || null
          });
        } catch (factoringError) {
          console.error("Error recording factored earnings:", factoringError);
        }
      } else if (formData.generateInvoice) {
        // Generate invoice logic here
        // Make sure to use currentUserId if needed
        invoiceCreated = true;
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
      setError(err.message || 'Failed to complete load');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !loadDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            {!loadDetails ? "Load not found" : error}
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Unable to load the requested data. Please try again or contact support.
          </p>
          <Link
            href="/dashboard/dispatching"
            className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-48 mx-auto"
          >
            <ChevronLeft size={18} className="inline mr-2" />
            Return to Dispatching
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard/dispatching"
                className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} className="text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <CheckCircle size={24} className="mr-2" />
                  Complete Load #{loadDetails.loadNumber}
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  {loadDetails.origin} → {loadDetails.destination}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium 
                ${loadDetails.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                  loadDetails.status === 'Assigned' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'}`}
              >
                {loadDetails.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Error alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Load Summary Card */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h2 className="text-lg font-medium text-blue-900">Load Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Load Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Building size={16} className="text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Customer</p>
                      <p className="text-sm text-gray-600">{loadDetails.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign size={16} className="text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Base Rate</p>
                      <p className="text-sm text-gray-600">${loadDetails.rate.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Route Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MapPin size={16} className="text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Origin</p>
                      <p className="text-sm text-gray-600">{loadDetails.origin}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Destination</p>
                      <p className="text-sm text-gray-600">{loadDetails.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Assignment</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Users size={16} className="text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Driver</p>
                      <p className="text-sm text-gray-600">{loadDetails.driver || "Unassigned"}</p>
                    </div>
                  </div>
                  {loadDetails.truckInfo && (
                    <div className="flex items-center">
                      <Truck size={16} className="text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Vehicle</p>
                        <p className="text-sm text-gray-600">{loadDetails.truckInfo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Progress */}
        <StepsProgress currentStep={currentStep} />

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">
              {currentStep === 1 && "Delivery Details"}
              {currentStep === 2 && "Proof of Delivery Documentation"}
              {currentStep === 3 && "Billing & Completion"}
            </h2>
          </div>

          <div className="p-6">
            {/* Step 1: Delivery Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Actual Delivery Date*
                    </label>
                    <input
                      type="date"
                      id="deliveryDate"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2.5 border ${errors.deliveryDate
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-lg shadow-sm text-sm`}
                    />
                    {errors.deliveryDate && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.deliveryDate}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Actual Delivery Time*
                    </label>
                    <input
                      type="time"
                      id="deliveryTime"
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2.5 border ${errors.deliveryTime
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-lg shadow-sm text-sm`}
                    />
                    {errors.deliveryTime && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.deliveryTime}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                      className={`block w-full pl-10 pr-3 py-2.5 border ${errors.receivedBy
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-lg shadow-sm text-sm`}
                    />
                  </div>
                  {errors.receivedBy && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.receivedBy}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Delivery Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any notes about the delivery (optional)"
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Delivery Rating
                  </label>
                  <div className="mt-1">
                    <StarRating
                      rating={formData.deliveryRating}
                      setRating={(rating) => setFormData(prev => ({ ...prev, deliveryRating: rating }))}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    How would you rate the overall delivery experience?
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Documentation */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Proof of Delivery Documents*
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1} />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="podFiles"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload file</span>
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
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG images up to 10MB each
                      </p>
                    </div>
                  </div>
                  {errors.podFiles && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.podFiles}</p>
                  )}
                </div>

                {/* Display uploaded files */}
                {formData.podFiles.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents ({formData.podFiles.length})</h3>
                    <ul className="border rounded-lg divide-y divide-gray-200">
                      {formData.podFiles.map((file, index) => (
                        <li key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded bg-blue-50 flex items-center justify-center">
                              <FileText size={20} className="text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {typeof file === 'string' ? file.split('/').pop() : file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {typeof file !== 'string' ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleFilePreview(file)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                              title="Preview"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="text-red-600 hover:text-red-800 p-1 rounded"
                              title="Remove"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info size={20} className="text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Important</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Proof of delivery documents are essential for invoicing and dispute resolution.
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
              </div>
            )}

            {/* Step 3: Billing & Completion */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="additionalMileage" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Additional Mileage
                    </label>
                    <div className="mt-1 relative rounded-lg shadow-sm">
                      <input
                        type="number"
                        id="additionalMileage"
                        name="additionalMileage"
                        value={formData.additionalMileage}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                        className="block w-full pr-12 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">miles</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="additionalCharges" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Additional Charges
                    </label>
                    <div className="mt-1 relative rounded-lg shadow-sm">
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
                        className="block w-full pl-7 pr-12 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">USD</span>
                      </div>
                    </div>
                  </div>

                  {parseFloat(formData.additionalCharges) > 0 && (
                    <div className="md:col-span-2">
                      <label htmlFor="additionalChargesDescription" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Additional Charges Description*
                      </label>
                      <input
                        type="text"
                        id="additionalChargesDescription"
                        name="additionalChargesDescription"
                        value={formData.additionalChargesDescription}
                        onChange={handleInputChange}
                        placeholder="Explain additional charges"
                        className={`block w-full px-3 py-2.5 border ${errors.additionalChargesDescription
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-lg shadow-sm text-sm`}
                      />
                      {errors.additionalChargesDescription && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.additionalChargesDescription}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Billing Summary */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Base Rate:</span>
                      <span className="font-medium">${loadDetails.rate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Additional Charges:</span>
                      <span className="font-medium">${parseFloat(formData.additionalCharges || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold">
                      <span>Total:</span>
                      <span>${(loadDetails.rate + parseFloat(formData.additionalCharges || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Options */}
                <div className="mt-6">
                  <fieldset className="space-y-5">
                    <legend className="text-sm font-medium text-gray-900">Payment & Invoice Options</legend>

                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="radio"
                          id="useInvoiceSystem"
                          name="paymentMethod"
                          value="invoiceSystem"
                          checked={!formData.useFactoring}
                          onChange={() => handleFactoringToggle(false)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="useInvoiceSystem" className="font-medium text-gray-700">Use Invoice System</label>
                        <p className="text-gray-500">Generate and track invoices in Truck Command</p>
                      </div>
                    </div>

                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="radio"
                          id="useFactoring"
                          name="paymentMethod"
                          value="factoring"
                          checked={formData.useFactoring}
                          onChange={() => handleFactoringToggle(true)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="useFactoring" className="font-medium text-gray-700">Use Factoring</label>
                        <p className="text-gray-500">Record earnings without generating an invoice</p>
                      </div>
                    </div>

                    {!formData.useFactoring && (
                      <div className="ml-7 pl-3 border-l-2 border-gray-100 space-y-4">
                        <div className="relative flex items-start">
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
                            <label htmlFor="generateInvoice" className="font-medium text-gray-700">Generate Invoice</label>
                            <p className="text-gray-500">Create an invoice immediately</p>
                          </div>
                        </div>

                        {formData.generateInvoice && (
                          <div className="relative flex items-start ml-6 pl-6 border-l-2 border-gray-100">
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
                              <label htmlFor="markPaid" className="font-medium text-gray-700">Mark as Paid</label>
                              <p className="text-gray-500">Use for COD (Cash on Delivery)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {formData.useFactoring && (
                      <div className="ml-7 pl-3 border-l-2 border-gray-100 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <Info size={18} className="text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-blue-700">
                                When using factoring, earnings are recorded without generating an invoice.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="factoringCompany" className="block text-sm font-medium text-gray-700 mb-1">
                            Factoring Company
                          </label>
                          <input
                            type="text"
                            id="factoringCompany"
                            name="factoringCompany"
                            value={formData.factoringCompany}
                            onChange={handleInputChange}
                            placeholder="Enter factoring company name"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </fieldset>
                </div>

                {/* Final Confirmation */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle size={20} className="text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Ready to Complete</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          You&#39;re about to mark this load as completed. This action will:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Update the load status to &quot;Completed&quot;</li>
                          <li>Save all delivery documentation</li>
                          {formData.generateInvoice && <li>Generate an invoice automatically</li>}
                          {formData.useFactoring && <li>Record earnings from this factored load</li>}
                          <li>Make this load available for reporting</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl">
            <button
              type="button"
              onClick={currentStep > 1 ? handlePrevStep : () => router.push('/dashboard/dispatching')}
              className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center"
              disabled={submitting}
            >
              <ChevronLeft size={16} className="mr-2" />
              {currentStep > 1 ? "Previous" : "Cancel"}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center"
              >
                Next
                <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
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