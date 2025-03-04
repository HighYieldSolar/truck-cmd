"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, CheckCircleIcon, XIcon, TruckIcon, DollarSignIcon, FileTextIcon, FuelIcon, CalculatorIcon, WrenchIcon, HeadphonesIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);
  const [phone, setPhone] = useState("");
  const [validPhone, setValidPhone] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [numTrucks, setNumTrucks] = useState("1-5");
  const [step, setStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Validate Email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    setValidEmail(isValid);
    setEmail(email);
  };

  // Validate Phone Number
  const validatePhone = (phone) => {
    // Allow formats like (123) 456-7890, 123-456-7890, or 1234567890
    const cleanedPhone = phone.replace(/\D/g, '');
    const re = /^\d{10}$/;
    const isValid = re.test(cleanedPhone);
    setValidPhone(isValid);
    setPhone(phone);
  };

  // Check if passwords match
  const checkPasswordMatch = (confirmPwd) => {
    setConfirmPassword(confirmPwd);
    setPasswordsMatch(password === confirmPwd);
  };

  // Form validation
  const isFormValid = () => {
    return (
      validEmail && 
      validPhone && 
      fullName.trim() !== "" && 
      businessName.trim() !== "" && 
      password.length >= 8 && 
      passwordsMatch &&
      termsAccepted
    );
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validEmail) {
      setStep(2);
    } else {
      setError("Please enter a valid email address");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError("Please complete all required fields correctly.");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      // For demo, simulate successful signup
      // In production, uncomment the actual supabase call
      /*
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            phone: phone,
            num_trucks: numTrucks
          }
        }
      });
      
      if (error) throw error;
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFormSubmitted(true);
      setMessage("Account created successfully!");
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 3000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Feature icons mapping
  const featureIcons = {
    "📦 Load & Dispatch": <TruckIcon size={24} className="text-green-400" />,
    "📑 Invoicing & Payment": <DollarSignIcon size={24} className="text-green-400" />,
    "💰 Expense & Fuel": <FuelIcon size={24} className="text-green-400" />,
    "⚡ IFTA Tax Calculator": <CalculatorIcon size={24} className="text-green-400" />,
    "🚛 Fleet & Maintenance": <WrenchIcon size={24} className="text-green-400" />,
    "☎️ 24/7 Support": <HeadphonesIcon size={24} className="text-green-400" />
  };

  // Features data
  const features = [
    { title: "📦 Load & Dispatch", desc: "Plan, assign, and track loads effortlessly." },
    { title: "📑 Invoicing & Payment", desc: "Generate and manage invoices with automation." },
    { title: "💰 Expense & Fuel", desc: "Monitor fuel usage and expenses in real-time." },
    { title: "⚡ IFTA Tax Calculator", desc: "Easily calculate and file IFTA reports." },
    { title: "🚛 Fleet & Maintenance", desc: "Track vehicle health and maintenance schedules." },
    { title: "☎️ 24/7 Support", desc: "We're here to help you anytime, anywhere." },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col lg:flex-row flex-grow">
        {/* Left Side - Gradient Background & Features */}
        <div className="lg:w-1/2 flex flex-col justify-center text-white p-10 lg:p-16 relative bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
          <div className="lg:max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-6">
              The Ultimate Trucking Management Software
            </h1>
            <p className="text-lg mb-6 text-gray-100">
              Manage your fleet, dispatch loads, track expenses, and handle compliance in one place.
            </p>

            <div className="space-y-5 mt-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {featureIcons[feature.title]}
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-gray-200 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            

          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="max-w-md w-full">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <Image src="/images/TC.png" alt="Truck Command Logo" width={100} height={100} />
              <h1 className="text-3xl font-bold text-gray-900 text-center mt-4">Create Your Account</h1>
              <p className="text-center text-gray-600 mt-2">Start your <strong>7-day free trial</strong> today!</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 flex items-center">
                <XIcon size={18} className="mr-2" />
                <p>{error}</p>
              </div>
            )}
            
            {formSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon size={32} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h3>
                <p className="text-gray-600 mb-6">Please check your email to verify your account.</p>
                <p className="text-sm text-gray-500">Redirecting you shortly...</p>
              </motion.div>
            ) : (
              /* Multi-step Signup Form */
              <form className="space-y-5">
                {step === 1 ? (
                  /* Step 1: Email */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Business Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => validateEmail(e.target.value)}
                        className={`w-full p-3 border rounded ${validEmail ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'} text-gray-900 focus:ring focus:ring-blue-300`}
                        required
                      />
                      {email && !validEmail && (
                        <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleContinue}
                      className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition mt-6"
                    >
                      Continue
                    </button>
                    
                    <p className="text-center text-gray-600 mt-4">
                      Already have an account? <Link href="/login" className="text-blue-600 font-medium">Log in</Link>
                    </p>
                  </motion.div>
                ) : (
                  /* Step 2: Complete Profile */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-2 flex items-center">
                      <CheckCircleIcon size={18} className="mr-2" />
                      <p>Using email: <strong>{email}</strong></p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Full Name</label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full p-3 border rounded bg-gray-50 text-gray-900 focus:ring focus:ring-blue-300"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Business Name</label>
                        <input
                          type="text"
                          placeholder="Enter your business name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full p-3 border rounded bg-gray-50 text-gray-900 focus:ring focus:ring-blue-300"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="(123) 456-7890"
                          value={phone}
                          onChange={(e) => validatePhone(e.target.value)}
                          className={`w-full p-3 border rounded ${validPhone ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'} text-gray-900 focus:ring focus:ring-blue-300`}
                          required
                        />
                        {phone && !validPhone && (
                          <p className="text-red-500 text-sm mt-1">Please enter a valid 10-digit phone number</p>
                        )}
                      </div>
                      

                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password (min. 8 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded bg-gray-50 text-gray-900 pr-10 focus:ring focus:ring-blue-300"
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900"
                          >
                            {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                          </button>
                        </div>
                        {password && password.length < 8 && (
                          <p className="text-red-500 text-sm mt-1">Password must be at least 8 characters</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Confirm Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => checkPasswordMatch(e.target.value)}
                          className={`w-full p-3 border rounded bg-gray-50 text-gray-900 focus:ring focus:ring-blue-300 ${confirmPassword && !passwordsMatch ? 'border-red-300' : ''}`}
                          required
                        />
                        {confirmPassword && !passwordsMatch && (
                          <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-start">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={() => setTermsAccepted(!termsAccepted)}
                        className="mt-1"
                      />
                      <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                        I agree to the <button 
                          type="button" 
                          className="text-blue-600 underline" 
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTerms(true);
                          }}
                        >
                          Terms and Conditions
                        </button> and Privacy Policy
                      </label>
                    </div>
                    
                    <div className="pt-4 flex space-x-3">
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="w-1/3 bg-gray-200 text-gray-800 p-3 rounded-md hover:bg-gray-300 transition"
                      >
                        Back
                      </button>
                      <button 
                        type="button"
                        onClick={handleSignup}
                        className="w-2/3 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                          </span>
                        ) : (
                          "Start Free Trial"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Terms and Conditions</h2>
              <button 
                onClick={() => setShowTerms(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon size={24} />
              </button>
            </div>
            
            <div className="prose prose-sm text-gray-700">
              <h3>1. Introduction</h3>
              <p>By using Truck Command, you agree to abide by these terms and conditions. Our services are designed to help trucking businesses manage their operations efficiently.</p>
              
              <h3>2. Subscription and Payment</h3>
              <p>Your subscription begins with a 7-day free trial. After the trial period, your selected payment method will be charged according to your chosen plan unless you cancel before the trial ends.</p>
              
              <h3>3. Data Privacy</h3>
              <p>We take your privacy seriously. All data you enter into Truck Command is secured and protected. We do not sell your data to third parties.</p>
              
              <h3>4. User Responsibilities</h3>
              <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.</p>
              
              <h3>5. Service Availability</h3>
              <p>While we strive for 99.9% uptime, we cannot guarantee that the service will be available at all times. Maintenance windows will be communicated in advance whenever possible.</p>
            </div>
            
            <button 
              onClick={() => {
                setTermsAccepted(true);
                setShowTerms(false);
              }} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Accept Terms
            </button>
          </div>
        </div>
      )}

    </div>
  );
}