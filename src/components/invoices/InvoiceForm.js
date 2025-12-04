"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  generateInvoiceNumber,
  createInvoice,
  updateInvoice
} from "@/lib/services/invoiceService";
import { fetchLoads } from "@/lib/services/loadService";
import {
  Save,
  Trash2,
  Plus,
  Calendar,
  Truck,
  FileText,
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  MapPin,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  DollarSign,
  ClipboardList
} from "lucide-react";

const STORAGE_KEY = 'invoiceFormData';
const STORAGE_STEP_KEY = 'invoiceFormStep';

// Invoice Item Row Component
const InvoiceItemRow = ({ item, index, onChange, onRemove, canRemove }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(index, name, value);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={item.description}
            onChange={handleInputChange}
            placeholder="Service or item description"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={item.quantity}
            onChange={handleInputChange}
            placeholder="1"
            min="1"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unit Price
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={16} className="text-gray-400" />
            </div>
            <input
              type="number"
              name="unit_price"
              value={item.unit_price}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-9 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Total
          </label>
          <div className="px-4 py-3 bg-gray-100 dark:bg-gray-600 rounded-lg text-base font-semibold text-gray-900 dark:text-gray-100">
            ${(item.quantity * item.unit_price).toFixed(2)}
          </div>
        </div>
        <div className="md:col-span-1 flex justify-end">
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Invoice Form Component
export default function InvoiceForm({ userId, initialData = null, isDuplicating = false }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [hasRestoredData, setHasRestoredData] = useState(false);

  // Form state
  const [invoice, setInvoice] = useState({
    invoice_number: "",
    customer: "",
    customer_email: "",
    customer_address: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 15);
      return date.toISOString().split("T")[0];
    })(),
    status: "Draft",
    payment_terms: "Net 15",
    po_number: "",
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    total: 0,
    notes: "",
    terms: "Payment is due within 15 days of invoice date.",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
    load_id: ""
  });

  // Save to localStorage on form data change
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
    }
  }, [invoice, currentStep, initialData]);

  // Load from localStorage or initialData on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Fetch customers
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", userId)
          .order("company_name", { ascending: true });

        if (customerError) throw customerError;
        setCustomers(customerData || []);

        // Fetch loads
        const loadData = await fetchLoads(userId);
        setLoads(loadData || []);

        // Load initial data or saved data
        if (initialData) {
          setInvoice(initialData);
        } else {
          const savedData = localStorage.getItem(STORAGE_KEY);
          const savedStep = localStorage.getItem(STORAGE_STEP_KEY);

          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              if (parsedData.customer || parsedData.items?.some(item => item.description)) {
                setInvoice(parsedData);
                setCurrentStep(parseInt(savedStep) || 1);
                setHasRestoredData(true);
              }
            } catch {
              // Silent fail
            }
          }

          // Generate invoice number for new invoices
          const invoiceNumber = await generateInvoiceNumber(userId);
          setInvoice(prev => ({
            ...prev,
            invoice_number: prev.invoice_number || invoiceNumber
          }));
        }
      } catch (err) {
        setErrors({ submit: "Failed to initialize form. Please try again." });
      }
    }

    initialize();
  }, [userId, initialData]);

  // Calculate subtotal, tax, and total when items change
  useEffect(() => {
    const subtotal = invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxAmount = (subtotal * invoice.tax_rate) / 100;
    const total = subtotal + taxAmount;

    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total
    }));
  }, [invoice.items, invoice.tax_rate]);

  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP_KEY);
    setInvoice({
      invoice_number: invoice.invoice_number,
      customer: "",
      customer_email: "",
      customer_address: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 15);
        return date.toISOString().split("T")[0];
      })(),
      status: "Draft",
      payment_terms: "Net 15",
      po_number: "",
      subtotal: 0,
      tax_rate: 0,
      tax_amount: 0,
      total: 0,
      notes: "",
      terms: "Payment is due within 15 days of invoice date.",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
      load_id: ""
    });
    setCurrentStep(1);
    setHasRestoredData(false);
    setErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle customer selection
  const handleCustomerChange = (e) => {
    const selectedCustomer = customers.find(c => c.company_name === e.target.value);

    if (selectedCustomer) {
      setInvoice(prev => ({
        ...prev,
        customer: selectedCustomer.company_name,
        customer_email: selectedCustomer.email || "",
        customer_address: formatCustomerAddress(selectedCustomer)
      }));
    } else {
      setInvoice(prev => ({
        ...prev,
        customer: e.target.value,
        customer_email: "",
        customer_address: ""
      }));
    }

    if (errors.customer) {
      setErrors(prev => ({ ...prev, customer: '' }));
    }
  };

  // Format customer address from customer object
  const formatCustomerAddress = (customer) => {
    const addressParts = [
      customer.address,
      customer.city && customer.state ? `${customer.city}, ${customer.state} ${customer.zip || ''}` : customer.city || customer.state,
    ].filter(Boolean);
    return addressParts.join('\n');
  };

  // Handle load selection
  const handleLoadChange = (e) => {
    const loadId = e.target.value;
    setInvoice(prev => ({
      ...prev,
      load_id: loadId
    }));

    if (loadId) {
      const selectedLoad = loads.find(l => l.id === loadId);
      if (selectedLoad) {
        const loadItemIndex = invoice.items.findIndex(
          item => item.description.includes(`Load #${selectedLoad.loadNumber}`)
        );

        if (loadItemIndex === -1) {
          const loadItem = {
            description: `Trucking Services - Load #${selectedLoad.loadNumber} - ${selectedLoad.origin} to ${selectedLoad.destination}`,
            quantity: 1,
            unit_price: selectedLoad.rate || 0
          };

          setInvoice(prev => ({
            ...prev,
            items: [...prev.items.filter(item => item.description), loadItem]
          }));
        }
      }
    }
  };

  // Handle item changes
  const handleItemChange = (index, name, value) => {
    const updatedItems = [...invoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: name === 'quantity' || name === 'unit_price' ? parseFloat(value) || 0 : value
    };

    setInvoice(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Add a new empty item
  const handleAddItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, unit_price: 0 }
      ]
    }));
  };

  // Remove an item
  const handleRemoveItem = (index) => {
    if (invoice.items.length > 1) {
      const updatedItems = [...invoice.items];
      updatedItems.splice(index, 1);
      setInvoice(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  // Validate step
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!invoice.customer.trim()) {
          newErrors.customer = 'Customer is required';
        }
        break;
      case 2:
        if (!invoice.invoice_date) {
          newErrors.invoice_date = 'Invoice date is required';
        }
        if (!invoice.due_date) {
          newErrors.due_date = 'Due date is required';
        }
        break;
      case 3:
        if (invoice.items.some(item => !item.description || item.quantity <= 0)) {
          newErrors.items = 'All items must have a description and quantity greater than 0';
        }
        if (invoice.total <= 0) {
          newErrors.items = 'Invoice must have at least one item with a value';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);
      setErrors({});

      const invoiceData = {
        ...invoice,
        user_id: userId,
        status: invoice.status || 'Draft',
        amount_paid: 0,
      };

      let result;

      if (initialData && !isDuplicating) {
        result = await updateInvoice(initialData.id, invoiceData);
      } else {
        result = await createInvoice(invoiceData);
      }

      // Clear saved data
      if (!initialData) {
        clearSavedData();
      }

      setSuccess(true);

      setTimeout(() => {
        router.push(`/dashboard/invoices/${result.id}`);
      }, 1000);
    } catch (err) {
      setErrors({ submit: err.message || "Failed to save invoice. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Customer', icon: User },
    { number: 2, title: 'Details', icon: Calendar },
    { number: 3, title: 'Items', icon: ClipboardList }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <select
                  name="customer"
                  value={invoice.customer}
                  onChange={handleCustomerChange}
                  className={`block w-full pl-10 pr-4 py-3 border ${errors.customer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.company_name}>
                      {customer.company_name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.customer && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.customer}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="customer_email"
                    value={invoice.customer_email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="customer@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PO Number
                </label>
                <input
                  type="text"
                  name="po_number"
                  value={invoice.po_number}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Purchase Order Number (Optional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Address
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <MapPin size={18} className="text-gray-400" />
                </div>
                <textarea
                  name="customer_address"
                  value={invoice.customer_address}
                  onChange={handleInputChange}
                  rows="3"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Customer address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related Load (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Truck size={18} className="text-gray-400" />
                </div>
                <select
                  name="load_id"
                  value={invoice.load_id}
                  onChange={handleLoadChange}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a load to auto-fill</option>
                  {loads.map(load => (
                    <option key={load.id} value={load.id}>
                      Load #{load.loadNumber} - {load.origin} to {load.destination}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selecting a load will automatically add it as a line item
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoice Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invoice Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="invoice_number"
                    value={invoice.invoice_number}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    readOnly={initialData && !isDuplicating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={invoice.status}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="invoice_date"
                    value={invoice.invoice_date}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-4 py-3 border ${errors.invoice_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required
                  />
                </div>
                {errors.invoice_date && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.invoice_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="due_date"
                    value={invoice.due_date}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-4 py-3 border ${errors.due_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required
                  />
                </div>
                {errors.due_date && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.due_date}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Terms
                </label>
                <select
                  name="payment_terms"
                  value={invoice.payment_terms}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="tax_rate"
                  value={invoice.tax_rate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={invoice.notes}
                onChange={handleInputChange}
                rows="3"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Additional notes for the customer..."
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Line Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                <Plus size={18} className="mr-1" />
                Add Item
              </button>
            </div>

            {errors.items && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-700 dark:text-red-300">{errors.items}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {invoice.items.map((item, index) => (
                <InvoiceItemRow
                  key={index}
                  item={item}
                  index={index}
                  onChange={handleItemChange}
                  onRemove={handleRemoveItem}
                  canRemove={invoice.items.length > 1}
                />
              ))}
            </div>

            {/* Totals */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax ({invoice.tax_rate}%):</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Terms & Conditions
              </label>
              <textarea
                name="terms"
                value={invoice.terms}
                onChange={handleInputChange}
                rows="3"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Review Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                <CheckCircle size={18} className="mr-2" />
                Review Invoice Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Invoice #:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">{invoice.invoice_number}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Customer:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">{invoice.customer}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Invoice Date:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">{invoice.invoice_date}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Due Date:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">{invoice.due_date}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Status:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">{invoice.status}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Total:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Progress Steps Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white p-6">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isActive ? '#ffffff' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.3)'
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive ? 'ring-4 ring-white/30' : ''
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={20} className="text-white" />
                    ) : (
                      <Icon size={20} className={isActive ? 'text-blue-600' : 'text-white'} />
                    )}
                  </motion.div>
                  <span className={`ml-2 text-sm hidden sm:inline ${isActive ? 'font-semibold' : ''}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    currentStep > step.number ? 'bg-green-400' : 'bg-white/30'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Restored Data Alert */}
      {hasRestoredData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mx-6 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="text-blue-500 dark:text-blue-400 mr-2" size={20} />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We&apos;ve restored your previous progress. You can continue where you left off.
              </p>
            </div>
            <button
              onClick={clearSavedData}
              className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 flex items-center gap-1 text-sm"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mx-6 mt-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded-md">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Invoice saved successfully! Redirecting...
            </p>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Footer with Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={currentStep === 1 ? () => router.back() : handlePrevious}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
            disabled={loading}
          >
            <ChevronLeft size={16} className="mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center transition-colors"
              disabled={loading}
            >
              Next
              <ChevronRight size={16} className="ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  {initialData && !isDuplicating ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {initialData && !isDuplicating ? 'Update Invoice' : 'Create Invoice'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
