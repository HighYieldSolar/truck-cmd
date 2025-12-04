// src/lib/services/loadInvoiceService.js
import { supabase } from "../supabaseClient";
import { generateInvoiceNumber } from "./invoiceService";

/**
 * Creates an invoice from a completed load
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID
 * @param {Object} options - Options for invoice creation
 * @returns {Promise<Object>} - Created invoice data
 */
export async function createInvoiceFromLoad(userId, loadId, options = {}) {
  try {
    // Get load details first
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('*')
      .eq('id', loadId)
      .single();
      
    if (loadError) throw loadError;
    if (!load) throw new Error('Load not found');
    
    // Default options
    const defaultOptions = {
      markAsPaid: false,
      dueInDays: 15,
      invoiceDate: new Date().toISOString().split('T')[0],
      notes: '',
    };
    
    // Merge default options with provided options
    const mergedOptions = { ...defaultOptions, ...options };

    // Generate invoice number using the proper sequential generator
    const invoiceNumber = await generateInvoiceNumber(userId);
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + mergedOptions.dueInDays);
    
    // Calculate total from base rate and any additional charges
    const totalAmount = (load.rate || 0) + (load.additional_charges || 0);
    
    // Create invoice data
    const invoiceData = {
      user_id: userId,
      invoice_number: invoiceNumber,
      customer: load.customer,
      customer_id: load.customer_id,
      load_id: loadId,
      invoice_date: mergedOptions.invoiceDate,
      due_date: dueDate.toISOString().split('T')[0],
      status: mergedOptions.markAsPaid ? 'Paid' : 'Pending',
      total: totalAmount,
      subtotal: totalAmount,
      tax_rate: 0,
      tax_amount: 0,
      amount_paid: mergedOptions.markAsPaid ? totalAmount : 0,
      payment_date: mergedOptions.markAsPaid ? new Date().toISOString() : null,
      notes: mergedOptions.notes || `Invoice for Load #${load.load_number}: ${load.origin} to ${load.destination}`,
      created_at: new Date().toISOString()
    };
    
    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select();
      
    if (invoiceError) throw invoiceError;
    if (!invoice || invoice.length === 0) throw new Error('Failed to create invoice');
    
    // Create line items
    const invoiceItems = [];
    
    // Base rate as first item
    invoiceItems.push({
      invoice_id: invoice[0].id,
      description: `Transportation services: ${load.origin} to ${load.destination}`,
      quantity: 1,
      unit_price: load.rate || 0
    });
    
    // Add additional charges as a separate line item if they exist
    if (load.additional_charges && load.additional_charges > 0) {
      invoiceItems.push({
        invoice_id: invoice[0].id,
        description: load.additional_charges_description || 'Additional charges',
        quantity: 1,
        unit_price: load.additional_charges
      });
    }
    
    // Insert invoice items
    if (invoiceItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      // We don't throw here because we already created the invoice
    }
    
    // Record the activity
    await supabase
      .from('invoice_activities')
      .insert([{
        invoice_id: invoice[0].id,
        user_id: userId,
        activity_type: 'created',
        description: 'Invoice created automatically upon load completion',
        created_at: new Date().toISOString()
      }]);
    
    return invoice[0];
  } catch (error) {
    throw error;
  }
}

/**
 * Completes a load and optionally creates an invoice
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID 
 * @param {Object} completionData - Completion data
 * @param {boolean} generateInvoice - Whether to generate an invoice
 * @param {boolean} markInvoicePaid - Whether to mark the invoice as paid
 * @returns {Promise<Object>} - Updated load data and optionally invoice data
 */
export async function completeLoad(userId, loadId, completionData, generateInvoice = false, markInvoicePaid = false) {
  try {
    // First update the load status and completion data
    const { data: updatedLoad, error: updateError } = await supabase
      .from('loads')
      .update({
        status: 'Completed',
        actual_delivery_date: completionData.deliveryDate,
        received_by: completionData.receivedBy,
        completion_notes: completionData.notes,
        pod_documents: completionData.podDocuments || [],
        delivery_rating: completionData.rating,
        additional_mileage: completionData.additionalMileage || 0,
        additional_charges: completionData.additionalCharges || 0,
        additional_charges_description: completionData.additionalChargesDescription || '',
        completed_at: new Date().toISOString(),
        // Add any other fields you need to update
      })
      .eq('id', loadId)
      .select();
      
    if (updateError) throw updateError;
    
    let invoiceData = null;
    
    // Generate invoice if requested
    if (generateInvoice) {
      invoiceData = await createInvoiceFromLoad(userId, loadId, {
        markAsPaid: markInvoicePaid,
        notes: `Invoice for completed load #${updatedLoad[0].load_number}`
      });
    }
    
    return {
      load: updatedLoad[0],
      invoice: invoiceData
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all completion data for a load - useful for displaying completion history
 * @param {string} loadId - Load ID
 * @returns {Promise<Object>} - Complete load data with related information
 */
export async function getLoadCompletionDetails(loadId) {
  try {
    // First get the load details
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select(`
        *,
        invoices (*)
      `)
      .eq('id', loadId)
      .single();
      
    if (loadError) throw loadError;
    if (!load) throw new Error('Load not found');
    
    // Get any associated documents
    let podDocuments = [];
    if (load.pod_documents && Array.isArray(load.pod_documents)) {
      podDocuments = load.pod_documents;
    }
    
    // Format the completion data
    const completionData = {
      actualDeliveryDate: load.actual_delivery_date,
      receivedBy: load.received_by,
      completionNotes: load.completion_notes,
      deliveryRating: load.delivery_rating,
      additionalMileage: load.additional_mileage || 0,
      additionalCharges: load.additional_charges || 0,
      additionalChargesDescription: load.additional_charges_description,
      completedAt: load.completed_at,
      podDocuments: podDocuments,
      // Add any other completion fields
    };
    
    // Return the formatted data
    return {
      load,
      completionData,
      invoice: load.invoices && load.invoices.length > 0 ? load.invoices[0] : null
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Upload POD (Proof of Delivery) documents for a load
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Array>} - Array of uploaded document URLs
 */
export async function uploadPodDocuments(userId, loadId, files) {
  try {
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('load_number')
      .eq('id', loadId)
      .single();
      
    if (loadError) throw loadError;
    
    const loadNumber = load?.load_number || 'unknown';
    const documentUrls = [];
    
    // Upload each file
    for (const file of files) {
      const fileName = `${userId}/loads/${loadNumber}/pod/${Date.now()}-${file.name}`;
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
        
      if (fileError) throw fileError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
        
      documentUrls.push({
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    }
    
    return documentUrls;
  } catch (error) {
    throw error;
  }
}