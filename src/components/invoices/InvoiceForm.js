"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  generateInvoiceNumber,
  createInvoice,
  updateInvoice
} from "@/lib/services/invoiceService";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Download,
  ChevronLeft,
  Info,
  CheckCircle,
  X,
  Calendar,
  DollarSign,
  Receipt,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { fetchCustomers } from "@/lib/services/customerService";
import Link from "next/link";

// Invoice Form Component
export default function InvoiceForm({ initialInvoice = null, customerId = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Form state
  const [invoice, setInvoice] = useState({
    invoiceNumber: "",
    poNumber: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
    customer: "",
    customerId: null,
    paymentTerms: "net15",
    taxRate: 0,
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
    notes: "",
    terms: "Payment is due within 15 days from the date of invoice. Late payments are subject to a 1.5% monthly finance charge.",
    status: "Pending",
    loadId: null,
    loadDetails: {
      loadNumber: "",
      origin: "",
      destination: "",
      shipmentDate: "",
      deliveryDate: "",
      description: ""
    }
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState("invoice-details");
  const [saving, setSaving] = useState(false);

  // Generate invoice number and load initial data
  useEffect(() => {
    async function initialize() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // If editing an existing invoice
        if (initialInvoice) {
          // If we have initial invoice data, use it
          setInvoice({
            ...initialInvoice,
            // Ensure items array exists
            items: initialInvoice.items || [],
            // Ensure loadDetails object exists
            loadDetails: initialInvoice.loadDetails || {
              loadNumber: "",
              origin: "",
              destination: "",
              shipmentDate: "",
              deliveryDate: "",
              description: ""
            }
          });
        } else {
          // For new invoice, generate a number
          const invoiceNumber = await generateInvoiceNumber(user.id);
          setInvoice(prev => ({
            ...prev,
            invoiceNumber,
            user_id: user.id
          }));
          
          // If a customerId was provided, set it
          if (customerId) {
            setInvoice(prev => ({
              ...prev,
              customerId
            }));
          }
        }
        
        // Fetch customers for the dropdown
        const customersList = await fetchCustomers(user.id);
        setCustomers(customersList);
        
        // If we have a customerId (either from the initialInvoice or passed in)
        const customerIdToUse = initialInvoice?.customerId || customerId;
        if (customerIdToUse) {
          const selectedCustomer = customersList.find(c => c.id === customerIdToUse);
          if (selectedCustomer) {
            setSelectedCustomer(selectedCustomer);
            setInvoice(prev => ({
              ...prev,
              customer: selectedCustomer.company_name,
              customerId: selectedCustomer.id
            }));
          }
        }
      } catch (err) {
        console.error("Error initializing invoice form:", err);
        setError("Failed to initialize invoice form. Please try again.");
      }
    }
    
    initialize();
  }, [initialInvoice, customerId, router]);

  // Calculate invoice totals
  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
    
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;
    
    return {
      subtotal,
      taxAmount,
      total
    };
  };
  
  const { subtotal, taxAmount, total } = calculateTotals();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setInvoice({
        ...invoice,
        [parent]: {
          ...invoice[parent],
          [child]: value
        }
      });
    } else {
      setInvoice({
        ...invoice,
        [name]: value
      });
    }
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle customer selection
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setInvoice({
          ...invoice,
          customer: customer.company_name,
          customerId: customer.id
        });
      }
    } else {
      setSelectedCustomer(null);
      setInvoice({
        ...invoice,
        customer: "",
        customerId: null
      });
    }
  };

  // Handle line item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoice.items];
    
    if (field === 'quantity' || field === 'unitPrice') {
      // Ensure numeric values
      value = parseFloat(value) || 0;
    }
    
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    setInvoice({
      ...invoice,
      items: updatedItems
    });
  };

  // Add a new line item
  const addLineItem = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        { description: "", quantity: 1, unitPrice: 0 }
      ]
    });
  };

  // Remove a line item
  const removeLineItem = (index) => {
    const updatedItems = [...invoice.items];
    updatedItems.splice(index, 1);
    
    setInvoice({
      ...invoice,
      items: updatedItems
    });
  };

  // Handle due date calculation based on payment terms
  const handlePaymentTermsChange = (e) => {
    const terms = e.target.value;
    let daysToAdd = 15; // default
    
    switch (terms) {
      case 'net30':
        daysToAdd = 30;
        break;
      case 'net45':
        daysToAdd = 45;
        break;
      case 'net60':
        daysToAdd = 60;
        break;
      case 'dueonreceipt':
        daysToAdd = 0;
        break;
      default: // net15
        daysToAdd = 15;
    }
    
    const invoiceDate = new Date(invoice.invoiceDate);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    
    setInvoice({
      ...invoice,
      paymentTerms: terms,
      dueDate: dueDate.toISOString().split('T')[0]
    });
  };

  // Validate the invoice form
  const validateInvoice = () => {
    const errors = {};
    
    // Required fields
    if (!invoice.invoiceNumber.trim()) {
      errors.invoiceNumber = "Invoice number is required";
    }
    
    if (!invoice.customer.trim()) {
      errors.customer = "Customer is required";
    }
    
    if (!invoice.invoiceDate) {
      errors.invoiceDate = "Invoice date is required";
    }
    
    if (!invoice.dueDate) {
      errors.dueDate = "Due date is required";
    }
    
    // Check line items
    if (invoice.items.length === 0) {
      errors.items = "At least one line item is required";
    } else {
      invoice.items.forEach((item, index) => {
        if (!item.description.trim()) {
          errors[`items[${index}].description`] = "Description is required";
        }
        
        if (item.quantity <= 0) {
          errors[`items[${index}].quantity`] = "Quantity must be greater than zero";
        }
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e, saveAndSend = false) => {
    e.preventDefault();
    
    if (!validateInvoice()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Prepare invoice data
      const invoiceData = {
        ...invoice,
        total: total,
        subtotal: subtotal,
        tax_amount: taxAmount,
        tax_rate: parseFloat(invoice.taxRate),
        status: saveAndSend ? 'Sent' : invoice.status || 'Draft',
        last_sent: saveAndSend ? new Date().toISOString() : null
      };
      
      if (initialInvoice) {
        // Update existing invoice
        await updateInvoice(initialInvoice.id, invoiceData);
        setSuccess("Invoice updated successfully!");
      } else {
        // Create new invoice
        await createInvoice(invoiceData);
        setSuccess("Invoice created successfully!");
      }
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/invoices');
      }, 1500);
    } catch (err) {
      console.error("Error saving invoice:", err);
      setError("Failed to save invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Tab content components
  const renderInvoiceDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number*
          </label>
          <input
            type="text"
            id="invoiceNumber"
            name="invoiceNumber"
            value={invoice.invoiceNumber}
            onChange={handleInputChange}
            className={`bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              validationErrors.invoiceNumber ? 'border-red-300' : ''
            }`}
            placeholder="INV-2025-001"
            required
          />
          {validationErrors.invoiceNumber && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.invoiceNumber}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 mb-1">
            PO Number (Optional)
          </label>
          <input
            type="text"
            id="poNumber"
            name="poNumber"
            value={invoice.poNumber}
            onChange={handleInputChange}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Customer's PO number"
          />
        </div>
        
        <div>
          <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Date*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="invoiceDate"
              name="invoiceDate"
              value={invoice.invoiceDate}
              onChange={handleInputChange}
              className={`bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md ${
                validationErrors.invoiceDate ? 'border-red-300' : ''
              }`}
              required
            />
          </div>
          {validationErrors.invoiceDate && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.invoiceDate}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={invoice.dueDate}
              onChange={handleInputChange}
              className={`bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md ${
                validationErrors.dueDate ? 'border-red-300' : ''
              }`}
              required
            />
          </div>
          {validationErrors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
            Customer*
          </label>
          <select
            id="customer"
            value={invoice.customerId || ""}
            onChange={handleCustomerChange}
            className={`bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              validationErrors.customer ? 'border-red-300' : ''
            }`}
            required
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name}
              </option>
            ))}
          </select>
          {validationErrors.customer && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.customer}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Terms
          </label>
          <select
            id="paymentTerms"
            name="paymentTerms"
            value={invoice.paymentTerms}
            onChange={handlePaymentTermsChange}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="net15">Net 15</option>
            <option value="net30">Net 30</option>
            <option value="net45">Net 45</option>
            <option value="net60">Net 60</option>
            <option value="dueonreceipt">Due on Receipt</option>
          </select>
        </div>
      </div>
      
      {selectedCustomer && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Customer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-gray-900">Contact:</span> {selectedCustomer.contact_name || 'N/A'}
            </div>
            <div>
              <span className="font-medium text-gray-900">Email:</span> {selectedCustomer.email || 'N/A'}
            </div>
            <div>
              <span className="font-medium text-gray-900">Phone:</span> {selectedCustomer.phone || 'N/A'}
            </div>
            <div>
              <span className="font-medium text-gray-900">Address:</span> {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.city || ''} ${selectedCustomer.state || ''}` : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLoadDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="loadNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Load Number (Optional)
          </label>
          <input
            type="text"
            id="loadNumber"
            name="loadDetails.loadNumber"
            value={invoice.loadDetails.loadNumber}
            onChange={handleInputChange}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g. L-12345"
          />
        </div>
        
        <div className="hidden md:block">
          {/* Empty space to maintain grid alignment */}
        </div>
        
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
            Origin
          </label>
          <input
            type="text"
            id="origin"
            name="loadDetails.origin"
            value={invoice.loadDetails.origin}
            onChange={handleInputChange}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="City, State"
          />
        </div>
        
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
            Destination
          </label>
          <input
            type="text"
            id="destination"
            name="loadDetails.destination"
            value={invoice.loadDetails.destination}
            onChange={handleInputChange}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="City, State"
          />
        </div>
        
        <div>
          <label htmlFor="shipmentDate" className="block text-sm font-medium text-gray-700 mb-1">
            Shipment Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="shipmentDate"
              name="loadDetails.shipmentDate"
              value={invoice.loadDetails.shipmentDate}
              onChange={handleInputChange}
              className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="deliveryDate"
              name="loadDetails.deliveryDate"
              value={invoice.loadDetails.deliveryDate}
              onChange={handleInputChange}
              className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="loadDetails.description"
            value={invoice.loadDetails.description}
            onChange={handleInputChange}
            rows="3"
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Description of goods, weight, quantity, etc."
          ></textarea>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Info className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={16} />
          <p className="text-sm text-blue-700">
            Adding load details helps connect your invoices to specific shipments, making it easier to track revenue by load.
          </p>
        </div>
      </div>
    </div>
  );

  const renderLineItemsTab = () => (
    <div className="space-y-6">
      {/* Line Items Header */}
      <div className="flex flex-wrap items-center space-y-2 mb-4 md:space-y-0 pb-2 border-b border-gray-200 font-medium text-gray-700 text-sm">
        <div className="w-full md:w-1/3 pr-2">Description</div>
        <div className="w-full md:w-1/5 pr-2">Quantity</div>
        <div className="w-full md:w-1/5 pr-2">Unit Price ($)</div>
        <div className="w-full md:w-1/5 pr-2">Total</div>
        <div className="w-full md:w-auto pl-2">Actions</div>
      </div>
      
      {/* Line Items */}
      {invoice.items.map((item, index) => (
        <div key={index} className="flex flex-wrap items-center space-y-2 md:space-y-0 pb-4 border-b border-gray-200">
          <div className="w-full md:w-1/3 pr-2">
            <input
              type="text"
              value={item.description}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              className={`bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                validationErrors[`items[${index}].description`] ? 'border-red-300' : ''
              }`}
              placeholder="Description"
              required
            />
            {validationErrors[`items[${index}].description`] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors[`items[${index}].description`]}</p>
            )}
          </div>
          <div className="w-full md:w-1/5 pr-2">
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              className={`bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                validationErrors[`items[${index}].quantity`] ? 'border-red-300' : ''
              }`}
              placeholder="Quantity"
              min="0"
              step="1"
              required
            />
            {validationErrors[`items[${index}].quantity`] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors[`items[${index}].quantity`]}</p>
            )}
          </div>
          <div className="w-full md:w-1/5 pr-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={16} className="text-gray-400" />
              </div>
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="w-full md:w-1/5 pr-2">
            <div className="relative bg-gray-100 rounded-md p-2 text-right">
              <span className="text-sm font-medium">
                ${(item.quantity * item.unitPrice).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto pl-2">
            <button
              type="button"
              onClick={() => removeLineItem(index)}
              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
              disabled={invoice.items.length === 1}
              title={invoice.items.length === 1 ? "Cannot remove the only line item" : "Remove item"}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
      
      {/* Add Line Item Button */}
      <button
        type="button"
        onClick={addLineItem}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
      >
        <Plus size={16} className="mr-2" />
        Add Line Item
      </button>
      
      {/* Totals Section */}
      <div className="mt-8 space-y-4">
        <div className="flex justify-between border-t border-gray-200 pt-4">
          <span className="text-sm font-medium text-gray-700">Subtotal</span>
          <span className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Tax Rate (%)</span>
            <input
              type="number"
              name="taxRate"
              value={invoice.taxRate}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-20 sm:text-sm border-gray-300 rounded-md bg-gray-50"
              min="0"
              step="0.1"
            />
          </div>
          <span className="text-sm font-medium text-gray-900">${taxAmount.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between border-t border-gray-200 pt-4">
          <span className="text-base font-semibold text-gray-900">Total Due</span>
          <span className="text-base font-semibold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (visible to customer)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={invoice.notes}
          onChange={handleInputChange}
          rows="3"
          className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Any additional information for your customer..."
        ></textarea>
      </div>
      
      <div>
        <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
          Terms & Conditions
        </label>
        <textarea
          id="terms"
          name="terms"
          value={invoice.terms}
          onChange={handleInputChange}
          rows="3"
          className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Terms and conditions, payment instructions, etc."
        ></textarea>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Info className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={16} />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Professional Tip:</p>
            <p>Include clear payment instructions and terms to avoid misunderstandings and encourage faster payments.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("invoice-details")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "invoice-details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Invoice Details
          </button>
          <button
            onClick={() => setActiveTab("load-details")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "load-details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Load Details
          </button>
          <button
            onClick={() => setActiveTab("line-items")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "line-items"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Line Items
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "notes"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Notes & Terms
          </button>
        </nav>
      </div>
      
      {/* Form */}
      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            {activeTab === "invoice-details" && renderInvoiceDetailsTab()}
            {activeTab === "load-details" && renderLoadDetailsTab()}
            {activeTab === "line-items" && renderLineItemsTab()}
            {activeTab === "notes" && renderNotesTab()}
          </div>
          
          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div>
              <Link
                href="/dashboard/invoices"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChevronLeft size={16} className="mr-2" />
                Back to Invoices
              </Link>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "invoice-details") {
                    setActiveTab("load-details");
                  } else if (activeTab === "load-details") {
                    setActiveTab("line-items");
                  } else if (activeTab === "line-items") {
                    setActiveTab("notes");
                  } else {
                    // Submit when on the last tab
                    validateInvoice() && handleSubmit(new Event('submit'), false);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {activeTab === "notes" ? "Save Invoice" : "Next"}
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {initialInvoice ? "Update" : "Save"}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Send size={16} className="mr-2" />
                Save & Send
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Invoice Preview Modal would be added here */}
    </div>
  );
}