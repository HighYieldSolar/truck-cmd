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
  Clock,
  Calendar,
  Clipboard,
  Wrench,
  RefreshCw,
  ChevronRight,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Map,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart2,
  Sliders,
  Droplet,
  ThermometerSun,
  GitMerge,
  Flag,
  Tag,
  MapPin,
  PieChart,
  Upload,
  HelpCircle,
  AlertCircle,
  Check,
  X,
  Info
} from "lucide-react";

// Sidebar component for the dashboard
const Sidebar = ({ activePage = "fleet" }) => {
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

// Stats card component
const StatsCard = ({ title, value, icon, change, changeType, subtitle }) => {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-md bg-blue-100">
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="mt-3 flex items-center">
          {changeType === 'increase' ? (
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
          ) : (
            <ArrowDownRight size={16} className="text-red-500 mr-1" />
          )}
          <span className={`text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
};

// Fleet card component for showing vehicle type categories
const FleetCard = ({ title, count, icon, available, unavailable, color = "blue" }) => {
  const availablePercentage = Math.round((available / count) * 100);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border-t-4 border-blue-500 hover:shadow-md transition-shadow">
      <div className="px-5 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`p-2 rounded-md bg-${color}-100 mr-3`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-500 text-sm">{count} units</p>
            </div>
          </div>
          <Link 
            href={`/dashboard/fleet/${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-blue-600 hover:text-blue-800"
          >
            <ChevronRight size={20} />
          </Link>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Availability</span>
            <span className="font-medium">{availablePercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${availablePercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600">{available} Available</span>
            <span className="text-red-600">{unavailable} Unavailable</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center">
            View All <ChevronRight size={14} className="ml-1" />
          </button>
          <button className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center">
            <PlusCircle size={14} className="mr-1" />
            Add New
          </button>
        </div>
      </div>
    </div>
  );
};

// Vehicle status indicator component
const VehicleStatusBadge = ({ status }) => {
  let colorClass = '';
  
  switch (status.toLowerCase()) {
    case 'active':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'in maintenance':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'out of service':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'idle':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
      {status}
    </span>
  );
};

// Vehicle card component for the active fleet view
const VehicleCard = ({ vehicle }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
      <div className="relative">
        <div className="h-28 bg-gray-200 flex items-center justify-center">
          {/* Placeholder for vehicle image */}
          <Truck size={48} className="text-gray-400" />
        </div>
        <div className="absolute top-2 right-2">
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{vehicle.name}</h3>
            <p className="text-sm text-gray-500">
              {vehicle.make} {vehicle.model} • {vehicle.year}
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical size={18} />
          </button>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Vin</p>
            <p className="font-medium">{vehicle.vin.slice(-6)}</p>
          </div>
          <div>
            <p className="text-gray-500">License</p>
            <p className="font-medium">{vehicle.license}</p>
          </div>
          <div>
            <p className="text-gray-500">Odometer</p>
            <p className="font-medium">{vehicle.odometer.toLocaleString()} mi</p>
          </div>
          <div>
            <p className="text-gray-500">Last Service</p>
            <p className="font-medium">{vehicle.lastService}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
          <Link 
            href={`/dashboard/fleet/vehicle/${vehicle.id}`} 
            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
          >
            View Details <ChevronRight size={14} className="ml-1" />
          </Link>
          
          <Link 
            href={`/dashboard/fleet/maintenance/schedule/${vehicle.id}`} 
            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
          >
                          <Wrench size={14} className="mr-1" />
            Maintenance
          </Link>
        </div>
      </div>
    </div>
  );
};

// Maintenance alert component
const MaintenanceAlert = ({ alert }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
      <div className="flex items-start">
        <div className="p-2 rounded-full bg-yellow-100 mr-3 flex-shrink-0">
          <AlertTriangle size={16} className="text-yellow-600" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
            <p className="text-xs text-gray-500">Due {alert.dueDate}</p>
          </div>
          <p className="text-xs text-gray-600 mt-1">{alert.vehicle}</p>
          
          <div className="mt-2 flex items-center">
            <p className="text-xs text-gray-500 mr-4">
              <span className="font-medium">Odometer:</span> {alert.currentOdometer.toLocaleString()} mi
              {alert.targetOdometer && ` / ${alert.targetOdometer.toLocaleString()} mi`}
            </p>
            {alert.urgency === 'high' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Urgent
              </span>
            )}
          </div>
          
          <div className="mt-3 flex justify-between">
            <button className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center">
              <Check size={14} className="mr-1" />
              Mark Complete
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center">
              <Calendar size={14} className="mr-1" />
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fuel efficiency card component
const FuelEfficiencyCard = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Fuel Efficiency</h3>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-500">Fleet Average MPG</p>
            <p className="text-3xl font-bold text-gray-900">{data.fleetAvgMpg.toFixed(1)}</p>
          </div>
          <div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
              data.mpgTrend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {data.mpgTrend > 0 ? (
                <ArrowUpRight size={14} className="mr-1" />
              ) : (
                <ArrowDownRight size={14} className="mr-1" />
              )}
              {Math.abs(data.mpgTrend).toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {data.vehicles.map((vehicle, index) => (
            <div key={index} className="flex items-center">
              <div className="w-28 flex-shrink-0">
                <p className="text-sm text-gray-600 truncate">{vehicle.name}</p>
              </div>
              <div className="flex-1 mx-2">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      vehicle.mpg > data.targetMpg ? 'bg-green-500' : 
                      vehicle.mpg > data.fleetAvgMpg ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${(vehicle.mpg / 12) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 text-right">
                <p className="text-sm font-medium text-gray-900">{vehicle.mpg.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-gray-600">Above Target</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-gray-600">Above Average</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-gray-600">Below Average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recent activity component
const RecentActivity = ({ activities }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <Link href="/dashboard/fleet/activity" className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity, index) => (
          <div key={index} className="p-5">
            <div className="flex">
              <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                activity.type === 'maintenance' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'issue' ? 'bg-red-100 text-red-600' :
                activity.type === 'fuel' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {                activity.type === 'maintenance' ? <Wrench size={16} /> :
                 activity.type === 'issue' ? <AlertCircle size={16} /> :
                 activity.type === 'fuel' ? <Fuel size={16} /> :
                 <Truck size={16} />
                }
              </div>
              <div className="flex-1">
                <div className="flex justify-between flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{activity.vehicle}</p>
                {activity.details && (
                  <p className="text-xs text-gray-500 mt-2">{activity.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Expense overview component
const ExpenseOverview = ({ expenses }) => {
  // Calculate totals
  const total = expenses.reduce((sum, category) => sum + category.amount, 0);
  
  // Function to calculate the percentage width for the bar graph
  const getWidth = (amount) => {
    return `${(amount / total) * 100}%`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Fleet Expenses</h3>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">YTD Spending</p>
          <p className="text-xl font-bold text-gray-900">${total.toLocaleString()}</p>
        </div>
        
        <div className="space-y-4">
          {expenses.map((category, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 bg-${category.color}-500`}></div>
                  <span className="text-gray-700">{category.name}</span>
                </div>
                <span className="font-medium text-gray-900">${category.amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`bg-${category.color}-500 h-2.5 rounded-full`} 
                  style={{ width: getWidth(category.amount) }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link 
            href="/dashboard/expenses?category=fleet" 
            className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
          >
            View Detailed Expenses <ChevronRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Main Fleet Management Dashboard Component
export default function FleetManagementPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fleetStats, setFleetStats] = useState({
    totalVehicles: 12,
    activeVehicles: 9,
    utilizationRate: 75,
    avgMPG: 6.8,
    maintenanceDue: 3
  });
  
  // Sample fleet categories data
  const [fleetCategories, setFleetCategories] = useState([
    {
      title: "Class 8 Trucks",
      count: 6,
      icon: <Truck size={20} className="text-blue-600" />,
      available: 4,
      unavailable: 2
    },
    {
      title: "Box Trucks",
      count: 3,
      icon: <Package size={20} className="text-green-600" />,
      available: 3,
      unavailable: 0
    },
    {
      title: "Trailers",
      count: 8,
      icon: <GitMerge size={20} className="text-purple-600" />,
      available: 6,
      unavailable: 2
    },
    {
      title: "Service Vehicles",
      count: 2,
      icon: <Wrench size={20} className="text-orange-600" />,
      available: 2,
      unavailable: 0
    }
  ]);
  
  // Sample vehicles data
  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      name: "Truck #101",
      make: "Freightliner",
      model: "Cascadia",
      year: 2022,
      vin: "1FUJGBDV7CLBP8834",
      license: "TX-45678",
      status: "Active",
      odometer: 32450,
      lastService: "Jan 15, 2025"
    },
    {
      id: 2,
      name: "Truck #102",
      make: "Peterbilt",
      model: "579",
      year: 2023,
      vin: "2NPWL70X55M860414",
      license: "TX-78901",
      status: "Active",
      odometer: 28750,
      lastService: "Feb 02, 2025"
    },
    {
      id: 3,
      name: "Truck #103",
      make: "Kenworth",
      model: "T680",
      year: 2021,
      vin: "3HSDJAPR7CN594251",
      license: "TX-12345",
      status: "In Maintenance",
      odometer: 45620,
      lastService: "Feb 28, 2025"
    },
    {
      id: 4,
      name: "Truck #104",
      make: "Volvo",
      model: "VNL 860",
      year: 2022,
      vin: "4V4NC9EH6MN265442",
      license: "TX-23456",
      status: "Active",
      odometer: 35890,
      lastService: "Jan 30, 2025"
    }
  ]);
  
  // Sample maintenance alerts
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([
    {
      title: "Oil Change Due",
      vehicle: "Truck #103 - Kenworth T680",
      dueDate: "Mar 9, 2025",
      currentOdometer: 45620,
      targetOdometer: 50000,
      urgency: "medium"
    },
    {
      title: "Annual DOT Inspection",
      vehicle: "Truck #101 - Freightliner Cascadia",
      dueDate: "Mar 15, 2025",
      currentOdometer: 32450,
      urgency: "high"
    },
    {
      title: "Tire Rotation",
      vehicle: "Truck #102 - Peterbilt 579",
      dueDate: "Mar 20, 2025",
      currentOdometer: 28750,
      targetOdometer: 30000,
      urgency: "low"
    }
  ]);
  
  // Sample fuel efficiency data
  const [fuelEfficiency, setFuelEfficiency] = useState({
    fleetAvgMpg: 6.8,
    mpgTrend: 2.5, // positive means improvement
    targetMpg: 7.5,
    vehicles: [
      { name: "Truck #101", mpg: 7.2 },
      { name: "Truck #102", mpg: 6.9 },
      { name: "Truck #103", mpg: 6.3 },
      { name: "Truck #104", mpg: 7.8 }
    ]
  });
  
  // Sample activities
  const [activities, setActivities] = useState([
    {
      type: "maintenance",
      title: "Completed Oil Change",
      vehicle: "Truck #102 - Peterbilt 579",
      time: "2h ago",
      details: "Changed oil and replaced oil filter."
    },
    {
      type: "issue",
      title: "Check Engine Light",
      vehicle: "Truck #103 - Kenworth T680",
      time: "1d ago",
      details: "Driver reported check engine light came on during route."
    },
    {
      type: "fuel",
      title: "Fuel Purchase",
      vehicle: "Truck #101 - Freightliner Cascadia",
      time: "1d ago",
      details: "Added 150 gallons at $3.45/gal."
    }
  ]);
  
  // Sample expense data
  const [expenses, setExpenses] = useState([
    { name: "Fuel", amount: 45000, color: "blue" },
    { name: "Maintenance", amount: 18500, color: "green" },
    { name: "Repairs", amount: 12300, color: "yellow" },
    { name: "Insurance", amount: 9800, color: "red" },
    { name: "Permits & Licenses", amount: 4200, color: "purple" }
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
          // In a real app, you would fetch fleet data here
          // fetchFleetData(user.id);
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
      <Sidebar activePage="fleet" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Fleet Management</h1>
          </div>
          
          <div className="flex items-center">
            <div className="relative flex-1 max-w-md mr-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search vehicles..."
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
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Track and manage your entire fleet from this dashboard. Monitor vehicle status, schedule maintenance, and analyze performance metrics.
                  </p>
                </div>
              </div>
            </div>

            {/* Fleet Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Total Vehicles" 
                value={fleetStats.totalVehicles}
                icon={<Truck size={20} className="text-blue-600" />}
              />
              <StatsCard 
                title="Active Vehicles" 
                value={fleetStats.activeVehicles} 
                icon={<Activity size={20} className="text-green-600" />}
                change="+1 from last week" 
                changeType="increase"
              />
              <StatsCard 
                title="Fleet Utilization" 
                value={`${fleetStats.utilizationRate}%`} 
                icon={<PieChart size={20} className="text-purple-600" />}
                subtitle="Based on active vehicles"
              />
              <StatsCard 
                title="Maintenance Due" 
                value={fleetStats.maintenanceDue} 
                icon={<Wrench size={20} className="text-red-600" />}
                change="+2 from last week" 
                changeType="increase"
              />
            </div>

            {/* Fleet Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fleetCategories.map((category, index) => (
                <FleetCard 
                  key={index}
                  title={category.title}
                  count={category.count}
                  icon={category.icon}
                  available={category.available}
                  unavailable={category.unavailable}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-blue-100 mb-2">
                    <PlusCircle size={18} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Add Vehicle</span>
                </button>
                
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-green-100 mb-2">
                    <Wrench size={18} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Schedule Maintenance</span>
                </button>
                
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-purple-100 mb-2">
                    <Clipboard size={18} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Inspection Report</span>
                </button>
                
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="p-2 rounded-full bg-yellow-100 mb-2">
                    <Fuel size={18} className="text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Log Fuel Purchase</span>
                </button>
              </div>
            </div>

            {/* Active Fleet */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Fleet</h2>
                <div className="flex items-center space-x-3">
                  <select className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm">
                    <option value="all">All Vehicles</option>
                    <option value="trucks">Trucks Only</option>
                    <option value="trailers">Trailers Only</option>
                    <option value="service">Service Vehicles</option>
                  </select>
                  <Link 
                    href="/dashboard/fleet/all" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </div>

            {/* Maintenance Alerts */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Alerts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {maintenanceAlerts.map((alert, index) => (
                  <MaintenanceAlert key={index} alert={alert} />
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FuelEfficiencyCard data={fuelEfficiency} />
              <ExpenseOverview expenses={expenses} />
            </div>

            {/* Recent Activity */}
            <RecentActivity activities={activities} />
          </div>
        </main>
      </div>
    </div>
  );
}