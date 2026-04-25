"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  MapPin, Truck, Calculator, Route, FileDown, Play, History,
  Zap, CheckCircle, AlertCircle, RefreshCw, Settings, ArrowRight, Loader2,
  Activity, Info, Download, HelpCircle, ChevronDown, Edit, Eye, X,
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { supabase } from '@/lib/supabaseClient';
import TutorialCard from '@/components/shared/TutorialCard';
import { useTranslation } from '@/context/LanguageContext';

const StateMileageLogger = dynamic(() => import('@/components/drivers/StateMileageLogger'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

// ── Utility helpers ──────────────────────────────────────
function getCurrentQuarter() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

function formatQuarterLabel(q) {
  // "2026-Q2" → "2026 · Q2"
  if (!q) return '';
  return q.replace('-', ' · ');
}

function formatNumber(n) {
  if (n === null || n === undefined) return '0';
  return Math.round(n).toLocaleString();
}

function formatRelativeTime(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return null;
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function prettyProvider(p) {
  if (!p) return null;
  const lower = String(p).toLowerCase();
  if (lower === 'motive') return 'Motive';
  if (lower === 'samsara') return 'Samsara';
  if (lower === 'geotab') return 'Geotab';
  if (lower === 'keeptruckin') return 'KeepTruckin';
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// ── Tab strip ─────────────────────────────────────────────
function TabStrip({ activeTab, onTabChange, eldConnected, eldMiles, manualTripCount, t }) {
  return (
    <div className="flex items-end gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
      <TabButton
        active={activeTab === 'auto'}
        onClick={() => onTabChange('auto')}
        label={t('tabsV2.automated')}
        sub={eldConnected ? t('tabsV2.automatedSubConnected') : t('tabsV2.automatedSubDisconnected')}
        badge={
          eldConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400" />
              {t('tabsV2.badgeLive')}
              {eldMiles > 0 && <span className="ml-0.5 font-mono tabular-nums">· {formatNumber(eldMiles)}</span>}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 h-5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold tracking-wide">
              {t('tabsV2.badgeSetup')}
            </span>
          )
        }
      />
      <TabButton
        active={activeTab === 'manual'}
        onClick={() => onTabChange('manual')}
        label={t('tabsV2.manual')}
        sub={t('tabsV2.manualSub')}
        badge={
          <span className="inline-flex items-center px-2 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-[10px] font-semibold">
            <span className="font-mono tabular-nums">{manualTripCount ?? 0}</span>
            <span className="ml-1">{t('tabsV2.badgeManualSuffix')}</span>
          </span>
        }
      />
    </div>
  );
}

function TabButton({ active, onClick, label, sub, badge }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 sm:px-5 py-3 -mb-px border-b-2 transition-colors flex items-center gap-2.5 whitespace-nowrap ${
        active
          ? 'border-blue-600 dark:border-blue-400'
          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="text-left">
        <div className={`text-sm font-semibold ${active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {label}
        </div>
        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>
      </div>
      {badge}
    </button>
  );
}

// ── ELD Hero Card (connected + has data) ──────────────────
function ELDHeroCard({
  provider, syncedAgo, vehicleCount, stats, quarter,
  onSyncNow, syncingNow, onImport, importing, onPreview, error, success, clearError, clearSuccess, t,
}) {
  return (
    <div className="mb-6 rounded-2xl border border-teal-200 dark:border-teal-800 bg-gradient-to-b from-teal-50 to-white dark:from-teal-900/20 dark:to-gray-800 shadow-sm p-5 sm:p-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
        <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-800 flex items-center justify-center shadow-sm flex-shrink-0">
          <Activity size={22} strokeWidth={2.25} className="text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {provider ? `${provider} ELD` : t('eldHero.cardTitleDefault')}
            </h3>
            {syncedAgo && (
              <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
                {t('eldHero.liveBadge')} · {t('eldHero.syncedAgo', { when: syncedAgo })}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('eldHero.connectedInfo', { vehicles: vehicleCount ?? '—' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSyncNow}
            disabled={syncingNow}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncingNow ? 'animate-spin' : ''} />
            {syncingNow ? t('eldHero.syncing') : t('eldHero.syncNow')}
          </button>
          <Link
            href="/dashboard/settings/eld"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="ELD settings"
          >
            <Settings size={14} />
          </Link>
        </div>
      </div>

      {/* Inline messages */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300 flex-1">{error}</p>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 dark:text-red-400">
            <X size={12} />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2">
          <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-700 dark:text-green-300 flex-1">{success}</p>
          <button onClick={clearSuccess} className="text-green-500 hover:text-green-700 dark:text-green-400">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          primary
          label={t('eldHero.totalMilesLabel')}
          value={formatNumber(stats.totalMiles)}
          sub={t('eldHero.totalMilesSub', { quarter: formatQuarterLabel(quarter) })}
        />
        <StatCard
          label={t('eldHero.jurisdictionsLabel')}
          value={stats.jurisdictionCount ?? 0}
          sub={t('eldHero.jurisdictionsSub')}
        />
        <StatCard
          label={t('eldHero.gpsPointsLabel')}
          value={formatNumber(stats.breadcrumbCount)}
          sub={t('eldHero.gpsPointsSub')}
        />
        <StatCard
          label={t('eldHero.lastSyncLabel')}
          value={syncedAgo || t('eldHero.never')}
          sub={t('eldHero.lastSyncSub')}
          valueSize="small"
        />
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-teal-200 dark:border-teal-800">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Info size={15} className="text-teal-700 dark:text-teal-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700 dark:text-gray-300">
            {t('eldHero.footerInfo', { quarter: formatQuarterLabel(quarter) })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onPreview && (
            <button
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye size={14} />
              {t('eldHero.previewImport')}
            </button>
          )}
          <button
            onClick={onImport}
            disabled={importing || !stats.totalMiles}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 dark:bg-teal-600 dark:hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t('eldHero.importing')}
              </>
            ) : (
              <>
                <Download size={14} strokeWidth={2.25} />
                {t('eldHero.syncWithIfta')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, primary, valueSize = 'default' }) {
  return (
    <div
      className={`relative rounded-xl p-4 flex flex-col gap-1 ${
        primary
          ? 'bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-800 shadow-sm'
          : 'bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div
        className={`font-bold tracking-tight tabular-nums text-gray-900 dark:text-gray-100 leading-tight ${
          valueSize === 'small' ? 'text-lg' : 'text-2xl'
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</div>
    </div>
  );
}

// ── Comparison strip ──────────────────────────────────────
function ComparisonStrip({ eldMiles, manualMiles, variance, varianceTone, onCta, ctaLabel, onViewDetails, t }) {
  const toneClasses = {
    good: 'text-green-700 dark:text-green-400',
    warning: 'text-amber-700 dark:text-amber-400',
    bad: 'text-red-700 dark:text-red-400',
  };
  return (
    <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-4 sm:gap-6">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700">
          <Activity size={15} className="text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('comparison.title')}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">
            {t('comparison.subtitle')}
          </div>
        </div>
      </div>
      <div className="hidden sm:block h-9 w-px bg-gray-200 dark:bg-gray-700" />
      <MiniStat label={t('comparison.eldLabel')} value={formatNumber(eldMiles)} unit="mi" tone="teal" />
      <MiniStat label={t('comparison.manualLabel')} value={formatNumber(manualMiles)} unit="mi" />
      <MiniStat
        label={t('comparison.varianceLabel')}
        value={variance != null ? `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%` : '—'}
        toneClass={toneClasses[varianceTone] || ''}
      />
      <div className="flex-1" />
      <div className="flex items-center gap-2 ml-auto">
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="inline-flex items-center h-8 px-2.5 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {t('comparison.viewDetails')}
          </button>
        )}
        <button
          onClick={onCta}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Download size={12} strokeWidth={2.25} />
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value, unit, tone = 'neutral', toneClass }) {
  const valueColor =
    toneClass ||
    (tone === 'teal'
      ? 'text-teal-700 dark:text-teal-400'
      : 'text-gray-900 dark:text-gray-100');
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </div>
      <div className={`text-base font-bold tabular-nums leading-tight mt-0.5 ${valueColor}`}>
        {value}
        {unit && (
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 ml-1">{unit}</span>
        )}
      </div>
    </div>
  );
}

// ── Not connected empty state ─────────────────────────────
function NotConnectedState({ t }) {
  return (
    <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
        {/* Left column */}
        <div className="p-6 sm:p-8">
          <span className="inline-flex items-center px-2 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold tracking-wide mb-4">
            {t('notConnected.badge')}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-snug">
            {t('notConnected.title')}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
            {t('notConnected.description')}
          </p>
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <Link
              href="/dashboard/settings/eld"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Zap size={14} strokeWidth={2.25} />
              {t('notConnected.connectCta')}
            </Link>
          </div>
          <ul className="mt-6 space-y-2.5">
            {[
              t('notConnected.valueProp1'),
              t('notConnected.valueProp2'),
              t('notConnected.valueProp3'),
            ].map((prop, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle size={16} className="text-teal-500 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <span>{prop}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Right column — providers */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border-t md:border-t-0 md:border-l border-blue-100 dark:border-blue-900/30">
          <div className="text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-4">
            {t('notConnected.supportedTitle')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Motive', 'Samsara'].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  {name[0]}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── No data for quarter ──────────────────────────────────
function NoDataState({ provider, quarter, onSwitchToManual, onBackfill, backfilling, t }) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
        <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
          {t('noData.banner', { provider: provider || 'ELD' })}
        </span>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 mx-auto flex items-center justify-center mb-4">
          <Route size={26} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          {t('noData.title', { quarter: formatQuarterLabel(quarter) })}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          {t('noData.description')}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onBackfill && (
            <button
              onClick={onBackfill}
              disabled={backfilling}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition-colors"
            >
              {backfilling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {backfilling
                ? `Pulling ${formatQuarterLabel(quarter)}…`
                : `Pull ${formatQuarterLabel(quarter)} from ${provider || 'Motive'}`}
            </button>
          )}
          <button
            onClick={onSwitchToManual}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Edit size={14} />
            {t('noData.logManual')}
          </button>
        </div>
      </div>
    </>
  );
}

// ── ELD Premium gate (no eldIntegration access) ─────────
function EldUpgradePrompt({ t }) {
  return (
    <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-8 text-center">
      <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
        <Zap size={26} className="text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        {t('eldPremiumRequired.title')}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {t('eldPremiumRequired.description')}
      </p>
      <Link
        href="/dashboard/upgrade"
        className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
      >
        {t('eldPremiumRequired.upgrade')}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ── Inner: useSearchParams lives here for Suspense ──────
function MileagePageInner() {
  const { t } = useTranslation('mileage');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const { canAccess, currentTier, loading: featureLoading } = useFeatureAccess();
  const hasStateMileageAccess = canAccess('stateMileage');
  const hasEldAccess = canAccess('eldIntegration');
  const hasEldIftaAccess = canAccess('eldIftaSync');

  // Tab + quarter state synced with URL
  const initialTab = searchParams.get('tab') === 'manual' ? 'manual' : 'auto';
  const initialQuarter = searchParams.get('q') || getCurrentQuarter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedQuarter, setSelectedQuarter] = useState(initialQuarter);

  const updateUrl = useCallback(
    (tab, quarter) => {
      const params = new URLSearchParams();
      if (tab && tab !== 'auto') params.set('tab', tab);
      if (quarter && quarter !== getCurrentQuarter()) params.set('q', quarter);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      updateUrl(tab, selectedQuarter);
    },
    [selectedQuarter, updateUrl]
  );

  const handleQuarterChange = useCallback(
    (q) => {
      setSelectedQuarter(q);
      updateUrl(activeTab, q);
    },
    [activeTab, updateUrl]
  );

  // Quarter options: current + 15 prior = 4 years total (IFTA audit retention).
  // Carriers must keep IFTA records for 4 years, so users need to be able to
  // pull or review any quarter in that window.
  const quarterOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 16; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
      opts.push(`${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`);
    }
    return [...new Set(opts)];
  }, []);

  // ELD data state
  const [eldLoading, setEldLoading] = useState(true);
  const [eldConnection, setEldConnection] = useState(null); // { connected, provider, connected_at, ... }
  const [automatedData, setAutomatedData] = useState(null); // { hasData, totalMiles, jurisdictionCount, breadcrumbCount, lastSyncAt, vehicleCount }
  const [summaryData, setSummaryData] = useState(null); // { eldMileage, manualMileage, comparison, lastImportedAt }
  const [importing, setImporting] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [eldError, setEldError] = useState(null);
  const [eldSuccess, setEldSuccess] = useState(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const loadEldData = useCallback(async () => {
    if (!hasEldAccess) {
      setEldLoading(false);
      return;
    }
    try {
      setEldLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setEldLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const connRes = await fetch('/api/eld/connections', { headers });
      const connData = connRes.ok ? await connRes.json() : null;
      setEldConnection(connData);

      if (connData?.connected) {
        const [autoRes, sumRes] = await Promise.all([
          fetch(`/api/ifta/automated?quarter=${selectedQuarter}`, { headers }),
          hasEldIftaAccess
            ? fetch(`/api/eld/ifta/summary?quarter=${selectedQuarter}`, { headers })
            : Promise.resolve(null),
        ]);
        if (autoRes.ok) setAutomatedData(await autoRes.json());
        else setAutomatedData(null);
        if (sumRes && sumRes.ok) setSummaryData(await sumRes.json());
        else setSummaryData(null);
      } else {
        setAutomatedData(null);
        setSummaryData(null);
      }
    } catch (err) {
      console.error('Error loading ELD data:', err);
    } finally {
      setEldLoading(false);
    }
  }, [hasEldAccess, hasEldIftaAccess, selectedQuarter]);

  useEffect(() => {
    loadEldData();
  }, [loadEldData]);

  const handleImport = async () => {
    try {
      setImporting(true);
      setEldError(null);
      setEldSuccess(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/eld/ifta/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quarter: selectedQuarter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('errors.importFailed'));
      setEldSuccess(
        t('eldHero.importSuccess', { count: data.imported ?? data.recordsImported ?? 0 })
      );
      setTimeout(() => setEldSuccess(null), 5000);
      await loadEldData();
    } catch (err) {
      setEldError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncingNow(true);
      setEldError(null);
      setEldSuccess(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Run an IFTA-only sync for the SELECTED quarter so users can backfill
      // historical quarters (the default 'all' sync only covers current +
      // previous quarter). Pass quarter via options.quarter, which is what
      // /api/eld/sync now reads.
      const res = await fetch('/api/eld/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'ifta',
          options: { quarter: selectedQuarter },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Sync failed');
      }
      await loadEldData();
      setEldSuccess(`Synced ${formatQuarterLabel(selectedQuarter)} from Motive.`);
      setTimeout(() => setEldSuccess(null), 5000);
    } catch (err) {
      setEldError(err.message);
    } finally {
      setSyncingNow(false);
    }
  };

  // Derived values
  const isConnected = !!eldConnection?.connected;
  const providerName = prettyProvider(eldConnection?.provider);
  const hasEldDataThisQuarter = !!(automatedData?.hasData && automatedData?.totalMiles > 0);
  const eldTotalMiles = automatedData?.totalMiles || summaryData?.eldMileage?.totalMiles || 0;
  const manualTotalMiles = summaryData?.manualMileage?.totalMiles || 0;
  const manualTripCount = summaryData?.manualMileage?.tripCount || 0;
  const lastSyncIso =
    automatedData?.lastSyncAt ||
    eldConnection?.last_sync_at ||
    eldConnection?.lastSyncAt ||
    summaryData?.lastImportedAt ||
    null;
  const syncedAgo = formatRelativeTime(lastSyncIso);
  const vehicleCount = eldConnection?.vehicle_count || eldConnection?.vehicleCount || null;

  // Variance tone
  const variance = summaryData?.comparison?.differencePercent;
  let varianceTone = 'good';
  if (variance != null) {
    const abs = Math.abs(variance);
    if (abs > 5) varianceTone = 'bad';
    else if (abs > 1) varianceTone = 'warning';
  }

  // ── Loading ────────────────────────────────────────────
  if (featureLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </main>
    );
  }

  // ── Upgrade prompt (Basic plan) ──────────────────────────
  if (!hasStateMileageAccess) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Route size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t('pageTitle')}</h1>
                <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">{t('upgradeMessage')}</p>
              </div>
            </div>
          </div>
          <UpgradePrompt feature="stateMileage" currentTier={currentTier} />
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('featurePreview.title')}
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              {[
                { icon: Truck, key: 'activeTripRecording', color: 'blue' },
                { icon: MapPin, key: 'autoCalculations', color: 'green' },
                { icon: Calculator, key: 'iftaReports', color: 'purple' },
                { icon: FileDown, key: 'exportData', color: 'orange' },
                { icon: History, key: 'tripHistory', color: 'indigo' },
              ].map(({ icon: Icon, key, color }) => (
                <li key={key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-${color}-100 dark:bg-${color}-900/40 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} className={`text-${color}-600 dark:text-${color}-400`} />
                  </div>
                  <span>{t(`featurePreview.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    );
  }

  // ── Main page ───────────────────────────────────────────
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Hero — matches other dashboard pages (blue gradient) */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg overflow-hidden relative">
          {/* Soft glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-white/50 to-teal-300/70" />
          <div className="relative p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-white">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Activity size={28} strokeWidth={2} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100 dark:text-blue-200 mb-1">
                  {t('hero.eyebrow')}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('hero.title')}</h1>
                <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base mt-1 max-w-xl">
                  {t('hero.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <select
                  value={selectedQuarter}
                  onChange={(e) => handleQuarterChange(e.target.value)}
                  className="h-10 pl-3 pr-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold appearance-none cursor-pointer hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {quarterOptions.map((q) => (
                    <option key={q} value={q} className="text-gray-900">
                      {formatQuarterLabel(q)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/80"
                />
              </div>
              <Link
                href="/dashboard/ifta"
                className="h-10 px-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Calculator size={16} />
                <span className="hidden sm:inline">{t('iftaCalculator')}</span>
              </Link>
              <div className="h-10 px-3 bg-white text-blue-600 rounded-xl shadow-md flex items-center gap-1.5 text-sm font-semibold">
                <CheckCircle size={14} strokeWidth={2.5} className="text-teal-600" />
                {t('iftaCompliant')}
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial */}
        <TutorialCard
          pageId="mileage"
          title={t('pageTitle')}
          description={t('pageSubtitle')}
          features={[
            {
              icon: Play,
              title: t('tutorial.features.tripRecording.title'),
              description: t('tutorial.features.tripRecording.description'),
            },
            {
              icon: MapPin,
              title: t('tutorial.features.stateCrossings.title'),
              description: t('tutorial.features.stateCrossings.description'),
            },
            {
              icon: History,
              title: t('tutorial.features.tripHistory.title'),
              description: t('tutorial.features.tripHistory.description'),
            },
            {
              icon: FileDown,
              title: t('tutorial.features.iftaExport.title'),
              description: t('tutorial.features.iftaExport.description'),
            },
          ]}
          tips={t('tutorial.tips', { returnObjects: true }) || []}
          accentColor="teal"
          userId={user?.id}
        />

        {/* Tabs */}
        <TabStrip
          activeTab={activeTab}
          onTabChange={handleTabChange}
          eldConnected={isConnected}
          eldMiles={eldTotalMiles}
          manualTripCount={manualTripCount}
          t={t}
        />

        {/* Tab content */}
        {activeTab === 'auto' ? (
          <div>
            {!hasEldAccess ? (
              <EldUpgradePrompt t={t} />
            ) : eldLoading ? (
              <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-10 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            ) : !isConnected ? (
              <NotConnectedState t={t} />
            ) : hasEldDataThisQuarter ? (
              <>
                <ELDHeroCard
                  provider={providerName}
                  syncedAgo={syncedAgo}
                  vehicleCount={vehicleCount}
                  stats={{
                    totalMiles: eldTotalMiles,
                    jurisdictionCount: automatedData?.jurisdictionCount,
                    breadcrumbCount: automatedData?.breadcrumbCount,
                  }}
                  quarter={selectedQuarter}
                  onSyncNow={handleSyncNow}
                  syncingNow={syncingNow}
                  onImport={handleImport}
                  importing={importing}
                  error={eldError}
                  success={eldSuccess}
                  clearError={() => setEldError(null)}
                  clearSuccess={() => setEldSuccess(null)}
                  t={t}
                />
                {hasEldIftaAccess && summaryData?.comparison && manualTotalMiles > 0 && (
                  <ComparisonStrip
                    eldMiles={eldTotalMiles}
                    manualMiles={manualTotalMiles}
                    variance={variance}
                    varianceTone={varianceTone}
                    onCta={handleImport}
                    ctaLabel={t('eldHero.syncWithIfta')}
                    onViewDetails={() => handleTabChange('manual')}
                    t={t}
                  />
                )}
              </>
            ) : (
              <NoDataState
                provider={providerName}
                quarter={selectedQuarter}
                onSwitchToManual={() => handleTabChange('manual')}
                onBackfill={hasEldIftaAccess ? handleSyncNow : undefined}
                backfilling={syncingNow}
                t={t}
              />
            )}
          </div>
        ) : (
          <div>
            {/* Info banner */}
            <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Info size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 dark:text-blue-200 flex-1">
                {t('manualInfo.banner')}
              </p>
            </div>
            {/* Preserve existing manual logger entirely */}
            <StateMileageLogger />
          </div>
        )}
      </div>
    </main>
  );
}

// Layout is provided by mileage/layout.js — do not duplicate here
export default function DriverMileagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      }
    >
      <MileagePageInner />
    </Suspense>
  );
}
