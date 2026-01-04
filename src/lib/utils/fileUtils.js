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

/**
 * Get file extension from content type or URL
 * @param {string} contentType - MIME type
 * @param {string} url - Optional URL to extract extension from
 * @returns {string} - File extension without dot
 */
export function getFileExtension(contentType, url = '') {
  // Try to get extension from content type first
  const typeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'text/csv': 'csv'
  };

  if (contentType && typeMap[contentType]) {
    return typeMap[contentType];
  }

  // Try to extract from URL
  if (url) {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  // Default based on content type patterns
  if (contentType) {
    if (contentType.includes('image')) return 'jpg';
    if (contentType.includes('pdf')) return 'pdf';
  }

  return 'file';
}

/**
 * Sanitize a string for use in a filename
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} - Sanitized filename-safe string
 */
export function sanitizeFilename(text, maxLength = 50) {
  if (!text) return 'document';
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .slice(0, maxLength) // Limit length
    .replace(/_+$/, '') // Remove trailing underscores
    .toLowerCase();
}

/**
 * Download a file from a URL using blob fetch for instant download
 * This avoids opening files in a new tab and forces a download
 *
 * @param {string} url - The URL of the file to download
 * @param {Object} options - Download options
 * @param {string} options.filename - Custom filename (without extension)
 * @param {string} options.fallbackExtension - Extension to use if can't be determined
 * @param {Function} options.onProgress - Progress callback (not implemented yet)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function downloadFile(url, options = {}) {
  const {
    filename = 'document',
    fallbackExtension = 'pdf'
  } = options;

  // Validate URL
  try {
    new URL(url);
  } catch (_) {
    return { success: false, error: 'Invalid URL' };
  }

  try {
    // Fetch the file as a blob
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch file`);
    }

    const blob = await response.blob();

    // Determine file extension
    const extension = getFileExtension(blob.type, url) || fallbackExtension;

    // Sanitize filename and add extension
    const sanitizedName = sanitizeFilename(filename);
    const fullFilename = `${sanitizedName}.${extension}`;

    // Create blob URL and trigger download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fullFilename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);

    return { success: true };
  } catch (error) {
    // Return error info - caller can decide to fallback to window.open
    return {
      success: false,
      error: error.message || 'Download failed'
    };
  }
}