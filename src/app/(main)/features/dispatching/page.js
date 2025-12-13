"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Check, BarChart2, MapPin, Calendar,
  Map, Smartphone, Repeat, RotateCw, FileText,
  Package, Truck, ChevronDown
} from "lucide-react";

// Example Testimonial Component
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

export default function DispatchingFeature() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Truck size={16} />
            Load Management
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Smart <span className="text-blue-600">Dispatching</span> for Your Fleet
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Optimize routes, assign loads efficiently, and track your fleet in real-time with our intuitive dispatching system built for trucking companies.
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
              href="#how-it-works"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              Learn More
            </a>
          </div>
          <p className="text-sm text-gray-500">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 inline-block relative">
              Why Choose Our Dispatching Solution
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded"></div>
            </h2>
          </div>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Streamline your fleet operations and maximize productivity
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetail 
              icon={<MapPin size={40} />} 
              title="Route Optimization" 
              description="Calculate the most efficient routes to minimize fuel costs, reduce empty miles, and maximize driving hours." 
            />
            <FeatureDetail 
              icon={<Map size={40} />} 
              title="Real-Time Tracking" 
              description="Monitor your entire fleet's location and status in real-time. Quickly identify and resolve issues as they arise." 
            />
            <FeatureDetail 
              icon={<Calendar size={40} />} 
              title="Scheduling Made Easy" 
              description="Drag-and-drop interface for assigning loads to drivers. Instantly see conflicts and resolve scheduling issues." 
            />
            <FeatureDetail 
              icon={<Smartphone size={40} />} 
              title="Mobile Driver App" 
              description="Drivers receive load assignments, route info, and document uploads directly on their smartphones." 
            />
            <FeatureDetail 
              icon={<BarChart2 size={40} />} 
              title="Performance Analytics" 
              description="Track key metrics like on-time delivery, driver productivity, and load profitability to optimize operations." 
            />
            <FeatureDetail 
              icon={<Repeat size={40} />} 
              title="Automated Workflows" 
              description="Create recurring shipments, alert triggers, and custom notifications to reduce manual tasks." 
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#222222] mb-4 inline-block relative">
              How Our Dispatching Works
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Efficient fleet management in just a few steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-blue-200 -z-10 transform -translate-y-1/2"></div>
            
            {[
              {
                step: "1",
                title: "Load Entry",
                description: "Enter new load details or import them from load boards and customer portals. Include pickup, delivery, rates, and special requirements."
              },
              {
                step: "2",
                title: "Assignment & Planning",
                description: "Use AI-assisted matching to find the best driver for each load based on location, hours of service, and qualifications."
              },
              {
                step: "3",
                title: "Real-Time Execution",
                description: "Track progress, communicate with drivers, and adapt to changes. Handle exceptions and keep customers updated automatically."
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
                Advanced Fleet Visibility
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Get complete visibility of your entire fleet on a user-friendly interface. Our interactive map shows:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Real-time location of all vehicles with status indicators</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Traffic and weather conditions affecting your routes</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Estimated arrival times based on real-time data</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Driver Hours of Service status and availability</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Historical route data for performance analysis</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 shadow-lg border border-blue-200">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <Image
                    src="/images/screenshots/load-management-light.png"
                    alt="Load management dashboard showing fleet visibility and load tracking"
                    width={800}
                    height={500}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center">
            <div className="md:w-1/2 pl-0 md:pl-12 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-6 inline-block relative">
                Intelligent Load Matching
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our AI-powered system matches the right driver to the right load by considering:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Driver location and proximity to pickup</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Hours of Service availability and constraints</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Driver preferences and qualifications</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Equipment requirements and compatibility</span>
                </li>
                <li className="flex items-start">
                  <Check size={24} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Opportunity for backhauls and load sequencing</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 shadow-lg border border-blue-200">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <Image
                    src="/images/screenshots/dispatching-detail.png"
                    alt="Load detail view showing assignment, route information, and driver details"
                    width={800}
                    height={500}
                    className="w-full h-auto"
                  />
                </div>
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
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Hear from trucking companies who&apos;ve improved their dispatching operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial 
              text="The route optimization alone saved us 15% on fuel costs. Being able to see our entire fleet on one screen has transformed how we manage our business."
              author="Robert Martinez"
              role="Operations Manager"
              company="RM Logistics"
            />
            <Testimonial 
              text="Our drivers love the mobile app. They get all the information they need without constant phone calls, and we can see exactly where they are at all times."
              author="Lisa Thompson"
              role="Dispatch Supervisor"
              company="Thompson Trucking"
            />
            <Testimonial 
              text="The load matching feature helps us assign the perfect driver for each job. Our on-time deliveries have increased by 23% since implementing Truck Command."
              author="David Wilson"
              role="Fleet Manager"
              company="Wilson Transport"
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
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded"></div>
            </h2>
          </div>
          
          <div className="space-y-2">
            <FAQItem 
              question="Does the dispatching system work with ELDs?"
              answer="Yes, our dispatching system integrates with most major ELD providers. This integration allows for automatic Hours of Service synchronization, preventing scheduling conflicts and compliance violations. You can easily connect your existing ELD system during the setup process."
            />
            <FAQItem 
              question="Can I customize the dispatch board view?"
              answer="Absolutely! The dispatch board is fully customizable. You can arrange columns, color-code loads by status or customer, create custom filters, and save different view configurations for different dispatchers or purposes. Each user can have their own preferred layout."
            />
            <FAQItem 
              question="How do drivers receive their assignments?"
              answer="Drivers receive assignments instantly through our mobile app with push notifications. They can view all load details, communicate with dispatch, capture signatures, and upload proof of delivery documents—all from their smartphone or tablet. For companies not using the mobile app, email and SMS notifications are also available."
            />
            <FAQItem 
              question="Can I integrate with load boards?"
              answer="Yes, Truck Command integrates with major load boards including DAT, Truckstop.com, and others. You can import loads directly into your dispatching system, eliminating double entry and ensuring accurate information. Our system also helps you track load profitability from acquisition to delivery."
            />
            <FAQItem 
              question="Does it work for specialized freight like refrigerated or hazmat?"
              answer="Yes, our dispatching system handles specialized freight requirements. You can set up custom fields for temperature ranges, hazmat classifications, equipment requirements, and other special handling instructions. These requirements are prominently displayed in driver assignments and factored into the load matching process."
            />
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Have more questions about our dispatching features?</p>
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
          <h2 className="text-4xl font-bold mb-6">Ready to Optimize Your Fleet Operations?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join hundreds of trucking companies that have improved efficiency and reduced costs with Truck Command&apos;s dispatching system.
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
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Discover more ways Truck Command can help your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-6">
                <div className="text-blue-600 mb-4">
                  <FileText size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Invoicing</h3>
                <p className="text-gray-600 mb-4">
                  Generate professional invoices automatically from completed loads and get paid faster.
                </p>
                <a 
                  href="/features/invoicing" 
                  className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-6">
                <div className="text-blue-600 mb-4">
                  <Package size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Fleet Tracking</h3>
                <p className="text-gray-600 mb-4">
                  Monitor your vehicles in real-time and optimize maintenance schedules.
                </p>
                <a 
                  href="/features/fleet-tracking" 
                  className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="p-6">
                <div className="text-blue-600 mb-4">
                  <RotateCw size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Route Optimization</h3>
                <p className="text-gray-600 mb-4">
                  Reduce miles, save fuel, and maximize asset utilization with intelligent routing.
                </p>
                <a 
                  href="/features/route-optimization" 
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