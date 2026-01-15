import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// US States with IFTA membership
const US_STATES = [
  { code: 'AL', name: 'Alabama', ifta: true },
  { code: 'AK', name: 'Alaska', ifta: false },
  { code: 'AZ', name: 'Arizona', ifta: true },
  { code: 'AR', name: 'Arkansas', ifta: true },
  { code: 'CA', name: 'California', ifta: true },
  { code: 'CO', name: 'Colorado', ifta: true },
  { code: 'CT', name: 'Connecticut', ifta: true },
  { code: 'DE', name: 'Delaware', ifta: true },
  { code: 'DC', name: 'District of Columbia', ifta: true },
  { code: 'FL', name: 'Florida', ifta: true },
  { code: 'GA', name: 'Georgia', ifta: true },
  { code: 'HI', name: 'Hawaii', ifta: false },
  { code: 'ID', name: 'Idaho', ifta: true },
  { code: 'IL', name: 'Illinois', ifta: true },
  { code: 'IN', name: 'Indiana', ifta: true },
  { code: 'IA', name: 'Iowa', ifta: true },
  { code: 'KS', name: 'Kansas', ifta: true },
  { code: 'KY', name: 'Kentucky', ifta: true },
  { code: 'LA', name: 'Louisiana', ifta: true },
  { code: 'ME', name: 'Maine', ifta: true },
  { code: 'MD', name: 'Maryland', ifta: true },
  { code: 'MA', name: 'Massachusetts', ifta: true },
  { code: 'MI', name: 'Michigan', ifta: true },
  { code: 'MN', name: 'Minnesota', ifta: true },
  { code: 'MS', name: 'Mississippi', ifta: true },
  { code: 'MO', name: 'Missouri', ifta: true },
  { code: 'MT', name: 'Montana', ifta: true },
  { code: 'NE', name: 'Nebraska', ifta: true },
  { code: 'NV', name: 'Nevada', ifta: true },
  { code: 'NH', name: 'New Hampshire', ifta: true },
  { code: 'NJ', name: 'New Jersey', ifta: true },
  { code: 'NM', name: 'New Mexico', ifta: true },
  { code: 'NY', name: 'New York', ifta: true },
  { code: 'NC', name: 'North Carolina', ifta: true },
  { code: 'ND', name: 'North Dakota', ifta: true },
  { code: 'OH', name: 'Ohio', ifta: true },
  { code: 'OK', name: 'Oklahoma', ifta: true },
  { code: 'OR', name: 'Oregon', ifta: true },
  { code: 'PA', name: 'Pennsylvania', ifta: true },
  { code: 'RI', name: 'Rhode Island', ifta: true },
  { code: 'SC', name: 'South Carolina', ifta: true },
  { code: 'SD', name: 'South Dakota', ifta: true },
  { code: 'TN', name: 'Tennessee', ifta: true },
  { code: 'TX', name: 'Texas', ifta: true },
  { code: 'UT', name: 'Utah', ifta: true },
  { code: 'VT', name: 'Vermont', ifta: true },
  { code: 'VA', name: 'Virginia', ifta: true },
  { code: 'WA', name: 'Washington', ifta: true },
  { code: 'WV', name: 'West Virginia', ifta: true },
  { code: 'WI', name: 'Wisconsin', ifta: true },
  { code: 'WY', name: 'Wyoming', ifta: true }
];

// Canadian Provinces with IFTA membership
const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta', ifta: true },
  { code: 'BC', name: 'British Columbia', ifta: true },
  { code: 'MB', name: 'Manitoba', ifta: true },
  { code: 'NB', name: 'New Brunswick', ifta: true },
  { code: 'NL', name: 'Newfoundland and Labrador', ifta: true },
  { code: 'NS', name: 'Nova Scotia', ifta: true },
  { code: 'NT', name: 'Northwest Territories', ifta: false },
  { code: 'NU', name: 'Nunavut', ifta: false },
  { code: 'ON', name: 'Ontario', ifta: true },
  { code: 'PE', name: 'Prince Edward Island', ifta: true },
  { code: 'QC', name: 'Quebec', ifta: true },
  { code: 'SK', name: 'Saskatchewan', ifta: true },
  { code: 'YT', name: 'Yukon', ifta: false }
];

// State name to code mapping for GeoJSON parsing
const STATE_NAME_TO_CODE = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
  'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
  'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
  'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
  'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
  'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

const PROVINCE_NAME_TO_CODE = {
  'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB',
  'New Brunswick': 'NB', 'Newfoundland and Labrador': 'NL', 'Nova Scotia': 'NS',
  'Northwest Territories': 'NT', 'Nunavut': 'NU', 'Ontario': 'ON',
  'Prince Edward Island': 'PE', 'Quebec': 'QC', 'Saskatchewan': 'SK', 'Yukon': 'YT'
};

/**
 * POST /api/ifta/boundaries/load
 * Load jurisdiction boundaries from public GeoJSON sources
 */
export async function POST(request) {
  try {
    const results = {
      us: { success: 0, errors: [] },
      canada: { success: 0, errors: [] }
    };

    // Fetch US States GeoJSON
    console.log('Fetching US states GeoJSON...');
    const usResponse = await fetch(
      'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
    );

    if (!usResponse.ok) {
      throw new Error(`Failed to fetch US states: ${usResponse.status}`);
    }

    const usGeoJson = await usResponse.json();

    // Process US states
    for (const feature of usGeoJson.features) {
      const stateName = feature.properties?.name;
      const stateCode = STATE_NAME_TO_CODE[stateName];

      if (!stateCode) {
        results.us.errors.push(`Unknown state: ${stateName}`);
        continue;
      }

      const stateInfo = US_STATES.find(s => s.code === stateCode);
      const geometryJson = JSON.stringify(feature.geometry);

      try {
        const { error } = await supabaseAdmin.rpc('upsert_jurisdiction_boundary', {
          p_code: stateCode,
          p_name: stateName,
          p_country: 'US',
          p_boundary_geojson: geometryJson,
          p_centroid_wkt: null,
          p_is_ifta_member: stateInfo?.ifta ?? true
        });

        if (error) {
          results.us.errors.push(`${stateCode}: ${error.message}`);
        } else {
          results.us.success++;
        }
      } catch (err) {
        results.us.errors.push(`${stateCode}: ${err.message}`);
      }
    }

    // Fetch Canadian provinces GeoJSON
    console.log('Fetching Canadian provinces GeoJSON...');
    const caResponse = await fetch(
      'https://raw.githubusercontent.com/codeforgermany/click_that_hood/master/public/data/canada.geojson'
    );

    if (!caResponse.ok) {
      throw new Error(`Failed to fetch Canadian provinces: ${caResponse.status}`);
    }

    const caGeoJson = await caResponse.json();

    // Process Canadian provinces
    for (const feature of caGeoJson.features) {
      const provinceName = feature.properties?.name || feature.properties?.NAME;
      const provinceCode = PROVINCE_NAME_TO_CODE[provinceName];

      if (!provinceCode) {
        results.canada.errors.push(`Unknown province: ${provinceName}`);
        continue;
      }

      const provinceInfo = CA_PROVINCES.find(p => p.code === provinceCode);
      const geometryJson = JSON.stringify(feature.geometry);

      try {
        const { error } = await supabaseAdmin.rpc('upsert_jurisdiction_boundary', {
          p_code: provinceCode,
          p_name: provinceName,
          p_country: 'CA',
          p_boundary_geojson: geometryJson,
          p_centroid_wkt: null,
          p_is_ifta_member: provinceInfo?.ifta ?? true
        });

        if (error) {
          results.canada.errors.push(`${provinceCode}: ${error.message}`);
        } else {
          results.canada.success++;
        }
      } catch (err) {
        results.canada.errors.push(`${provinceCode}: ${err.message}`);
      }
    }

    const totalSuccess = results.us.success + results.canada.success;
    const totalErrors = results.us.errors.length + results.canada.errors.length;

    return NextResponse.json({
      success: true,
      message: `Loaded ${totalSuccess} jurisdictions with ${totalErrors} errors`,
      results
    });

  } catch (error) {
    console.error('Error loading boundaries:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/ifta/boundaries/load
 * Check boundary loading status
 */
export async function GET(request) {
  try {
    // Count loaded boundaries
    const { data, error } = await supabaseAdmin
      .from('ifta_jurisdictions')
      .select('code, name, country, is_ifta_member')
      .not('boundary', 'is', null);

    if (error) {
      throw error;
    }

    const us = (data || []).filter(j => j.country === 'US');
    const canada = (data || []).filter(j => j.country === 'CA');
    const iftaMembers = (data || []).filter(j => j.is_ifta_member);

    return NextResponse.json({
      success: true,
      status: {
        loaded: data?.length || 0,
        us: {
          loaded: us.length,
          expected: US_STATES.length
        },
        canada: {
          loaded: canada.length,
          expected: CA_PROVINCES.length
        },
        iftaMembers: iftaMembers.length,
        isComplete: (data?.length || 0) >= (US_STATES.length + CA_PROVINCES.length - 5) // Allow some missing
      },
      jurisdictions: data
    });

  } catch (error) {
    console.error('Error checking boundaries:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
