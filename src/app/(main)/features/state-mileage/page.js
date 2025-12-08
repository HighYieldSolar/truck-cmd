"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Route,
  MapPin,
  Truck,
  BarChart2,
  Calculator,
  FileDown,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  Shield,
  Fuel,
  Globe,
  History,
  Plus,
  Calendar,
  Target,
  Navigation
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
const FeatureDetail = ({ icon: Icon, title, description, color = "blue" }) => (
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
        className="w-full py-6 flex items-center justify-between text-left hover:text-blue-600 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-8">{question}</span>
        {isOpen ? (
          <ChevronUp size={20} className="text-blue-600 flex-shrink-0" />
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
const ScreenshotPlaceholder = ({ title, description, icon: Icon, color = "blue" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-8 h-80 flex flex-col items-center justify-center shadow-lg border border-${color}-200`}>
    <div className={`w-16 h-16 bg-${color}-100 rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={32} className={`text-${color}-600`} />
    </div>
    <p className="text-gray-600 font-medium text-center">{title}</p>
    <p className="text-gray-400 text-sm text-center mt-2">{description}</p>
  </div>
);

export default function StateMileageFeaturePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 via-white to-white pt-20 pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-50 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Route size={16} />
              IFTA-Compliant Mileage Tracking
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Track Every Mile,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Every State
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Record state border crossings as you drive and automatically calculate miles by jurisdiction.
              Export IFTA-ready reports in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Tracking Free
                <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                US & Canadian provinces
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                IFTA compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Export to PDF/Excel
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
              Comprehensive State Mileage Tracking
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to track state-by-state miles for IFTA reporting and compliance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={Route}
              title="Active Trip Recording"
              description="Start a trip, add state crossings as you drive, and the system automatically calculates miles per state based on odometer readings."
              color="blue"
            />
            <FeatureDetail
              icon={MapPin}
              title="State-by-State Tracking"
              description="Record exact odometer readings at each state border crossing. Miles are automatically calculated between checkpoints."
              color="green"
            />
            <FeatureDetail
              icon={BarChart2}
              title="IFTA Mileage Reports"
              description="Generate IFTA-compliant mileage reports broken down by jurisdiction. Perfect for quarterly filing requirements."
              color="purple"
            />
            <FeatureDetail
              icon={Calculator}
              title="IFTA Calculator Integration"
              description="Import completed trips directly into the IFTA calculator. Your mileage data automatically populates tax calculations."
              color="indigo"
            />
            <FeatureDetail
              icon={Truck}
              title="Multi-Vehicle Support"
              description="Track mileage for multiple vehicles in your fleet. Each truck's trips are recorded and reported separately."
              color="orange"
            />
            <FeatureDetail
              icon={FileDown}
              title="Export Options"
              description="Download your mileage data as PDF or Excel files. Include all crossings, state totals, and trip summaries."
              color="teal"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How State Mileage Tracking Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple, straightforward process for accurate IFTA mileage
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Start a Trip",
                  description: "Select your vehicle, enter starting state and odometer reading to begin tracking",
                  icon: Plus
                },
                {
                  step: "2",
                  title: "Add Crossings",
                  description: "Record each state border crossing with the current odometer reading and date",
                  icon: MapPin
                },
                {
                  step: "3",
                  title: "End Trip",
                  description: "Complete the trip when done. Miles are calculated automatically for each state",
                  icon: CheckCircle
                },
                {
                  step: "4",
                  title: "Export Data",
                  description: "Import to IFTA calculator or export reports for your quarterly filing",
                  icon: FileDown
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl mb-6 shadow-lg">
                    <item.icon size={28} />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Screenshots Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A clean, intuitive interface designed for on-the-road ease of use
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScreenshotPlaceholder
              title="Active Trip Recording"
              description="Replace with screenshot of active trip with state crossings"
              icon={Route}
              color="blue"
            />
            <ScreenshotPlaceholder
              title="Miles by State Chart"
              description="Replace with screenshot of mileage breakdown view"
              icon={BarChart2}
              color="indigo"
            />
            <ScreenshotPlaceholder
              title="Trip History"
              description="Replace with screenshot of completed trips list"
              icon={History}
              color="green"
            />
            <ScreenshotPlaceholder
              title="All-Time Summary"
              description="Replace with screenshot of total mileage stats"
              icon={Target}
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* US & Canada Coverage */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 text-white">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Globe size={24} />
                    </div>
                    <h3 className="text-2xl font-bold">US & Canadian Coverage</h3>
                  </div>
                  <p className="text-blue-100 text-lg leading-relaxed mb-6">
                    Track mileage across all 50 US states and 10 Canadian provinces. Perfect for
                    cross-border trucking operations and IFTA compliance across North America.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-3xl font-bold">50</div>
                      <div className="text-blue-200 text-sm">US States</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-3xl font-bold">10</div>
                      <div className="text-blue-200 text-sm">Canadian Provinces</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="font-semibold mb-4">Supported Jurisdictions</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="bg-white/10 px-2 py-1 rounded">Alabama</span>
                    <span className="bg-white/10 px-2 py-1 rounded">California</span>
                    <span className="bg-white/10 px-2 py-1 rounded">Texas</span>
                    <span className="bg-white/10 px-2 py-1 rounded">Florida</span>
                    <span className="bg-white/10 px-2 py-1 rounded">Ohio</span>
                    <span className="bg-white/10 px-2 py-1 rounded">Illinois</span>
                    <span className="bg-white/10 px-2 py-1 rounded">Ontario</span>
                    <span className="bg-white/10 px-2 py-1 rounded">Quebec</span>
                    <span className="bg-white/10 px-2 py-1 rounded">+52 more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Features */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Seamless Integration
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your mileage data connects with other Truck Command features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calculator size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">IFTA Calculator</h3>
              <p className="text-gray-600">
                Import trips directly into IFTA calculations. Your miles automatically populate the tax breakdown.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Fuel size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fuel Tracker</h3>
              <p className="text-gray-600">
                Fuel purchases by state combine with mileage data for complete IFTA reporting accuracy.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Truck size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fleet Management</h3>
              <p className="text-gray-600">
                Track mileage per vehicle. See lifetime miles, trip counts, and state coverage for each truck.
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
              Trusted by Owner-Operators
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See why truckers choose Truck Command for their mileage tracking
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Testimonial
              quote="I used to dread IFTA filing. Now I just record my crossings as I go and export the report when it's time. Takes 5 minutes instead of hours."
              author="Marcus T."
              role="Owner-Operator, 3 years"
            />
            <Testimonial
              quote="The import to IFTA calculator feature is brilliant. No more copying numbers between spreadsheets. Everything just flows together."
              author="Sandra L."
              role="Fleet Owner, 5 trucks"
            />
            <Testimonial
              quote="Finally, an app that understands cross-border trucking. Having Canadian provinces included makes my US-Canada runs so much easier to track."
              author="Robert K."
              role="Owner-Operator, Cross-border"
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
                Common questions about state mileage tracking
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <FAQItem
                question="How accurate is the mileage calculation?"
                answer="The mileage is calculated directly from your odometer readings at each state border crossing. As long as you record accurate odometer readings, the calculated miles will be exact. This is the same method auditors use to verify IFTA records."
              />
              <FAQItem
                question="Can I edit a trip after I've completed it?"
                answer="Active trips can be modified at any time. You can add or remove crossings (except the starting point) while a trip is in progress. Once completed, trips become read-only to maintain audit trail integrity, but you can delete and re-create if needed."
              />
              <FAQItem
                question="How does the IFTA import work?"
                answer="When you complete a trip, you can import the mileage data directly to the IFTA calculator. The system automatically matches state mileage to the correct quarter based on crossing dates. Multi-quarter trips are split automatically."
              />
              <FAQItem
                question="Does this work for Canadian provinces too?"
                answer="Yes! The system supports all 50 US states and 10 Canadian provinces (Alberta, British Columbia, Manitoba, New Brunswick, Newfoundland, Nova Scotia, Ontario, Prince Edward Island, Quebec, and Saskatchewan)."
              />
              <FAQItem
                question="What if I forget to record a crossing?"
                answer="You can add crossings retroactively as long as the trip is still active. Enter the date and odometer reading from when you actually crossed the border. The system will calculate miles correctly based on the sequence of odometer readings."
              />
              <FAQItem
                question="Can I export my mileage records?"
                answer="Yes! You can export individual trips or complete summaries as PDF or Excel files. Exports include all state crossings, calculated miles per state, dates, and vehicle information - perfect for IFTA filing or audit documentation."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Simplify IFTA Mileage?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of truckers who've eliminated the IFTA headache. Start tracking your miles today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
              Explore other tools that work with State Mileage Tracking
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              href="/features/ifta-calculator"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Calculator size={24} className="text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                IFTA Calculator
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Calculate quarterly IFTA taxes with your mileage data
              </p>
            </Link>
            <Link
              href="/features/fuel-tracker"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Fuel size={24} className="text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Fuel Tracker
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Track fuel purchases by state for complete IFTA data
              </p>
            </Link>
            <Link
              href="/features/fleet-tracking"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Truck size={24} className="text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Fleet Management
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Manage vehicles and track per-truck mileage stats
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
