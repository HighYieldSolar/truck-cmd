import { NextResponse } from 'next/server';
import { enforcePublicFormRateLimit, getClientIp } from '@/lib/utils/publicFormRateLimit';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Truck Command <notifications@truckcommand.com>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@truckcommand.com';

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

function buildHtml({ name, email, phone, company, fleetSize, message }) {
  const messageHtml = escapeHtml(message).replace(/\n/g, '<br>');
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;width:140px;">${label}</td><td style="padding:6px 12px;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(value)}</td></tr>`
      : '';

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.08);border-collapse:collapse;">
      <tr><td style="padding:24px 32px;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">New Contact Form Submission</h1>
        <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Received from truckcommand.com/contact</p>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;">
          ${row('Name', name)}
          ${row('Email', email)}
          ${row('Phone', phone)}
          ${row('Company', company)}
          ${row('Fleet size', fleetSize)}
        </table>
      </td></tr>
      <tr><td style="padding:0 32px 24px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <div style="padding:16px;background:#f9fafb;border-left:4px solid #2563eb;border-radius:6px;color:#374151;font-size:14px;line-height:1.6;">${messageHtml}</div>
      </td></tr>
      <tr><td style="padding:16px 32px;background:#f9fafb;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;">
        Reply directly to this email to respond to ${escapeHtml(name)}.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function buildText({ name, email, phone, company, fleetSize, message }) {
  return [
    'New contact form submission from truckcommand.com/contact',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    company ? `Company: ${company}` : null,
    fleetSize ? `Fleet size: ${fleetSize}` : null,
    '',
    'Message:',
    message,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function POST(request) {
  try {
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = enforcePublicFormRateLimit(ip, 'contact');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, phone, company, fleetSize, message, website } = body;

    // Honeypot — real users leave this blank; bots auto-fill it
    if (website) {
      return NextResponse.json({ success: true });
    }

    const trimmedName = String(name || '').trim();
    const trimmedEmail = String(email || '').trim();
    const trimmedMessage = String(message || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
    }
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (trimmedMessage.length > 5000 || trimmedName.length > 200) {
      return NextResponse.json({ error: 'Submission too long.' }, { status: 400 });
    }

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: String(phone || '').trim(),
      company: String(company || '').trim(),
      fleetSize: String(fleetSize || '').trim(),
      message: trimmedMessage,
    };

    const subject = `[Contact] ${trimmedName}${payload.company ? ` — ${payload.company}` : ''}`;

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
      console.error('Contact form email failed:', result);
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
