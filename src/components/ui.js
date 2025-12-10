// src/components/ui/index.js
"use client";
import { useState } from "react";
import Link from 'next/link';
import { 
  Star, 
  ChevronDown, 
  CheckCircle, 
  Send,
  EyeIcon, 
  EyeOffIcon
} from "lucide-react";

export function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
      <div className="flex items-start space-x-4">
        <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
          {icon}
        </div>
        <div>
          <h4 className="text-xl font-semibold text-[#222222] group-hover:text-[#007BFF] transition-colors">
            {title}
          </h4>
          <p className="text-[#4A4A4A] mt-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialCard({ text, name, role, company, rating = 5 }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={20} className="text-yellow-400 fill-current" />
        ))}
      </div>
      <blockquote className="italic text-lg text-gray-700 mb-4">
        {text}
      </blockquote>
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
          {name.split(' ')[0][0]}{name.split(' ')[1]?.[0] || ''}
        </div>
        <span className="ml-3 font-semibold text-gray-900">
          - {name}{role && company ? `, ${role}, ${company}` : ''}
        </span>
      </div>
    </div>
  );
}

export function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="flex justify-between items-center w-full text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h4 className="text-xl font-medium text-gray-800">{question}</h4>
        <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`mt-2 text-gray-600 transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <p className="py-2">{answer}</p>
      </div>
    </div>
  );
}

export function SectionHeading({ title, subtitle }) {
  return (
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
        {title}
        <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
      </h2>
      {subtitle && (
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Button({ 
  href, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  onClick,
  ...props 
}) {
  const baseStyles = "rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center";
  
  const variants = {
    primary: "bg-[#007BFF] text-white hover:bg-[#00D9FF] shadow-sm hover:shadow-md",
    secondary: "bg-white text-[#007BFF] border border-[#007BFF] hover:bg-blue-50",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600",
    white: "bg-white text-blue-700 hover:bg-blue-50"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl"
  };
  
  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={buttonClasses} {...props}>
        {children}
      </Link>
    );
  }
  
  return (
    <button className={buttonClasses} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function ContactForm() {
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