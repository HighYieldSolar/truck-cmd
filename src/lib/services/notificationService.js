import { supabase } from '@/lib/supabaseClient';

export class NotificationService {
  /**
   * Generate compliance expiration notifications
   * Checks for expiring compliance items and driver documents
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  static async generateComplianceNotifications() {
    try {
      const { data, error } = await supabase.rpc('generate_compliance_notifications');

      if (error) {
        console.error('Error generating compliance notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data };
    } catch (err) {
      console.error('Service error generating compliance notifications:', err);
      return { success: false, error: 'Failed to generate notifications' };
    }
  }

  /**
   * Clean up old read notifications (older than 90 days)
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  static async cleanupOldNotifications() {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_notifications');

      if (error) {
        console.error('Error cleaning up notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data };
    } catch (err) {
      console.error('Service error cleaning up notifications:', err);
      return { success: false, error: 'Failed to cleanup notifications' };
    }
  }

  /**
   * Get compliance summary data
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  static async getComplianceSummary(userId) {
    try {
      const { data, error } = await supabase.rpc('get_compliance_summary', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting compliance summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Service error getting compliance summary:', err);
      return { success: false, error: 'Failed to get compliance summary' };
    }
  }

  /**
   * Create a custom notification
   * @param {object} notification - Notification details
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async createNotification({
    userId,
    title,
    message,
    type = 'GENERAL_REMINDER',
    entityType = null,
    entityId = null,
    linkTo = null,
    dueDate = null,
    urgency = 'NORMAL'
  }) {
    try {
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: title,
        p_message: message,
        p_notification_type: type,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_link_to: linkTo,
        p_due_date: dueDate,
        p_urgency: urgency
      });

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Service error creating notification:', err);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async markAsRead(notificationId, userId) {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Service error marking notification as read:', err);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async markAllAsRead(userId) {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Service error marking all notifications as read:', err);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  /**
   * Get unread notifications summary
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  static async getUnreadSummary(userId) {
    try {
      const { data, error } = await supabase.rpc('get_unread_notifications_summary', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting unread notifications summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Service error getting unread summary:', err);
      return { success: false, error: 'Failed to get unread notifications summary' };
    }
  }

  /**
   * Get paginated notifications
   * @param {object} params - Parameters for fetching notifications
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  static async getNotifications({
    userId,
    page = 1,
    pageSize = 15,
    filterTypes = null,
    filterReadStatus = null
  }) {
    try {
      const { data, error } = await supabase.rpc('get_all_notifications', {
        p_user_id: userId,
        p_page_number: page,
        p_page_size: pageSize,
        p_filter_types: filterTypes,
        p_filter_read_status: filterReadStatus
      });

      if (error) {
        console.error('Error getting notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Service error getting notifications:', err);
      return { success: false, error: 'Failed to get notifications' };
    }
  }

  /**
   * Run automated notification checks
   * This should be called periodically (e.g., daily) to check for expiring documents
   * @returns {Promise<{success: boolean, results?: object, error?: string}>}
   */
  static async runAutomatedChecks() {
    try {
      // Generate compliance notifications
      const complianceResult = await this.generateComplianceNotifications();

      // Clean up old notifications
      const cleanupResult = await this.cleanupOldNotifications();

      const results = {
        compliance: complianceResult,
        cleanup: cleanupResult,
        timestamp: new Date().toISOString()
      };

      return { success: true, results };
    } catch (err) {
      console.error('Error running automated notification checks:', err);
      return { success: false, error: 'Failed to run automated checks' };
    }
  }

  /**
   * Check if notifications should be run (e.g., once per day)
   * @returns {boolean}
   */
  static shouldRunAutomatedChecks() {
    const lastRun = localStorage.getItem('lastNotificationCheck');
    if (!lastRun) return true;

    const lastRunDate = new Date(lastRun);
    const now = new Date();

    // Run if it's been more than 23 hours since last run
    const hoursSinceLastRun = (now - lastRunDate) / (1000 * 60 * 60);
    return hoursSinceLastRun >= 23;
  }

  /**
   * Update the last notification check timestamp
   */
  static updateLastCheckTimestamp() {
    localStorage.setItem('lastNotificationCheck', new Date().toISOString());
  }
}

// Notification types enum for consistency
export const NOTIFICATION_TYPES = {
  DOCUMENT_EXPIRY_COMPLIANCE: 'DOCUMENT_EXPIRY_COMPLIANCE',
  DOCUMENT_EXPIRY_DRIVER_LICENSE: 'DOCUMENT_EXPIRY_DRIVER_LICENSE',
  DOCUMENT_EXPIRY_DRIVER_MEDICAL: 'DOCUMENT_EXPIRY_DRIVER_MEDICAL',
  GENERAL_REMINDER: 'GENERAL_REMINDER',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  MAINTENANCE_DUE: 'MAINTENANCE_DUE',
  IFTA_DEADLINE: 'IFTA_DEADLINE',
  LOAD_ASSIGNED: 'LOAD_ASSIGNED',
  LOAD_STATUS_UPDATE: 'LOAD_STATUS_UPDATE',
  DELIVERY_UPCOMING: 'DELIVERY_UPCOMING'
};

// Urgency levels enum
export const URGENCY_LEVELS = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export default NotificationService; 