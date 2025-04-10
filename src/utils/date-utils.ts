import { format, parseISO, isValid, parse, differenceInYears } from 'date-fns';

// Enhanced helper functions for date and age handling
export function formatSafeDateEnhanced(dateValue: string | null | undefined, formatString: string = 'PP'): string {
  if (!dateValue) return 'Not available';
  
  try {
    // Handle potential malformed years (e.g., 20250 instead of 2025)
    if (dateValue.includes('20250') || dateValue.includes('02050')) {
      dateValue = dateValue.replace('20250', '2025').replace('02050', '2025');
    }
    
    // First try standard ISO format
    let date = parseISO(dateValue);
    
    // If that fails, try various other formats
    if (!isValid(date)) {
      // Try DD/MM/YYYY format
      date = parse(dateValue, 'dd/MM/yyyy', new Date());
      
      // Try MM/DD/YYYY format if still invalid
      if (!isValid(date)) {
        date = parse(dateValue, 'MM/dd/yyyy', new Date());
      }
      
      // Try YYYY-MM-DD format if still invalid
      if (!isValid(date)) {
        date = parse(dateValue, 'yyyy-MM-dd', new Date());
      }
      
      // Try text format (e.g., "March 21st, 2025")
      if (!isValid(date)) {
        date = new Date(dateValue);
      }
    }
    
    // Do a quick validation on the year to catch obviously wrong dates
    const year = date.getFullYear();
    if (year > 2050 || year < 1900) {
      return 'Invalid date';
    }
    
    return format(date, formatString);
  } catch (e) {
    console.error('Error formatting date:', dateValue, e);
    return 'Invalid date';
  }
}

export function calculateAgeEnhanced(birthDate: string | null | undefined): string {
  if (!birthDate) return 'N/A';
  
  try {
    // Handle potential malformed years (e.g., 20250 instead of 2025)
    if (birthDate.includes('20250') || birthDate.includes('02050')) {
      birthDate = birthDate.replace('20250', '2025').replace('02050', '2025');
    }
    
    // First try standard ISO format
    let dateObj = parseISO(birthDate);
    
    // If that fails, try various other formats
    if (!isValid(dateObj)) {
      // Try DD/MM/YYYY format
      dateObj = parse(birthDate, 'dd/MM/yyyy', new Date());
      
      // Try MM/DD/YYYY format if still invalid
      if (!isValid(dateObj)) {
        dateObj = parse(birthDate, 'MM/dd/yyyy', new Date());
      }
      
      // Try YYYY-MM-DD format if still invalid
      if (!isValid(dateObj)) {
        dateObj = parse(birthDate, 'yyyy-MM-dd', new Date());
      }
      
      // Try text format (e.g., "March 21st, 2025")
      if (!isValid(dateObj)) {
        dateObj = new Date(birthDate);
      }
    }
    
    // Validate the date is reasonable
    const year = dateObj.getFullYear();
    if (!isValid(dateObj) || year > new Date().getFullYear() || year < 1900) {
      return 'N/A';
    }
    
    const age = differenceInYears(new Date(), dateObj);
    
    // Validate the age is reasonable
    if (age < 0 || age > 120) {
      return 'N/A';
    }
    
    return age.toString();
  } catch (e) {
    console.error('Error calculating age:', birthDate, e);
    return 'N/A';
  }
}

export function getEffectiveGenderEnhanced(gender: string | null | undefined | any): string {
  if (!gender) return 'Unknown';
  
  // Type safety check - handle non-string values
  if (typeof gender !== 'string') {
    console.warn('Non-string gender value received:', gender);
    return 'Unknown';
  }
  
  // Normalize the gender string
  const normalizedGender = gender.toLowerCase().trim();
  
  // Handle common variations and abbreviations
  if (normalizedGender === 'm' || normalizedGender === 'male') {
    return 'Male';
  } else if (normalizedGender === 'f' || normalizedGender === 'female') {
    return 'Female';
  } else if (normalizedGender.includes('other') || normalizedGender === 'o') {
    return 'Other';
  }
  
  // Capitalize first letter for display if the string has length
  if (gender.length > 0) {
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  }
  
  return 'Unknown';
}

// Enhanced date validation and correction function
export function parseAndValidateDate(dateString: string | null | undefined) {
  if (!dateString) return null;
  
  try {
    // Check for obviously incorrect years (more than 4 digits or far in the future)
    const yearMatch = dateString.match(/\d{4,}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      if (year > 2100) {
        // Truncate year to 4 digits if it's too long
        const correctedYear = String(year).substring(0, 4);
        const correctedDateString = dateString.replace(yearMatch[0], correctedYear);
        dateString = correctedDateString;
      }
    }
    
    // Try standard date parsing
    let parsedDate = new Date(dateString);
    
    // If that doesn't work, try other formats
    if (isNaN(parsedDate.getTime())) {
      // Try with date-fns parseISO
      try {
        parsedDate = parseISO(dateString);
      } catch (e) {
        // If that fails too, return null
        return null;
      }
    }
    
    // Validate the parsed date
    if (!isValid(parsedDate)) return null;
    
    // Check if date is reasonable
    const now = new Date();
    const year = parsedDate.getFullYear();
    
    // Future dates are not valid birth dates
    if (parsedDate > now) return null;
    
    // Years before 1900 or after current year are likely errors
    if (year < 1900 || year > now.getFullYear()) return null;
    
    return parsedDate;
  } catch (e) {
    console.error("Error parsing date:", e);
    return null;
  }
}