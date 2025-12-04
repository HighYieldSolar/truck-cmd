// src/lib/utils/fileUtils.js

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if file type is an image
 * @param {string} mimeType - File MIME type
 * @returns {boolean} - True if file is an image
 */
export function isImageFile(mimeType) {
  return mimeType.startsWith('image/');
}

/**
 * Check if file type is a document (PDF, DOC, etc.)
 * @param {string} mimeType - File MIME type
 * @returns {boolean} - True if file is a document
 */
export function isDocumentFile(mimeType) {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  return documentTypes.includes(mimeType);
}

/**
 * Get file icon based on file type
 * @param {string} mimeType - File MIME type
 * @returns {string} - Icon name from Lucide icons
 */
export function getFileIcon(mimeType) {
  if (isImageFile(mimeType)) {
    return 'Image';
  }
  
  if (mimeType === 'application/pdf') {
    return 'FileText';
  }
  
  if (mimeType.includes('word')) {
    return 'FileText';
  }
  
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType === 'text/csv') {
    return 'FileSpreadsheet';
  }
  
  return 'File';
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeInBytes - Max allowed size in bytes
 * @returns {boolean} - True if file size is valid
 */
export function validateFileSize(file, maxSizeInBytes = 10 * 1024 * 1024) {
  return file.size <= maxSizeInBytes;
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is valid
 */
export function validateFileType(file, allowedTypes = []) {
  if (allowedTypes.length === 0) {
    return true;
  }
  
  return allowedTypes.includes(file.type);
}

/**
 * Convert a file to a base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Creates a File object from a URL (useful for remote files)
 * @param {string} url - File URL
 * @param {string} filename - Filename
 * @param {Object} options - Options for the file
 * @returns {Promise<File>} - File object
 */
export async function createFileFromUrl(url, filename, options = {}) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, {
      type: blob.type,
      ...options
    });
  } catch (error) {
    throw error;
  }
}