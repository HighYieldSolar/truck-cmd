"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, FileText, Truck, Wallet, Users, Package, CheckCircle, Calculator, Fuel, HelpCircle, Mail, MessageSquare } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const featuresRef = useRef(null);
  const supportRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-md border-b border-gray-200">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/tc-name-tp-bg.png"
            alt="Truck Command Logo"
            width={120}
            height={40}
            className="h-10 mr-3"
          />
        </Link>
      </div>

      {isMobile ? (
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 focus:outline-none">
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      ) : (
        <div className="flex items-center space-x-6">
          <div ref={featuresRef} className="relative inline-block">
            <button
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
            >
              <span>Features</span>
              <ChevronDown size={20} className="ml-1" />
            </button>
            {featuresOpen && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-md shadow-lg z-20">
                <div className="p-4 grid grid-cols-2 gap-4">
                  {[ { icon: <FileText size={20} className="text-blue-600" />, title: "Invoicing", href: "/features/invoicing" },
                    { icon: <Truck size={20} className="text-blue-600" />, title: "Dispatching", href: "/features/dispatching" },
                    { icon: <Wallet size={20} className="text-blue-600" />, title: "Expense Tracking", href: "/features/expense-tracking" },
                    { icon: <Users size={20} className="text-blue-600" />, title: "Customer Management", href: "/features/customer-management" },
                    { icon: <Package size={20} className="text-blue-600" />, title: "Fleet Tracking", href: "/features/fleet-tracking" },
                    { icon: <CheckCircle size={20} className="text-blue-600" />, title: "Compliance Reports", href: "/features/compliance" },
                    { icon: <Calculator size={20} className="text-blue-600" />, title: "IFTA Calculator", href: "/features/ifta-calculator" },
                    { icon: <Fuel size={20} className="text-blue-600" />, title: "Fuel Tracker", href: "/features/fuel-tracker" }].map((feature, i) => (
                    <a key={i} href={feature.href} className="flex items-center px-4 py-2 border border-blue-500 rounded hover:bg-gray-100 space-x-2">
                      {feature.icon}
                      <span>{feature.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/pricing" className="text-gray-600 hover:text-[#00D9FF]">Pricing</Link>
          <div ref={supportRef} className="relative inline-block">
            <button
              onClick={() => setSupportOpen(!supportOpen)}
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
            >
              <span>Support</span>
              <ChevronDown size={20} className="ml-1" />
            </button>
            {supportOpen && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-md shadow-lg z-20">
                <div className="p-4 space-y-2">
                  {[ { icon: <HelpCircle size={20} className="text-blue-600" />, title: "Help Center", href: "/help" },
                    { icon: <Mail size={20} className="text-blue-600" />, title: "Contact Us", href: "/contact" },
                    { icon: <MessageSquare size={20} className="text-blue-600" />, title: "Feedback", href: "/feedback" }].map((support, i) => (
                    <a key={i} href={support.href} className="flex items-center px-4 py-2 border border-blue-500 rounded hover:bg-gray-100 space-x-2">
                      {support.icon}
                      <span>{support.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/login" className="text-gray-600 hover:text-[#00D9FF] border border-gray-300 rounded px-3 py-1">Login</Link>
          <Link href="/signup" className="px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]">Get Started</Link>
        </div>
      )}
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
          <h3 className="text-3xl font-bold text-[#222222]">Simple & Efficient Trucking Management Software</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {[
              { icon: <FileText size={58} className="text-blue-600" />, title: "Invoicing", desc: "Generate, send, and manage invoices with ease for faster payments." },
              { icon: <Truck size={58} className="text-blue-600" />, title: "Dispatching", desc: "Seamlessly assign and track loads to optimize routes." },
              { icon: <Wallet size={58} className="text-blue-600" />, title: "Expense Tracking", desc: "Monitor fuel, maintenance, and other expenses in real-time." },
              { icon: <Users size={58} className="text-blue-600" />, title: "Customer Management", desc: "Keep an organized database for streamlined communications." },
              { icon: <Package size={58} className="text-blue-600" />, title: "Fleet Tracking", desc: "Track vehicle locations and maintenance schedules effectively." },
              { icon: <CheckCircle size={58} className="text-blue-600" />, title: "Compliance Reports", desc: "Generate DOT and tax reports to keep your business compliant." },
              { icon: <Calculator size={58} className="text-blue-600" />, title: "IFTA Calculator", desc: "Simplify fuel tax calculations across different states." },
              { icon: <Fuel size={58} className="text-blue-600" />, title: "Fuel Tracker", desc: "Monitor fuel usage, track costs, and optimize efficiency." }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white border border-gray-200 rounded-lg shadow-md flex items-center space-x-4">
              {feature.icon}
              <div>
                <h4 className="text-xl font-semibold text-[#222222]">{feature.title}</h4>
                <p className="text-[#4A4A4A] mt-2">{feature.desc}</p>
              </div>
            </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto text-center px-6">
          <h3 className="text-3xl font-bold text-[#222222] mb-8">What Our Customers Say</h3>
          <div className="space-y-8">
            {[
              { text: "Truck Command has revolutionized how we manage our fleet and expenses. The ease of use and real-time data are game-changers.", name: "Alex R., Fleet Manager" },
              { text: "Since switching to Truck Command, our dispatching process has become smoother and more efficient. Highly recommend!", name: "Jamie L., Owner-Operator" },
              { text: "The invoicing system is seamless. I can send and track invoices with just a few clicks. It has saved me hours of work every week!", name: "Samantha K., Independent Trucker" },
              { text: "Fuel tracking has never been easier. Truck Command helps us monitor fuel expenses in real-time, making cost analysis simple.", name: "Carlos M., Fleet Owner" },
              { text: "Customer management and compliance tracking are lifesavers. We can keep up with DOT requirements effortlessly!", name: "Linda P., Logistics Coordinator" },
              { text: "This platform has changed the way we run our trucking business. The insights we get from the reports help us optimize operations and maximize profits.", name: "David S., Dispatch Manager" },
              { text: "Easy-to-use and packed with essential features! The IFTA calculator alone makes it worth every penny.", name: "Jason T., Owner-Operator" }
            ].map((testimonial, i) => (
              <blockquote key={i} className="italic text-lg text-gray-700">
                {testimonial.text}
                <span className="block mt-2 font-semibold text-gray-900">- {testimonial.name}</span>
              </blockquote>
            ))}
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
