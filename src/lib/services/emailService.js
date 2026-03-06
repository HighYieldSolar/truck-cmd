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

// Read environment variables at runtime to support serverless environments
const getResendApiKey = () => process.env.RESEND_API_KEY;
const getFromEmail = () => process.env.EMAIL_FROM || 'Truck Command <notifications@truckcommand.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://truckcommand.com';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || 'Truck Command, Houston, TX';

/**
 * Standard email headers for CAN-SPAM compliance
 * List-Unsubscribe allows one-click unsubscribe in email clients
 */
function getEmailHeaders(to) {
  return {
    'List-Unsubscribe': `<${APP_URL}/dashboard/settings/notifications>, <mailto:unsubscribe@truckcommand.com?subject=unsubscribe&body=${encodeURIComponent(to || '')}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  };
}

/**
 * Standard CAN-SPAM compliant footer HTML with physical address + unsubscribe link
 */
function getComplianceFooterHTML() {
  return `
    <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px; line-height: 1.4;">
      ${COMPANY_ADDRESS}<br>
      <a href="${APP_URL}/dashboard/settings/notifications" style="color: #6b7280; text-decoration: underline;">Manage email preferences</a>
      &nbsp;|&nbsp;
      <a href="${APP_URL}/dashboard/settings/notifications" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
    </p>`;
}

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
                    <p style="margin: 0 0 8px 0;">
                      <a href="${APP_URL}/dashboard/settings/notifications" style="color: #2563eb; text-decoration: underline;">
                        Manage notification preferences
                      </a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      ${COMPANY_ADDRESS}
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
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                <a href="${APP_URL}/dashboard/settings/notifications" style="color: #2563eb; text-decoration: underline;">
                  Manage notification preferences
                </a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                ${COMPANY_ADDRESS}
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
  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email service not configured. RESEND_API_KEY missing.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `${getNotificationIcon(notification.notification_type)} ${notification.title}`,
        html: generateNotificationEmailHTML(notification),
        headers: getEmailHeaders(to)
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
  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping digest email');
    return { success: false, error: 'Email service not configured. RESEND_API_KEY missing.' };
  }

  if (!notifications || notifications.length === 0) {
    return { success: false, error: 'No notifications to send' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `📬 Your ${period} Truck Command digest (${notifications.length} notification${notifications.length !== 1 ? 's' : ''})`,
        html: generateDigestEmailHTML(notifications, period),
        headers: getEmailHeaders(to)
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
  return !!getResendApiKey();
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
    subject: "Welcome to Truck Command - Your 30-day trial has started!",
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
                Thanks for starting your free trial! For the next 30 days, you have full access to everything Truck Command offers.
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
                Just a heads up - your 30-day trial ends tomorrow. If you've enjoyed using Truck Command, now's the time to upgrade and keep all your data.
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
  },

  // Day 10 - "We miss you" re-engagement (if user hasn't logged in recently)
  reEngagement: {
    subject: "Your trucking data is collecting dust...",
    getHTML: (userName) => `
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
              <div style="font-size: 48px; margin-bottom: 16px;">👋</div>
              <h1 style="margin: 0; color: #111827; font-size: 24px;">We Miss You on the Road</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We noticed you haven't been back to Truck Command in a while. No worries — your account is still here and your trial is still active.
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Here's what other truckers have been doing this week:
              </p>

              <div style="background-color: #f0f9ff; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <table style="width: 100%;">
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">📊 Generated IFTA reports in seconds (no more spreadsheets)</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">💰 Tracked $12,000+ in monthly expenses for tax time</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">📄 Sent professional invoices and got paid faster</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">🔔 Never missed a document expiration again</td></tr>
                </table>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Jump Back In
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Need help getting started? Just reply to this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                <a href="${APP_URL}/dashboard/settings/notifications" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">${COMPANY_ADDRESS}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },

  // Day 14 - Last chance offer with discount code
  lastChance: {
    subject: "Last call: 25% off Truck Command (expires tonight)",
    getHTML: (userName) => `
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
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 16px 16px 0 0;">
              <div style="font-size: 48px; margin-bottom: 12px;">🔥</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Last Chance — Trial Ending</h1>
              <p style="margin: 12px 0 0; color: #fecaca; font-size: 14px;">Your free trial expires today</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                This is it — your 30-day Truck Command trial ends today. After today, you'll lose access to your dashboard, but we'll keep your data safe for 30 days.
              </p>

              <!-- Special Offer -->
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 24px; margin: 0 0 24px; text-align: center; border: 2px solid #c084fc;">
                <p style="margin: 0 0 4px; color: #7c3aed; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">EXCLUSIVE OFFER</p>
                <p style="margin: 0 0 8px; color: #581c87; font-size: 32px; font-weight: 700;">25% off your first 3 months</p>
                <p style="margin: 0 0 4px; color: #7c3aed; font-size: 16px;">Use code <strong style="background: #ede9fe; padding: 2px 8px; border-radius: 4px;">LAUNCH25</strong> at checkout</p>
                <p style="margin: 8px 0 0; color: #a78bfa; font-size: 13px;">Offer expires tonight at midnight</p>
              </div>

              <!-- What you keep -->
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
                <h3 style="margin: 0 0 12px; color: #065f46; font-size: 15px;">Subscribe now and keep everything:</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 4px 0; color: #047857; font-size: 14px;">✓ All your loads and mileage records</td></tr>
                  <tr><td style="padding: 4px 0; color: #047857; font-size: 14px;">✓ Invoices, customers, and expense data</td></tr>
                  <tr><td style="padding: 4px 0; color: #047857; font-size: 14px;">✓ IFTA calculations and reports</td></tr>
                  <tr><td style="padding: 4px 0; color: #047857; font-size: 14px;">✓ All uploaded documents and receipts</td></tr>
                </table>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard/settings/billing" style="display: inline-block; padding: 16px 40px; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Subscribe Now & Save 25%
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; text-align: center;">
                Plans start at just $29/month ($21.75/mo with your discount)
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                <a href="${APP_URL}/dashboard/settings/notifications" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">${COMPANY_ADDRESS}</p>
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
 * @param {string} params.emailType - Type of onboarding email (welcome, firstWin, featureHighlight, socialProof, trialEnding, reEngagement, lastChance)
 * @param {string} params.userName - User's name
 * @param {string} params.operatorType - owner-operator or small-fleet
 * @param {string} params.primaryFocus - User's primary focus (loads, invoicing, expenses, ifta)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendOnboardingEmail({ to, emailType, userName, operatorType, primaryFocus }) {
  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping onboarding email');
    return { success: false, error: 'Email service not configured. RESEND_API_KEY missing.' };
  }

  const template = onboardingEmails[emailType];
  if (!template) {
    return { success: false, error: `Unknown email type: ${emailType}` };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: template.subject,
        html: template.getHTML(userName, operatorType, primaryFocus),
        headers: getEmailHeaders(to)
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

/**
 * Marketing / Lifecycle Email Templates
 */

/**
 * Send payment failed email with retry info and "Update Payment" CTA
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.userName - User's display name
 * @param {number} params.attemptCount - Number of payment attempts
 * @param {string} params.nextRetryDate - ISO date of next retry (optional)
 * @param {string} params.invoiceId - Stripe invoice ID for reference
 */
export async function sendPaymentFailedEmail({ to, userName, attemptCount = 1, nextRetryDate, invoiceId }) {
  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping payment failed email');
    return { success: false, error: 'Email service not configured' };
  }

  const retryText = nextRetryDate
    ? `We'll automatically retry on <strong>${new Date(nextRetryDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>.`
    : 'This was our final attempt.';

  const urgencyLevel = attemptCount >= 3 ? 'final' : attemptCount >= 2 ? 'warning' : 'info';
  const bannerColor = urgencyLevel === 'final' ? '#dc2626' : urgencyLevel === 'warning' ? '#f59e0b' : '#2563eb';
  const bannerText = urgencyLevel === 'final'
    ? 'Action Required — Service may be interrupted'
    : `Payment Attempt ${attemptCount} Failed`;

  const html = `
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
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🚛 Truck Command</h1>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 16px 40px; background-color: ${bannerColor}; color: white; text-align: center;">
              <strong style="font-size: 14px;">💳 ${bannerText}</strong>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We weren't able to process your subscription payment. This can happen if your card expired, has insufficient funds, or was declined by your bank.
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${retryText} To avoid any interruption to your service, please update your payment method.
              </p>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 8px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard/settings/billing" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Update Payment Method
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin: 0 0 16px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>Your data is safe.</strong> We never delete your loads, invoices, or expense records. Just update your payment method to continue using Truck Command without interruption.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Questions? Reply to this email — we're here to help.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: urgencyLevel === 'final'
          ? '⚠️ Action Required: Update your payment method'
          : `💳 Payment failed — update your card to continue`,
        html,
        headers: getEmailHeaders(to)
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send email');
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send trial expired email — inform user their trial ended
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.userName - User's display name
 */
export async function sendTrialExpiredEmail({ to, userName }) {
  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();

  if (!apiKey) {
    return { success: false, error: 'Email service not configured' };
  }

  const html = `
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
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Your Trial Has Ended</h1>
              <p style="margin: 12px 0 0; color: #d1d5db; font-size: 14px;">But your data is still here</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Your 30-day Truck Command trial has ended. We've preserved all your data — loads, invoices, expenses, IFTA records — everything is still there waiting for you.
              </p>

              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <h3 style="margin: 0 0 12px; color: #065f46; font-size: 16px;">Your data is preserved:</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 6px 0; color: #047857; font-size: 14px;">✓ All your loads and mileage records</td></tr>
                  <tr><td style="padding: 6px 0; color: #047857; font-size: 14px;">✓ Invoices and customer information</td></tr>
                  <tr><td style="padding: 6px 0; color: #047857; font-size: 14px;">✓ Expense records and receipts</td></tr>
                  <tr><td style="padding: 6px 0; color: #047857; font-size: 14px;">✓ IFTA calculations and reports</td></tr>
                </table>
              </div>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Subscribe now to pick up right where you left off. Plans start at just <strong>$29/month</strong>.
              </p>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard/settings/billing" style="display: inline-block; padding: 16px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Subscribe Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Questions? Reply to this email — we're here to help.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: "Your Truck Command trial has ended — your data is safe",
        html,
        headers: getEmailHeaders(to)
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send email');
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send trial expired email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send winback email — 7-day post-expiry re-engagement
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.userName - User's display name
 * @param {string} params.reason - 'trial_expired' or 'subscription_canceled'
 */
export async function sendWinbackEmail({ to, userName, reason = 'trial_expired' }) {
  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();

  if (!apiKey) {
    return { success: false, error: 'Email service not configured' };
  }

  const isTrial = reason === 'trial_expired';
  const headline = isTrial ? "We saved your spot" : "We miss you on the road";
  const subtext = isTrial
    ? "It's been a week since your trial ended. Your data is still intact."
    : "It's been a week since you left. Your trucking data is still waiting.";

  const html = `
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
              <div style="font-size: 48px; margin-bottom: 12px;">🚛</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${headline}</h1>
              <p style="margin: 12px 0 0; color: #bfdbfe; font-size: 14px;">${subtext}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hey ${userName || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Running a trucking business is hard enough without juggling spreadsheets. We built Truck Command so you can spend less time on paperwork and more time on the road.
              </p>

              <!-- Value Props -->
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <h3 style="margin: 0 0 16px; color: #1e40af; font-size: 16px;">What you're missing:</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">⚡ Instant IFTA reports (save hours every quarter)</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">📄 Professional invoices in seconds</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">📊 Real-time profit tracking per load</td></tr>
                  <tr><td style="padding: 8px 0; color: #374151; font-size: 15px;">🔔 Compliance alerts before deadlines</td></tr>
                </table>
              </div>

              <!-- Special Offer -->
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 24px; margin: 0 0 24px; text-align: center; border: 2px solid #c084fc;">
                <p style="margin: 0 0 8px; color: #7c3aed; font-size: 14px; font-weight: 600;">SPECIAL OFFER</p>
                <p style="margin: 0 0 8px; color: #581c87; font-size: 28px; font-weight: 700;">20% off your first 3 months</p>
                <p style="margin: 0; color: #7c3aed; font-size: 14px;">Use code <strong>COMEBACK20</strong> at checkout</p>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard/settings/billing" style="display: inline-block; padding: 16px 40px; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Come Back & Save 20%
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; text-align: center;">
                Offer valid for the next 7 days.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; text-align: center;">
                Don't want to receive these emails?
                <a href="${APP_URL}/dashboard/settings/notifications" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: isTrial
          ? "🚛 Your Truck Command data is waiting — 20% off inside"
          : "🚛 We miss you — come back and save 20%",
        html,
        headers: getEmailHeaders(to)
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send email');
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send winback email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to send a generic styled email via Resend
 * Reduces duplication across all email send functions
 */
async function sendEmail({ to, subject, html }) {
  const apiKey = getResendApiKey();
  const fromEmail = getFromEmail();
  if (!apiKey) return { success: false, error: 'Email service not configured' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html, headers: getEmailHeaders(to) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send email');
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send email (${subject}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Standard email shell - wraps content in branded layout
 */
function emailShell({ title, subtitle, content, footerText }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr><td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${title}</h1>
          ${subtitle ? `<p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">${subtitle}</p>` : ''}
        </td></tr>
        <tr><td style="padding: 40px;">${content}</td></tr>
        <tr><td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">${footerText || 'Questions? Reply to this email — we\'re here to help.'}</p>
          ${getComplianceFooterHTML()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function ctaButton(text, url, color = '#2563eb') {
  return `<table role="presentation" style="width: 100%; margin: 24px 0;"><tr><td align="center">
    <a href="${url}" style="display: inline-block; padding: 16px 40px; background-color: ${color}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">${text}</a>
  </td></tr></table>`;
}

// ──────────────────────────────────────────
// Trial Expired Sequence (3 emails)
// ──────────────────────────────────────────

/**
 * Trial Expired Day 3 — Special offer: 20% off first month
 */
export async function sendTrialExpiredDay3Email({ to, userName }) {
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Special offer just for you',
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
        It's been a few days since your trial ended. We know running a trucking business means you're busy — so we want to make coming back as easy as possible.
      </p>
      <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 24px; margin: 0 0 24px; text-align: center; border: 2px solid #c084fc;">
        <p style="margin: 0 0 4px; color: #7c3aed; font-size: 13px; font-weight: 600; text-transform: uppercase;">SPECIAL OFFER</p>
        <p style="margin: 0 0 8px; color: #581c87; font-size: 28px; font-weight: 700;">20% off your first month</p>
        <p style="margin: 0; color: #7c3aed; font-size: 14px;">Use code <strong>COMEBACK20</strong> at checkout</p>
      </div>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        All your loads, invoices, expenses, and IFTA records are still here. Subscribe and pick up right where you left off.
      </p>
      ${ctaButton('Claim Your 20% Discount', `${APP_URL}/dashboard/settings/billing`, '#7c3aed')}
    `
  });
  return sendEmail({ to, subject: "Special offer: 20% off Truck Command — your data is waiting", html });
}

// ──────────────────────────────────────────
// Payment Failed Sequence (3 emails)
// ──────────────────────────────────────────

/**
 * Payment Failed Day 3 — Reminder to update payment method
 */
export async function sendPaymentFailedReminderEmail({ to, userName }) {
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Payment reminder',
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
        Just a friendly reminder — we still haven't been able to process your payment. Your account is still active, but please update your payment method to avoid any interruption.
      </p>
      <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
          <strong>Common fixes:</strong> Update your card number if it expired, check that your bank hasn't blocked the charge, or try a different payment method.
        </p>
      </div>
      ${ctaButton('Update Payment Method', `${APP_URL}/dashboard/settings/billing`)}
    `
  });
  return sendEmail({ to, subject: "Reminder: Please update your payment method", html });
}

/**
 * Payment Failed Day 7 — Final notice before suspension
 */
export async function sendPaymentFailedFinalEmail({ to, userName }) {
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Final payment notice',
    content: `
      <div style="padding: 16px; background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #dc2626; margin-bottom: 24px;">
        <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">Action required to keep your account active</p>
      </div>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
        We've tried multiple times to process your subscription payment without success. <strong>Your account access will be suspended soon</strong> if we can't collect payment.
      </p>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Don't worry — your data is safe. Update your payment method now and you'll keep full access immediately.
      </p>
      ${ctaButton('Update Payment Now', `${APP_URL}/dashboard/settings/billing`, '#dc2626')}
      <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
        Need help? Reply to this email and we'll sort it out.
      </p>
    `
  });
  return sendEmail({ to, subject: "Final notice: Update your payment to keep Truck Command access", html });
}

// ──────────────────────────────────────────
// Transactional Emails
// ──────────────────────────────────────────

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmail({ to, customerName, invoiceNumber, amount, dueDate, pdfUrl }) {
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  const formattedDue = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Upon receipt';

  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: `Invoice ${invoiceNumber}`,
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hello ${customerName || 'there'},</p>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Please find your invoice details below.
      </p>
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 0 0 24px; border: 1px solid #e5e7eb;">
        <table style="width: 100%;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${invoiceNumber}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Due</td><td style="padding: 8px 0; color: #111827; font-size: 20px; font-weight: 700; text-align: right;">${formattedAmount}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${formattedDue}</td></tr>
        </table>
      </div>
      ${pdfUrl ? ctaButton('View Invoice PDF', pdfUrl) : ''}
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">
        If you have any questions about this invoice, please contact us.
      </p>
    `,
    footerText: 'This invoice was sent via Truck Command.'
  });
  return sendEmail({ to, subject: `Invoice ${invoiceNumber} — ${formattedAmount} due ${formattedDue}`, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, userName, resetUrl }) {
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Password Reset',
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      ${ctaButton('Reset Password', resetUrl)}
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    `,
    footerText: 'You received this because a password reset was requested for your account.'
  });
  return sendEmail({ to, subject: "Reset your Truck Command password", html });
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail({ to, userName, verificationUrl }) {
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Verify your email',
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Please verify your email address to complete your account setup.
      </p>
      ${ctaButton('Verify Email Address', verificationUrl)}
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">
        If you didn't create a Truck Command account, you can ignore this email.
      </p>
    `
  });
  return sendEmail({ to, subject: "Verify your email for Truck Command", html });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail({ to, userName, planName, amount, billingPeriod }) {
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Subscription confirmed',
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Welcome aboard! Your subscription is now active.
      </p>
      <div style="background-color: #ecfdf5; border-radius: 12px; padding: 24px; margin: 0 0 24px; text-align: center;">
        <p style="margin: 0 0 4px; color: #065f46; font-size: 14px;">Your Plan</p>
        <p style="margin: 0 0 8px; color: #047857; font-size: 24px; font-weight: 700;">${planName || 'Professional'}</p>
        <p style="margin: 0; color: #065f46; font-size: 16px;">${formattedAmount}/${billingPeriod || 'month'}</p>
      </div>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        You now have full access to all features included in your plan. Your billing will automatically renew each ${billingPeriod || 'month'}.
      </p>
      ${ctaButton('Go to Dashboard', `${APP_URL}/dashboard`)}
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">
        You can manage your subscription anytime from <a href="${APP_URL}/dashboard/settings/billing" style="color: #2563eb;">Settings &gt; Billing</a>.
      </p>
    `
  });
  return sendEmail({ to, subject: `You're subscribed to Truck Command ${planName || 'Professional'}!`, html });
}

/**
 * Send subscription cancellation confirmation email
 */
export async function sendSubscriptionCancellationEmail({ to, userName, endDate }) {
  const formattedEnd = endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'the end of your billing period';
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Subscription canceled',
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
        Your subscription has been canceled. You'll continue to have access until <strong>${formattedEnd}</strong>.
      </p>
      <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">What happens next:</p>
        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
          <li>Full access continues until ${formattedEnd}</li>
          <li>Your data stays safe — we never delete it</li>
          <li>You can resubscribe anytime to restore access</li>
        </ul>
      </div>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Changed your mind? You can reactivate your subscription at any time.
      </p>
      ${ctaButton('Reactivate Subscription', `${APP_URL}/dashboard/settings/billing`)}
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">
        We'd love to know why you left. Reply to this email with feedback — it helps us build a better product for truckers.
      </p>
    `
  });
  return sendEmail({ to, subject: "Your Truck Command subscription has been canceled", html });
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail({ to, userName, amount, invoiceNumber, paymentDate, planName }) {
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const html = emailShell({
    title: '🚛 Truck Command',
    subtitle: 'Payment receipt',
    content: `
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hey ${userName || 'there'},</p>
      <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Thanks for your payment! Here's your receipt.
      </p>
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 0 0 24px; border: 1px solid #e5e7eb;">
        <table style="width: 100%;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${planName || 'Truck Command'}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #111827; font-size: 20px; font-weight: 700; text-align: right;">${formattedAmount}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${formattedDate}</td></tr>
          ${invoiceNumber ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${invoiceNumber}</td></tr>` : ''}
        </table>
      </div>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Manage your billing from <a href="${APP_URL}/dashboard/settings/billing" style="color: #2563eb;">Settings &gt; Billing</a>.
      </p>
    `,
    footerText: 'This is a payment confirmation for your records.'
  });
  return sendEmail({ to, subject: `Payment receipt — ${formattedAmount} for Truck Command`, html });
}

export default {
  sendNotificationEmail,
  sendDigestEmail,
  sendOnboardingEmail,
  sendPaymentFailedEmail,
  sendPaymentFailedReminderEmail,
  sendPaymentFailedFinalEmail,
  sendTrialExpiredEmail,
  sendTrialExpiredDay3Email,
  sendWinbackEmail,
  sendInvoiceEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionCancellationEmail,
  sendPaymentReceiptEmail,
  isEmailServiceConfigured
};
