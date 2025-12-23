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
import { useTranslation } from "@/context/LanguageContext";

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
  const { t } = useTranslation('billing');
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = featureInfo?.requiredTier || 'premium';
  const tierInfo = TIER_LIMITS[requiredTier];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        <LockClosedIcon className="w-4 h-4" />
        <span>
          {t('upgradePrompt.requires', { plan: tierInfo?.name || 'Premium' })}{' '}
          <Link href="/dashboard/upgrade" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t('upgradePrompt.upgrade')}
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
              <p className="font-medium">{featureInfo?.name || t('upgradePrompt.premiumFeature')}</p>
              <p className="text-sm text-blue-100">{featureInfo?.description}</p>
            </div>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            {t('upgradePrompt.upgradeTo', { plan: tierInfo?.name })}
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
            {featureInfo?.name || t('upgradePrompt.premiumFeature')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {featureInfo?.description || t('upgradePrompt.defaultDescription')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/upgrade"
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              {t('upgradePrompt.upgradeTo', { plan: tierInfo?.name })}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('upgradePrompt.startingAt', { price: tierInfo?.price?.monthly })}
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
  const { t } = useTranslation('billing');

  if (!isOpen) return null;

  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = featureInfo?.requiredTier || 'premium';
  const tierInfo = TIER_LIMITS[requiredTier];

  // Get features for the required tier using translations
  const getTierFeatures = (tier) => {
    const featureKeys = {
      premium: ['trucks', 'unlimited', 'compliance', 'ifta', 'mileage', 'email', 'pdf'],
      fleet: ['trucks', 'reports', 'maintenance', 'sms', 'quiet', 'exports', 'support'],
      enterprise: ['unlimited', 'manager', 'integrations', 'api', 'sla', 'reports']
    };

    return (featureKeys[tier] || []).map(key =>
      t(`upgradePrompt.tierFeatures.${tier}.${key}`)
    );
  };

  const tierFeatures = getTierFeatures(requiredTier);

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
            aria-label="Close"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8" />
            <h2 className="text-xl font-bold">{t('upgradePrompt.upgradeRequired')}</h2>
          </div>
          <p className="text-blue-100 dark:text-blue-200">
            {featureInfo?.name || t('upgradePrompt.premiumFeature')} {t('upgradePrompt.requiresPlan', { plan: tierInfo?.name })}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {featureInfo?.description || t('upgradePrompt.unlockFeature')}
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('upgradePrompt.planIncludes', { plan: tierInfo?.name })}
            </h4>
            <ul className="space-y-2">
              {tierFeatures.slice(0, 5).map((featureText, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckIcon className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  {featureText}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard/upgrade"
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-center"
            >
              {t('upgradePrompt.upgradeWithPrice', { plan: tierInfo?.name, price: tierInfo?.price?.monthly })}
            </Link>
            <button
              onClick={onClose}
              className="w-full text-gray-600 dark:text-gray-400 py-2 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {t('upgradePrompt.maybeLater')}
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
  const { t } = useTranslation('billing');
  const tierInfo = TIER_LIMITS[nextTier];

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
          <LockClosedIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
            {t('upgradePrompt.limitReached', { resource: resourceName })}
          </h4>
          <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
            {t('upgradePrompt.usedLimit', { current: currentCount, limit: limit, resource: resourceName.toLowerCase() })}
            {nextTier && ` ${t('upgradePrompt.upgradeForMore', { plan: tierInfo?.name })}`}
          </p>
          {nextTier && nextTier !== 'enterprise' && (
            <Link
              href="/dashboard/upgrade"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
            >
              {t('upgradePrompt.upgradeTo', { plan: tierInfo?.name })}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
          {nextTier === 'enterprise' && (
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
            >
              {t('upgradePrompt.contactSales')}
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
