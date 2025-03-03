// src/components/sections/HeroSection.js
"use client";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

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
            <Button 
              href={primaryButtonHref} 
              variant={backgroundStyle === "gradient" ? "white" : "primary"}
              size="xl"
              className="transform hover:scale-105"
            >
              {primaryButtonText}
              <ArrowRight size={20} className="ml-2" />
            </Button>
            
            {secondaryButtonText && (
              <Button 
                href={secondaryButtonHref}
                onClick={secondaryButtonOnClick}
                variant="outline"
                size="xl"
              >
                {secondaryButtonText}
              </Button>
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

// src/components/sections/FeatureGridSection.js
"use client";
import { FeatureCard } from '../ui/FeatureCard';

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
            <FeatureCard 
              key={i}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// src/components/sections/TestimonialSection.js
// src/components/sections/TestimonialSection.js
"use client";
import { TestimonialCard } from '../ui/TestimonialCard';
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
            <TestimonialCard 
              key={i}
              text={testimonial.text}
              name={testimonial.name}
              role={testimonial.role}
              company={testimonial.company}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// src/components/sections/CTASection.js
"use client";
import { Button } from '../ui/Button';

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
          <Button 
            href={primaryButtonHref}
            variant="white"
            size="xl"
            className="shadow-xl hover:shadow-2xl hover:scale-105"
          >
            {primaryButtonText}
          </Button>
          
          {secondaryButtonText && (
            <Button 
              href={secondaryButtonHref}
              variant="outline"
              size="xl"
            >
              {secondaryButtonText}
            </Button>
          )}
        </div>
        
        {footnote && (
          <p className="mt-6 text-blue-200">{footnote}</p>
        )}
      </div>
    </section>
  );
}

// src/components/sections/FAQSection.js
"use client";
// src/components/sections/FAQSection.js
"use client";
import { FAQItem } from '../ui/FAQItem';
import { Button } from '../ui/Button';
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
            <Button 
              href="/contact" 
              variant="secondary" 
              size="md"
            >
              Contact Our Support Team
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// src/components/sections/ContactSection.js
"use client";
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { ContactForm } from '../ui/ContactForm';

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
                  <p className="text-sm text-gray-500 mt-1">We'll respond within 24 hours</p>
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

// src/components/sections/PricingToggle.js
"use client";
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

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