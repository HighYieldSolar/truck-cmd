"use client";

import Link from "next/link";
import {
  Truck,
  Users,
  Target,
  Award,
  BarChart3,
  Shield,
  Clock,
  Heart,
  Zap,
  ArrowRight,
  Check
} from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security First",
      description: "Your data is protected with bank-level encryption and regular backups. We never share your information."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Built for Truckers",
      description: "We understand the trucking industry because we've lived it. Every feature is designed with real truckers in mind."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Simple & Fast",
      description: "No complicated setups or training required. Get started in minutes and see results immediately."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Always Available",
      description: "Access your business data 24/7 from any device. Your trucking business never sleeps, and neither do we."
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Truck size={16} />
            About Truck Command
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Simplifying Trucking{" "}
            <span className="text-blue-600">One Mile at a Time</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;re on a mission to give owner-operators and small fleets the same powerful tools
            that big companies have—without the big price tag or complexity.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                The trucking industry runs on hard work, long hours, and tight margins.
                We believe managing your business shouldn&apos;t add to that stress.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Truck Command was built to be the all-in-one solution that truckers actually want to use.
                No bloated features you&apos;ll never touch. No enterprise pricing that eats into your profits.
                Just the tools you need to invoice faster, track expenses, stay compliant, and grow your business.
              </p>
              <div className="space-y-3">
                {[
                  "Affordable pricing for every fleet size",
                  "Features designed by people who understand trucking",
                  "Support that actually helps when you need it"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check size={20} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-8 md:p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Goal</h3>
                <p className="text-gray-600">
                  To be the trucking management platform that owner-operators and small fleets
                  actually recommend to each other—because it works, it&apos;s affordable, and it makes their lives easier.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <p className="text-xl text-gray-600">
              How frustration with outdated software led to something better
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto">
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p className="mb-6">
                Truck Command started with a simple question: <em>Why is trucking software so complicated and expensive?</em>
              </p>
              <p className="mb-6">
                We saw owner-operators juggling spreadsheets, paper logs, and overpriced software that was built
                for massive enterprises—not for the guy running three trucks and trying to make a living.
              </p>
              <p className="mb-6">
                So we built something different. A platform that does what truckers actually need:
                create invoices quickly, track expenses without headaches, calculate IFTA automatically,
                and stay on top of compliance deadlines.
              </p>
              <p>
                Today, Truck Command helps trucking businesses across the country save time, reduce stress,
                and focus on what they do best—moving freight and building their business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Believe
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we build
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Truckers Choose Us */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Truckers Choose Truck Command
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Real benefits for real trucking businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Save Hours Every Week</h3>
              <p className="text-blue-100">Stop wrestling with spreadsheets. Automate invoicing, expense tracking, and IFTA calculations.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Stay Compliant</h3>
              <p className="text-blue-100">Never miss a deadline. Track document expirations, maintenance schedules, and regulatory requirements.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Grow Your Business</h3>
              <p className="text-blue-100">From one truck to twelve, our platform scales with you. Upgrade your plan as your fleet grows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Simplify Your Trucking Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join truckers who&apos;ve made the switch to Truck Command. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Your 7-Day Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-gray-100 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            No credit card required • Cancel anytime • Full access to all features
          </p>
        </div>
      </section>

    </div>
  );
}
