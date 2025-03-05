
/**
 * Document processing and confidence scoring utilities
 */

type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Generate a confidence score between 0-1 based on the field value and extraction context
 */
export const calculateConfidence = (value: string | null | undefined, fieldType: string): number => {
  if (!value) return 0;
  
  // Remove any HTML comments or metadata
  const cleanValue = value.toString().replace(/<!--.*?-->/g, '').trim();
  
  // Empty values have 0 confidence
  if (!cleanValue) return 0;
  
  // Short values or values with special patterns might indicate low confidence
  if (cleanValue === 'Unknown' || cleanValue === 'N/A') return 0.3;
  
  // Specific confidence rules for different field types
  switch (fieldType) {
    case 'date':
      // Higher confidence for well-formatted dates
      return /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/.test(cleanValue) ? 0.9 : 0.6;
      
    case 'name':
      // Higher confidence for names with multiple parts and proper length
      return cleanValue.includes(' ') && cleanValue.length > 5 ? 0.85 : 0.6;
      
    case 'id':
      // Higher confidence for IDs with consistent formats
      return /^[A-Z0-9-]{5,}$/.test(cleanValue) ? 0.9 : 0.7;
      
    case 'boolean':
      // Boolean fields (e.g., checkboxes) typically have high confidence
      return 0.9;
      
    default:
      // Default confidence based on value length (longer values often more reliable)
      return Math.min(0.5 + (cleanValue.length * 0.03), 0.85);
  }
};

/**
 * Get confidence level category from numerical score
 */
export const getConfidenceLevel = (score: number): ConfidenceLevel => {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
};

/**
 * Get CSS class based on confidence level
 */
export const getConfidenceClass = (score: number): string => {
  const level = getConfidenceLevel(score);
  
  switch (level) {
    case 'high':
      return 'bg-green-50 border-green-200';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200';
    case 'low':
      return 'bg-red-50 border-red-200';
    default:
      return '';
  }
};
