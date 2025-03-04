"use client";

export default function PlanSelection({ selectedPlan, setSelectedPlan }) {
  const plans = [
    { id: "basic", name: "Basic Plan", price: "$19/month", features: ["1 Truck", "Basic Features"] },
    { id: "premium", name: "Premium Plan", price: "$39/month", features: ["1-2 Trucks", "Premium Features"] },
    { id: "fleet", name: "Fleet Plan", price: "$69+/month", features: ["3+ Trucks", "Advanced Fleet Tools"] },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800">Select a Plan</h3>
      <div className="grid grid-cols-1 gap-4 mt-3">
        {plans.map((plan) => (
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
  );
}