import { NextResponse } from 'next/server';
import { sendNotificationEmail, isEmailServiceConfigured } from '@/lib/services/emailService';
import { sendNotificationSMS, isSMSServiceConfigured, formatPhoneE164 } from '@/lib/services/smsService';

/**
 * Test endpoint for notification delivery
 * POST /api/notifications/test
 *
 * Body: {
 *   email?: string,      // Email to test (required for email test)
 *   phone?: string,      // Phone to test (required for SMS test)
 *   testEmail?: boolean, // Test email delivery
 *   testSMS?: boolean    // Test SMS delivery
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, phone, testEmail = true, testSMS = false } = body;

    const results = {
      config: {
        emailConfigured: isEmailServiceConfigured(),
        smsConfigured: isSMSServiceConfigured()
      },
      email: null,
      sms: null
    };

    // Test notification object
    const testNotification = {
      id: 'test-notification',
      title: 'Test Notification from Truck Command',
      message: 'This is a test notification to verify your email and SMS settings are working correctly. If you received this, your notification system is configured properly!',
      notification_type: 'SYSTEM_ALERT',
      urgency: 'HIGH', // HIGH so SMS will send
      link_to: '/dashboard/notifications',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    // Test email
    if (testEmail && email) {
      if (!isEmailServiceConfigured()) {
        results.email = {
          success: false,
          error: 'Email service not configured. Set RESEND_API_KEY in environment variables.'
        };
      } else {
        const emailResult = await sendNotificationEmail({
          to: email,
          notification: testNotification
        });
        results.email = emailResult;
      }
    }

    // Test SMS
    if (testSMS && phone) {
      if (!isSMSServiceConfigured()) {
        results.sms = {
          success: false,
          error: 'SMS service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.'
        };
      } else {
        // Format phone number to E.164
        const formattedPhone = formatPhoneE164(phone);
        if (!formattedPhone) {
          results.sms = {
            success: false,
            error: 'Invalid phone number format. Use format like (555) 123-4567 or +15551234567'
          };
        } else {
          const smsResult = await sendNotificationSMS({
            to: formattedPhone,
            notification: testNotification
          });
          results.sms = smsResult;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test completed',
      results
    });

  } catch (error) {
    console.error('Notification test error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET handler to check configuration status
 */
export async function GET() {
  return NextResponse.json({
    emailConfigured: isEmailServiceConfigured(),
    smsConfigured: isSMSServiceConfigured(),
    instructions: {
      email: 'Set RESEND_API_KEY and EMAIL_FROM environment variables',
      sms: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables'
    }
  });
}
