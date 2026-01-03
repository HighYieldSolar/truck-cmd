// src/app/(dashboard)/dashboard/ifta/page.js
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calculator,
  FileDown,
  Trash2,
  AlertTriangle,
  Info,
  Truck,
  MapPin,
  Fuel,
  RefreshCw,
  CheckCircle,
  Route,
  Gauge,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Import components
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuarterSelector from "@/components/ifta/QuarterSelector";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import VehicleSelector from "@/components/ifta/VehicleSelector";
import SimplifiedExportModal from "@/components/ifta/SimplifiedExportModal";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import ELDDataPanel from "@/components/ifta/ELDDataPanel";

// Import services
import { fetchFuelEntries } from "@/lib/services/fuelService";
import { getQuarterDateRange } from "@/lib/utils/dateUtils";

// Import hooks
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

// Import tutorial component
import TutorialCard from "@/components/shared/TutorialCard";
import { FileText, MapPinned, DollarSign } from "lucide-react";

// State name mapping
const STATE_NAMES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming',
  'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
  'NL': 'Newfoundland', 'NS': 'Nova Scotia', 'ON': 'Ontario', 'PE': 'Prince Edward Island',
  'QC': 'Quebec', 'SK': 'Saskatchewan'
};

export default function IFTACalculatorPage() {
  const router = useRouter();
  const { t } = useTranslation('ifta');

  // Feature access check
  const { canAccess, currentTier, loading: featureLoading } = useFeatureAccess();
  const hasIFTAAccess = canAccess('iftaCalculator');

  // Core state
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Data state
  const [activeQuarter, setActiveQuarter] = useState("");
  const [trips, setTrips] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("all");

  // UI state
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tripsPerPage = 10;

  // ELD data source state (eld, manual, or combined)
  const [dataSource, setDataSource] = useState('eld');

  // Messages
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Load trips for the selected quarter
  const loadTrips = useCallback(async () => {
    if (!user?.id || !activeQuarter) return [];

    try {
      const { data, error: tripsError } = await supabase
        .from('ifta_trip_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('quarter', activeQuarter)
        .order('start_date', { ascending: false });

      if (tripsError) {
        if (tripsError.code === '42P01') {
          setError(t('page.tableDoesNotExist'));
          return [];
        }
        throw tripsError;
      }

      // Fetch vehicle info
      const vehicleIds = [...new Set((data || []).map(trip => trip.vehicle_id))].filter(Boolean);
      const vehicleInfo = {};

      if (vehicleIds.length > 0) {
        try {
          const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('id, name, license_plate')
            .in('id', vehicleIds);

          if (vehicleData?.length > 0) {
            vehicleData.forEach(v => {
              vehicleInfo[v.id] = { name: v.name, license_plate: v.license_plate };
            });
          }
        } catch {
          // Non-fatal, continue without vehicle names
        }
      }

      return (data || []).map(trip => ({
        ...trip,
        vehicle_name: vehicleInfo[trip.vehicle_id]?.name || null,
        license_plate: vehicleInfo[trip.vehicle_id]?.license_plate || null
      }));
    } catch (err) {
      setError(t('page.failedToLoadTrips'));
      return [];
    }
  }, [user?.id, activeQuarter, t]);

  // Load fuel data
  const loadFuelData = useCallback(async () => {
    if (!user?.id || !activeQuarter) return [];

    try {
      const { startDate, endDate } = getQuarterDateRange(activeQuarter);
      const filters = {
        dateRange: 'Custom',
        startDate,
        endDate,
        iftaOnly: true
      };

      const fuelEntries = await fetchFuelEntries(user.id, filters);
      return (fuelEntries || []).map(entry => ({
        ...entry,
        state: entry.state || 'Unknown',
        gallons: parseFloat(entry.gallons) || 0
      }));
    } catch {
      setError(t('page.failedToLoadFuel'));
      return [];
    }
  }, [user?.id, activeQuarter, t]);

  // Get unique vehicles from data
  const getUniqueVehicles = useCallback(() => {
    const vehicleMap = new Map();

    trips.forEach(trip => {
      if (trip.vehicle_id && !vehicleMap.has(trip.vehicle_id)) {
        vehicleMap.set(trip.vehicle_id, {
          id: String(trip.vehicle_id),
          name: trip.vehicle_name || String(trip.vehicle_id),
          license_plate: trip.license_plate
        });
      }
    });

    fuelData.forEach(entry => {
      if (entry.vehicle_id && !vehicleMap.has(entry.vehicle_id)) {
        vehicleMap.set(entry.vehicle_id, {
          id: String(entry.vehicle_id),
          name: entry.vehicle_name || String(entry.vehicle_id),
          license_plate: entry.license_plate
        });
      }
    });

    return Array.from(vehicleMap.values());
  }, [trips, fuelData]);

  // Calculate jurisdiction summary (THE MAIN IFTA DATA)
  const getJurisdictionSummary = useCallback(() => {
    const jurisdictionData = {};

    // Filter by vehicle if needed
    const filteredTrips = selectedVehicle === "all"
      ? trips
      : trips.filter(t => t.vehicle_id === selectedVehicle);

    const filteredFuel = selectedVehicle === "all"
      ? fuelData
      : fuelData.filter(f => f.vehicle_id === selectedVehicle);

    // Add miles from trips
    filteredTrips.forEach(trip => {
      const miles = parseFloat(trip.total_miles) || 0;

      if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
        if (!jurisdictionData[trip.start_jurisdiction]) {
          jurisdictionData[trip.start_jurisdiction] = { miles: 0, gallons: 0 };
        }
        jurisdictionData[trip.start_jurisdiction].miles += miles;
      } else if (trip.start_jurisdiction && trip.end_jurisdiction) {
        const halfMiles = miles / 2;

        if (!jurisdictionData[trip.start_jurisdiction]) {
          jurisdictionData[trip.start_jurisdiction] = { miles: 0, gallons: 0 };
        }
        if (!jurisdictionData[trip.end_jurisdiction]) {
          jurisdictionData[trip.end_jurisdiction] = { miles: 0, gallons: 0 };
        }

        jurisdictionData[trip.start_jurisdiction].miles += halfMiles;
        jurisdictionData[trip.end_jurisdiction].miles += halfMiles;
      }
    });

    // Add fuel from fuel tracker
    filteredFuel.forEach(entry => {
      if (entry.state) {
        if (!jurisdictionData[entry.state]) {
          jurisdictionData[entry.state] = { miles: 0, gallons: 0 };
        }
        jurisdictionData[entry.state].gallons += parseFloat(entry.gallons) || 0;
      }
    });

    // Convert to array, filter out empty/invalid codes, and sort by miles
    return Object.entries(jurisdictionData)
      .filter(([code]) => code && code.trim() && code !== 'Unknown' && code !== 'null' && code !== 'undefined')
      .map(([code, data]) => ({
        code,
        name: STATE_NAMES[code] || code,
        miles: data.miles,
        gallons: data.gallons
      }))
      .sort((a, b) => b.miles - a.miles);
  }, [trips, fuelData, selectedVehicle]);

  // Calculate summary stats
  const getStats = useCallback(() => {
    const summary = getJurisdictionSummary();
    const totalMiles = summary.reduce((sum, j) => sum + j.miles, 0);
    const totalGallons = summary.reduce((sum, j) => sum + j.gallons, 0);
    const avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;

    return {
      totalTrips: trips.length,
      totalMiles,
      totalGallons,
      avgMpg,
      jurisdictionCount: summary.length
    };
  }, [trips, getJurisdictionSummary]);

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        setInitialLoading(true);
        const savedQuarter = localStorage.getItem('ifta-selected-quarter');
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);

        if (savedQuarter) {
          setActiveQuarter(savedQuarter);
        } else {
          const now = new Date();
          const quarter = Math.ceil((now.getMonth() + 1) / 3);
          setActiveQuarter(`${now.getFullYear()}-Q${quarter}`);
        }
      } catch {
        setError(t('page.authError'));
      } finally {
        setInitialLoading(false);
      }
    }

    init();
  }, [router]);

  // Load data when quarter changes
  useEffect(() => {
    if (activeQuarter) {
      localStorage.setItem('ifta-selected-quarter', activeQuarter);
    }
  }, [activeQuarter]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedVehicle, activeQuarter]);

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !activeQuarter || initialLoading) return;

      try {
        setLoading(true);
        setError(null);

        const [tripsData, fuelEntries] = await Promise.all([
          loadTrips(),
          loadFuelData()
        ]);

        setTrips(tripsData);
        setFuelData(fuelEntries);
      } catch {
        setError(t('page.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id, activeQuarter, initialLoading, loadTrips, loadFuelData]);

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    const [tripsData, fuelEntries] = await Promise.all([
      loadTrips(),
      loadFuelData()
    ]);
    setTrips(tripsData);
    setFuelData(fuelEntries);
    setLoading(false);

    setStatusMessage({ type: 'success', text: t('page.dataRefreshed') });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Delete trip
  const handleDeleteTrip = (trip) => {
    setTripToDelete(trip);
    setDeleteModalOpen(true);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;

    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('ifta_trip_records')
        .delete()
        .eq('id', tripToDelete.id);

      if (deleteError) throw deleteError;

      setTrips(prev => prev.filter(t => t.id !== tripToDelete.id));
      setStatusMessage({ type: 'success', text: t('page.tripDeleted') });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setError(t('page.failedToDeleteTrip'));
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setTripToDelete(null);
    }
  };

  // Export handler
  const handleExport = () => {
    if (!trips.length) {
      setError(t('page.noDataToExport'));
      return;
    }
    setExportModalOpen(true);
  };

  const stats = getStats();
  const jurisdictionSummary = getJurisdictionSummary();
  const uniqueVehicles = getUniqueVehicles();

  // Filter trips for display
  const displayTrips = selectedVehicle === "all"
    ? trips
    : trips.filter(t => t.vehicle_id === selectedVehicle);

  if (initialLoading || featureLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show upgrade prompt for Basic plan users
  if (!hasIFTAAccess) {
    return (
      <DashboardLayout activePage="ifta">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <Calculator size={28} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{t('page.title')}</h1>
                  <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                    {t('page.upgradeSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Prompt */}
            <UpgradePrompt feature="iftaCalculator" currentTier={currentTier} />

            {/* Feature Preview */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('upgrade.whatYouGet')}
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <Route size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>{t('upgrade.featureMileageTracking')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <Fuel size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span>{t('upgrade.featureFuelIntegration')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                    <Gauge size={16} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <span>{t('upgrade.featureMpgCalculations')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <FileDown size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>{t('upgrade.featureExportReports')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span>{t('upgrade.featureMultiJurisdiction')}</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="ifta">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <Calculator size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t('page.title')}</h1>
                    <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base">
                      {t('page.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/fuel"
                  className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center font-medium"
                >
                  <Fuel size={18} className="mr-2" />
                  {t('page.fuelTrackerButton')}
                </Link>
                <button
                  onClick={handleExport}
                  disabled={!trips.length}
                  className="px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md flex items-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown size={18} className="mr-2" />
                  {t('page.exportReportButton')}
                </button>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <CheckCircle className={`h-5 w-5 ${
                statusMessage.type === 'success' ? 'text-green-500' : 'text-yellow-500'
              }`} />
              <p className={`text-sm font-medium ${
                statusMessage.type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {statusMessage.text}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                &times;
              </button>
            </div>
          )}

          {/* Tutorial Card */}
          <TutorialCard
            pageId="ifta"
            title={t('page.title')}
            description={t('page.subtitle')}
            features={[
              {
                icon: Calculator,
                title: t('tutorial.taxCalculationTitle'),
                description: t('tutorial.taxCalculationDesc')
              },
              {
                icon: MapPinned,
                title: t('tutorial.stateBreakdownTitle'),
                description: t('tutorial.stateBreakdownDesc')
              },
              {
                icon: Route,
                title: t('tutorial.tripRecordsTitle'),
                description: t('tutorial.tripRecordsDesc')
              },
              {
                icon: FileText,
                title: t('tutorial.exportReportsTitle'),
                description: t('tutorial.exportReportsDesc')
              }
            ]}
            tips={[
              t('tutorial.tipSelectQuarter'),
              t('tutorial.tipFilterVehicle'),
              t('tutorial.tipFuelState'),
              t('tutorial.tipExportFile')
            ]}
            accentColor="indigo"
            userId={user?.id}
          />

          {/* Quarter & Vehicle Selection */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('page.quarterLabel')}
                </label>
                <QuarterSelector
                  activeQuarter={activeQuarter}
                  setActiveQuarter={setActiveQuarter}
                  isLoading={loading}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('page.vehicleFilterLabel')}
                </label>
                <VehicleSelector
                  selectedVehicle={selectedVehicle}
                  setSelectedVehicle={setSelectedVehicle}
                  vehicles={uniqueVehicles}
                  isLoading={loading}
                  userId={user?.id}
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center font-medium"
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('page.refreshButton')}
              </button>
            </div>
          </div>

          {/* ELD Data Import Panel */}
          <div className="mb-6">
            <ELDDataPanel
              quarter={activeQuarter}
              onDataSourceChange={setDataSource}
              selectedSource={dataSource}
            />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Route size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('stats.miles')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(stats.totalMiles).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('stats.totalDriven')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Fuel size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('stats.fuel')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(stats.totalGallons).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('stats.gallonsPurchased')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <Gauge size={20} className="text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('stats.mpg')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avgMpg.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('stats.averageEfficiency')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('stats.states')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.jurisdictionCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('stats.jurisdictions')}</p>
            </div>
          </div>

          {/* MAIN CONTENT: Jurisdiction Summary Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <MapPin size={20} className="mr-2 text-blue-500" />
                {t('table.jurisdictionSummary')}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activeQuarter}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
              </div>
            ) : jurisdictionSummary.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('emptyState.noDataYet')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {t('emptyState.startByRecording')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/dashboard/mileage"
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
                  >
                    <Route size={18} className="mr-2" />
                    {t('emptyState.goToStateMileage')}
                  </Link>
                  <Link
                    href="/dashboard/fuel"
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center font-medium"
                  >
                    <Fuel size={18} className="mr-2" />
                    {t('emptyState.goToFuelTracker')}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.jurisdiction')}
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.milesDriven')}
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.fuelPurchasedGal')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {jurisdictionSummary.map((j, idx) => (
                        <tr key={j.code} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/30'}>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center mr-3">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{j.code}</span>
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{j.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {j.miles.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {j.gallons.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          {t('table.total')}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                          {stats.totalMiles.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                          {stats.totalGallons.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-3">
                  {jurisdictionSummary.map((j) => (
                    <div key={j.code} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-300">{j.code}</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{j.name}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{t('stats.miles')}</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {j.miles.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{t('table.gallons')}</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {j.gallons.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Mobile Total */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">{t('table.total')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 uppercase mb-1">{t('stats.miles')}</p>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          {stats.totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 uppercase mb-1">{t('table.gallons')}</p>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          {stats.totalGallons.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Trip Records (Collapsible) */}
          {displayTrips.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
              <button
                onClick={() => setShowTripDetails(!showTripDetails)}
                className="w-full px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Truck size={20} className="mr-2 text-gray-500" />
                  {t('tripRecords.title')}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({t('tripRecords.tripsCount', { count: displayTrips.length })})
                  </span>
                </h2>
                {showTripDetails ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>

              {showTripDetails && (
                <>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayTrips
                      .slice((currentPage - 1) * tripsPerPage, currentPage * tripsPerPage)
                      .map((trip) => (
                      <div key={trip.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <Calendar size={16} className="mr-1" />
                              <span className="text-sm">
                                {new Date(trip.start_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                                {trip.start_jurisdiction}
                              </span>
                              <ArrowRight size={16} className="mx-2 text-gray-400" />
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                                {trip.end_jurisdiction}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {parseFloat(trip.total_miles).toLocaleString()} mi
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTrip(trip)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {trip.vehicle_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                            <Truck size={12} className="mr-1" />
                            {trip.vehicle_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {displayTrips.length > tripsPerPage && (
                    <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/30">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('tripRecords.showingTrips', {
                          from: ((currentPage - 1) * tripsPerPage) + 1,
                          to: Math.min(currentPage * tripsPerPage, displayTrips.length),
                          total: displayTrips.length
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {currentPage} / {Math.ceil(displayTrips.length / tripsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(displayTrips.length / tripsPerPage), prev + 1))}
                          disabled={currentPage >= Math.ceil(displayTrips.length / tripsPerPage)}
                          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <Info size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {t('help.howToUse')}
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>{t('help.trackMileage')}</strong>{" "}
                      <Link href="/dashboard/mileage" className="underline hover:text-blue-600">
                        {t('help.stateMileageTracker')}
                      </Link>
                      {" "}{t('help.trackMileageDesc')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>{t('help.logFuelPurchases')}</strong>{" "}
                      <Link href="/dashboard/fuel" className="underline hover:text-blue-600">
                        {t('page.fuelTrackerButton')}
                      </Link>
                      {" "}{t('help.logFuelPurchasesDesc')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>{t('help.exportReport')}</strong> {t('help.exportReportDesc')}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setTripToDelete(null);
          }}
          onConfirm={confirmDeleteTrip}
          title={t('deleteModal.title')}
          message={t('deleteModal.message')}
          itemName={tripToDelete ? t('tripRecords.tripFrom', { from: tripToDelete.start_jurisdiction, to: tripToDelete.end_jurisdiction }) : ""}
          isDeleting={loading && deleteModalOpen}
        />

        {/* Export Modal */}
        {exportModalOpen && (
          <SimplifiedExportModal
            isOpen={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            trips={trips}
            quarter={activeQuarter}
            fuelData={fuelData}
            selectedVehicle={selectedVehicle}
            companyInfo={{
              name: 'Truck Command',
              phone: '(951) 505-1147',
              email: 'support@truckcommand.com',
              website: 'www.truckcommand.com',
              logo: '/images/tc-name-tp-bg.png'
            }}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
