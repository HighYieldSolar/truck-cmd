// src/lib/services/emailService.js
// Email service for sending notification emails via Resend

/**
 * Email Service for Truck Command
 *
 * Supports sending notification emails with templates for different notification types.
 * Requires RESEND_API_KEY environment variable to be set.
 *
 * Usage:
 *   import { sendNotificationEmail, sendDigestEmail } from '@/lib/services/emailService';
 *   await sendNotificationEmail({ to, notification, userPrefs });
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Truck Command <notifications@truckcommand.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://truckcommand.com';

/**
 * Get urgency color for email styling
 */
function getUrgencyColor(urgency) {
  switch (urgency) {
    case 'CRITICAL': return '#dc2626'; // red-600
    case 'HIGH': return '#ea580c'; // orange-600
    case 'MEDIUM': return '#ca8a04'; // yellow-600
    case 'LOW': return '#16a34a'; // green-600
    default: return '#2563eb'; // blue-600
  }
}

/**
 * Get icon/emoji for notification type
 */
function getNotificationIcon(type) {
  switch (type) {
    case 'DOCUMENT_EXPIRY_COMPLIANCE':
    case 'DOCUMENT_EXPIRY_DRIVER_LICENSE':
    case 'DOCUMENT_EXPIRY_DRIVER_MEDICAL':
      return '📋';
    case 'LOAD_ASSIGNED':
    case 'LOAD_STATUS_UPDATE':
      return '🚛';
    case 'DELIVERY_UPCOMING':
      return '📦';
    case 'INVOICE_OVERDUE':
      return '⚠️';
    case 'PAYMENT_RECEIVED':
      return '💰';
    case 'MAINTENANCE_DUE':
      return '🔧';
    case 'FUEL_REMINDER':
      return '⛽';
    case 'IFTA_DEADLINE':
      return '📊';
    case 'SYSTEM_ERROR':
      return '🚨';
    default:
      return '🔔';
  }
}

/**
 * Generate HTML email template for a single notification
 */
function generateNotificationEmailHTML(notification) {
  const urgencyColor = getUrgencyColor(notification.urgency);
  const icon = getNotificationIcon(notification.notification_type);
  const actionUrl = notification.link_to ? `${APP_URL}${notification.link_to}` : APP_URL;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      🚛 Truck Command
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Urgency Banner -->
          ${notification.urgency && notification.urgency !== 'NORMAL' ? `
          <tr>
            <td style="padding: 12px 40px; background-color: ${urgencyColor}; color: white; text-align: center;">
              <strong style="text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                ${notification.urgency} Priority
              </strong>
            </td>
          </tr>
          ` : ''}

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                      ${icon} ${notification.title}
                    </h2>
                    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      ${notification.message}
                    </p>

                    ${notification.due_date ? `
                    <p style="margin: 0 0 24px 0; padding: 12px 16px; background-color: #fef3c7; border-radius: 8px; color: #92400e; font-size: 14px;">
                      <strong>Due Date:</strong> ${new Date(notification.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    ` : ''}

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td align="center" style="padding: 16px 0;">
                          <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                            View Details
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="color: #6b7280; font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0;">
                      You received this email because you have email notifications enabled for ${notification.notification_type?.replace(/_/g, ' ').toLowerCase()}.
                    </p>
                    <p style="margin: 0;">
                      <a href="${APP_URL}/dashboard/settings/notifications" style="color: #2563eb; text-decoration: underline;">
                        Manage notification preferences
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email template for digest emails (multiple notifications)
 */
function generateDigestEmailHTML(notifications, period = 'daily') {
  const groupedNotifications = {};

  // Group by type
  notifications.forEach(n => {
    const category = getCategoryFromType(n.notification_type);
    if (!groupedNotifications[category]) {
      groupedNotifications[category] = [];
    }
    groupedNotifications[category].push(n);
  });

  const categoryRows = Object.entries(groupedNotifications).map(([category, items]) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${category} (${items.length})
        </h3>
        ${items.map(n => `
          <div style="margin-bottom: 12px; padding: 12px; background-color: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; color: #111827; font-weight: 500;">
              ${getNotificationIcon(n.notification_type)} ${n.title}
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              ${n.message}
            </p>
          </div>
        `).join('')}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${period} notification digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                🚛 Truck Command
              </h1>
              <p style="margin: 8px 0 0 0; color: #bfdbfe; font-size: 14px;">
                Your ${period} notification digest
              </p>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 24px 40px; background-color: #eff6ff; border-bottom: 1px solid #dbeafe;">
              <p style="margin: 0; color: #1e40af; font-size: 16px;">
                You have <strong>${notifications.length}</strong> notification${notifications.length !== 1 ? 's' : ''} to review.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 24px 40px;">
              <table role="presentation" style="width: 100%;">
                ${categoryRows}
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard/notifications" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      View All Notifications
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                <a href="${APP_URL}/dashboard/settings/notifications" style="color: #2563eb; text-decoration: underline;">
                  Manage notification preferences
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Get category name from notification type
 */
function getCategoryFromType(type) {
  switch (type) {
    case 'DOCUMENT_EXPIRY_COMPLIANCE':
      return 'Compliance';
    case 'DOCUMENT_EXPIRY_DRIVER_LICENSE':
    case 'DOCUMENT_EXPIRY_DRIVER_MEDICAL':
      return 'Drivers';
    case 'LOAD_ASSIGNED':
    case 'LOAD_STATUS_UPDATE':
    case 'DELIVERY_UPCOMING':
      return 'Loads';
    case 'INVOICE_OVERDUE':
    case 'PAYMENT_RECEIVED':
      return 'Billing';
    case 'MAINTENANCE_DUE':
      return 'Maintenance';
    case 'FUEL_REMINDER':
      return 'Fuel';
    case 'IFTA_DEADLINE':
      return 'IFTA';
    default:
      return 'System';
  }
}

/**
 * Send a single notification email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {Object} params.notification - Notification object
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendNotificationEmail({ to, notification }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `${getNotificationIcon(notification.notification_type)} ${notification.title}`,
        html: generateNotificationEmailHTML(notification)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a digest email with multiple notifications
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {Array} params.notifications - Array of notification objects
 * @param {string} params.period - 'daily' or 'weekly'
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendDigestEmail({ to, notifications, period = 'daily' }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping digest email');
    return { success: false, error: 'Email service not configured' };
  }

  if (!notifications || notifications.length === 0) {
    return { success: false, error: 'No notifications to send' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `📬 Your ${period} Truck Command digest (${notifications.length} notification${notifications.length !== 1 ? 's' : ''})`,
        html: generateDigestEmailHTML(notifications, period)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send digest email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send digest email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured() {
  return !!RESEND_API_KEY;
}

export default {
  sendNotificationEmail,
  sendDigestEmail,
  isEmailServiceConfigured
};
