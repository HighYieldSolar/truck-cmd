"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center">
          {/* Logo as a button linking to the homepage */}
          <a href="/" className="flex items-center">
            <img
              src="/images/tc-name-tp-bg.png"
              alt="Truck Command Logo"
              className="h-10 mr-3"
            />
          </a>
        </div>
        <div className="flex items-center space-x-6">
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
                  <a
                    href="/features/invoicing"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Invoicing</div>
                    <div className="text-sm text-gray-500">
                      Manage invoices and payments seamlessly.
                    </div>
                  </a>
                  <a
                    href="/features/dispatching"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Dispatching</div>
                    <div className="text-sm text-gray-500">
                      Assign and track loads in real time.
                    </div>
                  </a>
                  <a
                    href="/features/expense-tracking"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Expense Tracking</div>
                    <div className="text-sm text-gray-500">
                      Monitor fuel, maintenance, and operational costs.
                    </div>
                  </a>
                  <a
                    href="/features/customer-management"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Customer Management</div>
                    <div className="text-sm text-gray-500">
                      Organize and access client data effortlessly.
                    </div>
                  </a>
                  <a
                    href="/features/fleet-tracking"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Fleet Tracking</div>
                    <div className="text-sm text-gray-500">
                      Track vehicles and maintenance schedules in real time.
                    </div>
                  </a>
                  <a
                    href="/features/compliance"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Compliance Reports</div>
                    <div className="text-sm text-gray-500">
                      Generate DOT and tax reports with ease.
                    </div>
                  </a>
                  <a
                    href="/features/ifta-calculator"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">IFTA Calculator</div>
                    <div className="text-sm text-gray-500">
                      Simplify fuel tax calculations across states.
                    </div>
                  </a>
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
                  <a
                    href="/help"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Help Center</div>
                    <div className="text-sm text-gray-500">
                      FAQs and support guides.
                    </div>
                  </a>
                  <a
                    href="/contact"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Contact Us</div>
                    <div className="text-sm text-gray-500">
                      Reach out to our support team.
                    </div>
                  </a>
                  <a
                    href="/feedback"
                    className="block px-4 py-2 border border-blue-500 rounded hover:bg-gray-100"
                  >
                    <div className="font-semibold">Feedback</div>
                    <div className="text-sm text-gray-500">
                      Send us your feedback.
                    </div>
                  </a>
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

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-20 px-6 bg-gradient-to-r from-blue-50 to-white">
        <h2 className="text-5xl font-bold text-[#222222]">
          Simplify Your Trucking Business
        </h2>
        <p className="text-xl text-[#4A4A4A] mt-4 max-w-2xl">
          Manage invoices, expenses, dispatching, IFTA calculations, and customer relationships—all in one easy-to-use platform.
        </p>
        <h3 className="text-2xl font-semibold text-[#007BFF] mt-4">
          Efficiency in Motion, Profit in Command
        </h3>
        <a
          href="/signup"
          className="mt-8 px-8 py-4 bg-[#007BFF] text-white rounded-md text-xl transition-transform duration-300 transform hover:scale-105"
        >
          Get Started for Free
        </a>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-[#222222] mb-8">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#F5F5F5] border border-gray-300 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold text-[#222222] mb-2">
                Sign Up &amp; Set Up
              </h4>
              <p className="text-[#4A4A4A]">
                Create your account and configure your company details in minutes.
              </p>
            </div>
            <div className="p-6 bg-[#F5F5F5] border border-gray-300 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold text-[#222222] mb-2">
                Manage Your Fleet
              </h4>
              <p className="text-[#4A4A4A]">
                Track loads, dispatch trucks, and keep tabs on expenses with real-time updates.
              </p>
            </div>
            <div className="p-6 bg-[#F5F5F5] border border-gray-300 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold text-[#222222] mb-2">
                Optimize &amp; Grow
              </h4>
              <p className="text-[#4A4A4A]">
                Access insights and reports to improve your operational efficiency and profitability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#F5F5F5]">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h3 className="text-3xl font-bold text-[#222222]">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {[
              { title: "📑 Invoicing", desc: "Generate, send, and manage invoices with ease for faster payments." },
              { title: "🚚 Dispatching", desc: "Seamlessly assign and track loads to optimize routes." },
              { title: "💰 Expense Tracking", desc: "Monitor fuel, maintenance, and other expenses in real-time." },
              { title: "👥 Customer Management", desc: "Keep an organized database for streamlined communications." },
              { title: "📦 Fleet Tracking", desc: "Track vehicle locations and maintenance schedules effectively." },
              { title: "⚡ Compliance Reports", desc: "Generate DOT and tax reports to keep your business compliant." },
              { title: "⛽ IFTA Calculator", desc: "Simplify fuel tax calculations across different states." }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold text-[#222222]">{feature.title}</h4>
                <p className="text-[#4A4A4A] mt-2">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto text-center px-6">
          <h3 className="text-3xl font-bold text-[#222222] mb-8">
            What Our Customers Say
          </h3>
          <div className="space-y-8">
            <blockquote className="italic text-lg text-gray-700">
              Truck Command has revolutionized how we manage our fleet and expenses. The ease of use and real-time data are game-changers.
              <span className="block mt-2 font-semibold text-gray-900">
                - Alex R., Fleet Manager
              </span>
            </blockquote>
            <blockquote className="italic text-lg text-gray-700">
              Since switching to Truck Command, our dispatching process has become smoother and more efficient. Highly recommend!
              <span className="block mt-2 font-semibold text-gray-900">
                - Jamie L., Owner-Operator
              </span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 text-center bg-[#007BFF] text-white">
        <h3 className="text-3xl font-bold">Start Managing Your Business Better</h3>
        <p className="mt-4 text-lg">
          Sign up today and get a <strong>7-day free trial!</strong>
        </p>
        <a href="/signup" className="inline-block mt-6 px-8 py-4 bg-white text-[#007BFF] font-semibold rounded-lg text-xl shadow-md hover:bg-[#00D9FF] hover:text-white transition-all duration-300">
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
