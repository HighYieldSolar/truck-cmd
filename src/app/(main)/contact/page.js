"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Send,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ChevronRight
} from "lucide-react";

// Contact Form Component
function ContactForm() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    fleetSize: '',
    message: '',
    submitted: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormState(prev => ({
      ...prev,
      submitted: true
    }));
  };

  if (formState.submitted) {
    return (
      <div className="bg-green-50 p-8 rounded-2xl text-center border border-green-100">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">Message Sent!</h3>
        <p className="text-green-700 mb-6">
          Thank you for contacting us. We&apos;ll get back to you within 1 business day.
        </p>
        <button
          onClick={() => setFormState({ name: '', email: '', phone: '', company: '', fleetSize: '', message: '', submitted: false })}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Your Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            placeholder="John Smith"
            value={formState.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email Address *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            placeholder="john@example.com"
            value={formState.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            placeholder="(555) 123-4567"
            value={formState.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-gray-700 font-medium mb-2">Company Name</label>
          <input
            id="company"
            name="company"
            type="text"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            placeholder="Your Trucking Company"
            value={formState.company}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="fleetSize" className="block text-gray-700 font-medium mb-2">Fleet Size</label>
        <select
          id="fleetSize"
          name="fleetSize"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
          value={formState.fleetSize}
          onChange={handleChange}
        >
          <option value="">Select your fleet size</option>
          <option value="1">1 truck (Owner Operator)</option>
          <option value="2-3">2-3 trucks</option>
          <option value="4-6">4-6 trucks</option>
          <option value="7-12">7-12 trucks</option>
          <option value="13+">13+ trucks</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Your Message *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white resize-none"
          placeholder="How can we help you today?"
          value={formState.message}
          onChange={handleChange}
        ></textarea>
      </div>

      <div>
        <button
          type="submit"
          className="w-full px-6 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Send Message
          <Send size={18} />
        </button>
        <p className="text-sm text-gray-500 mt-3 text-center">
          * Required fields. We typically respond within 24 hours.
        </p>
      </div>
    </form>
  );
}

export default function ContactPage() {
  const contactMethods = [
    {
      icon: <Mail size={24} />,
      title: "Email Support",
      description: "Get help via email",
      contact: "support@truckcommand.com",
      note: "We respond within 24 hours"
    },
    {
      icon: <Clock size={24} />,
      title: "Business Hours",
      description: "When we're available",
      contact: "Monday - Friday",
      note: "8am - 8pm Pacific Time"
    }
  ];

  return (
    <div className="bg-white">

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MessageSquare size={16} />
            Get in Touch
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            We&apos;re Here to{" "}
            <span className="text-blue-600">Help</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about Truck Command? Our team is ready to help you get started
            or solve any issues you might have.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  {method.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{method.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{method.description}</p>
                <p className="font-semibold text-gray-900 mb-1">{method.contact}</p>
                <p className="text-gray-500 text-sm">{method.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and our team will get back to you within one business day.
              </p>
              <ContactForm />
            </div>

            {/* Help Resources */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Help</h2>
              <p className="text-gray-600 mb-8">
                Looking for answers? Check out these resources while you wait for a response.
              </p>

              <div className="space-y-4">
                <Link
                  href="/faq"
                  className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">FAQ</h3>
                      <p className="text-gray-500 text-sm">Find answers to common questions</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>

                <Link
                  href="/pricing"
                  className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Pricing</h3>
                      <p className="text-gray-500 text-sm">View our plans and features</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>

                <Link
                  href="/signup"
                  className="flex items-center justify-between p-6 bg-blue-600 rounded-2xl hover:bg-blue-700 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      <ArrowRight size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Start Free Trial</h3>
                      <p className="text-blue-100 text-sm">7 days free, no credit card required</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/70" />
                </Link>
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Response Times</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Email: Within 24 hours
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Phone: Real-time during business hours
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Urgent issues: Same-day response
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Try Truck Command free for 7 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-gray-100 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
