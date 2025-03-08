"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
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
  CreditCard,
  Calendar,
  Truck,
  FileText,
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle
} from "lucide-react";

// Invoice Item Row Component
const InvoiceItemRow = ({ item, index, onChange, onRemove }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(index, name, value);
  };

  return (
    <tr className="border-b border-gray-200">
      <td className="px-4 py-3">
        <input
          type="text"
          name="description"
          value={item.description}
          onChange={handleInputChange}
          placeholder="Description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          required
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          name="quantity"
          value={item.quantity}
          onChange={handleInputChange}
          placeholder="Qty"
          min="1"
          step="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          required
        />
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">$</span>
          </div>
          <input
            type="number"
            name="unit_price"
            value={item.unit_price}
            onChange={handleInputChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
          />
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        ${(item.quantity * item.unit_price).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

// Main Invoice Form Component
export default function InvoiceForm({ userId, initialData = null, isDuplicating = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loads, setLoads] = useState([]);

  // Form state
  const [invoice, setInvoice] = useState({
    invoice_number: "",
    customer: "",
    customer_email: "",
    customer_address: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 15); // Default to Net 15
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
    terms: "Payment is due within 15 days of invoice date. Please make check payable to Your Company Name.",
    items: [
      {
        description: "",
        quantity: 1,
        unit_price: 0
      }
    ],
    load_id: ""
  });

  // Initialize form data
  useEffect(() => {
    async function initialize() {
      try {
        // Generate invoice number for new invoices
        if (!initialData) {
          const invoiceNumber = await generateInvoiceNumber(userId);
          setInvoice(prev => ({
            ...prev,
            invoice_number: invoiceNumber
          }));
        } else {
          // Use initial data if provided (for editing or duplicating)
          setInvoice(initialData);
        }

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
      } catch (err) {
        console.error("Error initializing form:", err);
        setError("Failed to initialize form. Please try again.");
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      [name]: value
    }));
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

    // If a load is selected, add it as an item
    if (loadId) {
      const selectedLoad = loads.find(l => l.id === loadId);
      if (selectedLoad) {
        // Check if this load is already in the items
        const loadItemIndex = invoice.items.findIndex(
          item => item.description.includes(`Load #${selectedLoad.loadNumber}`)
        );

        if (loadItemIndex === -1) {
          // Add a new item for this load
          const loadItem = {
            description: `Trucking Services - Load #${selectedLoad.loadNumber} - ${selectedLoad.origin} to ${selectedLoad.destination}`,
            quantity: 1,
            unit_price: selectedLoad.rate || 0
          };

          // Add this item
          setInvoice(prev => ({
            ...prev,
            items: [...prev.items, loadItem]
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
        {
          description: "",
          quantity: 1,
          unit_price: 0
        }
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate items
      if (invoice.items.some(item => !item.description || item.quantity <= 0)) {
        setError("Please fill out all item fields with valid values.");
        setLoading(false);
        return;
      }
      
      // Prepare invoice data
      const invoiceData = {
        ...invoice,
        user_id: userId,
        status: invoice.status || 'Draft',
        amount_paid: 0, // New invoices start with no payments
      };
      
      // Create or update the invoice
      let result;
      
      if (initialData && !isDuplicating) {
        // Update existing invoice
        result = await updateInvoice(initialData.id, invoiceData);
      } else {
        // Create new invoice
        result = await createInvoice(invoiceData);
      }
      
      setSuccess(true);
      
      // Redirect to the invoice details page
      setTimeout(() => {
        router.push(`/dashboard/invoices/${result.id}`);
      }, 1000);
    } catch (err) {
      console.error("Error saving invoice:", err);
      setError(err.message || "Failed to save invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 mb-8">
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">
              Invoice saved successfully! Redirecting to invoice details...
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                id="invoice_number"
                name="invoice_number"
                value={invoice.invoice_number}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
                readOnly={initialData && !isDuplicating}
              />
            </div>
            
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <div className="relative">
                <select
                  id="customer"
                  name="customer"
                  value={invoice.customer}
                  onChange={handleCustomerChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            </div>
            
            <div>
              <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="customer_email"
                  name="customer_email"
                  value={invoice.customer_email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="customer@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="customer_address" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Address
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <MapPin size={16} className="text-gray-400" />
                </div>
                <textarea
                  id="customer_address"
                  name="customer_address"
                  value={invoice.customer_address}
                  onChange={handleInputChange}
                  rows="3"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Customer address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="po_number" className="block text-sm font-medium text-gray-700 mb-1">
                PO Number
              </label>
              <input
                type="text"
                id="po_number"
                name="po_number"
                value={invoice.po_number}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Purchase Order Number (Optional)"
              />
            </div>
            
            <div>
              <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                id="payment_terms"
                name="payment_terms"
                value={invoice.payment_terms}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="load_id" className="block text-sm font-medium text-gray-700 mb-1">
                Related Load
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Truck size={16} className="text-gray-400" />
                </div>
                <select
                  id="load_id"
                  name="load_id"
                  value={invoice.load_id}
                  onChange={handleLoadChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select a load (Optional)</option>
                  {loads.map(load => (
                    <option key={load.id} value={load.id}>
                      Load #{load.loadNumber} - {load.origin} to {load.destination}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dates & Status</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="invoice_date"
                  name="invoice_date"
                  value={invoice.invoice_date}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={invoice.due_date}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={invoice.status}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                id="tax_rate"
                name="tax_rate"
                value={invoice.tax_rate}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={invoice.notes}
                onChange={handleInputChange}
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Notes for the customer..."
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Invoice Items */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h3>
        
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <InvoiceItemRow
                  key={index}
                  item={item}
                  index={index}
                  onChange={handleItemChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="px-4 py-3">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Item
                  </button>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                  Subtotal:
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  ${invoice.subtotal.toFixed(2)}
                </td>
                <td></td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                  Tax ({invoice.tax_rate}%):
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  ${invoice.tax_amount.toFixed(2)}
                </td>
                <td></td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                  Total:
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  ${invoice.total.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Terms & Conditions */}
      <div className="mt-8">
        <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
          Terms & Conditions
        </label>
        <textarea
          id="terms"
          name="terms"
          value={invoice.terms}
          onChange={handleInputChange}
          rows="3"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
      
      {/* Actions */}
      <div className="mt-8 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Save Invoice
            </>
          )}
        </button>
      </div>
    </form>
  );
}