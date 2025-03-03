"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Menu, X, ChevronDown, FileText, Truck, Wallet, 
  Users, Package, CheckCircle, Calculator, Fuel, 
  HelpCircle, Mail, MessageSquare, ArrowRight, Star, Check
} from "lucide-react";

// Navigation component separated for better organization
const Navigation = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const featuresRef = useRef(null);
  const supportRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (featuresRef.current && !featuresRef.current.contains(event.target)) {
        setFeaturesOpen(false);
      }
      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setSupportOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Features menu items
  const features = [
    { icon: <FileText size={20} className="text-blue-600" />, title: "Invoicing", href: "/features/invoicing", desc: "Generate and track invoices" },
    { icon: <Truck size={20} className="text-blue-600" />, title: "Dispatching", href: "/features/dispatching", desc: "Manage fleet assignments" },
    { icon: <Wallet size={20} className="text-blue-600" />, title: "Expense Tracking", href: "/features/expense-tracking", desc: "Monitor all expenses" },
    { icon: <Users size={20} className="text-blue-600" />, title: "Customer Management", href: "/features/customer-management", desc: "Organize client information" },
    { icon: <Package size={20} className="text-blue-600" />, title: "Fleet Tracking", href: "/features/fleet-tracking", desc: "Real-time vehicle locations" },
    { icon: <CheckCircle size={20} className="text-blue-600" />, title: "Compliance Reports", href: "/features/compliance", desc: "Stay DOT compliant" },
    { icon: <Calculator size={20} className="text-blue-600" />, title: "IFTA Calculator", href: "/features/ifta-calculator", desc: "Simplify tax filings" },
    { icon: <Fuel size={20} className="text-blue-600" />, title: "Fuel Tracker", href: "/features/fuel-tracker", desc: "Track fuel consumption" }
  ];

  // Support menu items
  const supports = [
    { icon: <HelpCircle size={20} className="text-blue-600" />, title: "Help Center", href: "/help" },
    { icon: <Mail size={20} className="text-blue-600" />, title: "Contact Us", href: "/contact" },
    { icon: <MessageSquare size={20} className="text-blue-600" />, title: "Feedback", href: "/feedback" }
  ];

  return (
    <nav className={`sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-md border-b border-gray-200 transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}>
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/tc-name-tp-bg.png"
            alt="Truck Command Logo"
            width={120}
            height={40}
            className={`h-10 mr-3 transition-all duration-300 ${scrolled ? 'scale-95' : 'scale-100'}`}
          />
        </Link>
      </div>

      {isMobile ? (
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-[#00D9FF] border border-gray-300 rounded px-2 py-1 transition-colors">Login</Link>
          <Link href="/signup" className="px-1 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF] transition-colors">
            Get Started
          </Link>
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="p-2 text-gray-600 focus:outline-none"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-6">
          <div ref={featuresRef} className="relative inline-block">
            <button 
              onClick={() => {
                setFeaturesOpen(!featuresOpen);
                setSupportOpen(false);
              }} 
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
              aria-expanded={featuresOpen}
              aria-haspopup="true"
            >
              <span>Features</span>
              <ChevronDown size={20} className={`ml-1 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {featuresOpen && (
              <div className="absolute left-0 top-full mt-1 w-96 bg-white rounded-md shadow-lg z-20 animate-fadeIn">
                <div className="p-4 grid grid-cols-2 gap-4">
                  {features.map((feature, i) => (
                    <a 
                      key={i} 
                      href={feature.href} 
                      className="flex items-start px-4 py-3 border border-blue-100 rounded hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                    >
                      <div className="mr-3 mt-1 text-blue-500 group-hover:text-blue-700 transition-colors">
                        {feature.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                          {feature.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{feature.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link href="/pricing" className="text-gray-600 hover:text-[#00D9FF] transition-colors">Pricing</Link>
          
          <div ref={supportRef} className="relative inline-block">
            <button
              onClick={() => {
                setSupportOpen(!supportOpen);
                setFeaturesOpen(false);
              }}
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
              aria-expanded={supportOpen}
              aria-haspopup="true"
            >
              <span>Support</span>
              <ChevronDown size={20} className={`ml-1 transition-transform ${supportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {supportOpen && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-md shadow-lg z-20 animate-fadeIn">
                <div className="p-4 space-y-2">
                  {supports.map((support, i) => (
                    <a 
                      key={i} 
                      href={support.href} 
                      className="flex items-center px-4 py-3 border border-blue-100 rounded hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                    >
                      <div className="mr-3 text-blue-500 group-hover:text-blue-700 transition-colors">
                        {support.icon}
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                        {support.title}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link 
            href="/login" 
            className="text-gray-600 hover:text-[#00D9FF] border border-gray-300 hover:border-[#00D9FF] rounded px-4 py-2 transition-all duration-200"
          >
            Login
          </Link>
          
          <Link 
            href="/signup" 
            className="px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF] transition-colors shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>
      )}

      {/* Mobile Menu Slide-In */}
      {isMobile && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      {isMobile && (
        <div className={`fixed top-0 right-0 w-72 h-full bg-white shadow-lg z-50 p-6 flex flex-col space-y-6 transition-transform duration-300 transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center">
            <Image
              src="/images/tc-name-tp-bg.png"
              alt="Truck Command Logo"
              width={100}
              height={33}
              className="h-8"
            />
            <button 
              onClick={() => setMenuOpen(false)} 
              className="text-gray-600 focus:outline-none"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <Link 
              href="/pricing" 
              className="block py-3 text-gray-700 hover:text-[#00D9FF] border-b border-gray-100" 
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            
            <button 
              onClick={() => setFeaturesOpen(!featuresOpen)} 
              className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-[#00D9FF] border-b border-gray-100 focus:outline-none"
            >
              <span>Features</span>
              <ChevronDown size={20} className={`transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {featuresOpen && (
              <div className="space-y-1 py-2 pl-4">
                {features.map((feature, i) => (
                  <Link 
                    key={i}
                    href={feature.href} 
                    className="flex items-center py-2 text-gray-600 hover:text-[#00D9FF]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mr-2">{feature.icon}</span>
                    <span>{feature.title}</span>
                  </Link>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setSupportOpen(!supportOpen)} 
              className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-[#00D9FF] border-b border-gray-100 focus:outline-none"
            >
              <span>Support</span>
              <ChevronDown size={20} className={`transition-transform ${supportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {supportOpen && (
              <div className="space-y-1 py-2 pl-4">
                {supports.map((support, i) => (
                  <Link 
                    key={i}
                    href={support.href} 
                    className="flex items-center py-2 text-gray-600 hover:text-[#00D9FF]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mr-2">{support.icon}</span>
                    <span>{support.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-auto space-y-4">
            <Link 
              href="/login" 
              className="block text-center text-gray-700 border border-gray-300 rounded-md py-3 hover:border-[#00D9FF] hover:text-[#00D9FF] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
            
            <Link 
              href="/signup" 
              className="block text-center bg-[#007BFF] text-white rounded-md py-3 hover:bg-[#00D9FF] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('yearly');

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Navigation */}
      <Navigation />

      {/* Pricing Hero Section */}
      <section className="relative py-16 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Choose the right plan for your trucking business. No hidden fees. No long-term contracts. Scale as you grow.</p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8 space-x-4">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'font-bold' : 'opacity-80'}`}>Monthly</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={billingCycle === 'yearly'}
                onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              />
              <div className="w-14 h-7 bg-white rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-blue-600 after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
            <div className="flex flex-col items-start">
              <span className={`text-lg ${billingCycle === 'yearly' ? 'font-bold' : 'opacity-80'}`}>Yearly</span>
              <span className="text-sm bg-green-500 text-white px-2 py-0.5 rounded-full">Save 20%</span>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 -mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-16">
            {/* Owner-Operators Section */}
            <div>
              <h3 className="text-3xl font-bold mb-8 text-center inline-block relative">
                Owner-Operators <span className="text-gray-500">(1–2 Trucks)</span>
                <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {/* Basic Plan */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="p-8 border-b border-gray-100">
                    <h4 className="text-2xl font-semibold mb-4">Basic Plan</h4>
                    <div className="flex items-baseline">
                      <p className="text-5xl font-bold">
                        ${billingCycle === 'monthly' ? '19' : '16'}
                      </p>
                      <span className="text-xl ml-1">/mo</span>
                    </div>
                    <p className="text-gray-600 mt-2">
                      {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed $190 yearly (save $38)'}
                    </p>
                    <div className="mt-4 bg-green-100 text-green-800 py-2 px-3 rounded-lg inline-flex items-center">
                      <CheckCircle size={16} className="mr-1" />
                      <span>7-day free trial</span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Basic Invoicing & Dispatching</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Simple Expense Tracking</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Standard Reports</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Single User Account</span>
                      </li>
                      <li className="flex items-start opacity-50">
                        <X size={20} className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Advanced IFTA Tools</span>
                      </li>
                      <li className="flex items-start opacity-50">
                        <X size={20} className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Load Optimization</span>
                      </li>
                    </ul>
                    
                    <a
                      href="/signup?plan=basic"
                      className="block w-full text-center mt-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Start Free Trial
                    </a>
                  </div>
                </div>
                
                {/* Premium Plan */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="absolute top-0 right-0">
                    <div className="bg-orange-500 text-white transform rotate-45 text-center text-sm py-1 px-8 translate-x-8 translate-y-4">
                      Popular
                    </div>
                  </div>
                  
                  <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                    <h4 className="text-2xl font-semibold mb-4">Premium Plan</h4>
                    <div className="flex items-baseline">
                      <p className="text-5xl font-bold">
                        ${billingCycle === 'monthly' ? '39' : '33'}
                      </p>
                      <span className="text-xl ml-1">/mo</span>
                    </div>
                    <p className="text-gray-600 mt-2">
                      {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed $390 yearly (save $78)'}
                    </p>
                    <div className="mt-4 bg-green-100 text-green-800 py-2 px-3 rounded-lg inline-flex items-center">
                      <CheckCircle size={16} className="mr-1" />
                      <span>7-day free trial</span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Advanced Invoicing & Dispatching</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Comprehensive Expense Tracking</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Advanced Reports & Analytics</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Customer Management System</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Advanced IFTA Calculator</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Priority Email Support</span>
                      </li>
                    </ul>
                    
                    <a
                      href="/signup?plan=premium"
                      className="block w-full text-center mt-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Start Free Trial
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fleet Plans Section */}
            <div>
              <h3 className="text-3xl font-bold mb-8 text-center inline-block relative">
                Fleet Plans
                <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                {/* 3–8 Trucks */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="p-8 border-b border-gray-100">
                    <h4 className="text-2xl font-semibold mb-2">Small Fleet</h4>
                    <p className="text-gray-600 mb-4">3–8 Trucks</p>
                    <div className="flex items-baseline">
                      <p className="text-5xl font-bold">
                        ${billingCycle === 'monthly' ? '69' : '55'}
                      </p>
                      <span className="text-xl ml-1">/mo</span>
                    </div>
                    <p className="text-gray-600 mt-2">
                      {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed $660 yearly (save $168)'}
                    </p>
                  </div>
                  
                  <div className="p-8">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>All Premium Features</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Fleet Management Tools</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Real-time GPS Tracking</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Team Access (1 User per 2 Trucks)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Fuel & Load Optimizations</span>
                      </li>
                    </ul>
                    
                    <a
                      href="/signup?plan=small-fleet"
                      className="block w-full text-center mt-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Get Started
                    </a>
                  </div>
                </div>
                
                {/* 9–14 Trucks */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="p-8 border-b border-gray-100">
                    <h4 className="text-2xl font-semibold mb-2">Medium Fleet</h4>
                    <p className="text-gray-600 mb-4">9–14 Trucks</p>
                    <div className="flex items-baseline">
                      <p className="text-5xl font-bold">
                        ${billingCycle === 'monthly' ? '159' : '127'}
                      </p>
                      <span className="text-xl ml-1">/mo</span>
                    </div>
                    <p className="text-gray-600 mt-2">
                      {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed $1,524 yearly (save $384)'}
                    </p>
                  </div>
                  
                  <div className="p-8">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>All Small Fleet Features</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Enhanced Fleet Reporting</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Performance Analytics</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>More User Seats</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Priority Support</span>
                      </li>
                    </ul>
                    
                    <a
                      href="/signup?plan=medium-fleet"
                      className="block w-full text-center mt-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Get Started
                    </a>
                  </div>
                </div>
                
                {/* 15–24 Trucks */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="p-8 border-b border-gray-100">
                    <h4 className="text-2xl font-semibold mb-2">Large Fleet</h4>
                    <p className="text-gray-600 mb-4">15–24 Trucks</p>
                    <div className="flex items-baseline">
                      <p className="text-5xl font-bold">
                        ${billingCycle === 'monthly' ? '219' : '175'}
                      </p>
                      <span className="text-xl ml-1">/mo</span>
                    </div>
                    <p className="text-gray-600 mt-2">
                      {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed $2,100 yearly (save $528)'}
                    </p>
                  </div>
                  
                  <div className="p-8">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>All Medium Fleet Features</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Comprehensive Analytics</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Custom Integrations</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Dedicated Support Team</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span>Training Resources</span>
                      </li>
                    </ul>
                    
                    <a
                      href="/signup?plan=large-fleet"
                      className="block w-full text-center mt-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enterprise Plan Section */}
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl text-white shadow-xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-3xl opacity-10 transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full filter blur-3xl opacity-10 transform -translate-x-1/3 translate-y-1/2"></div>
              
              <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-8 md:mb-0 md:w-2/3">
                    <div className="flex items-center">
                      <div className="mr-4 p-2 bg-white bg-opacity-20 rounded-lg">
                        <Star size={28} className="text-yellow-300" />
                      </div>
                      <h3 className="text-3xl font-bold">Enterprise Plan</h3>
                    </div>
                    <p className="mt-4 text-xl">For large operations with 25+ trucks</p>
                    <ul className="mt-6 space-y-2">
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>Customized Solutions & Pricing</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>API Access & Custom Integrations</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>AI-Powered Route Optimization</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>White-Labeling Options</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>Dedicated Account Manager</span>
                      </li>
                    </ul>
                  </div>
                  <div className="text-center bg-white bg-opacity-10 p-6 rounded-lg">
                    <p className="text-lg font-semibold mb-4">Contact our sales team for a custom quote</p>
                    <a
                      href="/contact-sales"
                      className="block w-full text-center px-6 py-3 bg-white text-blue-800 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold transform hover:scale-105"
                    >
                      Request Demo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Comparison */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold mb-8 text-center inline-block relative">
              Feature Comparison
              <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
            </h3>
            <div className="overflow-x-auto mt-10">
              <table className="w-full bg-white rounded-lg shadow-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left">Feature</th>
                    <th className="px-6 py-4 text-center">Basic</th>
                    <th className="px-6 py-4 text-center">Premium</th>
                    <th className="px-6 py-4 text-center">Fleet Plans</th>
                    <th className="px-6 py-4 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">Invoicing</td>
                    <td className="px-6 py-4 text-center">Basic</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                    <td className="px-6 py-4 text-center">Custom</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Dispatching</td>
                    <td className="px-6 py-4 text-center">Basic</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                    <td className="px-6 py-4 text-center">Custom</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Expense Tracking</td>
                    <td className="px-6 py-4 text-center">Basic</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                    <td className="px-6 py-4 text-center">Custom</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">IFTA Calculator</td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Fleet Tracking</td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center">Basic</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                    <td className="px-6 py-4 text-center">Advanced</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Multi-User Access</td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">API Access</td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center">Limited</td>
                    <td className="px-6 py-4 text-center">Full</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">White-Labeling</td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold mb-8 text-center inline-block relative">
            Frequently Asked Questions
            <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
          </h3>
          
          <div className="space-y-6 mt-10">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-3">Can I upgrade or downgrade my plan at any time?</h4>
              <p className="text-gray-600">Yes, you can upgrade your plan at any time and the changes will take effect immediately. Downgrades will be applied at the start of your next billing cycle.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-3">Do you offer discounts for annual payments?</h4>
              <p className="text-gray-600">Yes, you&apos;ll save 20% when you choose annual billing for any of our plans.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-3">What happens after my free trial ends?</h4>
              <p className="text-gray-600">After your 7-day free trial, you&apos;ll automatically be billed for the plan you selected. Don&apos;t worry - we&apos;ll send you a reminder before your trial ends.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-3">Can I get a refund if I&apos;m not satisfied?</h4>
              <p className="text-gray-600">Yes, we offer a 30-day money-back guarantee if you&apos;re not completely satisfied with our service.</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Still have questions?</p>
            <a href="/contact" className="inline-block px-6 py-3 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200 transition-colors">
              Contact Our Support Team
            </a>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Start Managing Your Business Better</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of trucking businesses that have increased their efficiency and profitability with Truck Command.
          </p>
          <p className="text-2xl font-semibold mb-8">
            Sign up today and get a <span className="text-yellow-300 font-bold">7-day free trial!</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a 
              href="/signup" 
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-lg text-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              Start Your Free Trial
            </a>
            <a 
              href="/demo" 
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Request Demo
            </a>
          </div>
          <p className="mt-6 text-blue-200">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#222222] text-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <Image
                src="/images/tc-name-tp-bg.png"
                alt="Truck Command Logo"
                width={150}
                height={50}
                className="h-12 mb-6"
              />
              <p className="text-gray-400 mb-4">
                Efficiency in Motion, Profit in Command
              </p>
              <div className="flex space-x-4">
                {/* Social media icons would go here */}
                <a href="#" className="text-gray-400 hover:text-white transition-colors">FB</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">TW</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">IG</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">LI</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-3">
                <li><a href="/features/invoicing" className="text-gray-400 hover:text-white transition-colors">Invoicing</a></li>
                <li><a href="/features/dispatching" className="text-gray-400 hover:text-white transition-colors">Dispatching</a></li>
                <li><a href="/features/expense-tracking" className="text-gray-400 hover:text-white transition-colors">Expense Tracking</a></li>
                <li><a href="/features/fleet-tracking" className="text-gray-400 hover:text-white transition-colors">Fleet Tracking</a></li>
                <li><a href="/features/compliance" className="text-gray-400 hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">&copy; 2025 Truck Command. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}