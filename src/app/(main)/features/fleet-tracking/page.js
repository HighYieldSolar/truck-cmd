"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Users,
  Wrench,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Clock,
  Shield,
  Search,
  Plus,
  Edit,
  BarChart2,
  Settings,
  Bell,
  ClipboardList,
  MapPin,
  Gauge
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
const FeatureDetail = ({ icon: Icon, title, description, color = "orange" }) => (
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
        className="w-full py-6 flex items-center justify-between text-left hover:text-orange-600 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-8">{question}</span>
        {isOpen ? (
          <ChevronUp size={20} className="text-orange-600 flex-shrink-0" />
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
const ScreenshotPlaceholder = ({ title, description, icon: Icon, color = "orange" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-8 h-80 flex flex-col items-center justify-center shadow-lg border border-${color}-200`}>
    <div className={`w-16 h-16 bg-${color}-100 rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={32} className={`text-${color}-600`} />
    </div>
    <p className="text-gray-600 font-medium text-center">{title}</p>
    <p className="text-gray-400 text-sm text-center mt-2">{description}</p>
  </div>
);

export default function FleetManagementFeaturePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-orange-50 via-white to-white pt-20 pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-100 rounded-full opacity-50 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Truck size={16} />
              Complete Fleet Management
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Manage Your Entire{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                Fleet in One Place
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Track vehicles, manage drivers, schedule maintenance, and keep your operation running smoothly
              with our comprehensive fleet management tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Managing Free
                <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Unlimited vehicles on Fleet plan
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Maintenance tracking
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Driver management
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three-Pillar Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Three Pillars of Fleet Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your trucking operation in one unified platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Vehicles */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <Truck size={32} className="text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Vehicles</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Track all trucks and trailers
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Monitor vehicle status (Active, Maintenance, Out of Service)
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Store VIN, license plates, and specs
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Filter by status, year, or search
                </li>
              </ul>
            </div>

            {/* Drivers */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Users size={32} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Drivers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Complete driver profiles
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  License and medical card tracking
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Expiration alerts (30/14/7 days)
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Document compliance status
                </li>
              </ul>
            </div>

            {/* Maintenance */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Wrench size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Maintenance</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Schedule preventive maintenance
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Track repair history
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Monitor maintenance costs
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Sync to expense tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Management Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Vehicle Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Keep track of every vehicle in your fleet with detailed profiles and real-time status
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail
              icon={Truck}
              title="Vehicle Profiles"
              description="Store complete vehicle information including make, model, year, VIN, license plate, and custom notes for each truck."
              color="orange"
            />
            <FeatureDetail
              icon={Gauge}
              title="Status Tracking"
              description="Monitor vehicle availability with clear status indicators: Active, In Maintenance, Out of Service, or Idle."
              color="blue"
            />
            <FeatureDetail
              icon={Search}
              title="Smart Filtering"
              description="Quickly find vehicles with powerful search and filter options. Search by name, make, model, VIN, or license plate."
              color="purple"
            />
            <FeatureDetail
              icon={BarChart2}
              title="Fleet Statistics"
              description="View at-a-glance stats showing total vehicles, how many are active, in maintenance, or out of service."
              color="green"
            />
            <FeatureDetail
              icon={Edit}
              title="Easy Updates"
              description="Add new vehicles or update existing ones with our intuitive form interface. Changes save instantly."
              color="indigo"
            />
            <FeatureDetail
              icon={ClipboardList}
              title="Assignment Ready"
              description="Vehicles are available for assignment to loads, drivers, and expense records throughout the system."
              color="teal"
            />
          </div>
        </div>
      </section>

      {/* Driver Management Features */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Users size={16} />
                  Driver Management
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Stay Compliant with Driver Document Tracking
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Never miss a license renewal or medical card expiration. Our driver management
                  system keeps you compliant and your drivers on the road.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Document Status Dashboard</h4>
                      <p className="text-gray-600 text-sm">See at a glance which drivers have valid, expiring, or expired documents</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Expiration Alerts</h4>
                      <p className="text-gray-600 text-sm">Get notified 30, 14, and 7 days before any driver document expires</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">License & Medical Card Tracking</h4>
                      <p className="text-gray-600 text-sm">Track CDL and medical card expiration dates for every driver</p>
                    </div>
                  </div>
                </div>
              </div>

              <ScreenshotPlaceholder
                title="Driver Management Dashboard"
                description="Replace with screenshot of drivers list with status indicators"
                icon={Users}
                color="blue"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Maintenance Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <ScreenshotPlaceholder
                title="Maintenance Records"
                description="Replace with screenshot of maintenance history view"
                icon={Wrench}
                color="green"
              />

              <div>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Wrench size={16} />
                  Maintenance Tracking
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Keep Your Trucks Running Smoothly
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Track all maintenance activities, schedule preventive service, and keep a complete
                  repair history for every vehicle in your fleet.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <Calendar size={24} className="text-green-600 mb-2" />
                    <h4 className="font-semibold text-gray-900">Schedule Service</h4>
                    <p className="text-gray-600 text-sm">Plan maintenance before breakdowns happen</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <Clock size={24} className="text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900">Track History</h4>
                    <p className="text-gray-600 text-sm">Complete service records for each vehicle</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <BarChart2 size={24} className="text-purple-600 mb-2" />
                    <h4 className="font-semibold text-gray-900">Cost Analysis</h4>
                    <p className="text-gray-600 text-sm">Monitor maintenance spend by vehicle</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <Shield size={24} className="text-orange-600 mb-2" />
                    <h4 className="font-semibold text-gray-900">Stay Compliant</h4>
                    <p className="text-gray-600 text-sm">DOT-ready maintenance documentation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Screenshots */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A clean, intuitive interface for managing your entire fleet
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScreenshotPlaceholder
              title="Vehicle List View"
              description="Replace with screenshot of trucks dashboard with stats"
              icon={Truck}
              color="orange"
            />
            <ScreenshotPlaceholder
              title="Add/Edit Vehicle Form"
              description="Replace with screenshot of vehicle form modal"
              icon={Plus}
              color="blue"
            />
            <ScreenshotPlaceholder
              title="Driver Status Dashboard"
              description="Replace with screenshot of driver compliance status"
              icon={Users}
              color="green"
            />
            <ScreenshotPlaceholder
              title="Maintenance Schedule"
              description="Replace with screenshot of maintenance records"
              icon={Wrench}
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Integrated Across Your Workflow
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fleet data connects seamlessly with other Truck Command features
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList size={28} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Dispatching</h3>
              <p className="text-gray-600 text-sm">
                Assign vehicles to loads directly from the dispatch screen
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin size={28} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">State Mileage</h3>
              <p className="text-gray-600 text-sm">
                Track mileage per vehicle for accurate IFTA reporting
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Expenses</h3>
              <p className="text-gray-600 text-sm">
                Associate expenses with specific vehicles for cost tracking
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Compliance</h3>
              <p className="text-gray-600 text-sm">
                Vehicle documents linked to compliance tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Fleet Owners
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See why trucking professionals choose Truck Command for fleet management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Testimonial
              quote="Having all my trucks and drivers in one place makes my life so much easier. I can see at a glance who's available and which trucks need attention."
              author="Mike D."
              role="Fleet Owner, 8 trucks"
            />
            <Testimonial
              quote="The driver document tracking saved me from a DOT violation. Got the alert about an expiring medical card with time to spare."
              author="Jennifer R."
              role="Safety Manager"
            />
            <Testimonial
              quote="Maintenance tracking is a game changer. I can see my total maintenance costs per truck and make better decisions about when to retire equipment."
              author="Carlos M."
              role="Owner-Operator, 3 trucks"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Common questions about fleet management
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <FAQItem
                question="How many vehicles can I add?"
                answer="The Basic plan includes 3 vehicles, Premium includes 10 vehicles, and the Fleet plan offers unlimited vehicles. You can upgrade at any time if you need to add more trucks to your fleet."
              />
              <FAQItem
                question="Can I track trailers too, or just trucks?"
                answer="Yes! You can add any type of equipment to your fleet - trucks, trailers, vans, or any other vehicles. Each gets its own profile with status tracking and can be assigned to loads."
              />
              <FAQItem
                question="How do driver document alerts work?"
                answer="The system automatically monitors all driver license and medical card expiration dates. You'll receive notifications at 30 days, 14 days, and 7 days before any document expires, giving you plenty of time to get renewals handled."
              />
              <FAQItem
                question="Does maintenance tracking sync with expenses?"
                answer="Yes! When you record maintenance on a vehicle, you can optionally sync it to your expense tracking. This helps you see true costs per vehicle and categorize maintenance expenses for tax purposes."
              />
              <FAQItem
                question="Can I export my fleet data?"
                answer="Yes, you can export your vehicle list, driver roster, and maintenance history as PDF or Excel files. This is useful for reporting, insurance documentation, or DOT audits."
              />
              <FAQItem
                question="What happens if a vehicle status changes?"
                answer="You can update vehicle status anytime - moving trucks to 'In Maintenance' when they're being serviced, or 'Out of Service' if they need repairs. The dashboard stats update in real-time to show your current fleet availability."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-600 to-amber-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Take Control of Your Fleet?
            </h2>
            <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
              Join thousands of trucking professionals who manage their entire fleet with Truck Command.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
              Explore other tools that work with Fleet Management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              href="/features/dispatching"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <ClipboardList size={24} className="text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                Dispatching
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Assign vehicles to loads and track deliveries
              </p>
            </Link>
            <Link
              href="/features/compliance"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <Shield size={24} className="text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                Compliance
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Track all your documents and certifications
              </p>
            </Link>
            <Link
              href="/features/expense-tracking"
              className="group p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <FileText size={24} className="text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                Expense Tracking
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Track costs per vehicle for better insights
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
