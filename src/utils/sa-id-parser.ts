/**
 * South African ID Number Parser
 * 
 * Validates and extracts information from South African ID numbers.
 * 
 * Format: YYMMDD SSSS CAZ
 * - YYMMDD: Date of birth (YY=Year, MM=Month, DD=Day)
 * - SSSS: Gender (Females: 0000-4999, Males: 5000-9999)
 * - C: Citizenship (0: SA Citizen, 1: Permanent Resident)
 * - A: Usually 8 for pre-1994 or 9 for post-1994 ID numbers
 * - Z: Checksum digit (Luhn algorithm)
 */

/**
 * Normalizes an ID number by removing non-numeric characters
 */
export const normalizeIDNumber = (idNumber: string): string => {
  return idNumber.replace(/\D/g, '');
};

/**
 * Validates a South African ID number using the Luhn algorithm
 */
const validateLuhnChecksum = (idNumber: string): boolean => {
  if (!/^\d{13}$/.test(idNumber)) return false;
  
  // Luhn algorithm implementation
  let sum = 0;
  let alternate = false;
  
  for (let i = idNumber.length - 1; i >= 0; i--) {
    let n = parseInt(idNumber.charAt(i), 10);
    
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }
    
    sum += n;
    alternate = !alternate;
  }
  
  return (sum % 10 === 0);
};

/**
 * Validates a date string in YYMMDD format
 */
const isValidDateYYMMDD = (dateStr: string): boolean => {
  if (dateStr.length !== 6) return false;
  
  const year = parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4));
  const day = parseInt(dateStr.substring(4, 6));
  
  // Check month validity
  if (month < 1 || month > 12) return false;
  
  // Check day validity based on month
  const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month]) return false;
  
  // February special case for leap years
  if (month === 2 && day === 29) {
    // For simplicity, we assume valid leap year handling
    // In a complete implementation, you'd check the full year value
    return true;
  }
  
  return true;
};

/**
 * Determines the full year from a 2-digit year
 * Assumes 00-24 is 2000-2024, 25-99 is 1925-1999
 */
const getFullYear = (twoDigitYear: number): number => {
  // Current pivot point
  const pivotYear = 25;
  
  if (twoDigitYear < pivotYear) {
    return 2000 + twoDigitYear;
  } else {
    return 1900 + twoDigitYear;
  }
};

export interface SouthAfricanIDData {
  isValid: boolean;
  birthDate?: Date;
  gender?: 'male' | 'female';
  citizenshipStatus?: 'citizen' | 'permanent resident';
  formattedIDNumber?: string;
}

/**
 * Parses a South African ID number and returns extracted information
 */
export const parseSouthAfricanIDNumber = (idNumber: string): SouthAfricanIDData => {
  // Normalize the ID number first
  const normalizedID = normalizeIDNumber(idNumber);
  
  // Basic length check
  if (normalizedID.length !== 13) {
    return { isValid: false };
  }
  
  // Check Luhn algorithm
  const isChecksumValid = validateLuhnChecksum(normalizedID);
  if (!isChecksumValid) {
    return { isValid: false };
  }
  
  // Extract date of birth component
  const dobString = normalizedID.substring(0, 6);
  if (!isValidDateYYMMDD(dobString)) {
    return { isValid: false };
  }
  
  // Extract and process birth date
  const year = getFullYear(parseInt(dobString.substring(0, 2)));
  const month = parseInt(dobString.substring(2, 4)) - 1; // JS months are 0-indexed
  const day = parseInt(dobString.substring(4, 6));
  const birthDate = new Date(year, month, day);
  
  // Extract gender
  const genderDigits = parseInt(normalizedID.substring(6, 10));
  const gender = genderDigits < 5000 ? 'female' : 'male';
  
  // Extract citizenship status
  const citizenshipDigit = parseInt(normalizedID.charAt(10));
  const citizenshipStatus = citizenshipDigit === 0 ? 'citizen' : 'permanent resident';
  
  // Format ID number for display (YYMMDD SSSS CAZ)
  const formattedIDNumber = `${normalizedID.substring(0, 6)} ${normalizedID.substring(6, 10)} ${normalizedID.substring(10)}`;
  
  return {
    isValid: true,
    birthDate,
    gender,
    citizenshipStatus,
    formattedIDNumber
  };
};

/**
 * Returns a user-friendly message describing ID number data
 */
export const getIDNumberSummary = (idData: SouthAfricanIDData): string => {
  if (!idData.isValid) {
    return 'Invalid South African ID number';
  }
  
  const birthDateFormatted = idData.birthDate?.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const genderCapitalized = idData.gender?.charAt(0).toUpperCase() + idData.gender?.slice(1);
  const citizenshipText = idData.citizenshipStatus === 'citizen' 
    ? 'South African Citizen' 
    : 'Permanent Resident';
  
  return `${birthDateFormatted} | ${genderCapitalized} | ${citizenshipText}`;
};