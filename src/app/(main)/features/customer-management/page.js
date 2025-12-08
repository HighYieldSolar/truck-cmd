"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Plus,
  Edit,
  BarChart2,
  Download,
  TrendingUp,
  UserPlus,
  Briefcase,
  Filter,
  Eye,
  DollarSign,
  Clock
} from "lucide-react";

// Testimonial component
const Testimonial = ({ quote, author, role, rating = 5 }) => (
  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
    <div className="flex gap-1 mb-4">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
      ))}
    </div>
    <p className="text-gray-700 mb-6 italic leading-relaxed">"{quote}"</p>
    <div>
      <p className="font-semibold text-gray-900">{author}</p>
      <p className="text-gray-500 text-sm">{role}</p>
    </div>
  </div>
);

// Feature detail component
const FeatureDetail = ({ icon: Icon, title, description, color = "teal" }) => (
  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className={`w-14 h-14 bg-${color}-100 rounded-xl flex items-center justify-center mb-6`}>
      <Icon size={28} className={`text-${color}-600`} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

// FAQ Item component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-teal-600 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-8">{question}</span>
        {isOpen ? (
          <ChevronUp size={20} className="text-teal-600 flex-shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 text-gray-600 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

// Screenshot placeholder component
const ScreenshotPlaceholder = ({ title, description, icon: Icon, color = "teal" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-8 h-80 flex flex-col items-center justify-center shadow-lg border border-${color}-200`}>
    <div className={`w-16 h-16 bg-${color}-100 rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={32} className={`text-${color}-600`} />
    </div>
    <p className="text-gray-600 font-medium text-center">{title}</p>
    <p className="text-gray-400 text-sm text-center mt-2">{description}</p>
  </div>
);

export default function CustomerManagementFeaturePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-teal-50 via-white to-white pt-20 pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-100 rounded-full opacity-50 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Users size={16} />
              Customer Relationship Management
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Build Better{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                Customer Relationships
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Keep all your shippers and brokers organized in one place. Track contacts, manage relationships,
              and grow your business with our simple CRM built for trucking.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Free Today
                <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Broker & shipper tracking
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Contact management
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                CSV export
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Customers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple, focused CRM designed specifically for trucking businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={Building2}
              title="Company Profiles"
              description="Store complete company information including name, address, city, state, ZIP, and any custom notes for each customer."
              color="teal"
            />
            <FeatureDetail
              icon={Phone}
              title="Contact Information"
              description="Keep contact names, phone numbers, and email addresses organized. Never lose an important contact again."
              color="blue"
            />
            <FeatureDetail
              icon={Briefcase}
              title="Customer Types"
              description="Categorize customers as Brokers, Shippers, or other types. Filter your list to focus on specific relationships."
              color="purple"
            />
            <FeatureDetail
              icon={TrendingUp}
              title="Top Customers"
              description="See which customers bring you the most business. Identify your most valuable relationships at a glance."
              color="green"
            />
            <FeatureDetail
              icon={Search}
              title="Smart Search & Filters"
              description="Find any customer instantly with powerful search. Filter by status, type, state, or sort by name, date, or type."
              color="indigo"
            />
            <FeatureDetail
              icon={Download}
              title="CSV Export"
              description="Export your customer list to CSV for backup, reporting, or importing into other systems when needed."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <BarChart2 size={16} />
                  Dashboard Statistics
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Know Your Customer Base at a Glance
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  The customer dashboard shows you key metrics about your customer base,
                  helping you understand your business relationships better.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-teal-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">Total</span>
                    </div>
                    <p className="text-gray-600 text-sm">All customers in your database</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle size={20} className="text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">Active</span>
                    </div>
                    <p className="text-gray-600 text-sm">Currently active customers</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserPlus size={20} className="text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">New</span>
                    </div>
                    <p className="text-gray-600 text-sm">Added this month</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Briefcase size={20} className="text-purple-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">Brokers</span>
                    </div>
                    <p className="text-gray-600 text-sm">Broker relationships</p>
                  </div>
                </div>
              </div>

              <ScreenshotPlaceholder
                title="Customer Statistics"
                description="Replace with screenshot of customer stats cards"
                icon={BarChart2}
                color="teal"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Types Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Organize Customers Your Way
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Categorize and filter customers to manage different types of business relationships
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Categories</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Briefcase size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Brokers</h4>
                        <p className="text-gray-600 text-sm">Load boards and freight brokers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl">
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Building2 size={24} className="text-teal-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Shippers</h4>
                        <p className="text-gray-600 text-sm">Direct shipper relationships</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Other</h4>
                        <p className="text-gray-600 text-sm">Factoring companies, vendors, etc.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Filtering</h3>
                  <p className="text-gray-600 mb-6">
                    Use the sidebar categories or top filters to quickly narrow down your customer list:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle size={18} className="text-green-500" />
                      Filter by customer type (Broker, Shipper, etc.)
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle size={18} className="text-green-500" />
                      Filter by status (Active, Inactive)
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle size={18} className="text-green-500" />
                      Filter by state/location
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle size={18} className="text-green-500" />
                      Sort by name, date added, or type
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle size={18} className="text-green-500" />
                      Search by company, contact, email, or phone
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Screenshots */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A clean, intuitive interface for managing all your customer relationships
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScreenshotPlaceholder
              title="Customer List View"
              description="Replace with screenshot of customer table with filters"
              icon={Users}
              color="teal"
            />
            <ScreenshotPlaceholder
              title="Add/Edit Customer Form"
              description="Replace with screenshot of customer form modal"
              icon={Plus}
              color="blue"
            />
            <ScreenshotPlaceholder
              title="Customer Detail View"
              description="Replace with screenshot of customer details modal"
              icon={Eye}
              color="purple"
            />
            <ScreenshotPlaceholder
              title="Top Customers Widget"
              description="Replace with screenshot of top customers sidebar"
              icon={TrendingUp}
              color="green"
            />
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Connected Across Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Customer data flows seamlessly to other parts of Truck Command
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Invoicing</h3>
              <p className="text-gray-600">
                Select customers when creating invoices. Their billing info auto-populates for faster invoicing.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dispatching</h3>
              <p className="text-gray-600">
                Assign customers to loads. Track which brokers and shippers are giving you the most work.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DollarSign size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Revenue Tracking</h3>
              <p className="text-gray-600">
                See revenue by customer over time. Identify your most profitable relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Trucking Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See why owner-operators and small fleets trust Truck Command for customer management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Testimonial
              quote="I used to keep customer info in a notebook. Now everything's organized and I can find any contact in seconds. Game changer for my business."
              author="David P."
              role="Owner-Operator, 5 years"
            />
            <Testimonial
              quote="Being able to categorize brokers vs direct shippers helps me understand where my business comes from. The top customers view is really helpful."
              author="Maria S."
              role="Small Fleet Owner, 4 trucks"
            />
            <Testimonial
              quote="I love that customer info flows into invoicing automatically. No more typing the same address twice. Saves me time every single day."
              author="James W."
              role="Owner-Operator, 8 years"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Common questions about customer management
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <FAQItem
                question="How many customers can I add?"
                answer="Basic plan includes 25 customers, Premium includes 100 customers, and Fleet plan offers unlimited customers. Most owner-operators find 25-100 customers plenty for their business, but you can upgrade anytime if you need more."
              />
              <FAQItem
                question="Can I import my existing customer list?"
                answer="Currently, customers need to be added manually through the app. However, CSV export is available for backing up your data. We're planning to add import functionality in a future update."
              />
              <FAQItem
                question="What information can I store for each customer?"
                answer="Each customer profile includes: Company Name, Contact Name, Email, Phone, Address, City, State, ZIP, Customer Type (Broker, Shipper, etc.), Status (Active/Inactive), and custom Notes. This covers everything most trucking businesses need."
              />
              <FAQItem
                question="Does the CRM track revenue per customer?"
                answer="Yes! When you create invoices and loads linked to customers, the system tracks total revenue by customer. You can see your top customers ranked by the business they bring you."
              />
              <FAQItem
                question="Can I see customer history?"
                answer="The customer detail view shows all invoices and loads associated with that customer. You can see your complete history of work with each customer in one place."
              />
              <FAQItem
                question="Is customer data backed up?"
                answer="All customer data is stored securely in the cloud and backed up automatically. You can also export your customer list to CSV at any time for your own backup."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Organize Your Customers?
            </h2>
            <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto">
              Join thousands of trucking professionals who manage their customer relationships with Truck Command.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Your Free Trial
                <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all duration-200"
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Related Features
            </h2>
            <p className="text-gray-600">
              Explore other tools that work with Customer Management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              href="/features/invoicing"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
            >
              <FileText size={24} className="text-teal-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                Invoicing
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Create invoices with customer info auto-filled
              </p>
            </Link>
            <Link
              href="/features/dispatching"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
            >
              <Briefcase size={24} className="text-teal-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                Dispatching
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Assign customers to loads for tracking
              </p>
            </Link>
            <Link
              href="/features/expense-tracking"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
            >
              <DollarSign size={24} className="text-teal-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                Expense Tracking
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Understand true profitability per customer
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
