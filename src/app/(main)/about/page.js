"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  Truck, 
  Users, 
  Target, 
  Award,
  CheckCircle,
  BarChart3,
  Shield,
  Clock
} from "lucide-react";

export default function AboutPage() {
  const stats = [
    { label: "Active Users", value: "10,000+" },
    { label: "Loads Managed", value: "500,000+" },
    { label: "Miles Tracked", value: "50M+" },
    { label: "Uptime", value: "99.9%" }
  ];

  const values = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security First",
      description: "Your data is protected with bank-level encryption and regular backups."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Customer Focused",
      description: "Built by truckers, for truckers. We understand your needs."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Data Driven",
      description: "Make informed decisions with powerful analytics and insights."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Always Available",
      description: "24/7 access to your business data from any device, anywhere."
    }
  ];

  const team = [
    {
      name: "John Smith",
      role: "CEO & Founder",
      bio: "Former owner-operator with 15 years in the trucking industry."
    },
    {
      name: "Sarah Johnson",
      role: "CTO",
      bio: "Software engineer passionate about solving logistics challenges."
    },
    {
      name: "Mike Davis",
      role: "Head of Customer Success",
      bio: "Dedicated to helping trucking businesses thrive with technology."
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
          <Truck className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">About Our Company</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Empowering trucking businesses with modern technology to streamline operations and maximize profits
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to modernize the trucking industry by providing owner-operators and small fleets 
            with enterprise-level tools at an affordable price. Our platform simplifies complex tasks, saves time, 
            and helps you focus on what matters most - growing your business.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600 inline-block mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose prose-lg text-gray-600 max-w-none">
            <p className="mb-4">
              Founded in 2020, our company was born from the frustration of managing a trucking business 
              with outdated tools and disconnected systems. As former owner-operators ourselves, we understood 
              the daily challenges of tracking loads, managing expenses, calculating IFTA, and keeping up with 
              compliance requirements.
            </p>
            <p className="mb-4">
              We set out to create an all-in-one solution that would bring together everything a trucking 
              business needs in one place. No more spreadsheets, no more paper logs, no more missed deadlines. 
              Just a simple, powerful platform that works as hard as you do.
            </p>
            <p>
              Today, we're proud to serve thousands of trucking businesses across the country, helping them 
              save time, reduce errors, and increase profitability. But we're just getting started. We're 
              constantly improving our platform based on your feedback, because your success is our success.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-6 text-blue-100">
            Join thousands of trucking businesses already using our platform
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}