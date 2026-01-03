/**
 * ELD Entity Mapping Service
 *
 * Maps external ELD entity IDs (vehicles, drivers) to local Truck Command IDs.
 * Supports auto-matching by VIN, license plate, or name, as well as manual mapping.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for server-side operations
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

// ==========================================
// Vehicle Mapping
// ==========================================

/**
 * Map an external vehicle to a local vehicle
 * @param {string} userId - User ID
 * @param {string} connectionId - ELD connection ID
 * @param {object} externalVehicle - Vehicle data from ELD provider
 * @returns {Promise<object>} - Mapping result
 */
export async function mapVehicle(userId, connectionId, externalVehicle) {
  try {
    const { id: externalId, vin, licensePlate, name } = externalVehicle;

    // Check if mapping already exists
    const { data: existingMapping } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'vehicle')
      .eq('external_id', externalId)
      .single();

    if (existingMapping) {
      return { data: existingMapping, existing: true };
    }

    // Try to auto-match by VIN first (most reliable)
    let localVehicle = null;
    let matchConfidence = 0;
    let autoMatched = false;

    if (vin) {
      const { data: vinMatch } = await supabaseAdmin
        .from('vehicles')
        .select('id, name, vin')
        .eq('user_id', userId)
        .eq('vin', vin.toUpperCase())
        .single();

      if (vinMatch) {
        localVehicle = vinMatch;
        matchConfidence = 1.0; // Perfect VIN match
        autoMatched = true;
      }
    }

    // Try license plate if no VIN match
    if (!localVehicle && licensePlate) {
      const normalizedPlate = licensePlate.replace(/\s|-/g, '').toUpperCase();
      const { data: plateMatch } = await supabaseAdmin
        .from('vehicles')
        .select('id, name, license_plate')
        .eq('user_id', userId)
        .ilike('license_plate', `%${normalizedPlate}%`)
        .single();

      if (plateMatch) {
        localVehicle = plateMatch;
        matchConfidence = 0.9; // High confidence plate match
        autoMatched = true;
      }
    }

    // Try name similarity if no other match
    if (!localVehicle && name) {
      const { data: vehicles } = await supabaseAdmin
        .from('vehicles')
        .select('id, name')
        .eq('user_id', userId);

      if (vehicles) {
        const nameMatch = vehicles.find(v =>
          v.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(v.name.toLowerCase())
        );

        if (nameMatch) {
          localVehicle = nameMatch;
          matchConfidence = 0.7; // Lower confidence name match
          autoMatched = true;
        }
      }
    }

    // Create mapping if we found a match
    if (localVehicle) {
      const { data, error } = await supabaseAdmin
        .from('eld_entity_mappings')
        .insert({
          user_id: userId,
          connection_id: connectionId,
          entity_type: 'vehicle',
          local_id: localVehicle.id,
          external_id: externalId,
          provider: 'terminal',
          external_name: name,
          auto_matched: autoMatched,
          match_confidence: matchConfidence,
          metadata: {
            vin,
            licensePlate,
            matchedBy: matchConfidence === 1.0 ? 'vin' : matchConfidence === 0.9 ? 'license_plate' : 'name'
          }
        })
        .select()
        .single();

      if (error) {
        return { error: true, errorMessage: error.message };
      }

      // Update vehicle with ELD external ID
      await supabaseAdmin
        .from('vehicles')
        .update({
          eld_external_id: externalId,
          eld_provider: 'terminal'
        })
        .eq('id', localVehicle.id);

      return { data, autoMatched: true, confidence: matchConfidence };
    }

    // No match found - return external vehicle info for manual mapping
    return {
      noMatch: true,
      externalVehicle: {
        externalId,
        vin,
        licensePlate,
        name
      }
    };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Manually map a vehicle
 * @param {string} userId - User ID
 * @param {string} connectionId - ELD connection ID
 * @param {string} externalId - External vehicle ID
 * @param {string} localId - Local vehicle UUID
 * @param {object} externalData - External vehicle data
 * @returns {Promise<object>} - Mapping result
 */
export async function manualMapVehicle(userId, connectionId, externalId, localId, externalData = {}) {
  try {
    // Verify the local vehicle belongs to this user
    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('id, user_id')
      .eq('id', localId)
      .single();

    if (!vehicle || vehicle.user_id !== userId) {
      return { error: true, errorMessage: 'Vehicle not found or access denied' };
    }

    // Check if mapping already exists
    const { data: existing } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'vehicle')
      .eq('external_id', externalId)
      .single();

    if (existing) {
      // Update existing mapping
      const { data, error } = await supabaseAdmin
        .from('eld_entity_mappings')
        .update({
          local_id: localId,
          auto_matched: false,
          match_confidence: 1.0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return { error: true, errorMessage: error.message };
      }

      return { data, updated: true };
    }

    // Create new mapping
    const { data, error } = await supabaseAdmin
      .from('eld_entity_mappings')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        entity_type: 'vehicle',
        local_id: localId,
        external_id: externalId,
        provider: 'terminal',
        external_name: externalData.name,
        auto_matched: false,
        match_confidence: 1.0,
        metadata: externalData
      })
      .select()
      .single();

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Update vehicle with ELD external ID
    await supabaseAdmin
      .from('vehicles')
      .update({
        eld_external_id: externalId,
        eld_provider: 'terminal'
      })
      .eq('id', localId);

    return { data };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// Driver Mapping
// ==========================================

/**
 * Map an external driver to a local driver
 * @param {string} userId - User ID
 * @param {string} connectionId - ELD connection ID
 * @param {object} externalDriver - Driver data from ELD provider
 * @returns {Promise<object>} - Mapping result
 */
export async function mapDriver(userId, connectionId, externalDriver) {
  try {
    const { id: externalId, firstName, lastName, name, licenseNumber, email, phone } = externalDriver;
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();

    // Check if mapping already exists
    const { data: existingMapping } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'driver')
      .eq('external_id', externalId)
      .single();

    if (existingMapping) {
      return { data: existingMapping, existing: true };
    }

    // Try to auto-match by license number first
    let localDriver = null;
    let matchConfidence = 0;
    let autoMatched = false;

    if (licenseNumber) {
      const normalizedLicense = licenseNumber.replace(/\s|-/g, '').toUpperCase();
      const { data: licenseMatch } = await supabaseAdmin
        .from('drivers')
        .select('id, name, license_number')
        .eq('user_id', userId)
        .ilike('license_number', `%${normalizedLicense}%`)
        .single();

      if (licenseMatch) {
        localDriver = licenseMatch;
        matchConfidence = 1.0; // Perfect license match
        autoMatched = true;
      }
    }

    // Try email match
    if (!localDriver && email) {
      const { data: emailMatch } = await supabaseAdmin
        .from('drivers')
        .select('id, name, email')
        .eq('user_id', userId)
        .ilike('email', email)
        .single();

      if (emailMatch) {
        localDriver = emailMatch;
        matchConfidence = 0.95; // High confidence email match
        autoMatched = true;
      }
    }

    // Try phone match
    if (!localDriver && phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const { data: drivers } = await supabaseAdmin
        .from('drivers')
        .select('id, name, phone')
        .eq('user_id', userId);

      if (drivers) {
        const phoneMatch = drivers.find(d =>
          d.phone && d.phone.replace(/\D/g, '') === normalizedPhone
        );
        if (phoneMatch) {
          localDriver = phoneMatch;
          matchConfidence = 0.9;
          autoMatched = true;
        }
      }
    }

    // Try name similarity
    if (!localDriver && fullName) {
      const { data: drivers } = await supabaseAdmin
        .from('drivers')
        .select('id, name')
        .eq('user_id', userId);

      if (drivers) {
        const nameMatch = drivers.find(d => {
          const localName = d.name.toLowerCase();
          const extName = fullName.toLowerCase();
          return localName === extName ||
            localName.includes(extName) ||
            extName.includes(localName);
        });

        if (nameMatch) {
          localDriver = nameMatch;
          matchConfidence = 0.7;
          autoMatched = true;
        }
      }
    }

    // Create mapping if we found a match
    if (localDriver) {
      const { data, error } = await supabaseAdmin
        .from('eld_entity_mappings')
        .insert({
          user_id: userId,
          connection_id: connectionId,
          entity_type: 'driver',
          local_id: localDriver.id,
          external_id: externalId,
          provider: 'terminal',
          external_name: fullName,
          auto_matched: autoMatched,
          match_confidence: matchConfidence,
          metadata: {
            firstName,
            lastName,
            licenseNumber,
            email,
            phone,
            matchedBy: matchConfidence === 1.0 ? 'license' :
              matchConfidence === 0.95 ? 'email' :
                matchConfidence === 0.9 ? 'phone' : 'name'
          }
        })
        .select()
        .single();

      if (error) {
        return { error: true, errorMessage: error.message };
      }

      // Update driver with ELD external ID
      await supabaseAdmin
        .from('drivers')
        .update({
          eld_external_id: externalId,
          eld_provider: 'terminal'
        })
        .eq('id', localDriver.id);

      return { data, autoMatched: true, confidence: matchConfidence };
    }

    // No match found
    return {
      noMatch: true,
      externalDriver: {
        externalId,
        name: fullName,
        firstName,
        lastName,
        licenseNumber,
        email,
        phone
      }
    };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Manually map a driver
 * @param {string} userId - User ID
 * @param {string} connectionId - ELD connection ID
 * @param {string} externalId - External driver ID
 * @param {string} localId - Local driver UUID
 * @param {object} externalData - External driver data
 * @returns {Promise<object>} - Mapping result
 */
export async function manualMapDriver(userId, connectionId, externalId, localId, externalData = {}) {
  try {
    // Verify the local driver belongs to this user
    const { data: driver } = await supabaseAdmin
      .from('drivers')
      .select('id, user_id')
      .eq('id', localId)
      .single();

    if (!driver || driver.user_id !== userId) {
      return { error: true, errorMessage: 'Driver not found or access denied' };
    }

    // Check if mapping already exists
    const { data: existing } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'driver')
      .eq('external_id', externalId)
      .single();

    if (existing) {
      // Update existing mapping
      const { data, error } = await supabaseAdmin
        .from('eld_entity_mappings')
        .update({
          local_id: localId,
          auto_matched: false,
          match_confidence: 1.0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return { error: true, errorMessage: error.message };
      }

      return { data, updated: true };
    }

    // Create new mapping
    const { data, error } = await supabaseAdmin
      .from('eld_entity_mappings')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        entity_type: 'driver',
        local_id: localId,
        external_id: externalId,
        provider: 'terminal',
        external_name: externalData.name,
        auto_matched: false,
        match_confidence: 1.0,
        metadata: externalData
      })
      .select()
      .single();

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Update driver with ELD external ID
    await supabaseAdmin
      .from('drivers')
      .update({
        eld_external_id: externalId,
        eld_provider: 'terminal'
      })
      .eq('id', localId);

    return { data };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// Lookup Functions
// ==========================================

/**
 * Get local vehicle ID from external ID
 * @param {string} userId - User ID
 * @param {string} externalId - External vehicle ID
 * @returns {Promise<string|null>} - Local vehicle UUID or null
 */
export async function getLocalVehicleId(userId, externalId) {
  try {
    const { data } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('local_id')
      .eq('user_id', userId)
      .eq('entity_type', 'vehicle')
      .eq('external_id', externalId)
      .single();

    return data?.local_id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get local driver ID from external ID
 * @param {string} userId - User ID
 * @param {string} externalId - External driver ID
 * @returns {Promise<string|null>} - Local driver UUID or null
 */
export async function getLocalDriverId(userId, externalId) {
  try {
    const { data } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('local_id')
      .eq('user_id', userId)
      .eq('entity_type', 'driver')
      .eq('external_id', externalId)
      .single();

    return data?.local_id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get external vehicle ID from local ID
 * @param {string} connectionId - Connection ID
 * @param {string} localId - Local vehicle UUID
 * @returns {Promise<string|null>} - External vehicle ID or null
 */
export async function getExternalVehicleId(connectionId, localId) {
  try {
    const { data } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('external_id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'vehicle')
      .eq('local_id', localId)
      .single();

    return data?.external_id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all unmapped vehicles from ELD
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection ID
 * @param {array} externalVehicles - Array of external vehicles
 * @returns {Promise<array>} - Unmapped vehicles
 */
export async function getUnmappedVehicles(userId, connectionId, externalVehicles) {
  try {
    const { data: mappings } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('external_id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'vehicle');

    const mappedIds = new Set(mappings?.map(m => m.external_id) || []);
    return externalVehicles.filter(v => !mappedIds.has(v.id));
  } catch (error) {
    return externalVehicles;
  }
}

/**
 * Get all unmapped drivers from ELD
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection ID
 * @param {array} externalDrivers - Array of external drivers
 * @returns {Promise<array>} - Unmapped drivers
 */
export async function getUnmappedDrivers(userId, connectionId, externalDrivers) {
  try {
    const { data: mappings } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('external_id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'driver');

    const mappedIds = new Set(mappings?.map(m => m.external_id) || []);
    return externalDrivers.filter(d => !mappedIds.has(d.id));
  } catch (error) {
    return externalDrivers;
  }
}

/**
 * Get all mappings for a connection
 * @param {string} connectionId - Connection ID
 * @param {string} entityType - 'vehicle' or 'driver' (optional)
 * @returns {Promise<object>} - Mappings
 */
export async function getMappings(connectionId, entityType = null) {
  try {
    let query = supabaseAdmin
      .from('eld_entity_mappings')
      .select('*')
      .eq('connection_id', connectionId);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Delete a mapping
 * @param {string} userId - User ID
 * @param {string} mappingId - Mapping UUID
 * @returns {Promise<object>} - Success status
 */
export async function deleteMapping(userId, mappingId) {
  try {
    const { data: mapping } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('id, user_id, entity_type, local_id')
      .eq('id', mappingId)
      .single();

    if (!mapping || mapping.user_id !== userId) {
      return { error: true, errorMessage: 'Mapping not found or access denied' };
    }

    // Clear ELD external ID from the entity
    const table = mapping.entity_type === 'vehicle' ? 'vehicles' : 'drivers';
    await supabaseAdmin
      .from(table)
      .update({
        eld_external_id: null,
        eld_provider: null
      })
      .eq('id', mapping.local_id);

    // Delete the mapping
    const { error } = await supabaseAdmin
      .from('eld_entity_mappings')
      .delete()
      .eq('id', mappingId);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Auto-match all vehicles from ELD to local vehicles
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection ID
 * @param {array} externalVehicles - Array of external vehicles
 * @returns {Promise<object>} - Match results
 */
export async function autoMatchVehicles(userId, connectionId, externalVehicles) {
  const results = {
    matched: [],
    unmatched: [],
    errors: []
  };

  for (const vehicle of externalVehicles) {
    const result = await mapVehicle(userId, connectionId, vehicle);

    if (result.error) {
      results.errors.push({ vehicle, error: result.errorMessage });
    } else if (result.noMatch) {
      results.unmatched.push(result.externalVehicle);
    } else {
      results.matched.push({
        external: vehicle,
        mapping: result.data,
        confidence: result.confidence
      });
    }
  }

  return results;
}

/**
 * Auto-match all drivers from ELD to local drivers
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection ID
 * @param {array} externalDrivers - Array of external drivers
 * @returns {Promise<object>} - Match results
 */
export async function autoMatchDrivers(userId, connectionId, externalDrivers) {
  const results = {
    matched: [],
    unmatched: [],
    errors: []
  };

  for (const driver of externalDrivers) {
    const result = await mapDriver(userId, connectionId, driver);

    if (result.error) {
      results.errors.push({ driver, error: result.errorMessage });
    } else if (result.noMatch) {
      results.unmatched.push(result.externalDriver);
    } else {
      results.matched.push({
        external: driver,
        mapping: result.data,
        confidence: result.confidence
      });
    }
  }

  return results;
}

export default {
  mapVehicle,
  manualMapVehicle,
  mapDriver,
  manualMapDriver,
  getLocalVehicleId,
  getLocalDriverId,
  getExternalVehicleId,
  getUnmappedVehicles,
  getUnmappedDrivers,
  getMappings,
  deleteMapping,
  autoMatchVehicles,
  autoMatchDrivers
};
