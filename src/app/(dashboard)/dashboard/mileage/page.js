"use client";

import { Suspense, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapPin, Truck, BarChart2, Calculator, Route, FileDown, Clock, Play, History, Zap, CheckCircle, AlertCircle, RefreshCw, Settings, ArrowRight, Loader2 } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { supabase } from '@/lib/supabaseClient';
import TutorialCard from '@/components/shared/TutorialCard';
import { useTranslation } from '@/context/LanguageContext';

// Dynamically import the StateMileageLogger component
const StateMileageLogger = dynamic(() => import('@/components/drivers/StateMileageLogger'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

/**
 * ELD Mileage Import Panel
 * Shows ELD connection status and allows importing automated mileage data
 */
function ELDMileageImportPanel() {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [automatedData, setAutomatedData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { canAccess } = useFeatureAccess();
  const hasEldAccess = canAccess('eldIntegration');

  // Get current quarter
  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${quarter}`;
  };

  const loadData = useCallback(async () => {
    if (!hasEldAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Load ELD connection status
      const connectionResponse = await fetch('/api/eld/connections', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (connectionResponse.ok) {
        const connData = await connectionResponse.json();
        setConnectionStatus(connData);

        // If connected, load automated IFTA data
        if (connData.connected) {
          const quarter = getCurrentQuarter();
          const iftaResponse = await fetch(`/api/ifta/automated?quarter=${quarter}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });

          if (iftaResponse.ok) {
            const iftaData = await iftaResponse.json();
            setAutomatedData(iftaData);
          }
        }
      }
    } catch (err) {
      console.error('Error loading ELD data:', err);
    } finally {
      setLoading(false);
    }
  }, [hasEldAccess]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImport = async () => {
    try {
      setImporting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const quarter = getCurrentQuarter();
      const response = await fetch('/api/eld/ifta/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quarter })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setSuccess(`Successfully imported ${data.imported || 0} mileage records`);
      setTimeout(() => setSuccess(null), 5000);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  // Not on a plan with ELD access
  if (!hasEldAccess) {
    return (
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Zap size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">ELD Mileage Import</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
            Premium
          </span>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Upgrade to Premium to automatically import mileage from your ELD device.
          </p>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Upgrade Now
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Zap size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">ELD Mileage Import</span>
        </div>
        <div className="p-6 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;
  const hasAutomatedData = automatedData?.hasData && automatedData?.totalMiles > 0;

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isConnected
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <Zap size={16} className={
              isConnected
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
            } />
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">ELD Mileage Import</span>
          {isConnected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              <CheckCircle size={10} />
              Connected
            </span>
          )}
        </div>
        {isConnected && hasAutomatedData && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
          >
            {importing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileDown size={14} />
                Import to Mileage Log
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-4 mt-3 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      <div className="p-4">
        {!isConnected ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Connect your ELD device to automatically import jurisdiction mileage.
            </p>
            <Link
              href="/dashboard/settings/eld"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              <Settings size={14} />
              Connect ELD
            </Link>
          </div>
        ) : hasAutomatedData ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Current Quarter</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{getCurrentQuarter()}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(automatedData.totalMiles).toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Miles</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {automatedData.jurisdictionCount || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">States</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {automatedData.breadcrumbCount?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">GPS Points</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Click "Import to Mileage Log" to add ELD mileage to your state records
            </p>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              No automated mileage data available for this quarter yet.
            </p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              Refresh Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Note: DashboardLayout is provided by mileage/layout.js - do not duplicate here
export default function DriverMileagePage() {
  const { t } = useTranslation('mileage');

  // User state for tutorial
  const [user, setUser] = useState(null);

  // Feature access check
  const { canAccess, currentTier, loading: featureLoading } = useFeatureAccess();
  const hasStateMileageAccess = canAccess('stateMileage');

  // Get current user for tutorial
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  // Show loading state
  if (featureLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </main>
    );
  }

  // Show upgrade prompt for Basic plan users
  if (!hasStateMileageAccess) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Route size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t('pageTitle')}</h1>
                <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                  {t('upgradeMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* Upgrade Prompt */}
          <UpgradePrompt feature="stateMileage" currentTier={currentTier} />

          {/* Feature Preview */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('featurePreview.title')}
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <Truck size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span>{t('featurePreview.activeTripRecording')}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <span>{t('featurePreview.autoCalculations')}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <BarChart2 size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span>{t('featurePreview.iftaReports')}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                  <FileDown size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
                <span>{t('featurePreview.exportData')}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>{t('featurePreview.tripHistory')}</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <Route size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t('pageTitle')}</h1>
                    <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                      {t('pageSubtitle')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/ifta"
                  className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center font-medium"
                >
                  <Calculator size={18} className="mr-2" />
                  {t('iftaCalculator')}
                </Link>
                <div className="px-4 py-2.5 bg-white text-blue-600 rounded-xl shadow-md flex items-center font-semibold">
                  <Truck size={18} className="mr-2" />
                  {t('iftaCompliant')}
                </div>
              </div>
            </div>
          </div>

          {/* Tutorial Card */}
          <TutorialCard
            pageId="mileage"
            title={t('pageTitle')}
            description={t('pageSubtitle')}
            features={[
              {
                icon: Play,
                title: t('tutorial.features.tripRecording.title'),
                description: t('tutorial.features.tripRecording.description')
              },
              {
                icon: MapPin,
                title: t('tutorial.features.stateCrossings.title'),
                description: t('tutorial.features.stateCrossings.description')
              },
              {
                icon: History,
                title: t('tutorial.features.tripHistory.title'),
                description: t('tutorial.features.tripHistory.description')
              },
              {
                icon: FileDown,
                title: t('tutorial.features.iftaExport.title'),
                description: t('tutorial.features.iftaExport.description')
              }
            ]}
            tips={t('tutorial.tips', { returnObjects: true }) || []}
            accentColor="teal"
            userId={user?.id}
          />

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-lg mr-3">
                  <Truck size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('featureCards.activeTripRecording.title')}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('featureCards.activeTripRecording.description')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
              <div className="flex items-center mb-3">
                <div className="bg-green-100 dark:bg-green-900/40 p-2.5 rounded-lg mr-3">
                  <MapPin size={22} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('featureCards.stateByStateTracking.title')}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('featureCards.stateByStateTracking.description')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:translate-y-[-2px] duration-200">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 dark:bg-purple-900/40 p-2.5 rounded-lg mr-3">
                  <BarChart2 size={22} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('featureCards.iftaMileageReports.title')}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('featureCards.iftaMileageReports.description')}
              </p>
            </div>
          </div>

          {/* ELD Mileage Import Panel */}
          <ELDMileageImportPanel />

          {/* Main Content */}
          <StateMileageLogger />
        </div>
      </main>
    </Suspense>
  );
}
