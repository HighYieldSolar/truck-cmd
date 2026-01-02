import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[cron/weekly-summary]', ...args);

/**
 * Cron job for weekly business summary emails
 * Runs every Monday at 9 AM to send weekly performance summaries
 */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const results = {
      timestamp: now.toISOString(),
      summaries: { sent: 0, skipped: 0, errors: [] }
    };

    // Get all active subscribers
    const { data: activeUsers, error } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        status,
        users!inner (id, email, full_name)
      `)
      .in('status', ['active', 'trialing'])
      .not('users.email', 'is', null);

    if (error) throw error;

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active users to send summaries',
        results
      });
    }

    for (const subscription of activeUsers) {
      const user = subscription.users;

      try {
        // Get weekly stats for this user
        const stats = await getWeeklyStats(supabase, user.id, oneWeekAgo, now);

        // Skip if no activity
        if (stats.loadsCompleted === 0 && stats.invoicesCreated === 0 && stats.expensesLogged === 0) {
          results.summaries.skipped++;
          continue;
        }

        // Send summary email
        const emailResult = await sendWeeklySummaryEmail({
          to: user.email,
          userName: user.full_name?.split(' ')[0],
          stats,
          weekStart: oneWeekAgo,
          weekEnd: now
        });

        if (emailResult.success) {
          results.summaries.sent++;
        } else {
          results.summaries.errors.push({
            userId: user.id,
            error: emailResult.error
          });
        }
      } catch (err) {
        results.summaries.errors.push({
          userId: user.id,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    log('Weekly summary cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get weekly statistics for a user
 */
async function getWeeklyStats(supabase, userId, startDate, endDate) {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  // Loads completed this week
  const { count: loadsCompleted } = await supabase
    .from('loads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'Delivered')
    .gte('updated_at', startIso)
    .lte('updated_at', endIso);

  // Total miles this week
  const { data: mileageData } = await supabase
    .from('loads')
    .select('miles')
    .eq('user_id', userId)
    .eq('status', 'Delivered')
    .gte('updated_at', startIso)
    .lte('updated_at', endIso);

  const totalMiles = mileageData?.reduce((sum, load) => sum + (load.miles || 0), 0) || 0;

  // Invoices created this week
  const { count: invoicesCreated } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startIso)
    .lte('created_at', endIso);

  // Revenue from invoices created this week
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('total')
    .eq('user_id', userId)
    .gte('created_at', startIso)
    .lte('created_at', endIso);

  const revenue = invoiceData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  // Payments received this week
  const { data: paymentData } = await supabase
    .from('invoices')
    .select('total')
    .eq('user_id', userId)
    .eq('status', 'Paid')
    .gte('updated_at', startIso)
    .lte('updated_at', endIso);

  const paymentsReceived = paymentData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  // Expenses logged this week
  const { count: expensesLogged, data: expenseData } = await supabase
    .from('expenses')
    .select('amount', { count: 'exact' })
    .eq('user_id', userId)
    .gte('date', startIso.split('T')[0])
    .lte('date', endIso.split('T')[0]);

  const totalExpenses = expenseData?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

  // Fuel purchases this week
  const { data: fuelData } = await supabase
    .from('fuel_purchases')
    .select('total_cost, gallons')
    .eq('user_id', userId)
    .gte('date', startIso.split('T')[0])
    .lte('date', endIso.split('T')[0]);

  const fuelCost = fuelData?.reduce((sum, f) => sum + (f.total_cost || 0), 0) || 0;
  const gallons = fuelData?.reduce((sum, f) => sum + (f.gallons || 0), 0) || 0;

  return {
    loadsCompleted: loadsCompleted || 0,
    totalMiles,
    invoicesCreated: invoicesCreated || 0,
    revenue,
    paymentsReceived,
    expensesLogged: expensesLogged || 0,
    totalExpenses,
    fuelCost,
    gallons,
    netProfit: paymentsReceived - totalExpenses - fuelCost
  };
}

/**
 * Send weekly summary email
 */
async function sendWeeklySummaryEmail({ to, userName, stats, weekStart, weekEnd }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.EMAIL_FROM || 'Truck Command <notifications@truckcommand.com>';
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://truckcommand.com';

  if (!RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }

  const formatCurrency = (amount) => `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNumber = (num) => (num || 0).toLocaleString();

  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

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

          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">📊 Your Weekly Summary</h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">${weekRange}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                Hey ${userName || 'there'}, here's how your trucking business performed this week:
              </p>

              <!-- Stats Grid -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="width: 50%; padding: 16px; background-color: #f0f9ff; border-radius: 12px 0 0 0;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Loads Completed</p>
                    <p style="margin: 0; color: #1e40af; font-size: 28px; font-weight: 700;">${stats.loadsCompleted}</p>
                  </td>
                  <td style="width: 50%; padding: 16px; background-color: #f0fdf4; border-radius: 0 12px 0 0;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Miles Driven</p>
                    <p style="margin: 0; color: #065f46; font-size: 28px; font-weight: 700;">${formatNumber(stats.totalMiles)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 16px; background-color: #fef3c7; border-radius: 0 0 0 12px;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Revenue Invoiced</p>
                    <p style="margin: 0; color: #92400e; font-size: 28px; font-weight: 700;">${formatCurrency(stats.revenue)}</p>
                  </td>
                  <td style="width: 50%; padding: 16px; background-color: #ecfdf5; border-radius: 0 0 12px 0;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Payments Received</p>
                    <p style="margin: 0; color: #065f46; font-size: 28px; font-weight: 700;">${formatCurrency(stats.paymentsReceived)}</p>
                  </td>
                </tr>
              </table>

              <!-- Expenses Summary -->
              <div style="background-color: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #991b1b; font-size: 14px; text-transform: uppercase;">Expenses This Week</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="color: #374151; padding: 4px 0;">Fuel (${formatNumber(stats.gallons)} gal)</td>
                    <td style="text-align: right; color: #dc2626; font-weight: 600;">${formatCurrency(stats.fuelCost)}</td>
                  </tr>
                  <tr>
                    <td style="color: #374151; padding: 4px 0;">Other Expenses (${stats.expensesLogged})</td>
                    <td style="text-align: right; color: #dc2626; font-weight: 600;">${formatCurrency(stats.totalExpenses)}</td>
                  </tr>
                </table>
              </div>

              <!-- Net Profit -->
              <div style="background: linear-gradient(135deg, ${stats.netProfit >= 0 ? '#ecfdf5' : '#fef2f2'} 0%, ${stats.netProfit >= 0 ? '#d1fae5' : '#fee2e2'} 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Estimated Net This Week</p>
                <p style="margin: 0; color: ${stats.netProfit >= 0 ? '#065f46' : '#991b1b'}; font-size: 36px; font-weight: 700;">
                  ${stats.netProfit >= 0 ? '' : '-'}${formatCurrency(Math.abs(stats.netProfit))}
                </p>
              </div>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      View Full Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Truck Command | Your weekly summary every Monday
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
        subject: `📊 Your Weekly Summary: ${stats.loadsCompleted} loads, ${formatCurrency(stats.paymentsReceived)} collected`,
        html
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  return GET(request);
}
