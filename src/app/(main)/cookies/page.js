"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function CookiesPolicyPage() {
  const effectiveDate = "December 9, 2025";
  const lastUpdated = "December 9, 2025";

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Cookie Policy
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
              <span>Cookie Policy</span>
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
              This Cookie Policy explains how <strong>Truck Command LLC</strong> (&quot;Truck Command,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a California limited liability company headquartered in San Bernardino County, California, uses cookies and similar tracking technologies when you visit our website at truckcommand.app and use our mobile applications and services (collectively, the &quot;Services&quot;).
            </p>
            <p className="text-gray-700 mb-4">
              This policy explains what these technologies are, why we use them, and your rights to control our use of them. Please read this policy in conjunction with our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, which provides more details on how we handle your personal information.
            </p>
          </div>

          {/* 2. What Are Cookies? */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              2. What Are Cookies?
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work efficiently, provide information to site owners, and enable certain features and functionality.
            </p>
            <p className="text-gray-700 mb-4">
              Cookies can be categorized in several ways:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>First-Party Cookies:</strong> Set by Truck Command (the website you are visiting)</li>
              <li><strong>Third-Party Cookies:</strong> Set by other organizations whose services we use (such as analytics providers)</li>
              <li><strong>Session Cookies:</strong> Temporary cookies deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device until they expire or you delete them</li>
            </ul>
          </div>

          {/* 3. Similar Technologies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              3. Similar Technologies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              In addition to cookies, we may use other similar technologies:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Web Beacons (Pixel Tags):</strong> Small graphic images embedded in web pages or emails that track whether you have viewed certain content</li>
              <li><strong>Local Storage:</strong> Technology that allows websites to store data locally on your device, similar to cookies but with larger storage capacity</li>
              <li><strong>Session Storage:</strong> Similar to local storage but data is cleared when the browser session ends</li>
              <li><strong>Device Fingerprinting:</strong> Collection of information about your device configuration for identification purposes</li>
            </ul>
          </div>

          {/* 4. Types of Cookies We Use */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              4. Types of Cookies We Use
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Strictly Necessary Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are essential for the Services to function properly. Without them, certain features would not work. They include:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Authentication cookies that keep you logged in</li>
              <li>Session cookies that maintain your session state</li>
              <li>Security cookies that protect against unauthorized access</li>
              <li>Load balancing cookies that distribute traffic across servers</li>
            </ul>
            <p className="text-gray-700 mb-4 text-sm italic">
              Note: These cookies cannot be disabled as they are necessary for the Services to operate.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 Performance and Analytics Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies help us understand how visitors interact with our Services by collecting and reporting information anonymously. They allow us to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Count visitors and traffic sources</li>
              <li>Understand which pages are most and least popular</li>
              <li>See how visitors navigate through the Services</li>
              <li>Identify and fix performance issues</li>
              <li>Measure the effectiveness of our content</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.3 Functionality Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies enable enhanced functionality and personalization, including:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Remembering your preferences and settings (e.g., theme, language)</li>
              <li>Remembering choices you make (e.g., displayed columns, sorting preferences)</li>
              <li>Providing personalized features based on your usage patterns</li>
              <li>Storing form data to prevent re-entry</li>
            </ul>
          </div>

          {/* 5. Specific Cookies We Use */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              5. Specific Cookies We Use
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              The following table provides details about the specific cookies we use:
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border font-semibold">Cookie Name</th>
                    <th className="px-3 py-2 text-left border font-semibold">Type</th>
                    <th className="px-3 py-2 text-left border font-semibold">Purpose</th>
                    <th className="px-3 py-2 text-left border font-semibold">Duration</th>
                    <th className="px-3 py-2 text-left border font-semibold">Provider</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border font-mono text-xs">sb-*-auth-token</td>
                    <td className="px-3 py-2 border">Essential</td>
                    <td className="px-3 py-2 border">Maintains authentication session with Supabase</td>
                    <td className="px-3 py-2 border">Session/Persistent</td>
                    <td className="px-3 py-2 border">Supabase</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border font-mono text-xs">__stripe_mid</td>
                    <td className="px-3 py-2 border">Essential</td>
                    <td className="px-3 py-2 border">Fraud prevention for payment processing</td>
                    <td className="px-3 py-2 border">1 year</td>
                    <td className="px-3 py-2 border">Stripe</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border font-mono text-xs">__stripe_sid</td>
                    <td className="px-3 py-2 border">Essential</td>
                    <td className="px-3 py-2 border">Fraud prevention for payment processing</td>
                    <td className="px-3 py-2 border">30 minutes</td>
                    <td className="px-3 py-2 border">Stripe</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border font-mono text-xs">tc_preferences</td>
                    <td className="px-3 py-2 border">Functionality</td>
                    <td className="px-3 py-2 border">Stores your UI preferences (theme, layout)</td>
                    <td className="px-3 py-2 border">1 year</td>
                    <td className="px-3 py-2 border">Truck Command</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border font-mono text-xs">tc_cookie_consent</td>
                    <td className="px-3 py-2 border">Essential</td>
                    <td className="px-3 py-2 border">Records your cookie consent preferences</td>
                    <td className="px-3 py-2 border">1 year</td>
                    <td className="px-3 py-2 border">Truck Command</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border font-mono text-xs">_vercel_jwt</td>
                    <td className="px-3 py-2 border">Essential</td>
                    <td className="px-3 py-2 border">Authentication for deployment previews</td>
                    <td className="px-3 py-2 border">Session</td>
                    <td className="px-3 py-2 border">Vercel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 mb-4 text-sm">
              <em>Note: This list may be updated as we add or remove features. We encourage you to check this page periodically.</em>
            </p>
          </div>

          {/* 6. Third-Party Cookies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              6. Third-Party Cookies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We use services from the following third parties that may set cookies on your device:
            </p>

            <div className="space-y-4 mb-4">
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Supabase (Authentication & Database)</h4>
                <p className="text-gray-700 text-sm mb-2">Used for user authentication and session management.</p>
                <p className="text-gray-600 text-sm">Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/privacy</a></p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Stripe (Payment Processing)</h4>
                <p className="text-gray-700 text-sm mb-2">Used for secure payment processing and fraud prevention.</p>
                <p className="text-gray-600 text-sm">Privacy Policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com/privacy</a></p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Vercel (Hosting)</h4>
                <p className="text-gray-700 text-sm mb-2">Used for website hosting and deployment.</p>
                <p className="text-gray-600 text-sm">Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vercel.com/legal/privacy-policy</a></p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">
              We do not control these third-party cookies and recommend reviewing their privacy policies for more information about their data practices.
            </p>
          </div>

          {/* 7. How We Use Cookies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              7. How We Use Cookies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Authenticate Users:</strong> Verify your identity and maintain your login session</li>
              <li><strong>Remember Preferences:</strong> Store your settings, preferences, and customizations</li>
              <li><strong>Secure the Services:</strong> Protect against fraudulent activity and unauthorized access</li>
              <li><strong>Analyze Usage:</strong> Understand how users interact with our Services to improve them</li>
              <li><strong>Process Payments:</strong> Enable secure payment processing through Stripe</li>
              <li><strong>Debug Issues:</strong> Identify and fix technical problems</li>
              <li><strong>Maintain State:</strong> Keep track of your actions during a session (e.g., items in a form)</li>
            </ul>
          </div>

          {/* 8. Your Cookie Choices */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              8. Your Cookie Choices
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              You have several options for managing cookies:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">8.1 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>View what cookies are stored on your device</li>
              <li>Delete some or all cookies</li>
              <li>Block all cookies or only third-party cookies</li>
              <li>Configure cookie acceptance on a site-by-site basis</li>
            </ul>

            <p className="text-gray-700 mb-4">
              Here are links to cookie management instructions for major browsers:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Google Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">support.google.com/chrome/answer/95647</a></li>
              <li><strong>Mozilla Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">support.mozilla.org/kb/cookies</a></li>
              <li><strong>Apple Safari:</strong> <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">support.apple.com/guide/safari/manage-cookies</a></li>
              <li><strong>Microsoft Edge:</strong> <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">support.microsoft.com/microsoft-edge/delete-cookies</a></li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">8.2 Mobile Devices</h3>
            <p className="text-gray-700 mb-4">
              Mobile devices typically provide settings to limit ad tracking and manage cookies. Refer to your device&apos;s documentation for specific instructions.
            </p>

            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded mb-4">
              <p className="text-gray-700">
                <strong>Important:</strong> Disabling certain cookies may impact the functionality of our Services. Essential cookies cannot be disabled as they are required for the Services to operate properly. If you disable these cookies, you may not be able to use all features of our Services.
              </p>
            </div>
          </div>

          {/* 9. Do Not Track */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              9. Do Not Track Signals
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Some browsers include a &quot;Do Not Track&quot; (DNT) feature that signals to websites that you do not want to have your online activity tracked. There is currently no universally accepted standard for how to respond to DNT signals.
            </p>
            <p className="text-gray-700 mb-4">
              Our Services do not currently respond to DNT signals. However, you can manage your tracking preferences using the cookie controls described in Section 8 above and in our Privacy Policy.
            </p>
          </div>

          {/* 10. Updates to This Policy */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              10. Updates to This Cookie Policy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in the cookies we use, changes in technology, or changes in applicable law. When we make material changes:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>We will update the &quot;Effective Date&quot; at the top of this policy</li>
              <li>We may notify you through the Services or via email</li>
              <li>We may re-present the cookie consent banner for you to confirm your preferences</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies.
            </p>
          </div>

          {/* 11. Contact Us */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              11. Contact Us
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Cookie Policy or our use of cookies, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <ul className="text-gray-700 space-y-2">
                <li><strong>Company:</strong> Truck Command LLC</li>
                <li><strong>Location:</strong> San Bernardino County, California, USA</li>
                <li><strong>Email:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
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
