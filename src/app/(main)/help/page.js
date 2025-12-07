"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  HelpCircle, 
  MessageCircle, 
  FileText, 
  Phone, 
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Book,
  Video,
  Users
} from "lucide-react";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How do I add a new driver to my fleet?",
      answer: "Navigate to Dashboard > Fleet Management > Drivers. Click the 'Add Driver' button and fill in the required information including name, CDL number, and contact details."
    },
    {
      question: "How can I track fuel expenses for IFTA reporting?",
      answer: "Go to Dashboard > Fuel Tracker. Enter each fuel purchase with the state, gallons, and price. The system automatically syncs with your IFTA reports and expense tracking."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit cards, debit cards, and ACH bank transfers through our secure Stripe payment system."
    },
    {
      question: "How do I export my data?",
      answer: "Most pages have an 'Export' button that allows you to download your data in CSV or PDF format. For full data export, visit Settings > Privacy."
    },
    {
      question: "Can I customize invoice templates?",
      answer: "Yes! Go to Dashboard > Invoices and click on 'Invoice Settings' to customize your company information, logo, and invoice terms."
    },
    {
      question: "How does the trial period work?",
      answer: "You get a 7-day free trial with full access to all features. No credit card required to start. You can upgrade anytime during or after the trial."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use bank-level encryption, secure cloud storage with Supabase, and regular automated backups to ensure your data is always safe and accessible."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime from Settings > Billing. Your data remains accessible until the end of your billing period, and you can export it anytime."
    }
  ];

  const supportChannels = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat",
      available: "Mon-Fri, 9am-6pm EST"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "We'll respond within 24 hours",
      action: "support@truckingapp.com",
      available: "24/7 response time"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak with our support team",
      action: "1-800-TRUCKING",
      available: "Mon-Fri, 9am-6pm EST"
    }
  ];

  const resources = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Documentation",
      description: "Detailed guides for every feature",
      link: "/docs"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      link: "/tutorials"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community Forum",
      description: "Connect with other trucking businesses",
      link: "/community"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Find answers to common questions, access resources, or contact our support team
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/dashboard/settings" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Account Settings</h3>
              <p className="text-gray-600">Manage your profile, password, and preferences</p>
            </Link>
            <Link href="/dashboard/upgrade" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Billing & Plans</h3>
              <p className="text-gray-600">View plans, manage subscription, and payment methods</p>
            </Link>
            <Link href="/dashboard/settings/notifications" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
              <p className="text-gray-600">Configure email and in-app notification preferences</p>
            </Link>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="bg-white rounded-lg shadow">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 last:border-b-0">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Channels */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportChannels.map((channel, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    {channel.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{channel.title}</h3>
                <p className="text-gray-600 mb-4">{channel.description}</p>
                <p className="font-medium text-blue-600 mb-2">{channel.action}</p>
                <p className="text-sm text-gray-500">{channel.available}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Resources */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <Link key={index} href={resource.link} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600">
                    {resource.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-600">{resource.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}