// src/lib/services/invoiceDeleteService.js
import { supabase } from "../supabaseClient";

/**
 * Delete an invoice with option to delete the associated load
 * @param {string} invoiceId - The ID of the invoice to delete
 * @param {boolean} deleteAssociatedLoad - Whether to also delete the associated load
 * @returns {Promise<{success: boolean, message: string}>} - Result of the deletion
 */
export async function deleteInvoiceWithOptions(invoiceId, deleteAssociatedLoad = false) {
  try {
    // 1. Get the invoice details first
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, load_id')
      .eq('id', invoiceId)
      .single();
    
    if (fetchError) {
      return {
        success: false,
        message: 'Could not find invoice to delete'
      };
    }
    
    // Track the load ID if we need to delete it
    const loadId = invoice.load_id;
    let loadDeleted = false;
    
    // 2. Delete invoice items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    // 3. Delete invoice activities
    const { error: activitiesError } = await supabase
      .from('invoice_activities')
      .delete()
      .eq('invoice_id', invoiceId);

    // 4. Delete payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('invoice_id', invoiceId);

    // 5. Delete the invoice
    const { error: invoiceError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
      
    if (invoiceError) {
      throw invoiceError;
    }
    
    // 6. Delete the associated load if requested
    if (deleteAssociatedLoad && loadId) {
      try {
        // Delete the load
        const { error: loadError } = await supabase
          .from('loads')
          .delete()
          .eq('id', loadId);
        
        if (loadError) {
          return {
            success: true,
            message: 'Invoice deleted successfully, but failed to delete associated load'
          };
        }

        loadDeleted = true;
      } catch (loadError) {
        return {
          success: true,
          message: 'Invoice deleted successfully, but failed to delete associated load'
        };
      }
    }
    
    return {
      success: true,
      message: loadDeleted
        ? 'Invoice and associated load deleted successfully'
        : 'Invoice deleted successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Error deleting invoice: ' + error.message
    };
  }
}