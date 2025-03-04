"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PlanSelection from "@/components/billing/PlanSelection";
import PaymentForm from "@/components/billing/PaymentForm";

export default function BillingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [loading, setLoading] = useState(false);

  const handlePayment = (paymentDetails) => {
    setLoading(true);

    // In a real app, you would process the payment here
    // For now, we'll just simulate a delay and redirect
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <div className="flex flex-col items-center">
          <Image src="/images/TC.png" alt="Truck Command Logo" width={100} height={100} />
          <h2 className="text-3xl font-bold text-gray-900 text-center mt-4">
            Choose Your Plan
          </h2>
          <p className="text-center text-gray-600 mt-2">
            Select a plan and enter your billing details to continue.
          </p>
        </div>

        {/* Plan Selection Component */}
        <PlanSelection 
          selectedPlan={selectedPlan} 
          setSelectedPlan={setSelectedPlan} 
        />

        {/* Payment Form Component */}
        <PaymentForm 
          loading={loading}
          onSubmit={handlePayment}
        />
      </div>
    </div>
  );
}