"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Privacy Policy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-70 rounded"></div>
            </h1>
            <p className="text-lg mb-4 max-w-3xl mx-auto">
              Last Updated: March 1, 2025
            </p>
            <div className="flex space-x-2 text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <ChevronRight size={16} />
              <span>Privacy Policy</span>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
          {/* Introduction */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              1. Introduction
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Truck Command (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Truck Command when you use our website, mobile applications, and other online products and services (collectively, the &quot;Services&quot;) or when you otherwise interact with us.
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using our Services, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              2. Information We Collect
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We collect information that you provide directly to us, information that we collect automatically when you use our Services, and information that we collect from other sources.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Information You Provide to Us</h3>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us when you create an account, fill out a form, submit or post content through our Services, communicate with us, or otherwise use our Services. The types of information we may collect include:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Contact information (such as name, email address, mailing address, and phone number)</li>
              <li>Account credentials (such as username and password)</li>
              <li>Profile information (such as company name, job title, and fleet size)</li>
              <li>Payment and billing information (such as credit card details and billing address)</li>
              <li>Business information (such as trucking fleet details, driver information, and vehicle data)</li>
              <li>Communications and correspondence you have with us</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">Information We Collect Automatically</h3>
            <p className="text-gray-700 mb-4">
              When you use our Services, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Device Information:</strong> We collect information about the device you use to access our Services, including the hardware model, operating system and version, unique device identifiers, and mobile network information.</li>
              <li><strong>Log Information:</strong> We collect log information when you use our Services, including access times, pages viewed, IP address, and the page you visited before navigating to our Services.</li>
              <li><strong>Location Information:</strong> We may collect precise location information from your device when you use certain features of our Services. For fleet tracking functionality, we collect location data from GPS-enabled devices used in your fleet operations, with your consent and in accordance with applicable law.</li>
              <li><strong>Usage Information:</strong> We collect information about your use of our Services, such as the features you use, the actions you take, and the time, frequency, and duration of your activities.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar technologies to collect information about your browsing behavior and preferences.</li>
            </ul>
          </div>

          {/* How We Use Information */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              3. How We Use Information
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect for various purposes, including to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices, updates, security alerts, and administrative messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Communicate with you about products, services, offers, promotions, and events</li>
              <li>Provide customer service and technical support</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Personalize and improve the Services and provide content or features that match user profiles or interests</li>
              <li>Facilitate contests, sweepstakes, and promotions and process and deliver entries and rewards</li>
              <li>Carry out any other purpose described to you at the time the information was collected</li>
            </ul>
          </div>

          {/* How We Share Information */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              4. How We Share Information
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We may share information about you as follows or as otherwise described in this Privacy Policy:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>With Service Providers:</strong> We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
              <li><strong>With Business Partners:</strong> We may share information with business partners who offer a service to you jointly with us.</li>
              <li><strong>In Connection with Business Transfers:</strong> We may share information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              <li><strong>For Legal Reasons:</strong> We may share information as required by law or when we believe that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or comply with a judicial proceeding, court order, or legal process.</li>
              <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
              <li><strong>Aggregated or De-Identified Information:</strong> We may share aggregated or de-identified information, which cannot reasonably be used to identify you, with third parties.</li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              5. Data Security
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems or your information.
            </p>
          </div>

          {/* Data Retention */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              6. Data Retention
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We store the information we collect about you for as long as is necessary for the purpose(s) for which we originally collected it or for other legitimate business purposes, including to meet our legal, regulatory, or other compliance obligations.
            </p>
          </div>

          {/* Your Rights and Choices */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              7. Your Rights and Choices
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Account Information</h3>
            <p className="text-gray-700 mb-4">
              You may update, correct, or delete information about you at any time by logging into your online account or emailing us at privacy@truckcommand.com. If you wish to delete or deactivate your account, please email us, but note that we may retain certain information as required by law or for legitimate business purposes.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Location Information</h3>
            <p className="text-gray-700 mb-4">
              When you first use any of our location-enabled features, you will be asked to consent to our collection of location information. If you initially consent to our collection of location information, you can subsequently stop the collection by changing the preferences on your device. You may also stop our collection of location information by following the standard uninstall process to remove our mobile applications from your device.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Cookies</h3>
            <p className="text-gray-700 mb-4">
              Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove or reject browser cookies. Please note that if you choose to remove or reject cookies, this could affect the availability and functionality of our Services.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Promotional Communications</h3>
            <p className="text-gray-700 mb-4">
              You may opt out of receiving promotional emails from us by following the instructions in those emails or by contacting us. If you opt out, we may still send you non-promotional emails, such as those about your account or our ongoing business relations.
            </p>
          </div>

          {/* Children&apos;s Privacy */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              8. Children&apos;s Privacy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Our Services are not intended for children under 16 years of age, and we do not knowingly collect personal information from children under 16. If we learn we have collected or received personal information from a child under 16 without verification of parental consent, we will delete that information. If you believe we might have any information from or about a child under 16, please contact us at privacy@truckcommand.com.
            </p>
          </div>

          {/* International Data Transfers */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              9. International Data Transfers
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We are based in the United States and the information we collect is governed by U.S. law. If you are accessing the Services from outside of the U.S., please be aware that information collected through the Services may be transferred to, processed, stored, and used in the U.S. and other jurisdictions. Data protection laws in the U.S. and other jurisdictions may be different from those of your country of residence. Your use of the Services or provision of any information therefore constitutes your consent to the transfer to and from, processing, usage, sharing, and storage of your information in the U.S. and other jurisdictions as set forth in this Privacy Policy.
            </p>
          </div>

          {/* Changes to this Privacy Policy */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              10. Changes to this Privacy Policy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our website or sending you a notification). We encourage you to review the Privacy Policy whenever you access the Services or otherwise interact with us to stay informed about our information practices and the choices available to you.
            </p>
          </div>

          {/* Contact Us */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              11. Contact Us
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2">
              <li>By email: privacy@truckcommand.com</li>
              <li>By phone: (555) 123-4567</li>
              <li>By mail: 123 Transport Way, Suite 400, Dallas, TX 75201</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}