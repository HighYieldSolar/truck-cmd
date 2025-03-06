"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Truck,
  FileText,
  Wallet,
  Users,
  Package,
  CheckCircle,
  Calculator,
  Fuel,
  Settings,
  LogOut,
  Bell,
  Search,
  Filter,
  Plus,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  AlertCircle,
  Check,
  CheckCircleIcon,
  X,
  Edit,
  Trash2,
  ArrowRight,
  MoreHorizontal,
  RefreshCw,
  Upload,
  Download,
  Map,
  Navigation,
  PhoneCall,
  MessageSquare,
  Info,
  ChevronRight,
  ChevronLeft,
  Package as PackageIcon,
  DollarSign,
  Star,
  Camera,
  FilePlus,
  FileCheck,
  ClipboardCheck,
  ClipboardList,
  FileText as FileTextIcon,
  Save,
  Eye
} from "lucide-react";

// Sidebar Component for consistent navigation
const Sidebar = ({ activePage = "dispatching" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'Fleet', href: '/dashboard/fleet', icon: <Package size={18} /> },
    { name: 'Compliance', href: '/dashboard/compliance', icon: <CheckCircle size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
    { name: 'Fuel Tracker', href: '/dashboard/fuel', icon: <Fuel size={18} /> },
  ];

  return (
    <div className="hidden md:flex w-64 flex-col bg-white shadow-lg">
      <div className="p-4 border-b">
        <Image 
          src="/images/tc-name-tp-bg.png" 
          alt="Truck Command Logo"
          width={150}
          height={50}
          className="h-10"
        />
      </div>
      
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                activePage === item.name.toLowerCase() 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        <div className="pt-4 mt-4 border-t">
          <Link 
            href="/dashboard/settings" 
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <Settings size={18} className="mr-3" />
            <span>Settings</span>
          </Link>
          <button 
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                window.location.href = '/login';
              } catch (error) {
                console.error('Error logging out:', error);
              }
            }} 
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Assigned": "bg-blue-100 text-blue-800",
    "In Transit": "bg-purple-100 text-purple-800",
    "Loading": "bg-indigo-100 text-indigo-800",
    "Unloading": "bg-teal-100 text-teal-800",
    "Delivered": "bg-green-100 text-green-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Completed": "bg-green-100 text-green-800",
    "Delayed": "bg-orange-100 text-orange-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

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

// Main Load Completion Page Component
export default function CompleteLoadPage({ params }) {
  const router = useRouter();
  const loadId = params?.id;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadDetails, setLoadDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  
  // Completion form state
  const [completionData, setCompletionData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: new Date().toTimeString().slice(0, 5),
    receivedBy: "",
    notes: "",
    deliveryRating: 5,
    podFiles: [],
    deliverySignature: null,
    additionalMileage: 0,
    additionalCharges: 0,
    additionalChargesDescription: "",
    generateInvoice: true,
    markPaid: false
  });
  
  // POD file preview states
  const [filePreview, setFilePreview] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState({});
  
  // Step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Fetch load details on component mount
  useEffect(() => {
    async function fetchLoadData() {
      try {
        setLoading(true);
        
        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
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
          setCompletionData(prev => ({
            ...prev,
            deliveryDate: data.delivery_date
          }));
        }
      } catch (error) {
        console.error('Error fetching load details:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLoadData();
  }, [loadId]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      // Handle file uploads
      if (files && files.length > 0) {
        setCompletionData(prev => ({
          ...prev,
          podFiles: [...prev.podFiles, ...Array.from(files)]
        }));
      }
    } else if (type === 'checkbox') {
      // Handle checkboxes
      setCompletionData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Handle regular inputs
      setCompletionData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field if it exists
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle delivery rating change
  const handleRatingChange = (rating) => {
    setCompletionData(prev => ({
      ...prev,
      deliveryRating: rating
    }));
  };
  
  // Handle POD file removal
  const handleRemoveFile = (index) => {
    setCompletionData(prev => ({
      ...prev,
      podFiles: prev.podFiles.filter((_, i) => i !== index)
    }));
  };
  
  // Handle file preview
  const handlePreviewFile = (file) => {
    const fileUrl = URL.createObjectURL(file);
    setFilePreview(fileUrl);
    setPreviewOpen(true);
  };
  
  // Validate the form for the current step
  const validateCurrentStep = () => {
    const errors = {};
    
    switch (currentStep) {
      case 1:
        // Step 1: Delivery Details validation
        if (!completionData.deliveryDate) {
          errors.deliveryDate = "Delivery date is required";
        }
        if (!completionData.deliveryTime) {
          errors.deliveryTime = "Delivery time is required";
        }
        if (!completionData.receivedBy) {
          errors.receivedBy = "Receiver name is required";
        }
        break;
        
      case 2:
        // Step 2: Documentation validation
        // Optionally require at least one POD document
        if (completionData.podFiles.length === 0) {
          errors.podFiles = "At least one proof of delivery document is required";
        }
        break;
        
      case 3:
        // Step 3: Billing validation
        if (completionData.additionalCharges > 0 && !completionData.additionalChargesDescription) {
          errors.additionalChargesDescription = "Description is required for additional charges";
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Submit the completion form
  const handleSubmitCompletion = async () => {
    // Final validation
    if (!validateCurrentStep()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Calculate the final delivery date and time
      const deliveryDateTime = new Date(`${completionData.deliveryDate}T${completionData.deliveryTime}`);
      
      // Calculate any additional charges
      const totalRate = loadDetails.rate + parseFloat(completionData.additionalCharges || 0);
      
      // Upload POD files to storage
      const podUrls = [];
      for (const file of completionData.podFiles) {
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
      
      // Update the load in the database
      const { data: updatedLoad, error: updateError } = await supabase
        .from('loads')
        .update({
          status: "Completed",
          actual_delivery_date: deliveryDateTime.toISOString(),
          received_by: completionData.receivedBy,
          completion_notes: completionData.notes,
          pod_documents: podUrls,
          delivery_rating: completionData.deliveryRating,
          additional_mileage: parseFloat(completionData.additionalMileage || 0),
          additional_charges: parseFloat(completionData.additionalCharges || 0),
          additional_charges_description: completionData.additionalChargesDescription,
          final_rate: totalRate,
          completed_at: new Date().toISOString(),
          completed_by: user.id
        })
        .eq('id', loadId)
        .select();
        
      if (updateError) throw updateError;
      
      // If user chose to generate an invoice
      if (completionData.generateInvoice) {
        // Create an invoice in the database
        const invoiceData = {
          user_id: user.id,
          invoice_number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          customer: loadDetails.customer,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
          status: completionData.markPaid ? "Paid" : "Pending",
          total: totalRate,
          amount_paid: completionData.markPaid ? totalRate : 0,
          load_id: loadId,
          notes: `Invoice for Load #${loadDetails.loadNumber}: ${loadDetails.origin} to ${loadDetails.destination}`,
          created_at: new Date().toISOString()
        };
        
        const { data: invoiceResult, error: invoiceError } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select();
          
        if (invoiceError) {
          console.error("Error creating invoice but load was marked as completed:", invoiceError);
          // We'll continue and just show a warning about invoice creation failure
        }
      }
      
      // Show confirmation and then redirect
      setConfirmationOpen(true);
      setTimeout(() => {
        router.push('/dashboard/dispatching');
      }, 3000);
      
    } catch (error) {
      console.error('Error completing load:', error);
      setError('Failed to complete load. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render error state
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="dispatching" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <div className="flex items-center">
            <Link
              href="/dashboard/dispatching"
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Complete Load #{loadDetails.loadNumber}</h1>
          </div>
          
          <div>
            <StatusBadge status={loadDetails.status} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-4xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
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
                        <Check size={20} />
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
                ))}
              </div>
            </div>
            
            {/* Load Summary Card */}
            <div className="bg-white rounded-lg shadow-sm mb-6 p-4 border-l-4 border-blue-500">
              <div className="flex flex-wrap md:flex-nowrap">
                <div className="mb-4 md:mb-0 md:mr-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Load Information</h2>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Customer:</span> {loadDetails.customer}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Driver:</span> {loadDetails.driver || "Unassigned"}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Rate:</span> ${loadDetails.rate.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Route Details</h2>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Origin:</span> {loadDetails.origin}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Destination:</span> {loadDetails.destination}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Planned Delivery:</span> {loadDetails.deliveryDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step Content */}
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
                          value={completionData.deliveryDate}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 border ${
                            validationErrors.deliveryDate 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-md shadow-sm text-sm`}
                        />
                        {validationErrors.deliveryDate && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.deliveryDate}</p>
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
                          value={completionData.deliveryTime}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 border ${
                            validationErrors.deliveryTime 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-md shadow-sm text-sm`}
                        />
                        {validationErrors.deliveryTime && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.deliveryTime}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-700 mb-1">
                        Received By (Name)*
                      </label>
                      <input
                        type="text"
                        id="receivedBy"
                        name="receivedBy"
                        value={completionData.receivedBy}
                        onChange={handleInputChange}
                        placeholder="Enter receiver's name"
                        className={`block w-full px-3 py-2 border ${
                          validationErrors.receivedBy 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        } rounded-md shadow-sm text-sm`}
                      />
                      {validationErrors.receivedBy && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.receivedBy}</p>
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
                        value={completionData.notes}
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
                          rating={completionData.deliveryRating} 
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
                      validationErrors.podFiles 
                        ? 'border-red-300' 
                        : 'border-gray-300'
                    } border-dashed rounded-md`}>
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
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
                    {validationErrors.podFiles && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.podFiles}</p>
                    )}
                  </div>
                  
                  {/* Display uploaded files */}
                  {completionData.podFiles.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
                      <ul className="border rounded-md divide-y divide-gray-200">
                        {completionData.podFiles.map((file, index) => (
                          <li key={index} className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <FileCheck size={20} className="text-green-500 mr-3" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handlePreviewFile(file)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
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
                  
                  {/* Digital Signature Capture - This would need a canvas drawing component in a real implementation */}
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
                          value={completionData.additionalMileage}
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
                          value={completionData.additionalCharges}
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
                    
                    {parseFloat(completionData.additionalCharges) > 0 && (
                      <div className="md:col-span-2">
                        <label htmlFor="additionalChargesDescription" className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Charges Description*
                        </label>
                        <input
                          type="text"
                          id="additionalChargesDescription"
                          name="additionalChargesDescription"
                          value={completionData.additionalChargesDescription}
                          onChange={handleInputChange}
                          placeholder="Explain additional charges"
                          className={`block w-full px-3 py-2 border ${
                            validationErrors.additionalChargesDescription 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          } rounded-md shadow-sm text-sm`}
                        />
                        {validationErrors.additionalChargesDescription && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.additionalChargesDescription}</p>
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
                        <span className="font-medium">${parseFloat(completionData.additionalCharges || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span>${(loadDetails.rate + parseFloat(completionData.additionalCharges || 0)).toLocaleString()}</span>
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
                          checked={completionData.generateInvoice}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="generateInvoice" className="font-medium text-gray-700">Generate Invoice Automatically</label>
                        <p className="text-gray-500">Create an invoice immediately upon load completion</p>
                      </div>
                    </div>
                    
                    {completionData.generateInvoice && (
                      <div className="ml-7 relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="markPaid"
                            name="markPaid"
                            type="checkbox"
                            checked={completionData.markPaid}
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
                        <CheckCircleIcon size={20} className="text-green-500" />
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
                            {completionData.generateInvoice && <li>Generate an invoice automatically</li>}
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
                    onClick={handleSubmitCompletion}
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
                        <CheckCircleIcon size={16} className="mr-2" />
                        Complete Load
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* File Preview Modal */}
      {previewOpen && filePreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-100">
              <imgage 
                src={filePreview} 
                alt="Document Preview" 
                className="max-h-[70vh] max-w-full object-contain" 
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Confirmation Modal */}
      {confirmationOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Load Successfully Completed!</h3>
            <p className="text-gray-600 mb-6">
              Load #{loadDetails.loadNumber} has been marked as completed.
              {completionData.generateInvoice && " An invoice has been generated."}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dispatching dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}