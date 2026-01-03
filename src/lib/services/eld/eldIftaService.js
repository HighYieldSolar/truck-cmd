/**
 * ELD IFTA Service
 *
 * Integrates ELD jurisdiction mileage with IFTA reporting.
 * Provides ELD data as the PRIMARY source with manual entry as FALLBACK.
 *
 * Data source options:
 * - 'eld': Use jurisdiction mileage from ELD provider (recommended)
 * - 'manual': Use State Mileage Tracker entries (existing behavior)
 * - 'combined': Merge both sources, flag overlaps for review
 */

import { createClient } from '@supabase/supabase-js';
import { getConnection } from './eldConnectionService';
import { hasFeature } from '@/config/tierConfig';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Get ELD jurisdiction mileage for a quarter
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in YYYY-QN format
 * @returns {Promise<object>} - ELD mileage data by jurisdiction
 */
export async function getEldMileageForQuarter(userId, quarter) {
  try {
    // Parse quarter to get month range
    const [year, qPart] = quarter.split('-Q');
    const quarterNum = parseInt(qPart);

    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
      return { error: true, errorMessage: 'Invalid quarter format' };
    }

    const startMonth = `${year}-${((quarterNum - 1) * 3 + 1).toString().padStart(2, '0')}`;
    const endMonth = `${year}-${(quarterNum * 3).toString().padStart(2, '0')}`;

    // Get user's active ELD connection
    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return {
        error: false,
        hasEld: false,
        data: [],
        message: 'No active ELD connection'
      };
    }

    const connectionId = connectionResult.data.id;

    // Fetch ELD IFTA mileage data
    const { data, error } = await supabaseAdmin
      .from('eld_ifta_mileage')
      .select(`
        jurisdiction,
        total_miles,
        month,
        vehicle_breakdown,
        external_vehicle_id
      `)
      .eq('connection_id', connectionId)
      .gte('month', startMonth)
      .lte('month', endMonth);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Aggregate by jurisdiction
    const mileageByJurisdiction = {};

    for (const record of (data || [])) {
      if (!mileageByJurisdiction[record.jurisdiction]) {
        mileageByJurisdiction[record.jurisdiction] = {
          jurisdiction: record.jurisdiction,
          miles: 0,
          source: 'eld',
          months: [],
          vehicles: new Set()
        };
      }

      mileageByJurisdiction[record.jurisdiction].miles += record.total_miles || 0;
      mileageByJurisdiction[record.jurisdiction].months.push(record.month);

      if (record.external_vehicle_id) {
        mileageByJurisdiction[record.jurisdiction].vehicles.add(record.external_vehicle_id);
      }
    }

    // Convert sets to arrays and add state names
    const jurisdictionData = await Promise.all(
      Object.values(mileageByJurisdiction).map(async (item) => {
        // Get state name from our reference
        const stateName = getStateName(item.jurisdiction);
        return {
          ...item,
          stateName,
          vehicleCount: item.vehicles.size,
          vehicles: Array.from(item.vehicles),
          months: [...new Set(item.months)].sort()
        };
      })
    );

    // Sort by jurisdiction
    jurisdictionData.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));

    // Calculate totals
    const totalMiles = jurisdictionData.reduce((sum, j) => sum + j.miles, 0);

    return {
      error: false,
      hasEld: true,
      data: jurisdictionData,
      totalMiles,
      quarter,
      connectionId,
      lastSyncAt: connectionResult.data.last_sync_at
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get manual mileage data for a quarter (from State Mileage Tracker)
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in YYYY-QN format
 * @returns {Promise<object>} - Manual mileage data by jurisdiction
 */
export async function getManualMileageForQuarter(userId, quarter) {
  try {
    // Parse quarter to get date range
    const [year, qPart] = quarter.split('-Q');
    const quarterNum = parseInt(qPart);

    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
      return { error: true, errorMessage: 'Invalid quarter format' };
    }

    const startMonth = (quarterNum - 1) * 3;
    const startDate = new Date(parseInt(year), startMonth, 1);
    const endDate = new Date(parseInt(year), startMonth + 3, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get completed trips within the quarter
    const { data: trips, error: tripError } = await supabaseAdmin
      .from('driver_mileage_trips')
      .select('id, start_date, end_date, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .or(`start_date.gte.${startDateStr},end_date.gte.${startDateStr}`)
      .or(`start_date.lte.${endDateStr},end_date.lte.${endDateStr}`);

    if (tripError) {
      return { error: true, errorMessage: tripError.message };
    }

    if (!trips || trips.length === 0) {
      return {
        error: false,
        hasManual: false,
        data: [],
        message: 'No manual mileage trips for this quarter'
      };
    }

    // Get crossings for all trips
    const tripIds = trips.map(t => t.id);
    const { data: crossings, error: crossingError } = await supabaseAdmin
      .from('driver_mileage_crossings')
      .select('*')
      .in('trip_id', tripIds)
      .order('timestamp', { ascending: true });

    if (crossingError) {
      return { error: true, errorMessage: crossingError.message };
    }

    // Group crossings by trip and calculate state mileage
    const mileageByJurisdiction = {};

    const crossingsByTrip = {};
    for (const crossing of (crossings || [])) {
      if (!crossingsByTrip[crossing.trip_id]) {
        crossingsByTrip[crossing.trip_id] = [];
      }
      crossingsByTrip[crossing.trip_id].push(crossing);
    }

    // Calculate mileage for each trip
    for (const tripId of Object.keys(crossingsByTrip)) {
      const tripCrossings = crossingsByTrip[tripId].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      for (let i = 0; i < tripCrossings.length - 1; i++) {
        const currentState = tripCrossings[i].state;
        const currentOdometer = parseFloat(tripCrossings[i].odometer) || 0;
        const nextOdometer = parseFloat(tripCrossings[i + 1].odometer) || 0;
        const milesDriven = nextOdometer - currentOdometer;

        if (milesDriven > 0) {
          if (!mileageByJurisdiction[currentState]) {
            mileageByJurisdiction[currentState] = {
              jurisdiction: currentState,
              stateName: tripCrossings[i].state_name || getStateName(currentState),
              miles: 0,
              source: 'manual',
              tripCount: 0,
              tripIds: new Set()
            };
          }

          mileageByJurisdiction[currentState].miles += milesDriven;
          mileageByJurisdiction[currentState].tripIds.add(tripId);
        }
      }
    }

    // Convert to array
    const jurisdictionData = Object.values(mileageByJurisdiction).map(item => ({
      ...item,
      tripCount: item.tripIds.size,
      tripIds: Array.from(item.tripIds)
    }));

    // Sort by jurisdiction
    jurisdictionData.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));

    // Calculate totals
    const totalMiles = jurisdictionData.reduce((sum, j) => sum + j.miles, 0);

    return {
      error: false,
      hasManual: true,
      data: jurisdictionData,
      totalMiles,
      quarter,
      tripCount: trips.length
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get combined mileage data (ELD + Manual)
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in YYYY-QN format
 * @param {string} dataSource - 'eld' | 'manual' | 'combined'
 * @returns {Promise<object>} - Combined mileage data
 */
export async function getJurisdictionMileage(userId, quarter, dataSource = 'eld') {
  try {
    // Check user's subscription for ELD access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    const userPlan = subscription?.plan || 'basic';
    const hasEldAccess = hasFeature(userPlan, 'eldIftaSync');

    // Get both data sources
    const [eldResult, manualResult] = await Promise.all([
      hasEldAccess ? getEldMileageForQuarter(userId, quarter) : { hasEld: false, data: [] },
      getManualMileageForQuarter(userId, quarter)
    ]);

    // Handle data source selection
    if (dataSource === 'eld') {
      if (!hasEldAccess) {
        return {
          error: true,
          errorMessage: 'ELD IFTA sync requires Premium or higher plan'
        };
      }

      if (!eldResult.hasEld || eldResult.data.length === 0) {
        // Fall back to manual if no ELD data
        return {
          ...manualResult,
          dataSource: 'manual',
          fallback: true,
          fallbackReason: 'No ELD data available for this quarter'
        };
      }

      return {
        ...eldResult,
        dataSource: 'eld'
      };
    }

    if (dataSource === 'manual') {
      return {
        ...manualResult,
        dataSource: 'manual'
      };
    }

    // Combined mode - merge ELD and manual data
    if (dataSource === 'combined') {
      const combinedData = {};
      const overlaps = [];

      // Add ELD data first (primary)
      for (const item of (eldResult.data || [])) {
        combinedData[item.jurisdiction] = {
          ...item,
          eldMiles: item.miles,
          manualMiles: 0,
          combinedMiles: item.miles,
          sources: ['eld']
        };
      }

      // Add/merge manual data
      for (const item of (manualResult.data || [])) {
        if (combinedData[item.jurisdiction]) {
          // Overlap detected
          combinedData[item.jurisdiction].manualMiles = item.miles;
          combinedData[item.jurisdiction].sources.push('manual');

          // For combined, use ELD as primary (more accurate from GPS)
          // but note the overlap for review
          overlaps.push({
            jurisdiction: item.jurisdiction,
            stateName: item.stateName,
            eldMiles: combinedData[item.jurisdiction].eldMiles,
            manualMiles: item.miles,
            difference: combinedData[item.jurisdiction].eldMiles - item.miles
          });
        } else {
          // Only in manual
          combinedData[item.jurisdiction] = {
            ...item,
            eldMiles: 0,
            manualMiles: item.miles,
            combinedMiles: item.miles,
            sources: ['manual']
          };
        }
      }

      const jurisdictionData = Object.values(combinedData).sort((a, b) =>
        a.jurisdiction.localeCompare(b.jurisdiction)
      );

      const totalMiles = jurisdictionData.reduce((sum, j) => sum + j.combinedMiles, 0);

      return {
        error: false,
        dataSource: 'combined',
        data: jurisdictionData,
        totalMiles,
        quarter,
        overlaps,
        hasOverlaps: overlaps.length > 0,
        stats: {
          eldOnly: jurisdictionData.filter(j => j.sources.length === 1 && j.sources[0] === 'eld').length,
          manualOnly: jurisdictionData.filter(j => j.sources.length === 1 && j.sources[0] === 'manual').length,
          both: overlaps.length
        }
      };
    }

    return { error: true, errorMessage: 'Invalid data source' };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Import ELD mileage to IFTA trip records
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in YYYY-QN format
 * @returns {Promise<object>} - Import result
 */
export async function importEldMileageToIfta(userId, quarter) {
  try {
    // Get ELD mileage
    const eldResult = await getEldMileageForQuarter(userId, quarter);

    if (eldResult.error) {
      return eldResult;
    }

    if (!eldResult.hasEld || eldResult.data.length === 0) {
      return {
        error: true,
        errorMessage: 'No ELD mileage data available for this quarter'
      };
    }

    const createdRecords = [];
    const errors = [];

    // Parse quarter for dates
    const [year, qPart] = quarter.split('-Q');
    const quarterNum = parseInt(qPart);
    const startMonth = (quarterNum - 1) * 3;
    const midQuarterDate = new Date(parseInt(year), startMonth + 1, 15);

    // Create IFTA trip records for each jurisdiction
    for (const jurisdictionData of eldResult.data) {
      if (jurisdictionData.miles <= 0) continue;

      // Check if record already exists
      const { data: existing } = await supabaseAdmin
        .from('ifta_trip_records')
        .select('id')
        .eq('user_id', userId)
        .eq('quarter', quarter)
        .eq('start_jurisdiction', jurisdictionData.jurisdiction)
        .eq('end_jurisdiction', jurisdictionData.jurisdiction)
        .eq('is_eld_data', true)
        .single();

      const tripData = {
        user_id: userId,
        quarter: quarter,
        start_date: midQuarterDate.toISOString().split('T')[0],
        end_date: midQuarterDate.toISOString().split('T')[0],
        start_jurisdiction: jurisdictionData.jurisdiction,
        end_jurisdiction: jurisdictionData.jurisdiction,
        total_miles: Math.round(jurisdictionData.miles),
        gallons: 0,
        fuel_cost: 0,
        is_eld_data: true,
        eld_connection_id: eldResult.connectionId,
        notes: `ELD-synced mileage for ${jurisdictionData.stateName} (${jurisdictionData.jurisdiction}). Vehicles: ${jurisdictionData.vehicleCount}. Last sync: ${eldResult.lastSyncAt}`,
        updated_at: new Date().toISOString()
      };

      try {
        if (existing) {
          // Update existing
          const { data, error } = await supabaseAdmin
            .from('ifta_trip_records')
            .update(tripData)
            .eq('id', existing.id)
            .select();

          if (error) throw error;
          createdRecords.push({ ...data[0], updated: true });
        } else {
          // Create new
          tripData.created_at = new Date().toISOString();
          const { data, error } = await supabaseAdmin
            .from('ifta_trip_records')
            .insert([tripData])
            .select();

          if (error) throw error;
          createdRecords.push({ ...data[0], created: true });
        }
      } catch (err) {
        errors.push({
          jurisdiction: jurisdictionData.jurisdiction,
          error: err.message
        });
      }
    }

    return {
      success: true,
      recordsCreated: createdRecords.filter(r => r.created).length,
      recordsUpdated: createdRecords.filter(r => r.updated).length,
      records: createdRecords,
      errors,
      hasErrors: errors.length > 0
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get ELD mileage summary for IFTA dashboard
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter in YYYY-QN format
 * @returns {Promise<object>} - Summary with comparison
 */
export async function getEldMileageSummary(userId, quarter) {
  try {
    const [eldResult, manualResult] = await Promise.all([
      getEldMileageForQuarter(userId, quarter),
      getManualMileageForQuarter(userId, quarter)
    ]);

    const eldTotal = eldResult.data?.reduce((sum, j) => sum + j.miles, 0) || 0;
    const manualTotal = manualResult.data?.reduce((sum, j) => sum + j.miles, 0) || 0;

    const jurisdictionCount = new Set([
      ...(eldResult.data?.map(j => j.jurisdiction) || []),
      ...(manualResult.data?.map(j => j.jurisdiction) || [])
    ]).size;

    return {
      quarter,
      hasEld: eldResult.hasEld,
      hasManual: manualResult.hasManual,
      eldMiles: Math.round(eldTotal),
      manualMiles: Math.round(manualTotal),
      difference: Math.round(eldTotal - manualTotal),
      differencePercent: manualTotal > 0
        ? Math.round(((eldTotal - manualTotal) / manualTotal) * 100)
        : 0,
      jurisdictionCount,
      eldJurisdictions: eldResult.data?.length || 0,
      manualJurisdictions: manualResult.data?.length || 0,
      lastEldSync: eldResult.lastSyncAt,
      recommendation: getRecommendation(eldResult, manualResult)
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get recommendation for data source
 */
function getRecommendation(eldResult, manualResult) {
  if (eldResult.hasEld && eldResult.data?.length > 0) {
    if (!manualResult.hasManual || manualResult.data?.length === 0) {
      return {
        source: 'eld',
        reason: 'ELD data available and recommended for accuracy'
      };
    }
    return {
      source: 'eld',
      reason: 'ELD data recommended for GPS-verified accuracy. Manual data available as fallback.'
    };
  }

  if (manualResult.hasManual && manualResult.data?.length > 0) {
    return {
      source: 'manual',
      reason: 'No ELD data available. Using manual State Mileage Tracker data.'
    };
  }

  return {
    source: 'none',
    reason: 'No mileage data available. Connect an ELD provider or use the State Mileage Tracker.'
  };
}

/**
 * Get state name from jurisdiction code
 */
function getStateName(jurisdiction) {
  const stateNames = {
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
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
    // Canadian provinces
    'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba',
    'NB': 'New Brunswick', 'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia',
    'NT': 'Northwest Territories', 'NU': 'Nunavut', 'ON': 'Ontario',
    'PE': 'Prince Edward Island', 'QC': 'Quebec', 'SK': 'Saskatchewan', 'YT': 'Yukon',
    // Mexican states
    'MX': 'Mexico'
  };

  return stateNames[jurisdiction] || jurisdiction;
}

export default {
  getEldMileageForQuarter,
  getManualMileageForQuarter,
  getJurisdictionMileage,
  importEldMileageToIfta,
  getEldMileageSummary
};
