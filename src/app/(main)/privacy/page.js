"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PrivacyPolicyPage() {
  const effectiveDate = "December 9, 2025";
  const lastUpdated = "December 9, 2025";

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
              Effective Date: {effectiveDate}
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
              <strong>Truck Command LLC</strong> (&quot;Truck Command,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a California limited liability company headquartered in San Bernardino County, California, is committed to protecting the privacy and security of your personal information.
            </p>
            <p className="text-gray-700 mb-4">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trucking fleet management platform, website (truckcommand.app), mobile applications, and related services (collectively, the &quot;Services&quot;). This policy also describes your rights under applicable privacy laws, including the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020 (&quot;CCPA/CPRA&quot;).
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using our Services, you acknowledge that you have read, understood, and agree to the practices described in this Privacy Policy. If you do not agree, please do not use our Services.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mb-10 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Table of Contents</h3>
            <ul className="text-blue-600 space-y-1 text-sm">
              <li><a href="#information-we-collect" className="hover:underline">2. Information We Collect</a></li>
              <li><a href="#how-we-use" className="hover:underline">3. How We Use Your Information</a></li>
              <li><a href="#how-we-share" className="hover:underline">4. How We Share Your Information</a></li>
              <li><a href="#ccpa-rights" className="hover:underline">5. Your California Privacy Rights (CCPA/CPRA)</a></li>
              <li><a href="#data-security" className="hover:underline">6. Data Security</a></li>
              <li><a href="#data-retention" className="hover:underline">7. Data Retention</a></li>
              <li><a href="#cookies" className="hover:underline">8. Cookies and Tracking Technologies</a></li>
              <li><a href="#third-party" className="hover:underline">9. Third-Party Services</a></li>
              <li><a href="#children" className="hover:underline">10. Children&apos;s Privacy</a></li>
              <li><a href="#international" className="hover:underline">11. International Data Transfers</a></li>
              <li><a href="#changes" className="hover:underline">12. Changes to This Privacy Policy</a></li>
              <li><a href="#contact" className="hover:underline">13. Contact Us</a></li>
            </ul>
          </div>

          {/* 2. Information We Collect */}
          <div id="information-we-collect" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              2. Information We Collect
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.1 Information You Provide Directly</h3>
            <p className="text-gray-700 mb-4">
              We collect information you voluntarily provide when you register, use our Services, or communicate with us:
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left border font-semibold">Category</th>
                    <th className="px-4 py-2 text-left border font-semibold">Types of Information</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Account Information</td>
                    <td className="px-4 py-2 border">Full name, email address, phone number, password, company name, business address, city, state, ZIP code</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Business Information</td>
                    <td className="px-4 py-2 border">MC Number, DOT Number, EIN (Employer Identification Number), fleet size, company legal name, DBA name</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Driver Information</td>
                    <td className="px-4 py-2 border">Driver names, contact information, CDL numbers, license states, license expiration dates, medical card expiration dates, hire dates, emergency contacts</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Vehicle Information</td>
                    <td className="px-4 py-2 border">Vehicle identification numbers (VIN), license plates, make, model, year, fuel type, tank capacity, registration expiration, insurance expiration, inspection expiration</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Customer Information</td>
                    <td className="px-4 py-2 border">Customer company names, contact names, addresses, phone numbers, email addresses, payment terms, tax IDs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Financial Information</td>
                    <td className="px-4 py-2 border">Invoice details, payment records, expense data, fuel purchase records, earnings, billing information</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Load/Dispatch Information</td>
                    <td className="px-4 py-2 border">Load numbers, origins, destinations, pickup/delivery dates, rates, customer details, proof of delivery documents</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">IFTA/Mileage Data</td>
                    <td className="px-4 py-2 border">State mileage records, fuel purchase locations and amounts, odometer readings, trip records, state border crossings</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Compliance Documents</td>
                    <td className="px-4 py-2 border">Uploaded documents including licenses, permits, insurance certificates, registration documents, inspection reports</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Payment Information</td>
                    <td className="px-4 py-2 border">Credit/debit card information (processed by Stripe), billing address, payment history</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border font-medium">Communications</td>
                    <td className="px-4 py-2 border">Messages, support requests, feedback, and any other communications with us</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.2 Information Collected Automatically</h3>
            <p className="text-gray-700 mb-4">
              When you access or use our Services, we automatically collect certain information:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Device Information:</strong> Device type, operating system, browser type and version, unique device identifiers, mobile network information</li>
              <li><strong>Log Information:</strong> IP address, access times, pages viewed, referring URL, click patterns, features used</li>
              <li><strong>Usage Information:</strong> Features used, actions taken, time spent on pages, session duration, frequency of use</li>
              <li><strong>Location Information:</strong> General location derived from IP address; precise location only with your explicit consent for location-based features</li>
              <li><strong>Cookie Data:</strong> Information collected through cookies, web beacons, and similar technologies (see our <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.3 Information from Third Parties</h3>
            <p className="text-gray-700 mb-4">
              We may receive information about you from third parties, including:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Payment Processors:</strong> Transaction confirmations and payment status from Stripe</li>
              <li><strong>Authentication Services:</strong> Account verification from Supabase</li>
              <li><strong>Analytics Providers:</strong> Aggregated usage analytics</li>
              <li><strong>Public Sources:</strong> Business information from public records (DOT, FMCSA databases)</li>
            </ul>
          </div>

          {/* 3. How We Use Your Information */}
          <div id="how-we-use" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              3. How We Use Your Information
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect for the following business and commercial purposes:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.1 Providing and Maintaining the Services</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Creating and managing your account</li>
              <li>Processing and tracking loads, invoices, and payments</li>
              <li>Calculating IFTA taxes and generating reports</li>
              <li>Managing fleet, driver, and vehicle information</li>
              <li>Tracking expenses and fuel purchases</li>
              <li>Managing compliance documents and sending expiration alerts</li>
              <li>Providing customer relationship management features</li>
              <li>Generating financial and operational reports</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.2 Processing Transactions</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Processing subscription payments</li>
              <li>Managing billing and invoicing</li>
              <li>Sending payment confirmations and receipts</li>
              <li>Handling refunds and disputes</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.3 Communications</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Sending service-related notifications (compliance alerts, renewal reminders, system updates)</li>
              <li>Responding to your inquiries and support requests</li>
              <li>Sending promotional communications (with your consent)</li>
              <li>Providing subscription renewal notices as required by California law</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.4 Improving and Developing Services</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Analyzing usage patterns to improve features</li>
              <li>Identifying and fixing bugs and technical issues</li>
              <li>Developing new features and services</li>
              <li>Conducting research and analytics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.5 Security and Fraud Prevention</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Protecting against unauthorized access and misuse</li>
              <li>Detecting and preventing fraudulent activity</li>
              <li>Enforcing our Terms of Service</li>
              <li>Maintaining the security of our systems</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.6 Legal Compliance</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Complying with applicable laws and regulations</li>
              <li>Responding to legal process and government requests</li>
              <li>Establishing, exercising, or defending legal claims</li>
            </ul>
          </div>

          {/* 4. How We Share Your Information */}
          <div id="how-we-share" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              4. How We Share Your Information
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We share information with third-party service providers who perform services on our behalf:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Stripe, Inc.:</strong> Payment processing</li>
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
              <li><strong>Vercel:</strong> Website hosting</li>
              <li><strong>Analytics Providers:</strong> Usage analytics and performance monitoring</li>
              <li><strong>Email Service Providers:</strong> Transactional and marketing emails</li>
              <li><strong>Cloud Storage:</strong> Document and file storage</li>
            </ul>
            <p className="text-gray-700 mb-4">
              These service providers are contractually obligated to use your information only for the purposes of providing services to us and to maintain appropriate security measures.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information when required by law or in good faith belief that such disclosure is necessary to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Comply with a legal obligation, subpoena, court order, or other legal process</li>
              <li>Protect and defend our rights or property</li>
              <li>Prevent or investigate possible wrongdoing</li>
              <li>Protect the personal safety of users or the public</li>
              <li>Respond to government or regulatory requests</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.3 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              If Truck Command is involved in a merger, acquisition, asset sale, bankruptcy, or other business transaction, your information may be transferred as part of that transaction. We will provide notice before your information becomes subject to a different privacy policy.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.4 With Your Consent</h3>
            <p className="text-gray-700 mb-4">
              We may share your information with third parties when you have given us explicit consent to do so.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.5 Aggregated or De-identified Information</h3>
            <p className="text-gray-700 mb-4">
              We may share aggregated or de-identified information that cannot reasonably be used to identify you for industry analysis, benchmarking, and other business purposes.
            </p>
          </div>

          {/* 5. Your California Privacy Rights (CCPA/CPRA) */}
          <div id="ccpa-rights" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              5. Your California Privacy Rights (CCPA/CPRA)
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded mb-6">
              <p className="text-gray-700 font-medium">
                If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA).
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Your Rights</h3>
            <p className="text-gray-700 mb-4">
              As a California resident, you have the right to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-3 mb-4">
              <li>
                <strong>Right to Know:</strong> Request information about the categories and specific pieces of personal information we have collected, the sources of collection, the purposes for collection, and the categories of third parties with whom we share personal information.
              </li>
              <li>
                <strong>Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions (such as completing transactions, detecting fraud, or complying with legal obligations).
              </li>
              <li>
                <strong>Right to Correct:</strong> Request correction of inaccurate personal information we maintain about you.
              </li>
              <li>
                <strong>Right to Opt-Out of Sale/Sharing:</strong> We do not sell your personal information. We do not share your personal information for cross-context behavioral advertising purposes.
              </li>
              <li>
                <strong>Right to Limit Use of Sensitive Personal Information:</strong> You may request that we limit our use of sensitive personal information to purposes necessary to perform the Services.
              </li>
              <li>
                <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your privacy rights.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Categories of Personal Information Collected</h3>
            <p className="text-gray-700 mb-4">
              In the preceding 12 months, we have collected the following categories of personal information:
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left border font-semibold">Category</th>
                    <th className="px-4 py-2 text-left border font-semibold">Collected</th>
                    <th className="px-4 py-2 text-left border font-semibold">Sold</th>
                    <th className="px-4 py-2 text-left border font-semibold">Disclosed for Business Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border">Identifiers (name, email, phone, address)</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">Personal Information (Cal. Civ. Code § 1798.80(e))</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">Commercial Information (transaction history, purchasing tendencies)</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">Internet/Network Activity (browsing history, interactions with Services)</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">Geolocation Data</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">Professional/Employment Information</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">Inferences (preferences, characteristics)</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">Sensitive Personal Information (driver&apos;s license, SSN/EIN)</td>
                    <td className="px-4 py-2 border text-green-600">Yes</td>
                    <td className="px-4 py-2 border text-red-600">No</td>
                    <td className="px-4 py-2 border text-green-600">Yes (limited)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.3 How to Exercise Your Rights</h3>
            <p className="text-gray-700 mb-4">
              To exercise your California privacy rights, you may:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Email:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
              <li><strong>Online:</strong> Through your account settings dashboard</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We will verify your identity before processing your request. For requests made on behalf of another person, we require written authorization from the data subject.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.4 Response Timing</h3>
            <p className="text-gray-700 mb-4">
              We will respond to verifiable consumer requests within 45 days. If we need additional time (up to 45 more days), we will notify you of the reason and extension period.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.5 Authorized Agents</h3>
            <p className="text-gray-700 mb-4">
              You may designate an authorized agent to submit requests on your behalf. We require the agent to provide proof of written authorization from you and may verify your identity directly.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.6 &quot;Do Not Sell or Share My Personal Information&quot;</h3>
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded mb-4">
              <p className="text-gray-700">
                <strong>We do not sell your personal information.</strong> We do not share your personal information for cross-context behavioral advertising. Therefore, there is no need to opt-out of sale or sharing.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.7 Financial Incentive Programs</h3>
            <p className="text-gray-700 mb-4">
              We do not offer financial incentives for the collection, sale, retention, or deletion of personal information.
            </p>
          </div>

          {/* 6. Data Security */}
          <div id="data-security" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              6. Data Security
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction, including:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest</li>
              <li><strong>Access Controls:</strong> Role-based access controls and authentication requirements</li>
              <li><strong>Infrastructure Security:</strong> Secure hosting with industry-leading cloud providers</li>
              <li><strong>Regular Security Reviews:</strong> Periodic security assessments and vulnerability testing</li>
              <li><strong>Employee Training:</strong> Security awareness training for team members</li>
              <li><strong>Incident Response:</strong> Procedures for responding to security incidents</li>
            </ul>
            <p className="text-gray-700 mb-4">
              While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Your Responsibilities:</strong> You are responsible for maintaining the confidentiality of your account credentials and notifying us immediately of any unauthorized access.
            </p>
          </div>

          {/* 7. Data Retention */}
          <div id="data-retention" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              7. Data Retention
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Active Account Data:</strong> Retained while your account is active and for 30 days after termination</li>
              <li><strong>Transaction Records:</strong> Retained for 7 years for tax and accounting purposes</li>
              <li><strong>IFTA/Compliance Records:</strong> Retained for the period required by applicable regulations (typically 4-6 years)</li>
              <li><strong>Communication Records:</strong> Retained for 3 years</li>
              <li><strong>Analytics Data:</strong> Aggregated data retained indefinitely; individual-level data retained for 2 years</li>
            </ul>
            <p className="text-gray-700 mb-4">
              After the retention period, we will securely delete or anonymize your information. We may retain certain information longer if required by law or to resolve disputes.
            </p>
          </div>

          {/* 8. Cookies and Tracking Technologies */}
          <div id="cookies" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              8. Cookies and Tracking Technologies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to collect and store information. For detailed information about our use of cookies, please see our <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">Types of Cookies We Use</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for the Services to function properly</li>
              <li><strong>Performance Cookies:</strong> Help us understand how you use the Services</li>
              <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">Your Cookie Choices</h3>
            <p className="text-gray-700 mb-4">
              You can manage cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our Services.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">Do Not Track</h3>
            <p className="text-gray-700 mb-4">
              Our Services do not currently respond to &quot;Do Not Track&quot; signals. However, you can manage your privacy preferences through our cookie settings and the browser controls described in our Cookie Policy.
            </p>
          </div>

          {/* 9. Third-Party Services */}
          <div id="third-party" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              9. Third-Party Services
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Our Services integrate with or link to third-party services. These third parties have their own privacy policies, and we encourage you to read them:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Stripe:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com/privacy</a></li>
              <li><strong>Supabase:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/privacy</a></li>
              <li><strong>Vercel:</strong> <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vercel.com/legal/privacy-policy</a></li>
            </ul>
            <p className="text-gray-700 mb-4">
              We are not responsible for the privacy practices or content of third-party services.
            </p>
          </div>

          {/* 10. Children&apos;s Privacy */}
          <div id="children" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              10. Children&apos;s Privacy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Our Services are designed for business use and are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18.
            </p>
            <p className="text-gray-700 mb-4">
              If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information promptly. If you believe we have collected information from a child under 18, please contact us at <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a>.
            </p>
          </div>

          {/* 11. International Data Transfers */}
          <div id="international" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              11. International Data Transfers
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Truck Command is based in the United States, and your information is processed and stored in the United States. If you access our Services from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country.
            </p>
            <p className="text-gray-700 mb-4">
              By using our Services, you consent to the transfer of your information to the United States and the processing of your information as described in this Privacy Policy.
            </p>
          </div>

          {/* 12. Changes to This Privacy Policy */}
          <div id="changes" className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              12. Changes to This Privacy Policy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons.
            </p>
            <p className="text-gray-700 mb-4">
              When we make material changes:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>We will update the &quot;Effective Date&quot; at the top of this policy</li>
              <li>We will notify you via email and/or prominent notice within the Services</li>
              <li>For significant changes, we may provide additional notice or obtain your consent where required by law</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </div>

          {/* 13. Contact Us */}
          <div id="contact" className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              13. Contact Us
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <ul className="text-gray-700 space-y-2">
                <li><strong>Company:</strong> Truck Command LLC</li>
                <li><strong>Location:</strong> San Bernardino County, California, USA</li>
                <li><strong>Privacy Inquiries:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
                <li><strong>General Support:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">California Residents</h3>
            <p className="text-gray-700 mb-4">
              For CCPA/CPRA requests specifically, please email <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a> with the subject line &quot;CCPA Request&quot;.
            </p>
          </div>

          {/* Footer Note */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm text-center">
              Last Updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
