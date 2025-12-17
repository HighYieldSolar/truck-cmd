"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  CheckCircle, X, Truck, DollarSign,
  FileText, Fuel, Calculator, Shield,
  Bell, Sparkles, Rocket,
  ArrowRight, Mail
} from "lucide-react";
import { motion } from "framer-motion";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('launch_waitlist')
        .insert([{
          email: email.toLowerCase().trim(),
          name: name.trim() || null,
          source: 'signup_page'
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate email
          setError("You're already on the waitlist! We'll notify you when we launch.");
          setLoading(false);
          return;
        }
        throw insertError;
      }

      setSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <Truck size={20} />, title: "Load Tracking", desc: "Track all your loads in one place" },
    { icon: <Calculator size={20} />, title: "IFTA Reports", desc: "Automatic fuel tax calculations" },
    { icon: <FileText size={20} />, title: "Invoicing", desc: "Professional invoices in seconds" },
    { icon: <DollarSign size={20} />, title: "Expenses", desc: "Track every business expense" },
    { icon: <Fuel size={20} />, title: "Fuel Tracking", desc: "Monitor fuel costs per mile" },
    { icon: <Shield size={20} />, title: "Compliance", desc: "Stay DOT compliant easily" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/TC.png"
              alt="Truck Command"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-xl">Truck Command</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-4xl w-full text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 mb-8"
            >
              <Rocket size={16} className="text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Launching January 1st, 2026</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              The Ultimate{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Trucking Management
              </span>{" "}
              Platform
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-blue-200/80 mb-10 max-w-2xl mx-auto"
            >
              Built by truckers, for truckers. Simplify your business with load tracking,
              IFTA calculations, invoicing, and more — all in one powerful platform.
            </motion.p>

            {/* Email Signup Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-lg mx-auto mb-12 mt-4"
            >
              {success ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                  <p className="text-blue-200/80">
                    We'll send you an email when Truck Command launches on January 1st, 2026.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Bell size={20} className="text-yellow-400" />
                    <h3 className="text-xl font-semibold text-white">Get Notified at Launch</h3>
                  </div>
                  <p className="text-blue-200/70 text-sm mb-6">
                    Be the first to know when we go live. Join our waitlist for exclusive early access.
                  </p>

                  {error && (
                    <div className="bg-red-500/20 border border-red-400/30 text-red-300 px-4 py-3 rounded-lg mb-4 flex items-start text-sm">
                      <X size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        loading || !email
                          ? 'bg-blue-600/50 text-blue-200/50 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Joining Waitlist...
                        </>
                      ) : (
                        <>
                          <Mail size={18} />
                          Join the Waitlist
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-blue-200/50 text-xs mt-4">
                    No spam, ever. We'll only email you when we launch.
                  </p>
                </>
              )}
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-blue-300/70 text-sm mb-6 flex items-center justify-center gap-2">
                <Sparkles size={16} />
                What you'll get access to
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (0.1 * i) }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-3 mx-auto">
                      {feature.icon}
                    </div>
                    <h4 className="text-white font-medium text-sm mb-1">{feature.title}</h4>
                    <p className="text-blue-200/60 text-xs">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          <p className="text-blue-200/50 text-sm mb-2">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Log in
            </Link>
          </p>
          <p className="text-blue-200/30 text-xs">
            &copy; {new Date().getFullYear()} Truck Command. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
