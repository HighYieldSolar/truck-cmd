// src/lib/services/invoiceService.js
import { supabase } from "../supabaseClient";
import { NotificationService, URGENCY_LEVELS } from "./notificationService";
import { getLimit } from "@/config/tierConfig";

/**
 * Fetch all invoices for the current user with optional filters
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Filters to apply to the query
 * @returns {Promise<Array>} - Array of invoice objects
 */
export async function fetchInvoices(userId, filters = {}) {
  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        loads (id, load_number, origin, destination)
      `)
      .eq('user_id', userId);

    // Apply filters if provided
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,customer.ilike.%${filters.search}%`);
    }

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'thisMonth': {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          query = query
            .gte('invoice_date', firstDay.toISOString().split('T')[0])
            .lte('invoice_date', lastDay.toISOString().split('T')[0]);
          break;
        }
        case 'last30': {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          
          query = query.gte('invoice_date', thirtyDaysAgo.toISOString().split('T')[0]);
          break;
        }
        case 'last90': {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(now.getDate() - 90);
          
          query = query.gte('invoice_date', ninetyDaysAgo.toISOString().split('T')[0]);
          break;
        }
        case 'thisYear': {
          const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
          
          query = query.gte('invoice_date', firstDayOfYear.toISOString().split('T')[0]);
          break;
        }
        case 'lastMonth': {
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          
          query = query
            .gte('invoice_date', firstDayLastMonth.toISOString().split('T')[0])
            .lte('invoice_date', lastDayLastMonth.toISOString().split('T')[0]);
          break;
        }
        case 'custom': {
          if (filters.startDate) {
            query = query.gte('invoice_date', filters.startDate);
          }
          if (filters.endDate) {
            query = query.lte('invoice_date', filters.endDate);
          }
          break;
        }
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortDirection === 'desc' 
        ? { ascending: false } 
        : { ascending: true };
      
      query = query.order(filters.sortBy, order);
    } else {
      // Default sort by invoice date, newest first
      query = query.order('invoice_date', { ascending: false });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get invoice by ID
 * @param {string} id - Invoice ID
 * @returns {Promise<Object|null>} - Invoice object or null
 */
export async function getInvoiceById(id) {
  try {
    // Fetch invoice with its items and load information
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        loads (id, load_number, origin, destination, customer, description)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!invoice) return null;
    
    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('id', { ascending: true });
      
    if (itemsError) throw itemsError;
    
    // Add items to the invoice object
    return {
      ...invoice,
      items: items || []
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate an invoice number with collision avoidance
 * @param {string} userId - User ID for querying existing invoice numbers
 * @param {number} attempt - Current attempt number (for retry logic)
 * @returns {Promise<string>} - Generated invoice number
 */
export async function generateInvoiceNumber(userId, attempt = 0) {
  try {
    const currentYear = new Date().getFullYear();

    // Get the highest invoice number for the current year
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', userId)
      .ilike('invoice_number', `INV-${currentYear}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;

    if (data && data.length > 0) {
      // Extract the numeric part from the highest invoice number
      const lastInvoice = data[0].invoice_number;
      const matches = lastInvoice.match(/-(\d+)$/);

      if (matches && matches[1]) {
        nextNumber = parseInt(matches[1], 10) + 1;
      }
    }

    // Add attempt offset to handle concurrent requests
    nextNumber += attempt;

    // Format with leading zeros for at least 4 digits
    return `INV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    // Fallback to a timestamp-based number with random suffix if there's an error
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${randomSuffix}`;
  }
}

/**
 * Check if an invoice number already exists for a user
 * @param {string} userId - User ID
 * @param {string} invoiceNumber - Invoice number to check
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
async function invoiceNumberExists(userId, invoiceNumber) {
  const { data, error } = await supabase
    .from('invoices')
    .select('id')
    .eq('user_id', userId)
    .eq('invoice_number', invoiceNumber)
    .limit(1);

  if (error) return false;
  return data && data.length > 0;
}

/**
 * Get the count of invoices created this month for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Count of invoices this month
 */
export async function getMonthlyInvoiceCount(userId) {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth.toISOString());

    if (error) throw error;
    return count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if user can create more invoices based on their plan limits
 * @param {string} userId - User ID
 * @param {string} userPlan - User's subscription plan
 * @returns {Promise<{allowed: boolean, currentCount: number, limit: number, error?: string}>}
 */
export async function checkInvoiceLimitForUser(userId, userPlan) {
  const plan = userPlan?.toLowerCase() || 'basic';
  const limit = getLimit(plan, 'invoicesPerMonth');

  // Unlimited plans always allowed
  if (limit === Infinity) {
    return { allowed: true, currentCount: 0, limit: Infinity };
  }

  const currentCount = await getMonthlyInvoiceCount(userId);

  if (currentCount >= limit) {
    return {
      allowed: false,
      currentCount,
      limit,
      error: `Monthly invoice limit reached (${currentCount}/${limit}). Upgrade your plan for unlimited invoices.`
    };
  }

  return { allowed: true, currentCount, limit };
}

/**
 * Create a new invoice with retry logic for duplicate invoice numbers
 * @param {Object} invoiceData - Invoice data
 * @param {string} userPlan - User's subscription plan (optional, for limit checking)
 * @param {number} retryAttempt - Current retry attempt (internal use)
 * @returns {Promise<Object|null>} - Created invoice or null
 */
export async function createInvoice(invoiceData, userPlan = null, retryAttempt = 0) {
  const MAX_RETRIES = 3;

  try {
    const { supabase } = await import('../supabaseClient');

    // Server-side limit enforcement if plan is provided
    if (userPlan && invoiceData.user_id) {
      const limitCheck = await checkInvoiceLimitForUser(invoiceData.user_id, userPlan);
      if (!limitCheck.allowed) {
        throw new Error(limitCheck.error);
      }
    }

    // Extract items
    const items = invoiceData.items || [];

    // Remove items from main invoice data
    const { items: _, ...invoiceDataWithoutItems } = invoiceData;

    // If invoice_number might conflict, check and regenerate if needed
    if (invoiceDataWithoutItems.invoice_number && retryAttempt > 0) {
      // Regenerate invoice number with attempt offset
      invoiceDataWithoutItems.invoice_number = await generateInvoiceNumber(
        invoiceDataWithoutItems.user_id,
        retryAttempt
      );
    }

    // 1. Insert the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([invoiceDataWithoutItems])
      .select();

    // Handle duplicate key error (invoice number collision)
    if (error) {
      const isDuplicateError = error.code === '23505' ||
        error.message?.includes('duplicate') ||
        error.message?.includes('unique');

      if (isDuplicateError && retryAttempt < MAX_RETRIES) {
        // Retry with a new invoice number
        return createInvoice(invoiceData, userPlan, retryAttempt + 1);
      }
      throw error;
    }

    if (!invoice || invoice.length === 0) {
      throw new Error('Failed to create invoice');
    }

    const invoiceId = invoice[0].id;

    // 2. Insert invoice items if there are any
    if (items.length > 0) {
      // Add invoice_id to each item
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: invoiceId
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        // If there's an error inserting items, delete the invoice
        await supabase.from('invoices').delete().eq('id', invoiceId);
        throw itemsError;
      }
    }

    // 3. Record the activity
    await supabase
      .from('invoice_activities')
      .insert([{
        invoice_id: invoiceId,
        activity_type: 'created',
        description: 'Invoice created',
        user_id: invoiceData.user_id,
        user_name: 'User'
      }]);

    // Return the created invoice
    return await getInvoiceById(invoiceId);
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing invoice
 * @param {string} id - Invoice ID
 * @param {Object} invoiceData - Updated invoice data
 * @returns {Promise<Object|null>} - Updated invoice or null
 */
export async function updateInvoice(id, invoiceData) {
  try {
    const { supabase } = await import('../supabaseClient');
    
    // Extract items
    const items = invoiceData.items || [];
    
    // Remove items from main invoice data
    const { items: _, ...invoiceDataWithoutItems } = invoiceData;
    
    // Begin a transaction using supabase (although not natively supported, we can mimic it)
    
    // 1. Update the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(invoiceDataWithoutItems)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    if (!invoice || invoice.length === 0) {
      throw new Error('Failed to update invoice');
    }
    
    // 2. Handle invoice items - delete existing and insert new
    
    // First delete existing items
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
      
    if (deleteError) throw deleteError;
    
    // Then insert new items
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: id
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);
        
      if (itemsError) throw itemsError;
    }
    
    // 3. Record the activity
    await supabase
      .from('invoice_activities')
      .insert([{
        invoice_id: id,
        activity_type: 'updated',
        description: 'Invoice updated',
        user_id: invoiceData.user_id,
        user_name: 'User' // This would ideally be fetched from the user profile
      }]);
    
    // Return the updated invoice
    return await getInvoiceById(id);
  } catch (error) {
    throw error;
  }
}

/**
 * Delete an invoice
 * @param {string} id - Invoice ID
 * @param {boolean} deleteAssociatedLoad - Whether to also delete associated load
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteInvoice(id, deleteAssociatedLoad = false) {
  try {
    // Get the invoice first to check for associated load
    let loadId = null;
    if (deleteAssociatedLoad) {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('load_id')
        .eq('id', id)
        .single();
        
      if (!invoiceError && invoice && invoice.load_id) {
        loadId = invoice.load_id;
      }
    }
    
    // First delete related records (to maintain referential integrity)
    
    // 1. Delete invoice items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
      
    if (itemsError) throw itemsError;
    
    // 2. Delete invoice activities
    const { error: activitiesError } = await supabase
      .from('invoice_activities')
      .delete()
      .eq('invoice_id', id);
      
    if (activitiesError) throw activitiesError;
    
    // 3. Delete payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('invoice_id', id);
      
    if (paymentsError) throw paymentsError;
    
    // 4. Delete the invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // 5. Delete associated load if requested and it exists
    if (deleteAssociatedLoad && loadId) {
      // Delete the load (errors ignored since invoice was already deleted)
      await supabase
        .from('loads')
        .delete()
        .eq('id', loadId);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Update invoice status
 * @param {string} id - Invoice ID
 * @param {string} status - New status ('Pending', 'Sent', 'Paid', 'Overdue', etc.)
 * @returns {Promise<Object|null>} - Updated invoice or null
 */
export async function updateInvoiceStatus(id, status) {
  try {
    // Get the current user for activity tracking
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update the invoice status
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        status,
        // If status is 'Paid', set payment date to now
        ...(status.toLowerCase() === 'paid' ? { payment_date: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    // Record the activity
    await supabase
      .from('invoice_activities')
      .insert([{
        invoice_id: id,
        activity_type: 'status_change',
        description: `Invoice status changed to ${status}`,
        user_id: user?.id,
        user_name: user?.email
      }]);
    
    return data?.[0] || null;
  } catch (error) {
    throw error;
  }
}

/**
 * Record payment for an invoice
 * @param {string} invoiceId - Invoice ID
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object|null>} - Payment record or null
 */
export async function recordPayment(invoiceId, paymentData) {
  try {
    // Get the current user for activity tracking
    const { data: { user } } = await supabase.auth.getUser();
    
    // First check if this invoice already has the correct payment amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total, amount_paid, status')
      .eq('id', invoiceId)
      .single();
      
    if (invoiceError) throw invoiceError;
    
    // Calculate what the new total paid amount would be
    const currentAmountPaid = parseFloat(invoice.amount_paid) || 0;
    const paymentAmount = parseFloat(paymentData.amount) || 0;
    const invoiceTotal = parseFloat(invoice.total) || 0;
    
    // If the invoice is already fully paid, don't add another payment
    if (currentAmountPaid >= invoiceTotal || invoice.status === 'Paid') {
      return null;
    }

    // If this payment would exceed the invoice total, adjust it
    const adjustedPaymentAmount = Math.min(paymentAmount, invoiceTotal - currentAmountPaid);

    if (adjustedPaymentAmount <= 0) {
      return null;
    }
    
    // Adjust payment data amount if needed
    const finalPaymentData = {
      ...paymentData,
      amount: adjustedPaymentAmount
    };
    
    // Insert payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        ...finalPaymentData,
        invoice_id: invoiceId,
        user_id: user?.id
      }])
      .select();
      
    if (paymentError) throw paymentError;
    
    // Update the invoice with the new amount paid
    const newAmountPaid = currentAmountPaid + adjustedPaymentAmount;
    const newStatus = newAmountPaid >= invoiceTotal ? 'Paid' : 'Partially Paid';
    
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: newStatus,
        amount_paid: newAmountPaid,
        payment_date: newStatus === 'Paid' ? new Date().toISOString() : null
      })
      .eq('id', invoiceId);
      
    if (updateError) throw updateError;
    
    // Record the activity
    await supabase
      .from('invoice_activities')
      .insert([{
        invoice_id: invoiceId,
        activity_type: 'payment',
        description: `Payment of $${adjustedPaymentAmount.toFixed(2)} recorded`,
        user_id: user?.id,
        user_name: user?.email
      }]);

    // Create notification for payment received
    try {
      // Get invoice details for notification
      const { data: invoiceDetails } = await supabase
        .from('invoices')
        .select('invoice_number, customer, total')
        .eq('id', invoiceId)
        .single();

      if (invoiceDetails) {
        const isFullyPaid = newStatus === 'Paid';
        await NotificationService.createNotification({
          userId: user?.id,
          title: isFullyPaid ? 'Invoice Paid in Full' : 'Payment Received',
          message: isFullyPaid
            ? `Invoice ${invoiceDetails.invoice_number} for ${invoiceDetails.customer} has been paid in full ($${invoiceDetails.total?.toLocaleString()}).`
            : `Payment of $${adjustedPaymentAmount.toFixed(2)} received for invoice ${invoiceDetails.invoice_number} (${invoiceDetails.customer}). Remaining: $${(invoiceDetails.total - newAmountPaid).toFixed(2)}`,
          type: 'PAYMENT_RECEIVED',
          entityType: 'invoice',
          entityId: invoiceId,
          linkTo: `/dashboard/invoices/${invoiceId}`,
          urgency: URGENCY_LEVELS.LOW
        });
      }
    } catch (notifError) {
      // Don't fail the main operation if notification fails
      // Silent failure in production, would log in development
    }

    return payment?.[0] || null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get invoice statistics for dashboard
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Invoice statistics
 */
export async function getInvoiceStats(userId) {
  try {
    // Get all invoices for this user
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, total, amount_paid, status, invoice_date, due_date')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    if (!invoices) return { total: 0, paid: 0, pending: 0, overdue: 0, count: 0 };
    
    const today = new Date();
    
    // Calculate totals
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    
    invoices.forEach(invoice => {
      const total = parseFloat(invoice.total) || 0;
      totalAmount += total;
      
      switch (invoice.status.toLowerCase()) {
        case 'paid':
        case 'partially paid':
          paidAmount += parseFloat(invoice.amount_paid) || 0;
          
          // Add any unpaid amount to pending
          if (invoice.status.toLowerCase() === 'partially paid') {
            pendingAmount += total - (parseFloat(invoice.amount_paid) || 0);
          }
          break;
        case 'overdue':
          overdueAmount += total;
          break;
        default:
          // Check if overdue
          const dueDate = new Date(invoice.due_date);
          if (dueDate < today) {
            overdueAmount += total;
          } else {
            pendingAmount += total;
          }
      }
    });
    
    return {
      total: totalAmount,
      paid: paidAmount,
      pending: pendingAmount,
      overdue: overdueAmount,
      count: invoices.length
    };
  } catch (error) {
    return { total: 0, paid: 0, pending: 0, overdue: 0, count: 0 };
  }
}

/**
 * Email an invoice to a client
 * @param {string} invoiceId - Invoice ID
 * @param {Object} emailDetails - Email details (to, subject, message)
 * @returns {Promise<boolean>} - Success status
 */
export async function emailInvoice(invoiceId, emailDetails) {
  try {
    // Get the current user for activity tracking
    const { data: { user } } = await supabase.auth.getUser();
    
    // In a real implementation, this would call your email API
    // Here we just simulate it by updating the invoice status and last_sent time
    
    // First, update the invoice to record that it was sent
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        last_sent: new Date().toISOString(),
        status: 'Sent'
      })
      .eq('id', invoiceId)
      .select();
      
    if (error) throw error;
    
    // Record the activity
    await supabase
      .from('invoice_activities')
      .insert([{
        invoice_id: invoiceId,
        activity_type: 'email',
        description: `Invoice emailed to ${emailDetails.to}`,
        user_id: user?.id,
        user_name: user?.email
      }]);
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Get invoice data formatted for duplication (does NOT create a new invoice)
 * Returns the data pre-filled for a new invoice form
 * @param {string} invoiceId - ID of the invoice to duplicate
 * @param {Object} overrides - Fields to override in the new invoice
 * @returns {Promise<Object|null>} - Invoice data for form pre-fill
 */
export async function duplicateInvoice(invoiceId, overrides = {}) {
  try {
    // Get the original invoice
    const originalInvoice = await getInvoiceById(invoiceId);
    if (!originalInvoice) throw new Error('Invoice not found');

    // Create data for the new invoice form (without saving to database)
    const newInvoiceData = {
      customer: originalInvoice.customer,
      customer_email: originalInvoice.customer_email,
      customer_address: originalInvoice.customer_address,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 15); // Default to Net 15
        return date.toISOString().split('T')[0];
      })(),
      payment_terms: originalInvoice.payment_terms || 'Net 15',
      po_number: '', // Clear PO number for new invoice
      subtotal: originalInvoice.subtotal || 0,
      tax_rate: originalInvoice.tax_rate || 0,
      tax_amount: originalInvoice.tax_amount || 0,
      total: originalInvoice.total || 0,
      notes: originalInvoice.notes || '',
      terms: originalInvoice.terms || '',
      load_id: '', // Clear load association for new invoice
      ...overrides
    };

    // Format items correctly (without IDs so they'll be created as new)
    const items = originalInvoice.items && originalInvoice.items.length > 0
      ? originalInvoice.items.map(item => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0
        }))
      : [{ description: '', quantity: 1, unit_price: 0 }];

    return {
      ...newInvoiceData,
      items
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Check for overdue invoices and update their status
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of invoices updated
 */
export async function checkAndUpdateOverdueInvoices(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find pending invoices that are now overdue (include more details for notifications)
    const { data: overdueInvoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer, total, due_date')
      .eq('user_id', userId)
      .in('status', ['Pending', 'Sent'])
      .lt('due_date', today);

    if (error) throw error;

    if (!overdueInvoices || overdueInvoices.length === 0) return 0;

    // Update them to 'Overdue' status
    const ids = overdueInvoices.map(invoice => invoice.id);

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'Overdue' })
      .in('id', ids);

    if (updateError) throw updateError;

    // Create notifications for each overdue invoice
    for (const invoice of overdueInvoices) {
      try {
        // Check if notification already exists for this invoice (avoid duplicates)
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('entity_id', invoice.id)
          .eq('notification_type', 'INVOICE_OVERDUE')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Within last 7 days
          .maybeSingle();

        if (!existingNotif) {
          const daysPastDue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
          await NotificationService.createNotification({
            userId: userId,
            title: `Invoice ${invoice.invoice_number} Overdue`,
            message: `Invoice for ${invoice.customer} ($${invoice.total?.toLocaleString()}) is ${daysPastDue} day${daysPastDue > 1 ? 's' : ''} past due. Due date was ${new Date(invoice.due_date).toLocaleDateString()}.`,
            type: 'INVOICE_OVERDUE',
            entityType: 'invoice',
            entityId: invoice.id,
            linkTo: `/dashboard/invoices/${invoice.id}`,
            dueDate: invoice.due_date,
            urgency: daysPastDue > 30 ? URGENCY_LEVELS.CRITICAL : daysPastDue > 7 ? URGENCY_LEVELS.HIGH : URGENCY_LEVELS.MEDIUM
          });
        }
      } catch (notifError) {
        // Silent failure in production, notification is non-critical
      }
    }

    return overdueInvoices.length;
  } catch (error) {
    throw error;
  }
}

/**
 * Export invoices to CSV
 * @param {Array} invoices - Array of invoice objects
 * @returns {string} - CSV string
 */
export function exportInvoicesToCSV(invoices) {
  if (!invoices || invoices.length === 0) {
    return '';
  }
  
  // Define the headers
  const headers = [
    'Invoice Number',
    'Customer',
    'Invoice Date',
    'Due Date',
    'Total',
    'Amount Paid',
    'Balance',
    'Status'
  ];
  
  // Format the data rows
  const rows = invoices.map(invoice => [
    invoice.invoice_number,
    invoice.customer,
    invoice.invoice_date,
    invoice.due_date,
    invoice.total,
    invoice.amount_paid || 0,
    invoice.total - (invoice.amount_paid || 0),
    invoice.status
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}