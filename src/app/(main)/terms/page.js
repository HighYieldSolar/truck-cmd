"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Terms of Service
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
              <span>Terms of Service</span>
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
              Welcome to Truck Command. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Truck Command platform, applications, website, and services (collectively, the &quot;Services&quot;). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="text-gray-700 mb-4">
              Please read these Terms carefully. If you do not agree with these Terms, you may not use the Services. Truck Command is licensed to You (End-User) by Truck Command, Inc. (&quot;Company&quot;), for use only under the terms of this License Agreement.
            </p>
          </div>

          {/* Definitions */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              2. Definitions
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              For the purposes of these Terms:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Account</strong> means a unique account created for You to access our Services.</li>
              <li><strong>Company</strong> (referred to as either &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement) refers to Truck Command, Inc.</li>
              <li><strong>Service</strong> refers to the Application, Website, or any other product offered by the Company.</li>
              <li><strong>Country</strong> refers to: United States of America</li>
              <li><strong>User</strong> (referred to as either &quot;You&quot; or &quot;Your&quot;) refers to the individual or entity accessing or using the Service.</li>
              <li><strong>Application</strong> means the software program provided by the Company, named Truck Command, for trucking fleet management.</li>
              <li><strong>Website</strong> refers to Truck Command&apos;s website, accessible from www.truckcommand.com</li>
            </ul>
          </div>

          {/* User Accounts */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              3. User Accounts
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in termination of your account on our Service.
            </p>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your account and password, including but not limited to restricting access to your computer and/or account. You agree to accept responsibility for all activities that occur under your account and/or password.
            </p>
            <p className="text-gray-700 mb-4">
              You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account. We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders at our sole discretion.
            </p>
          </div>

          {/* Subscription Terms */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              4. Subscription Terms
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis, depending on the type of subscription plan you select. Billing cycles are set on a monthly or annual basis.
            </p>
            <p className="text-gray-700 mb-4">
              At the end of each billing period, your subscription will automatically renew under the same conditions unless you cancel it or the Company cancels it. You may cancel your subscription renewal by contacting the Company&apos;s customer support team.
            </p>
            <p className="text-gray-700 mb-4">
              A valid payment method, including credit card, is required to process the payment for your subscription. You must provide accurate and complete billing information including full name, address, state, zip code, telephone number, and valid payment method information.
            </p>
            <p className="text-gray-700 mb-4">
              Should automatic billing fail to occur for any reason, the Company will issue an electronic invoice indicating that you must proceed manually, within a certain deadline date, with the full payment corresponding to the billing period as indicated on the invoice.
            </p>
          </div>

          {/* Free Trial */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              5. Free Trial
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              The Company may, at its sole discretion, offer a Subscription with a free trial for a limited period of time. You may be required to enter your billing information to sign up for the free trial.
            </p>
            <p className="text-gray-700 mb-4">
              If you do enter your billing information when signing up for the free trial, you will not be charged by the Company until the free trial has expired. On the last day of the free trial period, unless you canceled your subscription, you will be automatically charged the applicable subscription fee for the type of subscription you have selected.
            </p>
            <p className="text-gray-700 mb-4">
              At any time and without notice, the Company reserves the right to (i) modify the terms and conditions of the free trial offer, or (ii) cancel such free trial offer.
            </p>
          </div>

          {/* Fee Changes */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              6. Fee Changes
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              The Company, in its sole discretion and at any time, may modify the subscription fees. Any subscription fee change will become effective at the end of the then-current billing cycle.
            </p>
            <p className="text-gray-700 mb-4">
              The Company will provide you with reasonable prior notice of any change in subscription fees to give you an opportunity to terminate your subscription before such change becomes effective.
            </p>
            <p className="text-gray-700 mb-4">
              Your continued use of the Service after the subscription fee change comes into effect constitutes your agreement to pay the modified subscription fee amount.
            </p>
          </div>

          {/* Refunds */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              7. Refunds
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Except when required by law, paid subscription fees are non-refundable.
            </p>
            <p className="text-gray-700 mb-4">
              Certain refund requests may be considered by the Company on a case-by-case basis and granted at the sole discretion of the Company.
            </p>
          </div>

          {/* Content */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              8. Content
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (&quot;Content&quot;). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
            </p>
            <p className="text-gray-700 mb-4">
              By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.
            </p>
            <p className="text-gray-700 mb-4">
              We reserve the right to terminate the account of anyone found to be infringing on a copyright or other intellectual property rights.
            </p>
          </div>

          {/* Intellectual Property */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              9. Intellectual Property
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of the Company and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
            </p>
            <p className="text-gray-700 mb-4">
              Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of the Company.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              10. Limitation of Liability
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              In no event shall the Company, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              11. Disclaimer
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Your use of the Service is at your sole risk. The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
            </p>
            <p className="text-gray-700 mb-4">
              The Company, its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.
            </p>
          </div>

          {/* Governing Law */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              12. Governing Law
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700 mb-4">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
          </div>

          {/* Changes to Terms */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              13. Changes to Terms
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-gray-700 mb-4">
              By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
            </p>
          </div>

          {/* Contact Us */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              14. Contact Us
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2">
            <li>By email: support@truckcommand.com</li>
            <li>By phone: (951) 505-1147</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}