"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu, X, ChevronDown, ChevronRight, FileText, Truck, Wallet,
  Users, Package, CheckCircle, Calculator, Fuel, MapPin,
  HelpCircle, Mail, MessageSquare, Sparkles, ArrowRight
} from "lucide-react";

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef(null);
  const supportRef = useRef(null);
  const featuresTimeoutRef = useRef(null);
  const supportTimeoutRef = useRef(null);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMenuOpen(false);
        setFeaturesOpen(false);
        setSupportOpen(false);
      }
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

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

  // Features organized by category
  const featureCategories = [
    {
      title: "Core Operations",
      features: [
        { icon: FileText, title: "Invoicing", href: "/features/invoicing", desc: "Professional invoices in seconds", color: "text-blue-600", bg: "bg-blue-50" },
        { icon: Truck, title: "Dispatching", href: "/features/dispatching", desc: "Manage loads & assignments", color: "text-green-600", bg: "bg-green-50" },
        { icon: Wallet, title: "Expense Tracking", href: "/features/expense-tracking", desc: "Monitor all expenses", color: "text-purple-600", bg: "bg-purple-50" },
      ]
    },
    {
      title: "Fleet & Compliance",
      features: [
        { icon: Package, title: "Fleet Tracking", href: "/features/fleet-tracking", desc: "Track all your vehicles", color: "text-orange-600", bg: "bg-orange-50" },
        { icon: CheckCircle, title: "Compliance", href: "/features/compliance", desc: "Stay DOT compliant", color: "text-emerald-600", bg: "bg-emerald-50" },
        { icon: Users, title: "Customer CRM", href: "/features/customer-management", desc: "Manage client relationships", color: "text-pink-600", bg: "bg-pink-50" },
      ]
    },
    {
      title: "Fuel & Taxes",
      features: [
        { icon: Calculator, title: "IFTA Calculator", href: "/features/ifta-calculator", desc: "Simplified tax filings", color: "text-indigo-600", bg: "bg-indigo-50", badge: "Popular" },
        { icon: Fuel, title: "Fuel Tracker", href: "/features/fuel-tracker", desc: "Track fuel consumption", color: "text-amber-600", bg: "bg-amber-50" },
        { icon: MapPin, title: "State Mileage", href: "/features/state-mileage", desc: "Track miles by state", color: "text-cyan-600", bg: "bg-cyan-50" },
      ]
    }
  ];

  // Support menu items
  const supports = [
    { icon: HelpCircle, title: "Help Center", href: "/faq", desc: "Find answers fast", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Mail, title: "Contact Us", href: "/contact", desc: "Get in touch", color: "text-green-600", bg: "bg-green-50" },
    { icon: MessageSquare, title: "Feedback", href: "/feedback", desc: "Share your thoughts", color: "text-purple-600", bg: "bg-purple-50" }
  ];

  // Handle hover with delay for better UX
  const handleFeaturesEnter = () => {
    if (featuresTimeoutRef.current) clearTimeout(featuresTimeoutRef.current);
    setSupportOpen(false);
    setFeaturesOpen(true);
  };

  const handleFeaturesLeave = () => {
    featuresTimeoutRef.current = setTimeout(() => {
      setFeaturesOpen(false);
    }, 150);
  };

  const handleSupportEnter = () => {
    if (supportTimeoutRef.current) clearTimeout(supportTimeoutRef.current);
    setFeaturesOpen(false);
    setSupportOpen(true);
  };

  const handleSupportLeave = () => {
    supportTimeoutRef.current = setTimeout(() => {
      setSupportOpen(false);
    }, 150);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100'
            : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/images/tc-name-tp-bg.png"
                  alt="Truck Command Logo"
                  width={140}
                  height={45}
                  className={`h-9 w-auto transition-all duration-300 ${scrolled ? 'scale-95' : 'scale-100'}`}
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            {mounted && !isMobile && (
              <div className="hidden lg:flex items-center space-x-1">
                {/* Features Dropdown */}
                <div
                  ref={featuresRef}
                  className="relative"
                  onMouseEnter={handleFeaturesEnter}
                  onMouseLeave={handleFeaturesLeave}
                >
                  <button
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      featuresOpen
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    aria-expanded={featuresOpen}
                    aria-haspopup="true"
                  >
                    <span>Features</span>
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Mega Menu Dropdown */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 transition-all duration-200 ${
                      featuresOpen
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-2'
                    }`}
                  >
                    <div className="w-[720px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                      {/* Dropdown Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-semibold">Powerful Features</h3>
                            <p className="text-blue-100 text-sm">Everything you need to run your trucking business</p>
                          </div>
                          <Link
                            href="/features"
                            className="flex items-center text-sm text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View All
                            <ArrowRight size={14} className="ml-1" />
                          </Link>
                        </div>
                      </div>

                      {/* Features Grid */}
                      <div className="p-6 grid grid-cols-3 gap-6">
                        {featureCategories.map((category, catIndex) => (
                          <div key={catIndex}>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                              {category.title}
                            </h4>
                            <div className="space-y-1">
                              {category.features.map((feature, i) => (
                                <Link
                                  key={i}
                                  href={feature.href}
                                  className="flex items-start p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                                >
                                  <div className={`p-2 rounded-lg ${feature.bg} ${feature.color} transition-transform group-hover:scale-110`}>
                                    <feature.icon size={18} />
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {feature.title}
                                      </span>
                                      {feature.badge && (
                                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">
                                          {feature.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">{feature.desc}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600">
                            <Sparkles size={16} className="text-yellow-500 mr-2" />
                            <span>New features added regularly</span>
                          </div>
                          <Link
                            href="/signup"
                            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Start Free Trial
                            <ChevronRight size={16} className="ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Link */}
                <Link
                  href="/pricing"
                  className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                >
                  Pricing
                </Link>

                {/* Support Dropdown */}
                <div
                  ref={supportRef}
                  className="relative"
                  onMouseEnter={handleSupportEnter}
                  onMouseLeave={handleSupportLeave}
                >
                  <button
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      supportOpen
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    aria-expanded={supportOpen}
                    aria-haspopup="true"
                  >
                    <span>Support</span>
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform duration-200 ${supportOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Support Dropdown */}
                  <div
                    className={`absolute right-0 top-full pt-2 transition-all duration-200 ${
                      supportOpen
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-2'
                    }`}
                  >
                    <div className="w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="p-3">
                        {supports.map((item, i) => (
                          <Link
                            key={i}
                            href={item.href}
                            className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                          >
                            <div className={`p-2 rounded-lg ${item.bg} ${item.color} transition-transform group-hover:scale-110`}>
                              <item.icon size={18} />
                            </div>
                            <div className="ml-3">
                              <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors block">
                                {item.title}
                              </span>
                              <span className="text-sm text-gray-500">{item.desc}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 flex items-center">
                          <Mail size={12} className="mr-1.5" />
                          support@truckcommand.com
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Desktop CTA Buttons */}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center"
                  >
                    Start Free Trial
                    <ArrowRight size={16} className="ml-1.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            {mounted && isMobile && (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Start Free
                </Link>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mounted && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
              menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMenuOpen(false)}
            aria-hidden={!menuOpen}
          />

          {/* Mobile Menu Panel */}
          <div
            className={`fixed top-0 right-0 w-full max-w-sm h-full bg-white z-50 shadow-2xl transition-transform duration-300 ease-out transform ${
              menuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ visibility: menuOpen ? 'visible' : 'hidden' }}
            aria-hidden={!menuOpen}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Image
                src="/images/tc-name-tp-bg.png"
                alt="Truck Command Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex flex-col h-[calc(100%-80px)] overflow-y-auto">
              <div className="flex-1 p-4 space-y-2">
                {/* Features Accordion */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFeaturesOpen(!featuresOpen)}
                    className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${
                      featuresOpen ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <BarChart3 size={20} className={featuresOpen ? 'text-blue-600' : 'text-gray-400'} />
                      <span className="ml-3 font-medium">Features</span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`transition-transform duration-200 ${featuresOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
                    />
                  </button>

                  <div className={`transition-all duration-300 ease-in-out ${featuresOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-3 bg-gray-50 space-y-1">
                      {featureCategories.map((category, catIndex) => (
                        <div key={catIndex} className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                            {category.title}
                          </h4>
                          {category.features.map((feature, i) => (
                            <Link
                              key={i}
                              href={feature.href}
                              className="flex items-center px-3 py-2.5 rounded-lg hover:bg-white transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <div className={`p-1.5 rounded-lg ${feature.bg} ${feature.color}`}>
                                <feature.icon size={16} />
                              </div>
                              <span className="ml-3 text-gray-700 font-medium">{feature.title}</span>
                              {feature.badge && (
                                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">
                                  {feature.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing Link */}
                <Link
                  href="/pricing"
                  className="flex items-center px-4 py-3.5 text-gray-700 font-medium hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <DollarSign size={20} className="text-gray-400" />
                  <span className="ml-3">Pricing</span>
                  <ChevronRight size={18} className="ml-auto text-gray-300" />
                </Link>

                {/* Support Accordion */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setSupportOpen(!supportOpen)}
                    className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${
                      supportOpen ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <HelpCircle size={20} className={supportOpen ? 'text-blue-600' : 'text-gray-400'} />
                      <span className="ml-3 font-medium">Support</span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`transition-transform duration-200 ${supportOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
                    />
                  </button>

                  <div className={`transition-all duration-300 ease-in-out ${supportOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-3 bg-gray-50 space-y-1">
                      {supports.map((item, i) => (
                        <Link
                          key={i}
                          href={item.href}
                          className="flex items-center px-3 py-2.5 rounded-lg hover:bg-white transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                            <item.icon size={16} />
                          </div>
                          <div className="ml-3">
                            <span className="text-gray-700 font-medium block">{item.title}</span>
                            <span className="text-xs text-gray-500">{item.desc}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                <Link
                  href="/signup"
                  className="flex items-center justify-center w-full px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Start Your Free Trial
                  <ArrowRight size={18} className="ml-2" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full px-4 py-3 text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Log in to your account
                </Link>
                <div className="flex items-center justify-center pt-2 text-xs text-gray-500">
                  <Shield size={12} className="mr-1.5 text-green-500" />
                  7-day free trial • No credit card required
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
