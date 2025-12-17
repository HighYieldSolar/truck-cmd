"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Lightbulb, ChevronRight, ChevronLeft, CheckCircle2,
  Sparkles, BookOpen, ArrowRight
} from "lucide-react";

/**
 * TutorialCard - A dismissible tutorial popup for onboarding new users
 *
 * @param {string} pageId - Unique identifier for this page's tutorial (e.g., 'dispatching', 'customers')
 * @param {string} title - Main title of the tutorial
 * @param {string} description - Brief description of what the page does
 * @param {Array} features - Array of feature objects: { icon: LucideIcon, title: string, description: string }
 * @param {Array} tips - Array of pro tip strings
 * @param {string} accentColor - Tailwind color class (e.g., 'blue', 'green', 'purple')
 * @param {string} userId - Current user's ID
 */
export default function TutorialCard({
  pageId,
  title,
  description,
  features = [],
  tips = [],
  accentColor = "blue",
  userId
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Color mappings for different accent colors
  const colorClasses = {
    blue: {
      gradient: "from-blue-600 to-blue-700",
      light: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      dot: "bg-blue-600",
      dotInactive: "bg-blue-200 dark:bg-blue-800"
    },
    green: {
      gradient: "from-green-600 to-green-700",
      light: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-600 dark:text-green-400",
      button: "bg-green-600 hover:bg-green-700",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      dot: "bg-green-600",
      dotInactive: "bg-green-200 dark:bg-green-800"
    },
    purple: {
      gradient: "from-purple-600 to-purple-700",
      light: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-800",
      text: "text-purple-600 dark:text-purple-400",
      button: "bg-purple-600 hover:bg-purple-700",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      dot: "bg-purple-600",
      dotInactive: "bg-purple-200 dark:bg-purple-800"
    },
    orange: {
      gradient: "from-orange-600 to-orange-700",
      light: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-600 dark:text-orange-400",
      button: "bg-orange-600 hover:bg-orange-700",
      iconBg: "bg-orange-100 dark:bg-orange-900/50",
      dot: "bg-orange-600",
      dotInactive: "bg-orange-200 dark:bg-orange-800"
    },
    indigo: {
      gradient: "from-indigo-600 to-indigo-700",
      light: "bg-indigo-50 dark:bg-indigo-900/20",
      border: "border-indigo-200 dark:border-indigo-800",
      text: "text-indigo-600 dark:text-indigo-400",
      button: "bg-indigo-600 hover:bg-indigo-700",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
      dot: "bg-indigo-600",
      dotInactive: "bg-indigo-200 dark:bg-indigo-800"
    },
    rose: {
      gradient: "from-rose-600 to-rose-700",
      light: "bg-rose-50 dark:bg-rose-900/20",
      border: "border-rose-200 dark:border-rose-800",
      text: "text-rose-600 dark:text-rose-400",
      button: "bg-rose-600 hover:bg-rose-700",
      iconBg: "bg-rose-100 dark:bg-rose-900/50",
      dot: "bg-rose-600",
      dotInactive: "bg-rose-200 dark:bg-rose-800"
    },
    teal: {
      gradient: "from-teal-600 to-teal-700",
      light: "bg-teal-50 dark:bg-teal-900/20",
      border: "border-teal-200 dark:border-teal-800",
      text: "text-teal-600 dark:text-teal-400",
      button: "bg-teal-600 hover:bg-teal-700",
      iconBg: "bg-teal-100 dark:bg-teal-900/50",
      dot: "bg-teal-600",
      dotInactive: "bg-teal-200 dark:bg-teal-800"
    },
    amber: {
      gradient: "from-amber-600 to-amber-700",
      light: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-600 dark:text-amber-400",
      button: "bg-amber-600 hover:bg-amber-700",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      dot: "bg-amber-600",
      dotInactive: "bg-amber-200 dark:bg-amber-800"
    }
  };

  const colors = colorClasses[accentColor] || colorClasses.blue;

  // Calculate total steps based on content available
  // Step 0: Features (if exists), Step 1: Tips (if exists)
  const hasFeatures = features.length > 0;
  const hasTips = tips.length > 0;
  const totalSteps = (hasFeatures ? 1 : 0) + (hasTips ? 1 : 0);

  // Get the content type for current step
  const getStepContent = () => {
    if (hasFeatures && hasTips) {
      return currentStep === 0 ? 'features' : 'tips';
    } else if (hasFeatures) {
      return 'features';
    } else if (hasTips) {
      return 'tips';
    }
    return null;
  };

  const stepContent = getStepContent();

  // Check if tutorial has been dismissed
  useEffect(() => {
    if (!userId || !pageId) {
      setIsLoading(false);
      return;
    }

    const checkDismissed = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('dismissed_tutorials')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking tutorial status:', error);
          setIsLoading(false);
          return;
        }

        const dismissedTutorials = data?.dismissed_tutorials || [];

        // Show tutorial if not dismissed
        if (!dismissedTutorials.includes(pageId)) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkDismissed();
  }, [userId, pageId]);

  // Dismiss tutorial permanently
  const handleDismiss = async () => {
    setIsAnimatingOut(true);

    // Wait for animation
    setTimeout(async () => {
      setIsVisible(false);

      if (!userId || !pageId) return;

      try {
        // Get current dismissed tutorials
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('dismissed_tutorials')
          .eq('id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching dismissed tutorials:', fetchError);
          return;
        }

        const currentDismissed = data?.dismissed_tutorials || [];

        // Add this tutorial to dismissed list
        if (!currentDismissed.includes(pageId)) {
          const updatedDismissed = [...currentDismissed, pageId];

          const { error: updateError } = await supabase
            .from('users')
            .update({
              dismissed_tutorials: updatedDismissed,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Error dismissing tutorial:', updateError);
          }
        }
      } catch (error) {
        console.error('Error dismissing tutorial:', error);
      }
    }, 300);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Don't render if loading or not visible
  if (isLoading || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={isAnimatingOut
            ? { opacity: 0, y: -20, scale: 0.95 }
            : { opacity: 1, y: 0, scale: 1 }
          }
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`mb-6 rounded-xl shadow-lg border overflow-hidden ${colors.border} bg-white dark:bg-gray-800`}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${colors.gradient} px-5 py-4 relative`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white/90 font-medium">
                      Quick Guide
                    </span>
                  </div>
                  <p className="text-white/80 text-sm mt-0.5">{description}</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                aria-label="Dismiss tutorial"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* Features Overview */}
              {stepContent === 'features' && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className={`w-4 h-4 ${colors.text}`} />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Key Features</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {features.map((feature, index) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg ${colors.light} ${colors.border} border`}
                        >
                          <div className={`w-8 h-8 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <FeatureIcon className={`w-4 h-4 ${colors.text}`} />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {feature.title}
                            </h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Pro Tips */}
              {stepContent === 'tips' && (
                <motion.div
                  key="tips"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className={`w-4 h-4 ${colors.text}`} />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Pro Tips</h4>
                  </div>
                  <ul className="space-y-2">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${colors.text} mt-0.5 flex-shrink-0`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              {/* Step Indicators */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? `${colors.dot} w-6`
                        : `${colors.dotInactive} hover:opacity-80`
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className={`flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-colors ${colors.button}`}
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      Got it!
                      <CheckCircle2 size={16} />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
