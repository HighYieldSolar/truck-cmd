"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Import router for navigation
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter(); // Initialize router

  const handleSignup = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Signup successful! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard"); // Redirect to dashboard after signup
      }, 2000); // Small delay for user experience
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <img src="/images/TC.png" alt="Truck Command Logo" className="h-12 mb-4" />
          <h1 className="text-3xl font-bold text-center text-gray-800">Join Truck Command</h1>
          <p className="text-center text-gray-600 mt-2">Your 7-day free trial starts today!</p>
          <p className="text-center text-gray-500 mt-2">A complete trucking management software for owner-operators and fleet managers.</p>
        </div>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {message && <p className="text-green-500 text-center mt-2">{message}</p>}

        <form onSubmit={handleSignup} className="mt-6">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded mt-2"
            required
          />

          <label className="block text-gray-700 mt-4">Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded mt-2"
            required
          />

          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded mt-6 hover:bg-blue-700">
            Start Free Trial
          </button>
        </form>

        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800">Key Features</h3>
          <ul className="mt-2 text-gray-600 text-sm">
            <li>✔ Load & Dispatch Management</li>
            <li>✔ Invoicing & Payment Tracking</li>
            <li>✔ Expense & Fuel Tracking</li>
            <li>✔ IFTA Tax Calculator</li>
            <li>✔ Fleet & Maintenance Tracking</li>
          </ul>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}
