"use client";

import { useSubscription } from '@/context/SubscriptionContext';
import {
  getEffectiveTier,
  hasFeature,
  getLimit,
  isWithinLimit,
  TIER_LIMITS,
  TIER_FEATURES,
  FEATURE_DESCRIPTIONS,
  isTierAtLeast,
  getRequiredTierForFeature
} from '@/config/tierConfig';

/**
 * Hook to check feature access based on subscription tier
 * @returns {Object} Feature access methods and subscription info
 */
export function useFeatureAccess() {
  const { subscription, loading, isTrialActive, isSubscriptionActive } = useSubscription();

  // Get the effective tier based on subscription status and plan
  const getEffectivePlan = () => {
    if (loading) return 'basic';

    // If subscription is active, use the plan
    if (subscription.status === 'active' && subscription.plan) {
      return subscription.plan.toLowerCase();
    }

    // If trial is active, treat as basic
    if (subscription.status === 'trialing' && isTrialActive()) {
      return 'basic';
    }

    // Default to basic for other states
    return 'basic';
  };

  const currentTier = getEffectivePlan();

  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature name from tierConfig
   * @returns {boolean}
   */
  const canAccess = (feature) => {
    if (loading) return false;

    // Check if subscription is valid (active or in trial)
    const hasValidSubscription = isSubscriptionActive() || isTrialActive();
    if (!hasValidSubscription) return false;

    return hasFeature(currentTier, feature);
  };

  /**
   * Check if user is within a specific limit
   * @param {string} limitName - Limit name (trucks, drivers, loadsPerMonth, etc.)
   * @param {number} currentCount - Current count to check against
   * @returns {boolean}
   */
  const isWithinResourceLimit = (limitName, currentCount) => {
    if (loading) return false;
    return isWithinLimit(currentTier, limitName, currentCount);
  };

  /**
   * Get the limit value for a resource
   * @param {string} limitName - Limit name
   * @returns {number}
   */
  const getResourceLimit = (limitName) => {
    return getLimit(currentTier, limitName);
  };

  /**
   * Get remaining count for a limited resource
   * @param {string} limitName - Limit name
   * @param {number} currentCount - Current count
   * @returns {number} Remaining count (Infinity if unlimited)
   */
  const getRemainingCount = (limitName, currentCount) => {
    const limit = getLimit(currentTier, limitName);
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - currentCount);
  };

  /**
   * Check if an upgrade is required for a feature
   * @param {string} feature - Feature name
   * @returns {Object} { required: boolean, currentTier: string, requiredTier: string }
   */
  const getUpgradeRequirement = (feature) => {
    const canAccessFeature = canAccess(feature);
    const requiredTier = getRequiredTierForFeature(feature);

    return {
      required: !canAccessFeature,
      currentTier,
      requiredTier,
      featureInfo: FEATURE_DESCRIPTIONS[feature] || null
    };
  };

  /**
   * Check if current tier is at least the specified tier
   * @param {string} requiredTier - Required tier name
   * @returns {boolean}
   */
  const hasTierAccess = (requiredTier) => {
    return isTierAtLeast(currentTier, requiredTier);
  };

  /**
   * Get all limits for current tier
   * @returns {Object}
   */
  const getCurrentLimits = () => {
    return TIER_LIMITS[currentTier] || TIER_LIMITS.basic;
  };

  /**
   * Get all features for current tier
   * @returns {Object}
   */
  const getCurrentFeatures = () => {
    return TIER_FEATURES[currentTier] || TIER_FEATURES.basic;
  };

  /**
   * Check if user needs to upgrade to add more of a resource
   * @param {string} limitName - Limit name
   * @param {number} currentCount - Current count
   * @returns {Object} { needsUpgrade: boolean, limit: number, currentCount: number, nextTier: string }
   */
  const checkResourceUpgrade = (limitName, currentCount) => {
    const limit = getLimit(currentTier, limitName);
    const needsUpgrade = limit !== Infinity && currentCount >= limit;

    // Determine next tier
    let nextTier = null;
    if (currentTier === 'basic') nextTier = 'premium';
    else if (currentTier === 'premium') nextTier = 'fleet';
    else if (currentTier === 'fleet') nextTier = 'enterprise';

    return {
      needsUpgrade,
      limit,
      currentCount,
      nextTier,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - currentCount)
    };
  };

  return {
    // Current state
    currentTier,
    loading,
    subscription,
    isTrialActive: isTrialActive(),
    isSubscriptionActive: isSubscriptionActive(),

    // Feature access
    canAccess,
    hasTierAccess,
    getUpgradeRequirement,

    // Resource limits
    isWithinResourceLimit,
    getResourceLimit,
    getRemainingCount,
    checkResourceUpgrade,

    // Get all config
    getCurrentLimits,
    getCurrentFeatures,

    // Raw config access
    TIER_LIMITS,
    TIER_FEATURES,
    FEATURE_DESCRIPTIONS
  };
}

export default useFeatureAccess;
