// src/components/dispatching/NewLoadModal.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/context/LanguageContext";
import {
  X,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Truck,
  Route,
  Clock,
  Package,
  Users,
  ChevronRight,
  ChevronLeft,
  Check
} from "lucide-react";

// Helper function to get form data from local storage
const getFormDataFromLocalStorage = (formKey) => {
  try {
    if (typeof window === 'undefined') return null;

    const formDataString = localStorage.getItem(formKey);
    return formDataString ? JSON.parse(formDataString) : null;
  } catch (error) {
    // Silently fail for localStorage errors
    return null;
  }
};

// Helper function to set form data to local storage
const setFormDataToLocalStorage = (formKey, data) => {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(formKey, JSON.stringify(data));
  } catch (error) {
    // Silently fail for localStorage errors
  }
};

// Helper function to clear form data from local storage
const clearFormDataFromLocalStorage = (formKey) => {
  try {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(formKey);
  } catch (error) {
    // Silently fail for localStorage errors
  }
};

// Helper function to generate a load number
const generateLoadNumber = () => {
  // Generate format: LC-YYYYMMDD-XXXX (where XXXX is random)
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number

  return `LC-${year}${month}${day}-${random}`;
};

export default function NewLoadForm({
  onClose,
  onSubmit = () => { }
}) {
  const { t } = useTranslation('dispatching');

  // Form key for localStorage
  const formKey = 'loadForm-new';

  // Initial form data
  const initialFormData = {
    load_number: "",
    customer: "",
    origin: "",
    destination: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
    description: "",
    driver_id: "",
    vehicle_id: ""
  };

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [trucks, setTrucks] = useState([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [autoGenerateNumber, setAutoGenerateNumber] = useState(true);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Step configuration
  const steps = [
    { number: 1, title: t('wizard.steps.basicInfo'), icon: Building },
    { number: 2, title: t('wizard.steps.routeDetails'), icon: Route },
    { number: 3, title: t('wizard.steps.pricingReview'), icon: DollarSign }
  ];

  // Load initial data from localStorage
  useEffect(() => {
    const storedData = getFormDataFromLocalStorage(formKey);

    if (storedData && Object.values(storedData).some(value => value !== "" && value !== null)) {
      setFormData(storedData);
      setHasRestoredData(true);
      // If a load number was stored, disable auto-generation
      if (storedData.load_number && storedData.load_number.trim() !== "") {
        setAutoGenerateNumber(false);
      }
    }

    setInitialDataLoaded(true);
  }, []);

  // Save form data to localStorage when form data changes
  useEffect(() => {
    if (initialDataLoaded) {
      setFormDataToLocalStorage(formKey, formData);
    }
  }, [formData, initialDataLoaded]);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("customers")
          .select("id, company_name")
          .eq("user_id", user.id)
          .order("company_name");

        if (error) throw error;

        setCustomers(data || []);
      } catch (err) {
        setError(t('newLoadModal.failedLoadCustomers'));
      } finally {
        setCustomersLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Load drivers
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        setDriversLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("drivers")
          .select("id, name, status")
          .eq("user_id", user.id)
          .eq("status", "Active")
          .order("name");

        if (error) throw error;

        setDrivers(data || []);
      } catch (err) {
        // Silent fail - drivers dropdown will be empty
      } finally {
        setDriversLoading(false);
      }
    };

    loadDrivers();
  }, []);

  // Load trucks
  useEffect(() => {
    const loadTrucks = async () => {
      try {
        setTrucksLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("vehicles")
          .select("id, name, license_plate, status")
          .eq("user_id", user.id)
          .eq("status", "Active")
          .order("name");

        if (error) {
          throw error;
        }

        setTrucks(data || []);
      } catch (err) {
        // Silent fail - trucks dropdown will be empty
      } finally {
        setTrucksLoading(false);
      }
    };

    loadTrucks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If changing the load number, update auto-generate flag
    if (name === "load_number") {
      setAutoGenerateNumber(value.trim() === "");
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step) => {
    setError("");

    switch (step) {
      case 1:
        if (!formData.customer.trim()) {
          setError(t('newLoadModal.validation.customerRequired'));
          return false;
        }
        return true;

      case 2:
        if (!formData.origin.trim()) {
          setError(t('newLoadModal.validation.pickupLocationRequired'));
          return false;
        }
        if (!formData.destination.trim()) {
          setError(t('newLoadModal.validation.deliveryLocationRequired'));
          return false;
        }
        if (!formData.pickupDate) {
          setError(t('newLoadModal.validation.pickupDateRequired'));
          return false;
        }
        if (!formData.deliveryDate) {
          setError(t('newLoadModal.validation.deliveryDateRequired'));
          return false;
        }

        const pickupDateTime = new Date(formData.pickupDate);
        const deliveryDateTime = new Date(formData.deliveryDate);

        if (deliveryDateTime < pickupDateTime) {
          setError(t('newLoadModal.validation.deliveryBeforePickup'));
          return false;
        }
        return true;

      case 3:
        if (!formData.rate || isNaN(parseFloat(formData.rate)) || parseFloat(formData.rate) <= 0) {
          setError(t('newLoadModal.validation.validRateRequired'));
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateStep(currentStep)) {
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use provided load number or generate one
      const loadNumber = formData.load_number.trim() ? formData.load_number.trim() : generateLoadNumber();

      // Get driver and truck info for display
      let driverName = null;
      let truckInfo = null;

      if (formData.driver_id) {
        const driver = drivers.find(d => d.id === formData.driver_id);
        driverName = driver ? driver.name : null;
      }

      if (formData.vehicle_id) {
        const truck = trucks.find(t => t.id === formData.vehicle_id);
        if (truck) {
          truckInfo = `${truck.name} (${truck.license_plate})`;
        }
      }

      const loadData = {
        user_id: user.id,
        customer: formData.customer,
        origin: formData.origin,
        destination: formData.destination,
        pickup_date: formData.pickupDate,
        delivery_date: formData.deliveryDate,
        rate: parseFloat(formData.rate),
        description: formData.description || "",
        load_number: loadNumber,
        driver_id: formData.driver_id || null,
        driver: driverName,
        vehicle_id: formData.vehicle_id || null,
        truck_info: truckInfo,
        status: formData.driver_id ? "Assigned" : "Pending",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("loads")
        .insert([loadData])
        .select()
        .single();

      if (error) throw error;

      // Clear form data from localStorage on successful submission
      clearFormDataFromLocalStorage(formKey);

      // Call onSubmit if it's a function
      if (typeof onSubmit === 'function') {
        try {
          onSubmit(data);
        } catch (submitError) {
          // Callback error - non-critical
        }
      }

      // Close the modal
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to create load");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Keep data in localStorage when closing
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleClearForm = () => {
    clearFormDataFromLocalStorage(formKey);
    setFormData(initialFormData);
    setHasRestoredData(false);
    setAutoGenerateNumber(true);
    setCurrentStep(1);
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('newLoadModal.basicInfo.title')}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">{t('newLoadModal.basicInfo.description')}</p>
            </div>

            {/* Customer section */}
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('newLoadModal.labels.customerName')} <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                {customersLoading ? (
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('newLoadModal.placeholders.loadingCustomers')}
                      disabled
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <RefreshCw size={18} className="animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                ) : customers.length > 0 ? (
                  <select
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    autoFocus
                  >
                    <option value="">{t('newLoadModal.placeholders.selectCustomer')}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.company_name}>
                        {customer.company_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('newLoadModal.placeholders.enterCustomerName')}
                    required
                    autoFocus
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('newLoadModal.hints.selectOrType')}</p>
            </div>

            {/* Load Number section - now optional */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="load_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('newLoadModal.labels.loadNumberOptional')}
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoGenerate"
                    checked={autoGenerateNumber}
                    onChange={() => {
                      setAutoGenerateNumber(!autoGenerateNumber);
                      if (!autoGenerateNumber) {
                        setFormData(prev => ({ ...prev, load_number: "" }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="autoGenerate" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {t('newLoadModal.labels.autoGenerate')}
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  id="load_number"
                  name="load_number"
                  value={formData.load_number}
                  onChange={(e) => {
                    // If user starts typing and auto-generate is on, turn it off
                    if (autoGenerateNumber && e.target.value.trim() !== "") {
                      setAutoGenerateNumber(false);
                    }
                    handleChange(e);
                  }}
                  onFocus={() => {
                    // When field is focused and auto-generate is on, provide visual feedback
                    if (autoGenerateNumber) {
                      // You could add a state here to show a tooltip or highlight
                    }
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={autoGenerateNumber ? t('newLoadModal.placeholders.willBeAutoGenerated') : t('newLoadModal.placeholders.enterLoadNumber')}
                />
              </div>

              {autoGenerateNumber && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {t('newLoadModal.hints.loadNumberFormat', { example: generateLoadNumber() })}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">{t('newLoadModal.routeDetails.title')}</h3>
              <p className="text-sm text-green-700 dark:text-green-300">{t('newLoadModal.routeDetails.description')}</p>
            </div>

            {/* Pickup Location */}
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('newLoadModal.labels.pickupLocation')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-green-500 dark:text-green-400" />
                </div>
                <input
                  type="text"
                  id="origin"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={t('newLoadModal.placeholders.cityStatePickup')}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Delivery Location */}
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('newLoadModal.labels.deliveryLocation')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-red-500 dark:text-red-400" />
                </div>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={t('newLoadModal.placeholders.cityStateDelivery')}
                  required
                />
              </div>
            </div>

            {/* Date section with better layout */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('newLoadModal.labels.pickupDate')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="date"
                      id="pickupDate"
                      name="pickupDate"
                      value={formData.pickupDate}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('newLoadModal.labels.deliveryDate')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="date"
                      id="deliveryDate"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {formData.pickupDate && formData.deliveryDate && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <Clock size={16} className="inline mr-1" />
                    {t('newLoadModal.transitTime', { days: Math.ceil((new Date(formData.deliveryDate) - new Date(formData.pickupDate)) / (1000 * 60 * 60 * 24)) })}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">{t('newLoadModal.pricingAssignment.title')}</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">{t('newLoadModal.pricingAssignment.description')}</p>
            </div>

            {/* Rate section */}
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('newLoadModal.labels.loadRate')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('newLoadModal.hints.totalAmount')}</p>
            </div>

            {/* Optional fields section with better UI */}
            <div className="mt-6">
              <div
                className={`
                  border-2 rounded-lg transition-all duration-300
                  ${showOptionalFields
                    ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
              >
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  aria-expanded={showOptionalFields}
                  className={`
                    w-full p-4 flex items-center justify-between rounded-lg transition-all
                    ${showOptionalFields ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${showOptionalFields
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }
                    `}>
                      <Info size={20} />
                    </div>
                    <div className="text-left">
                      <h4 className={`font-semibold ${showOptionalFields ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                        {t('newLoadModal.optional.title')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('newLoadModal.optional.description')}
                      </p>
                    </div>
                  </div>
                  <div className={`
                    flex items-center space-x-2 transition-all
                    ${showOptionalFields ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                  `}>
                    <span className="text-sm font-medium">
                      {showOptionalFields ? t('newLoadModal.optional.hide') : t('newLoadModal.optional.show')}
                    </span>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${showOptionalFields
                        ? 'bg-blue-200 dark:bg-blue-800 rotate-180'
                        : 'bg-gray-200 dark:bg-gray-600'
                      }
                    `}>
                      <ChevronRight size={16} className="transform rotate-90" />
                    </div>
                  </div>
                </button>

                {showOptionalFields && (
                  <div className="p-4 pt-0 space-y-4">
                    {/* Assignment section with better layout */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                        <Users size={18} className="mr-2 text-blue-500 dark:text-blue-400" />
                        {t('newLoadModal.resourceAssignment')}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('newLoadModal.labels.assignDriver')}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Users size={18} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <select
                              id="driver_id"
                              name="driver_id"
                              value={formData.driver_id}
                              onChange={handleChange}
                              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">{t('newLoadModal.placeholders.assignLater')}</option>
                              {drivers.map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('newLoadModal.labels.assignTruck')}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Truck size={18} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <select
                              id="vehicle_id"
                              name="vehicle_id"
                              value={formData.vehicle_id}
                              onChange={handleChange}
                              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">{t('newLoadModal.placeholders.assignLater')}</option>
                              {trucks.map((truck) => (
                                <option key={truck.id} value={truck.id}>
                                  {truck.name} ({truck.license_plate})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {(formData.driver_id || formData.vehicle_id) && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <CheckCircle size={16} className="inline mr-1" />
                            {t('newLoadModal.markedAsAssigned')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FileText size={18} className="inline mr-2 text-blue-500 dark:text-blue-400" />
                        {t('newLoadModal.labels.notesInstructions')}
                      </label>
                      <div className="relative">
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows="3"
                          className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder={t('newLoadModal.placeholders.specialInstructions')}
                        ></textarea>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('newLoadModal.hints.deliveryInstructions')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Load Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('newLoadModal.loadSummary')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('newLoadModal.summary.customer')}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formData.customer || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('newLoadModal.summary.route')}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formData.origin || '-'} → {formData.destination || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('newLoadModal.summary.dates')}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formData.pickupDate ? new Date(formData.pickupDate).toLocaleDateString() : '-'} →
                    {formData.deliveryDate ? new Date(formData.deliveryDate).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('newLoadModal.summary.rate')}:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${formData.rate || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-xl text-white z-10">
          <div className="p-4 sm:p-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <Route size={20} className="mr-2" />
                {t('newLoadModal.title')}
              </h2>
              <button
                onClick={handleClose}
                className="p-2.5 sm:p-2 hover:bg-blue-500 rounded-full transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                disabled={saving}
                aria-label="Close"
              >
                <X size={22} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Progress indicator - separated with its own container */}
          <div className="px-3 sm:px-5 pb-4 sm:pb-5">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-5 border border-white/40 shadow-xl">
              {/* Mobile: Centered steps */}
              <div className="flex sm:hidden items-center justify-center gap-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.number;
                  const isCompleted = currentStep > step.number;

                  return (
                    <div key={step.number} className="flex items-center">
                      <div className="flex flex-col items-center">
                        {/* Step circle with icon */}
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 shadow-xl
                          ${isActive
                            ? 'bg-white text-blue-600 scale-110 ring-2 ring-white/60'
                            : isCompleted
                              ? 'bg-green-500 text-white ring-2 ring-green-400/50'
                              : 'bg-blue-800/50 text-white/70 border-2 border-white/30'
                          }
                        `}>
                          {isCompleted ? (
                            <Check size={18} />
                          ) : (
                            <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                          )}
                        </div>

                        {/* Step name below icon */}
                        <div className={`mt-1.5 text-[10px] font-semibold text-center transition-all max-w-[60px] leading-tight ${
                          isActive
                            ? 'text-white'
                            : isCompleted
                              ? 'text-white/90'
                              : 'text-white/70'
                        }`}>
                          {step.title}
                        </div>
                      </div>

                      {/* Progress line between steps */}
                      {index < steps.length - 1 && (
                        <div className="w-6 h-1 mx-1 bg-blue-800/30 rounded-full overflow-hidden self-start mt-5">
                          <div className={`h-full transition-all duration-700 ${
                            isCompleted
                              ? 'bg-green-400 w-full'
                              : 'bg-blue-400/40 w-0'
                          }`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Original layout */}
              <div className="hidden sm:flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.number;
                  const isCompleted = currentStep > step.number;

                  return (
                    <div key={step.number} className="flex items-center flex-1">
                      <div className="flex flex-row items-center relative">
                        {/* Step circle with icon */}
                        <div className={`
                          w-14 h-14 rounded-full flex items-center justify-center font-semibold transition-all duration-300 shadow-xl
                          ${isActive
                            ? 'bg-white text-blue-600 scale-110 ring-4 ring-white/60'
                            : isCompleted
                              ? 'bg-green-500 text-white ring-2 ring-green-400/50'
                              : 'bg-blue-800/50 text-white/70 border-2 border-white/30'
                          }
                        `}>
                          {isCompleted ? (
                            <Check size={24} className="animate-in fade-in duration-300" />
                          ) : (
                            <Icon size={24} className={isActive ? 'animate-pulse' : ''} />
                          )}
                        </div>

                        {/* Step details */}
                        <div className="ml-3 text-left">
                          <div className={`text-xs font-medium transition-all ${
                            isActive
                              ? 'text-white/90'
                              : isCompleted
                                ? 'text-white/80'
                                : 'text-white/60'
                          }`}>
                            {t('wizard.step')} {step.number}
                          </div>
                          <div className={`text-sm font-semibold transition-all ${
                            isActive
                              ? 'text-white'
                              : isCompleted
                                ? 'text-white/90'
                                : 'text-white/70'
                          }`}>
                            {step.title}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar between steps */}
                      {index < steps.length - 1 && (
                        <div className="flex-1 mx-4">
                          <div className="h-3 bg-blue-800/30 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-white/10"></div>
                            <div className={`h-full transition-all duration-700 ease-out relative ${
                              isCompleted
                                ? 'bg-gradient-to-r from-green-400 to-green-500'
                                : 'bg-gradient-to-r from-blue-400/40 to-blue-500/40'
                            }`} style={{
                              width: isCompleted ? '100%' : isActive ? '50%' : '0%'
                            }}>
                              {isCompleted && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="p-6 bg-white dark:bg-gray-800">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {hasRestoredData && currentStep === 1 && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded-md flex items-start justify-between">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-400 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">{t('newLoadModal.formRestored')}</p>
              </div>
              <button
                onClick={handleClearForm}
                className="ml-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                {t('newLoadModal.clearAll')}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Action buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8 flex justify-between">
              <button
                type="button"
                onClick={currentStep === 1 ? handleClose : handlePrevious}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
                disabled={saving}
              >
                <ChevronLeft size={16} className="mr-2" />
                {currentStep === 1 ? t('common:buttons.cancel') : t('common:buttons.previous')}
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center transition-colors"
                >
                  {t('common:buttons.next')}
                  <ChevronRight size={16} className="ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center transition-colors"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      {t('newLoadModal.buttons.creating')}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      {t('newLoadModal.buttons.createLoad')}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}