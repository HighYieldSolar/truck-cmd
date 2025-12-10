"use client";

import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Package,
  Briefcase,
  Truck,
  Users,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerViewModal({ isOpen, onClose, customer, onEdit }) {
  if (!isOpen || !customer) return null;

  const getTypeIcon = (type) => {
    const typeLower = (type || 'business').toLowerCase();
    switch (typeLower) {
      case 'shipper':
        return Package;
      case 'broker':
        return Briefcase;
      case 'consignee':
        return Truck;
      default:
        return Building2;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || 'active').toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  const formatType = (type) => {
    if (!type) return 'Business';
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const TypeIcon = getTypeIcon(customer.customer_type);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/70"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <TypeIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{customer.company_name}</h2>
                    <p className="text-blue-100 text-sm mt-0.5">
                      {formatType(customer.customer_type)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
                  {customer.status || 'Active'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Customer since {formatDate(customer.created_at)}
                </span>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User size={18} className="text-blue-500" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {customer.contact_name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    {customer.email ? (
                      <a
                        href={`mailto:${customer.email}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline mt-0.5 flex items-center gap-1"
                      >
                        <Mail size={14} />
                        {customer.email}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    {customer.phone ? (
                      <a
                        href={`tel:${customer.phone}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline mt-0.5 flex items-center gap-1"
                      >
                        <Phone size={14} />
                        {customer.phone}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-500" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {customer.address || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">City</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {customer.city || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">State</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {customer.state || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ZIP Code</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {customer.zip || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {customer.notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    Notes
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(customer);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Edit size={16} />
                    Edit Customer
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
