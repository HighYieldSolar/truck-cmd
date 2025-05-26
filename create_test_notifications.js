// create_test_notifications.js
// Script to create test notifications for demonstration

console.log('Creating test notifications...\n');

// Using your browser's JavaScript console or developer tools
// Copy and paste this code in your browser console while on your dashboard

const testNotifications = [
  {
    title: "DOT Annual Inspection - ABC Trucking - Expiring in 7 Days",
    message: "ATTENTION: Your DOT Annual Inspection for ABC Trucking (Company) will expire in 7 days on Feb 01, 2025. Renew immediately.",
    type: "DOCUMENT_EXPIRY_COMPLIANCE",
    urgency: "MEDIUM",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    link_to: "/dashboard/compliance"
  },
  {
    title: "Driver License - John Smith - Expires Tomorrow!",
    message: "URGENT: Driver John Smith's license expires TOMORROW (Jan 26, 2025). Immediate action required!",
    type: "DOCUMENT_EXPIRY_DRIVER_LICENSE",
    urgency: "HIGH",
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    link_to: "/dashboard/fleet"
  },
  {
    title: "Medical Card - Jane Doe - EXPIRES TODAY!",
    message: "CRITICAL: Driver Jane Doe's medical card EXPIRES TODAY (Jan 25, 2025). Driver cannot operate!",
    type: "DOCUMENT_EXPIRY_DRIVER_MEDICAL",
    urgency: "CRITICAL",
    due_date: new Date().toISOString(), // Today
    link_to: "/dashboard/fleet"
  },
  {
    title: "Insurance Certificate - Expiring in 30 Days",
    message: "Your Insurance Certificate for XYZ Company (Company) will expire in 30 days on Feb 24, 2025. Please plan for renewal.",
    type: "DOCUMENT_EXPIRY_COMPLIANCE",
    urgency: "LOW",
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    link_to: "/dashboard/compliance"
  },
  {
    title: "General Reminder",
    message: "Don't forget to check your fuel logs and update your IFTA records.",
    type: "GENERAL_REMINDER",
    urgency: "NORMAL",
    due_date: null,
    link_to: "/dashboard/ifta"
  }
];

async function createTestNotifications() {
  console.log('🔧 Creating test notifications...\n');

  try {
    // Get current user from your subscription context
    const userElement = document.querySelector('[data-user-id]');
    const userId = userElement?.getAttribute('data-user-id') || 'e95b4799-4dbe-45d0-988b-06d7c819fbda';

    console.log('Using user ID:', userId);

    for (let i = 0; i < testNotifications.length; i++) {
      const notification = testNotifications[i];

      console.log(`Creating notification ${i + 1}:`, notification.title);

      // Call the notification service (assuming it's available globally)
      if (window.supabase) {
        const { data, error } = await window.supabase.rpc('create_notification', {
          p_user_id: userId,
          p_title: notification.title,
          p_message: notification.message,
          p_notification_type: notification.type,
          p_entity_type: null,
          p_entity_id: null,
          p_link_to: notification.link_to,
          p_due_date: notification.due_date,
          p_urgency: notification.urgency
        });

        if (error) {
          console.error('Error creating notification:', error);
        } else {
          console.log('✅ Created notification:', data);
        }
      } else {
        console.log('⚠️  Supabase not available in window object');
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Test notifications created!');
    console.log('Refresh your page to see them in:');
    console.log('- Notification dropdown (top right)');
    console.log('- Notifications page (/dashboard/notifications)');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
}

// Instructions for the user
console.log('📋 INSTRUCTIONS:');
console.log('1. Open your browser developer tools (F12)');
console.log('2. Go to the Console tab');
console.log('3. Paste this entire script and press Enter');
console.log('4. Call: createTestNotifications()');
console.log('5. Refresh your dashboard to see the notifications');
console.log('\nAlternatively, run: createTestNotifications()');

// Export for use
if (typeof window !== 'undefined') {
  window.createTestNotifications = createTestNotifications;
} 