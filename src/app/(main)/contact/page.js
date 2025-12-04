"use client";

import { useState } from "react";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Send, 
  CheckCircle,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { ContactSection } from "@/components/sections";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-16 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 inline-block relative">
            Get In Touch
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-70 rounded"></div>
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            We&apos;re here to help with any questions about our trucking management software.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <ContactCard 
              icon={<Phone size={28} />}
              title="Call Us"
              content={<>
                <p className="text-lg font-medium">(951) 505-1147</p>
                <p className="text-sm opacity-90">Mon-Fri: 8am-8pm PST</p>
              </>}
            />
            
            <ContactCard 
              icon={<Mail size={28} />}
              title="Email Us"
              content={<>
                <p className="text-lg font-medium">support@truckcommand.com</p>
                <p className="text-sm opacity-90">We&apos;ll respond within 24 hours</p>
              </>}
            />
            
            <ContactCard 
              icon={<MessageSquare size={28} />}
              title="Live Chat"
              content={<>
                <p className="text-lg font-medium">Chat with Support</p>
                <p className="text-sm opacity-90">Available during business hours</p>
              </>}
              action={{
                text: "Start Chat",
                href: "#chat",
                onClick: (e) => {
                  e.preventDefault();
                  // Implement your chat functionality here
                  alert("Chat functionality would open here");
                }
              }}
            />
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Contact Info */}
            <div className="lg:w-1/3 bg-gradient-to-b from-blue-800 to-blue-900 text-white p-10">
              <h2 className="text-2xl font-bold mb-6 inline-block relative">
                Contact Information
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-400 rounded"></div>
              </h2>
              
              <div className="space-y-8 mt-10">
                <ContactInfoItem 
                  icon={<Phone size={24} />}
                  title="Phone"
                  content="(951) 505-1147"
                />
                
                <ContactInfoItem 
                  icon={<Mail size={24} />}
                  title="Email"
                  content="support@truckcommand.com"
                />
                
                
                <ContactInfoItem 
                  icon={<Clock size={24} />}
                  title="Business Hours"
                  content={<>
                    Monday - Friday: 8am - 8pm PST<br />
                    Saturday: 9am - 5pm PST<br />
                    Sunday: Closed
                  </>}
                />
              </div>
              
              <div className="mt-12">
                <h3 className="font-medium mb-4">Connect With Us</h3>
                <div className="flex space-x-4">
                  <SocialButton href="#" label="FB" />
                  <SocialButton href="#" label="TW" />
                  <SocialButton href="#" label="IG" />
                  <SocialButton href="#" label="LI" />
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="lg:w-2/3 p-10">
              <h2 className="text-2xl font-bold mb-6 inline-block relative text-gray-800">
                Send Us a Message
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
              </h2>
              
              <p className="text-gray-600 mb-8">
                Fill out the form below and our team will get back to you within one business day.
              </p>
              
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Help Resources Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center inline-block relative">
            Additional Resources
            <div className="absolute bottom-0 left-0 right-0 w-full h-1 bg-blue-500 rounded"></div>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <ResourceCard 
              title="Help Center"
              description="Browse through our knowledge base for answers to frequently asked questions."
              linkText="Visit Help Center"
              linkHref="/help"
            />
            
            <ResourceCard 
              title="Video Tutorials"
              description="Watch step-by-step guides to learn how to use Truck Command effectively."
              linkText="View Tutorials"
              linkHref="/tutorials"
            />
            
            <ResourceCard 
              title="Schedule a Demo"
              description="Get a personalized walkthrough of our platform with one of our experts."
              linkText="Book a Demo"
              linkHref="/demo"
            />
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-96 bg-gray-200 relative">
        {/* Map would go here - using a placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
          <p className="text-gray-700 text-xl">Interactive Map Would Go Here</p>
        </div>
      </section>
    </main>
  );
}

// Contact Hero Card Component
function ContactCard({ icon, title, content, action = null }) {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20 shadow-lg hover:bg-opacity-20 transition duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-white bg-opacity-20 rounded-full mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="mb-4">
          {content}
        </div>
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 px-4 py-2 bg-white text-blue-700 rounded-md hover:bg-blue-50 transition-colors inline-flex items-center"
          >
            {action.text}
            <ChevronRight size={16} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}

// Contact Information Item Component
function ContactInfoItem({ icon, title, content }) {
  return (
    <div className="flex items-start">
      <div className="p-2 bg-blue-700 rounded-lg mr-4">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-lg">{title}</h3>
        <div className="text-blue-100 mt-1">{content}</div>
      </div>
    </div>
  );
}

// Social Media Button Component
function SocialButton({ href, label }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-600 flex items-center justify-center transition-colors"
      aria-label={label}
    >
      {label}
    </a>
  );
}

// Contact Form Component
function ContactForm() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    fleetSize: '',
    message: '',
    submitted: false,
    error: false
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
    // In a real implementation, this would send the form data to your backend

    // Simulate success
    setFormState(prev => ({
      ...prev,
      submitted: true
    }));
  };

  if (formState.submitted) {
    return (
      <div className="bg-green-50 p-8 rounded-lg text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">Message Sent!</h3>
        <p className="text-green-700 mb-4">
          Thank you for contacting us. A member of our team will get back to you within 1 business day.
        </p>
        <button 
          onClick={() => setFormState(prev => ({ ...prev, submitted: false, name: '', email: '', phone: '', company: '', fleetSize: '', message: '' }))}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
          value={formState.fleetSize}
          onChange={handleChange}
        >
          <option value="">Select your fleet size</option>
          <option value="1-2">1-2 trucks</option>
          <option value="3-8">3-8 trucks</option>
          <option value="9-14">9-14 trucks</option>
          <option value="15-24">15-24 trucks</option>
          <option value="25+">25+ trucks</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Your Message *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          placeholder="How can we help you today?"
          value={formState.message}
          onChange={handleChange}
        ></textarea>
      </div>
      
      <div>
        <button
          type="submit"
          className="w-full px-6 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          Send Message
          <Send size={18} className="ml-2" />
        </button>
        <p className="text-sm text-gray-500 mt-2">
          * Required fields. We&apos;ll get back to you within 1 business day.
        </p>
      </div>
    </form>
  );
}

// Resource Card Component
function ResourceCard({ title, description, linkText, linkHref }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link href={linkHref} className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
        {linkText} <ChevronRight size={16} className="ml-1" />
      </Link>
    </div>
  );
}