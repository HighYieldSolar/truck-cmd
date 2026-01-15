/**
 * Jurisdiction Boundary Loader
 *
 * Loads US state and Canadian province GeoJSON boundaries
 * into the ifta_jurisdictions table for point-in-polygon queries.
 *
 * Uses simplified boundaries optimized for performance.
 */

import { supabase } from '@/lib/supabaseClient';
import {
  US_IFTA_JURISDICTIONS,
  CANADIAN_IFTA_JURISDICTIONS,
  NON_IFTA_JURISDICTIONS
} from './jurisdictionService';

// Public GeoJSON sources (simplified for performance)
const GEOJSON_SOURCES = {
  // US States - Census Bureau TIGER/Line simplified
  US_STATES: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json',
  // Canadian Provinces - Statistics Canada simplified
  CA_PROVINCES: 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/master/public/data/canada.geojson'
};

// State code mappings (some sources use different formats)
const US_STATE_NAME_TO_CODE = {
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

const CA_PROVINCE_NAME_TO_CODE = {
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Manitoba': 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Nova Scotia': 'NS',
  'Northwest Territories': 'NT',
  'Nunavut': 'NU',
  'Ontario': 'ON',
  'Prince Edward Island': 'PE',
  'Quebec': 'QC',
  'Saskatchewan': 'SK',
  'Yukon': 'YT'
};

// IFTA member status lookup
const IFTA_MEMBERS = new Set([
  ...US_IFTA_JURISDICTIONS.map(j => j.code),
  ...CANADIAN_IFTA_JURISDICTIONS.map(j => j.code)
]);

/**
 * Fetch GeoJSON from URL
 */
async function fetchGeoJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GeoJSON from ${url}:`, error);
    throw error;
  }
}

/**
 * Convert GeoJSON geometry to WKT for PostGIS
 */
function geometryToWKT(geometry) {
  if (!geometry) return null;

  const { type, coordinates } = geometry;

  if (type === 'Polygon') {
    const rings = coordinates.map(ring =>
      '(' + ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ') + ')'
    );
    return `SRID=4326;MULTIPOLYGON((${rings.join(', ')}))`;
  }

  if (type === 'MultiPolygon') {
    const polygons = coordinates.map(polygon => {
      const rings = polygon.map(ring =>
        '(' + ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ') + ')'
      );
      return '(' + rings.join(', ') + ')';
    });
    return `SRID=4326;MULTIPOLYGON(${polygons.join(', ')})`;
  }

  console.warn(`Unsupported geometry type: ${type}`);
  return null;
}

/**
 * Calculate centroid of a polygon
 */
function calculateCentroid(geometry) {
  if (!geometry || !geometry.coordinates) return null;

  let totalLat = 0;
  let totalLon = 0;
  let count = 0;

  const processCoords = (coords) => {
    if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      // MultiPolygon or Polygon with holes
      coords.forEach(processCoords);
    } else if (Array.isArray(coords[0])) {
      // Ring of coordinates
      coords.forEach(coord => {
        if (typeof coord[0] === 'number') {
          totalLon += coord[0];
          totalLat += coord[1];
          count++;
        }
      });
    }
  };

  processCoords(geometry.coordinates);

  if (count === 0) return null;

  return {
    latitude: totalLat / count,
    longitude: totalLon / count
  };
}

/**
 * Load US state boundaries into database
 */
export async function loadUSStateBoundaries() {
  console.log('Fetching US state boundaries...');

  const geojson = await fetchGeoJSON(GEOJSON_SOURCES.US_STATES);

  if (!geojson.features) {
    throw new Error('Invalid GeoJSON: no features found');
  }

  const records = [];

  for (const feature of geojson.features) {
    const name = feature.properties?.name;
    const code = US_STATE_NAME_TO_CODE[name];

    if (!code) {
      console.warn(`Unknown state: ${name}`);
      continue;
    }

    const centroid = calculateCentroid(feature.geometry);

    records.push({
      code,
      name,
      country: 'US',
      is_ifta_member: IFTA_MEMBERS.has(code),
      geometry: feature.geometry,
      centroid
    });
  }

  console.log(`Processed ${records.length} US states`);
  return records;
}

/**
 * Load Canadian province boundaries into database
 */
export async function loadCanadianProvinceBoundaries() {
  console.log('Fetching Canadian province boundaries...');

  const geojson = await fetchGeoJSON(GEOJSON_SOURCES.CA_PROVINCES);

  if (!geojson.features) {
    throw new Error('Invalid GeoJSON: no features found');
  }

  const records = [];

  for (const feature of geojson.features) {
    // Canadian GeoJSON may use different property names
    const name = feature.properties?.name ||
                 feature.properties?.NAME ||
                 feature.properties?.PRENAME;
    const code = CA_PROVINCE_NAME_TO_CODE[name];

    if (!code) {
      console.warn(`Unknown province: ${name}`);
      continue;
    }

    const centroid = calculateCentroid(feature.geometry);

    records.push({
      code,
      name,
      country: 'CA',
      is_ifta_member: IFTA_MEMBERS.has(code),
      geometry: feature.geometry,
      centroid
    });
  }

  console.log(`Processed ${records.length} Canadian provinces`);
  return records;
}

/**
 * Save jurisdiction boundaries to database using SQL
 * (Uses direct PostGIS geometry insertion)
 */
export async function saveJurisdictionBoundaries(records) {
  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    try {
      // Convert geometry to GeoJSON string for ST_GeomFromGeoJSON
      const geometryJson = JSON.stringify(record.geometry);
      const centroidWkt = record.centroid
        ? `SRID=4326;POINT(${record.centroid.longitude} ${record.centroid.latitude})`
        : null;

      // Use raw SQL with PostGIS functions
      const { error } = await supabase.rpc('upsert_jurisdiction_boundary', {
        p_code: record.code,
        p_name: record.name,
        p_country: record.country,
        p_boundary_geojson: geometryJson,
        p_centroid_wkt: centroidWkt,
        p_is_ifta_member: record.is_ifta_member
      });

      if (error) {
        console.error(`Error saving ${record.code}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`Exception saving ${record.code}:`, err);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

/**
 * Load all jurisdiction boundaries
 */
export async function loadAllBoundaries() {
  console.log('Starting boundary load...');

  // Load US states
  const usStates = await loadUSStateBoundaries();
  const usResult = await saveJurisdictionBoundaries(usStates);
  console.log(`US States: ${usResult.successCount} saved, ${usResult.errorCount} errors`);

  // Load Canadian provinces
  const caProvinces = await loadCanadianProvinceBoundaries();
  const caResult = await saveJurisdictionBoundaries(caProvinces);
  console.log(`CA Provinces: ${caResult.successCount} saved, ${caResult.errorCount} errors`);

  return {
    usStates: usResult,
    caProvinces: caResult,
    total: {
      successCount: usResult.successCount + caResult.successCount,
      errorCount: usResult.errorCount + caResult.errorCount
    }
  };
}

/**
 * Check if boundaries are loaded
 */
export async function checkBoundariesLoaded() {
  const { count, error } = await supabase
    .from('ifta_jurisdictions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error checking boundaries:', error);
    return { loaded: false, count: 0, error: error.message };
  }

  const expectedCount = US_IFTA_JURISDICTIONS.length + CANADIAN_IFTA_JURISDICTIONS.length;

  return {
    loaded: count >= expectedCount,
    count: count || 0,
    expected: expectedCount
  };
}

/**
 * Get boundary status summary
 */
export async function getBoundaryStatus() {
  const { data, error } = await supabase
    .from('ifta_jurisdictions')
    .select('country, count:code')
    .not('boundary', 'is', null);

  if (error) {
    return { error: error.message };
  }

  // Group by country
  const usBoundaries = (data || []).filter(d => d.country === 'US').length;
  const caBoundaries = (data || []).filter(d => d.country === 'CA').length;

  return {
    us: {
      loaded: usBoundaries,
      expected: US_IFTA_JURISDICTIONS.length + 2 // +2 for AK, HI
    },
    canada: {
      loaded: caBoundaries,
      expected: CANADIAN_IFTA_JURISDICTIONS.length + 3 // +3 for NT, NU, YT
    },
    total: usBoundaries + caBoundaries
  };
}

export default {
  loadUSStateBoundaries,
  loadCanadianProvinceBoundaries,
  saveJurisdictionBoundaries,
  loadAllBoundaries,
  checkBoundariesLoaded,
  getBoundaryStatus
};
