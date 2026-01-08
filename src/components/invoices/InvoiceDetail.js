// src/components/invoices/InvoiceDetail.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { getInvoiceById, updateInvoiceStatus, recordPayment, deleteInvoice, emailInvoice } from "@/lib/services/invoiceService";
import InvoicePdfGenerator from "@/components/invoices/InvoicePdfGenerator";
import PaymentModal from "@/components/invoices/PaymentModal";
import { useTranslation } from "@/context/LanguageContext";

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
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex items-start">
        <div className={`p-2 rounded-full mr-3 ${
          payment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
          payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400' :
          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {payment.method === 'credit_card' ? <CreditCard size={16} /> :
           payment.method === 'bank_transfer' ? <DollarSign size={16} /> :
           payment.method === 'check' ? <FileText size={16} /> :
           <DollarSign size={16} />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{payment.description}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{payment.date} · {payment.reference || 'No reference'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">${parseFloat(payment.amount).toFixed(2)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{payment.status}</p>
      </div>
    </div>
  );
};

// Invoice History Item Component
const InvoiceHistoryItem = ({ activity }) => {
  return (
    <div className="flex items-start py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
        activity.type === 'created' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' :
        activity.type === 'sent' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' :
        activity.type === 'viewed' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
        activity.type === 'paid' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}>
        {activity.type === 'created' ? <FileText size={16} /> :
         activity.type === 'sent' ? <Mail size={16} /> :
         activity.type === 'viewed' ? <FileText size={16} /> :
         activity.type === 'paid' ? <DollarSign size={16} /> :
         <Clock size={16} />
        }
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {activity.date} · {activity.user}
        </p>
      </div>
    </div>
  );
};

// Actions Dropdown Component
const ActionsDropdown = ({ onAction, isPaid, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter out payment options if invoice is already paid
  const allActions = [
    { id: 'edit', label: t('detail.actions.editInvoice'), icon: <Edit size={16} className="mr-2" /> },
    { id: 'duplicate', label: t('detail.actions.duplicate'), icon: <FileText size={16} className="mr-2" /> },
    { id: 'send', label: t('detail.actions.sendByEmail'), icon: <Mail size={16} className="mr-2" /> },
    { id: 'download', label: t('detail.actions.downloadPdf'), icon: <Download size={16} className="mr-2" /> },
    { id: 'print', label: t('detail.actions.print'), icon: <Printer size={16} className="mr-2" /> },
    { id: 'markPaid', label: t('detail.actions.markAsPaid'), icon: <CheckCircle size={16} className="mr-2" />, hideWhenPaid: true },
    { id: 'recordPayment', label: t('detail.actions.recordPayment'), icon: <DollarSign size={16} className="mr-2" />, hideWhenPaid: true },
  ];

  const actions = isPaid
    ? allActions.filter(action => !action.hideWhenPaid)
    : allActions;

  const handleAction = (actionId) => {
    setIsOpen(false);
    onAction(actionId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
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

// Email Modal Component
const EmailInvoiceModal = ({ isOpen, onClose, onSend, invoice, isSubmitting, companyInfo, t }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: '',
    includePdf: true,
    includePaymentLink: true
  });
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');

  // Email templates
  const templates = {
    professional: {
      name: t('detail.emailModal.templates.professional.name'),
      description: t('detail.emailModal.templates.professional.description'),
      generate: (inv, company) => {
        const amountDue = (inv.total || 0) - (inv.amount_paid || 0);
        const dueDate = new Date(inv.due_date).toLocaleDateString();
        const companyName = company?.name || 'Your Company';
        const companyPhone = company?.phone || '';
        return `Dear ${inv.customer},

Please find attached invoice #${inv.invoice_number} for $${amountDue.toFixed(2)}.

Payment Details:
• Invoice Number: ${inv.invoice_number}
• Invoice Date: ${new Date(inv.invoice_date).toLocaleDateString()}
• Due Date: ${dueDate}
• Amount Due: $${amountDue.toFixed(2)}

Payment is due by ${dueDate}. Please don't hesitate to contact us if you have any questions.

Thank you for your business.

Best regards,
${companyName}${companyPhone ? `\n${companyPhone}` : ''}`;
      }
    },
    friendly: {
      name: t('detail.emailModal.templates.friendly.name'),
      description: t('detail.emailModal.templates.friendly.description'),
      generate: (inv, company) => {
        const amountDue = (inv.total || 0) - (inv.amount_paid || 0);
        const dueDate = new Date(inv.due_date).toLocaleDateString();
        const companyName = company?.name || 'Your Company';
        return `Hi ${inv.customer.split(' ')[0]},

Hope you're doing well! I've attached invoice #${inv.invoice_number} for $${amountDue.toFixed(2)}.

Just a quick reminder that payment is due by ${dueDate}. Let me know if you have any questions!

Thanks so much,
${companyName}`;
      }
    },
    reminder: {
      name: t('detail.emailModal.templates.reminder.name'),
      description: t('detail.emailModal.templates.reminder.description'),
      generate: (inv, company) => {
        const amountDue = (inv.total || 0) - (inv.amount_paid || 0);
        const dueDate = new Date(inv.due_date).toLocaleDateString();
        const companyName = company?.name || 'Your Company';
        const companyPhone = company?.phone || '';
        return `Dear ${inv.customer},

This is a friendly reminder regarding invoice #${inv.invoice_number} for $${amountDue.toFixed(2)}, which ${new Date(inv.due_date) < new Date() ? 'was due on' : 'is due on'} ${dueDate}.

If you've already sent payment, please disregard this message. Otherwise, we kindly request that you process this payment at your earliest convenience.

If you have any questions or concerns about this invoice, please don't hesitate to reach out.

Thank you,
${companyName}${companyPhone ? `\n${companyPhone}` : ''}`;
      }
    }
  };

  useEffect(() => {
    if (isOpen && invoice) {
      const template = templates[selectedTemplate];
      setEmailData({
        to: invoice.customer_email || '',
        cc: '',
        bcc: '',
        subject: `Invoice #${invoice.invoice_number} from ${companyInfo?.name || 'Your Company'}`,
        message: template.generate(invoice, companyInfo),
        includePdf: true,
        includePaymentLink: true
      });
    }
  }, [isOpen, invoice, companyInfo, selectedTemplate]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = templates[templateKey];
    setEmailData(prev => ({
      ...prev,
      message: template.generate(invoice, companyInfo)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(emailData);
  };

  const amountDue = (invoice.total || 0) - (invoice.amount_paid || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center">
                <Mail size={22} className="mr-3" />
                {t('detail.emailModal.title')}
              </h2>
              <p className="text-blue-100 text-sm mt-1">{t('detail.emailModal.compose')} #{invoice.invoice_number}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XCircle size={22} />
            </button>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                <FileText size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('detail.emailModal.invoiceFor')}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.customer}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('detail.emailModal.amount')}</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">${amountDue.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('detail.emailModal.dueDate')}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Recipient Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="to" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('detail.emailModal.recipient')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  {showCcBcc ? t('detail.emailModal.hideCcBcc') : t('detail.emailModal.addCcBcc')}
                </button>
              </div>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="to"
                  name="to"
                  value={emailData.to}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-shadow"
                  placeholder="customer@example.com"
                  required
                />
              </div>

              {showCcBcc && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label htmlFor="cc" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CC</label>
                    <input
                      type="text"
                      id="cc"
                      name="cc"
                      value={emailData.cc}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="cc@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="bcc" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">BCC</label>
                    <input
                      type="text"
                      id="bcc"
                      name="bcc"
                      value={emailData.bcc}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="bcc@example.com"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('detail.emailModal.subjectLine')}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={emailData.subject}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-shadow"
                required
              />
            </div>

            {/* Email Templates */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('detail.emailModal.emailTemplate')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(templates).map(([key, template]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTemplateChange(key)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <p className={`text-sm font-medium ${selectedTemplate === key ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('detail.emailModal.message')}
              </label>
              <textarea
                id="message"
                name="message"
                rows="8"
                value={emailData.message}
                onChange={handleChange}
                className="block w-full px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-shadow font-mono"
                required
              ></textarea>
            </div>

            {/* Attachment Options */}
            <div className="flex flex-wrap gap-4 pt-2">
              <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                emailData.includePdf
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300'
              }`}>
                <input
                  id="includePdf"
                  name="includePdf"
                  type="checkbox"
                  checked={emailData.includePdf}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`p-2 rounded-lg mr-3 ${emailData.includePdf ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-600'}`}>
                  <FileText size={18} className={emailData.includePdf ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${emailData.includePdf ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('detail.emailModal.attachPdf')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('detail.emailModal.attachPdfDesc')}</p>
                </div>
                {emailData.includePdf && (
                  <CheckCircle size={20} className="ml-auto text-blue-500" />
                )}
              </label>

              <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                emailData.includePaymentLink
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300'
              }`}>
                <input
                  id="includePaymentLink"
                  name="includePaymentLink"
                  type="checkbox"
                  checked={emailData.includePaymentLink}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`p-2 rounded-lg mr-3 ${emailData.includePaymentLink ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-600'}`}>
                  <CreditCard size={18} className={emailData.includePaymentLink ? 'text-green-600 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${emailData.includePaymentLink ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t('detail.emailModal.includePaymentLink')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('detail.emailModal.includePaymentLinkDesc')}</p>
                </div>
                {emailData.includePaymentLink && (
                  <CheckCircle size={20} className="ml-auto text-green-500" />
                )}
              </label>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('detail.emailModal.emailFromAccount')}
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              {t('detail.emailModal.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  {t('detail.emailModal.sending')}
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  {t('detail.emailModal.sendInvoice')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Main InvoiceDetail Component - Part 3

// Main Invoice Detail Component
export default function InvoiceDetail({ invoiceId }) {
  const { t } = useTranslation('invoices');
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
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  });

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
          router.push('/login');
          return;
        }
        
        setUser(user);

        // Fetch user profile/company info for invoice display
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('company_name, address, city, state, zip, phone')
          .eq('id', user.id)
          .single();

        if (!profileError && userData) {
          // Format phone number for display
          const formatPhone = (phone) => {
            if (!phone) return '';
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 10) {
              return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            }
            return phone;
          };

          setCompanyInfo({
            name: userData.company_name || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zip: userData.zip || '',
            phone: formatPhone(userData.phone)
          });
        }

        // Get invoice details
        const invoiceData = await getInvoiceById(invoiceId);
        
        if (!invoiceData) {
          setError(t('detail.invoiceNotFound'));
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
        const initialHistory = [{
          type: 'created',
          description: 'Invoice created',
          date: new Date(invoiceData.created_at).toLocaleString(),
          user: 'You'
        }];
        
        setInvoiceHistory(initialHistory);
        
        // Then fetch additional activities if available
        const { data: activities, error: activitiesError } = await supabase
          .from('invoice_activities')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('created_at', { ascending: false });
          
        if (!activitiesError && activities && activities.length > 0) {
          const formattedActivities = activities.map(activity => ({
            type: activity.activity_type,
            description: activity.description,
            date: new Date(activity.created_at).toLocaleString(),
            user: activity.user_name || 'System'
          }));
          
          setInvoiceHistory([...formattedActivities, ...initialHistory]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(t('detail.failedToLoad'));
        setLoading(false);
      }
    }
    
    if (invoiceId) {
      initialize();
    }
  }, [invoiceId, router]);

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
          // Calculate remaining balance to pay
          const total = parseFloat(invoice.total) || 0;
          const amountPaid = parseFloat(invoice.amount_paid) || 0;
          const remainingBalance = total - amountPaid;

          // Only record a payment if there's an outstanding balance
          if (remainingBalance > 0) {
            // Create payment data for the remaining balance
            const paymentData = {
              amount: remainingBalance,
              method: 'manual',
              date: new Date().toISOString().split('T')[0],
              reference: 'Marked as paid',
              description: `Payment for invoice ${invoice.invoice_number}`,
              status: 'completed'
            };

            // Record the payment (this will also update the status)
            await recordPayment(invoiceId, paymentData);
          } else {
            // If already paid, just update the status
            await updateInvoiceStatus(invoiceId, 'Paid');
          }

          // Force refresh of stats by setting a session flag
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('dashboard-refresh-needed', 'true');
          }

          // Redirect to invoices list
          router.push('/dashboard/invoices');
          break;
        case 'recordPayment':
          setPaymentModalOpen(true);
          break;
        case 'send':
          setEmailModalOpen(true);
          break;
        case 'download':
          // PDF download will be handled by the InvoicePdfGenerator component
          document.getElementById('download-invoice-btn').click();
          break;
        case 'print':
          // Print the invoice PDF
          document.getElementById('print-invoice-btn').click();
          break;
        case 'duplicate':
          // Create a duplicate invoice
          if (invoice) {
            router.push(`/dashboard/invoices/new?duplicate=${invoiceId}`);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      setError(t('detail.failedToAction', { action: actionId }));
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

      // Record the payment (this also records the activity in the service)
      await recordPayment(invoiceId, formattedPayment);

      // Force refresh of stats
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dashboard-refresh-needed', 'true');
      }

      // Close modal first
      setPaymentModalOpen(false);

      // Refresh invoice data from database to get updated status and amounts
      const refreshedInvoice = await getInvoiceById(invoiceId);
      if (refreshedInvoice) {
        setInvoice(refreshedInvoice);
      }

      // Refresh payment history from database
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('date', { ascending: false });

      if (payments) {
        setPaymentHistory(payments);
      }

      // Refresh activity history from database
      const { data: activities } = await supabase
        .from('invoice_activities')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (activities && activities.length > 0) {
        const formattedActivities = activities.map(activity => ({
          type: activity.activity_type,
          description: activity.description,
          date: new Date(activity.created_at).toLocaleString(),
          user: activity.user_name || 'System'
        }));

        // Add the initial creation activity
        const initialHistory = [{
          type: 'created',
          description: 'Invoice created',
          date: new Date(refreshedInvoice?.created_at || invoice.created_at).toLocaleString(),
          user: 'You'
        }];

        setInvoiceHistory([...formattedActivities, ...initialHistory]);
      }

    } catch (err) {
      setError(t('messages.failedToSend'));
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
      
      // Add to invoice history
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
      setError(t('email.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronLeft size={16} className="mr-2" />
            {t('detail.backToInvoices')}
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('detail.invoiceNotFound')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('detail.invoiceNotFoundDesc')}</p>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <ChevronLeft size={16} className="mr-2" />
          {t('detail.backToInvoices')}
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
    <div className="max-w-7xl mx-auto">
      {/* Header with Blue Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Link
              href="/dashboard/invoices"
              className="mr-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-xl mr-4">
                <FileText size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {t('title')} {invoice.invoice_number}
                </h1>
                <p className="text-blue-100">
                  {t('detail.createdOn')} {new Date(invoice.invoice_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} size="lg" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 mb-6">
        <Link
          href={`/dashboard/invoices/${invoiceId}/edit`}
          className="inline-flex items-center px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
        >
          <Edit size={18} className="mr-1.5 sm:mr-2" />
          {t('detail.edit')}
        </Link>
        {!isPaid && (
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="inline-flex items-center px-3 sm:px-4 py-2.5 sm:py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors min-h-[44px]"
          >
            <DollarSign size={18} className="mr-1.5 sm:mr-2" />
            {t('detail.recordPayment')}
          </button>
        )}
        <button
          onClick={() => setEmailModalOpen(true)}
          className="inline-flex items-center px-3 sm:px-4 py-2.5 sm:py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          <Send size={18} className="mr-1.5 sm:mr-2" />
          {t('detail.send')}
        </button>
        {/* Hidden buttons for PDF generator to target */}
        <div className="hidden">
          <InvoicePdfGenerator
            invoice={invoice}
            companyInfo={companyInfo}
            id="download-invoice-btn"
            mode="download"
          />
          <InvoicePdfGenerator
            invoice={invoice}
            companyInfo={companyInfo}
            id="print-invoice-btn"
            mode="print"
          />
        </div>
        <button
          onClick={() => handleAction('download')}
          className="inline-flex items-center px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
        >
          <Download size={18} className="mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">{t('detail.download')}</span>
          <span className="sm:hidden">{t('detail.pdf')}</span>
        </button>
        <ActionsDropdown onAction={handleAction} isPaid={isPaid} t={t} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Invoice Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between flex-wrap">
                <div className="mb-6 md:mb-0">
                  <div className="h-10 w-32 bg-blue-600 dark:bg-blue-500 rounded-lg mb-4 flex items-center justify-center">
                    <Truck size={24} className="text-white" />
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">
                    {companyInfo.name || 'Your Company Name'}
                  </p>
                  {companyInfo.address && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{companyInfo.address}</p>
                  )}
                  {(companyInfo.city || companyInfo.state || companyInfo.zip) && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {[companyInfo.city, companyInfo.state].filter(Boolean).join(', ')} {companyInfo.zip}
                    </p>
                  )}
                  {companyInfo.phone && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Phone: {companyInfo.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('detail.invoice')}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{t('detail.invoiceNumber')} <span className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoice_number}</span></p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('detail.date')} <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(invoice.invoice_date).toLocaleDateString()}</span></p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('detail.dueDate')} <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(invoice.due_date).toLocaleDateString()}</span></p>
                  {invoice.po_number && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{t('detail.poNumber')} <span className="font-medium text-gray-900 dark:text-gray-100">{invoice.po_number}</span></p>
                  )}
                </div>
              </div>

              <div className="flex justify-between flex-wrap mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">{t('detail.billTo')}</h3>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.customer}</p>
                  {invoice.customer_address && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line mt-1">{invoice.customer_address}</p>
                  )}
                </div>

                {invoice.loads && invoice.loads.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mt-4 md:mt-0">
                    <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">{t('detail.shipmentInfo')}</h3>
                    <div className="flex items-center text-gray-900 dark:text-gray-100 text-sm">
                      <Package size={14} className="mr-2 text-blue-500" />
                      <span className="font-medium">{t('detail.loadNumber')}</span>
                      <span className="ml-1">{invoice.loads[0].load_number}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1">
                      <MapPin size={14} className="mr-2 text-green-500 flex-shrink-0" />
                      {invoice.loads[0].origin}
                      <ArrowRight size={12} className="mx-2" />
                      {invoice.loads[0].destination}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('fields.description')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('detail.qty')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('detail.unitPrice')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('detail.total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {invoice.items && invoice.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">
                          {item.description}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-72 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('detail.subtotal')}</span>
                    <span className="text-gray-900 dark:text-gray-100">${invoice.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('detail.tax', { rate: invoice.tax_rate || 0 })}</span>
                    <span className="text-gray-900 dark:text-gray-100">${invoice.tax_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{t('fields.total')}:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('detail.amountPaid')}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">${amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{t('detail.balanceDue')}</span>
                    <span className={`font-bold text-lg ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      ${balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">{t('detail.notes')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">{invoice.notes}</p>
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">{t('detail.termsConditions')}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  {invoice.payment_terms === 'Due on Receipt'
                    ? 'Payment is due upon receipt of this invoice.'
                    : invoice.payment_terms === 'Net 7'
                    ? 'Payment is due within 7 days of invoice date.'
                    : invoice.payment_terms === 'Net 15'
                    ? 'Payment is due within 15 days of invoice date.'
                    : invoice.payment_terms === 'Net 30'
                    ? 'Payment is due within 30 days of invoice date.'
                    : invoice.payment_terms === 'Net 60'
                    ? 'Payment is due within 60 days of invoice date.'
                    : invoice.terms || 'Payment is due within 15 days of invoice date.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Payment Details & History) */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <CreditCard size={18} className="mr-2 text-blue-500" />
                {t('detail.paymentStatus')}
              </h3>
            </div>
            <div className="p-6">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600 dark:text-gray-400">{t('detail.totalAmount')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-gray-600 dark:text-gray-400">{t('detail.amountPaid')}</span>
                <span className="font-medium text-green-600 dark:text-green-400">${amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{t('detail.balanceDue')}</span>
                <span className={`font-bold text-lg ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  ${balance.toFixed(2)}
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Clock size={16} className="text-orange-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('detail.dueOn')} {new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <CheckCircle size={16} className="text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('detail.paymentTermsLabel')} {invoice.payment_terms || 'Net 15'}</span>
                </div>
              </div>

              {!isPaid && balance > 0 && (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full mt-6 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
                >
                  <DollarSign size={16} className="mr-2" />
                  {t('detail.recordPayment')}
                </button>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <DollarSign size={18} className="mr-2 text-green-500" />
                {t('detail.paymentHistory')}
              </h3>
              {paymentHistory.length > 5 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {paymentHistory.length} {t('detail.payments')}
                </span>
              )}
            </div>
            <div className="p-6">
              {paymentHistory.length > 0 ? (
                <div className="space-y-1 max-h-[320px] overflow-y-auto pr-2">
                  {paymentHistory.map((payment, index) => (
                    <PaymentHistoryItem key={index} payment={payment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full inline-block mb-3">
                    <DollarSign size={24} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('detail.noPaymentsYet')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Clock size={18} className="mr-2 text-purple-500" />
                {t('detail.activityHistory')}
              </h3>
              {invoiceHistory.length > 5 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {invoiceHistory.length} {t('detail.activities')}
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-2">
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
        companyInfo={companyInfo}
        t={t}
      />
    </div>
  );
}