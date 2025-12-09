// src/lib/services/smsService.js
// SMS service for sending notification texts via Twilio

/**
 * SMS Service for Truck Command
 *
 * Supports sending notification SMS messages for critical alerts.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.
 *
 * Usage:
 *   import { sendNotificationSMS } from '@/lib/services/smsService';
 *   await sendNotificationSMS({ to: '+1234567890', notification });
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://truckcommand.com';

/**
 * Get urgency prefix for SMS
 */
function getUrgencyPrefix(urgency) {
  switch (urgency) {
    case 'CRITICAL': return '🚨 CRITICAL: ';
    case 'HIGH': return '⚠️ URGENT: ';
    case 'MEDIUM': return '📢 ';
    default: return '';
  }
}

/**
 * Format notification for SMS (keep it short - SMS has 160 char limit per segment)
 */
function formatNotificationForSMS(notification) {
  const prefix = getUrgencyPrefix(notification.urgency);
  const title = notification.title;

  // Create a short version of the message
  let message = notification.message;
  if (message.length > 100) {
    message = message.substring(0, 97) + '...';
  }

  // Combine prefix, title and short message
  let smsText = `${prefix}${title}\n${message}`;

  // Add short link if available
  if (notification.link_to) {
    const shortUrl = `${APP_URL}${notification.link_to}`;
    smsText += `\n${shortUrl}`;
  }

  return smsText;
}

/**
 * Send a notification via SMS
 * @param {Object} params - SMS parameters
 * @param {string} params.to - Recipient phone number (E.164 format: +1234567890)
 * @param {Object} params.notification - Notification object
 * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
 */
export async function sendNotificationSMS({ to, notification }) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, skipping SMS');
    return { success: false, error: 'SMS service not configured' };
  }

  // Validate phone number format
  if (!to || !to.match(/^\+[1-9]\d{1,14}$/)) {
    return { success: false, error: 'Invalid phone number format. Use E.164 format (+1234567890)' };
  }

  // Only send SMS for HIGH and CRITICAL urgency by default
  if (!['HIGH', 'CRITICAL'].includes(notification.urgency)) {
    return { success: false, error: 'SMS only sent for HIGH and CRITICAL urgency notifications' };
  }

  try {
    const messageBody = formatNotificationForSMS(notification);

    // Use Twilio REST API directly
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: messageBody
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send SMS');
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('Failed to send notification SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a simple text message
 * @param {Object} params - SMS parameters
 * @param {string} params.to - Recipient phone number (E.164 format)
 * @param {string} params.message - Message text
 * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
 */
export async function sendSMS({ to, message }) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, skipping SMS');
    return { success: false, error: 'SMS service not configured' };
  }

  if (!to || !to.match(/^\+[1-9]\d{1,14}$/)) {
    return { success: false, error: 'Invalid phone number format' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send SMS');
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if SMS service is configured
 */
export function isSMSServiceConfigured() {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

/**
 * Format phone number to E.164
 * @param {string} phone - Phone number in any format
 * @param {string} defaultCountry - Default country code (default: '1' for US)
 * @returns {string|null} - E.164 formatted number or null if invalid
 */
export function formatPhoneE164(phone, defaultCountry = '1') {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If already has country code (11+ digits starting with 1 for US)
  if (digits.length >= 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If 10 digits, assume US and add country code
  if (digits.length === 10) {
    return `+${defaultCountry}${digits}`;
  }

  // If already in E.164 format
  if (phone.startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

export default {
  sendNotificationSMS,
  sendSMS,
  isSMSServiceConfigured,
  formatPhoneE164
};
