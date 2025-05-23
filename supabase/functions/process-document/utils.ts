
// Helper utilities for document processing
import { parseSouthAfricanIDNumber, normalizeIDNumber } from './sa-id-parser.ts';

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

// Extract and normalize South African ID number from text
export function extractSouthAfricanIDNumber(text: string): string | null {
  if (!text) return null;
  
  // Pattern to match South African ID numbers (13 digits, optionally with spaces or hyphens)
  const idPattern = /\b(\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{4}[\s-]?\d{3})\b/g;
  
  // Find all potential matches
  const matches = [...text.matchAll(idPattern)];
  
  if (matches.length === 0) return null;
  
  // Return the first match, normalized (removing spaces and hyphens)
  return matches[0][1].replace(/[\s-]/g, '');
}

// Process South African ID number and extract demographic information
export function processSouthAfricanIDNumber(idNumber: string | null) {
  if (!idNumber) return null;
  
  // Normalize the ID number
  const normalizedID = normalizeIDNumber(idNumber);
  
  // Parse the ID number
  const idData = parseSouthAfricanIDNumber(normalizedID);
  
  // Only return data if the ID is valid
  if (!idData.isValid) return null;
  
  // Format the birth date as ISO string (YYYY-MM-DD)
  const birthDate = idData.birthDate ? 
    idData.birthDate.toISOString().split('T')[0] : null;
  
  return {
    id_number: normalizedID,
    id_number_valid: true,
    birthdate_from_id: birthDate,
    gender_from_id: idData.gender,
    citizenship_status: idData.citizenshipStatus === 'citizen' ? 
      'citizen' : 'permanent_resident'
  };
}
