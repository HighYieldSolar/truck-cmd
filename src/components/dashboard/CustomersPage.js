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
  LogOut,
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  ChevronDown,
  X,
  AlertCircle
} from "lucide-react";

// Navigation Sidebar Component
const Sidebar = ({ activePage = "customers" }) => {
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
        
        <div className="pt-4 mt-4 border-t">
          <Link 
            href="/dashboard/settings" 
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <Settings size={18} className="mr-3" />
            <span>Settings</span>
          </Link>
          <button 
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Customer Card Component
const CustomerCard = ({ customer, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
            {customer.company_name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{customer.company_name}</h3>
            <p className="text-sm text-gray-500">{customer.customer_type}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-gray-700 mb-4">
        <div className="flex items-start">
          <Mail size={16} className="mr-2 mt-1 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{customer.email || "No email provided"}</span>
        </div>
        <div className="flex items-start">
          <Phone size={16} className="mr-2 mt-1 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{customer.phone || "No phone provided"}</span>
        </div>
        <div className="flex items-start">
          <Building size={16} className="mr-2 mt-1 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{customer.address || "No address provided"}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            customer.status === 'Active' ? 'bg-green-100 text-green-800' : 
            customer.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {customer.status}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(customer)} 
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(customer.id)} 
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Customer Table Row Component
const CustomerTableRow = ({ customer, onEdit, onDelete }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {customer.company_name[0].toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{customer.company_name}</div>
            <div className="text-sm text-gray-500">{customer.customer_type}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{customer.contact_name}</div>
        <div className="text-sm text-gray-500">{customer.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{customer.phone}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          customer.status === 'Active' ? 'bg-green-100 text-green-800' : 
          customer.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {customer.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          onClick={() => onEdit(customer)} 
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(customer.id)} 
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

// Customer Form Modal Component
const CustomerFormModal = ({ isOpen, onClose, customer, onSave }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    customer_type: 'Shipper',
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer
      });
    } else {
      // Reset form for new customer
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        customer_type: 'Shipper',
        status: 'Active',
        notes: ''
      });
    }
  }, [customer, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? "Edit Customer" : "Add New Customer"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="customer_type" className="block text-sm font-medium text-gray-700">
                Customer Type
              </label>
              <select
                id="customer_type"
                name="customer_type"
                value={formData.customer_type}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Shipper">Shipper</option>
                <option value="Consignee">Consignee</option>
                <option value="Broker">Broker</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {customer ? "Update Customer" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, customerName }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          Delete Customer
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Customer Management Page Component
export default function CustomersPage() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  
  // Sample customer data for demonstration
  const sampleCustomers = [
    {
      id: 1,
      company_name: "Global Logistics Inc.",
      contact_name: "John Smith",
      email: "john@globallogistics.com",
      phone: "(555) 123-4567",
      address: "123 Transport Way",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      customer_type: "Shipper",
      status: "Active",
      notes: "Regular customer, ships 3-4 loads per week."
    },
    {
      id: 2,
      company_name: "American Freight Services",
      contact_name: "Sarah Johnson",
      email: "sarah@americanfreight.com",
      phone: "(555) 987-6543",
      address: "456 Shipping Blvd",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      customer_type: "Broker",
      status: "Active",
      notes: "Prefers email communication."
    },
    {
      id: 3,
      company_name: "Midwest Distribution",
      contact_name: "Michael Brown",
      email: "michael@midwestdist.com",
      phone: "(555) 456-7890",
      address: "789 Warehouse Dr",
      city: "Indianapolis",
      state: "IN",
      zip: "46225",
      customer_type: "Consignee",
      status: "Inactive",
      notes: "Seasonal customer, active mainly in summer."
    },
    {
      id: 4,
      company_name: "Pacific Cargo LLC",
      contact_name: "Lisa Chen",
      email: "lisa@pacificcargo.com",
      phone: "(555) 234-5678",
      address: "321 Harbor Way",
      city: "Los Angeles",
      state: "CA",
      zip: "90017",
      customer_type: "Shipper",
      status: "Active",
      notes: "International shipments specialist."
    },
    {
      id: 5,
      company_name: "East Coast Brokers",
      contact_name: "David Wilson",
      email: "david@eastcoastbrokers.com",
      phone: "(555) 876-5432",
      address: "654 Market St",
      city: "New York",
      state: "NY",
      zip: "10001",
      customer_type: "Broker",
      status: "Pending",
      notes: "New relationship, still setting up account details."
    },
    {
      id: 6,
      company_name: "Southern Transport Solutions",
      contact_name: "Robert Martinez",
      email: "robert@southernts.com",
      phone: "(555) 345-6789",
      address: "987 Freight Lane",
      city: "Atlanta",
      state: "GA",
      zip: "30303",
      customer_type: "Shipper",
      status: "Active",
      notes: "Prefers phone calls over emails. Ships to southeast region."
    }
  ];

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        
        // Get user information
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (user) {
          setUser(user);
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Set sample data
          setCustomers(sampleCustomers);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getData();
  }, []);

  // Filter customers based on search term and filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
    const matchesType = typeFilter === 'All' || customer.customer_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle customer form submission
  const handleSaveCustomer = (formData) => {
    if (currentCustomer) {
      // Update existing customer
      const updatedCustomers = customers.map(c => 
        c.id === currentCustomer.id ? { ...formData, id: c.id } : c
      );
      setCustomers(updatedCustomers);
    } else {
      // Add new customer
      const newCustomer = {
        ...formData,
        id: Math.max(0, ...customers.map(c => c.id)) + 1 // Generate a new ID
      };
      setCustomers([...customers, newCustomer]);
    }
    
    // Close modal and reset current customer
    setFormModalOpen(false);
    setCurrentCustomer(null);
  };

  // Handle customer edit
  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setFormModalOpen(true);
  };

  // Handle customer delete
  const handleDeleteCustomer = (id) => {
    const customerToRemove = customers.find(c => c.id === id);
    setCustomerToDelete(customerToRemove);
    setDeleteModalOpen(true);
  };

  // Confirm customer deletion
  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      const updatedCustomers = customers.filter(c => c.id !== customerToDelete.id);
      setCustomers(updatedCustomers);
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
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
      <Sidebar activePage="customers" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <button className="md:hidden p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="relative flex-1 max-w-md mx-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search..."
            />
          </div>
          
          <div className="flex items-center">
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
                <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
                <p className="text-gray-600">View, add, and manage your customer relationships</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button 
                  onClick={() => {
                    setCurrentCustomer(null);
                    setFormModalOpen(true);
                  }} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <Plus size={16} className="mr-2" />
                  Add Customer
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                    >
                      <option value="All">All Types</option>
                      <option value="Shipper">Shipper</option>
                      <option value="Consignee">Consignee</option>
                      <option value="Broker">Broker</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex rounded-md shadow-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 text-sm font-medium ${
                        viewMode === 'grid' 
                          ? 'bg-blue-100 text-blue-700 border-blue-300' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } border rounded-l-md`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-4 py-2 text-sm font-medium ${
                        viewMode === 'table' 
                          ? 'bg-blue-100 text-blue-700 border-blue-300' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } border-t border-b border-r rounded-r-md`}
                    >
                      Table
                    </button>
                  </div>
                </div>
              </div>
            </div>
                
            {/* Content Area */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="flex justify-center mb-4">
                  <Users size={48} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'All' || typeFilter !== 'All' 
                    ? "Try adjusting your search or filters." 
                    : "You don't have any customers yet."}
                </p>
                {!searchTerm && statusFilter === 'All' && typeFilter === 'All' && (
                  <button
                    onClick={() => {
                      setCurrentCustomer(null);
                      setFormModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Your First Customer
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map(customer => (
                      <CustomerCard 
                        key={customer.id} 
                        customer={customer} 
                        onEdit={handleEditCustomer}
                        onDelete={handleDeleteCustomer}
                      />
                    ))}
                  </div>
                )}
                
                {/* Table View */}
                {viewMode === 'table' && (
                  <div className="bg-white shadow overflow-hidden rounded-md">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
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
                          {filteredCustomers.map(customer => (
                            <CustomerTableRow 
                              key={customer.id} 
                              customer={customer} 
                              onEdit={handleEditCustomer}
                              onDelete={handleDeleteCustomer}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Customer Count and Pagination (for larger datasets) */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
              <div>
                Showing <span className="font-medium">{filteredCustomers.length}</span> of{" "}
                <span className="font-medium">{customers.length}</span> customers
              </div>
              
              {/* Simple Pagination - would be more sophisticated in production */}
              {filteredCustomers.length > 0 && (
                <div className="flex space-x-1">
                  <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CustomerFormModal 
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setCurrentCustomer(null);
        }}
        customer={currentCustomer}
        onSave={handleSaveCustomer}
      />
      
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={confirmDeleteCustomer}
        customerName={customerToDelete?.company_name}
      />
    </div>
  );
}