/**
 * South African ID Number Parser
 * 
 * This module provides utilities for parsing South African ID numbers,
 * validating them, and extracting demographic information.
 * 
 * A South African ID number is a 13-digit number structured as follows:
 * - First 6 digits (YYMMDD): Date of birth
 * - Next 4 digits (SSSS): Gender (Females: 0000-4999, Males: 5000-9999)
 * - 11th digit (C): Citizenship (0: SA citizen, 1: Permanent resident)
 * - 12th digit (A): Usually 8 or 9 (historically used for race classification)
 * - 13th digit (Z): Checksum digit calculated using the Luhn algorithm
 */

/**
 * Represents the parsed data from a South African ID number
 */
export interface ParsedSAID {
  original: string;
  birthdate: string | null; // ISO format YYYY-MM-DD
  gender: 'male' | 'female' | null;
  citizenshipStatus: 'citizen' | 'permanent_resident' | null;
  isValid: boolean;
}

/**
 * Validates a South African ID number using the Luhn algorithm
 * 
 * @param idNumber The ID number to validate
 * @returns True if the ID number passes validation
 */
function validateSAIDChecksum(idNumber: string): boolean {
  if (!idNumber || idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
    return false;
  }

  // Apply Luhn algorithm
  let sum = 0;
  let alternate = false;

  // Process all digits except the check digit (last digit)
  for (let i = idNumber.length - 2; i >= 0; i--) {
    let digit = parseInt(idNumber.charAt(i), 10);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  // The check digit is the amount needed to make the sum a multiple of 10
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  const providedCheckDigit = parseInt(idNumber.charAt(idNumber.length - 1), 10);

  return calculatedCheckDigit === providedCheckDigit;
}

/**
 * Extracts the birthdate from a South African ID number
 * 
 * @param idNumber The ID number
 * @returns ISO format date string (YYYY-MM-DD) or null if invalid
 */
function extractBirthdate(idNumber: string): string | null {
  if (!idNumber || idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
    return null;
  }

  const year = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);

  // Validate date components
  const monthInt = parseInt(month, 10);
  const dayInt = parseInt(day, 10);
  const yearInt = parseInt(year, 10);

  if (monthInt < 1 || monthInt > 12 || dayInt < 1 || dayInt > 31) {
    return null;
  }

  // Determine century - pivot at 25: 00-24 = 2000s, 25-99 = 1900s
  const fullYear = yearInt < 25 ? 2000 + yearInt : 1900 + yearInt;

  // Create the date string in ISO format (YYYY-MM-DD)
  const dateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  // Validate the constructed date by creating a Date object
  const dateObj = new Date(dateString);
  
  // Check if the date is valid and matches our input
  if (dateObj.getFullYear() !== fullYear || 
      dateObj.getMonth() + 1 !== monthInt || 
      dateObj.getDate() !== dayInt) {
    return null;
  }

  return dateString;
}

/**
 * Extracts gender information from a South African ID number
 * 
 * @param idNumber The ID number
 * @returns 'male', 'female', or null if invalid
 */
function extractGender(idNumber: string): 'male' | 'female' | null {
  if (!idNumber || idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
    return null;
  }

  const genderDigits = parseInt(idNumber.substring(6, 10), 10);
  
  if (genderDigits >= 0 && genderDigits <= 4999) {
    return 'female';
  } else if (genderDigits >= 5000 && genderDigits <= 9999) {
    return 'male';
  }
  
  return null;
}

/**
 * Extracts citizenship status from a South African ID number
 * 
 * @param idNumber The ID number
 * @returns 'citizen', 'permanent_resident', or null if invalid
 */
function extractCitizenshipStatus(idNumber: string): 'citizen' | 'permanent_resident' | null {
  if (!idNumber || idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
    return null;
  }

  const citizenshipDigit = parseInt(idNumber.charAt(10), 10);
  
  if (citizenshipDigit === 0) {
    return 'citizen';
  } else if (citizenshipDigit === 1) {
    return 'permanent_resident';
  }
  
  return null;
}

/**
 * Parses a South African ID number and extracts all relevant information
 * 
 * @param idNumber The ID number to parse
 * @returns ParsedSAID object with extracted information
 */
export function parseSouthAfricanIDNumber(idNumber: string): ParsedSAID {
  try {
    // Clean the ID number - remove spaces and non-numeric characters
    const cleanedID = String(idNumber).replace(/\D/g, '');
    
    // Check if the ID number has the correct format (13 digits)
    if (!cleanedID || cleanedID.length !== 13 || !/^\d{13}$/.test(cleanedID)) {
      return {
        original: String(idNumber),
        birthdate: null,
        gender: null,
        citizenshipStatus: null,
        isValid: false
      };
    }

    // Validate using Luhn algorithm
    let isValid = false;
    try {
      isValid = validateSAIDChecksum(cleanedID);
    } catch (checksumError) {
      console.error('Error validating ID checksum:', checksumError);
      isValid = false;
    }
    
    // Extract components with individual try/catch blocks to prevent complete failure
    let birthdate = null;
    try {
      birthdate = extractBirthdate(cleanedID);
    } catch (birthdateError) {
      console.error('Error extracting birthdate:', birthdateError);
    }
    
    let gender = null;
    try {
      gender = extractGender(cleanedID);
    } catch (genderError) {
      console.error('Error extracting gender:', genderError);
    }
    
    let citizenshipStatus = null;
    try {
      citizenshipStatus = extractCitizenshipStatus(cleanedID);
    } catch (citizenshipError) {
      console.error('Error extracting citizenship status:', citizenshipError);
    }
    
    return {
      original: cleanedID,
      birthdate: birthdate,
      gender: gender,
      citizenshipStatus: citizenshipStatus,
      isValid: isValid
    };
  } catch (error) {
    console.error('Unexpected error parsing South African ID number:', error);
    return {
      original: String(idNumber || ''),
      birthdate: null,
      gender: null,
      citizenshipStatus: null,
      isValid: false
    };
  }
}

/**
 * Normalizes an ID number by removing spaces and non-numeric characters
 * 
 * @param idNumber The ID number to normalize
 * @returns Normalized ID number
 */
export function normalizeIDNumber(idNumber: string | null | undefined): string | null {
  try {
    if (!idNumber) return null;
    
    // Ensure we're working with a string
    const idString = String(idNumber);
    
    // Remove all non-numeric characters
    const normalized = idString.replace(/\D/g, '');
    
    // Return null if the result is not exactly 13 digits
    if (normalized.length !== 13) {
      return null;
    }
    
    return normalized;
  } catch (error) {
    console.error('Error normalizing ID number:', error);
    return null;
  }
}
