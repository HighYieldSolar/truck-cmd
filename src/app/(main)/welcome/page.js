"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PartyPopper, CheckCircle, ArrowRight, Truck, Users, User,
  FileText, Calculator, DollarSign, Fuel, MapPin, Clock,
  Sparkles, ChevronRight, Shield, Zap, X
} from "lucide-react";
import Confetti from "@/components/shared/Confetti";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new') === 'true';
  const emailParam = searchParams.get('email');

  // Wizard state
  const [step, setStep] = useState(isNewUser ? 0 : 1); // 0 = celebration, 1+ = wizard
  const [showConfetti, setShowConfetti] = useState(isNewUser);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Onboarding data
  const [operatorType, setOperatorType] = useState(null); // 'owner-operator' or 'small-fleet'
  const [fleetSize, setFleetSize] = useState(null);
  const [truckInfo, setTruckInfo] = useState({ name: '', year: '', make: '' });
  const [primaryFocus, setPrimaryFocus] = useState(null);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-advance from celebration after 3 seconds
  useEffect(() => {
    if (step === 0 && isNewUser) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, isNewUser]);

  const handleOperatorSelect = (type) => {
    setOperatorType(type);
    setStep(2);
  };

  const handleFleetSizeSelect = (size) => {
    setFleetSize(size);
    setStep(3);
  };

  const handleTruckSubmit = () => {
    setStep(4);
  };

  const handleSkipTruck = () => {
    setStep(4);
  };

  const handleFocusSelect = async (focus) => {
    setPrimaryFocus(focus);
    setLoading(true);

    try {
      if (user) {
        // Save onboarding data to user profile
        const { error } = await supabase
          .from('users')
          .update({
            operator_type: operatorType,
            fleet_size: fleetSize,
            primary_focus: focus,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // If truck info was provided, create the truck (vehicles table)
        if (truckInfo.name || truckInfo.make) {
          await supabase.from('vehicles').insert({
            user_id: user.id,
            name: truckInfo.name || `${truckInfo.year} ${truckInfo.make}`.trim() || 'My Truck',
            year: truckInfo.year ? parseInt(truckInfo.year) : null,
            make: truckInfo.make || null,
            status: 'Active'
          });
        }
      }

      // Redirect to the appropriate page based on focus
      const focusRoutes = {
        loads: '/dashboard/dispatching?addNew=true',
        invoicing: '/dashboard/invoices/new',
        expenses: '/dashboard/expenses?addNew=true',
        ifta: '/dashboard/ifta',
      };

      router.push(focusRoutes[focus] || '/dashboard');
    } catch (error) {
      console.error('Error saving onboarding:', error);
      router.push('/dashboard');
    }
  };

  const operatorOptions = [
    {
      id: 'owner-operator',
      icon: <User size={32} />,
      title: 'Owner-Operator',
      description: 'I run my own truck and haul loads',
      features: ['Single truck operation', 'Personal load booking', 'Simple tax tracking']
    },
    {
      id: 'small-fleet',
      icon: <Users size={32} />,
      title: 'Small Fleet',
      description: 'I manage multiple trucks and drivers',
      features: ['Multiple trucks/drivers', 'Team dispatching', 'Fleet reporting']
    }
  ];

  const fleetSizeOptions = [
    { id: '2-5', label: '2-5 trucks', description: 'Growing operation' },
    { id: '6-15', label: '6-15 trucks', description: 'Established fleet' },
    { id: '16+', label: '16+ trucks', description: 'Large operation' }
  ];

  const focusOptions = [
    {
      id: 'loads',
      icon: <Truck size={24} />,
      title: 'Track My Loads',
      description: 'Start logging loads and miles',
      color: 'blue'
    },
    {
      id: 'invoicing',
      icon: <FileText size={24} />,
      title: 'Create Invoices',
      description: 'Get paid faster',
      color: 'green'
    },
    {
      id: 'expenses',
      icon: <DollarSign size={24} />,
      title: 'Track Expenses',
      description: 'Monitor my spending',
      color: 'orange'
    },
    {
      id: 'ifta',
      icon: <Calculator size={24} />,
      title: 'IFTA Reporting',
      description: 'Simplify tax filing',
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center px-4 py-12">
      {showConfetti && <Confetti />}

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* Step 0: Celebration */}
          {step === 0 && (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
              >
                <PartyPopper size={48} className="text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 mb-3"
              >
                Welcome to Truck Command!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600 mb-6"
              >
                Your 7-day free trial has started
              </motion.p>

              {/* Trial Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8"
              >
                <Clock size={16} />
                7 days of full access - no credit card needed
              </motion.div>

              {/* Email Verification Notice */}
              {emailParam && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-800">Check your email</p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        We sent a verification link to <strong>{emailParam}</strong>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => setStep(1)}
                className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
              >
                Let's Get You Set Up
                <ArrowRight size={20} />
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-gray-400 text-sm mt-4"
              >
                Takes less than 2 minutes
              </motion.p>
            </motion.div>
          )}

          {/* Step 1: Operator Type */}
          {step === 1 && (
            <motion.div
              key="operator-type"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Truck size={24} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tell us about your operation</h2>
                <p className="text-gray-500 mt-1">We'll customize your experience</p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
                <div className="w-8 h-1.5 rounded-full bg-gray-200"></div>
                <div className="w-8 h-1.5 rounded-full bg-gray-200"></div>
              </div>

              <div className="space-y-4">
                {operatorOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleOperatorSelect(option.id)}
                    className="w-full p-5 border-2 border-gray-200 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                        <p className="text-gray-500 text-sm mt-0.5">{option.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {option.features.map((feature, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Fleet Size (only for small-fleet) or Skip to Step 3 */}
          {step === 2 && operatorType === 'small-fleet' && (
            <motion.div
              key="fleet-size"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 mb-4"
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">How big is your fleet?</h2>
                <p className="text-gray-500 mt-1">This helps us show the right features</p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
                <div className="w-8 h-1.5 rounded-full bg-gray-200"></div>
              </div>

              <div className="space-y-3">
                {fleetSizeOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleFleetSizeSelect(option.id)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{option.label}</h3>
                      <p className="text-gray-500 text-sm">{option.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2 for owner-operators goes straight to truck, or Step 3 for fleets */}
          {((step === 2 && operatorType === 'owner-operator') || step === 3) && (
            <motion.div
              key="add-truck"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <button
                onClick={() => setStep(operatorType === 'owner-operator' ? 1 : 2)}
                className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 mb-4"
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Truck size={24} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add your first truck</h2>
                <p className="text-gray-500 mt-1">Quick setup - you can add more later</p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
                <div className="w-8 h-1.5 rounded-full bg-gray-200"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5 text-sm">
                    Truck Name / Number
                  </label>
                  <input
                    type="text"
                    placeholder='e.g., "Big Blue" or "Truck 101"'
                    value={truckInfo.name}
                    onChange={(e) => setTruckInfo({ ...truckInfo, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5 text-sm">
                      Year (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="2020"
                      value={truckInfo.year}
                      onChange={(e) => setTruckInfo({ ...truckInfo, year: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5 text-sm">
                      Make (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Peterbilt"
                      value={truckInfo.make}
                      onChange={(e) => setTruckInfo({ ...truckInfo, make: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleTruckSubmit}
                  className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-6"
                >
                  Continue
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={handleSkipTruck}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Choose Focus */}
          {step === 4 && (
            <motion.div
              key="choose-focus"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <button
                onClick={() => setStep(operatorType === 'owner-operator' ? 2 : 3)}
                className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 mb-4"
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">What do you want to do first?</h2>
                <p className="text-gray-500 mt-1">We'll help you get started</p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
                <div className="w-8 h-1.5 rounded-full bg-blue-600"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {focusOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleFocusSelect(option.id)}
                    disabled={loading}
                    className={`p-4 border-2 border-gray-200 rounded-xl text-left hover:border-${option.color}-500 hover:bg-${option.color}-50/50 transition-all ${loading ? 'opacity-50' : ''}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-10 h-10 bg-${option.color}-100 rounded-lg flex items-center justify-center text-${option.color}-600 mb-3`}>
                      {option.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{option.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{option.description}</p>
                  </motion.button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 mt-6 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>Setting up your dashboard...</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomeFallback />}>
      <WelcomeContent />
    </Suspense>
  );
}
