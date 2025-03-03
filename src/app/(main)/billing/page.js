"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BillingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      router.push("/dashboard"); // ✅ Redirect to dashboard after payment
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

        {/* Plan Selection */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800">Select a Plan</h3>
          <div className="grid grid-cols-1 gap-4 mt-3">
            {[
              { id: "basic", name: "Basic Plan", price: "$19/month", features: ["1 Truck", "Basic Features"] },
              { id: "premium", name: "Premium Plan", price: "$39/month", features: ["1-2 Trucks", "Premium Features"] },
              { id: "fleet", name: "Fleet Plan", price: "$69+/month", features: ["3+ Trucks", "Advanced Fleet Tools"] },
            ].map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedPlan === plan.id ? "border-blue-500 bg-blue-100" : "border-gray-300"
                }`}
              >
                <h4 className="text-lg font-semibold">{plan.name}</h4>
                <p className="text-gray-600">{plan.price}</p>
                <ul className="text-sm text-gray-500 mt-2">
                  {plan.features.map((feature, index) => (
                    <li key={index}>✔ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePayment} className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Enter Billing Details</h3>
          <div>
            <label className="block text-gray-700">Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full p-3 border rounded bg-gray-200 text-gray-900"
              required
            />
          </div>

          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700">Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-3 border rounded bg-gray-200 text-gray-900"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700">CVV</label>
              <input
                type="text"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="w-full p-3 border rounded bg-gray-200 text-gray-900"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? "Processing Payment..." : "Confirm & Start Subscription"}
          </button>
        </form>
      </div>
    </div>
  );
}
