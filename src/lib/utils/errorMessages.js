/**
 * Centralized User-Friendly Error Messages
 *
 * This module provides consistent, user-friendly error messages
 * for all error scenarios in the application.
 *
 * Usage:
 *   import { getUserFriendlyError } from '@/lib/utils/errorMessages';
 *
 *   catch (error) {
 *     const message = getUserFriendlyError(error);
 *     setError(message);
 *   }
 */

// ============================================
// ERROR MESSAGE MAPPING
// ============================================

export const ERROR_MESSAGES = {
  // ----------------------------------------
  // Database/Supabase Errors (PGRST codes)
  // ----------------------------------------
  'PGRST116': 'Unable to find the requested record. It may have been deleted or moved.',
  'PGRST204': 'No data was returned. Please try refreshing the page.',
  'PGRST301': 'The request was not properly formatted. Please try again.',
  'PGRST302': 'Multiple records found when only one was expected.',

  // PostgreSQL constraint errors
  '23505': 'This record already exists. Please check for duplicates.',
  '23503': 'This item is connected to other records and cannot be deleted right now.',
  '23502': 'A required field is missing. Please fill in all required fields.',
  '23514': 'The data you entered does not meet the requirements. Please check your input.',
  '42501': 'You do not have permission to perform this action.',
  '42P01': 'We encountered a system issue. Please try again or contact support.',
  '42703': 'Invalid data field. Please refresh and try again.',
  '22P02': 'Invalid data format. Please check your input and try again.',

  // Connection/timeout errors
  '08000': 'Unable to connect to the database. Please check your connection.',
  '08003': 'Lost connection to the server. Please refresh the page.',
  '08006': 'Connection was unexpectedly closed. Please try again.',
  '57014': 'The operation took too long and was cancelled. Please try again.',

  // ----------------------------------------
  // Network/HTTP Errors
  // ----------------------------------------
  'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection and try again.',
  'TIMEOUT': 'The request took too long to complete. Please try again.',
  'FETCH_FAILED': 'Failed to load data from the server. Please refresh the page.',
  'OFFLINE': 'You appear to be offline. Please check your internet connection.',

  // HTTP status codes
  '400': 'The request was invalid. Please check your input and try again.',
  '401': 'You need to be logged in to perform this action.',
  '403': 'You do not have permission to perform this action.',
  '404': 'The requested item could not be found.',
  '409': 'There was a conflict with existing data. Please refresh and try again.',
  '422': 'The data you submitted is invalid. Please check and try again.',
  '429': 'Too many requests. Please wait a moment and try again.',
  '500': 'Something went wrong on our end. Please try again later.',
  '502': 'The server is temporarily unavailable. Please try again in a few minutes.',
  '503': 'The service is temporarily unavailable. Please try again later.',
  '504': 'The server took too long to respond. Please try again.',

  // ----------------------------------------
  // Authentication Errors
  // ----------------------------------------
  'AUTH_EXPIRED': 'Your session has expired. Please log in again to continue.',
  'AUTH_INVALID': 'Your login credentials are incorrect. Please check and try again.',
  'AUTH_REQUIRED': 'Please log in to access this feature.',
  'AUTH_EMAIL_NOT_CONFIRMED': 'Please verify your email address before logging in.',
  'AUTH_USER_NOT_FOUND': 'No account found with this email. Please check or sign up.',
  'AUTH_WEAK_PASSWORD': 'Password is too weak. Please use a stronger password.',
  'AUTH_EMAIL_TAKEN': 'An account with this email already exists.',
  'invalid_credentials': 'Invalid email or password. Please try again.',
  'email_not_confirmed': 'Please verify your email before logging in.',

  // ----------------------------------------
  // Validation Errors
  // ----------------------------------------
  'INVALID_DATE': 'Please enter a valid date.',
  'INVALID_AMOUNT': 'Please enter a valid amount.',
  'INVALID_NUMBER': 'Please enter a valid number.',
  'INVALID_EMAIL': 'Please enter a valid email address.',
  'INVALID_PHONE': 'Please enter a valid phone number.',
  'INVALID_FORMAT': 'The format is incorrect. Please check your input.',
  'REQUIRED_FIELD': 'This field is required.',
  'VALUE_TOO_LOW': 'The value is too low.',
  'VALUE_TOO_HIGH': 'The value is too high.',
  'TEXT_TOO_LONG': 'The text is too long. Please shorten it.',
  'TEXT_TOO_SHORT': 'The text is too short. Please provide more detail.',

  // ----------------------------------------
  // File Upload Errors
  // ----------------------------------------
  'FILE_TOO_LARGE': 'The file is too large. Maximum size is 10MB.',
  'FILE_TYPE_NOT_ALLOWED': 'This file type is not supported. Please use a different format.',
  'INVALID_FILE_TYPE': 'Please upload a valid file (PNG, JPG, or PDF).',
  'UPLOAD_FAILED': 'Failed to upload the file. Please try again.',
  'STORAGE_FULL': 'Storage is full. Please delete some files and try again.',
  'UPLOAD_CANCELLED': 'The upload was cancelled.',

  // ----------------------------------------
  // Business Logic Errors
  // ----------------------------------------
  'SUBSCRIPTION_REQUIRED': 'This feature requires an active subscription.',
  'TRIAL_EXPIRED': 'Your trial has expired. Please subscribe to continue.',
  'LIMIT_REACHED': 'You have reached your plan limit. Please upgrade to continue.',
  'PAYMENT_FAILED': 'Payment failed. Please update your payment method.',
  'ALREADY_EXISTS': 'This item already exists.',
  'NOT_FOUND': 'The requested item was not found.',
  'CANNOT_DELETE': 'This item cannot be deleted because it has associated records.',
  'OPERATION_FAILED': 'The operation could not be completed. Please try again.',

  // ----------------------------------------
  // CRUD Operation Errors
  // ----------------------------------------
  'CREATE_FAILED': 'Failed to create the record. Please try again.',
  'UPDATE_FAILED': 'Failed to update the record. Please try again.',
  'DELETE_FAILED': 'Failed to delete the record. Please try again.',
  'SAVE_FAILED': 'Failed to save changes. Please try again.',
  'LOAD_FAILED': 'Failed to load data. Please refresh the page.',

  // ----------------------------------------
  // Generic Fallback
  // ----------------------------------------
  'UNKNOWN': 'Something went wrong. Please try again or contact support if the problem continues.',
  'DEFAULT': 'An unexpected error occurred. Please try again.',
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Convert any error into a user-friendly message
 *
 * @param {Error|Object|string} error - The error to convert
 * @returns {string} User-friendly error message
 *
 * @example
 * // With Error object
 * getUserFriendlyError(new Error('PGRST116'));
 * // Returns: "Unable to find the requested record..."
 *
 * @example
 * // With Supabase error object
 * getUserFriendlyError({ code: '23505', message: 'duplicate key' });
 * // Returns: "This record already exists..."
 *
 * @example
 * // With string
 * getUserFriendlyError('Network Error');
 * // Returns: "Unable to connect to the server..."
 */
export function getUserFriendlyError(error) {
  // Handle null/undefined
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN;
  }

  // If it's already a clean user message (short, no underscores/codes), return it
  if (typeof error === 'string') {
    if (error.length < 150 && !error.includes('_') && !error.match(/^[A-Z0-9]+$/)) {
      // Check if it's not a technical message
      const technicalPatterns = [
        /error/i,
        /failed/i,
        /invalid/i,
        /exception/i,
        /undefined/i,
        /null/i,
        /cannot/i,
        /unable/i,
        /unexpected/i,
        /pgrst/i,
        /supabase/i,
        /postgres/i,
        /network/i,
        /fetch/i,
        /timeout/i,
      ];

      const isTechnical = technicalPatterns.some(pattern => pattern.test(error));
      if (!isTechnical) {
        return error;
      }
    }
  }

  // Extract error code from various error formats
  let errorCode = null;
  let errorMessage = '';

  if (typeof error === 'string') {
    errorCode = error;
    errorMessage = error;
  } else if (error instanceof Error) {
    errorCode = error.code || error.name;
    errorMessage = error.message || '';
  } else if (typeof error === 'object') {
    errorCode = error.code || error.error_code || error.statusCode || error.status;
    errorMessage = error.message || error.error || error.error_description || '';
  }

  // Try direct code match first
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // Convert to lowercase for pattern matching
  const errorStr = String(errorMessage).toLowerCase();
  const codeStr = String(errorCode).toLowerCase();

  // Pattern matching for common error types
  const patterns = [
    // Network errors
    { patterns: ['network', 'net::', 'econnrefused', 'enotfound'], message: ERROR_MESSAGES.NETWORK_ERROR },
    { patterns: ['timeout', 'timed out', 'etimedout'], message: ERROR_MESSAGES.TIMEOUT },
    { patterns: ['fetch', 'request failed'], message: ERROR_MESSAGES.FETCH_FAILED },
    { patterns: ['offline', 'no internet'], message: ERROR_MESSAGES.OFFLINE },

    // Auth errors
    { patterns: ['unauthorized', '401', 'not authenticated'], message: ERROR_MESSAGES['401'] },
    { patterns: ['forbidden', '403', 'permission denied'], message: ERROR_MESSAGES['403'] },
    { patterns: ['session expired', 'token expired', 'jwt expired'], message: ERROR_MESSAGES.AUTH_EXPIRED },
    { patterns: ['invalid credential', 'wrong password', 'incorrect password'], message: ERROR_MESSAGES.AUTH_INVALID },

    // Database errors
    { patterns: ['duplicate', 'unique constraint', 'already exists'], message: ERROR_MESSAGES['23505'] },
    { patterns: ['foreign key', 'reference', 'violates'], message: ERROR_MESSAGES['23503'] },
    { patterns: ['not null', 'required', 'cannot be null'], message: ERROR_MESSAGES['23502'] },

    // File errors
    { patterns: ['file too large', 'size limit', 'max size'], message: ERROR_MESSAGES.FILE_TOO_LARGE },
    { patterns: ['file type', 'not allowed', 'invalid type'], message: ERROR_MESSAGES.INVALID_FILE_TYPE },
    { patterns: ['upload failed', 'upload error'], message: ERROR_MESSAGES.UPLOAD_FAILED },

    // HTTP status errors
    { patterns: ['500', 'internal server'], message: ERROR_MESSAGES['500'] },
    { patterns: ['502', 'bad gateway'], message: ERROR_MESSAGES['502'] },
    { patterns: ['503', 'service unavailable'], message: ERROR_MESSAGES['503'] },
    { patterns: ['504', 'gateway timeout'], message: ERROR_MESSAGES['504'] },
    { patterns: ['429', 'rate limit', 'too many requests'], message: ERROR_MESSAGES['429'] },
    { patterns: ['404', 'not found'], message: ERROR_MESSAGES['404'] },
  ];

  for (const { patterns: patternList, message } of patterns) {
    for (const pattern of patternList) {
      if (errorStr.includes(pattern) || codeStr.includes(pattern)) {
        return message;
      }
    }
  }

  // If we have a specific error message that's somewhat clean, return it
  if (errorMessage && errorMessage.length < 200) {
    // Clean up common technical prefixes
    let cleaned = errorMessage
      .replace(/^error:\s*/i, '')
      .replace(/^failed:\s*/i, '')
      .replace(/^exception:\s*/i, '')
      .trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Add period if missing
    if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
      cleaned += '.';
    }

    // Only return if it's reasonably user-friendly
    if (cleaned.length > 10 && cleaned.length < 200) {
      return cleaned;
    }
  }

  // Default fallback
  return ERROR_MESSAGES.UNKNOWN;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get an error message for a specific field validation
 *
 * @param {string} fieldName - Name of the field
 * @param {string} validationType - Type of validation that failed
 * @returns {string} Field-specific error message
 */
export function getFieldError(fieldName, validationType) {
  const fieldLabels = {
    date: 'Date',
    location: 'Location',
    state: 'State',
    gallons: 'Gallons',
    price_per_gallon: 'Price per gallon',
    total_amount: 'Total amount',
    vehicle_id: 'Vehicle',
    odometer: 'Odometer',
    fuel_type: 'Fuel type',
    payment_method: 'Payment method',
    notes: 'Notes',
    receipt_image: 'Receipt',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    amount: 'Amount',
    description: 'Description',
  };

  const label = fieldLabels[fieldName] || fieldName;

  const messages = {
    required: `${label} is required.`,
    invalid: `Please enter a valid ${label.toLowerCase()}.`,
    too_short: `${label} is too short.`,
    too_long: `${label} is too long.`,
    too_low: `${label} must be greater than zero.`,
    too_high: `${label} exceeds the maximum allowed value.`,
    invalid_format: `${label} format is invalid.`,
    invalid_date: `Please select a valid date.`,
    future_date: `Date cannot be in the future.`,
    past_date: `Date is too far in the past.`,
  };

  return messages[validationType] || `${label} is invalid.`;
}

/**
 * Create a formatted error object for operations
 *
 * @param {string} operation - The operation that failed (e.g., 'create', 'update')
 * @param {string} entity - The entity type (e.g., 'fuel entry', 'invoice')
 * @param {Error} originalError - The original error
 * @returns {Object} Formatted error object
 */
export function createOperationError(operation, entity, originalError) {
  return {
    code: originalError?.code || `${operation.toUpperCase()}_FAILED`,
    message: getUserFriendlyError(originalError),
    context: `${operation} ${entity}`,
    original: originalError,
  };
}

/**
 * Check if an error is a network-related error
 *
 * @param {Error|Object|string} error - The error to check
 * @returns {boolean} True if it's a network error
 */
export function isNetworkError(error) {
  const errorStr = String(error?.message || error?.code || error).toLowerCase();
  const networkPatterns = ['network', 'fetch', 'offline', 'timeout', 'econnrefused', 'enotfound'];
  return networkPatterns.some(pattern => errorStr.includes(pattern));
}

/**
 * Check if an error is an authentication error
 *
 * @param {Error|Object|string} error - The error to check
 * @returns {boolean} True if it's an auth error
 */
export function isAuthError(error) {
  const code = error?.code || error?.status || '';
  const message = String(error?.message || error).toLowerCase();

  return (
    code === 401 ||
    code === '401' ||
    code === 'AUTH_REQUIRED' ||
    code === 'AUTH_EXPIRED' ||
    message.includes('unauthorized') ||
    message.includes('not authenticated') ||
    message.includes('session expired') ||
    message.includes('jwt expired')
  );
}

export default {
  ERROR_MESSAGES,
  getUserFriendlyError,
  getFieldError,
  createOperationError,
  isNetworkError,
  isAuthError,
};
