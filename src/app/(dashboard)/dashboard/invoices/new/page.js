"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  Truck,
  Wallet,
  Users,
  Calculator,
  ChevronLeft,
  Save,
  Send,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Calendar,
  DollarSign,
  Clock,
  FileDown,
  Package,
  Info
} from "lucide-react";

// Sidebar Component
const Sidebar = ({ activePage = "invoices" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
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
      </nav>
    </div>
  );
};

// Invoice Details Form Component
const InvoiceDetailsForm = ({ invoice, setInvoice }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number
          </label>
          <input
            type="text"
            id="invoiceNumber"
            value={invoice.invoiceNumber}
            onChange={(e) => setInvoice({...invoice, invoiceNumber: e.target.value})}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="INV-2025-001"
          />
        </div>
        
        <div>
          <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 mb-1">
            PO Number (Optional)
          </label>
          <input
            type="text"
            id="poNumber"
            value={invoice.poNumber}
            onChange={(e) => setInvoice({...invoice, poNumber: e.target.value})}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Customer's PO number"
          />
        </div>
        
        <div>
          <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="invoiceDate"
              value={invoice.invoiceDate}
              onChange={(e) => setInvoice({...invoice, invoiceDate: e.target.value})}
              className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="dueDate"
              value={invoice.dueDate}
              onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})}
              className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
            Customer
          </label>
          <select
            id="customer"
            value={invoice.customer}
            onChange={(e) => setInvoice({...invoice, customer: e.target.value})}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select a customer</option>
            <option value="ABC Logistics">ABC Logistics</option>
            <option value="XYZ Transport">XYZ Transport</option>
            <option value="Global Shipping Co">Global Shipping Co</option>
            <option value="Fast Freight Inc">Fast Freight Inc</option>
            <option value="Midwest Movers">Midwest Movers</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Terms
          </label>
          <select
            id="paymentTerms"
            value={invoice.paymentTerms}
            onChange={(e) => setInvoice({...invoice, paymentTerms: e.target.value})}
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
    </div>
  );
};

// Load Details Form Component
const LoadDetailsForm = ({ invoice, setInvoice }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Load Details</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="loadNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Load Number (Optional)
          </label>
          <input
            type="text"
            id="loadNumber"
            value={invoice.loadDetails.loadNumber}
            onChange={(e) => setInvoice({
              ...invoice, 
              loadDetails: {...invoice.loadDetails, loadNumber: e.target.value}
            })}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g. L-12345"
          />
        </div>
        
        <div>
          <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle ID
          </label>
          <input
            type="text"
            id="vehicle"
            value={invoice.loadDetails.vehicle}
            onChange={(e) => setInvoice({
              ...invoice, 
              loadDetails: {...invoice.loadDetails, vehicle: e.target.value}
            })}
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Truck or trailer ID"
          />
        </div>
        
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
            Origin
          </label>
          <input
            type="text"
            id="origin"
            value={invoice.loadDetails.origin}
            onChange={(e) => setInvoice({
              ...invoice, 
              loadDetails: {...invoice.loadDetails, origin: e.target.value}
            })}
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
            value={invoice.loadDetails.destination}
            onChange={(e) => setInvoice({
              ...invoice, 
              loadDetails: {...invoice.loadDetails, destination: e.target.value}
            })}
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
              value={invoice.loadDetails.shipmentDate}
              onChange={(e) => setInvoice({
                ...invoice, 
                loadDetails: {...invoice.loadDetails, shipmentDate: e.target.value}
              })}
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
              value={invoice.loadDetails.deliveryDate}
              onChange={(e) => setInvoice({
                ...invoice, 
                loadDetails: {...invoice.loadDetails, deliveryDate: e.target.value}
              })}
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
            value={invoice.loadDetails.description}
            onChange={(e) => setInvoice({
              ...invoice, 
              loadDetails: {...invoice.loadDetails, description: e.target.value}
            })}
            rows="2"
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Description of goods, weight, quantity, etc."
          ></textarea>
        </div>
      </div>
    </div>
  );
};

// Line Item Component
const LineItem = ({ item, index, updateItem, removeItem }) => {
  return (
    <div className="flex flex-wrap items-center space-y-2 md:space-y-0 pb-4 border-b border-gray-200">
      <div className="w-full md:w-1/3 pr-2">
        <input
          type="text"
          value={item.description}
          onChange={(e) => updateItem(index, { ...item, description: e.target.value })}
          className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Description"
        />
      </div>
      <div className="w-full md:w-1/5 pr-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => updateItem(index, { ...item, quantity: parseFloat(e.target.value) || 0 })}
          className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Quantity"
          min="0"
          step="1"
        />
      </div>
      <div className="w-full md:w-1/5 pr-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign size={16} className="text-gray-400" />
          </div>
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => updateItem(index, { ...item, unitPrice: parseFloat(e.target.value) || 0 })}
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
          onClick={() => removeItem(index)}
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

// Line Items Form Component
const LineItemsForm = ({ invoice, setInvoice }) => {
  const addLineItem = () => {
    const newItems = [...invoice.items, { description: '', quantity: 1, unitPrice: 0 }];
    setInvoice({ ...invoice, items: newItems });
  };

  const updateLineItem = (index, updatedItem) => {
    const newItems = [...invoice.items];
    newItems[index] = updatedItem;
    setInvoice({ ...invoice, items: newItems });
  };

  const removeLineItem = (index) => {
    const newItems = [...invoice.items];
    newItems.splice(index, 1);
    setInvoice({ ...invoice, items: newItems });
  };

  // Calculate subtotal
  const subtotal = invoice.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  
  // Calculate tax amount
  const taxAmount = subtotal * (invoice.taxRate / 100);
  
  // Calculate total
  const total = subtotal + taxAmount;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {invoice.items.map((item, index) => (
            <LineItem
              key={index}
              item={item}
              index={index}
              updateItem={updateLineItem}
              removeItem={removeLineItem}
            />
          ))}
          
          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Plus size={16} className="mr-2" />
            Add Line Item
          </button>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="flex justify-between border-t border-gray-200 pt-4">
            <span className="text-sm font-medium text-gray-700">Subtotal</span>
            <span className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Tax Rate</span>
              <input
                type="number"
                value={invoice.taxRate}
                onChange={(e) => setInvoice({...invoice, taxRate: parseFloat(e.target.value) || 0})}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-20 sm:text-sm border-gray-300 rounded-md"
                min="0"
                step="0.1"
              />
              <span className="text-sm text-gray-500 ml-1">%</span>
            </div>
            <span className="text-sm font-medium text-gray-900">${taxAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between border-t border-gray-200 pt-4">
            <span className="text-base font-semibold text-gray-900">Total Due</span>
            <span className="text-base font-semibold text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notes and Terms Form Component
const NotesAndTermsForm = ({ invoice, setInvoice }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Notes & Terms</h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (visible to customer)
          </label>
          <textarea
            id="notes"
            value={invoice.notes}
            onChange={(e) => setInvoice({...invoice, notes: e.target.value})}
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
            value={invoice.terms}
            onChange={(e) => setInvoice({...invoice, terms: e.target.value})}
            rows="3"
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Terms and conditions, payment instructions, etc."
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="internalNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Internal Notes (not visible to customer)
          </label>
          <textarea
            id="internalNotes"
            value={invoice.internalNotes}
            onChange={(e) => setInvoice({...invoice, internalNotes: e.target.value})}
            rows="2"
            className="bg-gray-50 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Notes for your team only..."
          ></textarea>
        </div>
      </div>
    </div>
  );
};

// Main New Invoice Page Component
export default function NewInvoicePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Initialize invoice state with default values
  const [invoice, setInvoice] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    poNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from today
    customer: '',
    paymentTerms: 'net15',
    taxRate: 0,
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    notes: '',
    terms: 'Payment is due within 15 days from the date of invoice. Late payments are subject to a 1.5% monthly finance charge.',
    internalNotes: '',
    loadDetails: {
      loadNumber: '',
      vehicle: '',
      origin: '',
      destination: '',
      shipmentDate: '',
      deliveryDate: '',
      description: ''
    }
  });

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (user) {
          setUser(user);
          // Additional initialization if needed
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

  const handleSaveInvoice = async () => {
    try {
      setSaving(true);
      
      // In a real application, you would save to your database here
      console.log('Saving invoice:', invoice);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success message or redirect
      alert('Invoice saved successfully!');
      // window.location.href = '/dashboard/invoices';
      
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      setSaving(true);
      
      // Save as draft logic
      console.log('Saving invoice as draft:', invoice);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success message or redirect
      alert('Invoice saved as draft!');
      // window.location.href = '/dashboard/invoices';
      
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="invoices" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <div className="flex items-center">
            <Link 
              href="/dashboard/invoices" 
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Create New Invoice</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveAsDraft}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Save as Draft
            </button>
            <button
              onClick={handleSaveInvoice}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Info Alert */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Create a professional invoice by filling out the details below. Required fields are marked with an asterisk (*).
                  </p>
                </div>
              </div>
            </div>
            
            {/* Forms */}
            <InvoiceDetailsForm invoice={invoice} setInvoice={setInvoice} />
            <LoadDetailsForm invoice={invoice} setInvoice={setInvoice} />
            <LineItemsForm invoice={invoice} setInvoice={setInvoice} />
            <NotesAndTermsForm invoice={invoice} setInvoice={setInvoice} />
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center py-4">
              <Link
                href="/dashboard/invoices"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <X size={16} className="mr-2" />
                Cancel
              </Link>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <Download size={16} className="mr-2" />
                  Preview
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  <Send size={16} className="mr-2" />
                  Save & Send
                </button>
                <button
                  onClick={handleSaveInvoice}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}