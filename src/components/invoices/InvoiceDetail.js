"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { getInvoiceById, updateInvoiceStatus, recordPayment, deleteInvoice, emailInvoice } from "@/lib/services/invoiceService";
import { subscribeToInvoices } from "@/lib/supabaseRealtime";

import {
  ChevronLeft,
  Edit,
  Download,
  Send,
  Printer,
  MoreHorizontal,
  FileText,
  Mail,
  Calendar,
  MapPin,
  ArrowRight,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Package,
  RefreshCw,
  XCircle
} from "lucide-react";

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
         activity.type === 'viewed' ? <FileText size={16} /> :
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

// Actions Dropdown Component
const ActionsDropdown = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'edit', label: 'Edit Invoice', icon: <Edit size={16} className="mr-2" /> },
    { id: 'duplicate', label: 'Duplicate', icon: <FileText size={16} className="mr-2" /> },
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

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, onSubmit, invoice, isSubmitting }) => {
  const [payment, setPayment] = useState({
    amount: invoice?.balance || 0,
    method: 'credit_card',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && invoice) {
      setPayment(prevPayment => ({
        ...prevPayment,
        amount: invoice.balance || 0
      }));
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayment({ ...payment, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(payment);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircle size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={16} className="text-gray-400" />
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                max={invoice?.balance || 0}
                value={payment.amount}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Invoice balance: ${invoice?.balance?.toFixed(2)}
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="method"
              name="method"
              value={payment.method}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={payment.date}
              onChange={handleChange}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={payment.reference}
              onChange={handleChange}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Optional"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={payment.notes}
              onChange={handleChange}
              rows="2"
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Optional payment notes"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Email Modal Component
const EmailInvoiceModal = ({ isOpen, onClose, onSend, invoice, isSubmitting }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: '',
    includePdf: true,
    includePaymentLink: true
  });

  useEffect(() => {
    if (isOpen && invoice) {
      setEmailData({
        to: invoice.customer_email || '',
        cc: '',
        bcc: '',
        subject: `Invoice #${invoice.invoice_number} from Your Company`,
        message: generateDefaultMessage(invoice),
        includePdf: true,
        includePaymentLink: true
      });
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  // Generate a default email message
  function generateDefaultMessage(invoice) {
    const amountDue = (invoice.total || 0) - (invoice.amount_paid || 0);
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    
    return `Dear ${invoice.customer},

Please find attached invoice #${invoice.invoice_number} in the amount of $${amountDue.toFixed(2)}.

This invoice is due on ${dueDate}. Please remit payment at your earliest convenience.

Summary:
- Invoice Number: ${invoice.invoice_number}
- Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
- Due Date: ${dueDate}
- Amount Due: $${amountDue.toFixed(2)}

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
Your Company Name
(555) 123-4567`;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(emailData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Mail size={20} className="mr-2 text-blue-600" />
            Send Invoice by Email
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircle size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                To <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="to"
                name="to"
                value={emailData.to}
                onChange={handleChange}
                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                placeholder="customer@example.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
                  CC
                </label>
                <input
                  type="text"
                  id="cc"
                  name="cc"
                  value={emailData.cc}
                  onChange={handleChange}
                  className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="cc@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="bcc" className="block text-sm font-medium text-gray-700 mb-1">
                  BCC
                </label>
                <input
                  type="text"
                  id="bcc"
                  name="bcc"
                  value={emailData.bcc}
                  onChange={handleChange}
                  className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="bcc@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={emailData.subject}
                onChange={handleChange}
                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows="10"
                value={emailData.message}
                onChange={handleChange}
                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                required
              ></textarea>
            </div>
            
            <div className="flex items-start space-x-6">
              <div className="flex items-center h-5">
                <input
                  id="includePdf"
                  name="includePdf"
                  type="checkbox"
                  checked={emailData.includePdf}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includePdf" className="ml-2 block text-sm text-gray-700">
                  Attach PDF invoice
                </label>
              </div>
              
              <div className="flex items-center h-5">
                <input
                  id="includePaymentLink"
                  name="includePaymentLink"
                  type="checkbox"
                  checked={emailData.includePaymentLink}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includePaymentLink" className="ml-2 block text-sm text-gray-700">
                  Include payment link
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Invoice Detail Component
export default function InvoiceDetail({ invoiceId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch user and invoice data
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Get invoice details
        const invoiceData = await getInvoiceById(invoiceId);
        
        if (!invoiceData) {
          setError("Invoice not found");
          setLoading(false);
          return;
        }
        
        setInvoice(invoiceData);
        
        // Get payment history from Supabase
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('date', { ascending: false });
          
        if (paymentsError) throw paymentsError;
        
        setPaymentHistory(payments || []);
        
        // Get invoice activity history
        // First, set the creation activity
        setInvoiceHistory([
          {
            type: 'created',
            description: 'Invoice created',
            date: new Date(invoiceData.created_at).toLocaleString(),
            user: 'You'
          }
        ]);
        
        // Then fetch additional activities if available
        const { data: activities, error: activitiesError } = await supabase
          .from('invoice_activities')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('created_at', { ascending: false });
          
        if (!activitiesError && activities) {
          const formattedActivities = activities.map(activity => ({
            type: activity.activity_type,
            description: activity.description,
            date: new Date(activity.created_at).toLocaleString(),
            user: activity.user_name || 'System'
          }));
          
          setInvoiceHistory([...formattedActivities, ...invoiceHistory]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice data");
        setLoading(false);
      }
    }
    
    const initialize = useCallback(() => {
      // Code that uses invoiceHistory
      // ...
    }, [invoiceHistory, /* other dependencies */]);
    
    useEffect(() => {
      if (invoiceId) {
        initialize();
      }
    }, [invoiceId, initialize]); // Now correctly includes initialize

  // Set up real-time subscription for this invoice
  useEffect(() => {
    if (user && invoiceId) {
      const channel = supabase
        .channel(`invoice-${invoiceId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'invoices',
            filter: `id=eq.${invoiceId}`
          },
          async (payload) => {
            // Refresh invoice data
            const invoiceData = await getInvoiceById(invoiceId);
            if (invoiceData) {
              setInvoice(invoiceData);
            }
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'payments',
            filter: `invoice_id=eq.${invoiceId}`
          },
          async () => {
            // Refresh payment history
            const { data } = await supabase
              .from('payments')
              .select('*')
              .eq('invoice_id', invoiceId)
              .order('date', { ascending: false });
              
            if (data) {
              setPaymentHistory(data);
            }
          }
        )
        .subscribe();
      
      // Clean up subscription when component unmounts
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, invoiceId]);

  const handleAction = async (actionId) => {
    try {
      switch (actionId) {
        case 'edit':
          router.push(`/dashboard/invoices/${invoiceId}/edit`);
          break;
        case 'markPaid':
          await updateInvoiceStatus(invoiceId, 'Paid');
          
          // Add to invoice history - using functional update to avoid dependency issue
          const newActivity = {
            type: 'paid',
            description: 'Invoice marked as paid',
            date: new Date().toLocaleString(),
            user: 'You'
          };
          
          setInvoiceHistory(prevHistory => [newActivity, ...prevHistory]);
          break;
        case 'recordPayment':
          setPaymentModalOpen(true);
          break;
        case 'send':
          setEmailModalOpen(true);
          break;
        case 'download':
          // PDF download handled by PDF generator
          break;
        case 'print':
          window.print();
          break;
        case 'duplicate':
          // Create a duplicate invoice
          if (invoice) {
            router.push(`/dashboard/invoices/new?duplicate=${invoiceId}`);
          }
          break;
        default:
          console.log(`Action: ${actionId}`);
      }
    } catch (err) {
      console.error(`Error performing action ${actionId}:`, err);
      setError(`Failed to ${actionId} invoice. Please try again.`);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      setSubmitting(true);
      
      // Format the payment data
      const formattedPayment = {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        date: paymentData.date,
        reference: paymentData.reference,
        notes: paymentData.notes,
        description: `Payment for invoice ${invoice.invoice_number}`,
        status: 'completed'
      };
      
      // Record the payment
      await recordPayment(invoiceId, formattedPayment);
      
      // Update is handled by real-time subscription
      
      // Add to invoice history
      const newActivity = {
        type: 'paid',
        description: `Payment of ${formattedPayment.amount.toFixed(2)} recorded`,
        date: new Date().toLocaleString(),
        user: 'You'
      };
      
      setInvoiceHistory([newActivity, ...invoiceHistory]);
      
      // Record activity in database
      await supabase
        .from('invoice_activities')
        .insert([{
          invoice_id: invoiceId,
          activity_type: 'payment',
          description: `Payment of ${formattedPayment.amount.toFixed(2)} recorded`,
          user_id: user.id,
          user_name: user.email
        }]);
      
      // Close modal
      setPaymentModalOpen(false);
    } catch (err) {
      console.error("Error recording payment:", err);
      setError("Failed to record payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendEmail = async (emailData) => {
    try {
      setSubmitting(true);
      
      // Send the email
      await emailInvoice(invoiceId, emailData);
      
      // Update status to 'Sent' if not already paid
      if (invoice.status.toLowerCase() !== 'paid') {
        await updateInvoiceStatus(invoiceId, 'Sent');
      }
      
      // Add to invoice history - using functional update to avoid dependency issue
      const newActivity = {
        type: 'sent',
        description: `Invoice emailed to ${emailData.to}`,
        date: new Date().toLocaleString(),
        user: 'You'
      };
      
      setInvoiceHistory(prevHistory => [newActivity, ...prevHistory]);
      
      // Record activity in database
      await supabase
        .from('invoice_activities')
        .insert([{
          invoice_id: invoiceId,
          activity_type: 'email',
          description: `Invoice emailed to ${emailData.to}`,
          user_id: user.id,
          user_name: user.email
        }]);
      
      // Close modal
      setEmailModalOpen(false);
    } catch (err) {
      console.error("Error sending email:", err);
      setError("Failed to send email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft size={16} className="mr-2" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h2>
        <p className="text-gray-600 mb-6">The invoice you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ChevronLeft size={16} className="mr-2" />
          Back to Invoices
        </Link>
      </div>
    );
  }

  // Calculate invoice properties
  const amountPaid = parseFloat(invoice.amount_paid) || 0;
  const total = parseFloat(invoice.total) || 0;
  const balance = total - amountPaid;
  const isPaid = invoice.status.toLowerCase() === 'paid';

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Link 
            href="/dashboard/invoices" 
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="text-gray-600 mt-1">
              Created on {new Date(invoice.invoice_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <InvoiceStatusBadge status={invoice.status} size="lg" />
          
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/invoices/${invoiceId}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit size={16} className="mr-2" />
              Edit
            </Link>
            {!isPaid && (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <DollarSign size={16} className="mr-2" />
                Record Payment
              </button>
            )}
            <button
              onClick={() => setEmailModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Send size={16} className="mr-2" />
              Send
            </button>
            <button
              onClick={() => handleAction('download')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download size={16} className="mr-2" />
              Download
            </button>
            <ActionsDropdown onAction={handleAction} />
          </div>
        </div>
      </div>

      {/* Error display */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Invoice Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Preview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between flex-wrap">
                <div className="mb-6 md:mb-0">
                  <div className="h-10 w-32 bg-gray-200 rounded mb-4"></div>
                  <p className="text-gray-600 text-sm">Your Company Name</p>
                  <p className="text-gray-600 text-sm">123 Trucking Way</p>
                  <p className="text-gray-600 text-sm">Dallas, TX 75001</p>
                  <p className="text-gray-600 text-sm">Phone: (555) 123-4567</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  <p className="text-gray-600 text-sm mt-2">Invoice #: {invoice.invoice_number}</p>
                  <p className="text-gray-600 text-sm">Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                  <p className="text-gray-600 text-sm">Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
                  {invoice.po_number && (
                    <p className="text-gray-600 text-sm">PO #: {invoice.po_number}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between flex-wrap mt-8">
                <div>
                  <h3 className="text-gray-600 font-semibold text-sm">BILL TO:</h3>
                  <p className="font-medium text-gray-900">{invoice.customer}</p>
                  {invoice.customer_address && (
                    <p className="text-gray-600 text-sm">{invoice.customer_address}</p>
                  )}
                </div>
                
                {invoice.loads && invoice.loads.length > 0 && (
                  <div>
                    <h3 className="text-gray-600 font-semibold text-sm">SHIPMENT INFO:</h3>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <span className="font-medium mr-1">Load #:</span> {invoice.loads[0].load_number}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin size={14} className="mr-1 flex-shrink-0" /> 
                      {invoice.loads[0].origin} → {invoice.loads[0].destination}
                    </div>
                  </div>
                )}
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
                    {invoice.items && invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${(item.quantity * item.unit_price).toFixed(2)}
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
                    <span className="text-gray-900">${invoice.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({invoice.tax_rate || 0}%):</span>
                    <span className="text-gray-900">${invoice.tax_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Total:</span>
                    <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-gray-900">${amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Balance Due:</span>
                    <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${balance.toFixed(2)}
                    </span>
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
                <span className="font-medium text-gray-900">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-green-600">${amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-900">Balance Due:</span>
                <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${balance.toFixed(2)}
                </span>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center mb-2">
                  <Clock size={16} className="text-gray-600 mr-2" />
                  <span className="text-sm text-gray-600">Due on {new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-gray-600 mr-2" />
                  <span className="text-sm text-gray-600">Payment Terms: {invoice.payment_terms || 'Net 15'}</span>
                </div>
              </div>
              
              {!isPaid && balance > 0 && (
                <button
                  onClick={() => setPaymentModalOpen(true)}
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleRecordPayment}
        invoice={{ ...invoice, balance }}
        isSubmitting={submitting}
      />

      {/* Email Modal */}
      <EmailInvoiceModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
        invoice={invoice}
        isSubmitting={submitting}
      />
    </div>
  );
}
