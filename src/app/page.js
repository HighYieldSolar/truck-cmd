"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText, Truck, Wallet, Users, Package, CheckCircle, Calculator, Fuel,
  ArrowRight, Shield, Clock, TrendingUp, Zap, Award, MapPin,
  ChevronRight, Check, DollarSign, BarChart3
} from "lucide-react";
import { FAQSection } from "@/components/sections";
import Navigation from '@/components/navigation';

// Social Proof Bar Component
const SocialProofBar = () => (
  <div className="bg-gray-50 border-y border-gray-100 py-4">
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-green-600" />
          <span>Bank-level security</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          <span>Setup in under 5 minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600" />
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-2">
          <Award size={18} className="text-yellow-600" />
          <span>7-day free trial</span>
        </div>
      </div>
    </div>
  </div>
);

// Target Audience Section
const TargetAudienceSection = () => {
  const audiences = [
    {
      icon: <Truck size={32} className="text-blue-600" />,
      title: "Owner Operators",
      description: "Running your own truck? Manage loads, track expenses, and handle IFTA calculations without the headache.",
      features: ["Simple invoicing", "Expense tracking", "IFTA reports", "Fuel logging"]
    },
    {
      icon: <Users size={32} className="text-blue-600" />,
      title: "Small Fleets",
      description: "Managing 2-12 trucks? Keep your drivers organized, track all vehicles, and stay compliant effortlessly.",
      features: ["Multi-truck management", "Driver assignments", "Compliance tracking", "Fleet reports"]
    },
    {
      icon: <BarChart3 size={32} className="text-blue-600" />,
      title: "Growing Operations",
      description: "Scaling your business? Our platform grows with you—from one truck to a full fleet.",
      features: ["Scalable pricing", "Customer CRM", "Advanced analytics", "Maintenance scheduling"]
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Truckers, By People Who Understand Trucking
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you&apos;re running a single truck or managing a growing fleet, Truck Command has the tools you need to succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audiences.map((audience, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                {audience.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{audience.title}</h3>
              <p className="text-gray-600 mb-6">{audience.description}</p>
              <ul className="space-y-2">
                {audience.features.map((feature, j) => (
                  <li key={j} className="flex items-center text-sm text-gray-700">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Features Section with Tabs
const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      icon: <FileText size={24} />,
      title: "Invoicing",
      shortDesc: "Get paid faster",
      description: "Create professional invoices in seconds. Track payments, send reminders, and get paid faster with our streamlined invoicing system.",
      benefits: ["One-click invoice generation", "Payment tracking & reminders", "PDF export for easy sharing", "Customer payment history"],
      screenshot: "/images/screenshots/invoices-light.png",
      screenshotDark: "/images/screenshots/invoices-dark.png"
    },
    {
      icon: <Truck size={24} />,
      title: "Load Management",
      shortDesc: "Dispatch with ease",
      description: "Manage all your loads from one dashboard. Assign drivers, track status, and keep your operations running smoothly.",
      benefits: ["Drag-and-drop dispatching", "Real-time status updates", "Driver assignments", "Load history & reporting"],
      screenshot: "/images/screenshots/load-management-light.png",
      screenshotDark: "/images/screenshots/load-management-dark.png"
    },
    {
      icon: <Calculator size={24} />,
      title: "IFTA Calculator",
      shortDesc: "Simplify tax season",
      description: "Automatically calculate your IFTA taxes by state. No more spreadsheets or manual calculations—just accurate reports every quarter.",
      benefits: ["Automatic state-by-state calculations", "Quarterly report generation", "Fuel purchase tracking", "Audit-ready documentation"],
      screenshot: "/images/screenshots/ifta-calculator-light.png",
      screenshotDark: "/images/screenshots/ifta-calculator-dark.png"
    },
    {
      icon: <Wallet size={24} />,
      title: "Expense Tracking",
      shortDesc: "Know your costs",
      description: "Track every dollar going out. Categorize expenses, upload receipts, and understand where your money goes.",
      benefits: ["Categorized expense tracking", "Receipt photo uploads", "Fuel expense auto-sync", "Tax-ready reports"],
      screenshot: "/images/screenshots/expenses-light.png",
      screenshotDark: "/images/screenshots/expenses-dark.png"
    },
    {
      icon: <CheckCircle size={24} />,
      title: "Compliance",
      shortDesc: "Stay DOT ready",
      description: "Never miss a renewal. Track license expirations, medical cards, and all your compliance documents in one place.",
      benefits: ["Document expiration alerts", "License & permit tracking", "Driver qualification files", "Compliance dashboard"],
      screenshot: "/images/screenshots/compliance-light.png",
      screenshotDark: "/images/screenshots/compliance-dark.png"
    },
    {
      icon: <Fuel size={24} />,
      title: "Fuel Tracker",
      shortDesc: "Optimize fuel costs",
      description: "Log fuel purchases, track MPG, and sync directly with your IFTA reports. Every gallon accounted for.",
      benefits: ["Per-gallon cost tracking", "State-by-state fuel logs", "MPG calculations", "Auto-sync to expenses"],
      screenshot: "/images/screenshots/fuel-tracker-light.png",
      screenshotDark: "/images/screenshots/fuel-tracker-dark.png"
    },
    {
      icon: <MapPin size={24} />,
      title: "State Mileage",
      shortDesc: "Track every mile",
      description: "Automatically track miles driven in each state for accurate IFTA reporting. No more manual logs or guesswork.",
      benefits: ["Automatic state tracking", "IFTA report integration", "Load-based calculations", "Quarterly summaries"],
      screenshot: "/images/screenshots/state-mileage-light.png",
      screenshotDark: "/images/screenshots/state-mileage-dark.png"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Run Your Trucking Business
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed specifically for truckers. Simple enough to use on the road.
          </p>
        </div>

        {/* Feature Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {features.map((feature, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === i
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {feature.icon}
              <span className="hidden sm:inline">{feature.title}</span>
            </button>
          ))}
        </div>

        {/* Active Feature Display */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                {features[activeTab].icon}
                {features[activeTab].shortDesc}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {features[activeTab].title}
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                {features[activeTab].description}
              </p>
              <ul className="space-y-3 mb-8">
                {features[activeTab].benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
              <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                <Image
                  src={features[activeTab].screenshot}
                  alt={`${features[activeTab].title} Screenshot`}
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
  );
};

// Pricing Preview Section
const PricingPreview = () => {
  const plans = [
    {
      name: "Basic",
      price: 20,
      description: "Perfect for owner operators",
      features: ["1 truck, 1 driver", "50 loads/month", "Invoicing & expenses", "Fuel tracking", "Basic dashboard"]
    },
    {
      name: "Premium",
      price: 35,
      description: "Most popular for growing operations",
      popular: true,
      features: ["3 trucks, 3 drivers", "Unlimited loads", "IFTA calculator", "Compliance tracking", "State mileage reports"]
    },
    {
      name: "Fleet",
      price: 75,
      description: "For established small fleets",
      features: ["12 trucks, 12 drivers", "Maintenance scheduling", "CSV/Excel exports", "Fleet analytics", "Priority support"]
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 7-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, i) => (
            <div key={i} className={`relative bg-white rounded-2xl border-2 p-6 ${plan.popular ? 'border-blue-600 shadow-xl' : 'border-gray-200'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center text-sm text-gray-600">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/signup?plan=${plan.name.toLowerCase()}`}
                className={`block text-center py-3 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Start Free Trial
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/pricing" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700">
            View full pricing details
            <ChevronRight size={18} className="ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// Comparison Section
const ComparisonSection = () => (
  <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Why Truckers Choose Truck Command
        </h2>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
          We built Truck Command to be the easiest-to-use TMS for fleets of all sizes—from single owner operators to growing businesses.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DollarSign size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Simple Pricing</h3>
          <p className="text-blue-100">Transparent plans that scale with your business. No hidden fees, no surprises.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">5-Minute Setup</h3>
          <p className="text-blue-100">No complicated onboarding. Sign up, add your truck, and start managing your business immediately.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Built to Grow</h3>
          <p className="text-blue-100">Start with one truck and scale to twelve. Upgrade your plan as your business grows.</p>
        </div>
      </div>
    </div>
  </section>
);

// Testimonials Section (Modern quote cards style)
const TestimonialsSection = () => {
  const testimonials = [
    {
      text: "Finally, software that doesn't cost an arm and a leg. I was paying $50/month for another TMS that I barely used. Truck Command gives me everything I need for $20.",
      name: "Marcus Johnson",
      title: "Owner-Operator, Texas",
      highlight: false
    },
    {
      text: "The best part is how everything connects together. I can track fuel, log expenses, and generate IFTA reports with just a few clicks. No more juggling spreadsheets and losing receipts. These days, I recommend Truck Command to every owner operator I know.",
      name: "David Thompson",
      title: "Fleet Owner, 4 Trucks",
      highlight: true
    },
    {
      text: "I'm using Truck Command to manage all my loads and invoicing. The whole process is streamlined—from dispatching to getting paid. It's saved me hours every week.",
      name: "Robert Martinez",
      title: "Owner-Operator, Arizona",
      highlight: false
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Our happy customers say
          </h2>
        </div>

        {/* Desktop Layout - Asymmetric grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:border-gray-300">
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                &ldquo;{testimonials[0].text}&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {testimonials[0].name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{testimonials[0].name}</p>
                  <p className="text-sm text-gray-500">{testimonials[0].title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:border-gray-300">
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                &ldquo;{testimonials[1].text}&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                  {testimonials[1].name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{testimonials[1].name}</p>
                  <p className="text-sm text-gray-500">{testimonials[1].title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center card */}
        <div className="hidden md:flex justify-center mt-6">
          <div className="max-w-xl bg-white rounded-2xl p-8 border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow hover:border-blue-200">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              &ldquo;{testimonials[2].text}&rdquo;
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                {testimonials[2].name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{testimonials[2].name}</p>
                <p className="text-sm text-gray-500">{testimonials[2].title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Stacked cards */}
        <div className="md:hidden space-y-4">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl p-6 border shadow-sm ${
                i === 2 ? 'border-2 border-blue-100' : 'border-gray-200'
              }`}
            >
              <p className="text-gray-700 leading-relaxed mb-4">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  i === 0 ? 'bg-blue-100 text-blue-600' :
                  i === 1 ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {testimonial.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Start Free Trial
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

// Final CTA Section
const FinalCTA = () => (
  <section className="py-20 bg-white">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Ready to Simplify Your Trucking Business?
      </h2>
      <p className="text-xl text-gray-600 mb-8">
        Join truckers who&apos;ve ditched the spreadsheets and complicated software. Start your free trial today.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        <Link href="/signup" className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          Start Free Trial
          <ArrowRight size={20} />
        </Link>
        <Link href="/pricing" className="px-8 py-4 bg-gray-100 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
          View Pricing
        </Link>
      </div>
      <p className="text-gray-500 text-sm">
        No credit card required • Cancel anytime • Full access to all features
      </p>
    </div>
  </section>
);

// Footer Component (Updated with proper social icons)
const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <Image
            src="/images/tc white-logo with name.png"
            alt="Truck Command"
            width={140}
            height={46}
            className="h-10 w-auto mb-4"
          />
          <p className="text-sm mb-4">
            Efficiency in Motion,<br />Profit in Command
          </p>
          <p className="text-sm">
            Trucking management software for fleets of all sizes.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Features</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/features/invoicing" className="hover:text-white transition-colors">Invoicing</Link></li>
            <li><Link href="/features/dispatching" className="hover:text-white transition-colors">Load Management</Link></li>
            <li><Link href="/features/ifta-calculator" className="hover:text-white transition-colors">IFTA Calculator</Link></li>
            <li><Link href="/features/expense-tracking" className="hover:text-white transition-colors">Expense Tracking</Link></li>
            <li><Link href="/features/compliance" className="hover:text-white transition-colors">Compliance</Link></li>
            <li><Link href="/features/fuel-tracker" className="hover:text-white transition-colors">Fuel Tracker</Link></li>
            <li><Link href="/features/state-mileage" className="hover:text-white transition-colors">State Mileage</Link></li>
            <li><Link href="/features/fleet-tracking" className="hover:text-white transition-colors">Fleet Management</Link></li>
            <li><Link href="/features/customer-management" className="hover:text-white transition-colors">Customer CRM</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} Truck Command. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">support@truckcommand.com</span>
        </div>
      </div>
    </div>
  </footer>
);

// Main Landing Page Component
export default function LandingPage() {
  // Updated FAQ data (removed mobile app claim)
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
      question: "Can I import my existing data?",
      answer: "Yes! You can manually enter your existing customers, trucks, and driver information. We're working on CSV import functionality to make bulk data entry even easier."
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Screenshot behind text - positioned more to the right */}
            <div className="hidden lg:block lg:absolute lg:-right-8 xl:-right-12 lg:top-1/2 lg:-translate-y-1/2 lg:w-[45%] xl:w-[48%] z-0">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                  <Image
                    src="/images/screenshots/dashboard-light.png"
                    alt="Truck Command Dashboard"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                    quality={100}
                    priority
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500 rounded-full opacity-10 blur-2xl"></div>
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-400 rounded-full opacity-10 blur-2xl"></div>
              </div>
            </div>

            {/* Text content - overlaps the screenshot */}
            <div className="lg:w-1/2 text-center lg:text-left relative z-10">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap size={16} />
                Built for owner-operators & small fleets
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Run Your Trucking Business{" "}
                <span className="text-blue-600">in One Simple Dashboard</span>
              </h1>

              <p className="text-xl text-gray-600 mb-4 max-w-xl">
                Invoicing, expenses, IFTA calculations, and compliance tracking—all in one simple platform built for truckers.
              </p>

              <p className="text-lg text-blue-600 font-medium mb-8">
                Plans starting at just $20/month
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
                >
                  View Pricing
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Shield size={14} className="text-green-600" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-600" />
                  7-day free trial
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-600" />
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Mobile screenshot */}
            <div className="lg:hidden w-full">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/images/screenshots/dashboard-light.png"
                  alt="Truck Command Dashboard"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  quality={100}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              No complicated setup. No training required. Just sign up and go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Your Account",
                description: "Sign up in under 2 minutes. Add your company info and you're ready to roll."
              },
              {
                step: "2",
                title: "Add Your Trucks & Drivers",
                description: "Enter your fleet information. Track one truck or twelve—it's up to you."
              },
              {
                step: "3",
                title: "Start Managing",
                description: "Create invoices, log expenses, track loads, and generate IFTA reports with ease."
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <TargetAudienceSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Pricing Preview */}
      <PricingPreview />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection
        title="Frequently Asked Questions"
        faqs={faqs}
        contactCTA={true}
        background="white"
      />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}
