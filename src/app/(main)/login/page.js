"use client";

import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/images/TC.png" alt="Truck Command Logo" width={100} height={100} />
        </div>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">Welcome Back!</h2>
        <p className="text-sm text-center text-gray-600 mb-6">
          Login to manage your fleet and stay on top of your trucking business.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}