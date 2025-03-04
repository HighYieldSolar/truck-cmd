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

export default ContactSection;