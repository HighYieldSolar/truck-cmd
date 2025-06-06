// src/lib/utils/dateUtils.js

/**
 * Utility functions for handling dates consistently across the application
 * Fixes the timezone offset issue where dates are saved as one day behind
 */

/**
 * Get current date in YYYY-MM-DD format in local timezone
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export function getCurrentDateLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date to YYYY-MM-DD format preserving local timezone
 * @param {Date|string} date - Date object or string
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export function formatDateLocal(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDateLocal:', date);
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create a date object from YYYY-MM-DD string in local timezone
 * This prevents timezone conversion issues
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} - Date object in local timezone
 */
export function createLocalDate(dateString) {
  if (!dateString) return new Date();
  
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    console.warn('Invalid date format provided to createLocalDate:', dateString);
    return new Date();
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
  const day = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}

/**
 * Prepare date for database submission
 * Ensures the date is saved as the exact date the user selected
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} - Date string ready for database
 */
export function prepareDateForDB(dateString) {
  if (!dateString) return null;
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Otherwise format it properly
  return formatDateLocal(dateString);
}

/**
 * Parse date from database preserving the intended date
 * @param {string} dbDateString - Date string from database
 * @returns {string} - Date string in YYYY-MM-DD format for forms
 */
export function parseDateFromDB(dbDateString) {
  if (!dbDateString) return '';
  
  // If it's a full timestamp, extract just the date part
  if (dbDateString.includes('T')) {
    return dbDateString.split('T')[0];
  }
  
  return formatDateLocal(dbDateString);
}

/**
 * Format date for display in the UI (prevents timezone conversion issues)
 * @param {string} dateString - Date string from database
 * @returns {string} - Formatted date string for display
 */
export function formatDateForDisplay(dateString) {
  if (!dateString) return '';
  
  try {
    // If it's already in YYYY-MM-DD format, parse it safely
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // months are 0-indexed  
      const day = parseInt(parts[2], 10);
      
      // Create date in local timezone
      const date = new Date(year, month, day);
      return date.toLocaleDateString();
    }
    
    // If it's a timestamp, extract date part first
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0];
      return formatDateForDisplay(datePart);
    }
    
    // Fallback for other formats
    const date = new Date(dateString + 'T00:00:00'); // Add time to prevent timezone issues
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date for display:', dateString, error);
    return dateString;
  }
}

/**
 * Format date for display in a specific format (MM/DD/YYYY)
 * @param {string} dateString - Date string from database
 * @returns {string} - Formatted date string in MM/DD/YYYY format
 */
export function formatDateForDisplayMMDDYYYY(dateString) {
  if (!dateString) return '';
  
  try {
    // If it's already in YYYY-MM-DD format, parse it safely
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      
      return `${month}/${day}/${year}`;
    }
    
    // If it's a timestamp, extract date part first
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0];
      return formatDateForDisplayMMDDYYYY(datePart);
    }
    
    // Fallback
    return formatDateForDisplay(dateString);
  } catch (error) {
    console.warn('Error formatting date for MM/DD/YYYY display:', dateString, error);
    return dateString;
  }
}

/**
 * Get date range for a quarter in local timezone
 * @param {string} quarter - Quarter string like "2024-Q1"
 * @returns {Object} - Object with startDate and endDate in YYYY-MM-DD format
 */
export function getQuarterDateRange(quarter) {
  const [year, qPart] = quarter.split('-Q');
  const quarterNum = parseInt(qPart);
  
  const startMonth = (quarterNum - 1) * 3;
  const startDate = new Date(parseInt(year), startMonth, 1);
  const endDate = new Date(parseInt(year), startMonth + 3, 0);
  
  return {
    startDate: formatDateLocal(startDate),
    endDate: formatDateLocal(endDate)
  };
}