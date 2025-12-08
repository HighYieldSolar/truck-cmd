"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Zap, Shield, Clock, Award, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: "Basic",
      description: "Perfect for owner operators",
      monthlyPrice: 20,
      yearlyPrice: 16,
      limits: "1 truck, 1 driver",
      features: [
        "50 loads/month",
        "Basic invoicing",
        "Expense tracking",
        "Fuel logging",
        "Customer management (50 max)",
        "PDF exports",
        "Email support"
      ],
      highlighted: false,
      ctaText: "Start Free Trial",
      href: "/signup?plan=basic"
    },
    {
      name: "Premium",
      description: "Most popular for growing operations",
      monthlyPrice: 35,
      yearlyPrice: 28,
      limits: "3 trucks, 3 drivers",
      features: [
        "Unlimited loads",
        "Advanced invoicing",
        "IFTA calculator",
        "Compliance tracking",
        "State mileage reports",
        "Unlimited customers",
        "CSV exports",
        "Priority email support"
      ],
      highlighted: true,
      ctaText: "Start Free Trial",
      href: "/signup?plan=premium"
    },
    {
      name: "Fleet",
      description: "For established small fleets",
      monthlyPrice: 75,
      yearlyPrice: 60,
      limits: "12 trucks, 12 drivers",
      features: [
        "Everything in Premium",
        "Maintenance scheduling",
        "Fleet analytics",
        "Multi-user access (6 users)",
        "Excel exports",
        "SMS notifications",
        "Phone support",
        "Priority support"
      ],
      highlighted: false,
      ctaText: "Start Free Trial",
      href: "/signup?plan=fleet"
    }
  ];

  const faqs = [
    {
      question: "How does the free trial work?",
      answer: "Your 7-day free trial gives you full access to all features of your chosen plan. No credit card required to start. You can cancel anytime during the trial period with no charges."
    },
    {
      question: "Can I switch plans later?",
      answer: "Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at your next billing cycle."
    },
    {
      question: "How does IFTA reporting work?",
      answer: "Our IFTA calculator automatically tracks your mileage by state based on your loads and fuel purchases. At the end of each quarter, you can generate a complete IFTA report ready for filing—no spreadsheets needed."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use industry-standard encryption and secure cloud servers (powered by Supabase) to protect your data. Your information is backed up regularly and never shared with third parties."
    },
    {
      question: "What if I need help getting started?",
      answer: "We offer email support for all customers. Our support team consists of people who understand the trucking industry and can help you get set up quickly. Most users are up and running in under 10 minutes."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Yes, we offer a 30-day money-back guarantee if you're not completely satisfied with our service."
    }
  ];

  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start with a 7-day free trial. No credit card required. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly <span className="text-green-600 text-xs ml-1">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white shadow-xl scale-105'
                    : 'bg-white border border-gray-200 shadow-lg'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className={plan.highlighted ? 'text-blue-100' : 'text-gray-500'}>
                    /month
                  </span>
                  {billingCycle === 'yearly' && (
                    <p className={`text-sm mt-1 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                      Billed annually (${plan.yearlyPrice * 12}/year)
                    </p>
                  )}
                </div>

                <p className={`text-sm font-medium mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-gray-700'}`}>
                  {plan.limits}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={18} className={`flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-blue-200' : 'text-green-500'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-white' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-all ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            All plans include a 7-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Compare Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-gray-900 font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-gray-900 font-semibold">Basic</th>
                  <th className="px-6 py-4 text-center text-blue-600 font-semibold bg-blue-50">Premium</th>
                  <th className="px-6 py-4 text-center text-gray-900 font-semibold">Fleet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 text-gray-700">Trucks & Drivers</td>
                  <td className="px-6 py-4 text-center text-gray-600">1 each</td>
                  <td className="px-6 py-4 text-center text-gray-600 bg-blue-50">3 each</td>
                  <td className="px-6 py-4 text-center text-gray-600">12 each</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Loads per Month</td>
                  <td className="px-6 py-4 text-center text-gray-600">50</td>
                  <td className="px-6 py-4 text-center text-gray-600 bg-blue-50">Unlimited</td>
                  <td className="px-6 py-4 text-center text-gray-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Invoicing</td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center bg-blue-50"><Check size={20} className="text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Expense Tracking</td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center bg-blue-50"><Check size={20} className="text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">IFTA Calculator</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center bg-blue-50"><Check size={20} className="text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Compliance Tracking</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center bg-blue-50"><Check size={20} className="text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">State Mileage Reports</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center bg-blue-50"><Check size={20} className="text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Maintenance Scheduling</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center bg-blue-50 text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">CSV/Excel Exports</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center bg-blue-50 text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Priority Support</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center bg-blue-50 text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check size={20} className="text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Shield size={32} className="text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Bank-level Security</p>
            </div>
            <div className="flex flex-col items-center">
              <Clock size={32} className="text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">5-Minute Setup</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap size={32} className="text-yellow-600 mb-2" />
              <p className="text-sm text-gray-600">7-Day Free Trial</p>
            </div>
            <div className="flex flex-col items-center">
              <Award size={32} className="text-purple-600 mb-2" />
              <p className="text-sm text-gray-600">30-Day Money Back</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                  <HelpCircle size={20} className={`text-gray-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-gray-600">
            Still have questions?{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact Our Support Team
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Simplify Your Trucking Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join truckers who&apos;ve ditched the spreadsheets and complicated software.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              Start Your 7-Day Free Trial
              <ArrowRight size={20} />
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-4">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

    </div>
  );
}
