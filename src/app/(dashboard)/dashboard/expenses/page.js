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
  Calendar,
  X,
  AlertCircle,
  DollarSign,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CreditCard,
  Receipt,
  PieChart,
  BarChart2,
  RefreshCw,
  Clock,
  Download
} from "lucide-react";

// Navigation Sidebar Component
const Sidebar = ({ activePage = "expenses" }) => {
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

// Expense Stats Card Component
const ExpenseStatsCard = ({ title, amount, change, changeType, icon, color }) => {
  const bgColorClass = `bg-${color}-50`;
  const textColorClass = `text-${color}-600`;
  const iconBgColorClass = `bg-${color}-100`;
  
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className={`${iconBgColorClass} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline mb-2">
        <h2 className="text-2xl font-bold">${amount.toLocaleString()}</h2>
      </div>
      {change && (
        <div className="flex items-center">
          {changeType === 'increase' ? (
            <ArrowUp size={16} className="text-red-500" />
          ) : (
            <ArrowDown size={16} className="text-green-500" />
          )}
          <span 
            className={`text-sm ml-1 ${
              changeType === 'increase' ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {change}% from last month
          </span>
        </div>
      )}
    </div>
  );
};

// Expense Item Component
const ExpenseItem = ({ expense, onEdit, onDelete }) => {
  // Get category icon based on expense type
  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'fuel':
        return <Fuel size={18} className="text-yellow-500" />;
      case 'maintenance':
        return <Truck size={18} className="text-blue-500" />;
      case 'insurance':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'tolls':
        return <DollarSign size={18} className="text-red-500" />;
      case 'office':
        return <FileText size={18} className="text-purple-500" />;
      default:
        return <Wallet size={18} className="text-gray-500" />;
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getCategoryIcon(expense.category)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{expense.description}</div>
            <div className="text-sm text-gray-500">{expense.category}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">${expense.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        <div className="text-sm text-gray-500">{expense.payment_method}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{new Date(expense.date).toLocaleDateString()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {expense.vehicle_id ? (
          <div className="text-sm text-gray-900">{expense.vehicle_id}</div>
        ) : (
          <div className="text-sm text-gray-400">—</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          onClick={() => onEdit(expense)} 
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(expense.id)} 
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

// Expense Form Modal Component
const ExpenseFormModal = ({ isOpen, onClose, expense, onSave }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    category: 'Fuel',
    payment_method: 'Credit Card',
    notes: '',
    receipt_image: null,
    vehicle_id: '',
    deductible: true
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        // Format date to YYYY-MM-DD for the date input
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        amount: expense.amount.toString()
      });
    } else {
      // Reset form for new expense
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Today's date
        category: 'Fuel',
        payment_method: 'Credit Card',
        notes: '',
        receipt_image: null,
        vehicle_id: '',
        deductible: true
      });
    }
  }, [expense, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {expense ? "Edit Expense" : "Add New Expense"}
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
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount ($) *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Fuel">Fuel</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Insurance">Insurance</option>
                <option value="Tolls">Tolls</option>
                <option value="Office">Office</option>
                <option value="Permits">Permits</option>
                <option value="Meals">Meals</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="EFT">EFT</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
                Vehicle ID
              </label>
              <input
                type="text"
                id="vehicle_id"
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="receipt_image" className="block text-sm font-medium text-gray-700">
                Upload Receipt (optional)
              </label>
              <input
                type="file"
                id="receipt_image"
                name="receipt_image"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
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
            
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  id="deductible"
                  name="deductible"
                  type="checkbox"
                  checked={formData.deductible}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="deductible" className="ml-2 block text-sm text-gray-700">
                  Tax Deductible
                </label>
              </div>
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
              {expense ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, expenseDescription }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          Delete Expense
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete expense &quot;<strong>{expenseDescription}</strong>&quot;? This action cannot be undone.
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

// Main Expenses Page Component
export default function ExpensesPage() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Sample expense data for demonstration
  const sampleExpenses = [
    {
      id: 1,
      description: "Diesel Fuel - Flying J",
      amount: 324.56,
      date: "2025-02-25",
      category: "Fuel",
      payment_method: "Credit Card",
      notes: "Regular fill-up for truck #103",
      receipt_image: null,
      vehicle_id: "TRK-103",
      deductible: true
    },
    {
      id: 2,
      description: "Oil Change and Service",
      amount: 275.89,
      date: "2025-02-20",
      category: "Maintenance",
      payment_method: "Credit Card",
      notes: "Regular maintenance service",
      receipt_image: null,
      vehicle_id: "TRK-101",
      deductible: true
    },
    {
      id: 3,
      description: "Quarterly Insurance Premium",
      amount: 1850.00,
      date: "2025-02-15",
      category: "Insurance",
      payment_method: "EFT",
      notes: "Commercial auto liability coverage",
      receipt_image: null,
      vehicle_id: "",
      deductible: true
    },
    {
      id: 4,
      description: "Turnpike Tolls",
      amount: 68.75,
      date: "2025-02-18",
      category: "Tolls",
      payment_method: "EZ-Pass",
      notes: "Monthly toll charges",
      receipt_image: null,
      vehicle_id: "Fleet",
      deductible: true
    },
    {
      id: 5,
      description: "Office Supplies",
      amount: 124.35,
      date: "2025-02-10",
      category: "Office",
      payment_method: "Debit Card",
      notes: "Printer paper, ink, and general supplies",
      receipt_image: null,
      vehicle_id: "",
      deductible: true
    },
    {
      id: 6,
      description: "Truck Wash",
      amount: 45.99,
      date: "2025-02-23",
      category: "Maintenance",
      payment_method: "Cash",
      notes: "Full service wash and detail",
      receipt_image: null,
      vehicle_id: "TRK-102",
      deductible: true
    },
    {
      id: 7,
      description: "Driver Meal Allowance",
      amount: 65.00,
      date: "2025-02-22",
      category: "Meals",
      payment_method: "Credit Card",
      notes: "Per diem for overnight haul",
      receipt_image: null,
      vehicle_id: "",
      deductible: true
    },
    {
      id: 8,
      description: "Tire Replacement",
      amount: 875.45,
      date: "2025-02-08",
      category: "Maintenance",
      payment_method: "Credit Card",
      notes: "New tires for truck #104",
      receipt_image: null,
      vehicle_id: "TRK-104",
      deductible: true
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
          setExpenses(sampleExpenses);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getData();
  }, []);

  // Calculate expense summaries
  const calculateSummaries = () => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group expenses by category
    const byCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {});
    
    // Get fuel expenses
    const fuelExpenses = byCategory['Fuel'] || 0;
    
    // Get maintenance expenses
    const maintenanceExpenses = byCategory['Maintenance'] || 0;
    
    // Get other expenses
    const otherExpenses = totalExpenses - fuelExpenses - maintenanceExpenses;
    
    return {
      total: totalExpenses,
      fuel: fuelExpenses,
      maintenance: maintenanceExpenses,
      other: otherExpenses
    };
  };

  const summaries = calculateSummaries();

  // Filter expenses based on search term and filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vehicle_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    
    let matchesDate = true;
    if (dateFilter === 'This Month') {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      matchesDate = expenseDate.getMonth() === now.getMonth() && 
                    expenseDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'Custom' && dateRange.start && dateRange.end) {
      const expenseDate = new Date(expense.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = expenseDate >= startDate && expenseDate <= endDate;
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Handle expense form submission
  const handleSaveExpense = (formData) => {
    if (currentExpense) {
      // Update existing expense
      const updatedExpenses = expenses.map(e => 
        e.id === currentExpense.id ? { ...formData, id: e.id } : e
      );
      setExpenses(updatedExpenses);
    } else {
      // Add new expense
      const newExpense = {
        ...formData,
        id: Math.max(0, ...expenses.map(e => e.id)) + 1 // Generate a new ID
      };
      setExpenses([...expenses, newExpense]);
    }
    
    // Close modal and reset current expense
    setFormModalOpen(false);
    setCurrentExpense(null);
  };

  // Handle expense edit
  const handleEditExpense = (expense) => {
    setCurrentExpense(expense);
    setFormModalOpen(true);
  };

  // Handle expense delete
  const handleDeleteExpense = (id) => {
    const expenseToRemove = expenses.find(e => e.id === id);
    setExpenseToDelete(expenseToRemove);
    setDeleteModalOpen(true);
  };

  // Confirm expense deletion
  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
      const updatedExpenses = expenses.filter(e => e.id !== expenseToDelete.id);
      setExpenses(updatedExpenses);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
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

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    
    // If "Custom" is selected, keep the current date range
    // Otherwise, reset it
    if (value !== 'Custom') {
      setDateRange({
        start: '',
        end: ''
      });
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
      <Sidebar activePage="expenses" />

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
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
                <p className="text-gray-600">Track, categorize and manage your business expenses</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => {
                    setCurrentExpense(null);
                    setFormModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <Plus size={16} className="mr-2" />
                  Add Expense
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                >
                  <Download size={16} className="mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Expense Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <ExpenseStatsCard 
                title="Total Expenses" 
                amount={summaries.total} 
                change="8.2" 
                changeType="increase" 
                icon={<Wallet size={20} className="text-blue-600" />} 
                color="blue"
              />
              <ExpenseStatsCard 
                title="Fuel Expenses" 
                amount={summaries.fuel} 
                change="12.5" 
                changeType="increase" 
                icon={<Fuel size={20} className="text-yellow-600" />} 
                color="yellow"
              />
              <ExpenseStatsCard 
                title="Maintenance" 
                amount={summaries.maintenance} 
                change="5.3" 
                changeType="decrease" 
                icon={<Truck size={20} className="text-green-600" />} 
                color="green"
              />
              <ExpenseStatsCard 
                title="Other Expenses" 
                amount={summaries.other} 
                change="3.1" 
                changeType="increase" 
                icon={<DollarSign size={20} className="text-red-600" />} 
                color="red"
              />
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 flex flex-col space-y-2">
                  <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                  >
                    <option value="All">All Categories</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Tolls">Tolls</option>
                    <option value="Office">Office</option>
                    <option value="Meals">Meals</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="flex-1 flex flex-col space-y-2">
                  <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                    Date Range
                  </label>
                  <select
                    id="date-filter"
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                  >
                    <option value="All">All Time</option>
                    <option value="This Month">This Month</option>
                    <option value="Last Month">Last Month</option>
                    <option value="This Quarter">This Quarter</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>
                
                {dateFilter === 'Custom' && (
                  <div className="flex-1 flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Custom Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="block flex-1 pl-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="block flex-1 pl-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex-none flex md:items-end">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <RefreshCw size={16} className="mr-2 inline-block" />
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
                
            {/* Expenses Table */}
            <div className="bg-white shadow overflow-hidden rounded-md">
              <div className="overflow-x-auto">
                {filteredExpenses.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                      <Receipt size={28} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm || categoryFilter !== 'All' || dateFilter !== 'All' 
                        ? "Try adjusting your search or filters." 
                        : "You haven't recorded any expenses yet."}
                    </p>
                    {!searchTerm && categoryFilter === 'All' && dateFilter === 'All' && (
                      <button
                        onClick={() => {
                          setCurrentExpense(null);
                          setFormModalOpen(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        <Plus size={16} className="mr-2" />
                        Record Your First Expense
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expense Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredExpenses.map(expense => (
                        <ExpenseItem 
                          key={expense.id} 
                          expense={expense} 
                          onEdit={handleEditExpense}
                          onDelete={handleDeleteExpense}
                        />
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="2" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          Total
                        </td>
                        <td colSpan="3" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          ${filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Expense Count */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
              <div>
                Showing <span className="font-medium">{filteredExpenses.length}</span> of{" "}
                <span className="font-medium">{expenses.length}</span> expenses
              </div>
              
              {/* Simple Pagination */}
              {filteredExpenses.length > 0 && (
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
      <ExpenseFormModal 
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setCurrentExpense(null);
        }}
        expense={currentExpense}
        onSave={handleSaveExpense}
      />
      
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={confirmDeleteExpense}
        expenseDescription={expenseToDelete?.description}
      />
    </div>
  );
}