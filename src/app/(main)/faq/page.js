"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  FileText, 
  Truck, 
  Wallet, 
  Users, 
  Package, 
  CheckCircle, 
  Calculator, 
  Fuel, 
  Mail, 
  Phone, 
  MessageSquare 
} from "lucide-react";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  const handleSearch = (e) => {
    e.preventDefault();
    // In a real implementation, this would filter the FAQs based on search
  };

  // FAQ Categories
  const categories = [
    { id: "general", label: "General", icon: <FileText size={20} /> },
    { id: "account", label: "Account & Billing", icon: <Wallet size={20} /> },
    { id: "invoicing", label: "Invoicing", icon: <FileText size={20} /> },
    { id: "dispatching", label: "Dispatching", icon: <Truck size={20} /> },
    { id: "fleet", label: "Fleet Management", icon: <Package size={20} /> },
    { id: "expenses", label: "Expense Tracking", icon: <Wallet size={20} /> },
    { id: "compliance", label: "Compliance & IFTA", icon: <CheckCircle size={20} /> },
    { id: "technical", label: "Technical Support", icon: <Calculator size={20} /> }
  ];

  // FAQ Questions by Category
  const faqsByCategory = {
    general: [
      {
        question: "What is Truck Command?",
        answer: "Truck Command is a comprehensive management platform designed specifically for trucking companies. It helps streamline operations, manage finances, track vehicles, and ensure compliance with regulations. Our platform is built to serve owner-operators and fleets of all sizes with tailored solutions for the trucking industry."
      },
      {
        question: "Do you offer a free trial?",
        answer: "Yes, we offer a 7-day free trial on all our plans. This gives you full access to all features included in your selected plan. No credit card is required to start your trial, and you can upgrade, downgrade, or cancel at any time."
      },
      {
        question: "How secure is my data on Truck Command?",
        answer: "We take data security very seriously. Truck Command uses bank-level encryption (256-bit SSL) to protect your information. All data is stored in secure cloud servers with regular backups. We implement strict access controls, regular security audits, and follow industry best practices for data protection."
      },
      {
        question: "Can I access Truck Command on mobile devices?",
        answer: "Yes, Truck Command is fully responsive and works on all devices. We also offer dedicated mobile apps for iOS and Android that provide additional features like offline access, push notifications, and GPS tracking for drivers."
      },
      {
        question: "Is there a limit to how many users I can add?",
        answer: "The number of users depends on your subscription plan. Owner-operator plans typically include 1-2 user accounts, while fleet plans scale based on your fleet size. Generally, we recommend one user account per 1-2 trucks in your fleet."
      }
    ],
    account: [
      {
        question: "How do I change my subscription plan?",
        answer: "You can change your subscription plan at any time through your Account Settings. Go to Settings > Billing > Subscription and select 'Change Plan'. Upgrades take effect immediately, while downgrades will be applied at the start of your next billing cycle."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) as well as ACH bank transfers for annual plans. All payments are processed securely through Stripe."
      },
      {
        question: "How do I reset my password?",
        answer: "To reset your password, click on the 'Forgot Password' link on the login page. Enter your email address, and we'll send you a link to create a new password. The link will expire after 24 hours for security purposes."
      },
      {
        question: "Can I change my email address or username?",
        answer: "Yes, you can change your email address through your profile settings. Go to Settings > Profile and update your email address. Note that you'll need to verify your new email address before the change takes effect. Your username cannot be changed once your account is created."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "You can cancel your subscription by going to Settings > Billing > Subscription and selecting 'Cancel Subscription'. You'll maintain access to your account until the end of your current billing period. We don't offer refunds for partial billing periods."
      }
    ],
    invoicing: [
      {
        question: "How do I create an invoice?",
        answer: "To create a new invoice, go to the Invoicing section and click the 'New Invoice' button. Select a customer, add line items for services provided, set payment terms, and click 'Save'. You can then send the invoice directly through email, download as PDF, or share a secure payment link."
      },
      {
        question: "Can I customize my invoice templates?",
        answer: "Yes, you can customize invoice templates with your company logo, colors, and business information. Go to Settings > Invoicing > Templates to create and manage custom templates. You can also set different templates for different customers or types of services."
      },
      {
        question: "How do I export my invoices for accounting purposes?",
        answer: "In the Invoicing section, you can export your invoices in multiple formats including PDF, CSV, and QuickBooks. Use the 'Export' button and select your preferred format and date range for the export."
      },
      {
        question: "Can customers pay invoices online?",
        answer: "Yes, customers can pay invoices online through a secure payment portal. Each invoice includes a unique payment link that customers can use to pay via credit card or ACH transfer. You'll receive instant notifications when payments are made."
      },
      {
        question: "How do I send payment reminders for overdue invoices?",
        answer: "You can set up automatic payment reminders for overdue invoices. Go to Settings > Invoicing > Reminders to configure when reminders should be sent (e.g., 7 days overdue, 14 days overdue). You can also send manual reminders from the invoice details page."
      }
    ],
    dispatching: [
      {
        question: "How do I create a new load or job?",
        answer: "To create a new load, go to the Dispatching section and click 'New Load'. Enter the pickup and delivery details, cargo information, rate, and any special instructions. You can then assign the load to a driver or leave it unassigned."
      },
      {
        question: "Can I integrate with load boards?",
        answer: "Yes, Truck Command integrates with major load boards including DAT, Truckstop.com, and others. Go to Settings > Integrations to set up your load board connections. This allows you to import loads directly into your dispatching system."
      },
      {
        question: "How do drivers receive dispatch notifications?",
        answer: "Drivers receive dispatch notifications through the Truck Command mobile app. When you assign a load to a driver, they'll receive a push notification with all the relevant job details. Drivers can also opt to receive SMS or email notifications as backup."
      },
      {
        question: "Can I track the status of active loads?",
        answer: "Yes, you can track the status of all active loads in real-time. The Dispatching dashboard shows the current status of each load (Pending, In Transit, Delivered, etc.). Drivers can update load status through the mobile app, including uploading proof of delivery documents."
      },
      {
        question: "How do I optimize routes for multiple loads?",
        answer: "Our route optimization tool helps plan the most efficient routes for multiple loads. Go to Dispatching > Route Planner and select the loads you want to optimize. The system will suggest the most efficient sequence and routes, considering factors like delivery times, driver hours, and fuel costs."
      }
    ],
    fleet: [
      {
        question: "How do I add a new vehicle to my fleet?",
        answer: "To add a new vehicle, go to the Fleet Management section in your dashboard, click 'Add Vehicle', and enter the required information like VIN, license plate, make/model, and year. You can also upload documents like registration and insurance information."
      },
      {
        question: "Can I track vehicle maintenance schedules?",
        answer: "Yes, Truck Command includes a maintenance tracking system. You can set up maintenance schedules based on time intervals or mileage. The system will automatically notify you when maintenance is due. You can also log completed maintenance tasks and keep a comprehensive service history."
      },
      {
        question: "How does the GPS tracking work?",
        answer: "Our GPS tracking works through the mobile app or dedicated GPS devices. Drivers install the app on their phones, or you can use third-party GPS devices that integrate with our platform. This provides real-time location updates, breadcrumb trails, and geofencing capabilities."
      },
      {
        question: "Can I monitor fuel consumption for my vehicles?",
        answer: "Yes, you can track fuel purchases, consumption rates, and efficiency metrics. Drivers can log fuel purchases through the mobile app or you can import fuel card transactions. The system calculates MPG and other efficiency metrics, helping you identify potential issues or improvements."
      },
      {
        question: "How do I add driver information and documents?",
        answer: "To add a driver, go to Fleet Management > Drivers and click 'Add Driver'. Enter their personal information, contact details, license information, and qualifications. You can upload documents like driver's license, medical certificate, and training certificates. The system will alert you when documents are approaching expiration."
      }
    ],
    expenses: [
      {
        question: "How do I record business expenses?",
        answer: "To record an expense, go to the Expense Tracking section and click 'New Expense'. Select the expense category, enter the amount, date, and vendor information. You can attach a photo of the receipt using the mobile app or by uploading an image. Expenses can be tagged to specific trucks, trips, or drivers for detailed reporting."
      },
      {
        question: "Can I categorize expenses for tax purposes?",
        answer: "Yes, all expenses can be categorized using our pre-defined categories that align with common trucking business deductions. You can also create custom categories. These categories make tax preparation easier and help you maximize deductions."
      },
      {
        question: "How do I generate expense reports?",
        answer: "To generate an expense report, go to Expense Tracking > Reports and select your preferred date range, categories, and grouping options. You can view reports on-screen or export them as PDF or CSV files. Common report types include monthly summaries, quarterly tax preparation, and per-truck cost analysis."
      },
      {
        question: "Can I track per-mile expenses?",
        answer: "Yes, our system automatically calculates per-mile costs based on your expense data and mileage records. This helps you understand your true operating costs and set appropriate rates for your services. You can view per-mile costs by truck, by trip type, or across your entire fleet."
      },
      {
        question: "Is there a way to automate expense tracking?",
        answer: "Yes, we offer several automation options. You can connect fuel cards for automatic import of fuel purchases, link bank accounts or credit cards for transaction imports, and use OCR technology in our mobile app to automatically extract information from receipts."
      }
    ],
    compliance: [
      {
        question: "How does the IFTA calculator work?",
        answer: "Our IFTA calculator automatically tracks miles driven in each jurisdiction based on GPS data or manual trip entries. It combines this with fuel purchase records to calculate tax owed in each state or province. When it's time to file, you can generate complete IFTA reports with all the required information."
      },
      {
        question: "Can I track Hours of Service (HOS) compliance?",
        answer: "Yes, our system includes electronic logging device (ELD) integration to track hours of service. Drivers can log their status (On Duty, Driving, Off Duty, Sleeper Berth) through the mobile app, and the system will alert both drivers and managers about potential violations before they occur."
      },
      {
        question: "How do I prepare for DOT audits?",
        answer: "Truck Command helps you prepare for audits by keeping all required records organized and accessible. You can generate comprehensive reports covering vehicle inspections, maintenance records, driver qualifications, and hours of service logs. Our Audit Prep tool creates a checklist of required documents based on the type of audit."
      },
      {
        question: "Does Truck Command help with drug and alcohol testing compliance?",
        answer: "Yes, you can track driver enrollment in drug and alcohol testing programs, schedule tests, and record test results. The system will notify you when random tests are due and help ensure you meet minimum annual testing requirements."
      },
      {
        question: "How do I manage vehicle inspection reports?",
        answer: "Drivers can complete pre-trip and post-trip inspections through the mobile app, including photos of defects if found. Maintenance staff are automatically notified of issues requiring attention. All inspection records are stored digitally and can be accessed during roadside inspections or audits."
      }
    ],
    technical: [
      {
        question: "What browsers are supported?",
        answer: "Truck Command works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for optimal performance and security."
      },
      {
        question: "Can I import data from other systems?",
        answer: "Yes, we offer data import tools for customers switching from other systems. We support importing from Excel/CSV files and direct migration from several popular trucking management systems. Contact our support team for assistance with data migration."
      },
      {
        question: "Is there an API available for custom integrations?",
        answer: "Yes, we offer a comprehensive REST API for enterprise and fleet plans. This allows for custom integrations with your existing systems or third-party services. API documentation is available, and our development team can provide support for implementation."
      },
      {
        question: "What should I do if I encounter a technical issue?",
        answer: "If you encounter a technical issue, first try refreshing the page or logging out and back in. If the problem persists, contact our technical support team through your dashboard's Help section, by email at support@truckcommand.com, or by phone at (555) 123-4567. Please provide details about the issue and any error messages you received."
      },
      {
        question: "How often do you release updates?",
        answer: "We typically release minor updates and improvements every 2-4 weeks. Major feature updates are released quarterly. All updates are automatic and don't require any action from users. We announce significant updates via email and in-app notifications."
      }
    ]
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Frequently Asked Questions
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-70 rounded"></div>
            </h1>
            <p className="text-lg mb-8 max-w-3xl mx-auto">
              Find answers to common questions about Truck Command
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
              <input
                type="text"
                placeholder="Search for questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 pr-12 rounded-xl shadow-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
              >
                <Search size={20} />
              </button>
            </form>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-full transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="mt-6 space-y-4">
            {faqsByCategory[activeCategory].map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>

          {/* Still Need Help */}
          <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              Still Need Help?
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ContactMethod
                icon={<Mail size={24} />}
                title="Email Support"
                description="Get help via email"
                contact="support@truckcommand.com"
                note="Response within 24 hours"
              />
              <ContactMethod
                icon={<Phone size={24} />}
                title="Phone Support"
                description="Talk to our team"
                contact="(951) 505-1147"
                note="8am-8pm PST, Monday-Friday"
              />
              <ContactMethod
                icon={<MessageSquare size={24} />}
                title="Live Chat"
                description="Chat with support"
                contact="Available in dashboard"
                note="During business hours"
                actionText="Start Chat"
                actionHref="/chat"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button
        className="flex justify-between items-center w-full p-6 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-800">{question}</h3>
        <ChevronDown
          size={20}
          className={`text-blue-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`px-6 overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'
        }`}
      >
        <p className="text-gray-600">{answer}</p>
      </div>
    </div>
  );
}

// Contact Method Component
function ContactMethod({ icon, title, description, contact, note, actionText, actionHref }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm mb-3">{description}</p>
      <p className="font-medium text-gray-800 mb-1">{contact}</p>
      <p className="text-gray-500 text-sm mb-4">{note}</p>
      
      {actionText && actionHref && (
        <Link 
          href={actionHref}
          className="mt-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}