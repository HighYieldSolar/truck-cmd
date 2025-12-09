import { supabase } from "@/lib/supabaseClient";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import { NotificationService, NOTIFICATION_TYPES, URGENCY_LEVELS } from "./notificationService";

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Fetch all compliance items for a user with optional filters
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - List of compliance items
 */
export async function fetchComplianceItems(userId, filters = {}) {
  try {
    let query = supabase
      .from("compliance_items")
      .select("*")
      .eq("user_id", userId)
      .order("expiration_date", { ascending: true });

    // Apply optional filters
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    if (filters.compliance_type && filters.compliance_type !== 'All') {
      query = query.eq('compliance_type', filters.compliance_type);
    }
    if (filters.entity_type && filters.entity_type !== 'All') {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,entity_name.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw {
      code: error.code || 'FETCH_FAILED',
      message: getUserFriendlyError(error),
      context: 'fetching compliance items'
    };
  }
}

/**
 * Get compliance statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Statistics object
 */
export async function getComplianceStats(userId) {
  try {
    const { data, error } = await supabase
      .from("compliance_items")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    const items = data || [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      total: items.length,
      active: items.filter(item => item.status === 'Active').length,
      expiringSoon: items.filter(item => {
        if (!item.expiration_date) return false;
        const expDate = new Date(item.expiration_date);
        return expDate > now && expDate <= thirtyDaysFromNow;
      }).length,
      expired: items.filter(item => {
        if (!item.expiration_date) return false;
        const expDate = new Date(item.expiration_date);
        return expDate <= now || item.status === 'Expired';
      }).length,
      pending: items.filter(item => item.status === 'Pending').length
    };
  } catch (error) {
    // Stats errors shouldn't block main functionality
    return {
      total: 0,
      active: 0,
      expiringSoon: 0,
      expired: 0,
      pending: 0
    };
  }
}

/**
 * Get items expiring soon (within 30 days)
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} - List of expiring items
 */
export async function getExpiringItems(userId, limit = 5) {
  try {
    const now = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("compliance_items")
      .select("*")
      .eq("user_id", userId)
      .gte("expiration_date", now)
      .lte("expiration_date", thirtyDaysFromNow)
      .order("expiration_date", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Create a new compliance item
 * @param {object} complianceData - Compliance data to create
 * @returns {Promise<object>} - Created compliance item
 */
export async function createComplianceItem(complianceData) {
  try {
    const { data, error } = await supabase
      .from('compliance_items')
      .insert([{
        ...complianceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create notification if item is expiring soon (within 30 days)
    if (data && data.expiration_date && data.user_id) {
      try {
        const daysUntil = getDaysUntilExpiration(data.expiration_date);
        if (daysUntil !== null && daysUntil <= 30) {
          const urgency = daysUntil <= 7 ? URGENCY_LEVELS.HIGH : daysUntil <= 14 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
          await NotificationService.createNotification({
            userId: data.user_id,
            title: `Compliance Item Added - ${data.title}`,
            message: daysUntil <= 0
              ? `${data.title} for ${data.entity_name || 'your business'} has expired! Immediate action required.`
              : `${data.title} for ${data.entity_name || 'your business'} expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. Renewal recommended.`,
            type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
            entityType: 'compliance',
            entityId: data.id,
            linkTo: `/dashboard/compliance`,
            dueDate: data.expiration_date,
            urgency: urgency
          });
        }
      } catch (notifError) {
        console.error('Failed to create compliance notification:', notifError);
      }
    }

    return data;
  } catch (error) {
    throw {
      code: error.code || 'CREATE_FAILED',
      message: getUserFriendlyError(error),
      context: 'creating compliance item'
    };
  }
}

/**
 * Update an existing compliance item
 * @param {string} id - Compliance item ID
 * @param {object} complianceData - Updated compliance data
 * @returns {Promise<object>} - Updated compliance item
 */
export async function updateComplianceItem(id, complianceData) {
  try {
    // Get the old data first to check for status changes
    const { data: oldData } = await supabase
      .from('compliance_items')
      .select('status, expiration_date, title, entity_name, user_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('compliance_items')
      .update({
        ...complianceData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create notification if expiration date changed and item is now expiring soon
    if (data && data.user_id && data.expiration_date) {
      try {
        const oldExpDate = oldData?.expiration_date;
        const newExpDate = data.expiration_date;

        // Only notify if expiration date was changed or extended
        if (oldExpDate !== newExpDate) {
          const daysUntil = getDaysUntilExpiration(newExpDate);
          if (daysUntil !== null && daysUntil <= 30) {
            const urgency = daysUntil <= 7 ? URGENCY_LEVELS.HIGH : daysUntil <= 14 ? URGENCY_LEVELS.MEDIUM : URGENCY_LEVELS.NORMAL;
            await NotificationService.createNotification({
              userId: data.user_id,
              title: `Compliance Updated - ${data.title}`,
              message: daysUntil <= 0
                ? `${data.title} for ${data.entity_name || 'your business'} has expired! Immediate action required.`
                : `${data.title} for ${data.entity_name || 'your business'} now expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`,
              type: NOTIFICATION_TYPES.DOCUMENT_EXPIRY_COMPLIANCE,
              entityType: 'compliance',
              entityId: data.id,
              linkTo: `/dashboard/compliance`,
              dueDate: data.expiration_date,
              urgency: urgency
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to create compliance update notification:', notifError);
      }
    }

    return data;
  } catch (error) {
    throw {
      code: error.code || 'UPDATE_FAILED',
      message: getUserFriendlyError(error),
      context: 'updating compliance item'
    };
  }
}

/**
 * Delete a compliance item
 * @param {string} id - Compliance item ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteComplianceItem(id) {
  try {
    const { error } = await supabase
      .from('compliance_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    throw {
      code: error.code || 'DELETE_FAILED',
      message: getUserFriendlyError(error),
      context: 'deleting compliance item'
    };
  }
}

// ============================================
// FILE OPERATIONS
// ============================================

/**
 * Upload a document for a compliance item
 * @param {string} userId - User ID
 * @param {File} file - Document file to upload
 * @returns {Promise<string|null>} - Public URL of uploaded document or null on failure
 */
export async function uploadComplianceDocument(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/compliance/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL for the file
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    // Upload failures shouldn't block main operations
    return null;
  }
}

/**
 * Delete a document from storage
 * @param {string} documentUrl - URL of the document to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteComplianceDocument(documentUrl) {
  try {
    if (!documentUrl) return true;

    // Extract the file path from the URL
    const url = new URL(documentUrl);
    const pathParts = url.pathname.split('/');

    // Get the path after the bucket name
    const bucketPos = pathParts.indexOf('documents');
    if (bucketPos === -1) return true;

    const filePath = pathParts.slice(bucketPos + 1).join('/');

    if (filePath) {
      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (error) throw error;
    }
    return true;
  } catch (error) {
    // Document deletion failures shouldn't block main operations
    return false;
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to real-time updates for compliance items
 * @param {string} userId - User ID
 * @param {Function} onInsert - Callback for new items
 * @param {Function} onUpdate - Callback for updated items
 * @param {Function} onDelete - Callback for deleted items
 * @returns {Object} - Supabase subscription channel
 */
export function subscribeToComplianceChanges(userId, { onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel(`compliance_items_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'compliance_items',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (onInsert) onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'compliance_items',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (onUpdate) onUpdate(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'compliance_items',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (onDelete) onDelete(payload.old);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from real-time updates
 * @param {Object} channel - Supabase subscription channel
 */
export function unsubscribeFromComplianceChanges(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate days until expiration
 * @param {string} expirationDate - Expiration date string
 * @returns {number|null} - Days until expiration or null if no date
 */
export function getDaysUntilExpiration(expirationDate) {
  if (!expirationDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get status based on expiration date
 * @param {string} expirationDate - Expiration date string
 * @param {string} currentStatus - Current status value
 * @returns {string} - Computed status
 */
export function computeStatus(expirationDate, currentStatus) {
  if (!expirationDate) return currentStatus || 'Active';

  const daysUntil = getDaysUntilExpiration(expirationDate);

  if (daysUntil === null) return currentStatus || 'Active';
  if (daysUntil < 0) return 'Expired';
  if (daysUntil <= 30) return 'Expiring Soon';
  return currentStatus || 'Active';
}
