import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Truck Command <invoices@truckcommand.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://truckcommand.com';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Generate HTML email template for invoice
 */
function generateInvoiceEmailHTML({ invoice, message, includePaymentLink, companyInfo }) {
  const amountDue = (invoice.total || 0) - (invoice.amount_paid || 0);
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountDue);
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total || 0);
  const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Escape HTML in message and convert newlines to <br>
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const companyName = companyInfo?.company_name || 'Your Company';
  const companyAddress = companyInfo?.company_address || '';
  const companyCity = companyInfo?.company_city || '';
  const companyState = companyInfo?.company_state || '';
  const companyZip = companyInfo?.company_zip || '';
  const companyPhone = companyInfo?.phone || '';

  const fullAddress = [companyAddress, companyCity, companyState, companyZip].filter(Boolean).join(', ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${invoice.invoice_number}</title>
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
                      ${companyName}
                    </h1>
                    ${fullAddress ? `<p style="margin: 8px 0 0 0; color: #bfdbfe; font-size: 14px;">${fullAddress}</p>` : ''}
                    ${companyPhone ? `<p style="margin: 4px 0 0 0; color: #bfdbfe; font-size: 14px;">${companyPhone}</p>` : ''}
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; padding: 8px 16px; background-color: rgba(255,255,255,0.2); border-radius: 8px; color: #ffffff; font-size: 14px; font-weight: 600;">
                      INVOICE
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Details Banner -->
          <tr>
            <td style="padding: 24px 40px; background-color: #eff6ff; border-bottom: 1px solid #dbeafe;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 50%;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</p>
                    <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">#${invoice.invoice_number}</p>
                  </td>
                  <td style="width: 50%; text-align: right;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
                    <p style="margin: 0; color: #2563eb; font-size: 24px; font-weight: 700;">${formattedAmount}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bill To & Dates -->
          <tr>
            <td style="padding: 32px 40px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Bill To</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${invoice.customer || 'Customer'}</p>
                    ${invoice.customer_email ? `<p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${invoice.customer_email}</p>` : ''}
                    ${invoice.customer_address ? `<p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${invoice.customer_address}</p>` : ''}
                  </td>
                  <td style="width: 50%; vertical-align: top; text-align: right;">
                    <table role="presentation" style="margin-left: auto;">
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Invoice Date:</td>
                        <td style="padding: 4px 0 4px 16px; color: #111827; font-size: 14px; font-weight: 500;">${invoiceDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Due Date:</td>
                        <td style="padding: 4px 0 4px 16px; color: #111827; font-size: 14px; font-weight: 500;">${dueDate}</td>
                      </tr>
                      ${invoice.payment_terms ? `
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Terms:</td>
                        <td style="padding: 4px 0 4px 16px; color: #111827; font-size: 14px; font-weight: 500;">${invoice.payment_terms}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <div style="padding: 24px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb;">
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
                  ${escapedMessage}
                </p>
              </div>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Description</td>
                  <td style="padding: 12px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; border-bottom: 2px solid #e5e7eb;">Amount</td>
                </tr>
                <tr>
                  <td style="padding: 16px; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Invoice Total</td>
                  <td style="padding: 16px; color: #374151; font-size: 14px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formattedTotal}</td>
                </tr>
                ${invoice.amount_paid > 0 ? `
                <tr>
                  <td style="padding: 16px; color: #059669; font-size: 14px; border-bottom: 1px solid #e5e7eb;">Amount Paid</td>
                  <td style="padding: 16px; color: #059669; font-size: 14px; text-align: right; border-bottom: 1px solid #e5e7eb;">-${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount_paid)}</td>
                </tr>
                ` : ''}
                <tr style="background-color: #eff6ff;">
                  <td style="padding: 16px; color: #1e40af; font-size: 16px; font-weight: 700;">Amount Due</td>
                  <td style="padding: 16px; color: #1e40af; font-size: 16px; font-weight: 700; text-align: right;">${formattedAmount}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${includePaymentLink ? `
          <!-- Payment Button -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/pay/${invoice.id}" style="display: inline-block; padding: 16px 48px; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Pay Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Notes -->
          ${invoice.notes ? `
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p>
              <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${invoice.notes}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="color: #6b7280; font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0;">
                      Thank you for your business!
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      This invoice was sent from ${companyName} via Truck Command.
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
 * Verify authentication
 */
async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Invalid token' };
  }

  return { user, error: null };
}

export async function POST(request) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError) {
      return Response.json({ error: authError }, { status: 401 });
    }

    // Check if email service is configured
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { invoiceId, to, cc, bcc, subject, message, includePdf, includePaymentLink } = body;

    if (!invoiceId || !to || !subject || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get user's company info for the email
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_name, company_address, company_city, company_state, company_zip, phone')
      .eq('id', user.id)
      .single();

    // Build recipient list
    const recipients = [to];
    const ccRecipients = cc ? cc.split(',').map(e => e.trim()).filter(Boolean) : [];
    const bccRecipients = bcc ? bcc.split(',').map(e => e.trim()).filter(Boolean) : [];

    // Generate email HTML
    const htmlContent = generateInvoiceEmailHTML({
      invoice,
      message,
      includePaymentLink,
      companyInfo: userProfile
    });

    // Send email via Resend
    const emailPayload = {
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html: htmlContent
    };

    if (ccRecipients.length > 0) {
      emailPayload.cc = ccRecipients;
    }
    if (bccRecipients.length > 0) {
      emailPayload.bcc = bccRecipients;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const emailResult = await response.json();

    if (!response.ok) {
      throw new Error(emailResult.message || 'Failed to send email');
    }

    // Update invoice status and last_sent timestamp
    await supabase
      .from('invoices')
      .update({
        last_sent: new Date().toISOString(),
        status: invoice.status === 'Draft' ? 'Sent' : invoice.status
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id);

    // Record the activity
    await supabase
      .from('invoice_activities')
      .insert([{
        invoice_id: invoiceId,
        activity_type: 'email',
        description: `Invoice emailed to ${to}${ccRecipients.length > 0 ? ` (CC: ${ccRecipients.join(', ')})` : ''}`,
        user_id: user.id,
        user_name: user.email
      }]);

    return Response.json({
      success: true,
      messageId: emailResult.id,
      message: 'Invoice sent successfully'
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return Response.json({
      error: error.message || 'Failed to send invoice email'
    }, { status: 500 });
  }
}
