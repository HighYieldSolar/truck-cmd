"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Truck,
  FileText,
  Wallet,
  Users,
  Package,
  CheckCircle,
  Calculator,
  Fuel,
  Settings,
  Bell,
  Search,
  PlusCircle,
  Download,
  Filter,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  FileCheck,
  Clipboard,
  Shield,
  Award,
  User,
  FileX,
  BarChart2,
  RefreshCw,
  HelpCircle,
  Info,
  ChevronRight,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Upload,
  ArrowRight,
  ExternalLink
} from "lucide-react";

// Sidebar component for the dashboard
const Sidebar = ({ activePage = "compliance" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'Fleet', href: '/dashboard/fleet', icon: <Package size={18} /> },
    { name: 'Compliance', href: '/dashboard/compliance', icon: <CheckCircle size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
    { name: 'Fuel Tracker', href: '/dashboard/fuel', icon: <Fuel size={18} /> },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg">
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
    </aside>
  );
};

// Card component for compliance section summaries
const ComplianceCard = ({ title, icon, stats, status, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="rounded-md p-2 bg-blue-100 mr-3">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${
            status === 'compliant' ? 'bg-green-100 text-green-800' :
            status === 'attention' ? 'bg-yellow-100 text-yellow-800' :
            status === 'urgent' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status === 'compliant' ? 'Compliant' :
             status === 'attention' ? 'Needs Attention' :
             status === 'urgent' ? 'Urgent Action Required' :
             'Unknown Status'}
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap justify-between">
          {stats.map((stat, index) => (
            <div key={index} className="mt-2 mr-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
        
        {children}
      </div>
    </div>
  );
};

// Alert component for urgent compliance issues
const ComplianceAlerts = ({ alerts }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Urgent Compliance Alerts</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {alerts.length === 0 ? (
          <div className="px-5 py-4 text-center">
            <p className="text-green-600 font-medium">No urgent compliance issues!</p>
            <p className="text-sm text-gray-500 mt-1">Everything is up to date and compliant.</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} className="px-5 py-4">
              <div className="flex items-start">
                <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">{alert.dueDate}</span>
                  </div>
                  <div className="mt-2">
                    <Link href={alert.actionLink} className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                      {alert.actionText} <ArrowRight size={14} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Upcoming requirements component
const UpcomingRequirements = ({ requirements }) => {
  const handleFilter = (e) => {
    // Filter functionality would be implemented here
    console.log("Filter by:", e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Upcoming Requirements</h2>
        <div className="flex items-center">
          <select 
            onChange={handleFilter}
            className="text-sm border border-gray-300 rounded-md shadow-sm py-1 pl-3 pr-8 bg-white"
          >
            <option value="all">All Types</option>
            <option value="driver">Driver Files</option>
            <option value="vehicle">Vehicle Files</option>
            <option value="company">Company Files</option>
          </select>
        </div>
      </div>
      <ul className="divide-y divide-gray-200">
        {requirements.map((req, index) => (
          <li key={index} className="px-5 py-4 hover:bg-gray-50">
            <div className="flex items-start">
              <div className={`p-2 rounded-full mr-3 ${
                req.daysRemaining <= 7 ? 'bg-red-100 text-red-600' :
                req.daysRemaining <= 30 ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between flex-wrap">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{req.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {req.entity} • {req.documentType}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${
                    req.daysRemaining <= 7 ? 'text-red-600' :
                    req.daysRemaining <= 30 ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {req.daysRemaining} days remaining
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <button className="mr-3 text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                    <Upload size={14} className="mr-1" />
                    Upload Document
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center">
                    <Calendar size={14} className="mr-1" />
                    Set Reminder
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-5 py-4 bg-gray-50 text-center border-t border-gray-200">
        <Link href="/dashboard/compliance/all-requirements" className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center justify-center">
          View All Requirements <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

// Document list component for compliance documents
const DocumentsList = ({ documents, category }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">{category} Documents</h2>
        <Link href={`/dashboard/compliance/${category.toLowerCase()}`} className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {documents.map((doc, index) => (
          <li key={index} className="px-5 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-gray-100 mr-3">
                  <FileText size={16} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {doc.lastUpdated} • Expires {doc.expiry}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`px-2 py-1 text-xs rounded-full mr-3 ${
                  doc.status === 'valid' ? 'bg-green-100 text-green-800' :
                  doc.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                  doc.status === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {doc.status === 'valid' ? 'Valid' :
                   doc.status === 'expiring' ? 'Expiring Soon' :
                   doc.status === 'expired' ? 'Expired' :
                   'Unknown'}
                </div>
                
                <div className="relative">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                  {/* Dropdown menu would go here */}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 text-center">
        <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
          <PlusCircle size={16} className="mr-1" />
          Add New Document
        </button>
      </div>
    </div>
  );
};

// Compliance tips component
const ComplianceTips = ({ tips }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Compliance Tips</h2>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {tips.map((tip, index) => (
          <li key={index} className="px-5 py-4">
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3 flex-shrink-0">
                <HelpCircle size={16} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{tip.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{tip.description}</p>
                {tip.link && (
                  <Link 
                    href={tip.link} 
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center mt-2"
                  >
                    Learn more <ExternalLink size={14} className="ml-1" />
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Main Compliance Dashboard Page Component
export default function CompliancePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [complianceStats, setComplianceStats] = useState({
    driver: {
      total: 12,
      compliant: 10,
      expiringSoon: 2,
      expired: 0
    },
    vehicle: {
      total: 8,
      compliant: 7,
      expiringSoon: 1,
      expired: 0
    },
    company: {
      total: 6,
      compliant: 5,
      expiringSoon: 0,
      expired: 1
    }
  });
  
  // Sample data for alerts
  const [alerts, setAlerts] = useState([
    {
      title: "DOT Annual Inspection Due",
      description: "Vehicle #103 requires DOT annual inspection within 5 days",
      severity: "high",
      dueDate: "Mar 9, 2025",
      actionText: "Schedule Inspection",
      actionLink: "/dashboard/compliance/schedule-inspection"
    },
    {
      title: "Medical Card Expiration",
      description: "Driver John Smith's medical card expires in 12 days",
      severity: "medium",
      dueDate: "Mar 16, 2025",
      actionText: "Upload New Document",
      actionLink: "/dashboard/compliance/upload-document"
    },
    {
      title: "IFTA Filing Deadline",
      description: "Q1 IFTA reports are due by the end of next month",
      severity: "low",
      dueDate: "Apr 30, 2025",
      actionText: "Prepare IFTA Report",
      actionLink: "/dashboard/ifta"
    }
  ]);
  
  // Sample data for upcoming requirements
  const [requirements, setRequirements] = useState([
    {
      title: "Medical Certificate Renewal",
      entity: "Driver: Michael Johnson",
      documentType: "Medical Certificate",
      dueDate: "Mar 15, 2025",
      daysRemaining: 11
    },
    {
      title: "Annual Vehicle Inspection",
      entity: "Vehicle: Truck #103",
      documentType: "DOT Inspection",
      dueDate: "Mar 9, 2025",
      daysRemaining: 5
    },
    {
      title: "CDL License Renewal",
      entity: "Driver: Sarah Williams",
      documentType: "CDL License",
      dueDate: "Apr 8, 2025",
      daysRemaining: 35
    },
    {
      title: "Drug Test",
      entity: "Driver: David Wilson",
      documentType: "Random Drug Test",
      dueDate: "Mar 20, 2025",
      daysRemaining: 16
    }
  ]);
  
  // Sample data for driver documents
  const [driverDocuments, setDriverDocuments] = useState([
    {
      title: "Michael Johnson - Medical Certificate",
      lastUpdated: "Jan 15, 2025",
      expiry: "Mar 15, 2025",
      status: "expiring"
    },
    {
      title: "Sarah Williams - CDL License",
      lastUpdated: "May 8, 2024",
      expiry: "Apr 8, 2025",
      status: "valid"
    },
    {
      title: "David Wilson - Medical Certificate",
      lastUpdated: "Dec 12, 2024",
      expiry: "Dec 12, 2025",
      status: "valid"
    }
  ]);
  
  // Sample data for vehicle documents
  const [vehicleDocuments, setVehicleDocuments] = useState([
    {
      title: "Truck #103 - Annual Inspection",
      lastUpdated: "Mar 9, 2024",
      expiry: "Mar 9, 2025",
      status: "expiring"
    },
    {
      title: "Truck #104 - Registration",
      lastUpdated: "Sep 15, 2024",
      expiry: "Sep 15, 2025",
      status: "valid"
    },
    {
      title: "Truck #105 - Insurance Certificate",
      lastUpdated: "Jan 1, 2025",
      expiry: "Dec 31, 2025",
      status: "valid"
    }
  ]);
  
  // Sample data for compliance tips
  const [complianceTips, setComplianceTips] = useState([
    {
      title: "Keep Driver Qualification Files Updated",
      description: "Ensure all driver files include current medical certificates, driving records, and licenses.",
      link: "/help/driver-qualification-files"
    },
    {
      title: "Maintain Regular Vehicle Inspections",
      description: "Schedule regular maintenance and keep detailed records of all repairs and inspections.",
      link: "/help/vehicle-maintenance-records"
    },
    {
      title: "Stay Current on HOS Regulations",
      description: "Monitor changes to Hours of Service regulations and ensure your ELD system is compliant.",
      link: "/help/hos-compliance"
    }
  ]);

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
          // In a real app, you would fetch compliance data here
          // fetchComplianceData(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="compliance" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Compliance Dashboard</h1>
          </div>
          
          <div className="flex items-center">
            <div className="relative flex-1 max-w-md mr-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search compliance records..."
              />
            </div>
            
            <button className="p-2 text-gray-600 hover:text-blue-600 mx-2 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            
            <div className="relative">
              <button className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-2">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Compliance Overview */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Stay on top of your compliance requirements. This dashboard helps you track driver qualification files, vehicle inspections, and company documents to keep your fleet DOT compliant.
                  </p>
                </div>
              </div>
            </div>

            {/* Compliance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ComplianceCard 
                title="Driver Compliance"
                icon={<User size={20} className="text-blue-600" />}
                stats={[
                  { label: "Total Drivers", value: complianceStats.driver.total },
                  { label: "Compliant", value: complianceStats.driver.compliant },
                  { label: "Expiring Soon", value: complianceStats.driver.expiringSoon }
                ]}
                status={complianceStats.driver.expired > 0 ? "urgent" : 
                       complianceStats.driver.expiringSoon > 0 ? "attention" : "compliant"}
              >
                <div className="mt-4">
                  <Link 
                    href="/dashboard/compliance/drivers" 
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    Manage Driver Files <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </ComplianceCard>
              
              <ComplianceCard 
                title="Vehicle Compliance"
                icon={<Truck size={20} className="text-blue-600" />}
                stats={[
                  { label: "Total Vehicles", value: complianceStats.vehicle.total },
                  { label: "Compliant", value: complianceStats.vehicle.compliant },
                  { label: "Expiring Soon", value: complianceStats.vehicle.expiringSoon }
                ]}
                status={complianceStats.vehicle.expired > 0 ? "urgent" : 
                       complianceStats.vehicle.expiringSoon > 0 ? "attention" : "compliant"}
              >
                <div className="mt-4">
                  <Link 
                    href="/dashboard/compliance/vehicles" 
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    Manage Vehicle Files <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </ComplianceCard>
              
              <ComplianceCard 
                title="Company Compliance"
                icon={<Clipboard size={20} className="text-blue-600" />}
                stats={[
                  { label: "Total Documents", value: complianceStats.company.total },
                  { label: "Compliant", value: complianceStats.company.compliant },
                  { label: "Expired", value: complianceStats.company.expired }
                ]}
                status={complianceStats.company.expired > 0 ? "urgent" : 
                       complianceStats.company.expiringSoon > 0 ? "attention" : "compliant"}
              >
                <div className="mt-4">
                  <Link 
                    href="/dashboard/compliance/company" 
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    Manage Company Files <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </ComplianceCard>
            </div>

            {/* Split Content: Alerts and Upcoming Requirements */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ComplianceAlerts alerts={alerts} />
              </div>
              
              <div className="lg:col-span-2">
                <UpcomingRequirements requirements={requirements} />
              </div>
            </div>

            {/* Document Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentsList documents={driverDocuments} category="Driver" />
              <DocumentsList documents={vehicleDocuments} category="Vehicle" />
            </div>

            {/* Compliance Tips */}
            <ComplianceTips tips={complianceTips} />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-blue-100 mb-3">
                    <Upload size={18} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Upload Document</span>
                </button>
                
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-green-100 mb-3">
                    <FileCheck size={18} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Schedule Inspection</span>
                </button>
                
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-purple-100 mb-3">
                    <RefreshCw size={18} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Run Compliance Check</span>
                </button>
                
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-red-100 mb-3">
                    <AlertCircle size={18} className="text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Report Incident</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}