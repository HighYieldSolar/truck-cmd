"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Menu, X, ChevronDown, FileText, Truck, Wallet, 
  Users, Package, CheckCircle, Calculator, Fuel, 
  HelpCircle, Mail, MessageSquare, Home
} from "lucide-react";

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Support menu items - Updated to include FAQ
  const supports = [
    { icon: <HelpCircle size={20} className="text-blue-600" />, title: "FAQ", href: "/faq" },
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
          {/* Home button */}
          <Link href="/" className="text-gray-600 hover:text-[#00D9FF] transition-colors flex items-center">
            <Home size={18} className="mr-1" />
            <span>Home</span>
          </Link>
          
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
            {/* Home link in mobile menu */}
            <Link 
              href="/" 
              className="flex items-center py-3 text-gray-700 hover:text-[#00D9FF] border-b border-gray-100" 
              onClick={() => setMenuOpen(false)}
            >
              <Home size={20} className="mr-2" />
              <span>Home</span>
            </Link>
            
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
}