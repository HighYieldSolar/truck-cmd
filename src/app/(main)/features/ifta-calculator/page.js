"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Check, Calculator, MapPin, Fuel,
  FileText, Download, BarChart2, Map, Clock,
  ChevronDown, Truck, Route, CheckCircle, Shield,
  DollarSign, AlertTriangle, Calendar, RefreshCw
} from "lucide-react";

// Testimonial Component
const Testimonial = ({ text, author, role, company }) => (
  <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
    <p className="text-gray-700 italic text-lg mb-4">&ldquo;{text}&rdquo;</p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
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
      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mr-4 mb-4 md:mb-0">
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
          className={`text-green-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

// Screenshot Component
const Screenshot = ({ src, alt, color = "green" }) => (
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

export default function IFTACalculatorFeature() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-green-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Calculator size={16} />
            IFTA Compliance
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Simplify <span className="text-green-600">IFTA Reporting</span> Forever
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Automatically calculate fuel tax across all jurisdictions. Track mileage by state, manage fuel purchases, and generate quarterly IFTA reports in minutes instead of hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              See How It Works
            </a>
          </div>
          <p className="text-sm text-gray-500">
            No credit card required &bull; 7-day free trial &bull; Cancel anytime
          </p>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              IFTA Filing Doesn&apos;t Have to Be Painful
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop spending hours on spreadsheets every quarter
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="mr-3" size={24} />
                The Old Way
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start text-red-700">
                  <span className="mr-3 mt-1">✗</span>
                  <span>Manually tracking miles in each state with paper logs</span>
                </li>
                <li className="flex items-start text-red-700">
                  <span className="mr-3 mt-1">✗</span>
                  <span>Collecting and organizing fuel receipts from multiple states</span>
                </li>
                <li className="flex items-start text-red-700">
                  <span className="mr-3 mt-1">✗</span>
                  <span>Complex spreadsheet formulas that break or have errors</span>
                </li>
                <li className="flex items-start text-red-700">
                  <span className="mr-3 mt-1">✗</span>
                  <span>Hours spent reconciling data every quarter</span>
                </li>
                <li className="flex items-start text-red-700">
                  <span className="mr-3 mt-1">✗</span>
                  <span>Risk of audit penalties from calculation mistakes</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                <CheckCircle className="mr-3" size={24} />
                With Truck Command
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start text-green-700">
                  <span className="mr-3 mt-1">✓</span>
                  <span>Automatic mileage tracking from your load records</span>
                </li>
                <li className="flex items-start text-green-700">
                  <span className="mr-3 mt-1">✓</span>
                  <span>Fuel purchases logged with state automatically detected</span>
                </li>
                <li className="flex items-start text-green-700">
                  <span className="mr-3 mt-1">✓</span>
                  <span>Instant calculations for all 58 IFTA jurisdictions</span>
                </li>
                <li className="flex items-start text-green-700">
                  <span className="mr-3 mt-1">✓</span>
                  <span>Generate quarterly reports in under 5 minutes</span>
                </li>
                <li className="flex items-start text-green-700">
                  <span className="mr-3 mt-1">✓</span>
                  <span>Audit-ready documentation always available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete IFTA Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to stay compliant and save time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={<MapPin size={28} />}
              title="State Mileage Tracking"
              description="Automatically track miles driven in each state and Canadian province. Data syncs from your load records for accurate reporting."
            />
            <FeatureDetail
              icon={<Fuel size={28} />}
              title="Fuel Purchase Logging"
              description="Log fuel purchases with state detection. Track gallons, prices, and receipts for complete fuel tax documentation."
            />
            <FeatureDetail
              icon={<Calculator size={28} />}
              title="Automatic Calculations"
              description="Instant MPG calculations by jurisdiction. Tax owed or credit due calculated automatically based on current tax rates."
            />
            <FeatureDetail
              icon={<FileText size={28} />}
              title="Quarterly Reports"
              description="Generate professional IFTA reports ready for filing. All data formatted exactly how your state requires."
            />
            <FeatureDetail
              icon={<Truck size={28} />}
              title="Multi-Vehicle Support"
              description="Track IFTA data separately for each truck in your fleet. Filter reports by vehicle or view combined fleet totals."
            />
            <FeatureDetail
              icon={<Download size={28} />}
              title="Export Options"
              description="Export reports as PDF or CSV. Compatible with state filing systems and perfect for your records."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How IFTA Tracking Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From driving to filing in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-green-200"></div>

            {[
              {
                step: "1",
                title: "Drive & Deliver",
                description: "Complete your loads as usual. State mileage is tracked automatically from your dispatching records."
              },
              {
                step: "2",
                title: "Log Fuel",
                description: "Enter fuel purchases with location. State is detected automatically, gallons are tracked for each jurisdiction."
              },
              {
                step: "3",
                title: "Review Data",
                description: "View your quarterly summary by jurisdiction. MPG, taxable gallons, and tax due are calculated instantly."
              },
              {
                step: "4",
                title: "File Report",
                description: "Export your IFTA report and file with your state. Keep documentation for audit protection."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mb-6 shadow-md relative z-10">
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
          {/* IFTA Dashboard */}
          <div className="flex flex-col lg:flex-row items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <BarChart2 size={14} />
                Quarterly Dashboard
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Complete Jurisdiction Summary
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                See your IFTA data for any quarter at a glance:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Jurisdiction Breakdown:</strong> Miles and fuel for all 48 US states plus Canadian provinces</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>MPG Calculations:</strong> Fleet average MPG calculated automatically from actual data</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Taxable Gallons:</strong> Miles ÷ MPG for each jurisdiction calculated instantly</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Tax Due/Credit:</strong> Difference between taxable and purchased gallons shown per state</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Quarter Selection:</strong> Easily switch between quarters to view historical data</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/ifta-calculator-light.png"
                alt="IFTA dashboard showing jurisdiction breakdown, MPG calculations, and tax summary"
                color="green"
              />
            </div>
          </div>

          {/* Trip Records */}
          <div className="flex flex-col lg:flex-row-reverse items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Route size={14} />
                Trip Records
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Detailed Trip Tracking
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Every trip is documented for audit protection:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Auto-Generated:</strong> Trip records created from completed loads with route details</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>State Breakdown:</strong> Miles automatically split by jurisdiction based on route</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Vehicle Tracking:</strong> Each trip linked to specific truck for fleet reporting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Manual Entry:</strong> Option to add trips manually when needed</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Date Filtering:</strong> View trips by quarter, month, or custom date range</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/ifta-trips.png"
                alt="Trip records table showing state-by-state mileage breakdown"
                color="blue"
              />
            </div>
          </div>

          {/* Report Export */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Download size={14} />
                Report Export
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Filing-Ready IFTA Reports
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Generate professional reports in the format your state requires:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>PDF Reports:</strong> Professional formatted reports with company information</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>CSV Export:</strong> Data export compatible with state filing systems</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Summary Reports:</strong> High-level totals for quick reference</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Detailed Reports:</strong> Trip-by-trip breakdown for audit documentation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Historical Access:</strong> Access any previous quarter&apos;s reports anytime</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Screenshot
                src="/images/screenshots/ifta-report.png"
                alt="IFTA report export showing filing-ready quarterly summary"
                color="purple"
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
              Integrated with Your Operations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              IFTA data flows automatically from your daily operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Truck size={28} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Load Management</h3>
              <p className="text-gray-600">
                Completed loads automatically generate IFTA trip records with accurate mileage by state from your route data.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Fuel size={28} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fuel Tracker</h3>
              <p className="text-gray-600">
                Fuel purchases logged in the fuel tracker sync directly to IFTA calculations with state detection built in.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Map size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">State Mileage</h3>
              <p className="text-gray-600">
                Dedicated state mileage tracking ensures every mile is accounted for in your IFTA jurisdictions.
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
              Truckers Love Our IFTA Calculator
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how other truckers have simplified their quarterly filing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial
              text="I used to spend an entire weekend every quarter doing IFTA paperwork. Now it takes me 30 minutes. The automatic mileage tracking from my loads is a game changer."
              author="James Rodriguez"
              role="Owner-Operator"
              company="JR Trucking"
            />
            <Testimonial
              text="The peace of mind knowing my IFTA data is accurate and audit-ready is worth every penny. No more stressing about calculation errors."
              author="Linda Chen"
              role="Fleet Manager"
              company="Chen Logistics"
            />
            <Testimonial
              text="As someone who runs through 20+ states, manually tracking was a nightmare. This system handles it all automatically. Best investment I've made for my business."
              author="Robert Taylor"
              role="Owner-Operator"
              company="Taylor Transport"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              IFTA Calculator FAQ
            </h2>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="What is IFTA and why do I need to file?"
              answer="IFTA (International Fuel Tax Agreement) is a tax agreement between US states and Canadian provinces that simplifies fuel tax reporting for interstate carriers. If you operate a qualified motor vehicle in more than one IFTA jurisdiction, you must file quarterly IFTA reports to properly distribute fuel taxes to each state based on miles traveled."
            />
            <FAQItem
              question="How does the automatic mileage tracking work?"
              answer="When you complete loads in our dispatching system, the pickup and delivery locations are used to calculate miles driven through each state. This data automatically populates your IFTA records. You can also add manual trip entries for trips not logged through dispatching."
            />
            <FAQItem
              question="Does the calculator include current fuel tax rates?"
              answer="Our system provides the calculation framework and jurisdiction summaries. For actual filing, you'll use the tax rates from your base jurisdiction's IFTA filing system, as rates can change quarterly. Our reports provide all the mileage and fuel data you need for accurate filing."
            />
            <FAQItem
              question="Can I track IFTA data for multiple trucks?"
              answer="Yes! Each truck in your fleet has separate IFTA tracking. You can view reports for individual vehicles or see combined fleet totals. This is perfect for small fleets that need to file one combined IFTA return."
            />
            <FAQItem
              question="What if I need to correct a trip record?"
              answer="You can edit any trip record to correct mileage or state information. The system will automatically recalculate your jurisdiction totals. We recommend reviewing your data before the quarterly filing deadline."
            />
            <FAQItem
              question="How long is my IFTA data stored?"
              answer="All IFTA data is stored indefinitely and accessible anytime. IFTA regulations require keeping records for 4 years, so having permanent access ensures you're always prepared for potential audits."
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Have more questions about IFTA tracking?</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors"
            >
              Contact Our Support Team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Ready to Simplify IFTA Forever?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of truckers who&apos;ve eliminated IFTA headaches with automatic tracking and easy quarterly filing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-green-700 font-bold rounded-lg text-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-xl hover:bg-white hover:text-green-600 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-green-200">No credit card required &bull; 7-day free trial &bull; Cancel anytime</p>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Related Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete your compliance toolkit with these integrated features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/features/fuel-tracker" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Fuel size={28} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fuel Tracker</h3>
                <p className="text-gray-600 mb-4">
                  Log fuel purchases with receipt storage. Fuel data syncs directly to IFTA calculations.
                </p>
                <span className="text-green-600 font-medium flex items-center hover:text-green-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/state-mileage" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Map size={28} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">State Mileage</h3>
                <p className="text-gray-600 mb-4">
                  Track miles driven in each state for accurate IFTA reporting and compliance.
                </p>
                <span className="text-green-600 font-medium flex items-center hover:text-green-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/compliance" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Shield size={28} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Compliance Tracking</h3>
                <p className="text-gray-600 mb-4">
                  Track license expirations, registrations, and regulatory deadlines in one place.
                </p>
                <span className="text-green-600 font-medium flex items-center hover:text-green-800 transition-colors">
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
