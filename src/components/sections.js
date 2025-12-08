"use client";

import { useState } from "react";
import Link from 'next/link';
import { 
  ArrowRight, Star, CheckCircle, Mail, Phone, 
  MapPin, Clock, ChevronDown, Send, Check, X
} from "lucide-react";

// SectionHeading Component
export function SectionHeading({ title, subtitle }) {
  return (
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative text-gray-900">
        {title}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded"></div>
      </h2>
      {subtitle && (
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Hero Section Component
export function HeroSection({ 
  title, 
  highlight,
  description, 
  primaryButtonText = "Get Started",
  primaryButtonHref = "/signup",
  secondaryButtonText,
  secondaryButtonHref,
  secondaryButtonOnClick,
  backgroundStyle = "gradient" // "gradient" or "plain"
}) {
  return (
    <section className={`relative py-20 px-6 overflow-hidden ${
      backgroundStyle === "gradient" 
        ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white" 
        : "bg-white text-[#222222]"
    }`}>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {title} {highlight && <span className="text-yellow-300">{highlight}</span>}
          </h1>
          
          <p className="text-xl max-w-xl mb-8">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <a 
              href={primaryButtonHref}
              className={`px-8 py-4 ${backgroundStyle === "gradient" ? "bg-white text-blue-700" : "bg-[#007BFF] text-white"} rounded-lg text-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center`}
            >
              {primaryButtonText}
              <ArrowRight size={20} className="ml-2" />
            </a>
            
            {secondaryButtonText && (
              <a 
                href={secondaryButtonHref}
                onClick={secondaryButtonOnClick}
                className={`px-8 py-4 bg-transparent ${backgroundStyle === "gradient" ? "border-2 border-white text-white hover:bg-white hover:text-blue-600" : "border border-[#007BFF] text-[#007BFF] hover:bg-blue-50"} rounded-lg text-xl transition-all duration-300 flex items-center justify-center`}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
    </section>
  );
}

// Feature Grid Section Component
export function FeatureGridSection({ 
  title, 
  subtitle, 
  features,
  columns = 3,
  background = "white" // "white" or "gray"
}) {
  return (
    <section className={`py-20 px-6 ${background === "gray" ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeading title={title} subtitle={subtitle} />
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-8`}>
          {features.map((feature, i) => (
            <div 
              key={i}
              className="p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-[#222222] group-hover:text-[#007BFF] transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-[#4A4A4A] mt-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonial Section Component
export function TestimonialSection({
  title,
  subtitle,
  testimonials,
  background = "gray" // "gray" or "white"
}) {
  return (
    <section className={`py-20 px-6 ${background === "gray" ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeading title={title} subtitle={subtitle} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div 
              key={i}
              className="bg-white p-8 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="italic text-lg text-gray-700 mb-4">
                {testimonial.text}
              </blockquote>
              <div className="flex items-center">
                <div className="w-20 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {testimonial.name.split(' ')[0][0]}{testimonial.name.split(' ')[1]?.[0] || ''}
              </div>
                  <span className="ml-3 font-semibold text-gray-900">
                    - {testimonial.name}, {testimonial.role && testimonial.company ? `${testimonial.role}, ${testimonial.company}` : ''}
                  </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section Component
export function CTASection({
  title,
  description,
  primaryButtonText = "Start Free Trial",
  primaryButtonHref = "/signup",
  secondaryButtonText,
  secondaryButtonHref,
  footnote = "No credit card required • Cancel anytime"
}) {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
      
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-6">{title}</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <a 
            href={primaryButtonHref}
            className="px-8 py-4 bg-white text-blue-700 font-bold rounded-lg text-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
          >
            {primaryButtonText}
          </a>
          
          {secondaryButtonText && (
            <a 
              href={secondaryButtonHref}
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg text-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              {secondaryButtonText}
            </a>
          )}
        </div>
        
        {footnote && (
          <p className="mt-6 text-blue-200">{footnote}</p>
        )}
      </div>
    </section>
  );
}

// FAQ Section Component
export function FAQSection({ 
  title = "Frequently Asked Questions",
  subtitle,
  faqs,
  contactCTA = true,
  background = "white" // "white" or "gray"
}) {
  return (
    <section className={`py-20 px-6 ${background === "gray" ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto">
        <SectionHeading title={title} subtitle={subtitle} />
        
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FAQItem 
              key={i}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
        
        {contactCTA && (
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Still have questions?</p>
            <a 
              href="/contact" 
              className="inline-block px-6 py-3 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200 transition-colors"
            >
              Contact Our Support Team
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// FAQ Item Component
export function FAQItem({ question, answer }) {
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
}

// Contact Section Component
export function ContactSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 pr-0 lg:pr-16 mb-12 lg:mb-0">
            <h2 className="text-3xl font-bold mb-6 inline-block relative">
              Get In Touch
              <div className="absolute bottom-0 left-0 w-1/3 h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Fill out the form and one of our team members will get back to you within one business day.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <Phone size={24} className="text-blue-600 mr-4 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Call Us</h4>
                  <p className="text-gray-600">(555) 123-4567</p>
                  <p className="text-sm text-gray-500 mt-1">Mon-Fri, 8am-8pm CT</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail size={24} className="text-blue-600 mr-4 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Email Us</h4>
                  <p className="text-gray-600">support@truckcommand.com</p>
                  <p className="text-sm text-gray-500 mt-1">We&apos;ll respond within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin size={24} className="text-blue-600 mr-4 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Visit Us</h4>
                  <p className="text-gray-600">
                    123 Transport Way, Suite 400<br />
                    Dallas, TX 75201
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock size={24} className="text-blue-600 mr-4 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Business Hours</h4>
                  <p className="text-gray-600">
                    Monday - Friday: 8am - 8pm CT<br />
                    Saturday: 9am - 5pm CT<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <h4 className="text-xl font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-colors">FB</a>
                <a href="#" className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-colors">TW</a>
                <a href="#" className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-colors">IG</a>
                <a href="#" className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-colors">LI</a>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 bg-gray-50 p-8 rounded-lg shadow-md">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact Form Component
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

// Pricing Toggle Component
export function PricingToggle({ onChange, initialValue = 'yearly' }) {
  const [billingCycle, setBillingCycle] = useState(initialValue);

  const handleToggle = () => {
    const newValue = billingCycle === 'monthly' ? 'yearly' : 'monthly';
    setBillingCycle(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center justify-center mb-8 space-x-4">
      <span className={`text-lg ${billingCycle === 'monthly' ? 'font-bold' : 'opacity-80'}`}>Monthly</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={billingCycle === 'yearly'}
          onChange={handleToggle}
        />
        <div className="w-14 h-7 bg-white rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-blue-600 after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
      </label>
      <div className="flex flex-col items-start">
        <span className={`text-lg ${billingCycle === 'yearly' ? 'font-bold' : 'opacity-80'}`}>Yearly</span>
        <span className="text-sm bg-green-500 text-white px-2 py-0.5 rounded-full">Save 20%</span>
      </div>
    </div>
  );
}

// Plan Card Component
export function PlanCard({ 
  name, 
  description = "", 
  price, 
  yearlyPrice, 
  billingCycle, 
  features = [], 
  highlighted = false,
  freeTrial = true,
  ctaText = "Start Free Trial",
  ctaLink = "/signup"
}) {
  const isYearly = billingCycle === 'yearly';
  const displayPrice = isYearly ? yearlyPrice : price;
  
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${highlighted ? 'relative' : ''}`}>
      {highlighted && (
        <div className="absolute top-0 right-0">
          <div className="bg-orange-500 text-white transform rotate-45 text-center text-sm py-1 px-8 translate-x-8 translate-y-4">
            Popular
          </div>
        </div>
      )}
      
      <div className={`p-8 border-b border-gray-100 ${highlighted ? 'bg-gradient-to-r from-blue-50 to-blue-100' : ''}`}>
        <h4 className="text-2xl font-semibold mb-2">{name}</h4>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        <div className="flex items-baseline">
          <p className="text-5xl font-bold">
            ${displayPrice}
          </p>
          <span className="text-xl ml-1">/mo</span>
        </div>
        <p className="text-gray-600 mt-2">
          {isYearly 
            ? `Billed $${displayPrice * 12} yearly (save $${Math.round((price * 12) - (displayPrice * 12))})`
            : 'Billed monthly'}
        </p>
        {freeTrial && (
          <div className="mt-4 bg-green-100 text-green-800 py-2 px-3 rounded-lg inline-flex items-center">
            <CheckCircle size={16} className="mr-1" />
            <span>7-day free trial</span>
          </div>
        )}
      </div>
      
      <div className="p-8">
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className={`flex items-start ${!feature.included ? 'opacity-50' : ''}`}>
              {feature.included ? (
                <Check size={20} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
              ) : (
                <X size={20} className="text-red-500 mr-2 mt-1 flex-shrink-0" />
              )}
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        
        <Link
          href={`${ctaLink}?plan=${name.toLowerCase().replace(/\s+/g, '-')}`}
          className="block w-full text-center mt-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
}