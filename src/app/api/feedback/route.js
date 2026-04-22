import { NextResponse } from 'next/server';
import { enforcePublicFormRateLimit, getClientIp } from '@/lib/utils/publicFormRateLimit';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Truck Command <notifications@truckcommand.com>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@truckcommand.com';

const FEEDBACK_TYPE_LABELS = {
  general: 'General Feedback',
  feature: 'Feature Request',
  bug: 'Bug Report',
};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function starsDisplay(rating) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function buildHtml({ name, email, feedbackType, feedbackLabel, rating, message }) {
  const messageHtml = escapeHtml(message).replace(/\n/g, '<br>');
  const typeColors = {
    general: { bg: '#dbeafe', fg: '#1e40af' },
    feature: { bg: '#fef3c7', fg: '#92400e' },
    bug: { bg: '#fee2e2', fg: '#991b1b' },
  };
  const c = typeColors[feedbackType] || typeColors.general;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.08);border-collapse:collapse;">
      <tr><td style="padding:24px 32px;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">New Feedback Submission</h1>
        <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Received from truckcommand.com/feedback</p>
      </td></tr>
      <tr><td style="padding:24px 32px 8px;">
        <div style="display:inline-block;padding:6px 12px;background:${c.bg};color:${c.fg};border-radius:999px;font-size:12px;font-weight:600;letter-spacing:0.3px;">${escapeHtml(feedbackLabel)}</div>
        <div style="margin-top:12px;color:#f59e0b;font-size:18px;letter-spacing:2px;">${starsDisplay(rating)} <span style="color:#6b7280;font-size:13px;margin-left:8px;">${rating}/5</span></div>
      </td></tr>
      <tr><td style="padding:8px 32px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;">
          <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;width:140px;">Name</td><td style="padding:6px 12px;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Email</td><td style="padding:6px 12px;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(email)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px 24px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Feedback</p>
        <div style="padding:16px;background:#f9fafb;border-left:4px solid #2563eb;border-radius:6px;color:#374151;font-size:14px;line-height:1.6;">${messageHtml}</div>
      </td></tr>
      <tr><td style="padding:16px 32px;background:#f9fafb;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;">
        Reply directly to this email to respond to ${escapeHtml(name)}.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function buildText({ name, email, feedbackLabel, rating, message }) {
  return [
    'New feedback submission from truckcommand.com/feedback',
    '',
    `Type: ${feedbackLabel}`,
    `Rating: ${rating}/5`,
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    'Feedback:',
    message,
  ].join('\n');
}

export async function POST(request) {
  try {
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = enforcePublicFormRateLimit(ip, 'feedback');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, feedbackType, rating, message, website } = body;

    if (website) {
      return NextResponse.json({ success: true });
    }

    const trimmedName = String(name || '').trim();
    const trimmedEmail = String(email || '').trim();
    const trimmedMessage = String(message || '').trim();
    const typeKey = FEEDBACK_TYPE_LABELS[feedbackType] ? feedbackType : 'general';
    const ratingNum = Math.max(1, Math.min(5, Number(rating) || 5));

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json({ error: 'Name, email and feedback are required.' }, { status: 400 });
    }
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (trimmedMessage.length > 5000 || trimmedName.length > 200) {
      return NextResponse.json({ error: 'Submission too long.' }, { status: 400 });
    }

    const feedbackLabel = FEEDBACK_TYPE_LABELS[typeKey];
    const subject = `[Feedback — ${feedbackLabel}] ${trimmedName} (${ratingNum}/5)`;

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      feedbackType: typeKey,
      feedbackLabel,
      rating: ratingNum,
      message: trimmedMessage,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SUPPORT_EMAIL],
        reply_to: trimmedEmail,
        subject,
        html: buildHtml(payload),
        text: buildText(payload),
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Feedback form email failed:', result);
      return NextResponse.json({ error: 'Failed to send feedback. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (err) {
    console.error('Feedback form error:', err);
    return NextResponse.json({ error: 'Failed to send feedback. Please try again.' }, { status: 500 });
  }
}
