/**
 * Shared date utilities for consistent date parsing and formatting across the application
 */

// Helper function to parse dates from various formats
export function parseDate(dateString: string | number | Date | null | undefined): Date | null {
  if (!dateString) return null;
  
  // If it's already a Date object, return it
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString;
  }
  
  // Handle numeric timestamps (both seconds and milliseconds)
  if (typeof dateString === 'number' || /^\d+$/.test(dateString.toString().trim())) {
    const timestamp = typeof dateString === 'number' ? dateString : parseInt(dateString.toString().trim(), 10);
    // If timestamp is in seconds (10 digits), convert to milliseconds (13 digits)
    const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);
    
    // Validate the date is reasonable (between 2000 and 2050)
    const year = date.getFullYear();
    if (!isNaN(date.getTime()) && year >= 2000 && year <= 2050) {
      return date;
    }
    return null;
  }
  
  // Try ISO format
  if (typeof dateString === 'string') {
    // Handle DD-MMM-YY format (e.g., 01-Jan-25)
    const dateRegex1 = /^(\d{1,2})-(\w{3})-(\d{2})$/i;
    const match1 = dateString.match(dateRegex1);
    
    if (match1) {
      const day = parseInt(match1[1], 10);
      const monthMap: {[key: string]: number} = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      const month = monthMap[match1[2].toLowerCase()];
      let year = parseInt(match1[3], 10);
      
      if (year < 100) {
        year += 2000; // Assume 20xx for two-digit years
      }
      
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Handle DD/MM/YYYY or MM/DD/YYYY format
    const dateRegex2 = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
    const match2 = dateString.match(dateRegex2);
    
    if (match2) {
      let day, month, year;
      
      // Assume DD/MM/YYYY format if first part > 12 (day)
      if (parseInt(match2[1], 10) > 12) {
        day = parseInt(match2[1], 10);
        month = parseInt(match2[2], 10) - 1; // Months are 0-indexed
        year = parseInt(match2[3], 10);
      } else {
        // Try MM/DD/YYYY format
        month = parseInt(match2[1], 10) - 1; // Months are 0-indexed
        day = parseInt(match2[2], 10);
        year = parseInt(match2[3], 10);
      }
      
      // Handle 2-digit years
      if (year < 100) {
        year += 2000; // Assume 20xx for two-digit years
      }
      
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Try ISO date string
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }
  
  return null;
}

/**
 * Formats a date to a standardized ISO string for consistent storage
 * Always returns a properly formatted ISO string with Z suffix or null if invalid
 */
export function formatDateForStorage(date: Date | string | number | null | undefined): string | null {
  if (!date) return null;
  
  // If it's already a string that looks like an ISO date with Z suffix, validate it
  if (typeof date === 'string' && date.endsWith('Z') && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(date)) {
    const testDate = new Date(date);
    if (!isNaN(testDate.getTime())) {
      return date; // It's already a valid ISO string with Z suffix
    }
  }
  
  // Handle raw timestamp values directly to ensure they're properly converted
  if (typeof date === 'number' || (typeof date === 'string' && /^\d+$/.test(date))) {
    const timestamp = typeof date === 'number' ? date : parseInt(date, 10);
    // If timestamp is in seconds (10 digits), convert to milliseconds (13 digits)
    const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const dateObj = new Date(timestampMs);
    
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
    return null;
  }
  
  // For other formats, use parseDate
  const parsedDate = date instanceof Date ? date : parseDate(date);
  return parsedDate ? parsedDate.toISOString() : null;
}

/**
 * Compares two dates for equality, normalizing them first
 */
export function areDatesEqual(date1: Date | string | number | null | undefined, 
                              date2: Date | string | number | null | undefined): boolean {
  if (!date1 && !date2) return true;
  if (!date1 || !date2) return false;
  
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  
  if (!d1 && !d2) return true;
  if (!d1 || !d2) return false;
  
  return d1.getTime() === d2.getTime();
}
