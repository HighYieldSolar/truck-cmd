// Test script for the Enhanced Compliance Notifications System
// Run this in your browser console or as a standalone script

import NotificationService from '@/lib/services/notificationService';
import { supabase } from '@/lib/supabaseClient';

/**
 * Test the notifications system
 */
export async function testNotificationSystem() {
  console.log('🧪 Testing Enhanced Compliance Notifications System...\n');

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated');
      return;
    }

    console.log(`✅ User authenticated: ${user.email}`);

    // Test 1: Generate compliance notifications
    console.log('\n📋 Test 1: Generating compliance notifications...');
    const complianceResult = await NotificationService.generateComplianceNotifications();

    if (complianceResult.success) {
      console.log(`✅ Generated ${complianceResult.count} compliance notifications`);
    } else {
      console.error(`❌ Failed to generate notifications: ${complianceResult.error}`);
    }

    // Test 2: Get compliance summary
    console.log('\n📊 Test 2: Getting compliance summary...');
    const summaryResult = await NotificationService.getComplianceSummary(user.id);

    if (summaryResult.success) {
      console.log('✅ Compliance summary retrieved:');
      console.log(`   - Total compliance items: ${summaryResult.data.compliance.total_items}`);
      console.log(`   - Expired items: ${summaryResult.data.compliance.expired}`);
      console.log(`   - Expiring soon: ${summaryResult.data.compliance.expiring_soon}`);
      console.log(`   - Total drivers: ${summaryResult.data.drivers.total_drivers}`);
      console.log(`   - Driver docs expiring soon: ${summaryResult.data.drivers.expiring_soon_docs}`);
      console.log(`   - Recent expirations: ${summaryResult.data.recent_expirations?.length || 0}`);
    } else {
      console.error(`❌ Failed to get compliance summary: ${summaryResult.error}`);
    }

    // Test 3: Get unread notifications summary
    console.log('\n🔔 Test 3: Getting unread notifications...');
    const unreadResult = await NotificationService.getUnreadSummary(user.id);

    if (unreadResult.success) {
      console.log(`✅ Unread notifications: ${unreadResult.data.unread_count}`);
      console.log(`   - Recent notifications: ${unreadResult.data.recent_notifications?.length || 0}`);
    } else {
      console.error(`❌ Failed to get unread notifications: ${unreadResult.error}`);
    }

    // Test 4: Create a test notification
    console.log('\n📝 Test 4: Creating test notification...');
    const createResult = await NotificationService.createNotification({
      userId: user.id,
      title: 'Test Notification',
      message: 'This is a test notification created by the testing script.',
      type: 'GENERAL_REMINDER',
      urgency: 'NORMAL'
    });

    if (createResult.success) {
      console.log('✅ Test notification created successfully');
    } else {
      console.error(`❌ Failed to create test notification: ${createResult.error}`);
    }

    // Test 5: Get all notifications with filtering
    console.log('\n📋 Test 5: Getting filtered notifications...');
    const notificationsResult = await NotificationService.getNotifications({
      userId: user.id,
      page: 1,
      pageSize: 5,
      filterTypes: ['GENERAL_REMINDER'],
      filterReadStatus: false
    });

    if (notificationsResult.success) {
      console.log(`✅ Retrieved ${notificationsResult.data?.length || 0} filtered notifications`);
    } else {
      console.error(`❌ Failed to get filtered notifications: ${notificationsResult.error}`);
    }

    // Test 6: Cleanup old notifications
    console.log('\n🧹 Test 6: Running cleanup...');
    const cleanupResult = await NotificationService.cleanupOldNotifications();

    if (cleanupResult.success) {
      console.log(`✅ Cleaned up ${cleanupResult.count} old notifications`);
    } else {
      console.error(`❌ Failed to cleanup notifications: ${cleanupResult.error}`);
    }

    // Test 7: Run full automated checks
    console.log('\n🤖 Test 7: Running full automated checks...');
    const automatedResult = await NotificationService.runAutomatedChecks();

    if (automatedResult.success) {
      console.log('✅ Automated checks completed successfully:');
      console.log(`   - Compliance notifications: ${automatedResult.results.compliance.count || 0}`);
      console.log(`   - Cleanup count: ${automatedResult.results.cleanup.count || 0}`);
      console.log(`   - Timestamp: ${automatedResult.results.timestamp}`);
    } else {
      console.error(`❌ Automated checks failed: ${automatedResult.error}`);
    }

    console.log('\n🎉 Notification system testing completed!');
    console.log('Check your notifications page at /dashboard/notifications to see the results.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Test compliance data setup
 * Creates test compliance items with various expiration dates for testing
 */
export async function createTestComplianceData() {
  console.log('🧪 Creating test compliance data...\n');

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated');
      return;
    }

    const testItems = [
      {
        title: 'DOT Physical',
        compliance_type: 'Medical',
        entity_type: 'Driver',
        entity_name: 'John Doe',
        expiration_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        status: 'Active',
        user_id: user.id
      },
      {
        title: 'Vehicle Registration',
        compliance_type: 'Vehicle',
        entity_type: 'Vehicle',
        entity_name: 'Truck #1',
        expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
        status: 'Active',
        user_id: user.id
      },
      {
        title: 'Operating Authority',
        compliance_type: 'Company',
        entity_type: 'Company',
        entity_name: 'Your Company',
        expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        status: 'Active',
        user_id: user.id
      }
    ];

    for (const item of testItems) {
      const { error } = await supabase
        .from('compliance_items')
        .insert(item);

      if (error) {
        console.error(`❌ Failed to create test item: ${item.title}`, error);
      } else {
        console.log(`✅ Created test compliance item: ${item.title} (expires in ${item.expiration_date})`);
      }
    }

    console.log('\n🎉 Test compliance data created!');
    console.log('Now run testNotificationSystem() to see the notifications generated.');

  } catch (error) {
    console.error('❌ Failed to create test data:', error);
  }
}

/**
 * View current compliance status
 */
export async function viewComplianceStatus() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated');
      return;
    }

    console.log('📋 Current Compliance Status:\n');

    // Get compliance items
    const { data: items, error: itemsError } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('user_id', user.id)
      .order('expiration_date', { ascending: true });

    if (itemsError) {
      console.error('❌ Failed to get compliance items:', itemsError);
      return;
    }

    items.forEach(item => {
      const today = new Date();
      const expiry = new Date(item.expiration_date);
      const daysUntil = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      let status = '✅ Active';
      if (daysUntil < 0) status = '❌ Expired';
      else if (daysUntil <= 1) status = '🔴 Expires Soon';
      else if (daysUntil <= 7) status = '🟠 Expires This Week';
      else if (daysUntil <= 30) status = '🟡 Expires This Month';

      console.log(`${status} ${item.title} (${item.entity_name}) - Expires: ${item.expiration_date} (${daysUntil} days)`);
    });

    // Get notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .in('notification_type', ['DOCUMENT_EXPIRY_COMPLIANCE', 'DOCUMENT_EXPIRY_DRIVER_LICENSE', 'DOCUMENT_EXPIRY_DRIVER_MEDICAL'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (!notifError && notifications.length > 0) {
      console.log('\n🔔 Recent Compliance Notifications:');
      notifications.forEach(notif => {
        const readStatus = notif.is_read ? '📖' : '📬';
        console.log(`${readStatus} ${notif.title} (${notif.urgency}) - ${notif.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Failed to view compliance status:', error);
  }
}

// Instructions for running these functions
console.log(`
🧪 Enhanced Compliance Notifications Test Suite

To test the system, run these functions in your browser console:

1. Create test data:
   createTestComplianceData()

2. Run full system test:
   testNotificationSystem()

3. View current status:
   viewComplianceStatus()

Or test individual functions from NotificationService directly.
`);

export default {
  testNotificationSystem,
  createTestComplianceData,
  viewComplianceStatus
}; 