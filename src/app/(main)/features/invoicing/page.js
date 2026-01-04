"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Check, FileText, DollarSign, Clock,
  Send, Download, CreditCard, BarChart2, Shield,
  Zap, ChevronDown, Mail, Printer, AlertCircle,
  CheckCircle, Users, Calendar
} from "lucide-react";

// Testimonial Component
const Testimonial = ({ text, author, role, company }) => (
  <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
    <p className="text-gray-700 italic text-lg mb-4">&ldquo;{text}&rdquo;</p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
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
      <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mr-4 mb-4 md:mb-0">
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
          className={`text-blue-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

// Screenshot Component
const Screenshot = ({ src, alt }) => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 shadow-lg border border-blue-200">
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

export default function InvoicingFeature() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText size={16} />
            Professional Invoicing
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Get Paid Faster with{" "}
            <span className="text-blue-600">Professional Invoices</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Create, send, and track professional invoices in minutes. Automate your billing workflow and never miss a payment with our comprehensive invoicing system built for truckers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              See Features
            </a>
          </div>
          <p className="text-sm text-gray-500">
            No credit card required &bull; 30-day free trial &bull; Cancel anytime
          </p>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Get Paid
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional invoicing tools designed specifically for trucking businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={<Zap size={28} />}
              title="Quick Invoice Creation"
              description="Create professional invoices in under 2 minutes with our intuitive form. Auto-populate customer details, add line items, and calculate totals automatically."
            />
            <FeatureDetail
              icon={<Send size={28} />}
              title="Email Delivery"
              description="Send invoices directly to customers via email with one click. Track when invoices are viewed and follow up on overdue payments automatically."
            />
            <FeatureDetail
              icon={<Download size={28} />}
              title="PDF Export"
              description="Download professional PDF invoices with your company logo and branding. Perfect for printing or attaching to emails manually."
            />
            <FeatureDetail
              icon={<Clock size={28} />}
              title="Payment Tracking"
              description="Track invoice status from draft to paid. See payments due soon, overdue invoices, and total outstanding amounts at a glance."
            />
            <FeatureDetail
              icon={<BarChart2 size={28} />}
              title="Revenue Analytics"
              description="View total invoiced amounts, paid vs pending, and monthly revenue trends. Make informed decisions with real-time financial insights."
            />
            <FeatureDetail
              icon={<Users size={28} />}
              title="Customer Management"
              description="Store customer details for quick invoice creation. View complete billing history and outstanding balances per customer."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Invoice Creation Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From load completion to payment in just a few clicks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-blue-200"></div>

            {[
              {
                step: "1",
                title: "Complete Load",
                description: "Finish a delivery and mark the load as complete in your dispatching system."
              },
              {
                step: "2",
                title: "Generate Invoice",
                description: "Click to create invoice - customer and load details are auto-populated."
              },
              {
                step: "3",
                title: "Review & Send",
                description: "Add any additional charges, review totals, and send via email or download PDF."
              },
              {
                step: "4",
                title: "Get Paid",
                description: "Track payment status and mark invoices as paid when payment is received."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mb-6 shadow-md relative z-10">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Invoice Dashboard */}
          <div className="flex flex-col lg:flex-row items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <BarChart2 size={14} />
                Dashboard Overview
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Complete Invoice Management Dashboard
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                See all your invoices at a glance with powerful filtering and sorting options:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Status Overview:</strong> Track paid, pending, overdue, and draft invoices with color-coded badges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Quick Stats:</strong> Total invoiced, total paid, outstanding amounts displayed prominently</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Smart Filters:</strong> Filter by status, date range, customer, or search by invoice number</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Upcoming Payments:</strong> Dedicated sidebar showing payments due within 7 days</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Overdue Alerts:</strong> Never miss overdue invoices with automatic status updates</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/invoices-light.png"
                alt="Invoice management dashboard showing status overview, quick stats, and invoice list"
              />
            </div>
          </div>

          {/* Invoice Creation */}
          <div className="flex flex-col lg:flex-row-reverse items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <FileText size={14} />
                Invoice Builder
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Professional Invoice Creation
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Build beautiful, professional invoices with all the details your customers need:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Auto-Generated Numbers:</strong> Sequential invoice numbering with custom prefix support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Customer Selection:</strong> Choose from saved customers or add new ones on the fly</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Line Item Details:</strong> Add multiple services, descriptions, quantities, and rates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Automatic Calculations:</strong> Subtotals, taxes, and totals calculated instantly</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Payment Terms:</strong> Set due dates and payment terms for each invoice</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/invoicing-create.png"
                alt="Invoice creation form with customer selection, line items, and automatic calculations"
              />
            </div>
          </div>

          {/* Invoice Detail View */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Mail size={14} />
                Send & Track
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Invoice Detail & Delivery Options
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Complete invoice management with multiple delivery and export options:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>PDF Preview:</strong> See exactly what your customer will receive before sending</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Email Delivery:</strong> Send invoices directly with customizable email messages</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Download PDF:</strong> Export professional PDF invoices with your branding</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Edit & Duplicate:</strong> Modify existing invoices or duplicate for similar jobs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Payment Recording:</strong> Mark invoices as paid with payment date tracking</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/invoicing-detail.png"
                alt="Invoice detail view with PDF preview, email delivery, and payment recording options"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Seamlessly Integrated with Your Workflow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Invoicing that connects with every part of your trucking business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <CreditCard size={28} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Load Integration</h3>
              <p className="text-gray-600">
                Create invoices directly from completed loads. All delivery details, rates, and customer information are automatically populated.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Users size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer CRM</h3>
              <p className="text-gray-600">
                Customer details sync automatically. View complete billing history, outstanding balances, and payment patterns for each customer.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart2 size={28} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Financial Reports</h3>
              <p className="text-gray-600">
                Invoice data feeds into your dashboard analytics. Track revenue, accounts receivable aging, and cash flow trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Trucking Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how other truckers have improved their billing workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial
              text="I used to spend hours creating invoices in Excel. Now I can invoice a customer in less than 2 minutes right after completing a delivery."
              author="Mike Johnson"
              role="Owner-Operator"
              company="MJ Trucking"
            />
            <Testimonial
              text="The automatic overdue tracking is a game changer. I never miss following up on late payments anymore, and my cash flow has improved significantly."
              author="Sarah Davis"
              role="Fleet Manager"
              company="Davis Freight"
            />
            <Testimonial
              text="Being able to send professional PDF invoices with my company logo makes my small operation look as professional as the big companies."
              author="Tom Wilson"
              role="Owner-Operator"
              company="Wilson Transport"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="Can I customize my invoice template with my company logo?"
              answer="Yes! You can upload your company logo and it will appear on all your invoices. Your company name, address, and contact information are also included automatically based on your account settings."
            />
            <FAQItem
              question="How do I create an invoice from a completed load?"
              answer="When you mark a load as complete, you'll see an option to 'Create Invoice'. Click this button and the system will auto-populate the invoice with the load details, customer information, and agreed rates. Just review and send!"
            />
            <FAQItem
              question="Can I track which invoices have been viewed by customers?"
              answer="When you send invoices via email through our system, we track delivery status. You can see when an email was sent and if there were any delivery issues. Future updates will include read receipts."
            />
            <FAQItem
              question="What happens when an invoice becomes overdue?"
              answer="The system automatically updates invoice status to 'Overdue' when the due date passes. Overdue invoices are highlighted in your dashboard and appear in a dedicated 'Overdue' section so you never miss following up."
            />
            <FAQItem
              question="Can I accept online payments through the invoices?"
              answer="Currently, invoices are for billing and record-keeping purposes. You can record payments manually when received. We're working on online payment integration for a future release."
            />
            <FAQItem
              question="Is there a limit to how many invoices I can create?"
              answer="Invoice limits depend on your subscription plan. Basic plans include a monthly limit, while Premium and Fleet plans offer unlimited invoice creation. Check our pricing page for specific limits."
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Have more questions about our invoicing features?</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
            >
              Contact Our Support Team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Ready to Streamline Your Invoicing?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of truckers who have simplified their billing and improved their cash flow with Truck Command.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-lg text-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-blue-200">No credit card required &bull; 30-day free trial &bull; Cancel anytime</p>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Related Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover more ways Truck Command can help your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/features/dispatching" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <CreditCard size={28} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Load Management</h3>
                <p className="text-gray-600 mb-4">
                  Track loads from pickup to delivery and create invoices automatically upon completion.
                </p>
                <span className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/customer-management" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Users size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Customer CRM</h3>
                <p className="text-gray-600 mb-4">
                  Manage customer relationships and view complete billing history in one place.
                </p>
                <span className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/expense-tracking" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign size={28} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Expense Tracking</h3>
                <p className="text-gray-600 mb-4">
                  Track all your business expenses alongside revenue for complete financial visibility.
                </p>
                <span className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors">
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
