// src/components/dashboard/CompleteLoadForm.js
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, AlertCircle, CheckCircle, X, MapPin, Calendar, Clock, 
  User, FileText, Upload, Download, Camera, Eye, Trash2, RefreshCw, 
  Info, Save, DollarSign, Star, ChevronRight, Building, Truck, Package, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// Helper to persist form data to localStorage
const saveFormToStorage = (formData, loadId) => {
  if (typeof window !== 'undefined') {
    // Clone the form data without the file objects (which can't be serialized)
    const { podFiles, ...serializableData } = formData;
    
    // Save file metadata if available
    const serializedData = {
      ...serializableData,
      podFileNames: podFiles ? podFiles.map(file => 
        typeof file === 'string' ? file : file.name
      ) : []
    };
    
    localStorage.setItem(`load_form_${loadId}`, JSON.stringify(serializedData));
  }
};

// Helper to load form data from localStorage
const loadFormFromStorage = (loadId) => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`load_form_${loadId}`);
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

// Helper to record factored earnings
const recordFactoredEarnings = async (userId, loadId, amount, options = {}) => {
  try {
    // Format data for the earnings table
    const earningData = {
      user_id: userId,
      load_id: loadId,
      amount: amount,
      source: 'Factoring',
      date: options.date || new Date().toISOString().split('T')[0],
      description: options.description || 'Factored load earnings',
      factoring_company: options.factoringCompany || null,
      created_at: new Date().toISOString()
    };
    
    // Insert into earnings table
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

// Star Rating Component with modern styling
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
            size={28}
            className={`transition-colors duration-150 ${
              star <= (hoverRating || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Steps progress bar with modern design - updated for 2 steps
const StepsProgress = ({ currentStep, totalSteps = 2 }) => {
  return (
    <div className="mb-8 px-4">
      <div className="relative flex items-center justify-between w-full">
        {/* Step connector - we only need one line now */}
        <div className="absolute top-6 left-0 right-0 flex justify-center items-center">
          <div className="h-1 w-1/2" 
            style={{ 
              backgroundColor: currentStep > 1 ? '#10B981' : '#E5E7EB',
            }} 
          />
        </div>
        
        {/* Step circles */}
        {[...Array(totalSteps)].map((_, index) => {
          const step = index + 1;
          const stepComplete = step < currentStep;
          const stepCurrent = step === currentStep;
          
          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-200 ${
                  stepComplete
                    ? "bg-green-500 text-white"
                    : stepCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {stepComplete ? <CheckCircle size={20} /> : step}
              </div>
              
              {/* Step label */}
              <div className="mt-3 text-center w-28">
                <span
                  className={`text-sm font-medium ${
                    stepComplete
                      ? "text-green-700"
                      : stepCurrent
                        ? "text-blue-700"
                        : "text-gray-500"
                  }`}
                >
                  {step === 1 && "Delivery & Documentation"}
                  {step === 2 && "Billing & Completion"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Preview modal for documents
const DocumentPreviewModal = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;
  
  // Create a URL for the file
  const fileUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
  const fileName = typeof file === 'string' ? file.split('/').pop() : file.name;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
              className="max-h-[70vh] max-w-full object-contain rounded-md shadow-lg"
            />
          ) : file && typeof file === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName) ? (
            <img
              src={fileUrl}
              alt="Document Preview"
              className="max-h-[70vh] max-w-full object-contain rounded-md shadow-lg"
            />
          ) : (
            <div className="text-center bg-white p-8 rounded-lg border border-gray-200 shadow-md">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 mb-4">Preview not available for this file type</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md inline-flex items-center hover:bg-blue-700 transition-colors"
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

// Success modal with animation
const CompletionSuccessModal = ({ isOpen, loadNumber, invoiceGenerated, useFactoring }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full p-8 text-center shadow-2xl transform transition-all" style={{ animation: 'scale-in 0.3s ease-out' }}>
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
          You&apos;ll be redirected to the dispatching dashboard in a moment...
        </p>
      </div>
    </div>
  );
};

// Main component
export default function CompleteLoadForm({ loadId }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadDetails, setLoadDetails] = useState(null);
  const [error, setError] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  // Document preview state
  const [previewFile, setPreviewFile] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Keep track of form focus state to prevent losing data on blur
  const [isFilePickerActive, setIsFilePickerActive] = useState(false);
  
  // Form state with validation
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
    useFactoring: false, // Added factoring option
    factoringCompany: "" // Optional factoring company name
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Detect platform
  const [isAndroid, setIsAndroid] = useState(false);
  
  // Detect platform - run this only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if using Android
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsAndroid(/android/.test(userAgent));
      
      console.log("Platform detection:", { isAndroid: /android/.test(userAgent) });
    }
  }, []);
  
  // Load saved form data on initialization and when returning to the app
  useEffect(() => {
    if (loadId) {
      const savedForm = loadFormFromStorage(loadId);
      if (savedForm) {
        console.log("Restored form data from localStorage");
        // Check if we need to convert the podFiles from serialized to File objects
        // since File objects can't be serialized to localStorage
        if (savedForm.podFileNames && savedForm.podFileNames.length > 0) {
          // We can't restore the actual files, but can restore metadata
          // and will display that files were previously selected
          console.log("Restored form had file metadata:", savedForm.podFileNames);
        }
        
        // Keep existing podFiles if any and update other fields
        setFormData(prev => ({
          ...savedForm,
          podFiles: prev.podFiles // Keep the current podFiles array
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
  
  // Handle app focus/visibility changes (for Android platform switching)
  useEffect(() => {
    if (!isAndroid) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("App became visible again, restoring form state if needed");
        
        // Restore form state from localStorage, including podFiles
        const savedForm = loadFormFromStorage(loadId);
        if (savedForm) {
          setFormData(savedForm);
        }
      } else {
        console.log("App visibility changed to hidden, saving current state");
        // Save form data to localStorage
        saveFormToStorage(formData, loadId);
      }

      if (document.visibilityState === 'visible' && isFilePickerActive) {
        console.log("App became visible after file picking, resetting flag");
        
        // Reset file picker active flag
        setIsFilePickerActive(false);
        
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAndroid, loadId, formData]);
  
  // Handle back button on Android
  useEffect(() => {
    if (!isAndroid) return;
    
    const handleBackButton = (e) => {
      // If we're in file picking mode, prevent default behavior and restore focus
      if (isFilePickerActive) {
        console.log("Back button pressed during file picking, handling gracefully");
        e.preventDefault();
        setIsFilePickerActive(false);
        
        // Focus back on main form container
        const container = document.getElementById('form-container');
        if (container) container.focus();
        
        // No need to load from localStorage here as the form state is still in memory
        return;
      }
    };
    
    window.addEventListener('popstate', handleBackButton);
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [isAndroid, isFilePickerActive]);
  
  // Load data on mount
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
        
        // Format the load data
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
        
        // Pre-fill the delivery date with the scheduled date if available
        if (data.delivery_date) {
          setFormData(prev => ({
            ...prev,
            deliveryDate: data.delivery_date
          }));
        }
        
        // Check if we have saved form data for this load
        const savedForm = loadFormFromStorage(loadId);
        if (savedForm) {
          // Restore form state from localStorage
          setFormData(prev => ({
            ...savedForm,
            podFiles: prev.podFiles // Keep any existing files
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
  
  // Specialized file upload handler for Android
  const handleAndroidFileUpload = () => {
    // Set file picker active flag to true before opening the file picker
    setIsFilePickerActive(true);
    
    // Save current form data before navigating
    saveFormToStorage(formData, loadId);
    
    console.log("Android file upload initiated, saving form state");
    
    // After handling file picker focus, trigger the file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      // Set file picker to inactive as we're now handling the files
      setIsFilePickerActive(false);
      
      // Handle file uploads
      if (files && files.length > 0) {
        console.log("Files uploaded:", files);
        
        // Create a copy of the files array since it's readonly
        const fileArray = Array.from(files);
        
        // Update with the new files
        setFormData(prev => ({
          ...prev,
          podFiles: [...prev.podFiles, ...fileArray]
        }));
        
        // Immediately persist form data to localStorage (without files)
        // Saving filenames to help restore state
        const fileNames = fileArray.map(f => f.name);
        console.log(`Added ${fileNames.length} new files:`, fileNames);
        
        // Reset file input
        e.target.value = "";
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
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Clear validation error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle file preview
  const handleFilePreview = (file) => {
    setPreviewFile(file);
    setPreviewModalOpen(true);
  };
  
  // When useFactoring is toggled, update related fields
  const handleFactoringToggle = (useFactoring) => {
    if (useFactoring) {
      // If switching to factoring, disable invoice generation
      setFormData(prev => ({
        ...prev,
        useFactoring: true,
        generateInvoice: false, // Force this to false
        markPaid: false // Force this to false as well
      }));
    } else {
      // If switching away from factoring, re-enable invoice generation by default
      setFormData(prev => ({
        ...prev,
        useFactoring: false,
        generateInvoice: true // Default to generating invoice when not using factoring
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
  
  // Form validation logic for each step
  const validateStep = () => {
    const newErrors = {};
    let isValid = true;
    
    switch (currentStep) {
      case 1: // Delivery Details & Documentation (merged)
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
        
        if (formData.podFiles.length === 0) {
          newErrors.podFiles = "At least one proof of delivery document is required";
          isValid = false;
        }
        break;
        
      case 2: // Billing & Completion
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
      setCurrentStep(prev => Math.min(prev + 1, 2)); // Now just 2 steps
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
      // Format the delivery date and time
      const deliveryDateTime = new Date(`${formData.deliveryDate}T${formData.deliveryTime}`);
      
      // Calculate total rate with additional charges
      const totalRate = loadDetails.rate + parseFloat(formData.additionalCharges || 0);
      
      // Upload proof of delivery documents
      const podUrls = [];
      for (const file of formData.podFiles) {
        // Skip files that are already URLs
        if (typeof file === 'string') {
          podUrls.push({ name: file.split('/').pop(), url: file });
          continue;
        }
        
        const fileName = `${user.id}/loads/${loadDetails.loadNumber}/pod/${Date.now()}-${file.name}`;
        
        const { data: fileData, error: fileError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);
          
        if (fileError) throw fileError;
        
        // Get the public URL for the file
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
          
        podUrls.push({ name: file.name, url: publicUrl });
      }
      
      // Prepare load update data - exactly matching the database schema
      const loadUpdateData = {
        // Status and completion info
        status: 'Completed',
        completed_at: new Date().toISOString(),
        completed_by: user?.id || null, // Use the user's UUID instead of email
        
        // Delivery details
        actual_delivery_date: formData.deliveryDate,
        actual_delivery_time: formData.deliveryTime,
        received_by: formData.receivedBy,
        completion_notes: formData.notes,
        
        // POD and ratings
        pod_documents: podUrls,
        delivery_rating: formData.deliveryRating,
        
        // Additional charges
        additional_mileage: parseFloat(formData.additionalMileage || 0),
        additional_charges: parseFloat(formData.additionalCharges || 0),
        additional_charges_description: formData.additionalChargesDescription || '',
        
        // Rate information
        final_rate: totalRate,
        
        // Preserve driver & truck info
        driver: loadDetails.driver,
        driver_id: loadDetails.driverId,
        vehicle_id: loadDetails.truckId,  // Using vehicle_id per schema
        truck_info: loadDetails.truckInfo  // Not load.truckInfo
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
      
      // Process factoring or create invoice based on user selection
      let invoiceCreated = false;
      
      if (formData.useFactoring) {
        console.log("Processing factored load:", {
          userId: user.id,
          loadId: loadId,
          amount: totalRate
        });
        
        try {
          // Record factored earnings
          const factoringResult = await recordFactoredEarnings(user.id, loadId, totalRate, {
            date: formData.deliveryDate,
            description: `Factored load #${loadDetails.loadNumber}: ${loadDetails.origin} to ${loadDetails.destination}`,
            factoringCompany: formData.factoringCompany || null
          });
          
          console.log("Factoring result:", factoringResult);
          
          if (!factoringResult) {
            console.warn("No factoring result returned, but continuing with completion process");
          }
        } catch (factoringError) {
          console.error("Error recording factored earnings:", factoringError);
          // We'll still continue with the load completion process
        }
      } else if (formData.generateInvoice) {
        // Generate an invoice number
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        
        // Create invoice data
        const invoiceData = {
          user_id: user.id,
          invoice_number: invoiceNumber,
          customer: loadDetails.customer,
          customer_id: loadDetails.customer_id,
          load_id: loadId,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
          status: formData.markPaid ? 'Paid' : 'Pending',
          notes: `Invoice for Load #${loadDetails.loadNumber}: ${loadDetails.origin} to ${loadDetails.destination}`,
          subtotal: totalRate,
          tax_rate: 0,
          tax_amount: 0,
          total: totalRate,
          amount_paid: formData.markPaid ? totalRate : 0,
          payment_date: formData.markPaid ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        };
        
        // Insert the invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select();
          
        if (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
        } else {
          invoiceCreated = true;
          
          // Create invoice item
          if (invoice && invoice.length > 0) {
            const invoiceItem = {
              invoice_id: invoice[0].id,
              description: `Transportation services: ${loadDetails.origin} to ${loadDetails.destination}`,
              quantity: 1,
              unit_price: loadDetails.rate
            };
            
            await supabase.from('invoice_items').insert([invoiceItem]);
            
            // Add additional charges as separate line item if applicable
            if (parseFloat(formData.additionalCharges) > 0) {
              const additionalChargeItem = {
                invoice_id: invoice[0].id,
                description: formData.additionalChargesDescription || 'Additional charges',
                quantity: 1,
                unit_price: parseFloat(formData.additionalCharges)
              };
              
              await supabase.from('invoice_items').insert([additionalChargeItem]);
            }
            
            // Record invoice creation activity
            await supabase.from('invoice_activities').insert([{
              invoice_id: invoice[0].id,
              user_id: user.id,
              user_name: user.email,
              activity_type: 'created',
              description: 'Invoice created automatically upon load completion',
              created_at: new Date().toISOString()
            }]);
          }
        }
      }
      
      // Set flag to refresh dashboard when redirected back
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dashboard-refresh-needed', 'true');
      }
      
      // Clear locally stored form data since we're done
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`load_form_${loadId}`);
      }
      
      // Show success modal
      setSuccessModalOpen(true);
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/dashboard/dispatching');
      }, 2500);
    } catch (err) {
      console.error('Error completing load:', err);
      setError('Failed to complete load: ' + (err.message || 'Unknown error'));
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !loadDetails) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {error || "Load not found"}
        </h1>
        <p className="text-gray-600 mb-6">
          Unable to load the requested data. Please try again or contact support.
        </p>
        <Link
          href="/dashboard/dispatching"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
        >
          <ChevronLeft size={18} className="mr-2" />
          Return to Dispatching
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 pb-12" id="form-container" tabIndex="-1">
      {/* Header with load overview */}
      <div className="bg-white border-b shadow-sm p-4 mb-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <Link
              href="/dashboard/dispatching"
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Truck size={20} className="text-blue-600 mr-2" />
                Complete Load #{loadDetails.loadNumber}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
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
      
      <div className="max-w-5xl mx-auto px-4">
        {/* Error alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Load Information</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <Building size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Customer</p>
                      <p className="text-sm text-gray-700">{loadDetails.customer}</p>
                    </div>
                  </div>
                  <div className="flex">
                    <User size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Driver</p>
                      <p className="text-sm text-gray-700">{loadDetails.driver || "Unassigned"}</p>
                    </div>
                  </div>
                  <div className="flex">
                    <DollarSign size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rate</p>
                      <p className="text-sm text-gray-700">${loadDetails.rate.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {loadDetails.truckInfo && (
                <div className="flex">
                  <Truck size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vehicle</p>
                    <p className="text-sm text-gray-700">{loadDetails.truckInfo}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Route Details</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <MapPin size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Route</p>
                      <p className="text-sm text-gray-700">
                        {loadDetails.origin} → {loadDetails.destination}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <Calendar size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Scheduled Pickup</p>
                      <p className="text-sm text-gray-700">{loadDetails.pickupDate}</p>
                    </div>
                  </div>
                  <div className="flex">
                    <Calendar size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Scheduled Delivery</p>
                      <p className="text-sm text-gray-700">{loadDetails.deliveryDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Steps Indicator */}
        <StepsProgress currentStep={currentStep} />
        
        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">
              {currentStep === 1 && "Delivery & Documentation"}
              {currentStep === 2 && "Billing & Completion"}
            </h2>
          </div>
          
          <div className="p-6">
            {/* Step 1: Delivery Details & Documentation (merged) */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Delivery Details Section */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Delivery Details
                  </h3>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  
                  <div className="mb-6">
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
                        className={`block w-full pl-10 pr-3 py-2 border ${
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
                  
                  <div className="mb-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add any notes about the delivery (optional)"
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
                        setRating={(rating) => setFormData(prev => ({ ...prev, deliveryRating: rating }))}
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      How would you rate the overall delivery experience?
                    </p>
                  </div>
                </div>
                
                {/* Documentation Section */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Proof of Delivery Documentation
                  </h3>
                
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Proof of Delivery Documents*
                    </label>
                    {/* Special handling for Android devices */}
                    {isAndroid ? (
                      <button
                        type="button"
                        onClick={handleAndroidFileUpload}
                        className={`w-full mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                          errors.podFiles 
                            ? 'border-red-300 border-dashed' 
                            : 'border-gray-300 border-dashed'
                        } bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200`}
                      >
                        <div className="space-y-1 text-center">
                          <Upload 
                            className="mx-auto h-12 w-12 text-gray-400"
                            strokeWidth={1}
                          />
                          <div className="flex text-sm text-gray-600">
                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                              Upload files
                            </span>
                            <p className="pl-1">or take a photo</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, PDF, DOC up to 10MB
                          </p>
                          <input
                            ref={fileInputRef}
                            id="podFiles"
                            name="podFiles"
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            className="sr-only"
                            onChange={handleInputChange}
                          />
                        </div>
                      </button>
                    ) : (
                      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                        errors.podFiles 
                          ? 'border-red-300 border-dashed' 
                          : 'border-gray-300 border-dashed'
                      } bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200`}>
                        <div className="space-y-1 text-center">
                          <Upload 
                            className="mx-auto h-12 w-12 text-gray-400"
                            strokeWidth={1}
                          />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="podFiles"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
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
                            PNG, JPG, PDF, DOC up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                    {errors.podFiles && (
                      <p className="mt-1 text-sm text-red-600">{errors.podFiles}</p>
                    )}
                  </div>
                  
                  {/* Display uploaded files */}
                  {formData.podFiles.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents ({formData.podFiles.length})</h3>
                      <ul className="border rounded-md divide-y divide-gray-200">
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
                  
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-6">
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
                </div>
              </div>
            )}
            
            {/* Step 2: Billing & Completion */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <label htmlFor="useInvoiceSystem" className="font-medium text-gray-700">Use Internal Invoice System</label>
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
                            <label htmlFor="generateInvoice" className="font-medium text-gray-700">Generate Invoice Automatically</label>
                            <p className="text-gray-500">Create an invoice immediately upon load completion</p>
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
                              <label htmlFor="markPaid" className="font-medium text-gray-700">Mark Invoice as Paid</label>
                              <p className="text-gray-500">Use this for COD (Cash on Delivery) loads</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {formData.useFactoring && (
                      <div className="ml-7 pl-3 border-l-2 border-gray-100 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-md">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <Info size={18} className="text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-blue-700">
                                When using factoring, the total amount will be recorded as earnings on your dashboard, 
                                but no invoice will be generated in the system.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="factoringCompany" className="block text-sm font-medium text-gray-700 mb-1">
                            Factoring Company*
                          </label>
                          <input
                            type="text"
                            id="factoringCompany"
                            name="factoringCompany"
                            value={formData.factoringCompany}
                            onChange={handleInputChange}
                            placeholder="Enter factoring company name"
                            className={`block w-full px-3 py-2 border ${
                              errors.factoringCompany 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            } rounded-md shadow-sm text-sm`}
                          />
                          {errors.factoringCompany && (
                            <p className="mt-1 text-sm text-red-600">{errors.factoringCompany}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </fieldset>
                </div>
                
                {/* Final Confirmation */}
                <div className="bg-green-50 p-4 rounded-md border border-green-200 mt-6">
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
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <button
              type="button"
              onClick={currentStep > 1 ? handlePrevStep : () => router.push('/dashboard/dispatching')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              disabled={submitting}
            >
              <ChevronLeft size={16} className="mr-1" />
              {currentStep > 1 ? "Previous" : "Cancel"}
            </button>
            
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
              >
                {submitting ? (
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