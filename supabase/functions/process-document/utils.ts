
// Helper utilities for document processing

// Helper function to safely extract nested properties from an object
export function extractPath(obj: any, path: string): any {
  if (!obj) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Helper function to clean HTML comments from extracted values
export function cleanValue(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove HTML comments: <!-- ... -->
  let cleaned = value.replace(/\s*<!--.*?-->\s*/g, ' ').trim();
  
  // Also remove form bounding box coordinates and IDs
  cleaned = cleaned.replace(/\s*<!\-\- \w+, from page \d+ \(.*?\), with ID .*? \-\->\s*/g, ' ').trim();
  
  // Remove coordinates directly in text (l=0.064,t=0.188,r=0.936,b=0.284)
  cleaned = cleaned.replace(/\s*\(l=[\d\.]+,t=[\d\.]+,r=[\d\.]+,b=[\d\.]+\)\s*/g, ' ').trim();
  
  // Remove IDs in text - with ID 5d5dece1-814c-40b8-ac21-2d9877814985
  cleaned = cleaned.replace(/\s*with ID [a-f0-9\-]+\s*/g, ' ').trim();
  
  // Clean up any remaining <!-- or --> fragments
  cleaned = cleaned.replace(/<!--|-->/g, '').trim();
  
  // Clean up HTML table data cells with empty brackets
  cleaned = cleaned.replace(/<td>\[\s*\]<\/td>/g, 'N/A').trim();
  
  // Handle N/A values more consistently
  if (cleaned.match(/^N\/?A$/i) || cleaned === '[ ]' || cleaned === '[]') {
    return 'N/A';
  }
  
  return cleaned;
}

// Helper function to check if a condition exists in an array of conditions
export function checkCondition(data: any, path: string, condition: string): boolean {
  const conditions = extractPath(data, path);
  if (!Array.isArray(conditions)) return false;
  
  return conditions.some((item: string) => 
    typeof item === 'string' && item.toLowerCase().includes(condition.toLowerCase())
  );
}

/**
 * Calculate age based on date of birth
 * @param dateOfBirth - Date of birth
 * @returns age in years
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Extract information from a South African ID number
 * @param idNumber - South African ID number
 * @returns Object with extracted date of birth, gender and citizenship
 */
export function extractInfoFromSAID(idNumber: string): {
  dateOfBirth: string | null;
  gender: 'male' | 'female' | null;
  citizenship: 'citizen' | 'permanent_resident' | null;
  age?: number;
} {
  // Default return object
  const result = {
    dateOfBirth: null as string | null,
    gender: null as 'male' | 'female' | null,
    citizenship: null as 'citizen' | 'permanent_resident' | null,
  };
  
  if (!idNumber || idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
    return result;
  }

  try {
    // Extract date of birth
    const yearPrefix = parseInt(idNumber.substring(0, 2), 10);
    const month = parseInt(idNumber.substring(2, 4), 10);
    const day = parseInt(idNumber.substring(4, 6), 10);
    
    // Validate date components
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Determine century (assuming 2000s for years less than 22, otherwise 1900s)
      const fullYear = yearPrefix < 22 ? 2000 + yearPrefix : 1900 + yearPrefix;
      result.dateOfBirth = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Calculate age
      const dob = new Date(fullYear, month - 1, day);
      if (!isNaN(dob.getTime())) {
        result.age = calculateAge(dob);
      }
    }
    
    // Extract gender
    const genderDigits = parseInt(idNumber.substring(6, 10), 10);
    if (genderDigits >= 0 && genderDigits <= 4999) {
      result.gender = 'female';
    } else if (genderDigits >= 5000 && genderDigits <= 9999) {
      result.gender = 'male';
    }
    
    // Extract citizenship
    const citizenshipDigit = parseInt(idNumber.charAt(10), 10);
    if (citizenshipDigit === 0) {
      result.citizenship = 'citizen';
    } else if (citizenshipDigit === 1) {
      result.citizenship = 'permanent_resident';
    }
  } catch (error) {
    console.error('Error extracting information from SA ID:', error);
  }
  
  return result;
}

// Improved helper function to check if a specific item is checked in the markdown
export function isChecked(markdown: string, term: string, debug: boolean = false): boolean {
  if (!markdown || !term) return false;
  
  // Normalize the term for case-insensitive matching
  const normalizedTerm = term.toLowerCase().replace(/[-\s]+/g, '[-\\s]+');
  
  // Create patterns that match various checkbox marks
  // This includes: x, X, ✓, ✔, √, v, •, *, +, or any non-whitespace character in brackets
  const checkMarks = ['x', 'X', '✓', '✔', '√', 'v', '•', '\\*', '\\+', '[^\\s\\[\\]]'];
  const checkboxRegexParts = checkMarks.map(mark => `\\[${mark}\\]`);
  const checkboxPatternStr = checkboxRegexParts.join('|');
  
  // Look specifically for checkbox patterns next to the term
  const checkboxPatterns = [
    // Look for any checkbox mark with the term nearby
    new RegExp(`\\b${normalizedTerm}\\b[^\\n]*?(${checkboxPatternStr})`, 'i'),
    new RegExp(`(${checkboxPatternStr})[^\\n]*?\\b${normalizedTerm}\\b`, 'i'),
    
    // Look for term with checkbox in markdown format
    new RegExp(`\\*\\*${normalizedTerm}\\*\\*:\\s*(${checkboxPatternStr})`, 'i'),
    
    // Look for table cells with both the term and any checkbox mark
    new RegExp(`<td>${normalizedTerm}[^<]*</td>[^<]*<td>(${checkboxPatternStr})</td>`, 'i'),
    new RegExp(`<td>[^<]*${normalizedTerm}[^<]*</td>[^<]*<td>(${checkboxPatternStr})</td>`, 'i'),
    
    // Look for pattern where term is followed by any checkbox mark in a table
    new RegExp(`<tr>[^<]*<td>[^<]*${normalizedTerm}[^<]*</td>[^<]*<td>(${checkboxPatternStr})</td>`, 'i'),
    
    // Look for pattern in pipe tables
    new RegExp(`\\|\\s*${normalizedTerm}\\s*\\|[^|]*?(${checkboxPatternStr})[^|]*?\\|`, 'i')
  ];
  
  // Additional patterns to look for filled checkboxes without explicit brackets
  const filledCheckboxPatterns = [
    // Look for "checked" or "ticked" near the term
    new RegExp(`\\b${normalizedTerm}\\b[^\\n]*?\\b(checked|ticked|selected|marked)\\b`, 'i'),
    new RegExp(`\\b(checked|ticked|selected|marked)\\b[^\\n]*?\\b${normalizedTerm}\\b`, 'i'),
    
    // Look for ✓ or ✔ near the term (without brackets)
    new RegExp(`\\b${normalizedTerm}\\b[^\\n]*?[✓✔√]`, 'i'),
    new RegExp(`[✓✔√][^\\n]*?\\b${normalizedTerm}\\b`, 'i')
  ];
  
  if (debug) {
    console.log(`Checking term "${term}" in markdown...`);
  }
  
  // Check if any of the checkbox patterns match
  for (let i = 0; i < checkboxPatterns.length; i++) {
    const pattern = checkboxPatterns[i];
    const match = markdown.match(pattern);
    if (match) {
      if (debug) {
        console.log(`✅ Match found with pattern ${i}:`, match[0]);
      }
      return true;
    }
  }
  
  // Check filled checkbox patterns
  for (let i = 0; i < filledCheckboxPatterns.length; i++) {
    const pattern = filledCheckboxPatterns[i];
    const match = markdown.match(pattern);
    if (match) {
      if (debug) {
        console.log(`✅ Match found with filled checkbox pattern ${i}:`, match[0]);
      }
      return true;
    }
  }
  
  // Special case for empty checkboxes - look for the term with an empty checkbox
  const emptyCheckboxPattern = new RegExp(`\\b${normalizedTerm}\\b[^\\n]*?\\[ \\]`, 'i');
  const emptyTableCellPattern = new RegExp(`<td>${normalizedTerm}[^<]*</td>[^<]*<td>\\[ \\]</td>`, 'i');
  
  // If we find an empty checkbox explicitly, return false
  if (emptyCheckboxPattern.test(markdown) || emptyTableCellPattern.test(markdown)) {
    if (debug) {
      console.log(`❌ Empty checkbox found for term "${term}"`);
    }
    return false;
  }
  
  // For the fitness section, it might be in a different format
  if (term.match(/^(FIT|UNFIT)$/i)) {
    for (const mark of checkMarks) {
      const fitnessPattern = new RegExp(`${normalizedTerm}[^\\n]*?\\[${mark}\\]`, 'i');
      if (fitnessPattern.test(markdown)) {
        if (debug) {
          console.log(`✅ Fitness match found for term "${term}"`);
        }
        return true;
      }
    }
  }
  
  // Also check for "crossing out" patterns specifically for "FIT" or "UNFIT"
  if (term.match(/^(FIT|UNFIT)$/i)) {
    const crossedOutPatterns = [
      new RegExp(`${normalizedTerm}[^\\n]*?(crossed|crossing|strikethrough|struck|lined)`, 'i'),
      new RegExp(`(crossed|crossing|strikethrough|struck|lined)[^\\n]*?${normalizedTerm}`, 'i')
    ];
    
    for (const pattern of crossedOutPatterns) {
      if (pattern.test(markdown)) {
        // For "FIT" being crossed out, it means "UNFIT" is true
        if (term.toUpperCase() === "FIT" && pattern.test(markdown)) {
          if (debug) {
            console.log(`❌ FIT crossed out, returning false`);
          }
          return false;
        }
        // For "UNFIT" being crossed out, it means "FIT" is true
        if (term.toUpperCase() === "UNFIT" && pattern.test(markdown)) {
          if (debug) {
            console.log(`❌ UNFIT crossed out, returning false`);
          }
          return false;
        }
      }
    }
  }
  
  if (debug) {
    console.log(`❌ No match found for term "${term}"`);
  }
  
  return false;
}
