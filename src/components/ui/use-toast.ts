
import { useToast as useHookToast, toast as hookToast } from "@/hooks/use-toast";

// Helper function to clean HTML comments and metadata from extracted values
export const cleanExtractedValue = (value: string | null | undefined): string => {
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
  
  return cleaned;
};

// Improved helper function to detect if a checkbox is marked
export const isCheckboxMarked = (markdown: string, fieldName: string): boolean => {
  if (!markdown || !fieldName) return false;
  
  // Normalize the field name for pattern matching
  const normalizedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // If the field name doesn't exist in the text, return false immediately
  if (!new RegExp(normalizedField, 'i').test(markdown)) return false;
  
  // Create patterns that match various checkbox marks
  const checkMarks = ['x', 'X', '✓', '✔', '√', 'v', '•', '\\*', '\\+', '[^\\s\\[\\]]'];
  const checkboxRegexParts = checkMarks.map(mark => `\\[${mark}\\]`);
  const checkboxPatternStr = checkboxRegexParts.join('|');
  
  // Get the context around the field name
  const index = markdown.search(new RegExp(normalizedField, 'i'));
  if (index === -1) return false;
  
  const startContext = Math.max(0, index - 100);
  const endContext = Math.min(markdown.length, index + fieldName.length + 150);
  const context = markdown.substring(startContext, endContext);
  
  // Look for various checkbox patterns in the context
  const patterns = [
    // Standard markdown checkbox with mark (case insensitive)
    new RegExp(`${normalizedField}[^\\n]*?(${checkboxPatternStr})`, 'i'),
    new RegExp(`(${checkboxPatternStr})[^\\n]*?${normalizedField}`, 'i'),
    
    // HTML table cell with checkbox
    new RegExp(`<td>[^<]*${normalizedField}[^<]*</td>[^<]*<td>(${checkboxPatternStr})</td>`, 'i'),
    
    // Table with checkmark/tick symbol
    new RegExp(`${normalizedField}[^\\n]*?[✓✔]`, 'i'),
    
    // HTML entities for checkmarks
    new RegExp(`${normalizedField}[^\\n]*?(&check;|&#10003;|&#10004;)`, 'i'),
    
    // Text indicating checked status
    new RegExp(`${normalizedField}[^\\n]*?(checked|marked|selected|ticked)`, 'i')
  ];
  
  // Return true if any pattern matches in the context
  return patterns.some(pattern => pattern.test(context));
};

export { useHookToast as useToast, hookToast as toast };
