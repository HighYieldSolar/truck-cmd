"use client";

import { useState, useEffect } from 'react';
import { XCircle, Mail, RefreshCw, Send, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Modal component for emailing invoices to customers
 */
export default function EmailInvoiceModal({ isOpen, onClose, invoice, onSuccess }) {
  const { t } = useTranslation('invoices');
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: '',
    includePdf: true,
    includePaymentLink: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  // Fetch company info on mount
  useEffect(() => {
    async function fetchCompanyInfo() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('company_name, phone')
            .eq('id', user.id)
            .single();
          setCompanyInfo(data);
        }
      } catch (err) {
        // Silently fail - will use defaults
      }
    }
    fetchCompanyInfo();
  }, []);

  // Initialize form data when invoice or company info changes
  useEffect(() => {
    if (invoice) {
      const company = companyInfo?.company_name || 'Your Company';
      const phone = companyInfo?.phone || '';
      // Set default email values based on the invoice
      setFormData({
        to: invoice.customer_email || '',
        cc: '',
        bcc: '',
        subject: `Invoice #${invoice.invoice_number} from ${company}`,
        message: generateDefaultMessage(invoice, company, phone),
        includePdf: true,
        includePaymentLink: false
      });
    }
  }, [invoice, companyInfo]);

  if (!isOpen) return null;

  // Generate default email message based on invoice
  function generateDefaultMessage(invoice, companyName = 'Your Company', phone = '') {
    const amountDue = (invoice.total || 0) - (invoice.amount_paid || 0);
    const dueDate = new Date(invoice.due_date).toLocaleDateString();

    return `Dear ${invoice.customer || 'Customer'},

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
${companyName}${phone ? `\n${phone}` : ''}`;
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!formData.to) {
      setError(t('emailModal.recipientRequired'));
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.to)) {
      setError(t('emailModal.validEmail'));
      return;
    }

    try {
      setLoading(true);

      // Get the current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(t('emailModal.pleaseLogin'));
        return;
      }

      // Send the email via API route
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          to: formData.to,
          cc: formData.cc,
          bcc: formData.bcc,
          subject: formData.subject,
          message: formData.message,
          includePdf: formData.includePdf,
          includePaymentLink: formData.includePaymentLink
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invoice');
      }

      // Show success message
      setSuccessMessage(t('emailModal.sentSuccess'));

      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || t('emailModal.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Mail size={20} className="mr-2 text-blue-600" />
            {t('emailModal.title')}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500"
            disabled={loading}
          >
            <XCircle size={20} />
          </button>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="mx-6 mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Invoice preview */}
          <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
            <div className="flex items-center text-gray-700 text-sm mb-2">
              <FileText size={16} className="mr-2 text-blue-600" />
              <span className="font-medium">{t('emailModal.invoiceNumber', { number: invoice.invoice_number })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-600">{t('emailModal.customer')}: {invoice.customer}</p>
                <p className="text-gray-600">{t('emailModal.date')}: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-900 font-medium">{t('emailModal.total')}: ${invoice.total?.toFixed(2) || "0.00"}</p>
                <p className="text-gray-600">{t('emailModal.due')}: {new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {/* Email form fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailModal.to')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="to"
                name="to"
                value={formData.to}
                onChange={handleChange}
                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                placeholder="customer@example.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emailModal.cc')}
                </label>
                <input
                  type="text"
                  id="cc"
                  name="cc"
                  value={formData.cc}
                  onChange={handleChange}
                  className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="cc@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="bcc" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emailModal.bcc')}
                </label>
                <input
                  type="text"
                  id="bcc"
                  name="bcc"
                  value={formData.bcc}
                  onChange={handleChange}
                  className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="bcc@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailModal.subject')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailModal.message')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows="10"
                value={formData.message}
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
                  checked={formData.includePdf}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includePdf" className="ml-2 block text-sm text-gray-700">
                  {t('emailModal.attachPdf')}
                </label>
              </div>
              
              <div className="flex items-center h-5">
                <input
                  id="includePaymentLink"
                  name="includePaymentLink"
                  type="checkbox"
                  checked={formData.includePaymentLink}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includePaymentLink" className="ml-2 block text-sm text-gray-700">
                  {t('emailModal.includePaymentLink')}
                </label>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              {t('emailModal.cancel')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  {t('emailModal.sending')}
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  {t('emailModal.sendInvoice')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}