"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Check, DollarSign, Receipt, CreditCard,
  FileText, Download, BarChart2, PieChart, Tag,
  ChevronDown, Truck, Calendar, CheckCircle, Filter,
  Camera, FolderOpen, TrendingDown, Clock, Search
} from "lucide-react";

// Testimonial Component
const Testimonial = ({ text, author, role, company }) => (
  <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
    <p className="text-gray-700 italic text-lg mb-4">&ldquo;{text}&rdquo;</p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
        {author.split(' ').map(name => name[0]).join('')}
      </div>
      <div className="ml-4">
        <p className="font-medium text-gray-900">{author}</p>
        <p className="text-gray-600 text-sm">{role}, {company}</p>
      </div>
    </div>
  </div>
);

// Feature Detail Component
const FeatureDetail = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
    <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
      <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mr-4 mb-4 md:mb-0">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden hover:border-gray-300 transition-colors">
      <button
        className="flex justify-between items-center w-full p-6 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="text-lg font-medium text-gray-900 pr-4">{question}</h4>
        <ChevronDown
          size={20}
          className={`text-purple-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

// Screenshot Component
const Screenshot = ({ src, alt, color = "purple" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-4 shadow-lg border border-${color}-200`}>
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={500}
        className="w-full h-auto"
      />
    </div>
  </div>
);

export default function ExpenseTrackingFeature() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-purple-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Receipt size={16} />
            Expense Management
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Track Every Dollar,{" "}
            <span className="text-purple-600">Maximize Profits</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Comprehensive expense tracking built for trucking businesses. Log expenses, attach receipts, categorize for taxes, and understand exactly where your money goes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-purple-600 text-white text-lg font-medium rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
          <p className="text-sm text-gray-500">
            No credit card required &bull; 30-day free trial &bull; Cancel anytime
          </p>
        </div>
      </section>

      {/* Expense Categories Preview */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built-In Expense Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pre-configured categories designed for trucking tax deductions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Fuel", icon: "⛽", color: "bg-blue-100 text-blue-700" },
              { name: "Maintenance", icon: "🔧", color: "bg-orange-100 text-orange-700" },
              { name: "Insurance", icon: "🛡️", color: "bg-green-100 text-green-700" },
              { name: "Permits", icon: "📋", color: "bg-purple-100 text-purple-700" },
              { name: "Tolls", icon: "🛣️", color: "bg-yellow-100 text-yellow-700" },
              { name: "Meals", icon: "🍔", color: "bg-red-100 text-red-700" },
              { name: "Lodging", icon: "🏨", color: "bg-indigo-100 text-indigo-700" },
              { name: "Equipment", icon: "🛠️", color: "bg-cyan-100 text-cyan-700" },
              { name: "Parking", icon: "🅿️", color: "bg-pink-100 text-pink-700" },
              { name: "Scales", icon: "⚖️", color: "bg-teal-100 text-teal-700" },
              { name: "Communications", icon: "📱", color: "bg-amber-100 text-amber-700" },
              { name: "Other", icon: "📦", color: "bg-gray-100 text-gray-700" }
            ].map((category, index) => (
              <div key={index} className={`${category.color} rounded-xl p-4 text-center`}>
                <span className="text-2xl mb-2 block">{category.icon}</span>
                <span className="font-medium text-sm">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Expense Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to track, categorize, and analyze your business expenses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={<Receipt size={28} />}
              title="Easy Expense Entry"
              description="Quick expense logging with date, amount, vendor, and category. Add expenses in seconds from desktop or mobile."
            />
            <FeatureDetail
              icon={<Camera size={28} />}
              title="Receipt Attachments"
              description="Attach photos of receipts to any expense. Never lose a receipt again - everything stored securely in the cloud."
            />
            <FeatureDetail
              icon={<Tag size={28} />}
              title="Smart Categorization"
              description="Pre-built trucking expense categories aligned with IRS deductions. Custom categories available for your unique needs."
            />
            <FeatureDetail
              icon={<Truck size={28} />}
              title="Vehicle Assignment"
              description="Link expenses to specific trucks in your fleet. Track per-vehicle costs for true profitability analysis."
            />
            <FeatureDetail
              icon={<PieChart size={28} />}
              title="Spending Analytics"
              description="Visual breakdowns of spending by category, vehicle, and time period. Identify cost trends and savings opportunities."
            />
            <FeatureDetail
              icon={<Download size={28} />}
              title="Export for Taxes"
              description="Export expense reports by category and date range. Perfect for tax preparation and accountant review."
            />
          </div>
        </div>
      </section>

      {/* Dashboard Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-6xl mx-auto">
          {/* Expense Dashboard */}
          <div className="flex flex-col lg:flex-row items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <BarChart2 size={14} />
                Dashboard Overview
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Your Financial Command Center
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Get instant visibility into your business expenses:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Expense Summary:</strong> Total expenses with period comparisons and trends</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Category Breakdown:</strong> Pie chart showing spending distribution by category</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Recent Expenses:</strong> Quick view of latest entries with edit access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Monthly Trends:</strong> Track spending patterns over time</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Vehicle Costs:</strong> Per-truck expense totals for fleet management</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/expenses-light.png"
                alt="Expense dashboard showing spending summary, category breakdown, and recent expenses"
                color="purple"
              />
            </div>
          </div>

          {/* Expense List & Filters */}
          <div className="flex flex-col lg:flex-row-reverse items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Filter size={14} />
                Smart Filtering
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Find Any Expense Instantly
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Powerful search and filtering to find exactly what you need:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Date Range Filters:</strong> Today, this week, this month, custom ranges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Category Filters:</strong> View expenses by category or subcategory</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Vehicle Filters:</strong> See expenses for specific trucks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Text Search:</strong> Search by vendor name, description, or notes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Sort Options:</strong> Sort by date, amount, category, or vendor</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/expenses-list.png"
                alt="Expense list with filtering and search capabilities"
                color="blue"
              />
            </div>
          </div>

          {/* Receipt Management */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <FolderOpen size={14} />
                Receipt Storage
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Digital Receipt Management
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Say goodbye to shoeboxes of receipts:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Photo Upload:</strong> Snap receipt photos directly from your phone</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>File Attachments:</strong> Upload PDF receipts and invoices</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Secure Storage:</strong> Cloud storage with automatic backup</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Easy Access:</strong> View attached receipts anytime from the expense record</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Audit Ready:</strong> Documentation ready for IRS audits</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/expenses-receipt.png"
                alt="Expense detail showing attached receipt preview"
                color="green"
              />
            </div>
          </div>

          {/* Receipt Directory */}
          <div className="flex flex-col lg:flex-row-reverse items-center mt-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <FolderOpen size={14} />
                Receipt Directory
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Organized Receipt Storage
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                All your receipts organized and accessible in one place:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Visual Gallery:</strong> Browse all receipts in a visual grid view</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Quick Preview:</strong> Click any receipt to view full-size image</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Linked Expenses:</strong> Each receipt linked to its expense record</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Download Options:</strong> Download individual receipts or bulk export</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Tax Season Ready:</strong> All documentation organized for accountants</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/expenses-reciept-directory.png"
                alt="Receipt directory showing organized gallery of all uploaded receipts"
                color="orange"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Connected to Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expense tracking that integrates with your other operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <CreditCard size={28} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fuel Sync</h3>
              <p className="text-gray-600">
                Fuel purchases logged in the Fuel Tracker automatically create expense records. No double entry required.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Truck size={28} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Maintenance Link</h3>
              <p className="text-gray-600">
                Maintenance records from Fleet Management sync as expenses, keeping your costs and maintenance history connected.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart2 size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Profit Analysis</h3>
              <p className="text-gray-600">
                Dashboard shows expenses against revenue for true profit visibility. Know exactly how much you&apos;re making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Truckers Trust Our Expense Tracking
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how other trucking businesses manage their expenses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial
              text="At tax time, I used to panic looking for receipts. Now everything is organized and ready to go. My accountant loves how organized my expense reports are."
              author="Maria Garcia"
              role="Owner-Operator"
              company="Garcia Trucking"
            />
            <Testimonial
              text="Being able to see expense breakdowns by truck helped me realize one of my older trucks was costing way more in maintenance than it was worth. Sold it and upgraded."
              author="Kevin Brown"
              role="Fleet Owner"
              company="Brown Transport LLC"
            />
            <Testimonial
              text="The fuel sync feature alone saves me 30 minutes a day. Fuel purchases go in once and show up in both fuel tracking and expenses automatically."
              author="Steve Miller"
              role="Owner-Operator"
              company="Miller Express"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Expense Tracking FAQ
            </h2>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="What expense categories are included?"
              answer="We include all standard trucking expense categories: Fuel, Maintenance, Insurance, Permits, Tolls, Meals, Lodging, Equipment, Parking, Scales, Communications, and more. You can also create custom categories for expenses unique to your operation."
            />
            <FAQItem
              question="Can I attach receipts to expenses?"
              answer="Yes! You can attach photos or PDF files to any expense record. Simply upload from your device when creating the expense, or add attachments later. All files are stored securely in the cloud and accessible anytime."
            />
            <FAQItem
              question="How does fuel expense sync work?"
              answer="When you log a fuel purchase in the Fuel Tracker, it automatically creates a corresponding expense record. The expense includes all the fuel entry details and is categorized as 'Fuel' automatically. This eliminates double entry and ensures your records match."
            />
            <FAQItem
              question="Can I export expenses for my accountant?"
              answer="Absolutely! You can export expense reports as CSV files filtered by date range, category, or vehicle. The export includes all expense details plus receipt attachment links. Perfect for tax preparation or accountant review."
            />
            <FAQItem
              question="Is there a mobile app for expense entry?"
              answer="Truck Command works on any mobile browser, so you can log expenses from your phone while on the road. Simply snap a receipt photo and enter the details - it takes less than 30 seconds."
            />
            <FAQItem
              question="How does expense tracking help with taxes?"
              answer="Our categories are aligned with IRS deduction categories for trucking businesses. At tax time, you can export expenses by category to see exactly what you spent on fuel, maintenance, meals, etc. This makes filing easier and helps ensure you claim all legitimate deductions."
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Have more questions about expense tracking?</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors"
            >
              Contact Our Support Team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Start Tracking Expenses Today</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of truckers who&apos;ve taken control of their business finances with organized expense tracking.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-lg text-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-xl hover:bg-white hover:text-purple-600 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-purple-200">No credit card required &bull; 30-day free trial &bull; Cancel anytime</p>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Related Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete your financial management toolkit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/features/fuel-tracker" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <CreditCard size={28} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fuel Tracker</h3>
                <p className="text-gray-600 mb-4">
                  Log fuel purchases with automatic expense sync. Track MPG and fuel costs by vehicle.
                </p>
                <span className="text-purple-600 font-medium flex items-center hover:text-purple-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/invoicing" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <FileText size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Invoicing</h3>
                <p className="text-gray-600 mb-4">
                  Track revenue alongside expenses for complete profit visibility.
                </p>
                <span className="text-purple-600 font-medium flex items-center hover:text-purple-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/fleet-tracking" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Truck size={28} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fleet Management</h3>
                <p className="text-gray-600 mb-4">
                  Track maintenance costs and per-vehicle expenses for your fleet.
                </p>
                <span className="text-purple-600 font-medium flex items-center hover:text-purple-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
