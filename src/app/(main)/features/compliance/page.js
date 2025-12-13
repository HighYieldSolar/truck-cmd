"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Check, Shield, FileText, Calendar,
  Bell, AlertTriangle, CheckCircle, Clock, Upload,
  ChevronDown, Truck, User, Award, ClipboardCheck,
  AlertCircle, Eye, Download, RefreshCw
} from "lucide-react";

// Screenshot Component
const Screenshot = ({ src, alt, color = "red" }) => (
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

// Testimonial Component
const Testimonial = ({ text, author, role, company }) => (
  <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
    <p className="text-gray-700 italic text-lg mb-4">&ldquo;{text}&rdquo;</p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold">
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
      <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mr-4 mb-4 md:mb-0">
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
          className={`text-red-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

export default function ComplianceFeature() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-red-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield size={16} />
            Compliance Management
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Stay <span className="text-red-600">Compliant</span>, Stay on the Road
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Never miss a renewal or expiration again. Track licenses, permits, medical cards, and vehicle registrations all in one place with automated alerts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-red-600 text-white text-lg font-medium rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
            No credit card required &bull; 7-day free trial &bull; Cancel anytime
          </p>
        </div>
      </section>

      {/* Document Types Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Track All Your Critical Documents
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tracking for every document that keeps you legal
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "CDL License", icon: <Award size={24} />, color: "bg-blue-100 text-blue-700" },
              { name: "Medical Card", icon: <User size={24} />, color: "bg-green-100 text-green-700" },
              { name: "Vehicle Registration", icon: <Truck size={24} />, color: "bg-purple-100 text-purple-700" },
              { name: "Insurance", icon: <Shield size={24} />, color: "bg-orange-100 text-orange-700" },
              { name: "Annual Inspection", icon: <ClipboardCheck size={24} />, color: "bg-cyan-100 text-cyan-700" },
              { name: "IFTA License", icon: <FileText size={24} />, color: "bg-yellow-100 text-yellow-700" },
              { name: "IRP Registration", icon: <FileText size={24} />, color: "bg-pink-100 text-pink-700" },
              { name: "UCR Filing", icon: <FileText size={24} />, color: "bg-indigo-100 text-indigo-700" }
            ].map((doc, index) => (
              <div key={index} className={`${doc.color} rounded-xl p-6 text-center`}>
                <div className="flex justify-center mb-3">{doc.icon}</div>
                <span className="font-medium">{doc.name}</span>
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
              Complete Compliance Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to stay compliant and avoid costly violations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={<Calendar size={28} />}
              title="Expiration Tracking"
              description="Track expiration dates for all documents. See at a glance what's current, expiring soon, or past due."
            />
            <FeatureDetail
              icon={<Bell size={28} />}
              title="Automated Alerts"
              description="Get notified 30, 14, and 7 days before expirations. Never be caught off guard by an expired document."
            />
            <FeatureDetail
              icon={<Upload size={28} />}
              title="Document Storage"
              description="Upload and store copies of all documents. Access them anytime from any device - perfect for roadside inspections."
            />
            <FeatureDetail
              icon={<Truck size={28} />}
              title="Vehicle Documents"
              description="Track registration, insurance, and inspection documents for each truck in your fleet separately."
            />
            <FeatureDetail
              icon={<User size={28} />}
              title="Driver Documents"
              description="Monitor CDL expiration, medical cards, and certifications for yourself and any drivers you employ."
            />
            <FeatureDetail
              icon={<ClipboardCheck size={28} />}
              title="Compliance Dashboard"
              description="Visual overview of your compliance status. Green, yellow, and red indicators show what needs attention."
            />
          </div>
        </div>
      </section>

      {/* Status Dashboard Preview */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-red-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Eye size={14} />
                Compliance Dashboard
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Your Compliance Status at a Glance
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Instantly see the health of your compliance:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-700"><strong>Green - Current:</strong> Documents valid for more than 30 days</span>
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-700"><strong>Yellow - Expiring Soon:</strong> Documents expiring within 30 days</span>
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-700"><strong>Red - Expired:</strong> Documents past expiration date</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Summary Cards:</strong> Count of items in each status category</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Priority List:</strong> Documents needing attention sorted by urgency</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/compliance-light.png"
                alt="Compliance dashboard showing document status with green, yellow, and red indicators"
                color="red"
              />
            </div>
          </div>

          {/* Document Management */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <FileText size={14} />
                Document Management
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                All Documents in One Place
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Comprehensive document management features:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Add Documents:</strong> Quick entry form for any document type</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>File Upload:</strong> Attach scans or photos of actual documents</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Category Filters:</strong> View by document type, vehicle, or driver</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Renewal Tracking:</strong> Log renewal dates and notes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Mobile Access:</strong> View documents on the road during inspections</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/compliance-documents.png"
                alt="Document management table showing all compliance documents with status and expiration dates"
                color="blue"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Alerts Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Never Miss an Expiration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automated alerts keep you ahead of compliance deadlines
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 rounded-2xl p-8 border border-green-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">30 Days Out</h3>
              <p className="text-gray-600">
                First reminder giving you plenty of time to schedule renewals and gather documents.
              </p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">14 Days Out</h3>
              <p className="text-gray-600">
                Second warning to ensure you&apos;ve started the renewal process.
              </p>
            </div>

            <div className="bg-red-50 rounded-2xl p-8 border border-red-200 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">7 Days Out</h3>
              <p className="text-gray-600">
                Final alert - urgent action needed to avoid driving with expired documents.
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
              Truckers Stay Compliant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how other truckers manage their compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial
              text="I got pulled over for a random inspection and had my registration pulled up on my phone in seconds. The officer was impressed and I was back on the road in 10 minutes."
              author="David Lee"
              role="Owner-Operator"
              company="Lee Trucking"
            />
            <Testimonial
              text="Before this system, I let my medical card expire without realizing it. That mistake cost me 3 days of lost revenue. Now I get alerts well in advance."
              author="Jennifer Adams"
              role="Fleet Manager"
              company="Adams Freight"
            />
            <Testimonial
              text="With 8 trucks and multiple drivers, tracking everyone's documents was a nightmare. Now it's all organized in one dashboard with automatic alerts."
              author="Marcus Johnson"
              role="Fleet Owner"
              company="Johnson Transport"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compliance Tracking FAQ
            </h2>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="What types of documents can I track?"
              answer="You can track any document with an expiration date: CDL licenses, medical cards, vehicle registrations, insurance policies, annual inspections, IFTA licenses, IRP registrations, UCR filings, hazmat endorsements, TWIC cards, and more. You can also create custom document types for anything specific to your operation."
            />
            <FAQItem
              question="How do the expiration alerts work?"
              answer="You'll receive notifications in the app when documents are approaching expiration. By default, alerts trigger at 30, 14, and 7 days before expiration. Documents show color-coded status indicators on the dashboard so you can see compliance health at a glance."
            />
            <FAQItem
              question="Can I store copies of my actual documents?"
              answer="Yes! You can upload scans or photos of your documents and attach them to each record. This means you can pull up your registration, insurance card, or any document right from your phone during a roadside inspection."
            />
            <FAQItem
              question="How does fleet tracking work?"
              answer="Each truck and driver in your system can have their own set of compliance documents. The dashboard shows an overview of all vehicles and drivers, with the ability to filter and view documents for specific trucks or people."
            />
            <FAQItem
              question="What happens when a document expires?"
              answer="Expired documents are flagged in red on your dashboard and appear in the 'Action Required' section. You'll continue receiving alerts until you update the expiration date with the renewal information."
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Have more questions about compliance tracking?</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors"
            >
              Contact Our Support Team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Stay Compliant, Stay Profitable</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of truckers who never worry about expired documents with automated compliance tracking.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-red-700 font-bold rounded-lg text-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-xl hover:bg-white hover:text-red-600 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-red-200">No credit card required &bull; 7-day free trial &bull; Cancel anytime</p>
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
              Complete your compliance toolkit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/features/fleet-tracking" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Truck size={28} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fleet Management</h3>
                <p className="text-gray-600 mb-4">
                  Track vehicles, maintenance schedules, and per-truck compliance documents.
                </p>
                <span className="text-red-600 font-medium flex items-center hover:text-red-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/ifta-calculator" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <FileText size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">IFTA Calculator</h3>
                <p className="text-gray-600 mb-4">
                  Stay compliant with fuel tax reporting across all jurisdictions.
                </p>
                <span className="text-red-600 font-medium flex items-center hover:text-red-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/state-mileage" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Calendar size={28} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">State Mileage</h3>
                <p className="text-gray-600 mb-4">
                  Accurate mileage tracking for IRP and IFTA compliance requirements.
                </p>
                <span className="text-red-600 font-medium flex items-center hover:text-red-800 transition-colors">
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
