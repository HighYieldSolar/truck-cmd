"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Check, Fuel, MapPin, DollarSign,
  FileText, Download, BarChart2, TrendingDown, Truck,
  ChevronDown, Calendar, CheckCircle, Receipt, Camera,
  Gauge, Calculator, Clock, PieChart
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

export default function FuelTrackerFeature() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Fuel size={16} />
            Fuel Management
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Track Fuel, <span className="text-blue-600">Save Money</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Comprehensive fuel tracking with MPG calculations, price analytics, and automatic IFTA integration. Know exactly what you&apos;re spending on fuel and where.
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
              Explore Features
            </a>
          </div>
          <p className="text-sm text-gray-500">
            No credit card required &bull; 7-day free trial &bull; Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats Preview */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100">
              <Gauge size={32} className="text-blue-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">6.8</p>
              <p className="text-gray-600 text-sm">Avg MPG Tracked</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100">
              <DollarSign size={32} className="text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">$3.45</p>
              <p className="text-gray-600 text-sm">Avg Price/Gallon</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100">
              <MapPin size={32} className="text-purple-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">48</p>
              <p className="text-gray-600 text-sm">States Tracked</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100">
              <Calculator size={32} className="text-orange-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">IFTA</p>
              <p className="text-gray-600 text-sm">Auto-Integrated</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Fuel Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to track, analyze, and optimize your fuel spending
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={<Fuel size={28} />}
              title="Quick Fuel Entry"
              description="Log fuel purchases in seconds. Enter gallons, price, location, and odometer reading. Snap a receipt photo for your records."
            />
            <FeatureDetail
              icon={<Gauge size={28} />}
              title="MPG Calculations"
              description="Automatic miles per gallon tracking for each fill-up and running averages. Know exactly how efficient your trucks are."
            />
            <FeatureDetail
              icon={<MapPin size={28} />}
              title="State Tracking"
              description="Fuel purchases automatically tagged by state for IFTA compliance. No manual state entry required."
            />
            <FeatureDetail
              icon={<Calculator size={28} />}
              title="IFTA Integration"
              description="Fuel data automatically flows to IFTA calculator. One entry, two reports - no duplicate data entry."
            />
            <FeatureDetail
              icon={<TrendingDown size={28} />}
              title="Price Analytics"
              description="Track fuel prices over time and by location. Identify the best places to fuel up on your regular routes."
            />
            <FeatureDetail
              icon={<Truck size={28} />}
              title="Per-Vehicle Tracking"
              description="Track fuel separately for each truck. Compare efficiency and costs across your fleet."
            />
          </div>
        </div>
      </section>

      {/* Dashboard Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          {/* Fuel Dashboard */}
          <div className="flex flex-col lg:flex-row items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <BarChart2 size={14} />
                Fuel Dashboard
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Your Fuel Data at a Glance
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Comprehensive fuel analytics in one dashboard:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Fuel Summary:</strong> Total gallons, total spent, and average price for any period</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>MPG Tracking:</strong> Current MPG, historical averages, and trend charts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>State Breakdown:</strong> Gallons purchased by state for IFTA reference</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Recent Entries:</strong> Quick view of latest fuel purchases with edit access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Cost Trends:</strong> Charts showing fuel cost patterns over time</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 h-80 flex flex-col items-center justify-center shadow-lg border border-blue-200">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Fuel size={32} className="text-blue-600" />
                </div>
                <p className="text-gray-600 font-medium text-center">Fuel Dashboard</p>
                <p className="text-gray-400 text-sm text-center mt-2">Replace with screenshot of fuel tracker dashboard</p>
              </div>
            </div>
          </div>

          {/* Fuel Entry */}
          <div className="flex flex-col lg:flex-row-reverse items-center mb-20 gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Receipt size={14} />
                Quick Entry
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Log Fuel in Seconds
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Fast, easy fuel entry designed for life on the road:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Simple Form:</strong> Enter gallons, total cost, location, and odometer</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Auto-Calculate:</strong> Price per gallon calculated automatically</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>State Detection:</strong> State determined from location entry</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Receipt Upload:</strong> Attach receipt photos for documentation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>IFTA Flag:</strong> Mark purchases for IFTA-qualified vehicles</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 h-80 flex flex-col items-center justify-center shadow-lg border border-green-200">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Receipt size={32} className="text-green-600" />
                </div>
                <p className="text-gray-600 font-medium text-center">Fuel Entry Form</p>
                <p className="text-gray-400 text-sm text-center mt-2">Replace with screenshot of fuel entry form</p>
              </div>
            </div>
          </div>

          {/* MPG Analytics */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <PieChart size={14} />
                Analytics
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Understand Your Fuel Efficiency
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Deep insights into your fuel performance:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Per-Fill MPG:</strong> Calculate MPG for each fill-up based on odometer</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Rolling Average:</strong> Track MPG trends over time</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Vehicle Comparison:</strong> Compare efficiency across your fleet</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Cost Per Mile:</strong> Calculate actual fuel cost per mile driven</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Seasonal Trends:</strong> See how efficiency changes throughout the year</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 h-80 flex flex-col items-center justify-center shadow-lg border border-purple-200">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Gauge size={32} className="text-purple-600" />
                </div>
                <p className="text-gray-600 font-medium text-center">MPG Analytics</p>
                <p className="text-gray-400 text-sm text-center mt-2">Replace with screenshot of MPG charts and analytics</p>
              </div>
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
              Fuel data flows seamlessly to other parts of your operation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Calculator size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">IFTA Calculator</h3>
              <p className="text-gray-600">
                Fuel purchases automatically populate IFTA reports. State-by-state gallons tracked without extra work.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <DollarSign size={28} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expense Tracking</h3>
              <p className="text-gray-600">
                Fuel purchases auto-sync as expenses. One entry creates both fuel and expense records.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Truck size={28} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fleet Management</h3>
              <p className="text-gray-600">
                Fuel data linked to specific vehicles for per-truck cost analysis and efficiency tracking.
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
              Truckers Love Our Fuel Tracker
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial
              text="The MPG tracking helped me realize one of my trucks was getting significantly worse fuel economy. Turned out it needed a tune-up. Fixed it and saved hundreds per month."
              author="Carlos Martinez"
              role="Fleet Owner"
              company="Martinez Trucking"
            />
            <Testimonial
              text="IFTA used to be my least favorite part of running my business. Now fuel just syncs automatically and my quarterly reports are ready in minutes."
              author="Amy Wilson"
              role="Owner-Operator"
              company="Wilson Express"
            />
            <Testimonial
              text="Being able to see where fuel is cheapest along my regular routes has saved me real money. The price analytics are more useful than I expected."
              author="Derek Thompson"
              role="Owner-Operator"
              company="Thompson Hauling"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fuel Tracker FAQ
            </h2>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="How does MPG calculation work?"
              answer="When you enter a fuel purchase with the current odometer reading, the system calculates miles driven since your last fill-up and divides by gallons purchased. For accurate MPG, fill up completely each time and record the odometer reading."
            />
            <FAQItem
              question="Does fuel data sync to IFTA automatically?"
              answer="Yes! When you log a fuel purchase and mark it as IFTA-qualified, the data automatically appears in your IFTA calculator. The state is detected from your location entry, so gallons are categorized correctly by jurisdiction."
            />
            <FAQItem
              question="Can I attach receipts to fuel entries?"
              answer="Absolutely. You can upload photos of your fuel receipts when creating entries. The images are stored securely and accessible anytime - perfect for tax documentation and audit protection."
            />
            <FAQItem
              question="How do I track fuel for multiple trucks?"
              answer="Each fuel entry is linked to a specific vehicle in your fleet. You can view fuel data for all trucks together or filter to see individual vehicle performance, costs, and MPG."
            />
            <FAQItem
              question="Does fuel sync to expense tracking?"
              answer="Yes! Fuel purchases automatically create corresponding expense records categorized as 'Fuel'. This eliminates double entry and ensures your expense reports match your fuel records."
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Have more questions about fuel tracking?</p>
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
          <h2 className="text-4xl font-bold mb-6">Start Tracking Fuel Today</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of truckers who understand their fuel costs and save money with smart tracking.
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
          <p className="mt-6 text-blue-200">No credit card required &bull; 7-day free trial &bull; Cancel anytime</p>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Related Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/features/ifta-calculator" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Calculator size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">IFTA Calculator</h3>
                <p className="text-gray-600 mb-4">
                  Fuel data flows directly to IFTA calculations for easy quarterly filing.
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
                  Fuel purchases auto-sync as expenses for complete financial tracking.
                </p>
                <span className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors">
                  Learn More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>

            <Link href="/features/state-mileage" className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <MapPin size={28} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">State Mileage</h3>
                <p className="text-gray-600 mb-4">
                  Track miles by state alongside fuel for complete IFTA data.
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
