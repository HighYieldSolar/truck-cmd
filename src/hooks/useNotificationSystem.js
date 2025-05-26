import { useEffect, useCallback, useState } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import NotificationService from '@/lib/services/notificationService';

export const useNotificationSystem = () => {
  const { user } = useSubscription();
  const [isCheckingNotifications, setIsCheckingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState(null);
  const [complianceSummary, setComplianceSummary] = useState(null);

  /**
   * Run automated notification checks
   */
  const runAutomatedChecks = useCallback(async () => {
    if (!user?.id || isCheckingNotifications) return;

    try {
      setIsCheckingNotifications(true);
      setNotificationError(null);

      console.log('Starting automated notification checks...');

      const result = await NotificationService.runAutomatedChecks();

      if (result.success) {
        NotificationService.updateLastCheckTimestamp();
        setLastCheckTimestamp(new Date().toISOString());
        console.log('Automated notification checks completed successfully:', result.results);
      } else {
        setNotificationError(result.error);
        console.error('Automated notification checks failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error running automated notification checks:', error);
      setNotificationError('Failed to run notification checks');
      return { success: false, error: error.message };
    } finally {
      setIsCheckingNotifications(false);
    }
  }, [user?.id, isCheckingNotifications]);

  /**
   * Get compliance summary
   */
  const getComplianceSummary = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const result = await NotificationService.getComplianceSummary(user.id);

      if (result.success) {
        setComplianceSummary(result.data);
        return result.data;
      } else {
        console.error('Failed to get compliance summary:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error getting compliance summary:', error);
      return null;
    }
  }, [user?.id]);

  /**
   * Create a custom notification
   */
  const createNotification = useCallback(async (notificationData) => {
    if (!user?.id) return { success: false, error: 'User not available' };

    return await NotificationService.createNotification({
      userId: user.id,
      ...notificationData
    });
  }, [user?.id]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return { success: false, error: 'User not available' };

    return await NotificationService.markAsRead(notificationId, user.id);
  }, [user?.id]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not available' };

    return await NotificationService.markAllAsRead(user.id);
  }, [user?.id]);

  /**
   * Get unread notifications summary
   */
  const getUnreadSummary = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not available' };

    return await NotificationService.getUnreadSummary(user.id);
  }, [user?.id]);

  /**
   * Get paginated notifications
   */
  const getNotifications = useCallback(async (params = {}) => {
    if (!user?.id) return { success: false, error: 'User not available' };

    return await NotificationService.getNotifications({
      userId: user.id,
      ...params
    });
  }, [user?.id]);

  /**
   * Force a manual notification check
   */
  const forceCheck = useCallback(async () => {
    return await runAutomatedChecks();
  }, [runAutomatedChecks]);

  // Auto-run notification checks when user loads and periodically
  useEffect(() => {
    if (!user?.id) return;

    const checkNotifications = async () => {
      // Check if we should run automated checks (once per day)
      if (NotificationService.shouldRunAutomatedChecks()) {
        await runAutomatedChecks();
      }

      // Always get compliance summary on load
      await getComplianceSummary();
    };

    checkNotifications();

    // Set up interval to check every hour if notifications should be run
    const interval = setInterval(() => {
      if (NotificationService.shouldRunAutomatedChecks()) {
        runAutomatedChecks();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [user?.id, runAutomatedChecks, getComplianceSummary]);

  // Get last check timestamp on mount
  useEffect(() => {
    const lastCheck = localStorage.getItem('lastNotificationCheck');
    if (lastCheck) {
      setLastCheckTimestamp(lastCheck);
    }
  }, []);

  return {
    // State
    isCheckingNotifications,
    notificationError,
    lastCheckTimestamp,
    complianceSummary,

    // Actions
    runAutomatedChecks,
    getComplianceSummary,
    createNotification,
    markAsRead,
    markAllAsRead,
    getUnreadSummary,
    getNotifications,
    forceCheck,

    // Utilities
    shouldRunChecks: NotificationService.shouldRunAutomatedChecks,
    clearError: () => setNotificationError(null)
  };
}; 