"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, CheckCircleIcon } from "lucide-react";
import { motion } from "framer-motion"; // ✅ For smooth animations

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);
  const [phone, setPhone] = useState("");
  const [validPhone, setValidPhone] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Validate Email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    setValidEmail(isValid);
    setEmail(email);
  };

  // ✅ Validate Phone Number
  const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    const isValid = re.test(phone);
    setValidPhone(isValid);
    setPhone(phone);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validEmail || !validPhone) {
      setError("Please enter a valid email and phone number.");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Signup successful! Redirecting...");
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`); // ✅ Redirect to verify-email page with email param
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col lg:flex-row flex-grow">
        {/* ✅ Left Side - Gradient Background & Features */}
        <div className="lg:w-1/2 flex flex-col justify-center text-white p-10 lg:p-16 relative bg-gradient-to-r from-blue-600 to-cyan-500">
          <h1 className="text-5xl font-extrabold mb-6">
            The Ultimate Trucking Management Software
          </h1>
          <p className="text-lg mb-6">
            Manage your fleet, dispatch loads, track expenses, and handle compliance in one place.
          </p>

          <div className="space-y-5">
            {[
              { title: "📦 Load & Dispatch Management", desc: "Plan, assign, and track loads effortlessly." },
              { title: "📑 Invoicing & Payment Tracking", desc: "Generate and manage invoices with automation." },
              { title: "💰 Expense & Fuel Tracking", desc: "Monitor fuel usage and expenses in real-time." },
              { title: "⚡ IFTA Tax Calculator", desc: "Easily calculate and file IFTA reports." },
              { title: "🚛 Fleet & Maintenance Tracking", desc: "Track vehicle health and maintenance schedules." },
              { title: "☎️ 24/7 Customer Support", desc: "We're here to help you anytime, anywhere." },
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-4">
                <CheckCircleIcon size={24} className="text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-gray-200 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Right Side - Signup Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-white rounded-lg shadow-xl">
          <div className="max-w-md w-full">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <Image src="/images/TC.png" alt="Truck Command Logo" width={100} height={100} />
              <h1 className="text-3xl font-bold text-gray-900 text-center mt-4">Create Your Account</h1>
              <p className="text-center text-gray-600 mt-2">Start your <strong>7-day free trial</strong> today!</p>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            {message && <p className="text-green-500 text-center mb-4">{message}</p>}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-gray-700 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  className="w-full p-3 border rounded bg-gray-100 text-gray-900 focus:ring focus:ring-blue-300"
                  required
                />
              </div>

              {/* Expand Additional Fields When Email is Valid */}
              {validEmail && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-3 border rounded bg-gray-100 text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => validatePhone(e.target.value)}
                        className="w-full p-3 border rounded bg-gray-100 text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium">Business Name</label>
                      <input
                        type="text"
                        placeholder="Enter your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full p-3 border rounded bg-gray-100 text-gray-900"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Password */}
              <div>
                <label className="block text-gray-700 font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border rounded bg-gray-100 text-gray-900 pr-10 focus:ring focus:ring-blue-300"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900">
                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition" disabled={loading}>
                {loading ? "Signing up..." : "Start Free Trial"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ✅ Footer */}
      <footer className="bg-gray-900 text-white py-6 text-center">
        <p>&copy; 2025 Truck Command. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
