"use client";

import { useState } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt, UpgradeModal, LimitReachedPrompt } from './UpgradePrompt';

/**
 * FeatureGate - Wraps components to enforce tier-based access
 *
 * @param {string} feature - Feature key from tierConfig (e.g., 'compliance', 'iftaCalculator')
 * @param {React.ReactNode} children - Content to render if user has access
 * @param {string} fallback - What to show if no access: 'prompt' | 'modal' | 'hide' | 'blur'
 * @param {React.ReactNode} customFallback - Custom component to show instead of default prompt
 */
export function FeatureGate({
  feature,
  children,
  fallback = 'prompt',
  customFallback = null,
  className = ''
}) {
  const { canAccess, currentTier, loading } = useFeatureAccess();
  const [showModal, setShowModal] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg h-32 ${className}`} />
    );
  }

  // Check access
  const hasAccess = canAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle different fallback types
  if (customFallback) {
    return <>{customFallback}</>;
  }

  switch (fallback) {
    case 'hide':
      return null;

    case 'blur':
      return (
        <div className={`relative ${className}`}>
          <div className="blur-sm pointer-events-none select-none opacity-50">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <UpgradePrompt feature={feature} currentTier={currentTier} />
          </div>
        </div>
      );

    case 'modal':
      return (
        <div
          className={`cursor-pointer ${className}`}
          onClick={() => setShowModal(true)}
        >
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
          <UpgradeModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            feature={feature}
            currentTier={currentTier}
          />
        </div>
      );

    case 'banner':
      return (
        <div className={className}>
          <UpgradePrompt feature={feature} currentTier={currentTier} variant="banner" />
        </div>
      );

    case 'prompt':
    default:
      return (
        <div className={className}>
          <UpgradePrompt feature={feature} currentTier={currentTier} />
        </div>
      );
  }
}

/**
 * ResourceLimitGate - Enforces resource limits (trucks, invoices, etc.)
 *
 * @param {string} limitName - Limit key from tierConfig (e.g., 'trucks', 'loadsPerMonth')
 * @param {number} currentCount - Current count of the resource
 * @param {React.ReactNode} children - Content to render (usually an "Add" button)
 * @param {string} resourceName - Human-readable name for the resource
 * @param {string} fallback - What to show if limit reached: 'prompt' | 'disable' | 'hide'
 */
export function ResourceLimitGate({
  limitName,
  currentCount,
  children,
  resourceName = 'items',
  fallback = 'prompt',
  className = ''
}) {
  const { checkResourceUpgrade, loading } = useFeatureAccess();

  // Show loading state instead of allowing action during load
  if (loading) {
    return (
      <div className={`opacity-50 pointer-events-none ${className}`}>
        {children}
      </div>
    );
  }

  const { needsUpgrade, limit, nextTier, remaining } = checkResourceUpgrade(limitName, currentCount);

  if (!needsUpgrade) {
    return <>{children}</>;
  }

  switch (fallback) {
    case 'hide':
      return null;

    case 'disable':
      return (
        <div className={`opacity-50 pointer-events-none ${className}`} title={`${resourceName} limit reached`}>
          {children}
        </div>
      );

    case 'prompt':
    default:
      return (
        <LimitReachedPrompt
          limitName={limitName}
          currentCount={currentCount}
          limit={limit}
          nextTier={nextTier}
          resourceName={resourceName}
          className={className}
        />
      );
  }
}

/**
 * TierGate - Simple tier check (requires at least specified tier)
 */
export function TierGate({
  requiredTier,
  children,
  fallback = 'prompt',
  feature = null,
  className = ''
}) {
  const { hasTierAccess, currentTier, loading } = useFeatureAccess();

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg h-32 ${className}`} />
    );
  }

  if (hasTierAccess(requiredTier)) {
    return <>{children}</>;
  }

  if (fallback === 'hide') {
    return null;
  }

  return (
    <div className={className}>
      <UpgradePrompt feature={feature} currentTier={currentTier} />
    </div>
  );
}

/**
 * Hook-style gate check for use in event handlers
 * Returns a function that either executes the action or shows upgrade modal
 *
 * IMPORTANT: The action will ONLY execute if user has access.
 * If no access, only the modal is shown - the action is NOT executed.
 */
export function useGatedAction(feature) {
  const { canAccess, currentTier, loading } = useFeatureAccess();
  const [showModal, setShowModal] = useState(false);

  const executeOrPrompt = (action) => {
    // Don't execute anything while loading - wait for subscription check
    if (loading) {
      return false;
    }

    if (canAccess(feature)) {
      action();
      return true;
    } else {
      // Only show modal, do NOT execute the action
      setShowModal(true);
      return false;
    }
  };

  const Modal = () => (
    <UpgradeModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      feature={feature}
      currentTier={currentTier}
    />
  );

  // During loading, hasAccess is false to prevent premature access
  return { executeOrPrompt, Modal, hasAccess: loading ? false : canAccess(feature), loading };
}

/**
 * UsageIndicator - Shows current usage vs limit
 */
export function UsageIndicator({
  limitName,
  currentCount,
  resourceName = 'items',
  showBar = true,
  className = ''
}) {
  const { getResourceLimit, currentTier } = useFeatureAccess();
  const limit = getResourceLimit(limitName);

  const isUnlimited = limit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min(100, (currentCount / limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && currentCount >= limit;

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-600">{resourceName}</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
          {currentCount} {isUnlimited ? '' : `/ ${limit}`}
          {isUnlimited && <span className="text-gray-400 ml-1">(unlimited)</span>}
        </span>
      </div>
      {showBar && !isUnlimited && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default FeatureGate;
