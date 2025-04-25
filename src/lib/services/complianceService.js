import { supabase } from "@/lib/supabaseClient";

/**
 * Fetch all compliance items for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of compliance items
 */
export async function fetchComplianceItems(userId) {
  try {
    console.log("Fetching compliance items for user:", userId);
    const { data, error } = await supabase
      .from("compliance_items")
      .select("*")
      .eq("user_id", userId);
      
    if (error) {
      console.error("Error in fetch:", error);
      throw error;
    }
    
    console.log("Fetched compliance items:", data);
    return data || [];
  } catch (error) {
    console.error("Error fetching compliance items:", error);
    throw new Error("Failed to fetch compliance items");
  }
}

/**
 * Create a new compliance item
 * @param {object} complianceData - Compliance data to create
 * @returns {Promise<object>} - Created compliance item
 */
export async function createComplianceItem(complianceData) {
  try {
    const { data, error } = await supabase
      .from('compliance_items')
      .insert([complianceData])
      .select();
      
    if (error) {
      console.error("Error creating compliance item:", error);
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error("Error in createComplianceItem:", error);
    throw new Error("Failed to create compliance item: " + error.message);
  }
}

/**
 * Update an existing compliance item
 * @param {string} id - Compliance item ID
 * @param {object} complianceData - Updated compliance data
 * @returns {Promise<object>} - Updated compliance item
 */
export async function updateComplianceItem(id, complianceData) {
  try {
    const { data, error } = await supabase
      .from('compliance_items')
      .update(complianceData)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error("Error updating compliance item:", error);
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error("Error in updateComplianceItem:", error);
    throw new Error("Failed to update compliance item: " + error.message);
  }
}

/**
 * Delete a compliance item
 * @param {string} id - Compliance item ID
 * @returns {Promise<void>}
 */
export async function deleteComplianceItem(id) {
  try {
    const { error } = await supabase
      .from('compliance_items')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Error deleting compliance item:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteComplianceItem:", error);
    throw new Error("Failed to delete compliance item: " + error.message);
  }
}

/**
 * Upload a document for a compliance item
 * @param {string} userId - User ID
 * @param {File} file - Document file to upload
 * @returns {Promise<string>} - Public URL of uploaded document
 */
export async function uploadComplianceDocument(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`Uploading file to documents bucket, path: ${filePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error("Upload error details:", uploadError);
      throw new Error(`Document upload failed: ${uploadError.message || JSON.stringify(uploadError)}`);
    }
    
    console.log("File uploaded successfully:", uploadData);
    
    // Get the public URL for the file
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new Error("Failed to upload document: " + error.message);
  }
}

/**
 * Delete a document from storage
 * @param {string} documentUrl - URL of the document to delete
 * @returns {Promise<void>}
 */
export async function deleteComplianceDocument(documentUrl) {
  try {
    if (!documentUrl) return;
    
    // Extract the file path from the URL
    const url = new URL(documentUrl);
    const pathParts = url.pathname.split('/');
    
    // Get the path after the bucket name
    const bucketPos = pathParts.indexOf('documents');
    const filePath = pathParts.slice(bucketPos + 1).join('/');
    
    if (filePath) {
      console.log(`Attempting to delete file from documents bucket, path: ${filePath}`);
      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);
        
      if (error) {
        console.warn("Error removing document file:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error("Failed to delete document: " + error.message);
  }
}