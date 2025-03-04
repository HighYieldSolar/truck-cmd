"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function CookiesPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Cookies Policy
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
              <span>Cookies Policy</span>
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
              This Cookies Policy explains how Truck Command (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar technologies to recognize you when you visit our website at www.truckcommand.com and our mobile applications (collectively, the &quot;Services&quot;). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>
            <p className="text-gray-700 mb-4">
              By using or accessing our Services, you agree to the use of cookies and similar technologies as described in this policy.
            </p>
          </div>

          {/* What Are Cookies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              2. What Are Cookies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or work more efficiently, as well as to provide reporting information.
            </p>
            <p className="text-gray-700 mb-4">
              Cookies set by the website owner (in this case, Truck Command) are called &quot;first-party cookies.&quot; Cookies set by parties other than the website owner are called &quot;third-party cookies.&quot; Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
            </p>
          </div>

          {/* Types of Cookies We Use */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              3. Types of Cookies We Use
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We use the following types of cookies:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Essential Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are necessary for the Services to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms. These cookies do not store any personally identifiable information.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Performance Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our Services. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and anonymous.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Functionality Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies enable the Services to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, then some or all of these services may not function properly.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Targeting Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies may be set through our Services by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites. They do not directly store personal information but are based on uniquely identifying your browser and internet device.
            </p>
          </div>

          {/* Specific Cookies We Use */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              4. Specific Cookies We Use
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              The table below lists examples of the cookies we use and the purposes for which we use them:
            </p>
            
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left border">Cookie Name</th>
                    <th className="px-4 py-2 text-left border">Type</th>
                    <th className="px-4 py-2 text-left border">Purpose</th>
                    <th className="px-4 py-2 text-left border">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border">sessionId</td>
                    <td className="px-4 py-2 border">Essential</td>
                    <td className="px-4 py-2 border">Used to maintain your session and authentication status</td>
                    <td className="px-4 py-2 border">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">preferences</td>
                    <td className="px-4 py-2 border">Functional</td>
                    <td className="px-4 py-2 border">Remembers your preferences for the application</td>
                    <td className="px-4 py-2 border">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">_ga</td>
                    <td className="px-4 py-2 border">Performance</td>
                    <td className="px-4 py-2 border">Used by Google Analytics to distinguish users</td>
                    <td className="px-4 py-2 border">2 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">_gid</td>
                    <td className="px-4 py-2 border">Performance</td>
                    <td className="px-4 py-2 border">Used by Google Analytics to distinguish users</td>
                    <td className="px-4 py-2 border">24 hours</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border">_fbp</td>
                    <td className="px-4 py-2 border">Targeting</td>
                    <td className="px-4 py-2 border">Used by Facebook to deliver advertisements</td>
                    <td className="px-4 py-2 border">3 months</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-gray-700 mb-4">
              Please note that this list may not be exhaustive and may be updated periodically as our Services evolve.
            </p>
          </div>

          {/* How We Use Cookies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              5. How We Use Cookies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>To authenticate users and prevent fraudulent use of user accounts</li>
              <li>To remember information about your preferences and settings</li>
              <li>To provide you with personalized content and information</li>
              <li>To understand and analyze how you use our Services and to improve it</li>
              <li>To measure the effectiveness of our marketing campaigns</li>
              <li>To help us understand the aggregate usage patterns of our Services</li>
              <li>To identify and debug issues with our Services</li>
              <li>To enable certain functions and tools on our Services</li>
            </ul>
          </div>

          {/* Your Choices Regarding Cookies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              6. Your Choices Regarding Cookies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you&apos;d like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.
            </p>
            <p className="text-gray-700 mb-4">
              Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">How to Control Cookies in Major Browsers</h3>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li><strong>Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://support.google.com/chrome/answer/95647</a></li>
              <li><strong>Safari:</strong> <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471</a></li>
              <li><strong>Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox</a></li>
              <li><strong>Edge:</strong> <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge</a></li>
            </ul>
          </div>

          {/* Cookie Consent */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              7. Cookie Consent
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              When you first visit our Services, you will be presented with a cookie banner that allows you to accept or decline non-essential cookies. You can change your preferences at any time by clicking on the &quot;Cookie Preferences&quot; link in the footer of our website.
            </p>
            <p className="text-gray-700 mb-4">
              By continuing to use our Services without changing your cookie settings, you are agreeing to our use of cookies as described in this policy.
            </p>
          </div>

          {/* Third-Party Cookies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              8. Third-Party Cookies
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics, deliver advertisements, and so on. These cookies may be set when you visit our Services or when you interact with content that is embedded in our Services.
            </p>
            <p className="text-gray-700 mb-4">
              We work with third-party service providers who may place cookies on your device to provide analytics services and to serve advertisements that are relevant to your interests. These third parties may collect information about your online activities over time and across different websites and other online services.
            </p>
            <p className="text-gray-700 mb-4">
              We have no control over these third-party cookies, and they are subject to the third parties&apos; privacy policies.
            </p>
          </div>

          {/* Updates to this Cookies Policy */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              9. Updates to this Cookies Policy
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Cookies Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookies Policy regularly to stay informed about our use of cookies and related technologies.
            </p>
            <p className="text-gray-700 mb-4">
              The date at the top of this Cookies Policy indicates when it was last updated.
            </p>
          </div>

          {/* Contact Us */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              10. Contact Us
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our use of cookies or this Cookies Policy, please contact us:
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