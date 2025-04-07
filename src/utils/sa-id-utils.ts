
/**
 * Utility functions for working with South African ID numbers
 */

/**
 * Extract date of birth from a South African ID number
 * @param idNumber - The South African ID number
 * @returns Date object or null if invalid
 */
export function extractDateOfBirthFromSAID(idNumber: string): Date | null {
  if (!idNumber || idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
    return null;
  }

  // Extract date components from ID
  const yearPrefix = parseInt(idNumber.substring(0, 2), 10);
  const month = parseInt(idNumber.substring(2, 4), 10);
  const day = parseInt(idNumber.substring(4, 6), 10);

  // Determine century (assuming 2000s for years less than 22, otherwise 1900s)
  // This can be adjusted based on your specific needs
  const fullYear = yearPrefix < 22 ? 2000 + yearPrefix : 1900 + yearPrefix;

  // Validate date components
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  try {
    const dob = new Date(fullYear, month - 1, day);
    
    // Check if date is valid and not in the future
    if (isNaN(dob.getTime()) || dob > new Date()) {
      return null;
    }
    
    return dob;
  } catch (error) {
    return null;
  }
}

/**
 * Extract gender from a South African ID number
 * @param idNumber - The South African ID number
 * @returns 'male', 'female', or null if invalid
 */
export function extractGenderFromSAID(idNumber: string): 'male' | 'female' | null {
  if (!idNumber || idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
    return null;
  }

  // In SA ID, digits 7-10 (index 6-9) indicate gender
  const genderDigits = parseInt(idNumber.substring(6, 10), 10);
  
  // Females: 0000-4999, Males: 5000-9999
  if (genderDigits >= 0 && genderDigits <= 4999) {
    return 'female';
  } else if (genderDigits >= 5000 && genderDigits <= 9999) {
    return 'male';
  } else {
    return null;
  }
}

/**
 * Extract citizenship status from a South African ID number
 * @param idNumber - The South African ID number
 * @returns 'citizen', 'permanent_resident', or null if invalid
 */
export function extractCitizenshipFromSAID(idNumber: string): 'citizen' | 'permanent_resident' | null {
  if (!idNumber || idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
    return null;
  }

  // 11th digit (index 10) indicates citizenship
  const citizenshipDigit = parseInt(idNumber.charAt(10), 10);
  
  if (citizenshipDigit === 0) {
    return 'citizen';
  } else if (citizenshipDigit === 1) {
    return 'permanent_resident';
  } else {
    return null;
  }
}

/**
 * Validate a South African ID number using the Luhn algorithm
 * @param idNumber - The South African ID number
 * @returns boolean indicating if the ID number is valid
 */
export function validateSAID(idNumber: string): boolean {
  if (!idNumber || idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
    return false;
  }

  // Check if basic date format is valid
  const month = parseInt(idNumber.substring(2, 4), 10);
  const day = parseInt(idNumber.substring(4, 6), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Apply Luhn algorithm for the check digit
  const digits = idNumber.split('').map(digit => parseInt(digit, 10));
  const checkDigit = digits.pop(); // Remove and store the check digit
  
  let sum = 0;
  let alternate = false;
  
  // Process in reverse order (excluding the check digit)
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  // Check if the calculated check digit matches the actual check digit
  return (10 - (sum % 10)) % 10 === checkDigit;
}

/**
 * Extract all relevant information from a South African ID number
 * @param idNumber - The South African ID number
 * @returns Object containing extracted information or null if invalid
 */
export function extractInfoFromSAID(idNumber: string): {
  dateOfBirth: Date | null;
  gender: 'male' | 'female' | null;
  citizenship: 'citizen' | 'permanent_resident' | null;
  isValid: boolean;
} {
  return {
    dateOfBirth: extractDateOfBirthFromSAID(idNumber),
    gender: extractGenderFromSAID(idNumber),
    citizenship: extractCitizenshipFromSAID(idNumber),
    isValid: validateSAID(idNumber)
  };
}
