"use client";

import { useState } from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import Link from "next/link";
import {
  X,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  ArrowDown,
  Gift,
  CheckCircle,
  ChevronRight,
  Zap,
  PauseCircle,
  Clock
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function CancellationModal({ isOpen, onClose, onConfirm, endDate }) {
  const { t } = useTranslation('billing');
  const { subscription } = useSubscription();
  const [step, setStep] = useState(1); // 1: reason, 2: offer, 3: confirm
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [pauseMonths, setPauseMonths] = useState(1);
  const [pausing, setPausing] = useState(false);
  const [pauseSuccess, setPauseSuccess] = useState(false);
  const [pauseError, setPauseError] = useState(null);

  const cancellationReasons = [
    { value: "too_expensive", label: t('cancellation.tooExpensive'), offer: "none" },
    { value: "not_using", label: t('cancellation.notUsing'), offer: "pause" },
    { value: "missing_features", label: t('cancellation.missingFeatures'), offer: "feedback" },
    { value: "found_alternative", label: t('cancellation.foundAlternative'), offer: "feedback" },
    { value: "technical_issues", label: t('cancellation.technicalIssues'), offer: "support" },
    { value: "temporary", label: t('cancellation.temporary'), offer: "pause" },
    { value: "other", label: t('cancellation.other'), offer: "none" }
  ];

  const currentPlan = subscription?.plan || 'basic';
  const canDowngrade = currentPlan !== 'basic';

  const handleReasonSelect = (selectedReason) => {
    setReason(selectedReason);
    // Move to offer step if there's a relevant offer
    const reasonData = cancellationReasons.find(r => r.value === selectedReason);
    if (reasonData && reasonData.offer !== 'none') {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleApplyCoupon = async () => {
    setApplyingCoupon(true);
    setCouponError(null);

    try {
      const response = await fetch('/api/apply-retention-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: subscription?.userId
        })
      });

      const result = await response.json();

      if (result.success) {
        setCouponApplied(true);
        // Close modal after short delay to show success
        setTimeout(() => {
          resetAndClose();
        }, 2000);
      } else {
        setCouponError(result.error || t('messages.failedToUpdate'));
      }
    } catch (error) {
      setCouponError(t('messages.failedToUpdate'));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePauseSubscription = async () => {
    setPausing(true);
    setPauseError(null);

    try {
      const response = await fetch('/api/pause-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: subscription?.userId,
          pauseMonths
        })
      });

      const result = await response.json();

      if (result.success) {
        setPauseSuccess(true);
        // Close modal after short delay to show success
        setTimeout(() => {
          resetAndClose();
          // Refresh the page to update subscription status
          window.location.reload();
        }, 2500);
      } else {
        setPauseError(result.error || t('messages.failedToUpdate'));
      }
    } catch (error) {
      setPauseError(t('messages.failedToUpdate'));
    } finally {
      setPausing(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);

    await onConfirm({
      reason: cancellationReasons.find(r => r.value === reason)?.label || reason,
      feedback
    });

    resetAndClose();
    setLoading(false);
  };

  const resetAndClose = () => {
    setStep(1);
    setReason("");
    setFeedback("");
    setCouponApplied(false);
    setCouponError(null);
    setPauseMonths(1);
    setPauseSuccess(false);
    setPauseError(null);
    onClose();
  };

  const getOfferContent = () => {
    const reasonData = cancellationReasons.find(r => r.value === reason);

    switch (reasonData?.offer) {
      case 'discount':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                    {t('cancellation.hateToSeeYouGo')}
                  </h4>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    {t('cancellation.discountOffer')}
                  </p>
                </div>
              </div>
            </div>

            {couponApplied ? (
              <div className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  {t('cancellation.discountApplied')}
                </span>
              </div>
            ) : (
              <>
                {couponError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {applyingCoupon ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        {t('cancellation.applying')}
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} className="mr-2" />
                        {t('cancellation.applyDiscount')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancellation.noThanks')}
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'downgrade':
        return (
          <div className="space-y-4">
            {canDowngrade ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ArrowDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        {t('cancellation.considerDowngrade')}
                      </h4>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        {t('cancellation.keepEssentialFeatures')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/dashboard/upgrade"
                    onClick={resetAndClose}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Zap size={16} className="mr-2" />
                    {t('cancellation.viewLowerPlans')}
                  </Link>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancellation.noThanks')}
                  </button>
                </div>
              </>
            ) : (
              // Already on Basic - skip to confirmation
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('cancellation.alreadyLowestPlan')}
                </p>
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {t('cancellation.continueToCancellation')}
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            )}
          </div>
        );

      case 'support':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                    {t('cancellation.hereToHelp')}
                  </h4>
                  <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                    {t('cancellation.technicalIssuesHelp')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                onClick={resetAndClose}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
              >
                {t('cancellation.contactSupport')}
              </Link>
              <button
                onClick={() => setStep(3)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cancellation.noThanks')}
              </button>
            </div>
          </div>
        );

      case 'feedback':
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('cancellation.constantlyImproving')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cancellation.whatFeaturesWouldMakeYouStay')}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
                placeholder={t('cancellation.tellUsWhatYouNeed')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors"
              />
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('cancellation.continue')}
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        );

      case 'pause':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <PauseCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                    {t('cancellation.needBreak')}
                  </h4>
                  <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                    {t('cancellation.pauseDescription')}
                  </p>
                </div>
              </div>
            </div>

            {pauseSuccess ? (
              <div className="flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                <span className="text-indigo-800 dark:text-indigo-200 font-medium">
                  {t('cancellation.subscriptionPaused')}
                </span>
              </div>
            ) : (
              <>
                {/* Pause duration selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cancellation.howLongNeed')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((months) => (
                      <button
                        key={months}
                        onClick={() => setPauseMonths(months)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          pauseMonths === months
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                      >
                        {months} {months === 1 ? t('cancellation.month') : t('cancellation.months')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resume date preview */}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={14} className="mr-2" />
                  {t('cancellation.billingResumes')} {new Date(Date.now() + pauseMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                {pauseError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{pauseError}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handlePauseSubscription}
                    disabled={pausing}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {pausing ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        {t('cancellation.pausing')}
                      </>
                    ) : (
                      <>
                        <PauseCircle size={16} className="mr-2" />
                        {t('cancellation.pauseFor', { count: pauseMonths, unit: pauseMonths === 1 ? t('cancellation.month') : t('cancellation.months') })}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancellation.noThanksCancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {step === 1 && t('cancellation.whyLeaving')}
              {step === 2 && t('cancellation.beforeYouGo')}
              {step === 3 && t('cancellation.confirmCancellation')}
            </h3>
            <button
              onClick={resetAndClose}
              aria-label="Close"
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Reason Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('cancellation.helpUsUnderstand')}
              </p>
              {cancellationReasons.map((reasonOption) => (
                <button
                  key={reasonOption.value}
                  onClick={() => handleReasonSelect(reasonOption.value)}
                  className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                >
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {reasonOption.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Retention Offer */}
          {step === 2 && getOfferContent()}

          {/* Step 3: Final Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Warning message */}
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium">{t('cancellation.areYouSure')}</p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      {t('cancellation.subscriptionActiveUntil', { date: endDate })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional feedback if not already provided */}
              {!feedback && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cancellation.anyFinalFeedback')}
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
                    placeholder={t('cancellation.tellUsMore')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      {t('cancellation.canceling')}
                    </>
                  ) : (
                    t('cancellation.yesCancelSubscription')
                  )}
                </button>
                <button
                  onClick={resetAndClose}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('cancellation.keepMySubscription')}
                </button>
              </div>

              {/* Back button */}
              <button
                onClick={() => setStep(step - 1)}
                className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('cancellation.goBack')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
