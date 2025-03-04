"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, MessageSquare, Star, Lightbulb, AlertCircle, CheckCircle, Send, ThumbsUp } from "lucide-react";

export default function FeedbackPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    feedbackType: "general",
    rating: 5,
    message: "",
    submitted: false
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would send the feedback data to your backend
    console.log("Feedback submitted:", formState);
    
    // Simulate a successful submission
    setTimeout(() => {
      setFormState(prev => ({
        ...prev,
        submitted: true
      }));
    }, 1000);
  };

  const feedbackTypes = [
    { id: "general", label: "General Feedback", icon: <MessageSquare size={20} /> },
    { id: "feature", label: "Feature Request", icon: <Lightbulb size={20} /> },
    { id: "bug", label: "Report a Bug", icon: <AlertCircle size={20} /> }
  ];

  // Successful submission view
  if (formState.submitted) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
        {/* Hero Section */}
        <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
                Feedback
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-70 rounded"></div>
              </h1>
              <p className="text-lg mb-4 max-w-3xl mx-auto">
                Help us improve Truck Command
              </p>
              <div className="flex space-x-2 text-sm">
                <Link href="/" className="hover:underline">
                  Home
                </Link>
                <ChevronRight size={16} />
                <span>Feedback</span>
              </div>
            </div>
          </div>
          
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
        </section>

        {/* Thank You Section */}
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-lg shadow-md text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Thank You!</h2>
            <p className="text-xl text-gray-700 mb-6">
              Your feedback has been submitted successfully. We appreciate your input and will use it to improve our service.
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                Return to Home
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
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              >
                Submit Another Feedback
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Hero Section */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
              Feedback
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-70 rounded"></div>
            </h1>
            <p className="text-lg mb-4 max-w-3xl mx-auto">
              Help us improve Truck Command
            </p>
            <div className="flex space-x-2 text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <ChevronRight size={16} />
              <span>Feedback</span>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Feedback Form Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 md:p-10">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 inline-block relative">
                Share Your Thoughts
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
              </h2>
              <p className="text-gray-600 mb-8">
                We value your feedback! Please let us know how we can improve Truck Command to better meet your needs. All feedback is reviewed by our team.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formState.feedbackType === type.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <span className={`mr-3 ${formState.feedbackType === type.id ? 'text-blue-500' : 'text-gray-500'}`}>
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
                  <div className="flex space-x-2">
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
                    <span className="ml-4 self-center text-gray-700">
                      {formState.rating} / 5
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="message">
                    Your Feedback
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-full md:w-auto"
                  >
                    <Send size={20} className="mr-2" />
                    Submit Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Additional Content */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Why We Value Feedback */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <ThumbsUp size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Why We Value Your Feedback</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Your insights help us build a better product. Here&apos;s how we use your feedback:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li>Prioritize new features based on customer needs</li>
                <li>Improve existing functionality</li>
                <li>Fix bugs and issues you may encounter</li>
                <li>Understand how we can better serve your business</li>
              </ul>
            </div>

            {/* FAQ */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">How soon will you respond to my feedback?</h4>
                  <p className="text-gray-600">We review all feedback within 1-2 business days and may contact you if we need more information.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Can I track the status of my feature request?</h4>
                  <p className="text-gray-600">Major feature requests are added to our public roadmap, which you can view in your dashboard.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">How do I report an urgent issue?</h4>
                  <p className="text-gray-600">For time-sensitive problems, please contact our support team directly at support@truckcommand.com or call (555) 123-4567.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}