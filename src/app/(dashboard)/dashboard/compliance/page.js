"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  CalendarDays,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  RefreshCw,
  Plus,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// Constants for compliance item types and their details
const COMPLIANCE_TYPES = {
  REGISTRATION: {
    name: "Vehicle Registration",
    icon: <Truck size={18} className="text-blue-500" />,
    description: "Vehicle registration renewal",
    frequency: "Yearly"
  },
  INSPECTION: {
    name: "Vehicle Inspection",
    icon: <CheckCircle size={18} className="text-green-500" />,
    description: "DOT vehicle inspection",
    frequency: "Quarterly"
  },
  INSURANCE: {
    name: "Insurance",
    icon: <FileText size={18} className="text-purple-500" />,
    description: "Insurance policy renewal",
    frequency: "Yearly"
  },
  PERMIT: {
    name: "Permits",
    icon: <FileText size={18} className="text-orange-500" />,
    description: "Operating authority permits",
    frequency: "Varies"
  },
  LICENSE: {
    name: "Driver License",
    icon: <FileText size={18} className="text-red-500" />,
    description: "CDL renewal",
    frequency: "Every 4 years"
  },
  MEDICAL: {
    name: "Medical Card",
    icon: <FileText size={18} className="text-pink-500" />,
    description: "DOT physical examination",
    frequency: "Every 2 years"
  },
  TAX: {
    name: "Tax Filing",
    icon: <FileText size={18} className="text-yellow-500" />,
    description: "Quarterly tax filing",
    frequency: "Quarterly"
  },
  IFTA: {
    name: "IFTA Filing",
    icon: <FileText size={18} className="text-indigo-500" />,
    description: "International Fuel Tax Agreement",
    frequency: "Quarterly"
  }
};

// Status badge component
const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let icon = null;

  switch (status.toLowerCase()) {
    case "active":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <CheckCircle size={12} className="mr-1" />;
      break;
    case "expired":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = <AlertCircle size={12} className="mr-1" />;
      break;
    case "expiring soon":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      icon = <Clock size={12} className="mr-1" />;
      break;
    case "pending":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      icon = <Clock size={12} className="mr-1" />;
      break;
    default:
      icon = <FileText size={12} className="mr-1" />;
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

// Compliance item component
const ComplianceItem = ({ item, onEdit, onDelete, onView }) => {
  const typeInfo = COMPLIANCE_TYPES[item.compliance_type] || {
    name: item.compliance_type,
    icon: <FileText size={18} className="text-gray-500" />,
    description: "Compliance document",
    frequency: "Unknown"
  };

  // Calculate days until expiration
  const daysUntilExpiration = () => {
    if (!item.expiration_date) return null;
    
    const today = new Date();
    const expirationDate = new Date(item.expiration_date);
    const differenceInTime = expirationDate - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };

  // Determine status based on expiration date
  const getStatus = () => {
    const days = daysUntilExpiration();
    
    if (!days && days !== 0) return "Unknown";
    if (days < 0) return "Expired";
    if (days <= 30) return "Expiring Soon";
    return "Active";
  };

  const status = item.status || getStatus();

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            {typeInfo.icon}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{item.title || typeInfo.name}</div>
            <div className="text-xs text-gray-500">{item.description || typeInfo.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{item.entity_name || "N/A"}</div>
        <div className="text-xs text-gray-500">{item.entity_type || "N/A"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {item.issue_date ? new Date(item.issue_date).toLocaleDateString() : "N/A"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : "N/A"}
        </div>
        {daysUntilExpiration() !== null && daysUntilExpiration() <= 30 && daysUntilExpiration() > 0 && (
          <div className="text-xs text-orange-500 font-medium">
            {daysUntilExpiration()} days left
          </div>
        )}
        {daysUntilExpiration() !== null && daysUntilExpiration() <= 0 && (
          <div className="text-xs text-red-500 font-medium">
            Expired
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onView(item)}
            className="text-blue-600 hover:text-blue-900"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Compliance form modal
const ComplianceFormModal = ({ isOpen, onClose, compliance, onSave, isSubmitting }) => {
  const [formData, setFormData] = useState({
    title: "",
    compliance_type: "REGISTRATION",
    entity_type: "Vehicle",
    entity_name: "",
    document_number: "",
    issue_date: "",
    expiration_date: "",
    issuing_authority: "",
    notes: "",
    status: "Active",
    document_file: null
  });

  // Initialize form when editing existing compliance item
  useEffect(() => {
    if (compliance) {
      setFormData({
        title: compliance.title || "",
        compliance_type: compliance.compliance_type || "REGISTRATION",
        entity_type: compliance.entity_type || "Vehicle",
        entity_name: compliance.entity_name || "",
        document_number: compliance.document_number || "",
        issue_date: compliance.issue_date || "",
        expiration_date: compliance.expiration_date || "",
        issuing_authority: compliance.issuing_authority || "",
        notes: compliance.notes || "",
        status: compliance.status || "Active",
        document_file: null // Reset file input when editing
      });
    } else {
      // Reset form for new compliance item
      setFormData({
        title: "",
        compliance_type: "REGISTRATION",
        entity_type: "Vehicle",
        entity_name: "",
        document_number: "",
        issue_date: "",
        expiration_date: "",
        issuing_authority: "",
        notes: "",
        status: "Active",
        document_file: null
      });
    }
  }, [compliance, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && files?.length > 0) {
      setFormData({
        ...formData,
        document_file: files[0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? "" : "hidden"}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900">
            {compliance ? "Edit Compliance Record" : "Add Compliance Record"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g. Vehicle Registration for Truck #12"
                required
              />
            </div>

            <div>
              <label htmlFor="compliance_type" className="block text-sm font-medium text-gray-700 mb-1">
                Compliance Type *
              </label>
              <select
                id="compliance_type"
                name="compliance_type"
                value={formData.compliance_type}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div>
              <label htmlFor="entity_type" className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type *
              </label>
              <select
                id="entity_type"
                name="entity_type"
                value={formData.entity_type}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="Vehicle">Vehicle</option>
                <option value="Driver">Driver</option>
                <option value="Company">Company</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="entity_name" className="block text-sm font-medium text-gray-700 mb-1">
                Entity Name *
              </label>
              <input
                type="text"
                id="entity_name"
                name="entity_name"
                value={formData.entity_name}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g. Truck #12 or John Smith"
                required
              />
            </div>

            <div>
              <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-1">
                Document Number
              </label>
              <input
                type="text"
                id="document_number"
                name="document_number"
                value={formData.document_number}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g. License or Permit Number"
              />
            </div>

            <div>
              <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                id="issue_date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date *
              </label>
              <input
                type="date"
                id="expiration_date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="issuing_authority" className="block text-sm font-medium text-gray-700 mb-1">
                Issuing Authority
              </label>
              <input
                type="text"
                id="issuing_authority"
                name="issuing_authority"
                value={formData.issuing_authority}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g. DMV or DOT"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="document_file" className="block text-sm font-medium text-gray-700 mb-1">
                Upload Document (PDF, JPG, PNG)
              </label>
              <input
                type="file"
                id="document_file"
                name="document_file"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {formData.document_file && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected file: {formData.document_file.name}
                </p>
              )}
              {compliance?.document_url && !formData.document_file && (
                <div className="mt-1 flex items-center">
                  <FileText size={16} className="text-gray-400 mr-1" />
                  <span className="text-sm text-gray-500">Current document on file</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Any additional information"
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  {compliance ? "Update Record" : "Save Record"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View compliance detail modal
const ViewComplianceModal = ({ isOpen, onClose, compliance }) => {
  if (!isOpen || !compliance) return null;

  const typeInfo = COMPLIANCE_TYPES[compliance.compliance_type] || {
    name: compliance.compliance_type,
    icon: <FileText size={18} className="text-gray-500" />,
    description: "Compliance document",
    frequency: "Unknown"
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? "" : "hidden"}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              {typeInfo.icon}
            </div>
            {compliance.title || typeInfo.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <StatusBadge status={compliance.status || "Active"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Entity Information</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Type:</span> {compliance.entity_type || "N/A"}
                </p>
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Name:</span> {compliance.entity_name || "N/A"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Document Information</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Document Number:</span> {compliance.document_number || "N/A"}
                </p>
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Issuing Authority:</span> {compliance.issuing_authority || "N/A"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Dates</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Issue Date:</span>{" "}
                  {compliance.issue_date
                    ? new Date(compliance.issue_date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Expiration Date:</span>{" "}
                  {compliance.expiration_date
                    ? new Date(compliance.expiration_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Compliance Type</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Type:</span> {typeInfo.name}
                </p>
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">Frequency:</span> {typeInfo.frequency}
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {compliance.notes || "No notes available."}
                </p>
              </div>
            </div>

            {compliance.document_url && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Document</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <a
                    href={compliance.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FileText size={16} className="mr-2" />
                    View Document
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete confirmation modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, complianceTitle, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-lg font-medium text-center mb-2">Delete Compliance Record</h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete &quot;{complianceTitle}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Compliance Dashboard Component
export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Compliance items state
  const [complianceItems, setComplianceItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    entity: "all",
    search: ""
  });
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch user and compliance items on mount
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
        
        // Fetch compliance items
        await fetchComplianceItems(user.id);
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing compliance dashboard:", error);
        setError("Failed to load compliance data. Please try again.");
        setLoading(false);
      }
    }
    
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fetch compliance items from Supabase
  const fetchComplianceItems = async (userId) => {
    try {
      console.log("Fetching compliance items for user:", userId);
      const { data, error } = await supabase
        .from("compliance_items")
        .select("*")
        .eq("user_id", userId);
        
      if (error) {
        console.error("Error in fetch:", error);
        throw error;
      }
      
      console.log("Fetched compliance items:", data);
      setComplianceItems(data || []);
      applyFilters(data || [], filters);
    } catch (error) {
      console.error("Error fetching compliance items:", error);
      setError("Failed to fetch compliance items. Please try again.");
    }
  };
  
  // Apply filters to compliance items
  const applyFilters = (items, currentFilters) => {
    let result = [...items];
    
    // Filter by status
    if (currentFilters.status !== "all") {
      result = result.filter(item => {
        const status = item.status ? item.status.toLowerCase() : getItemStatus(item).toLowerCase();
        return status === currentFilters.status.toLowerCase();
      });
    }
    
    // Filter by compliance type
    if (currentFilters.type !== "all") {
      result = result.filter(item => item.compliance_type === currentFilters.type);
    }
    
    // Filter by entity type
    if (currentFilters.entity !== "all") {
      result = result.filter(item => item.entity_type === currentFilters.entity);
    }
    
    // Filter by search term
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        (item.entity_name && item.entity_name.toLowerCase().includes(searchLower)) ||
        (item.document_number && item.document_number.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredItems(result);
  };
  
  // Helper function to get an item's status based on its expiration date
  const getItemStatus = (item) => {
    if (!item.expiration_date) return "Unknown";
    
    const today = new Date();
    const expirationDate = new Date(item.expiration_date);
    const differenceInTime = expirationDate - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    if (differenceInDays < 0) return "Expired";
    if (differenceInDays <= 30) return "Expiring Soon";
    return "Active";
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    applyFilters(complianceItems, newFilters);
  };
  
  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    applyFilters(complianceItems, newFilters);
  };
  
  // Modal handlers
  const handleOpenFormModal = (item = null) => {
    setCurrentItem(item);
    setFormModalOpen(true);
  };
  
  const handleOpenViewModal = (item) => {
    setCurrentItem(item);
    setViewModalOpen(true);
  };
  
  const handleOpenDeleteModal = (item) => {
    setCurrentItem(item);
    setDeleteModalOpen(true);
  };
  
  // Save compliance item
  const handleSaveComplianceItem = async (formData) => {
    try {
      setIsSubmitting(true);
      
      // Upload document if provided
      let documentUrl = currentItem?.document_url;
      
      if (formData.document_file) {
        try {
          const fileExt = formData.document_file.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          console.log(`Uploading file to documents bucket, path: ${filePath}`);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, formData.document_file);
            
          if (uploadError) {
            console.error("Upload error details:", uploadError);
            throw new Error(`Document upload failed: ${uploadError.message || JSON.stringify(uploadError)}`);
          }
          
          console.log("File uploaded successfully:", uploadData);
          
          // Get the public URL for the file
          const { data } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
            
          documentUrl = data.publicUrl;
          console.log("Document URL:", documentUrl);
        } catch (uploadErr) {
          console.error("Upload process error:", uploadErr);
          throw uploadErr;
        }
      }
      
      // Prepare compliance data
      const complianceData = {
        title: formData.title,
        compliance_type: formData.compliance_type,
        entity_type: formData.entity_type,
        entity_name: formData.entity_name,
        document_number: formData.document_number,
        issue_date: formData.issue_date || null,
        expiration_date: formData.expiration_date,
        issuing_authority: formData.issuing_authority || null,
        notes: formData.notes || null,
        status: formData.status,
        document_url: documentUrl || null,
        user_id: user.id
      };
      
      console.log("Saving compliance data:", complianceData);

      if (currentItem) {
        // Update existing item
        const { data, error } = await supabase
          .from('compliance_items')
          .update(complianceData)
          .eq('id', currentItem.id);
          
        if (error) {
          console.error("Update error:", error);
          throw new Error(`Failed to update record: ${error.message || JSON.stringify(error)}`);
        }
        
        console.log("Updated compliance item:", data);
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from('compliance_items')
          .insert([complianceData]);
          
        if (error) {
          console.error("Insert error:", error);
          throw new Error(`Failed to create record: ${error.message || JSON.stringify(error)}`);
        }
        
        console.log("Inserted compliance item:", data);
      }
      
      // Refresh compliance items
      await fetchComplianceItems(user.id);
      
      // Close the modal
      setFormModalOpen(false);
      setCurrentItem(null);
    } catch (error) {
      console.error("Error saving compliance item:", error);
      setError(error.message || "Failed to save compliance item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete compliance item
  const handleDeleteComplianceItem = async () => {
    if (!currentItem) return;
    
    try {
      setIsDeleting(true);
      
      // Delete document from storage if exists
      if (currentItem.document_url) {
        try {
          // Extract the file path from the URL
          const url = new URL(currentItem.document_url);
          const pathParts = url.pathname.split('/');
          
          // Get the path after the bucket name
          const bucketPos = pathParts.indexOf('documents');
          const filePath = pathParts.slice(bucketPos + 1).join('/');
          
          if (filePath) {
            console.log(`Attempting to delete file from documents bucket, path: ${filePath}`);
            const { error: storageError } = await supabase.storage
              .from('documents')
              .remove([filePath]);
              
            if (storageError) {
              console.warn("Error removing document file:", storageError);
            }
          }
        } catch (storageError) {
          console.warn("Error processing document URL:", storageError);
          // Continue with deletion even if removing file fails
        }
      }
      
      // Delete the compliance item
      const { error } = await supabase
        .from('compliance_items')
        .delete()
        .eq('id', currentItem.id);
        
      if (error) {
        console.error("Delete record error:", error);
        throw new Error(`Failed to delete record: ${error.message || JSON.stringify(error)}`);
      }
      
      // Refresh compliance items
      await fetchComplianceItems(user.id);
      
      // Close the modal
      setDeleteModalOpen(false);
      setCurrentItem(null);
    } catch (error) {
      console.error("Error deleting compliance item:", error);
      setError(error.message || "Failed to delete compliance item. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Get summary statistics
  const getSummaryStats = () => {
    const total = complianceItems.length;
    const active = complianceItems.filter(item => 
      (item.status && item.status.toLowerCase() === "active") || 
      (!item.status && getItemStatus(item) === "Active")
    ).length;
    
    const expiringSoon = complianceItems.filter(item => 
      (item.status && item.status.toLowerCase() === "expiring soon") || 
      (!item.status && getItemStatus(item) === "Expiring Soon")
    ).length;
    
    const expired = complianceItems.filter(item => 
      (item.status && item.status.toLowerCase() === "expired") || 
      (!item.status && getItemStatus(item) === "Expired")
    ).length;
    
    const pending = complianceItems.filter(item => 
      item.status && item.status.toLowerCase() === "pending"
    ).length;
    
    return { total, active, expiringSoon, expired, pending };
  };
  
  // Get upcoming expirations (items expiring in the next 30 days)
  const getUpcomingExpirations = () => {
    const today = new Date();
    return complianceItems
      .filter(item => {
        if (!item.expiration_date) return false;
        
        const expirationDate = new Date(item.expiration_date);
        const differenceInTime = expirationDate - today;
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
        
        return differenceInDays >= 0 && differenceInDays <= 30;
      })
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))
      .slice(0, 5); // Get top 5 upcoming expirations
  };
  
  const stats = getSummaryStats();
  const upcomingExpirations = getUpcomingExpirations();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="compliance">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Management</h1>
              <p className="text-gray-600 mt-1">Track and manage all your regulatory compliance documents</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => handleOpenFormModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus size={16} className="mr-2" />
                Add Compliance Record
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <Download size={16} className="mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <FileText size={20} className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-semibold text-green-600 mt-1">{stats.active}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                  <p className="text-2xl font-semibold text-yellow-600 mt-1">{stats.expiringSoon}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Expired</p>
                  <p className="text-2xl font-semibold text-red-600 mt-1">{stats.expired}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-gray-600 mt-1">{stats.pending}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-full">
                  <Clock size={20} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Two-column layout: Upcoming Expirations + Filters/Table */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left column: Upcoming Expirations */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Upcoming Expirations</h2>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Next 30 Days
                  </span>
                </div>
                <div className="p-4">
                  {upcomingExpirations.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                      <p className="text-gray-500">No upcoming expirations!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingExpirations.map(item => {
                        const daysLeft = Math.ceil(
                          (new Date(item.expiration_date) - new Date()) / (1000 * 3600 * 24)
                        );
                        
                        return (
                          <div
                            key={item.id}
                            className="flex flex-col p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleOpenViewModal(item)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                  {COMPLIANCE_TYPES[item.compliance_type]?.icon || (
                                    <FileText size={16} className="text-blue-600" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                  {item.title || COMPLIANCE_TYPES[item.compliance_type]?.name || "Compliance Record"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {item.entity_name || "Unknown entity"}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                daysLeft <= 7 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {daysLeft === 0 ? "Expires today" : `${daysLeft} days left`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Compliance Type Breakdown */}
              <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Compliance Types</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => {
                      const count = complianceItems.filter(
                        item => item.compliance_type === key
                      ).length;
                      
                      if (count === 0) return null;
                      
                      return (
                        <div 
                          key={key}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                          onClick={() => {
                            const newFilters = { ...filters, type: key };
                            setFilters(newFilters);
                            applyFilters(complianceItems, newFilters);
                          }}
                        >
                          <div className="flex items-center">
                            {type.icon}
                            <span className="ml-2 text-sm text-gray-700">{type.name}</span>
                          </div>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column: Filters and Table */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                  <div className="relative inline-block w-full md:w-auto">
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="expiring soon">Expiring Soon</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  
                  <div className="relative inline-block w-full md:w-auto">
                    <select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="all">All Types</option>
                      {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="relative inline-block w-full md:w-auto">
                    <select
                      name="entity"
                      value={filters.entity}
                      onChange={handleFilterChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="all">All Entities</option>
                      <option value="Vehicle">Vehicles</option>
                      <option value="Driver">Drivers</option>
                      <option value="Company">Company</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={handleSearch}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search records..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Compliance Items Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Compliance Item
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiration Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                            {complianceItems.length === 0 ? (
                              <div>
                                <FileText size={32} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-900 mb-1">No compliance records found</p>
                                <p className="text-gray-500 mb-4">Start tracking your compliance documents</p>
                                <button
                                  onClick={() => handleOpenFormModal()}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  <Plus size={16} className="mr-2" />
                                  Add Compliance Record
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="mb-1">No matching records found</p>
                                <p>Try adjusting your filters</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map(item => (
                          <ComplianceItem
                            key={item.id}
                            item={item}
                            onEdit={() => handleOpenFormModal(item)}
                            onDelete={() => handleOpenDeleteModal(item)}
                            onView={() => handleOpenViewModal(item)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modals */}
        <ComplianceFormModal
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setCurrentItem(null);
          }}
          compliance={currentItem}
          onSave={handleSaveComplianceItem}
          isSubmitting={isSubmitting}
        />
        
        <ViewComplianceModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setCurrentItem(null);
          }}
          compliance={currentItem}
        />
        
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCurrentItem(null);
          }}
          onConfirm={handleDeleteComplianceItem}
          complianceTitle={currentItem?.title || "this compliance record"}
          isDeleting={isDeleting}
        />
      </main>
    </DashboardLayout>
  );
}