/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ChevronLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  IdCard,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  AlertCircle,
  FileText,
  DollarSign,
  UserCircle
} from "lucide-react";
import { getDriverById, deleteDriver, checkDriverDocumentStatus } from "@/lib/services/driverService";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import { OperationMessage } from "@/components/ui/OperationMessage";
import DriverFormModal from "@/components/fleet/DriverFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6">
        <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-96"></div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverDetailPage({ driverId }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Related data
  const [recentLoads, setRecentLoads] = useState([]);
  const [loadStats, setLoadStats] = useState({ total: 0, completed: 0, revenue: 0 });

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load driver data
  const loadDriverData = useCallback(async (userId) => {
    try {
      setLoading(true);

      // Get driver details
      const driverData = await getDriverById(driverId);

      if (!driverData) {
        setMessage({ type: 'error', text: 'Driver not found' });
        setLoading(false);
        return;
      }

      // Verify ownership
      if (driverData.user_id !== userId) {
        setMessage({ type: 'error', text: 'Access denied' });
        setLoading(false);
        return;
      }

      setDriver(driverData);

      // Fetch recent loads assigned to this driver
      const { data: loads, error: loadsError } = await supabase
        .from('loads')
        .select('id, load_number, origin, destination, pickup_date, status, rate')
        .eq('user_id', userId)
        .eq('driver_id', driverId)
        .order('pickup_date', { ascending: false })
        .limit(5);

      if (!loadsError && loads) {
        setRecentLoads(loads);

        // Calculate stats from all loads for this driver
        const { data: allLoads } = await supabase
          .from('loads')
          .select('id, status, rate')
          .eq('user_id', userId)
          .eq('driver_id', driverId);

        if (allLoads) {
          const completed = allLoads.filter(l => l.status === 'Completed').length;
          const revenue = allLoads.reduce((sum, l) => sum + (l.rate || 0), 0);
          setLoadStats({
            total: allLoads.length,
            completed,
            revenue
          });
        }
      }

      setLoading(false);
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
      setLoading(false);
    }
  }, [driverId]);

  // Initialize
  useEffect(() => {
    async function initialize() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);
        await loadDriverData(user.id);
      } catch (error) {
        setMessage({ type: 'error', text: getUserFriendlyError(error) });
        setLoading(false);
      }
    }

    initialize();
  }, [router, loadDriverData]);

  // Handle edit
  const handleEdit = useCallback(() => {
    setFormModalOpen(true);
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    if (!user) return;
    await loadDriverData(user.id);
    setFormModalOpen(false);
    setMessage({ type: 'success', text: 'Driver updated successfully' });
  }, [user, loadDriverData]);

  // Handle delete
  const handleDelete = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!driver) return;

    try {
      setIsDeleting(true);
      await deleteDriver(driver.id);
      setMessage({ type: 'success', text: 'Driver deleted successfully' });

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/fleet/drivers');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: getUserFriendlyError(error) });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  }, [driver, router]);

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'On Leave':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get load status badge
  const getLoadStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'In Transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get document status info
  const getDocumentStatus = () => {
    if (!driver) return null;
    return checkDriverDocumentStatus(driver);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <DashboardLayout activePage="fleet">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <LoadingSkeleton />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!driver) {
    return (
      <DashboardLayout activePage="fleet">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <OperationMessage message={message} onDismiss={() => setMessage(null)} />
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Driver Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">The driver you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Link
                href="/dashboard/fleet/drivers"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChevronLeft size={18} className="mr-2" />
                Back to Drivers
              </Link>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const docStatus = getDocumentStatus();

  return (
    <DashboardLayout activePage="fleet">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Operation message */}
          <OperationMessage message={message} onDismiss={() => setMessage(null)} />

          {/* Header with gradient */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start">
                <Link
                  href="/dashboard/fleet/drivers"
                  className="mr-3 p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={20} />
                </Link>
                <div className="flex items-center gap-4">
                  {/* Driver Photo */}
                  {driver.image_url ? (
                    <img
                      src={driver.image_url}
                      alt={driver.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <UserCircle size={32} className="text-white/70" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-bold">{driver.name}</h1>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(driver.status)}`}>
                        {driver.status}
                      </span>
                    </div>
                    <p className="text-blue-100 mt-1 flex items-center gap-2">
                      <Briefcase size={16} />
                      {driver.position || 'Driver'}
                      {driver.license_state && (
                        <span className="ml-2">| {driver.license_state} License</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 ml-auto md:ml-0">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Edit size={18} className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Trash2 size={18} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Document Expiry Alerts */}
          {docStatus && (docStatus.licenseStatus === 'expired' || docStatus.medicalCardStatus === 'expired') && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Document Expiration Alert</p>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside">
                    {docStatus.licenseStatus === 'expired' && (
                      <li>Driver&apos;s license has expired</li>
                    )}
                    {docStatus.medicalCardStatus === 'expired' && (
                      <li>Medical card has expired</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {docStatus && (docStatus.licenseStatus === 'warning' || docStatus.medicalCardStatus === 'warning') && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Documents Expiring Soon</p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 list-disc list-inside">
                    {docStatus.licenseStatus === 'warning' && (
                      <li>Driver&apos;s license expires in {docStatus.licenseExpiryDays} days</li>
                    )}
                    {docStatus.medicalCardStatus === 'warning' && (
                      <li>Medical card expires in {docStatus.medicalCardExpiryDays} days</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <Phone size={18} className="mr-2 text-blue-500" />
                    Contact Information
                  </h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <Phone size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Phone</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {driver.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Email</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium break-all">
                          {driver.email || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Location</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {driver.city && driver.state
                            ? `${driver.city}, ${driver.state}`
                            : driver.city || driver.state || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Hire Date</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {driver.hire_date ? formatDateForDisplayMMDDYYYY(driver.hire_date) : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* License & Compliance */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <Shield size={18} className="mr-2 text-blue-500" />
                    License & Compliance
                  </h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <IdCard size={16} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">License Number</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {driver.license_number || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <MapPin size={16} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">License State</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {driver.license_state || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        docStatus?.licenseStatus === 'expired'
                          ? 'bg-red-50 dark:bg-red-900/30'
                          : docStatus?.licenseStatus === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-900/30'
                            : 'bg-green-50 dark:bg-green-900/30'
                      }`}>
                        <Calendar size={16} className={
                          docStatus?.licenseStatus === 'expired'
                            ? 'text-red-600 dark:text-red-400'
                            : docStatus?.licenseStatus === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-green-600 dark:text-green-400'
                        } />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">License Expiry</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {driver.license_expiry ? formatDateForDisplayMMDDYYYY(driver.license_expiry) : 'Not provided'}
                          </p>
                          {docStatus?.licenseStatus === 'expired' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                              Expired
                            </span>
                          )}
                          {docStatus?.licenseStatus === 'warning' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                              {docStatus.licenseExpiryDays}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        docStatus?.medicalCardStatus === 'expired'
                          ? 'bg-red-50 dark:bg-red-900/30'
                          : docStatus?.medicalCardStatus === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-900/30'
                            : 'bg-green-50 dark:bg-green-900/30'
                      }`}>
                        <FileText size={16} className={
                          docStatus?.medicalCardStatus === 'expired'
                            ? 'text-red-600 dark:text-red-400'
                            : docStatus?.medicalCardStatus === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-green-600 dark:text-green-400'
                        } />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Medical Card Expiry</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {driver.medical_card_expiry ? formatDateForDisplayMMDDYYYY(driver.medical_card_expiry) : 'Not provided'}
                          </p>
                          {docStatus?.medicalCardStatus === 'expired' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                              Expired
                            </span>
                          )}
                          {docStatus?.medicalCardStatus === 'warning' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                              {docStatus.medicalCardExpiryDays}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {(driver.emergency_contact || driver.emergency_phone) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <AlertCircle size={18} className="mr-2 text-orange-500" />
                      Emergency Contact
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                          <User size={16} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Contact Name</p>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {driver.emergency_contact || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                          <Phone size={16} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Contact Phone</p>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {driver.emergency_phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Loads */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <Package size={18} className="mr-2 text-blue-500" />
                    Recent Loads
                  </h3>
                  <Link
                    href="/dashboard/dispatching"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentLoads.length === 0 ? (
                    <div className="p-8 text-center">
                      <Package size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No loads assigned to this driver</p>
                    </div>
                  ) : (
                    recentLoads.map(load => (
                      <div key={load.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              Load #{load.load_number || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {load.origin} → {load.destination}
                            </p>
                            {load.pickup_date && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatDateForDisplayMMDDYYYY(load.pickup_date)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLoadStatusBadge(load.status)}`}>
                              {load.status}
                            </span>
                            {load.rate > 0 && (
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">
                                {formatCurrency(load.rate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              {driver.notes && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <FileText size={18} className="mr-2 text-blue-500" />
                      Notes
                    </h3>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{driver.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Stats & Quick Info */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Quick Stats</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center">
                      <Package size={18} className="text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Total Loads</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{loadStats.total}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle size={18} className="text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{loadStats.completed}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Total Revenue</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(loadStats.revenue)}</span>
                  </div>
                </div>
              </div>

              {/* Document Status Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Document Status</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    docStatus?.licenseStatus === 'expired'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : docStatus?.licenseStatus === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/20'
                        : 'bg-green-50 dark:bg-green-900/20'
                  }`}>
                    <div className="flex items-center">
                      <IdCard size={18} className={
                        docStatus?.licenseStatus === 'expired'
                          ? 'text-red-600 dark:text-red-400'
                          : docStatus?.licenseStatus === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                      } />
                      <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">License</span>
                    </div>
                    {docStatus?.licenseStatus === 'expired' ? (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">Expired</span>
                    ) : docStatus?.licenseStatus === 'warning' ? (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{docStatus.licenseExpiryDays}d</span>
                    ) : (
                      <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    docStatus?.medicalCardStatus === 'expired'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : docStatus?.medicalCardStatus === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/20'
                        : 'bg-green-50 dark:bg-green-900/20'
                  }`}>
                    <div className="flex items-center">
                      <FileText size={18} className={
                        docStatus?.medicalCardStatus === 'expired'
                          ? 'text-red-600 dark:text-red-400'
                          : docStatus?.medicalCardStatus === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                      } />
                      <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">Medical Card</span>
                    </div>
                    {docStatus?.medicalCardStatus === 'expired' ? (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">Expired</span>
                    ) : docStatus?.medicalCardStatus === 'warning' ? (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{docStatus.medicalCardExpiryDays}d</span>
                    ) : (
                      <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Created/Updated Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  {driver.created_at && (
                    <p>Created: {formatDateForDisplayMMDDYYYY(driver.created_at)}</p>
                  )}
                  {driver.updated_at && (
                    <p>Updated: {formatDateForDisplayMMDDYYYY(driver.updated_at)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <DriverFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          driver={driver}
          userId={user?.id}
          onSubmit={handleFormSubmit}
        />

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Driver"
          message={`Are you sure you want to delete "${driver?.name}"? This action cannot be undone and will remove all associated records.`}
          isDeleting={isDeleting}
        />
      </main>
    </DashboardLayout>
  );
}
