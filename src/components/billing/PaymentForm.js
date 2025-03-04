"use client";

import { useState } from "react";

export default function PaymentForm({ loading, onSubmit }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ cardNumber, expiryDate, cvv });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
  );
}