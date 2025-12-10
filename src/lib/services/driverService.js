// src/lib/services/driverService.js
import { supabase } from "../supabaseClient";
import { NotificationService, NOTIFICATION_TYPES, URGENCY_LEVELS } from "./notificationService";

/**
 * Fetch all drivers for the current user
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of driver objects
 */
export async function fetchDrivers(userId, filters = {}) {
  try {
    let query = supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId);
    
    // Apply filters if provided
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,license_number.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
 * Get driver by ID
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Driver ID
 * @returns {Promise<Object|null>} - Driver object or null
 */
export async function getDriverById(userId, id) {
  try {
    const { data, error } = await supabase
      .from('drivers')
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
 * Create a new driver
 * @param {Object} driverData - Driver data
 * @returns {Promise<Object|null>} - Created driver or null
 */
export async function createDriver(driverData) {
  try {
    // Prepare the data to match your existing database structure
    const preparedData = {
      user_id: driverData.user_id,
      name: driverData.name,
      position: driverData.position,
      email: driverData.email,
      phone: driverData.phone,
      license_number: driverData.license_number,
      license_state: driverData.license_state,
      license_expiry: driverData.license_expiry,
      medical_card_expiry: driverData.medical_card_expiry,
      status: driverData.status,
      hire_date: driverData.hire_date,
      city: driverData.city || null,
      state: driverData.state || null,
      emergency_contact: driverData.emergency_contact,
      emergency_phone: driverData.emergency_phone,
      image_url: driverData.image_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('drivers')
      .insert([preparedData])
      .select();

    if (error) throw error;

    const driver = data?.[0] || null;

    // Create notifications for expiring documents
    if (driver && driver.user_id) {
      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Check license expiry
        if (driver.license_expiry) {
          const licenseExpiry = new Date(driver.license_expiry);
          licenseExpiry.setHours(0, 0, 0, 0);
          const licenseDays = Math.ceil((licenseExpiry - now) / (1000 * 60 * 60 * 24));

          if (licenseDays <= 30) {
            const urgency = licenseDays <= 0 ? URGENCY_LEVELS.CRITICAL : licenseDays <= 7 ? URGENCY_LEVELS.HIGH : licenseDays <= 14 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: driver.user_id,
              title: `Driver License Expiring - ${driver.name}`,
              message: licenseDays <= 0
                ? `${driver.name}'s CDL has expired! Immediate action required.`
                : `${driver.name}'s CDL expires in ${licenseDays} day${licenseDays !== 1 ? 's' : ''}. Renewal required.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_LICENSE,
              entityType: 'driver',
              entityId: driver.id,
              linkTo: `/dashboard/fleet?tab=drivers`,
              dueDate: driver.license_expiry,
              urgency: urgency
            });
          }
        }

        // Check medical card expiry
        if (driver.medical_card_expiry) {
          const medicalExpiry = new Date(driver.medical_card_expiry);
          medicalExpiry.setHours(0, 0, 0, 0);
          const medicalDays = Math.ceil((medicalExpiry - now) / (1000 * 60 * 60 * 24));

          if (medicalDays <= 30) {
            const urgency = medicalDays <= 0 ? URGENCY_LEVELS.CRITICAL : medicalDays <= 7 ? URGENCY_LEVELS.HIGH : medicalDays <= 14 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: driver.user_id,
              title: `Medical Card Expiring - ${driver.name}`,
              message: medicalDays <= 0
                ? `${driver.name}'s medical card has expired! Immediate action required.`
                : `${driver.name}'s medical card expires in ${medicalDays} day${medicalDays !== 1 ? 's' : ''}. Renewal required.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_MEDICAL,
              entityType: 'driver',
              entityId: driver.id,
              linkTo: `/dashboard/fleet?tab=drivers`,
              dueDate: driver.medical_card_expiry,
              urgency: urgency
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to create driver document notification:', notifError);
      }
    }

    return driver;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing driver
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Driver ID
 * @param {Object} driverData - Updated driver data
 * @returns {Promise<Object|null>} - Updated driver or null
 */
export async function updateDriver(userId, id, driverData) {
  try {
    // Get old data to compare expiry date changes
    const { data: oldData } = await supabase
      .from('drivers')
      .select('name, user_id, license_expiry, medical_card_expiry')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    // Ensure we only update fields that match your existing schema
    const updateData = {
      name: driverData.name,
      position: driverData.position,
      email: driverData.email,
      phone: driverData.phone,
      license_number: driverData.license_number,
      license_state: driverData.license_state,
      license_expiry: driverData.license_expiry,
      medical_card_expiry: driverData.medical_card_expiry,
      status: driverData.status,
      hire_date: driverData.hire_date,
      city: driverData.city,
      state: driverData.state,
      emergency_contact: driverData.emergency_contact,
      emergency_phone: driverData.emergency_phone,
      image_url: driverData.image_url,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;

    const driver = data?.[0] || null;

    // Create notifications if expiry dates changed and are now within 30 days
    if (driver && oldData?.user_id) {
      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const driverName = driver.name || oldData.name;

        // Check if license expiry changed
        if (driver.license_expiry && driver.license_expiry !== oldData.license_expiry) {
          const licenseExpiry = new Date(driver.license_expiry);
          licenseExpiry.setHours(0, 0, 0, 0);
          const licenseDays = Math.ceil((licenseExpiry - now) / (1000 * 60 * 60 * 24));

          if (licenseDays <= 30) {
            const urgency = licenseDays <= 0 ? URGENCY_LEVELS.CRITICAL : licenseDays <= 7 ? URGENCY_LEVELS.HIGH : licenseDays <= 14 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: oldData.user_id,
              title: `Driver License Updated - ${driverName}`,
              message: licenseDays <= 0
                ? `${driverName}'s CDL has expired! Immediate action required.`
                : `${driverName}'s CDL expires in ${licenseDays} day${licenseDays !== 1 ? 's' : ''}. Renewal required.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_LICENSE,
              entityType: 'driver',
              entityId: driver.id,
              linkTo: `/dashboard/fleet?tab=drivers`,
              dueDate: driver.license_expiry,
              urgency: urgency
            });
          }
        }

        // Check if medical card expiry changed
        if (driver.medical_card_expiry && driver.medical_card_expiry !== oldData.medical_card_expiry) {
          const medicalExpiry = new Date(driver.medical_card_expiry);
          medicalExpiry.setHours(0, 0, 0, 0);
          const medicalDays = Math.ceil((medicalExpiry - now) / (1000 * 60 * 60 * 24));

          if (medicalDays <= 30) {
            const urgency = medicalDays <= 0 ? URGENCY_LEVELS.CRITICAL : medicalDays <= 7 ? URGENCY_LEVELS.HIGH : medicalDays <= 14 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: oldData.user_id,
              title: `Medical Card Updated - ${driverName}`,
              message: medicalDays <= 0
                ? `${driverName}'s medical card has expired! Immediate action required.`
                : `${driverName}'s medical card expires in ${medicalDays} day${medicalDays !== 1 ? 's' : ''}. Renewal required.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_DRIVER_MEDICAL,
              entityType: 'driver',
              entityId: driver.id,
              linkTo: `/dashboard/fleet?tab=drivers`,
              dueDate: driver.medical_card_expiry,
              urgency: urgency
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to create driver update notification:', notifError);
      }
    }

    return driver;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a driver
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Driver ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteDriver(userId, id) {
  try {
    const { error } = await supabase
      .from('drivers')
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
 * Upload driver image to Supabase storage
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null
 */
export async function uploadDriverImage(userId, file) {
  try {
    // Create a unique file path
    const filePath = `${userId}/drivers/${Date.now()}_${file.name}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('drivers')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('drivers')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    return null;
  }
}

/**
 * Check driver's document expiration status
 * @param {Object} driver - Driver object
 * @returns {Object} - Status indicators
 */
export function checkDriverDocumentStatus(driver) {
  const now = new Date();
  const licenseExpiry = new Date(driver.license_expiry);
  const medicalCardExpiry = new Date(driver.medical_card_expiry);
  
  // Days until expiration (negative if expired)
  const licenseExpiryDays = Math.floor((licenseExpiry - now) / (1000 * 60 * 60 * 24));
  const medicalCardExpiryDays = Math.floor((medicalCardExpiry - now) / (1000 * 60 * 60 * 24));
  
  return {
    licenseStatus: licenseExpiryDays < 0 ? 'expired' : 
                  licenseExpiryDays < 30 ? 'warning' : 'valid',
    licenseExpiryDays,
    medicalCardStatus: medicalCardExpiryDays < 0 ? 'expired' : 
                      medicalCardExpiryDays < 30 ? 'warning' : 'valid',
    medicalCardExpiryDays
  };
}

/**
 * Get driver statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Driver statistics
 */
export async function getDriverStats(userId) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, status, license_expiry, medical_card_expiry')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    const now = new Date();
    
    // Calculate stats
    const total = data?.length || 0;
    const active = data?.filter(d => d.status === 'Active').length || 0;
    const inactive = data?.filter(d => d.status === 'Inactive').length || 0;
    
    // Check for expiring documents (within 30 days)
    const expiringLicense = data?.filter(d => {
      const expiry = new Date(d.license_expiry);
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length || 0;
    
    const expiringMedical = data?.filter(d => {
      const expiry = new Date(d.medical_card_expiry);
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length || 0;
    
    return {
      total,
      active,
      inactive,
      expiringLicense,
      expiringMedical
    };
  } catch (error) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      expiringLicense: 0,
      expiringMedical: 0
    };
  }
}