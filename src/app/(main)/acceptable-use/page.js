"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function AcceptableUsePage() {
  const effectiveDate = "December 9, 2025";
  const lastUpdated = "December 9, 2025";

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Acceptable Use Policy
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
              <span>Acceptable Use Policy</span>
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

          {/* 1. Introduction */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              1. Introduction
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              This Acceptable Use Policy (&quot;AUP&quot;) governs the use of the Truck Command platform, website, mobile applications, and all related services (collectively, the &quot;Services&quot;) provided by <strong>Truck Command LLC</strong>, a California limited liability company (&quot;Truck Command,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <p className="text-gray-700 mb-4">
              This AUP is incorporated by reference into our <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>. By using our Services, you agree to comply with this AUP. Violation of this AUP may result in suspension or termination of your account without refund.
            </p>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify this AUP at any time. Material changes will be communicated via email or through the Services. Your continued use of the Services after such modifications constitutes acceptance of the updated AUP.
            </p>
          </div>

          {/* 2. General Conduct Requirements */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              2. General Conduct Requirements
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              When using our Services, you agree to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Comply with all applicable federal, state, and local laws and regulations</li>
              <li>Comply with all applicable Department of Transportation (DOT) regulations</li>
              <li>Comply with Federal Motor Carrier Safety Administration (FMCSA) requirements</li>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the Services only for legitimate business purposes related to trucking operations</li>
              <li>Treat our staff, other users, and third parties with respect</li>
              <li>Report any security vulnerabilities or bugs you discover</li>
            </ul>
          </div>

          {/* 3. Prohibited Uses */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              3. Prohibited Uses
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              You may NOT use our Services to:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.1 Illegal or Harmful Activities</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Violate any applicable law, regulation, or ordinance</li>
              <li>Facilitate or engage in illegal transportation activities</li>
              <li>Transport hazardous materials without proper licensing and documentation</li>
              <li>Evade or circumvent DOT, FMCSA, or other regulatory requirements</li>
              <li>Generate fraudulent IFTA reports or falsify tax documentation</li>
              <li>Create false or misleading compliance records</li>
              <li>Facilitate insurance fraud or workers&apos; compensation fraud</li>
              <li>Launder money or engage in financial crimes</li>
              <li>Engage in human trafficking or smuggling</li>
              <li>Transport illegal substances or contraband</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.2 Fraud and Misrepresentation</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Create accounts using false, misleading, or stolen identities</li>
              <li>Impersonate another person, company, or entity</li>
              <li>Falsify DOT numbers, MC numbers, or operating authority</li>
              <li>Create fraudulent invoices or billing records</li>
              <li>Manipulate load or revenue data for fraudulent purposes</li>
              <li>Submit false expense claims or fuel records</li>
              <li>Misrepresent driver qualifications, CDL status, or certifications</li>
              <li>Falsify vehicle inspection or maintenance records</li>
              <li>Create fake customers or broker relationships</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.3 Security Violations</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Attempt to gain unauthorized access to our systems or data</li>
              <li>Access or attempt to access another user&apos;s account</li>
              <li>Circumvent, disable, or interfere with security features</li>
              <li>Probe, scan, or test the vulnerability of our systems</li>
              <li>Deploy malware, viruses, or other malicious code</li>
              <li>Conduct denial-of-service (DoS) or distributed denial-of-service (DDoS) attacks</li>
              <li>Intercept or monitor data not intended for you</li>
              <li>Forge headers or manipulate identifiers to disguise origin</li>
              <li>Use automated tools to scrape, crawl, or harvest data</li>
              <li>Reverse engineer, decompile, or disassemble our software</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.4 Abuse and Harassment</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Harass, bully, intimidate, or threaten any person</li>
              <li>Send spam, unsolicited messages, or promotional content</li>
              <li>Collect or harvest personal information without consent</li>
              <li>Post or transmit defamatory, obscene, or offensive content</li>
              <li>Discriminate against individuals based on protected characteristics</li>
              <li>Interfere with other users&apos; use of the Services</li>
              <li>Abuse our support team or staff</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.5 Intellectual Property Violations</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Infringe on copyrights, trademarks, patents, or trade secrets</li>
              <li>Copy, modify, or distribute our software without authorization</li>
              <li>Remove or alter proprietary notices or labels</li>
              <li>Use our trademarks or branding without permission</li>
              <li>Create derivative works based on our Services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.6 System Abuse</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Use the Services in a manner that exceeds reasonable usage patterns</li>
              <li>Consume excessive computational resources intentionally</li>
              <li>Attempt to circumvent usage limits or subscription restrictions</li>
              <li>Share account credentials with unauthorized parties</li>
              <li>Resell, sublicense, or commercially exploit the Services without authorization</li>
              <li>Use automated systems or bots except as expressly permitted</li>
              <li>Interfere with the proper functioning of the Services</li>
            </ul>
          </div>

          {/* 4. Trucking Industry-Specific Prohibitions */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              4. Trucking Industry-Specific Prohibitions
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Given the regulated nature of the trucking industry, the following specific prohibitions apply:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Regulatory Compliance</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Creating or storing records intended to deceive DOT auditors</li>
              <li>Generating false hours-of-service (HOS) documentation</li>
              <li>Falsifying driver qualification files (DQ files)</li>
              <li>Creating fictitious drug and alcohol testing records</li>
              <li>Misrepresenting safety ratings or CSA scores</li>
              <li>Producing fraudulent weight tickets or bills of lading</li>
              <li>Creating false proof of insurance documentation</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 IFTA and Fuel Tax</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Intentionally entering false mileage data to reduce tax liability</li>
              <li>Creating fictitious fuel purchase records</li>
              <li>Manipulating state mileage allocations fraudulently</li>
              <li>Generating IFTA reports you know to contain false information</li>
              <li>Using the platform to facilitate fuel tax evasion schemes</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.3 Driver and Vehicle Records</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Recording drivers with invalid, suspended, or revoked CDLs</li>
              <li>Falsifying medical certificate (DOT physical) records</li>
              <li>Creating false vehicle maintenance or inspection histories</li>
              <li>Recording vehicles that do not meet federal safety standards</li>
              <li>Hiding out-of-service violations or orders</li>
            </ul>
          </div>

          {/* 5. Data and Content Standards */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              5. Data and Content Standards
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Data Accuracy</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for the accuracy and completeness of all data you enter into the Services. You agree to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Enter accurate information for all business records</li>
              <li>Promptly update information when it changes</li>
              <li>Not intentionally enter false or misleading data</li>
              <li>Verify the accuracy of generated reports before submission to any authority</li>
              <li>Maintain supporting documentation for entered data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Document Uploads</h3>
            <p className="text-gray-700 mb-4">
              When uploading documents to our Services, you agree to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Only upload documents you have the right to store and use</li>
              <li>Not upload documents containing malware or malicious code</li>
              <li>Not upload documents that violate any law or third-party rights</li>
              <li>Ensure uploaded documents are authentic and unaltered (unless redaction is required)</li>
              <li>Not upload documents for storage purposes unrelated to trucking operations</li>
            </ul>
          </div>

          {/* 6. Account Security Requirements */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              6. Account Security Requirements
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the security of your account. You agree to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Use a strong, unique password for your account</li>
              <li>Not share your login credentials with others</li>
              <li>Immediately notify us of any unauthorized access or security breach</li>
              <li>Log out of your account when using shared devices</li>
              <li>Keep your contact information current for security notifications</li>
              <li>Review your account activity regularly for suspicious activity</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You are responsible for all activities that occur under your account, whether or not you authorized such activities.
            </p>
          </div>

          {/* 7. Reporting Violations */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              7. Reporting Violations
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you become aware of any violation of this AUP, please report it to us immediately at:
            </p>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a>
              </p>
              <p className="text-gray-700">
                <strong>General Support:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a>
              </p>
            </div>
            <p className="text-gray-700 mb-4">
              We investigate all reports and take appropriate action, which may include suspending or terminating accounts, reporting to law enforcement, or other measures we deem necessary.
            </p>
          </div>

          {/* 8. Enforcement */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              8. Enforcement
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">8.1 Investigation</h3>
            <p className="text-gray-700 mb-4">
              We may investigate suspected violations of this AUP. During investigation, we may:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Review your account activity and data</li>
              <li>Temporarily suspend your access to the Services</li>
              <li>Request additional information or documentation from you</li>
              <li>Cooperate with law enforcement if required by law</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">8.2 Consequences of Violation</h3>
            <p className="text-gray-700 mb-4">
              Violations of this AUP may result in:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Warning:</strong> For minor, first-time violations</li>
              <li><strong>Temporary Suspension:</strong> Restriction of access while we investigate or while you remedy the violation</li>
              <li><strong>Account Termination:</strong> Permanent removal of your access to the Services without refund</li>
              <li><strong>Legal Action:</strong> We may seek damages, injunctive relief, or other legal remedies</li>
              <li><strong>Law Enforcement Referral:</strong> We may report violations to appropriate authorities</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">8.3 No Refunds</h3>
            <p className="text-gray-700 mb-4">
              If your account is terminated due to violation of this AUP, you will not receive any refund of subscription fees or other amounts paid. You remain responsible for any amounts owed prior to termination.
            </p>
          </div>

          {/* 9. Modifications to This Policy */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              9. Modifications to This Policy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify this AUP at any time. When we make changes, we will:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Update the &quot;Last Updated&quot; date at the top of this page</li>
              <li>Notify you via email for material changes</li>
              <li>Post a notice in the Services for significant updates</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Your continued use of the Services after any changes indicates your acceptance of the modified AUP.
            </p>
          </div>

          {/* 10. Related Policies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              10. Related Policies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              This Acceptable Use Policy should be read in conjunction with:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> - Governs your use of our Services</li>
              <li><Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> - Explains how we collect and use your data</li>
              <li><Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link> - Details our use of cookies and tracking technologies</li>
            </ul>
          </div>

          {/* 11. Contact Information */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              11. Contact Information
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Acceptable Use Policy, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <ul className="text-gray-700 space-y-2">
                <li><strong>Company:</strong> Truck Command LLC</li>
                <li><strong>Location:</strong> San Bernardino County, California</li>
                <li><strong>Email:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
              </ul>
            </div>
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
