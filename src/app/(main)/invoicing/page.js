"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown, ArrowRight, Check,
  DollarSign, BarChart2, Clock, PieChart, CreditCard, Settings
} from "lucide-react";

// Testimonial Component
const Testimonial = ({ text, author, role, company }) => (
  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300">
    <p className="text-gray-700 italic text-lg mb-4">{text}</p>
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
  <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
    <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
      <div className="text-blue-600 mr-4 mb-4 md:mb-0">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="flex justify-between items-center w-full text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="text-xl font-medium text-gray-800">{question}</h4>
        <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`mt-2 text-gray-600 transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <p className="py-2">{answer}</p>
      </div>
    </div>
  );
};

export default function InvoicingFeature() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Powerful <span className="text-yellow-300">Invoicing</span> for Trucking Companies
              </h1>
              <p className="text-xl mt-6 max-w-xl">
                Create professional invoices, track payments, and get paid faster with our easy-to-use invoicing system designed specifically for the trucking industry.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <a
                  href="/signup"
                  className="px-8 py-4 bg-white text-blue-600 rounded-md text-xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-50 flex items-center justify-center"
                >
                  Try It Free 
                  <ArrowRight size={20} className="ml-2" />
                </a>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-md text-xl transition-all duration-300 hover:bg-white hover:text-blue-600"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative w-full h-96 bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Placeholder for feature image/screenshot */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-white opacity-50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg text-gray-500">Invoicing Screenshot</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 inline-block relative">
            Why Choose Our Invoicing Solution
            <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
          </h2>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16 mt-4">
            Streamline your billing process and improve your cash flow
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail 
              icon={<DollarSign size={40} />} 
              title="Get Paid Faster" 
              description="Send professional invoices instantly after job completion. Track payments and send automatic reminders to reduce late payments." 
            />
            <FeatureDetail 
              icon={<Settings size={40} />} 
              title="Fully Customizable" 
              description="Tailor invoices with your branding, custom fields, and payment terms. Create templates for recurring clients and loads." 
            />
            <FeatureDetail 
              icon={<Clock size={40} />} 
              title="Save Time" 
              description="Automate your invoicing process. Pull data directly from completed loads to create accurate invoices in seconds." 
            />
            <FeatureDetail 
              icon={<CreditCard size={40} />} 
              title="Multiple Payment Options" 
              description="Accept credit cards, ACH transfers, and more. Give your customers convenient ways to pay you." 
            />
            <FeatureDetail 
              icon={<BarChart2 size={40} />} 
              title="Financial Insights" 
              description="Track outstanding payments, analyze payment times, and identify your most profitable customers and routes." 
            />
            <FeatureDetail 
              icon={<PieChart size={40} />} 
              title="Tax Ready" 
              description="Keep your finances organized for tax season with detailed reports and financial summaries." 
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#222222] mb-4 inline-block relative">
              How Our Invoicing Works
              <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Simple and efficient billing in just a few steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-blue-200 -z-10 transform -translate-y-1/2"></div>
            
            {[
              {
                step: "1",
                title: "Complete a Load",
                description: "After completing a delivery, enter basic load details or import them directly from your dispatching system."
              },
              {
                step: "2",
                title: "Generate Invoice",
                description: "With one click, create a professional invoice. The system auto-calculates mileage, rates, and any additional fees."
              },
              {
                step: "3",
                title: "Send & Track",
                description: "Email the invoice directly to your customer and track when it's viewed, due, and paid. Send automatic reminders for past-due invoices."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500 text-white text-2xl font-bold flex items-center justify-center mb-6 shadow-md">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold text-[#222222] mb-4">
                    {item.title}
                  </h3>
                  <p className="text-[#4A4A4A]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center mb-16">
            <div className="md:w-1/2 pr-0 md:pr-12 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-6 inline-block relative">
                Customizable Invoice Templates
                <div className="absolute bottom-0 left-0 w-1/2 h-1 bg-blue-500 rounded"></div>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Create professional invoices that reflect your brand. Our customizable templates allow you to:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Add your company logo, colors, and branding</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Include custom fields for specialized services</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Set up different templates for different customers</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Include payment terms and instructions</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Add notes and special instructions</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-100 rounded-lg p-4 h-80 flex items-center justify-center shadow-lg">
                {/* Placeholder for invoice template screenshot */}
                <p className="text-gray-500">Invoice Template Screenshot</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row-reverse items-center">
            <div className="md:w-1/2 pl-0 md:pl-12 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-6 inline-block relative">
                Payment Tracking Dashboard
                <div className="absolute bottom-0 left-0 w-1/2 h-1 bg-blue-500 rounded"></div>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Stay on top of your finances with a comprehensive dashboard that shows:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Outstanding invoices and aging reports</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Payment status for each invoice</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Revenue trends and projections</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Customer payment history and patterns</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Exportable financial reports for accounting</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-100 rounded-lg p-4 h-80 flex items-center justify-center shadow-lg">
                {/* Placeholder for dashboard screenshot */}
                <p className="text-gray-500">Payment Dashboard Screenshot</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              What Our Customers Say
              <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Hear from trucking companies who&apos;ve improved their invoicing
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial 
              text="Truck Command's invoicing system cut our billing time by 75%. We now send invoices same-day and get paid much faster."
              author="Michael Johnson"
              role="Owner"
              company="MJ Trucking LLC"
            />
            <Testimonial 
              text="The payment tracking is a game-changer. We always know exactly what's outstanding and can follow up promptly on late payments."
              author="Sarah Williams"
              role="Office Manager"
              company="Williams Transport"
            />
            <Testimonial 
              text="Our customers love the professional invoices, and the ability to accept credit cards has dramatically improved our cash flow."
              author="Robert Chen"
              role="Finance Director"
              company="RC Logistics"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Frequently Asked Questions
              <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
            </h2>
          </div>
          
          <div className="space-y-2">
            <FAQItem 
              question="Can I integrate the invoicing system with my accounting software?"
              answer="Yes, our invoicing system integrates with popular accounting software including QuickBooks, Xero, and more. This allows for seamless data transfer and keeps your financial records in sync."
            />
            <FAQItem 
              question="How do customers pay their invoices?"
              answer="Customers can pay through multiple methods including credit/debit cards, ACH bank transfers, and traditional checks. Each invoice includes a secure payment link where customers can pay online if they choose."
            />
            <FAQItem 
              question="Can I set up recurring invoices for regular customers?"
              answer="Absolutely! You can create invoice templates and schedule them to be sent automatically on a daily, weekly, monthly, or custom schedule. This is perfect for regular lanes or contracted work."
            />
            <FAQItem 
              question="Is the system compliant with financial regulations?"
              answer="Yes, our system is designed to comply with all relevant financial and tax regulations. All transactions are securely recorded and easily accessible for audit purposes."
            />
            <FAQItem 
              question="Can I track partial payments?"
              answer="Yes, the system fully supports partial payments and installment plans. You'll always see exactly what has been paid and what is still outstanding for each invoice."
            />
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Have more questions about our invoicing features?</p>
            <a href="/contact" className="inline-block px-6 py-3 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200 transition-colors">
              Contact Our Support Team
            </a>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Ready to Streamline Your Invoicing?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of trucking businesses that have improved their cash flow with Truck Command&apos;s invoicing system.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a 
              href="/signup" 
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-lg text-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              Start Your Free Trial
            </a>
            <a 
              href="/demo" 
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Request Demo
            </a>
          </div>
          <p className="mt-6 text-blue-200">No credit card required • 7-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Related Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Explore Related Features
              <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Discover more ways Truck Command can help your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-6">
                <div className="text-blue-600 mb-4">
                  <Truck size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Dispatching</h3>
                <p className="text-gray-600 mb-4">
                  Efficiently manage your fleet and assign loads to maximize profitability.
                </p>
                <a 
                  href="/features/dispatching" 
                  className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-6">
                <div className="text-blue-600 mb-4">
                  <Wallet size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Expense Tracking</h3>
                <p className="text-gray-600 mb-4">
                  Track and categorize all your business expenses for better financial management.
                </p>
                <a 
                  href="/features/expense-tracking" 
                  className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-6">
                <div className="text-blue-600 mb-4">
                  <Users size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Customer Management</h3>
                <p className="text-gray-600 mb-4">
                  Organize customer information, track interactions, and build stronger relationships.
                </p>
                <a 
                  href="/features/customer-management" 
                  className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}