// src/lib/services/loadCompletionService.js
import { supabase } from "../supabaseClient";
import { createInvoiceFromLoad } from "./loadInvoiceService";
import { recordFactoredEarnings } from "./earningsService";

/**
 * Completes a load and handles either invoice generation or factoring
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID
 * @param {Object} completionData - Completion data
 * @returns {Promise<Object>} - Result of the completion process
 */
export async function completeLoad(userId, loadId, completionData) {
  try {
    // Destructure required fields from completion data
    const { 
      deliveryDate, deliveryTime, receivedBy, notes, deliveryRating,
      podDocuments, additionalMileage, additionalCharges, 
      additionalChargesDescription, useFactoring, generateInvoice,
      factoringCompany, markPaid
    } = completionData;
    
    // Calculate total rate
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('rate, load_number, origin, destination, customer')
      .eq('id', loadId)
      .single();
      
    if (loadError) {
      throw loadError;
    }

    const totalRate = (load?.rate || 0) + parseFloat(additionalCharges || 0);
    
    // Update the load with completion data
    const loadUpdateData = {
      status: 'Completed',
      actual_delivery_date: deliveryDate,
      actual_delivery_time: deliveryTime,
      received_by: receivedBy,
      completion_notes: notes,
      delivery_rating: deliveryRating,
      pod_documents: podDocuments || [],
      additional_mileage: parseFloat(additionalMileage || 0),
      additional_charges: parseFloat(additionalCharges || 0),
      additional_charges_description: additionalChargesDescription || '',
      completed_at: new Date().toISOString(),
      final_rate: totalRate
    };
    
    // Add factoring information if applicable
    if (useFactoring) {
      loadUpdateData.factored = true;
      loadUpdateData.factoring_company = factoringCompany || null;
      loadUpdateData.factored_at = new Date().toISOString();
      loadUpdateData.factored_amount = totalRate;
    }

    // Update the load in the database
    const { data: updatedLoad, error: updateError } = await supabase
      .from('loads')
      .update(loadUpdateData)
      .eq('id', loadId)
      .select();
      
    if (updateError) {
      throw updateError;
    }
    
    // Handle either invoice generation or factoring
    let invoice = null;
    let earnings = null;

    if (useFactoring) {
      // Record factored earnings
      try {
        earnings = await recordFactoredEarnings(userId, loadId, totalRate, {
          date: deliveryDate || new Date().toISOString().split('T')[0],
          description: `Factored load #${load.load_number || 'N/A'}: ${load.origin} to ${load.destination}`,
          factoringCompany: factoringCompany
        });
      } catch (factorError) {
        throw factorError;
      }
    } else if (generateInvoice) {
      // Generate invoice
      try {
        invoice = await createInvoiceFromLoad(userId, loadId, {
          markAsPaid: markPaid,
          dueInDays: 15,
          invoiceDate: new Date().toISOString().split('T')[0],
          notes: `Invoice for Load #${load.load_number || 'N/A'}: ${load.origin} to ${load.destination}`
        });
      } catch (invoiceError) {
        // Continue with the completion process even if invoice generation fails
      }
    }
    
    return {
      success: true,
      load: updatedLoad?.[0] || null,
      invoice,
      earnings,
      useFactoring,
      generateInvoice
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to complete load'
    };
  }
}

/**
 * Upload POD documents for a load
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID
 * @param {File[]} files - Files to upload
 * @returns {Promise<Array>} - Uploaded document metadata
 */
export async function uploadPodDocuments(userId, loadId, files) {
  try {
    // Get load number for folder structure
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('load_number')
      .eq('id', loadId)
      .single();
      
    if (loadError) throw loadError;
    
    const loadNumber = load?.load_number || 'unknown';
    const podDocuments = [];
    
    // Upload each file
    for (const file of files) {
      const fileName = `${userId}/loads/${loadNumber}/pod/${Date.now()}-${file.name}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
        
      // Add document metadata
      podDocuments.push({
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString()
      });
    }
    
    return podDocuments;
  } catch (error) {
    throw error;
  }
}

/**
 * Get load completion status
 * @param {string} loadId - Load ID
 * @returns {Promise<Object>} - Load completion status
 */
export async function getLoadCompletionStatus(loadId) {
  try {
    const { data, error } = await supabase
      .from('loads')
      .select(`
        id, 
        status, 
        completed_at, 
        factored,
        factoring_company,
        invoices(id, invoice_number, status)
      `)
      .eq('id', loadId)
      .single();
      
    if (error) throw error;
    
    return {
      completed: data.status === 'Completed',
      completedAt: data.completed_at,
      factored: data.factored || false,
      factoringCompany: data.factoring_company,
      hasInvoice: data.invoices && data.invoices.length > 0,
      invoiceNumber: data.invoices?.[0]?.invoice_number,
      invoiceStatus: data.invoices?.[0]?.status
    };
  } catch (error) {
    return {
      completed: false,
      hasInvoice: false
    };
  }
}