"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Star,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Send,
  ThumbsUp,
  ArrowRight,
  HelpCircle,
  Mail,
  Phone
} from "lucide-react";

// Feedback Form Component
function FeedbackForm({ onSubmit, formState, setFormState }) {
  const [ratingHover, setRatingHover] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormState(prev => ({
      ...prev,
      rating
    }));
  };

  const feedbackTypes = [
    { id: "general", label: "General Feedback", icon: <MessageSquare size={20} /> },
    { id: "feature", label: "Feature Request", icon: <Lightbulb size={20} /> },
    { id: "bug", label: "Report a Bug", icon: <AlertCircle size={20} /> }
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Name and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
            Your Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formState.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            placeholder="John Smith"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formState.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            placeholder="john@example.com"
            required
          />
        </div>
      </div>

      {/* Feedback Type */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Feedback Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feedbackTypes.map(type => (
            <div key={type.id} className="relative">
              <input
                type="radio"
                id={type.id}
                name="feedbackType"
                value={type.id}
                checked={formState.feedbackType === type.id}
                onChange={handleChange}
                className="sr-only"
              />
              <label
                htmlFor={type.id}
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formState.feedbackType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <span className={`mr-3 ${formState.feedbackType === type.id ? 'text-blue-600' : 'text-gray-500'}`}>
                  {type.icon}
                </span>
                <span className={formState.feedbackType === type.id ? 'font-medium text-blue-700' : 'text-gray-700'}>
                  {type.label}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          How would you rate your experience with Truck Command?
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              onMouseEnter={() => setRatingHover(star)}
              onMouseLeave={() => setRatingHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (ratingHover || formState.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-4 text-gray-600 font-medium">
            {formState.rating} / 5
          </span>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-gray-700 font-medium mb-2" htmlFor="message">
          Your Feedback *
        </label>
        <textarea
          id="message"
          name="message"
          value={formState.message}
          onChange={handleChange}
          rows={5}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white resize-none"
          placeholder={
            formState.feedbackType === "general"
              ? "Tell us what you think about Truck Command..."
              : formState.feedbackType === "feature"
              ? "Describe the feature you'd like to see..."
              : "Please describe the issue you encountered in detail..."
          }
          required
        ></textarea>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          className="w-full px-6 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Submit Feedback
          <Send size={18} />
        </button>
        <p className="text-sm text-gray-500 mt-3 text-center">
          * Required fields. We typically respond within 1-2 business days.
        </p>
      </div>
    </form>
  );
}

export default function FeedbackPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    feedbackType: "general",
    rating: 5,
    message: "",
    submitted: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormState(prev => ({
      ...prev,
      submitted: true
    }));
  };

  // Successful submission view
  if (formState.submitted) {
    return (
      <div className="bg-white">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MessageSquare size={16} />
              Feedback
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Help Us{" "}
              <span className="text-blue-600">Improve</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your feedback helps us build a better product for truckers like you.
            </p>
          </div>
        </section>

        {/* Thank You Section */}
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-50 p-10 rounded-2xl text-center border border-green-100">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-500 mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-green-800 mb-4">Thank You!</h2>
              <p className="text-xl text-green-700 mb-8">
                Your feedback has been submitted successfully. We appreciate your input and will use it to improve Truck Command.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Return to Home
                  <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => setFormState({
                    name: "",
                    email: "",
                    feedbackType: "general",
                    rating: 5,
                    message: "",
                    submitted: false
                  })}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Submit Another Feedback
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MessageSquare size={16} />
            Feedback
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Help Us{" "}
            <span className="text-blue-600">Improve</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your feedback shapes the future of Truck Command. Tell us what&apos;s working,
            what isn&apos;t, and what features you&apos;d love to see.
          </p>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Thoughts</h2>
              <p className="text-gray-600 mb-8">
                We value your feedback! Please let us know how we can improve.
              </p>
              <FeedbackForm
                onSubmit={handleSubmit}
                formState={formState}
                setFormState={setFormState}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Why We Value Feedback */}
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <ThumbsUp size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Why We Value Your Feedback</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Your insights help us build a better product. Here&apos;s how we use your feedback:
                </p>
                <ul className="space-y-3">
                  {[
                    "Prioritize new features based on customer needs",
                    "Improve existing functionality",
                    "Fix bugs and issues quickly",
                    "Better serve your trucking business"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick FAQ */}
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                    <HelpCircle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Quick FAQ</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">How soon will you respond?</h4>
                    <p className="text-gray-600 text-sm">We review all feedback within 1-2 business days.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Can I track my feature request?</h4>
                    <p className="text-gray-600 text-sm">Major requests are added to our public roadmap.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Have an urgent issue?</h4>
                    <p className="text-gray-600 text-sm">Contact support directly for time-sensitive problems.</p>
                  </div>
                </div>
              </div>

              {/* Contact Options */}
              <div className="bg-blue-600 rounded-2xl p-8 text-white">
                <h3 className="text-xl font-bold mb-4">Need Direct Support?</h3>
                <p className="text-blue-100 mb-6">
                  For urgent issues or questions, reach out to our support team directly.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-blue-200" />
                    <span>support@truckcommand.com</span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Contact Us
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Try Truck Command free for 7 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
