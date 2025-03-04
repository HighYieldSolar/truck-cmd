"use client";

import { useState } from "react";
import { HelpCircle, Check, X, Star, ArrowRight } from "lucide-react";
import PlanCard from "@/components/pricing/PlanCard";
import BillingToggle from "@/components/pricing/BillingToggle";
import { CTASection, FAQSection } from "@/components/sections";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('yearly');

  // Owner-operator plan features
  const basicFeatures = [
    { included: true, text: "Basic Invoicing & Dispatching" },
    { included: true, text: "Simple Expense Tracking" },
    { included: true, text: "Standard Reports" },
    { included: true, text: "Single User Account" },
    { included: false, text: "Advanced IFTA Tools" },
    { included: false, text: "Load Optimization" }
  ];
  
  const premiumFeatures = [
    { included: true, text: "Advanced Invoicing & Dispatching" },
    { included: true, text: "Comprehensive Expense Tracking" },
    { included: true, text: "Advanced Reports & Analytics" },
    { included: true, text: "Customer Management System" },
    { included: true, text: "Advanced IFTA Calculator" },
    { included: true, text: "Priority Email Support" }
  ];
  
  // Fleet plan features
  const smallFleetFeatures = [
    { included: true, text: "All Premium Features" },
    { included: true, text: "Fleet Management Tools" },
    { included: true, text: "Real-time GPS Tracking" },
    { included: true, text: "Team Access (1 User per 2 Trucks)" },
    { included: true, text: "Fuel & Load Optimizations" }
  ];
  
  const mediumFleetFeatures = [
    { included: true, text: "All Small Fleet Features" },
    { included: true, text: "Enhanced Fleet Reporting" },
    { included: true, text: "Performance Analytics" },
    { included: true, text: "More User Seats" },
    { included: true, text: "Priority Support" }
  ];
  
  const largeFleetFeatures = [
    { included: true, text: "All Medium Fleet Features" },
    { included: true, text: "Comprehensive Analytics" },
    { included: true, text: "Custom Integrations" },
    { included: true, text: "Dedicated Support Team" },
    { included: true, text: "Training Resources" }
  ];

  // FAQ items for the pricing page
  const pricingFAQs = [
    {
      question: "Can I upgrade or downgrade my plan at any time?",
      answer: "Yes, you can upgrade your plan at any time and the changes will take effect immediately. Downgrades will be applied at the start of your next billing cycle."
    },
    {
      question: "Do you offer discounts for annual payments?",
      answer: "Yes, you'll save 20% when you choose annual billing for any of our plans."
    },
    {
      question: "What happens after my free trial ends?",
      answer: "After your 7-day free trial, you'll automatically be billed for the plan you selected. Don't worry - we'll send you a reminder before your trial ends."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Yes, we offer a 30-day money-back guarantee if you're not completely satisfied with our service."
    }
  ];

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Pricing Hero Section */}
      <section className="relative py-16 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 inline-block relative">
            Simple, Transparent Pricing
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-70 rounded"></div>
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Choose the right plan for your trucking business. No hidden fees. No long-term contracts. Scale as you grow.</p>
          
          {/* Billing Toggle */}
          <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 -mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-16">
            {/* Owner-Operators Section */}
            <div>
              <h3 className="text-3xl font-bold mb-8 text-center inline-block relative">
                Owner-Operators <span className="text-gray-500">(1–2 Trucks)</span>
                <div className="absolute bottom-0 left-0 right-0 w-full h-1 bg-blue-500 rounded"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {/* Basic Plan */}
                <PlanCard 
                  name="Basic Plan"
                  price={19}
                  yearlyPrice={16}
                  billingCycle={billingCycle}
                  features={basicFeatures}
                  ctaText="Start Free Trial"
                  ctaLink="/signup"
                  freeTrial={true}
                />
                
                {/* Premium Plan */}
                <PlanCard 
                  name="Premium Plan"
                  price={39}
                  yearlyPrice={33}
                  billingCycle={billingCycle}
                  features={premiumFeatures}
                  ctaText="Start Free Trial"
                  ctaLink="/signup"
                  freeTrial={true}
                  highlighted={true}
                />
              </div>
            </div>
            
            {/* Fleet Plans Section */}
            <div>
              <h3 className="text-3xl font-bold mb-8 text-center inline-block relative">
                Fleet Plans
                <div className="absolute bottom-0 left-0 right-0 w-full h-1 bg-blue-500 rounded"></div>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                {/* Small Fleet */}
                <PlanCard 
                  name="Small Fleet"
                  description="3–8 Trucks"
                  price={69}
                  yearlyPrice={55}
                  billingCycle={billingCycle}
                  features={smallFleetFeatures}
                  ctaText="Get Started"
                  ctaLink="/signup"
                  freeTrial={false}
                />
                
                {/* Medium Fleet */}
                <PlanCard 
                  name="Medium Fleet"
                  description="9–14 Trucks"
                  price={159}
                  yearlyPrice={127}
                  billingCycle={billingCycle}
                  features={mediumFleetFeatures}
                  ctaText="Get Started"
                  ctaLink="/signup"
                  freeTrial={false}
                />
                
                {/* Large Fleet */}
                <PlanCard 
                  name="Large Fleet"
                  description="15–24 Trucks"
                  price={219}
                  yearlyPrice={175}
                  billingCycle={billingCycle}
                  features={largeFleetFeatures}
                  ctaText="Get Started"
                  ctaLink="/signup"
                  freeTrial={false}
                />
              </div>
            </div>
            
            {/* Enterprise Plan Section */}
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl text-white shadow-xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-3xl opacity-10 transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full filter blur-3xl opacity-10 transform -translate-x-1/3 translate-y-1/2"></div>
              
              <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-8 md:mb-0 md:w-2/3">
                    <div className="flex items-center">
                      <div className="mr-4 p-2 bg-white bg-opacity-20 rounded-lg">
                        <Star size={28} className="text-yellow-300" />
                      </div>
                      <h3 className="text-3xl font-bold">Enterprise Plan</h3>
                    </div>
                    <p className="mt-4 text-xl">For large operations with 25+ trucks</p>
                    <ul className="mt-6 space-y-2">
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>Customized Solutions & Pricing</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>API Access & Custom Integrations</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>AI-Powered Route Optimization</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>White-Labeling Options</span>
                      </li>
                      <li className="flex items-center">
                        <Check size={20} className="text-green-400 mr-2" />
                        <span>Dedicated Account Manager</span>
                      </li>
                    </ul>
                  </div>
                  <div className="text-center bg-white bg-opacity-10 p-6 rounded-lg">
                    <p className="text-lg font-semibold mb-4">Contact our sales team for a custom quote</p>
                    <a
                      href="/contact-sales"
                      className="block w-full text-center px-6 py-3 bg-white text-blue-800 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold transform hover:scale-105"
                    >
                      Request Demo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Comparison */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold mb-8 text-center inline-block relative">
              Feature Comparison
              <div className="absolute bottom-0 left-0 right-0 w-full h-1 bg-blue-500 rounded"></div>
            </h3>
            <div className="overflow-x-auto mt-10">
              <FeatureComparisonTable />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection faqs={pricingFAQs} background="gray" />

      {/* Call-to-Action Section */}
      <CTASection
        title="Start Managing Your Business Better"
        description="Join thousands of trucking businesses that have increased their efficiency and profitability with Truck Command."
        primaryButtonText="Start Your Free Trial"
        secondaryButtonText="Request Demo"
        secondaryButtonHref="/demo"
        footnote="No credit card required • Cancel anytime"
      />
    </main>
  );
}

// Feature Comparison Table Component
function FeatureComparisonTable() {
  return (
    <table className="w-full bg-white rounded-lg shadow-lg">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-6 py-4 text-left">Feature</th>
          <th className="px-6 py-4 text-center">Basic</th>
          <th className="px-6 py-4 text-center">Premium</th>
          <th className="px-6 py-4 text-center">Fleet Plans</th>
          <th className="px-6 py-4 text-center">Enterprise</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        <tr>
          <td className="px-6 py-4">Invoicing</td>
          <td className="px-6 py-4 text-center">Basic</td>
          <td className="px-6 py-4 text-center">Advanced</td>
          <td className="px-6 py-4 text-center">Advanced</td>
          <td className="px-6 py-4 text-center">Custom</td>
        </tr>
        <tr>
          <td className="px-6 py-4">Dispatching</td>
          <td className="px-6 py-4 text-center">Basic</td>
          <td className="px-6 py-4 text-center">Advanced</td>
          <td className="px-6 py-4 text-center">Advanced</td>
          <td className="px-6 py-4 text-center">Custom</td>
        </tr>
        <tr>
          <td className="px-6 py-4">Expense Tracking</td>
          <td className="px-6 py-4 text-center">Basic</td>
          <td className="px-6 py-4 text-center">Advanced</td>
          <td className="px-6 py-4 text-center">Advanced</td>
          <td className="px-6 py-4 text-center">Custom</td>
        </tr>
        <tr>
          <td className="px-6 py-4">IFTA Calculator</td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
        </tr>
        <tr>
          <td className="px-6 py-4">Fleet Tracking</td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center">Basic</td>
          <td className="px-6 py-4 text-center">Advanced</td>
          <td className="px-6 py-4 text-center">Advanced</td>
        </tr>
        <tr>
          <td className="px-6 py-4">Multi-User Access</td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
        </tr>
        <tr>
          <td className="px-6 py-4">API Access</td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center">Limited</td>
          <td className="px-6 py-4 text-center">Full</td>
        </tr>
        <tr>
          <td className="px-6 py-4">White-Labeling</td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><X size={20} className="text-red-500 mx-auto" /></td>
          <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
        </tr>
      </tbody>
    </table>
  );
}