"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Search,
  HelpCircle,
  FileText,
  Wallet,
  Calculator,
  Settings,
  Mail,
  Phone,
  MessageSquare,
  ArrowRight
} from "lucide-react";

// FAQ Item Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden hover:border-gray-300 transition-colors">
      <button
        className="flex justify-between items-center w-full p-6 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-900 pr-4">{question}</h3>
        <ChevronDown
          size={20}
          className={`text-blue-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`px-6 overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 py-0 opacity-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  // FAQ Categories
  const categories = [
    { id: "general", label: "General", icon: <HelpCircle size={18} /> },
    { id: "billing", label: "Billing & Plans", icon: <Wallet size={18} /> },
    { id: "features", label: "Features", icon: <FileText size={18} /> },
    { id: "ifta", label: "IFTA & Compliance", icon: <Calculator size={18} /> },
    { id: "technical", label: "Technical", icon: <Settings size={18} /> }
  ];

  // FAQ Questions by Category
  const faqsByCategory = {
    general: [
      {
        question: "What is Truck Command?",
        answer: "Truck Command is an all-in-one trucking management platform designed for owner-operators and small fleets. It helps you manage invoicing, expenses, IFTA calculations, compliance tracking, and more—all from one simple dashboard."
      },
      {
        question: "How does the free trial work?",
        answer: "Your 30-day free trial gives you full access to all features of your chosen plan. No credit card is required to start. You can cancel anytime during the trial period with no charges, or upgrade to continue using the platform."
      },
      {
        question: "Who is Truck Command designed for?",
        answer: "Truck Command is built for owner-operators running 1-3 trucks and small fleets with up to 12 trucks. Our plans are designed to scale with your business, from solo operators to growing operations."
      },
      {
        question: "Is my data secure?",
        answer: "Yes. We use bank-level encryption (256-bit SSL) to protect your data. All information is stored in secure cloud servers with regular backups. We never share your data with third parties."
      },
      {
        question: "Can I access Truck Command on my phone?",
        answer: "Yes, Truck Command is fully responsive and works on all devices—desktop, tablet, and mobile. Access your business data from anywhere, anytime."
      }
    ],
    billing: [
      {
        question: "What are the pricing plans?",
        answer: "We offer three plans: Basic ($20/month) for owner-operators with 1 truck, Premium ($35/month) for growing operations with up to 3 trucks, and Fleet ($75/month) for small fleets with up to 12 trucks. Annual billing saves you 20%."
      },
      {
        question: "Can I switch plans later?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades apply at the start of your next billing cycle."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment system. All payments are encrypted and secure."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "You can cancel your subscription anytime through your account settings under Billing. You'll maintain access until the end of your current billing period. No cancellation fees."
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer a 30-day free trial so you can test the platform before committing. After the trial, we don't offer refunds for partial billing periods, but you can cancel anytime to stop future charges."
      }
    ],
    features: [
      {
        question: "What features are included in each plan?",
        answer: "All plans include invoicing, expense tracking, fuel logging, and a dashboard. Premium adds IFTA calculator, compliance tracking, and state mileage reports. Fleet adds maintenance scheduling, CSV exports, and priority support. See our pricing page for full details."
      },
      {
        question: "How do I create an invoice?",
        answer: "Go to the Invoicing section, click 'Create Invoice', select your customer, add services and amounts, then save or send. You can customize invoices with your logo and send them directly via email or download as PDF."
      },
      {
        question: "Can I track expenses with receipts?",
        answer: "Yes! You can log expenses and attach receipt photos. Expenses are automatically categorized for tax purposes and can be filtered by truck, driver, or date range."
      },
      {
        question: "How does customer management work?",
        answer: "Store all your customer information in one place—contact details, payment terms, billing addresses, and complete history of loads and invoices. Easily track outstanding payments and generate customer reports."
      },
      {
        question: "Can I import my existing data?",
        answer: "Yes, you can manually enter your existing customers, trucks, and driver information. We're also working on CSV import functionality to make bulk data entry easier."
      }
    ],
    ifta: [
      {
        question: "How does the IFTA calculator work?",
        answer: "Our IFTA calculator automatically tracks your mileage by state based on your logged loads and calculates fuel tax owed. At the end of each quarter, you can generate a complete IFTA report ready for filing—no more spreadsheets."
      },
      {
        question: "How accurate is the IFTA calculation?",
        answer: "The IFTA calculator uses your actual mileage and fuel purchase data to provide accurate calculations. Always double-check the generated reports against your records before filing."
      },
      {
        question: "What compliance features are available?",
        answer: "Track document expirations (licenses, medical cards, registrations), maintenance schedules, and regulatory deadlines. Get alerts before things expire so you never miss a renewal."
      },
      {
        question: "How do I track state mileage?",
        answer: "When you create a load, enter the pickup and delivery locations. The system automatically calculates and tracks miles driven in each state for IFTA reporting purposes."
      },
      {
        question: "Can I generate quarterly IFTA reports?",
        answer: "Yes, at the end of each quarter you can generate a complete IFTA report that summarizes miles driven and fuel purchased in each jurisdiction. This report includes all the data you need for filing."
      }
    ],
    technical: [
      {
        question: "What browsers are supported?",
        answer: "Truck Command works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for optimal performance."
      },
      {
        question: "Is there a mobile app?",
        answer: "Currently, Truck Command is a web-based platform that works on all devices. Access it from any browser on your phone, tablet, or computer. A dedicated mobile app is on our roadmap for future development."
      },
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a reset link. The link expires after 24 hours for security purposes."
      },
      {
        question: "What if I encounter a technical issue?",
        answer: "First, try refreshing the page or logging out and back in. If the problem persists, contact our support team at support@truckcommand.com with details about the issue. We typically respond within 24 hours."
      },
      {
        question: "How often is the platform updated?",
        answer: "We release updates regularly based on user feedback. All updates are automatic—you'll always have access to the latest features without needing to do anything."
      }
    ]
  };

  // Filter FAQs based on search
  const filteredFaqs = searchQuery
    ? Object.values(faqsByCategory).flat().filter(
        faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqsByCategory[activeCategory];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <HelpCircle size={16} />
            Help Center
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Frequently Asked{" "}
            <span className="text-blue-600">Questions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Find answers to common questions about Truck Command
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            <Search size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Category Tabs - Only show if not searching */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2 mb-10 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.icon}
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results Header */}
          {searchQuery && (
            <div className="mb-8">
              <p className="text-gray-600">
                Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
              >
                Clear search
              </button>
            </div>
          )}

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))
            ) : (
              <div className="text-center py-12">
                <HelpCircle size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No questions found matching your search.</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
            <p className="text-gray-600">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                <Mail size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-3">Get help via email</p>
              <p className="font-medium text-gray-900">support@truckcommand.com</p>
              <p className="text-gray-500 text-xs mt-1">Response within 24 hours</p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4">
                <Mail size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-3">Send us a message</p>
              <p className="font-medium text-gray-900">support@truckcommand.com</p>
              <p className="text-gray-500 text-xs mt-1">We respond within 24 hours</p>
            </div>

            <Link
              href="/contact"
              className="bg-blue-600 rounded-2xl p-8 text-center hover:bg-blue-700 transition-colors group"
            >
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-semibold text-white mb-2">Contact Us</h3>
              <p className="text-blue-100 text-sm mb-3">Send us a message</p>
              <span className="inline-flex items-center text-white font-medium">
                Get in Touch
                <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Try Truck Command free for 7 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-gray-100 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
