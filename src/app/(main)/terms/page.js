"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function TermsOfServicePage() {
  const effectiveDate = "December 9, 2025";
  const lastUpdated = "December 9, 2025";

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
              Effective Date: {effectiveDate}
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

          {/* Important Notice */}
          <div className="mb-10 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-gray-700 font-medium">
              PLEASE READ THESE TERMS OF SERVICE CAREFULLY. BY ACCESSING OR USING THE TRUCK COMMAND PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS AND ALL APPLICABLE LAWS AND REGULATIONS. IF YOU DO NOT AGREE WITH ANY PART OF THESE TERMS, YOU MAY NOT ACCESS OR USE OUR SERVICES.
            </p>
          </div>

          {/* 1. Agreement to Terms */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              1. Agreement to Terms
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and <strong>Truck Command LLC</strong>, a California limited liability company with its principal place of business in San Bernardino County, California (&quot;Truck Command,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <p className="text-gray-700 mb-4">
              These Terms govern your access to and use of the Truck Command software-as-a-service platform, including our website at truckcommand.app, mobile applications, application programming interfaces (APIs), and all related services, features, content, and functionality (collectively, the &quot;Services&quot;).
            </p>
            <p className="text-gray-700 mb-4">
              By creating an account, accessing, or using any part of the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms, our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, our <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>, and our <Link href="/acceptable-use" className="text-blue-600 hover:underline">Acceptable Use Policy</Link>, all of which are incorporated herein by reference.
            </p>
          </div>

          {/* 2. Definitions */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              2. Definitions
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              For purposes of these Terms, the following definitions apply:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-3 mb-4">
              <li><strong>&quot;Account&quot;</strong> means the unique account created for you to access and use the Services.</li>
              <li><strong>&quot;Authorized Users&quot;</strong> means individuals authorized by you to use the Services under your Account, including employees, contractors, and agents.</li>
              <li><strong>&quot;Customer Data&quot;</strong> means all data, information, and content that you or your Authorized Users submit, upload, or transmit to or through the Services, including but not limited to fleet information, driver data, load details, financial records, compliance documents, and fuel/mileage logs.</li>
              <li><strong>&quot;Documentation&quot;</strong> means the user guides, help files, and other documentation we make available regarding the use of the Services.</li>
              <li><strong>&quot;Intellectual Property Rights&quot;</strong> means all patents, copyrights, trademarks, trade secrets, and other proprietary rights.</li>
              <li><strong>&quot;Services&quot;</strong> means the Truck Command cloud-based trucking fleet management platform, including all features for invoicing, dispatching, IFTA calculations, expense tracking, compliance management, fuel tracking, state mileage reporting, fleet management, and customer relationship management.</li>
              <li><strong>&quot;Subscription&quot;</strong> means your purchase of access to the Services for a defined period under a specific plan.</li>
              <li><strong>&quot;Subscription Term&quot;</strong> means the period during which you have paid access to the Services.</li>
            </ul>
          </div>

          {/* 3. Eligibility */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              3. Eligibility
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              To use the Services, you must:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Be at least 18 years of age or the age of legal majority in your jurisdiction;</li>
              <li>Have the legal authority to enter into these Terms on behalf of yourself or the entity you represent;</li>
              <li>Not be prohibited from using the Services under any applicable law;</li>
              <li>Operate a legitimate trucking, transportation, or logistics business (for commercial accounts);</li>
              <li>Provide accurate and complete registration information.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              If you are using the Services on behalf of a business entity, you represent and warrant that you have the authority to bind that entity to these Terms, and &quot;you&quot; refers to both you individually and the entity.
            </p>
          </div>

          {/* 4. Account Registration and Security */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              4. Account Registration and Security
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To access most features of the Services, you must create an Account. When registering, you agree to provide accurate, current, and complete information, including your legal name, email address, company information, and any other required details.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You are solely responsible for:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Maintaining the confidentiality of your Account credentials;</li>
              <li>All activities that occur under your Account;</li>
              <li>Immediately notifying us of any unauthorized access or security breach at <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a>;</li>
              <li>Ensuring that your Authorized Users comply with these Terms.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We will not be liable for any loss or damage arising from unauthorized access to your Account resulting from your failure to safeguard your credentials.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.3 Account Information Updates</h3>
            <p className="text-gray-700 mb-4">
              You must promptly update your Account information if any changes occur. Failure to maintain accurate Account information may result in inability to access the Services or receive important communications.
            </p>
          </div>

          {/* 5. Subscription Terms and Billing */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              5. Subscription Terms and Billing
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Subscription Plans</h3>
            <p className="text-gray-700 mb-4">
              The Services are offered through various subscription plans with different features and pricing. Current plan details, features, and pricing are available on our <Link href="/pricing" className="text-blue-600 hover:underline">Pricing page</Link>. We reserve the right to modify plans, features, and pricing at any time, subject to the notice requirements below.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Free Trial</h3>
            <p className="text-gray-700 mb-4">
              We may offer a free trial period for new users. During the trial:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>You will have access to specified features of the Services;</li>
              <li>No payment information is required to start the trial;</li>
              <li>The trial period is seven (7) days unless otherwise specified;</li>
              <li>At the end of the trial, you must subscribe to continue using paid features;</li>
              <li>We may modify or discontinue trial offers at any time.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.3 Billing and Payment</h3>
            <p className="text-gray-700 mb-4">
              By subscribing to a paid plan, you agree to pay all fees associated with your selected plan. All fees are:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Charged in U.S. Dollars (USD);</li>
              <li>Due in advance for each billing cycle (monthly or annual);</li>
              <li>Non-refundable except as expressly stated herein or required by law;</li>
              <li>Subject to applicable taxes, which you are responsible for paying.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Payment processing is handled by Stripe, Inc. By providing payment information, you authorize us to charge your designated payment method for all applicable fees.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.4 Automatic Renewal</h3>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded mb-4">
              <p className="text-gray-700 font-medium">
                AUTOMATIC RENEWAL NOTICE (CALIFORNIA BUSINESS AND PROFESSIONS CODE §§17601-17606):
              </p>
              <p className="text-gray-700 mt-2">
                Your subscription will automatically renew at the end of each billing cycle unless you cancel before the renewal date. You will be charged the then-current subscription fee for your plan using your designated payment method. You may cancel at any time through your account settings or by contacting us.
              </p>
            </div>
            <p className="text-gray-700 mb-4">
              In compliance with California law (AB 2863):
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Annual Reminders:</strong> We will send you a reminder about your automatic renewal at least 15 days but no more than 45 days before each annual renewal date;</li>
              <li><strong>Fee Changes:</strong> If your subscription fee increases, we will notify you at least seven (7) days before the new fee takes effect, along with clear instructions on how to cancel;</li>
              <li><strong>Easy Cancellation:</strong> You may cancel your subscription using the same method you used to subscribe (online through your account dashboard).</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.5 Cancellation</h3>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time by:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Accessing your Account settings and clicking &quot;Cancel Subscription&quot;;</li>
              <li>Emailing us at <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a>;</li>
              <li>Contacting us at (951) 505-1147.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Upon cancellation:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>You will retain access to paid features until the end of your current billing period;</li>
              <li>No refunds will be issued for partial billing periods unless required by law;</li>
              <li>Your Account will convert to a limited free tier (if available) or be deactivated;</li>
              <li>Your Customer Data will be retained for thirty (30) days, after which it may be deleted.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.6 Refunds</h3>
            <p className="text-gray-700 mb-4">
              Except as required by applicable law, all fees are non-refundable. We may, at our sole discretion, provide refunds, credits, or other consideration on a case-by-case basis. Requests for refunds should be directed to <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a>.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.7 Fee Changes</h3>
            <p className="text-gray-700 mb-4">
              We may modify our fees at any time. For existing subscribers:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Fee increases will not apply until your next renewal period;</li>
              <li>We will provide at least thirty (30) days&apos; notice before any fee increase takes effect;</li>
              <li>You may cancel your subscription if you do not agree to the new fees;</li>
              <li>Continued use after the fee change constitutes acceptance of the new fees.</li>
            </ul>
          </div>

          {/* 6. License and Use Rights */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              6. License and Use Rights
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.1 License Grant</h3>
            <p className="text-gray-700 mb-4">
              Subject to your compliance with these Terms and payment of applicable fees, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Services solely for your internal business purposes during your Subscription Term.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.2 License Restrictions</h3>
            <p className="text-gray-700 mb-4">
              You shall not, and shall not permit any third party to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Copy, modify, or create derivative works of the Services;</li>
              <li>Reverse engineer, disassemble, decompile, or attempt to discover the source code of the Services;</li>
              <li>Rent, lease, sell, sublicense, or transfer the Services to any third party;</li>
              <li>Use the Services to develop a competing product or service;</li>
              <li>Remove, alter, or obscure any proprietary notices on the Services;</li>
              <li>Use the Services in violation of any applicable law or regulation;</li>
              <li>Use automated means (bots, scrapers, etc.) to access the Services without our express written permission;</li>
              <li>Interfere with or disrupt the integrity or performance of the Services;</li>
              <li>Attempt to gain unauthorized access to the Services or related systems.</li>
            </ul>
          </div>

          {/* 7. Customer Data */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              7. Customer Data
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.1 Ownership</h3>
            <p className="text-gray-700 mb-4">
              You retain all ownership rights in your Customer Data. We do not claim any ownership interest in your Customer Data.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.2 License to Customer Data</h3>
            <p className="text-gray-700 mb-4">
              You grant us a limited, non-exclusive, worldwide license to use, copy, store, transmit, and display your Customer Data solely to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Provide and maintain the Services;</li>
              <li>Improve and develop the Services;</li>
              <li>Generate aggregated, anonymized analytics (which will not identify you or any individual);</li>
              <li>Comply with legal obligations;</li>
              <li>Enforce these Terms.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.3 Customer Data Responsibilities</h3>
            <p className="text-gray-700 mb-4">
              You are solely responsible for:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>The accuracy, quality, and legality of your Customer Data;</li>
              <li>Obtaining all necessary consents and authorizations to collect and use data from drivers, customers, and other third parties;</li>
              <li>Ensuring your use of Customer Data complies with all applicable privacy laws;</li>
              <li>Maintaining appropriate backups of your Customer Data;</li>
              <li>Not uploading any data that infringes third-party rights or violates any law.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.4 Data Retention and Deletion</h3>
            <p className="text-gray-700 mb-4">
              Upon termination or expiration of your Subscription:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>You may export your Customer Data within thirty (30) days;</li>
              <li>After thirty (30) days, we may delete your Customer Data;</li>
              <li>We may retain certain data as required by law or for legitimate business purposes;</li>
              <li>Aggregated, anonymized data may be retained indefinitely.</li>
            </ul>
          </div>

          {/* 8. Intellectual Property */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              8. Intellectual Property
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">8.1 Our Intellectual Property</h3>
            <p className="text-gray-700 mb-4">
              The Services, including all software, algorithms, user interfaces, designs, graphics, trademarks, service marks, logos, and Documentation, are owned by Truck Command LLC or its licensors and are protected by United States and international intellectual property laws.
            </p>
            <p className="text-gray-700 mb-4">
              &quot;Truck Command,&quot; the Truck Command logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Truck Command LLC. You may not use such marks without our prior written permission.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">8.2 Feedback</h3>
            <p className="text-gray-700 mb-4">
              If you provide us with feedback, suggestions, or ideas regarding the Services (&quot;Feedback&quot;), you grant us a perpetual, irrevocable, worldwide, royalty-free license to use, modify, and incorporate such Feedback into the Services without any obligation to compensate you.
            </p>
          </div>

          {/* 9. Third-Party Services and Integrations */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              9. Third-Party Services and Integrations
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              The Services may integrate with or contain links to third-party services, including:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Payment Processing:</strong> Stripe, Inc.</li>
              <li><strong>Authentication:</strong> Supabase</li>
              <li><strong>Analytics:</strong> Various analytics providers</li>
              <li><strong>Mapping Services:</strong> For route and mileage calculations</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Your use of third-party services is subject to their respective terms and privacy policies. We are not responsible for the content, privacy practices, or operations of any third-party services.
            </p>
          </div>

          {/* 10. Disclaimers */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              10. Disclaimers
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <div className="p-4 bg-gray-100 border-l-4 border-gray-500 rounded mb-4">
              <p className="text-gray-700 uppercase font-medium text-sm">
                THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">10.1 No Warranty</h3>
            <p className="text-gray-700 mb-4">
              We do not warrant that:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>The Services will meet your specific requirements;</li>
              <li>The Services will be uninterrupted, timely, secure, or error-free;</li>
              <li>The results obtained from using the Services will be accurate or reliable;</li>
              <li>Any errors in the Services will be corrected;</li>
              <li>The Services will be compatible with any particular hardware, software, or network.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">10.2 IFTA and Compliance Disclaimer</h3>
            <p className="text-gray-700 mb-4">
              <strong>IMPORTANT:</strong> While our Services include tools for IFTA calculations, mileage tracking, and compliance document management, these features are provided as aids only. You are solely responsible for:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Verifying all calculations before submitting regulatory filings;</li>
              <li>Maintaining compliance with FMCSA, DOT, and state regulations;</li>
              <li>Ensuring the accuracy of data entered into the system;</li>
              <li>Consulting with qualified professionals for regulatory compliance advice.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Truck Command is not a substitute for professional accounting, legal, or regulatory compliance advice. We are not liable for any penalties, fines, or damages resulting from reliance on calculations or features provided by the Services.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">10.3 Financial Information Disclaimer</h3>
            <p className="text-gray-700 mb-4">
              Financial reports, invoices, expense tracking, and other financial features are provided for informational and operational purposes only. We do not provide financial, tax, or accounting advice. You should consult with qualified professionals regarding financial and tax matters.
            </p>
          </div>

          {/* 11. Limitation of Liability */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              11. Limitation of Liability
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <div className="p-4 bg-gray-100 border-l-4 border-gray-500 rounded mb-4">
              <p className="text-gray-700 uppercase font-medium text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">11.1 Exclusion of Certain Damages</h3>
            <p className="text-gray-700 mb-4">
              IN NO EVENT SHALL TRUCK COMMAND LLC, ITS MEMBERS, MANAGERS, OFFICERS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Loss of profits, revenue, or business;</li>
              <li>Loss of data or Customer Data;</li>
              <li>Loss of goodwill or reputation;</li>
              <li>Cost of procurement of substitute services;</li>
              <li>Business interruption;</li>
              <li>Regulatory penalties or fines;</li>
              <li>Any other intangible losses.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              This limitation applies regardless of the legal theory (contract, tort, negligence, strict liability, or otherwise), even if we have been advised of the possibility of such damages.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">11.2 Cap on Liability</h3>
            <p className="text-gray-700 mb-4">
              OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>The amounts paid by you to Truck Command during the twelve (12) months immediately preceding the event giving rise to the claim; or</li>
              <li>One Hundred U.S. Dollars ($100.00).</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">11.3 Basis of the Bargain</h3>
            <p className="text-gray-700 mb-4">
              The limitations of liability in this Section reflect a reasonable allocation of risk and are a fundamental basis of the bargain between you and Truck Command. The Services would not be provided without these limitations.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">11.4 Jurisdictional Limitations</h3>
            <p className="text-gray-700 mb-4">
              Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, our liability shall be limited to the maximum extent permitted by applicable law.
            </p>
          </div>

          {/* 12. Indemnification */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              12. Indemnification
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless Truck Command LLC and its members, managers, officers, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Your use of the Services;</li>
              <li>Your Customer Data;</li>
              <li>Your violation of these Terms;</li>
              <li>Your violation of any applicable law, regulation, or third-party rights;</li>
              <li>Any claims by your employees, contractors, drivers, or other Authorized Users;</li>
              <li>Any regulatory actions, audits, or penalties related to your business operations;</li>
              <li>Your negligent or wrongful acts or omissions.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We reserve the right to assume exclusive control of the defense of any matter subject to indemnification by you, at your expense. You agree to cooperate fully with our defense of any such claim.
            </p>
          </div>

          {/* 13. Termination */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              13. Termination
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">13.1 Termination by You</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your Account at any time by canceling your subscription and deleting your Account through the account settings or by contacting us.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">13.2 Termination by Us</h3>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate your access to the Services immediately, without prior notice or liability, if:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>You breach any provision of these Terms;</li>
              <li>You fail to pay any fees when due;</li>
              <li>Your use poses a security risk to the Services or other users;</li>
              <li>We are required to do so by law;</li>
              <li>We discontinue the Services (with reasonable notice where practicable).</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">13.3 Effect of Termination</h3>
            <p className="text-gray-700 mb-4">
              Upon termination:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Your license to use the Services immediately terminates;</li>
              <li>You remain liable for all fees accrued prior to termination;</li>
              <li>Sections 7 (Customer Data - certain provisions), 8 (Intellectual Property), 10 (Disclaimers), 11 (Limitation of Liability), 12 (Indemnification), and 15-17 shall survive termination.</li>
            </ul>
          </div>

          {/* 14. Dispute Resolution and Arbitration */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              14. Dispute Resolution and Arbitration
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded mb-4">
              <p className="text-gray-700 font-medium">
                PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">14.1 Informal Resolution</h3>
            <p className="text-gray-700 mb-4">
              Before initiating any formal dispute resolution, you agree to first contact us at <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a> to attempt to resolve the dispute informally. We will attempt to resolve the dispute within sixty (60) days.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">14.2 Binding Arbitration</h3>
            <p className="text-gray-700 mb-4">
              If we cannot resolve a dispute informally, you and Truck Command agree to resolve any disputes through binding arbitration administered by JAMS under its Streamlined Arbitration Rules and Procedures, except as modified by these Terms. The arbitration will be conducted in San Bernardino County, California, or at another mutually agreed location.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">14.3 Class Action Waiver</h3>
            <p className="text-gray-700 mb-4 uppercase font-medium">
              YOU AND TRUCK COMMAND AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">14.4 Exceptions</h3>
            <p className="text-gray-700 mb-4">
              Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to protect its intellectual property rights.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">14.5 Opt-Out</h3>
            <p className="text-gray-700 mb-4">
              You may opt out of this arbitration agreement by sending written notice to <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a> within thirty (30) days of first accepting these Terms. Your notice must include your name, Account information, and a clear statement that you wish to opt out.
            </p>
          </div>

          {/* 15. Governing Law and Jurisdiction */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              15. Governing Law and Jurisdiction
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700 mb-4">
              For any disputes not subject to arbitration, you consent to the exclusive jurisdiction and venue of the state and federal courts located in San Bernardino County, California.
            </p>
          </div>

          {/* 16. General Provisions */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              16. General Provisions
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.1 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms, together with the Privacy Policy, Cookie Policy, and Acceptable Use Policy, constitute the entire agreement between you and Truck Command regarding the Services and supersede all prior agreements and understandings.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.2 Modifications</h3>
            <p className="text-gray-700 mb-4">
              We may modify these Terms at any time. Material changes will be communicated via email or notice within the Services at least thirty (30) days before they take effect. Your continued use of the Services after the effective date constitutes acceptance of the modified Terms.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.3 Waiver</h3>
            <p className="text-gray-700 mb-4">
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.4 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.5 Assignment</h3>
            <p className="text-gray-700 mb-4">
              You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.6 Force Majeure</h3>
            <p className="text-gray-700 mb-4">
              We shall not be liable for any failure or delay in performance due to causes beyond our reasonable control, including natural disasters, war, terrorism, labor disputes, government actions, or internet service failures.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.7 Independent Contractors</h3>
            <p className="text-gray-700 mb-4">
              The relationship between you and Truck Command is that of independent contractors. Nothing in these Terms creates a partnership, joint venture, employment, or agency relationship.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.8 Notices</h3>
            <p className="text-gray-700 mb-4">
              Notices to you may be sent to the email address associated with your Account. Notices to us should be sent to:
            </p>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="text-gray-700">
                Truck Command LLC<br />
                Attn: Legal Department<br />
                San Bernardino County, California<br />
                Email: <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a>
              </p>
            </div>
          </div>

          {/* 17. Contact Information */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              17. Contact Information
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <ul className="text-gray-700 space-y-2">
                <li><strong>Company:</strong> Truck Command LLC</li>
                <li><strong>Location:</strong> San Bernardino County, California</li>
                <li><strong>Email:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
                <li><strong>Legal Inquiries:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
                <li><strong>Billing Inquiries:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
                <li><strong>Phone:</strong> (951) 505-1147</li>
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
