"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Truck, FileText, DollarSign, CheckCircle, X, Sparkles } from "lucide-react";
import Confetti from "@/components/shared/Confetti";

// Celebration configurations for different achievements
const CELEBRATIONS = {
  first_load: {
    icon: <Truck size={32} />,
    iconBg: 'bg-blue-500',
    title: "First Load Dispatched!",
    message: "You just tracked your first load. You're officially rolling!",
    emoji: "🚛",
    confetti: true,
    sound: true
  },
  first_invoice: {
    icon: <FileText size={32} />,
    iconBg: 'bg-green-500',
    title: "Invoice Created!",
    message: "That's money on its way to your bank. Professional invoicing unlocked!",
    emoji: "💰",
    confetti: true,
    sound: true
  },
  first_truck: {
    icon: <Truck size={32} />,
    iconBg: 'bg-indigo-500',
    title: "Truck Added!",
    message: "Fleet tracking is now active. You can track mileage, fuel, and maintenance.",
    emoji: "📍",
    confetti: false,
    sound: true
  },
  first_expense: {
    icon: <DollarSign size={32} />,
    iconBg: 'bg-orange-500',
    title: "Expense Logged!",
    message: "Great! Tracking expenses helps you understand your true profitability.",
    emoji: "📊",
    confetti: false,
    sound: true
  },
  profile_complete: {
    icon: <CheckCircle size={32} />,
    iconBg: 'bg-purple-500',
    title: "Profile Complete!",
    message: "Your invoices will now show your professional business details.",
    emoji: "✨",
    confetti: false,
    sound: true
  },
  checklist_complete: {
    icon: <Trophy size={32} />,
    iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    title: "Setup Complete!",
    message: "You've mastered the basics. You're ready to run your trucking business like a pro!",
    emoji: "🏆",
    confetti: true,
    sound: true
  },
  time_saved: {
    icon: <Sparkles size={32} />,
    iconBg: 'bg-cyan-500',
    title: "Time Saved!",
    message: null, // Dynamic message
    emoji: "⚡",
    confetti: false,
    sound: true
  }
};

export default function CelebrationModal({
  type,
  isOpen,
  onClose,
  customMessage,
  autoCloseDelay = 5000
}) {
  const [showConfetti, setShowConfetti] = useState(false);

  const celebration = CELEBRATIONS[type] || CELEBRATIONS.first_load;

  useEffect(() => {
    if (isOpen && celebration.confetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, celebration.confetti]);

  useEffect(() => {
    if (isOpen && autoCloseDelay) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showConfetti && <Confetti />}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className={`${celebration.iconBg} p-6 text-center relative overflow-hidden`}>
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white rounded-full" />
                  <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white rounded-full" />
                </div>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
                  className="relative inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4"
                >
                  <span className="text-white">{celebration.icon}</span>
                </motion.div>

                {/* Emoji burst */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl mb-2"
                >
                  {celebration.emoji}
                </motion.div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-gray-900 mb-2"
                >
                  {celebration.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600"
                >
                  {customMessage || celebration.message}
                </motion.p>

                {/* Action button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={onClose}
                  className="mt-6 w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition"
                >
                  Keep Going!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage celebrations
export function useCelebration() {
  const [celebration, setCelebration] = useState({ type: null, isOpen: false, message: null });

  const celebrate = (type, customMessage = null) => {
    setCelebration({ type, isOpen: true, message: customMessage });
  };

  const closeCelebration = () => {
    setCelebration({ type: null, isOpen: false, message: null });
  };

  return {
    celebration,
    celebrate,
    closeCelebration,
    CelebrationModalProps: {
      type: celebration.type,
      isOpen: celebration.isOpen,
      customMessage: celebration.message,
      onClose: closeCelebration
    }
  };
}
