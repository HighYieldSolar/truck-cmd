// src/lib/services/truckService.js
import { supabase } from "../supabaseClient";
import { NotificationService, NOTIFICATION_TYPES, URGENCY_LEVELS } from "./notificationService";

/**
 * Fetch all trucks for the current user
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of truck objects
 */
export async function fetchTrucks(userId, filters = {}) {
  try {
    let query = supabase
      .from('vehicles')  // Use your actual table name
      .select('*')
      .eq('user_id', userId);
    
    // Apply filters if provided
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,vin.ilike.%${filters.search}%`);
    }
    
    if (filters.sortBy) {
      const order = filters.sortDirection === 'desc' ? { ascending: false } : { ascending: true };
      query = query.order(filters.sortBy, order);
    } else {
      // Default sort by name
      query = query.order('name', { ascending: true });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get truck by ID
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Truck ID
 * @returns {Promise<Object|null>} - Truck object or null
 */
export async function getTruckById(userId, id) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Create a new truck
 * @param {Object} truckData - Truck data
 * @returns {Promise<Object|null>} - Created truck or null
 */
export async function createTruck(truckData) {
  try {
    // Prepare the data to match the vehicles table structure
    const preparedData = {
      user_id: truckData.user_id,
      name: truckData.name,
      type: truckData.type || null,
      make: truckData.make,
      model: truckData.model,
      year: truckData.year ? parseInt(truckData.year, 10) : null,
      vin: truckData.vin || null,
      license_plate: truckData.license_plate || null,
      status: truckData.status || 'Active',
      color: truckData.color || null,
      mpg: truckData.mpg || null,
      fuel_type: truckData.fuel_type || null,
      tank_capacity: truckData.tank_capacity || null,
      notes: truckData.notes || null,
      image_url: truckData.image_url || null,
      // Compliance fields
      registration_expiry: truckData.registration_expiry || null,
      insurance_expiry: truckData.insurance_expiry || null,
      inspection_expiry: truckData.inspection_expiry || null,
      // Driver assignment
      assigned_driver_id: truckData.assigned_driver_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert([preparedData])
      .select();

    if (error) throw error;

    const truck = data?.[0] || null;

    // Create notifications for expiring compliance documents
    if (truck && truck.user_id) {
      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const truckName = truck.name || `${truck.make} ${truck.model}`;

        // Check registration expiry
        if (truck.registration_expiry) {
          const regExpiry = new Date(truck.registration_expiry);
          regExpiry.setHours(0, 0, 0, 0);
          const regDays = Math.ceil((regExpiry - now) / (1000 * 60 * 60 * 24));

          if (regDays <= 30) {
            const urgency = regDays <= 0 ? URGENCY_LEVELS.HIGH : regDays <= 7 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: truck.user_id,
              title: `Registration Expiring - ${truckName}`,
              message: regDays <= 0
                ? `${truckName}'s registration has expired! Immediate renewal required.`
                : `${truckName}'s registration expires in ${regDays} day${regDays !== 1 ? 's' : ''}. Renewal recommended.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
              entityType: 'vehicle',
              entityId: truck.id,
              linkTo: `/dashboard/fleet?tab=trucks`,
              dueDate: truck.registration_expiry,
              urgency: urgency
            });
          }
        }

        // Check insurance expiry
        if (truck.insurance_expiry) {
          const insExpiry = new Date(truck.insurance_expiry);
          insExpiry.setHours(0, 0, 0, 0);
          const insDays = Math.ceil((insExpiry - now) / (1000 * 60 * 60 * 24));

          if (insDays <= 30) {
            const urgency = insDays <= 0 ? URGENCY_LEVELS.CRITICAL : insDays <= 7 ? URGENCY_LEVELS.HIGH : insDays <= 14 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: truck.user_id,
              title: `Insurance Expiring - ${truckName}`,
              message: insDays <= 0
                ? `${truckName}'s insurance has expired! Immediate renewal required - vehicle may not be legally operated.`
                : `${truckName}'s insurance expires in ${insDays} day${insDays !== 1 ? 's' : ''}. Renewal required.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
              entityType: 'vehicle',
              entityId: truck.id,
              linkTo: `/dashboard/fleet?tab=trucks`,
              dueDate: truck.insurance_expiry,
              urgency: urgency
            });
          }
        }

        // Check inspection expiry
        if (truck.inspection_expiry) {
          const inspExpiry = new Date(truck.inspection_expiry);
          inspExpiry.setHours(0, 0, 0, 0);
          const inspDays = Math.ceil((inspExpiry - now) / (1000 * 60 * 60 * 24));

          if (inspDays <= 30) {
            const urgency = inspDays <= 0 ? URGENCY_LEVELS.HIGH : inspDays <= 7 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: truck.user_id,
              title: `Inspection Due - ${truckName}`,
              message: inspDays <= 0
                ? `${truckName}'s inspection has expired! Schedule inspection immediately.`
                : `${truckName}'s inspection expires in ${inspDays} day${inspDays !== 1 ? 's' : ''}. Schedule inspection soon.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
              entityType: 'vehicle',
              entityId: truck.id,
              linkTo: `/dashboard/fleet?tab=trucks`,
              dueDate: truck.inspection_expiry,
              urgency: urgency
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to create truck compliance notification:', notifError);
      }
    }

    return truck;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing truck
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Truck ID
 * @param {Object} truckData - Updated truck data
 * @returns {Promise<Object|null>} - Updated truck or null
 */
export async function updateTruck(userId, id, truckData) {
  try {
    // Get old data to compare expiry date changes
    const { data: oldData } = await supabase
      .from('vehicles')
      .select('name, make, model, user_id, registration_expiry, insurance_expiry, inspection_expiry')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    // Only include valid columns that exist in the vehicles table
    const validColumns = {
      name: truckData.name,
      type: truckData.type,
      make: truckData.make,
      model: truckData.model,
      year: truckData.year ? parseInt(truckData.year, 10) : null,
      vin: truckData.vin,
      license_plate: truckData.license_plate,
      status: truckData.status,
      color: truckData.color,
      mpg: truckData.mpg,
      fuel_type: truckData.fuel_type,
      tank_capacity: truckData.tank_capacity,
      notes: truckData.notes,
      image_url: truckData.image_url,
      // Compliance fields
      registration_expiry: truckData.registration_expiry,
      insurance_expiry: truckData.insurance_expiry,
      inspection_expiry: truckData.inspection_expiry,
      // Driver assignment
      assigned_driver_id: truckData.assigned_driver_id,
      updated_at: new Date().toISOString()
    };

    // Remove undefined/null keys to avoid overwriting with nulls
    const updateData = Object.fromEntries(
      Object.entries(validColumns).filter(([_, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;

    const truck = data?.[0] || null;

    // Create notifications if expiry dates changed and are now within 30 days
    if (truck && oldData?.user_id) {
      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const truckName = truck.name || oldData.name || `${truck.make || oldData.make} ${truck.model || oldData.model}`;

        // Helper function to check and create expiry notification
        const checkExpiryAndNotify = async (newExpiry, oldExpiry, docType, titlePrefix) => {
          if (newExpiry && newExpiry !== oldExpiry) {
            const expDate = new Date(newExpiry);
            expDate.setHours(0, 0, 0, 0);
            const days = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

            if (days <= 30) {
              const isInsurance = docType === 'insurance';
              const urgency = days <= 0
                ? (isInsurance ? URGENCY_LEVELS.CRITICAL : URGENCY_LEVELS.HIGH)
                : days <= 7
                  ? (isInsurance ? URGENCY_LEVELS.HIGH : URGENCY_LEVELS.MEDIUM)
                  : days <= 14
                    ? URGENCY_LEVELS.MEDIUM
                    : URGENCY_LEVELS.NORMAL;

              await NotificationService.createNotification({
                userId: oldData.user_id,
                title: `${titlePrefix} Updated - ${truckName}`,
                message: days <= 0
                  ? `${truckName}'s ${docType} has expired! Immediate action required.`
                  : `${truckName}'s ${docType} expires in ${days} day${days !== 1 ? 's' : ''}. Renewal required.`,
                type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
                entityType: 'vehicle',
                entityId: truck.id,
                linkTo: `/dashboard/fleet?tab=trucks`,
                dueDate: newExpiry,
                urgency: urgency
              });
            }
          }
        };

        // Check each expiry date
        await checkExpiryAndNotify(truck.registration_expiry, oldData.registration_expiry, 'registration', 'Registration');
        await checkExpiryAndNotify(truck.insurance_expiry, oldData.insurance_expiry, 'insurance', 'Insurance');
        await checkExpiryAndNotify(truck.inspection_expiry, oldData.inspection_expiry, 'inspection', 'Inspection');
      } catch (notifError) {
        console.error('Failed to create truck update notification:', notifError);
      }
    }

    return truck;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a truck
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Truck ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteTruck(userId, id) {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload truck image to Supabase storage
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null
 */
export async function uploadTruckImage(userId, file) {
  try {
    // Create a unique file path
    const filePath = `${userId}/trucks/${Date.now()}_${file.name}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    return null;
  }
}

/**
 * Get truck statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Truck statistics
 */
export async function getTruckStats(userId) {
  try {
    const { data, error } = await supabase
      .from('vehicles')  // Use your actual table name
      .select('id, status')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Calculate stats
    const total = data?.length || 0;
    const active = data?.filter(t => t.status === 'Active').length || 0;
    const maintenance = data?.filter(t => t.status === 'In Maintenance').length || 0;
    const outOfService = data?.filter(t => t.status === 'Out of Service').length || 0;
    
    return {
      total,
      active,
      maintenance,
      outOfService
    };
  } catch (error) {
    return {
      total: 0,
      active: 0,
      maintenance: 0,
      outOfService: 0
    };
  }
}