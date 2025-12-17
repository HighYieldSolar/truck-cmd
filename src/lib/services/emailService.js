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

/**
 * Onboarding Email Templates
 * Day 0: Welcome email (sent immediately after signup)
 * Day 1: First win - encourage first action
 * Day 3: Feature highlight based on operator type
 * Day 5: Success story / social proof
 * Day 6: Trial ending reminder with upgrade CTA
 */
const onboardingEmails = {
  // Day 0 - Welcome Email
  welcome: {
    subject: "Welcome to Truck Command - Your 7-day trial has started!",
    getHTML: (userName, operatorType) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Welcome to Truck Command!</h1>
              <p style="margin: 12px 0 0; color: #bfdbfe; font-size: 16px;">Your trucking business just got easier</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thanks for starting your free trial! For the next 7 days, you have full access to everything Truck Command offers.
              </p>

              <!-- Features Box -->
              <div style="background-color: #f0f9ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1e40af; font-size: 16px;">Here's what you can do:</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 8px 0; color: #374151;">✓ Track loads and mileage</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151;">✓ Create professional invoices</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151;">✓ Log expenses for tax time</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151;">✓ Generate IFTA reports automatically</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151;">✓ Manage your fleet and drivers</td></tr>
                </table>
              </div>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Go to My Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Questions? Just reply to this email - we read and respond to every message.
              </p>

              <p style="margin: 24px 0 0; color: #374151; font-size: 16px;">
                Happy trucking!<br>
                <strong>The Truck Command Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Truck Command | Making trucking simple
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },

  // Day 1 - First Win
  firstWin: {
    subject: "Quick tip: Your first step in Truck Command",
    getHTML: (userName, operatorType, primaryFocus) => {
      const focusTips = {
        loads: { action: 'Create your first load', link: '/dashboard/dispatching/new', benefit: 'Start tracking your hauls and mileage automatically' },
        invoicing: { action: 'Create your first invoice', link: '/dashboard/invoices/new', benefit: 'Get paid faster with professional invoices' },
        expenses: { action: 'Log your first expense', link: '/dashboard/expenses', benefit: 'Keep your finances organized for tax time' },
        ifta: { action: 'Set up IFTA tracking', link: '/dashboard/ifta', benefit: 'Never stress about quarterly IFTA reports again' }
      };
      const tip = focusTips[primaryFocus] || focusTips.loads;

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="padding: 40px 40px 24px; text-align: center;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">💡</span>
              </div>
              <h1 style="margin: 0; color: #111827; font-size: 24px;">Quick Win for Today</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Most truckers who get value from Truck Command take just one action on their first day. Here's yours:
              </p>

              <!-- Action Card -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 24px; margin: 0 0 24px; border-left: 4px solid #2563eb;">
                <h3 style="margin: 0 0 8px; color: #1e40af; font-size: 18px;">${tip.action}</h3>
                <p style="margin: 0; color: #3b82f6; font-size: 14px;">${tip.benefit}</p>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}${tip.link}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${tip.action} →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Takes less than 2 minutes!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                6 days left in your trial
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    }
  },

  // Day 3 - Feature Highlight
  featureHighlight: {
    subject: "Did you know? A hidden gem in Truck Command",
    getHTML: (userName, operatorType) => {
      const features = operatorType === 'small-fleet'
        ? { title: 'Fleet Overview Dashboard', description: 'See all your trucks and drivers at a glance. Track which loads are assigned, monitor driver documents, and manage your entire operation from one screen.', link: '/dashboard/fleet' }
        : { title: 'Automatic IFTA Calculations', description: 'Every time you log a fuel purchase or complete a load, we automatically calculate your state-by-state mileage. Quarterly reports generate in seconds.', link: '/dashboard/ifta' };

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="padding: 40px 40px 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
              <h1 style="margin: 0; color: #111827; font-size: 24px;">Feature Spotlight</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>

              <div style="background-color: #faf5ff; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <h3 style="margin: 0 0 12px; color: #7c3aed; font-size: 18px;">${features.title}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">${features.description}</p>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}${features.link}" style="display: inline-block; padding: 14px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Try It Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                4 days left in your trial
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    }
  },

  // Day 5 - Social Proof
  socialProof: {
    subject: "How other truckers use Truck Command",
    getHTML: (userName, operatorType) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="padding: 40px 40px 24px; text-align: center;">
              <h1 style="margin: 0; color: #111827; font-size: 24px;">Real Results from Real Truckers</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>

              <!-- Testimonial 1 -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 0 0 16px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 12px; color: #374151; font-size: 15px; font-style: italic; line-height: 1.5;">
                  "IFTA used to take me a whole weekend. Now it takes 10 minutes. I can't believe I waited so long to switch."
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 13px; font-weight: 600;">
                  — Mike T., Owner-Operator, Texas
                </p>
              </div>

              <!-- Testimonial 2 -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 0 0 24px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 12px; color: #374151; font-size: 15px; font-style: italic; line-height: 1.5;">
                  "Finally, invoices that look professional. My customers take me more seriously now."
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 13px; font-weight: 600;">
                  — Sarah K., Small Fleet Owner, Ohio
                </p>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Continue Your Trial →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                2 days left in your trial
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },

  // Day 6 - Trial Ending
  trialEnding: {
    subject: "Your trial ends tomorrow - don't lose your data!",
    getHTML: (userName, operatorType) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0;">
              <div style="font-size: 48px; margin-bottom: 12px;">⏰</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Your Trial Ends Tomorrow</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Just a heads up - your 7-day trial ends tomorrow. If you've enjoyed using Truck Command, now's the time to upgrade and keep all your data.
              </p>

              <!-- What you'll keep -->
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <h3 style="margin: 0 0 12px; color: #065f46; font-size: 16px;">When you upgrade, you keep:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #047857;">
                  <li style="margin-bottom: 8px;">All your loads and mileage data</li>
                  <li style="margin-bottom: 8px;">Your invoices and customer info</li>
                  <li style="margin-bottom: 8px;">Expense records and receipts</li>
                  <li style="margin-bottom: 8px;">IFTA calculations and reports</li>
                </ul>
              </div>

              <!-- Pricing reminder -->
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 24px; margin: 0 0 24px; text-align: center;">
                <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">Plans start at just</p>
                <p style="margin: 0; color: #1e40af; font-size: 32px; font-weight: 700;">$29<span style="font-size: 16px; font-weight: 400;">/month</span></p>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard/settings/billing" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Upgrade Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Reply to this email anytime.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #fef3c7; border-radius: 0 0 16px 16px; border-top: 1px solid #fcd34d; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                ⚠️ 1 day left in your trial
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
};

/**
 * Send an onboarding email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.emailType - Type of onboarding email (welcome, firstWin, featureHighlight, socialProof, trialEnding)
 * @param {string} params.userName - User's name
 * @param {string} params.operatorType - owner-operator or small-fleet
 * @param {string} params.primaryFocus - User's primary focus (loads, invoicing, expenses, ifta)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendOnboardingEmail({ to, emailType, userName, operatorType, primaryFocus }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping onboarding email');
    return { success: false, error: 'Email service not configured' };
  }

  const template = onboardingEmails[emailType];
  if (!template) {
    return { success: false, error: `Unknown email type: ${emailType}` };
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
        subject: template.subject,
        html: template.getHTML(userName, operatorType, primaryFocus)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send onboarding email');
    }

    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send ${emailType} onboarding email:`, error);
    return { success: false, error: error.message };
  }
}

export default {
  sendNotificationEmail,
  sendDigestEmail,
  sendOnboardingEmail,
  isEmailServiceConfigured
};
