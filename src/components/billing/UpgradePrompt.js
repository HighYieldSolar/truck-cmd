"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  LockClosedIcon,
  SparklesIcon,
  ArrowRightIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { TIER_LIMITS, FEATURE_DESCRIPTIONS } from '@/config/tierConfig';

/**
 * Inline upgrade prompt for locked features
 */
export function UpgradePrompt({
  feature,
  currentTier = 'basic',
  variant = 'default', // 'default', 'compact', 'banner', 'modal'
  onClose,
  className = ''
}) {
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = featureInfo?.requiredTier || 'premium';
  const tierInfo = TIER_LIMITS[requiredTier];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        <LockClosedIcon className="w-4 h-4" />
        <span>
          Requires {tierInfo?.name || 'Premium'} plan.{' '}
          <Link href="/dashboard/billing" className="text-blue-600 dark:text-blue-400 hover:underline">
            Upgrade
          </Link>
        </span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6" />
            <div>
              <p className="font-medium">{featureInfo?.name || 'Premium Feature'}</p>
              <p className="text-sm text-blue-100">{featureInfo?.description}</p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            Upgrade to {tierInfo?.name}
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <LockClosedIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {featureInfo?.name || 'Premium Feature'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {featureInfo?.description || 'This feature requires an upgraded subscription.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/billing"
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              Upgrade to {tierInfo?.name}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Starting at ${tierInfo?.price?.monthly}/mo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal upgrade prompt for feature gates
 */
export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  currentTier = 'basic'
}) {
  if (!isOpen) return null;

  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = featureInfo?.requiredTier || 'premium';
  const tierInfo = TIER_LIMITS[requiredTier];

  // Get features for the required tier
  const tierFeatures = {
    premium: [
      'Up to 3 trucks and drivers',
      'Unlimited loads and invoices',
      'Compliance tracking',
      'IFTA Calculator',
      'State Mileage Tracker',
      'Email notifications',
      'PDF exports'
    ],
    fleet: [
      'Up to 12 trucks and drivers',
      'Advanced fleet reports',
      'Maintenance scheduling',
      'SMS notifications',
      'Quiet hours',
      'CSV/Excel exports',
      'Priority phone support'
    ],
    enterprise: [
      'Unlimited trucks and drivers',
      'Dedicated account manager',
      'Custom integrations',
      'API access',
      'SLA guarantees',
      'Custom reporting'
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8" />
            <h2 className="text-xl font-bold">Upgrade Required</h2>
          </div>
          <p className="text-blue-100 dark:text-blue-200">
            {featureInfo?.name || 'This feature'} requires the {tierInfo?.name} plan
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {featureInfo?.description || 'Unlock this feature and more by upgrading your subscription.'}
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              {tierInfo?.name} Plan includes:
            </h4>
            <ul className="space-y-2">
              {tierFeatures[requiredTier]?.slice(0, 5).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckIcon className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard/billing"
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-center"
            >
              Upgrade to {tierInfo?.name} - ${tierInfo?.price?.monthly}/mo
            </Link>
            <button
              onClick={onClose}
              className="w-full text-gray-600 dark:text-gray-400 py-2 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Limit reached prompt
 */
export function LimitReachedPrompt({
  limitName,
  currentCount,
  limit,
  nextTier,
  resourceName = 'items',
  className = ''
}) {
  const tierInfo = TIER_LIMITS[nextTier];

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
          <LockClosedIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
            {resourceName} limit reached
          </h4>
          <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
            You've used {currentCount} of {limit} {resourceName.toLowerCase()} on your current plan.
            {nextTier && ` Upgrade to ${tierInfo?.name} for more.`}
          </p>
          {nextTier && nextTier !== 'enterprise' && (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
            >
              Upgrade to {tierInfo?.name}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
          {nextTier === 'enterprise' && (
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
            >
              Contact sales for Enterprise
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Feature badge showing lock status
 */
export function FeatureBadge({ feature, currentTier }) {
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = featureInfo?.requiredTier || 'premium';
  const tierInfo = TIER_LIMITS[requiredTier];

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
      <LockClosedIcon className="w-3 h-3" />
      {tierInfo?.name}
    </span>
  );
}

export default UpgradePrompt;
