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
  Edit,
  Send,
  Download,
  Printer,
  CreditCard,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Mail,
  Calendar,
  ArrowRight,
  MapPin,
  Package,
  MoreHorizontal
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

// Status Badge Component
const StatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let icon = null;

  switch (status.toLowerCase()) {
    case 'paid':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle size={14} className="mr-1" />;
      break;
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      icon = <Clock size={14} className="mr-1" />;
      break;
    case 'overdue':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <AlertCircle size={14} className="mr-1" />;
      break;
    case 'draft':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <FileText size={14} className="mr-1" />;
      break;
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

// Actions Dropdown Component
const ActionsDropdown = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'edit', label: 'Edit Invoice', icon: <Edit size={16} className="mr-2" /> },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy size={16} className="mr-2" /> },
    { id: 'send', label: 'Send by Email', icon: <Mail size={16} className="mr-2" /> },
    { id: 'download', label: 'Download PDF', icon: <Download size={16} className="mr-2" /> },
    { id: 'print', label: 'Print', icon: <Printer size={16} className="mr-2" /> },
    { id: 'markPaid', label: 'Mark as Paid', icon: <CheckCircle size={16} className="mr-2" /> },
    { id: 'recordPayment', label: 'Record Payment', icon: <DollarSign size={16} className="mr-2" /> },
  ];

  const handleAction = (actionId) => {
    setIsOpen(false);
    onAction(actionId);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
      >
        <MoreHorizontal size={18} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Payment History Item Component
const PaymentHistoryItem = ({ payment }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
      <div className="flex items-start">
        <div className={`p-2 rounded-full mr-3 ${
          payment.status === 'completed' ? 'bg-green-100 text-green-600' :
          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {payment.method === 'credit_card' ? <CreditCard size={16} /> :
           payment.method === 'bank_transfer' ? <DollarSign size={16} /> :
           payment.method === 'check' ? <FileText size={16} /> :
           <DollarSign size={16} />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{payment.description}</p>
          <p className="text-xs text-gray-500">{payment.date} · {payment.reference}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
        <p className="text-xs text-gray-500">{payment.status}</p>
      </div>
    </div>
  );
};

// Invoice History Item Component
const InvoiceHistoryItem = ({ activity }) => {
  return (
    <div className="flex items-start py-3 border-b border-gray-200 last:border-0">
      <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
        activity.type === 'created' ? 'bg-blue-100 text-blue-600' :
        activity.type === 'sent' ? 'bg-purple-100 text-purple-600' :
        activity.type === 'viewed' ? 'bg-green-100 text-green-600' :
        activity.type === 'paid' ? 'bg-green-100 text-green-600' :
        'bg-gray-100 text-gray-600'
      }`}>
        {activity.type === 'created' ? <FileText size={16} /> :
         activity.type === 'sent' ? <Mail size={16} /> :
         activity.type === 'viewed' ? <ExternalLink size={16} /> :
         activity.type === 'paid' ? <DollarSign size={16} /> :
         <Clock size={16} />
        }
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
        <p className="text-xs text-gray-500">
          {activity.date} · {activity.user}
        </p>
      </div>
    </div>
  );
};

// Invoice Detail Page Component
export default function InvoiceDetailPage({ params }) {
  const invoiceId = params?.id || "1"; // Default to first invoice if not provided
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);

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
          fetchInvoiceData(invoiceId);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, [invoiceId]);

  const fetchInvoiceData = (id) => {
    // Simulate API delay
    setTimeout(() => {
      // Mock invoice data
      const mockInvoice = {
        id: '1',
        invoiceNumber: 'INV-2025-001',
        poNumber: 'PO-12345',
        customer: {
          name: 'ABC Logistics',
          address: '123 Shipping Lane, Chicago, IL 60601',
          email: 'billing@abclogistics.com',
          phone: '(312) 555-1234'
        },
        status: 'Pending',
        date: '2025-03-01',
        dueDate: '2025-03-15',
        subtotal: 2350.00,
        taxRate: 5.00,
        taxAmount: 117.50,
        total: 2467.50,
        amountPaid: 0,
        balance: 2467.50,
        paymentTerms: 'Net 15',
        notes: 'Thanks for your business!',
        terms: 'Payment is due within 15 days from the date of invoice. Late payments are subject to a 1.5% monthly finance charge.',
        loadDetails: {
          loadNumber: 'L-45678',
          origin: 'Detroit, MI',
          destination: 'Chicago, IL',
          distance: '283 miles',
          shipmentDate: '2025-02-28',
          deliveryDate: '2025-03-01',
          description: 'Auto parts - 2 pallets, 1500 lbs'
        },
        items: [
          {
            description: 'Freight charge - Detroit to Chicago',
            quantity: 1,
            unitPrice: 1850.00,
            total: 1850.00
          },
          {
            description: 'Fuel surcharge',
            quantity: 1,
            unitPrice: 350.00,
            total: 350.00
          },
          {
            description: 'Detention (2 hours @ $75/hr)',
            quantity: 2,
            unitPrice: 75.00,
            total: 150.00
          }
        ]
      };
      
      // Mock payment history
      const mockPaymentHistory = [];
      
      // Mock invoice history
      const mockInvoiceHistory = [
        {
          type: 'created',
          description: 'Invoice created',
          date: '2025-03-01 10:23 AM',
          user: 'John Smith'
        },
        {
          type: 'sent',
          description: 'Invoice sent to billing@abclogistics.com',
          date: '2025-03-01 10:30 AM',
          user: 'John Smith'
        },
        {
          type: 'viewed',
          description: 'Invoice viewed by customer',
          date: '2025-03-02 09:15 AM',
          user: 'Client'
        }
      ];
      
      setInvoice(mockInvoice);
      setPaymentHistory(mockPaymentHistory);
      setInvoiceHistory(mockInvoiceHistory);
    }, 500);
  };

  const handleAction = (actionId) => {
    switch(actionId) {
      case 'edit':
        // Navigate to edit page
        console.log('Edit invoice');
        break;
      case 'duplicate':
        console.log('Duplicate invoice');
        break;
      case 'send':
        console.log('Send invoice by email');
        break;
      case 'download':
        console.log('Download invoice PDF');
        break;
      case 'print':
        console.log('Print invoice');
        break;
      case 'markPaid':
        console.log('Mark invoice as paid');
        break;
      case 'recordPayment':
        console.log('Record payment');
        break;
      default:
        console.log(`Action: ${actionId}`);
    }
  };

  if (loading || !invoice) {
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
            <h1 className="text-xl font-semibold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} className="ml-4" />
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href={`/dashboard/invoices/${invoiceId}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <Edit size={16} className="mr-2" />
              Edit
            </Link>
            {invoice.status.toLowerCase() !== 'paid' && (
              <button
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                <DollarSign size={16} className="mr-2" />
                Record Payment
              </button>
            )}
            <button
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <Send size={16} className="mr-2" />
              Send
            </button>
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <Download size={16} className="mr-2" />
              Download
            </button>
            <ActionsDropdown onAction={handleAction} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (Invoice Details) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Invoice Preview */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between">
                      <div>
                        <Image 
                          src="/images/tc-name-tp-bg.png" 
                          alt="Truck Command Logo"
                          width={150}
                          height={50}
                          className="h-10 mb-4"
                        />
                        <p className="text-gray-600 text-sm">Your Company Name</p>
                        <p className="text-gray-600 text-sm">123 Trucking Way</p>
                        <p className="text-gray-600 text-sm">Dallas, TX 75001</p>
                        <p className="text-gray-600 text-sm">Phone: (555) 123-4567</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                        <p className="text-gray-600 text-sm mt-2">Invoice #: {invoice.invoiceNumber}</p>
                        <p className="text-gray-600 text-sm">Date: {invoice.date}</p>
                        <p className="text-gray-600 text-sm">Due Date: {invoice.dueDate}</p>
                        {invoice.poNumber && (
                          <p className="text-gray-600 text-sm">PO #: {invoice.poNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-8">
                      <div>
                        <h3 className="text-gray-600 font-semibold text-sm">BILL TO:</h3>
                        <p className="font-medium text-gray-900">{invoice.customer.name}</p>
                        <p className="text-gray-600 text-sm">{invoice.customer.address}</p>
                        <p className="text-gray-600 text-sm">{invoice.customer.email}</p>
                        <p className="text-gray-600 text-sm">{invoice.customer.phone}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-gray-600 font-semibold text-sm">SHIPMENT INFO:</h3>
                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <span className="font-medium mr-1">Load #:</span> {invoice.loadDetails.loadNumber}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin size={14} className="mr-1 flex-shrink-0" /> 
                          {invoice.loadDetails.origin} → {invoice.loadDetails.destination}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Calendar size={14} className="mr-1 flex-shrink-0" /> 
                          Delivered: {invoice.loadDetails.deliveryDate}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Package size={14} className="mr-1 flex-shrink-0" /> 
                          {invoice.loadDetails.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoice.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ${item.unitPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ${item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <div className="w-64 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                          <span className="text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-200">
                          <span className="font-medium text-gray-900">Total:</span>
                          <span className="font-bold text-gray-900">${invoice.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="text-gray-900">${invoice.amountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-200">
                          <span className="font-medium text-gray-900">Balance Due:</span>
                          <span className="font-bold text-red-600">${invoice.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {invoice.notes && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-gray-600 font-semibold text-sm mb-2">NOTES:</h3>
                        <p className="text-gray-600 text-sm">{invoice.notes}</p>
                      </div>
                    )}
                    
                    {invoice.terms && (
                      <div className="mt-4">
                        <h3 className="text-gray-600 font-semibold text-sm mb-2">TERMS & CONDITIONS:</h3>
                        <p className="text-gray-600 text-sm">{invoice.terms}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (Payment Details & History) */}
              <div className="space-y-6">
                {/* Payment Status */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Payment Status</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium text-gray-900">${invoice.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium text-green-600">${invoice.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="font-medium text-gray-900">Balance Due:</span>
                      <span className="font-bold text-red-600">${invoice.balance.toFixed(2)}</span>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex items-center mb-2">
                        <Clock size={16} className="text-gray-600 mr-2" />
                        <span className="text-sm text-gray-600">Due on {invoice.dueDate}</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle size={16} className="text-gray-600 mr-2" />
                        <span className="text-sm text-gray-600">Payment Terms: {invoice.paymentTerms}</span>
                      </div>
                    </div>
                    
                    {invoice.status.toLowerCase() !== 'paid' && (
                      <button
                        className="w-full mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                      >
                        <DollarSign size={16} className="mr-2" />
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Payment History */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                  </div>
                  <div className="p-6">
                    {paymentHistory.length > 0 ? (
                      <div className="space-y-1">
                        {paymentHistory.map((payment, index) => (
                          <PaymentHistoryItem key={index} payment={payment} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No payments recorded yet.</p>
                    )}
                  </div>
                </div>
                
                {/* Invoice History */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Activity History</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-1">
                      {invoiceHistory.map((activity, index) => (
                        <InvoiceHistoryItem key={index} activity={activity} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}