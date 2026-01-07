"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageSquare, Bell, Shield, CheckCircle, XCircle, Smartphone, Check } from "lucide-react";

export default function SmsConsentPage() {
  const effectiveDate = "January 6, 2026";
  const [consentChecked, setConsentChecked] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (consentChecked && phoneNumber) {
      setShowSuccess(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              SMS Notification Consent
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-70 rounded"></div>
            </h1>
            <p className="text-lg mb-4 max-w-3xl mx-auto">
              How Truck Command uses SMS notifications to keep your business running smoothly
            </p>
            <div className="flex space-x-2 text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <ChevronRight size={16} />
              <span>SMS Consent</span>
            </div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* TCPA-Compliant Opt-In Section - PRIMARY CONSENT FORM */}
      <section className="py-8 px-6 bg-white border-b-4 border-blue-500">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 shadow-lg">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">SMS Notification Opt-In</h2>
              <p className="text-gray-600">Enable text message alerts for your Truck Command account</p>
            </div>

            {showSuccess ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-700 mb-2">Successfully Opted In!</h3>
                <p className="text-gray-600">You will now receive SMS notifications from Truck Command.</p>
                <p className="text-sm text-gray-500 mt-2">Reply STOP at any time to opt-out.</p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-6">
                {/* Phone Number Input */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-800"
                  />
                </div>

                {/* TCPA-Compliant Consent Checkbox */}
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <div className="flex-shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        className="w-6 h-6 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-800 mb-2">
                        I agree to receive SMS notifications from Truck Command
                      </p>
                      <p className="mb-2">
                        By checking this box and providing my phone number, I expressly consent to receive automated
                        text messages from Truck Command LLC at the phone number provided. Messages may include:
                      </p>
                      <ul className="list-disc pl-5 mb-3 space-y-1">
                        <li>Compliance alerts (document expirations, deadlines)</li>
                        <li>Account notifications (invoices, payments, deliveries)</li>
                        <li>Security alerts (verification codes, login notifications)</li>
                        <li>Urgent business alerts (critical compliance deadlines)</li>
                      </ul>
                      <p className="font-semibold text-gray-800">
                        Message frequency varies (approximately 1-10 messages/month). Message and data rates may apply.
                      </p>
                      <p className="mt-2">
                        Reply <strong>STOP</strong> to unsubscribe at any time. Reply <strong>HELP</strong> for assistance.
                        Consent is not a condition of purchase. View our{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> and{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!consentChecked || !phoneNumber}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    consentChecked && phoneNumber
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Enable SMS Notifications
                </button>

                {/* Additional Disclosure */}
                <div className="text-center text-xs text-gray-500 space-y-1">
                  <p>Truck Command LLC | Phone: (951) 505-1147 | Email: support@truckcommand.com</p>
                  <p>Standard message and data rates may apply. Check with your carrier for details.</p>
                </div>
              </form>
            )}
          </div>

          {/* Quick Reference Box */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border text-center">
              <p className="text-2xl font-bold text-blue-600">STOP</p>
              <p className="text-sm text-gray-600">Text to unsubscribe</p>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <p className="text-2xl font-bold text-blue-600">HELP</p>
              <p className="text-sm text-gray-600">Text for assistance</p>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <p className="text-2xl font-bold text-blue-600">1-10/mo</p>
              <p className="text-sm text-gray-600">Message frequency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">

          {/* Overview */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              SMS Notification Program
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Truck Command offers optional SMS notifications to help you stay on top of critical business operations.
              These messages are designed to alert you about time-sensitive matters that could impact your trucking business.
            </p>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-gray-700">
                <strong>SMS notifications are entirely optional.</strong> You must explicitly enable them in your account settings to receive text messages from Truck Command.
              </p>
            </div>
          </div>

          {/* Types of Messages */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              Types of SMS Messages
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-6">
              When you opt-in to SMS notifications, you may receive the following types of messages:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Bell className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Compliance Alerts</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Critical notifications about expiring documents such as CDL licenses, medical cards, insurance certificates, vehicle registrations, and inspection reports.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Account Notifications</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Important updates about load deliveries, invoice payment reminders, and account activity alerts.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Security Alerts</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Two-factor authentication codes, password reset verification, and suspicious login notifications.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Urgent Business Alerts</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Time-sensitive notifications that require immediate attention, such as critical compliance deadlines.
                </p>
              </div>
            </div>
          </div>

          {/* Sample Messages */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              Sample Messages
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Here are examples of messages you may receive:
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
                CRITICAL: Driver license for John Smith expires in 3 days. Update now: https://truckcommand.com/compliance - Reply STOP to opt-out
              </div>
              <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
                Truck Command: Your medical card expires tomorrow. Log in to update your documents. Reply STOP to opt-out
              </div>
              <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
                Truck Command Security: Your verification code is 123456. This code expires in 10 minutes.
              </div>
            </div>
          </div>

          {/* How to Opt-In */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              How to Opt-In
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              SMS notifications require explicit consent. To enable SMS notifications:
            </p>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Log in to your Truck Command account</h4>
                  <p className="text-gray-600">Access your dashboard at truckcommand.com</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Navigate to Settings</h4>
                  <p className="text-gray-600">Click on the Settings icon in your dashboard sidebar</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Open Notification Preferences</h4>
                  <p className="text-gray-600">Select the &quot;Notifications&quot; tab to view your notification settings</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Enable SMS Notifications</h4>
                  <p className="text-gray-600">Toggle on &quot;SMS Notifications&quot; and select which alert categories you want to receive via text</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                <div>
                  <h4 className="font-semibold text-gray-800">Confirm your phone number</h4>
                  <p className="text-gray-600">Enter and verify your mobile phone number to receive SMS messages</p>
                </div>
              </li>
            </ol>

            {/* Visual representation of opt-in toggle */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-4">Example: SMS Notification Settings</h4>
              <div className="bg-white p-4 rounded border">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Receive important alerts via text message</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">Compliance Alerts</p>
                    <p className="text-sm text-gray-500">Document expiration warnings</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">Security Alerts</p>
                    <p className="text-sm text-gray-500">2FA codes and login notifications</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-800">Account Notifications</p>
                    <p className="text-sm text-gray-500">Invoice and payment reminders</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* How to Opt-Out */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              How to Opt-Out
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              You can stop receiving SMS notifications at any time using either of these methods:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <h3 className="font-semibold text-gray-800">Reply STOP</h3>
                </div>
                <p className="text-gray-600">
                  Reply <strong>STOP</strong> to any SMS message from Truck Command. You will receive a confirmation and no further messages will be sent.
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <h3 className="font-semibold text-gray-800">Account Settings</h3>
                </div>
                <p className="text-gray-600">
                  Log in to your Truck Command account, go to <strong>Settings &gt; Notifications</strong>, and toggle off SMS Notifications.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-gray-700">
                <strong>Note:</strong> You can also text <strong>HELP</strong> to receive assistance or contact support@truckcommand.com for help with your notification preferences.
              </p>
            </div>
          </div>

          {/* Message Frequency & Rates */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              Message Frequency & Rates
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <ul className="list-disc pl-8 text-gray-700 space-y-2">
              <li><strong>Message Frequency:</strong> Message frequency varies based on your account activity and compliance status. You may receive 1-10 messages per month depending on your settings and alerts.</li>
              <li><strong>Carrier Rates:</strong> Standard message and data rates may apply. Check with your mobile carrier for details about your plan.</li>
              <li><strong>No Premium Charges:</strong> Truck Command does not charge for SMS notifications. Any charges are from your mobile carrier.</li>
            </ul>
          </div>

          {/* Privacy & Terms */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              Privacy & Terms
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. We will never:
            </p>
            <ul className="list-disc pl-8 text-gray-700 space-y-2 mb-4">
              <li>Share your phone number with third parties for marketing purposes</li>
              <li>Send promotional or marketing messages via SMS</li>
              <li>Use your phone number for any purpose other than service notifications</li>
            </ul>
            <p className="text-gray-700">
              For complete details on how we handle your data, please review our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> and{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 inline-block relative">
              Contact Us
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our SMS notification program:
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <ul className="text-gray-700 space-y-2">
                <li><strong>Email:</strong> <a href="mailto:support@truckcommand.com" className="text-blue-600 hover:underline">support@truckcommand.com</a></li>
                <li><strong>Phone:</strong> (951) 505-1147</li>
                <li><strong>Website:</strong> <a href="https://truckcommand.com" className="text-blue-600 hover:underline">truckcommand.com</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm text-center">
              Effective Date: {effectiveDate} | Truck Command LLC
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
