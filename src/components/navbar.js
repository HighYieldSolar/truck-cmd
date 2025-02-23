// /components/NavBar.js
"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function NavBar() {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const featuresRef = useRef(null);
  const supportRef = useRef(null);

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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-md border-b border-gray-200">
      <div className="flex items-center">
        {/* Logo as a button linking to the homepage */}
        <Link href="/" className="flex items-center">
          <image
            src="/images/tc-name-tp-bg.png"
            alt="Truck Command Logo"
            className="h-10 mr-3"
          />
        </Link>
      </div>
      <div className="flex items-center space-x-6">
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
                {/* Example Feature Links */}
                <a
                  href="/features/invoicing"
                  className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                >
                  <div className="font-semibold">Invoicing</div>
                  <div className="text-sm text-gray-500">
                    Manage invoices seamlessly.
                  </div>
                </a>
                <a
                  href="/features/dispatching"
                  className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                >
                  <div className="font-semibold">Dispatching</div>
                  <div className="text-sm text-gray-500">
                    Assign and track loads efficiently.
                  </div>
                </a>
                {/* Add other feature links as needed */}
              </div>
            </div>
          )}
        </div>
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
                <a
                  href="/help"
                  className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                >
                  <div className="font-semibold">Help Center</div>
                  <div className="text-sm text-gray-500">FAQs and guides.</div>
                </a>
                <a
                  href="/contact"
                  className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                >
                  <div className="font-semibold">Contact Us</div>
                  <div className="text-sm text-gray-500">Reach our team.</div>
                </a>
                <a
                  href="/feedback"
                  className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                >
                  <div className="font-semibold">Feedback</div>
                  <div className="text-sm text-gray-500">Share your thoughts.</div>
                </a>
              </div>
            </div>
          )}
        </div>
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
  );
}
