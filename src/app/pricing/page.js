"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FileText, Truck, Wallet, Users, Package, CheckCircle, Calculator, Fuel, HelpCircle, Mail, MessageSquare, Home } from "lucide-react";

export default function PricingPage() {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const featuresRef = useRef(null);
  const supportRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event) {
      if (featuresRef.current && !featuresRef.current.contains(event.target)) {
        setFeaturesOpen(false);
      }
      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setSupportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center">
          {/* Logo as a button linking to the homepage */}
          <Link href="/" className="flex items-center">
           <Image
             src="/images/tc-name-tp-bg.png"
             alt="Truck Command Logo"
             width={120} // Adjust width
             height={40} // Adjust height
             className="h-10 mr-3"
          />
          </Link>
        </div>
        <div className="flex items-center space-x-6">
          {/* Home Page Link */}
            <Link href="/" className="text-gray-600 hover:text-[#00D9FF]">
            Home
            </Link>
          {/* Features Dropdown */}
          <div ref={featuresRef} className="relative inline-block">
            <button
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
            >
              <span>Features</span>
              <svg className="w-4 h-4 ml-1 fill-current" viewBox="0 0 20 20">
                <path d="M5.516 7.548l4.484 4.484 4.484-4.484L16 8.548l-6 6-6-6z" />
              </svg>
            </button>
            {featuresOpen && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-md shadow-lg z-20">
                <div className="p-4 grid grid-cols-2 gap-4">
                  {[
                    { icon: <FileText size={20} className="text-blue-600" />, title: "Invoicing", href: "/features/invoicing" },
                    { icon: <Truck size={20} className="text-blue-600" />, title: "Dispatching", href: "/features/dispatching" },
                    { icon: <Wallet size={20} className="text-blue-600" />, title: "Expense Tracking", href: "/features/expense-tracking" },
                    { icon: <Users size={20} className="text-blue-600" />, title: "Customer Management", href: "/features/customer-management" },
                    { icon: <Package size={20} className="text-blue-600" />, title: "Fleet Tracking", href: "/features/fleet-tracking" },
                    { icon: <CheckCircle size={20} className="text-blue-600" />, title: "Compliance Reports", href: "/features/compliance" },
                    { icon: <Calculator size={20} className="text-blue-600" />, title: "IFTA Calculator", href: "/features/ifta-calculator" },
                    { icon: <Fuel size={20} className="text-blue-600" />, title: "Fuel Tracker", href: "/features/fuel-tracker" }
                  ].map((feature, i) => (
                    <a key={i} href={feature.href} className="flex items-center px-4 py-2 border border-blue-500 rounded hover:bg-gray-100 space-x-2">
                      {feature.icon}
                      <span>{feature.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Link */}
          <a href="/pricing" className="text-gray-600 hover:text-[#00D9FF]">
            Pricing
          </a>

          {/* Support Dropdown */}
          <div ref={supportRef} className="relative inline-block">
            <button
              onClick={() => setSupportOpen(!supportOpen)}
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
            >
              <span>Support</span>
              <svg className="w-4 h-4 ml-1 fill-current" viewBox="0 0 20 20">
                <path d="M5.516 7.548l4.484 4.484 4.484-4.484L16 8.548l-6 6-6-6z" />
              </svg>
            </button>
            {supportOpen && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-md shadow-lg z-20">
                <div className="p-4 space-y-2">
                  {[
                    { icon: <HelpCircle size={20} className="text-blue-600" />, title: "Help Center", href: "/help" },
                    { icon: <Mail size={20} className="text-blue-600" />, title: "Contact Us", href: "/contact" },
                    { icon: <MessageSquare size={20} className="text-blue-600" />, title: "Feedback", href: "/feedback" }
                  ].map((support, i) => (
                    <a key={i} href={support.href} className="flex items-center px-4 py-2 border border-blue-500 rounded hover:bg-gray-100 space-x-2">
                      {support.icon}
                      <span>{support.title}</span>
                    </a>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Login and Get Started */}
          <a
            href="/login"
            className="text-gray-600 hover:text-[#00D9FF] border border-gray-300 rounded px-3 py-1"
          >
            Login
          </a>
          <a
            href="/signup"
            className="px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#222222] mb-8">Pricing</h2>
          <div className="space-y-12">
            {/* Owner-Operators Section */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                Owner-Operators (1–2 Trucks)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Plan */}
                <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
                  <h4 className="text-2xl font-semibold mb-4">Basic Plan</h4>
                  <p className="text-4xl font-bold mb-4">
                    $19<span className="text-xl">/mo</span>
                  </p>
                  <p className="text-lg mb-4">
                    ($190/year){" "}
                    <span className="text-green-500">✅ 7-day free trial</span>
                  </p>
                  <a
                    href="/signup"
                    className="block px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]"
                  >
                    Choose Basic
                  </a>
                </div>
                {/* Premium Plan */}
                <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
                  <h4 className="text-2xl font-semibold mb-4">Premium Plan</h4>
                  <p className="text-4xl font-bold mb-4">
                    $39<span className="text-xl">/mo</span>
                  </p>
                  <p className="text-lg mb-4">
                    ($390/year){" "}
                    <span className="text-green-500">✅ 7-day free trial</span>
                  </p>
                  <a
                    href="/signup"
                    className="block px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]"
                  >
                    Choose Premium
                  </a>
                </div>
              </div>
            </div>
            {/* Fleet Plans Section */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                Fleet Plans
              </h3>
              <div className="space-y-8">
                {/* 3–8 Trucks */}
                <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
                  <h4 className="text-2xl font-semibold mb-4">
                    3–8 Trucks
                  </h4>
                  <p className="text-4xl font-bold mb-4">
                    $69<span className="text-xl">/mo</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    <li>
                      ✅ All Premium Features: Dispatch, Maintenance, Reports, Invoicing, Expense Tracking, and Customer Management
                    </li>
                    <li>
                      ✅ Fleet Management Tools: GPS tracking, real-time reporting, and analytics
                    </li>
                    <li>
                      ✅ Team Access: 1 User per 2 Trucks
                    </li>
                    <li>
                      ✅ Fuel &amp; Load Optimization Integrations
                    </li>
                  </ul>
                  <a
                    href="/signup"
                    className="block px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]"
                  >
                    Choose Fleet Plan
                  </a>
                </div>
                {/* 9–14 Trucks */}
                <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
                  <h4 className="text-2xl font-semibold mb-4">
                    9–14 Trucks
                  </h4>
                  <p className="text-4xl font-bold mb-4">
                    $159<span className="text-xl">/mo</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    <li>
                      ✅ All Premium Features plus enhanced fleet reporting and analytics
                    </li>
                    <li>
                      ✅ Advanced Fleet Management Tools
                    </li>
                    <li>
                      ✅ Team Access: More user seats for larger operations
                    </li>
                    <li>
                      ✅ Priority Support
                    </li>
                  </ul>
                  <a
                    href="/signup"
                    className="block px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]"
                  >
                    Choose Fleet Plan
                  </a>
                </div>
                {/* 15–24 Trucks */}
                <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
                  <h4 className="text-2xl font-semibold mb-4">
                    15–24 Trucks
                  </h4>
                  <p className="text-4xl font-bold mb-4">
                    $219<span className="text-xl">/mo</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    <li>
                      ✅ All features from smaller fleet plans plus comprehensive analytics and reporting
                    </li>
                    <li>
                      ✅ Enhanced Fleet Management Tools with custom integrations
                    </li>
                    <li>
                      ✅ Priority &amp; Dedicated Support
                    </li>
                    <li>
                      ✅ Additional team access and training resources
                    </li>
                  </ul>
                  <a
                    href="/signup"
                    className="block px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]"
                  >
                    Choose Fleet Plan
                  </a>
                </div>
              </div>
            </div>
            {/* Enterprise Plan Section */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                Enterprise Plan (Minimum 25 Trucks) – Custom Pricing
              </h3>
              <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
                <p className="text-lg mb-4">
                  Contact for Quote or Demo. (bulk discounts available)
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li>✅ Everything in Fleet Plans</li>
                  <li>✅ API Access &amp; Custom Integrations</li>
                  <li>✅ AI Route Optimization: Advanced algorithms to reduce fuel consumption</li>
                  <li>✅ White-Labeling: Customize the platform with your brand</li>
                  <li>✅ Dedicated Support &amp; Training</li>
                </ul>
                <a
                  href="/contact"
                  className="block px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 text-sm text-gray-500">
            <p>7-day free trial on all plans | Annual plans save 20% | Fleets must have at least 3 trucks for fleet plans</p>
            <p className="mt-2">
              This tiered model keeps it flexible for small fleets while offering competitive discounts at scale.
            </p>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 text-center bg-[#007BFF] text-white">
        <h3 className="text-3xl font-bold">Ready to Take Control?</h3>
        <p className="mt-4 text-lg">
          Sign up today and get a <strong>7-day free trial!</strong>
        </p>
        <a
          href="/signup"
          className="inline-block mt-6 px-8 py-4 bg-white text-[#007BFF] font-semibold rounded-lg text-xl shadow-md hover:bg-[#00D9FF] hover:text-white transition-all duration-300"
        >
          Start Free Trial
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <span className="text-gray-600">&copy; 2025 Truck Command. All rights reserved.</span>
          <div className="space-x-4 mt-4 md:mt-0">
            <a href="/about" className="text-gray-600 hover:text-[#007BFF]">About</a>
            <a href="/contact" className="text-gray-600 hover:text-[#007BFF]">Contact</a>
            <a href="/privacy" className="text-gray-600 hover:text-[#007BFF]">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
