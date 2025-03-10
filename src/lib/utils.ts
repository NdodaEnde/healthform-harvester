
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to map extracted data to a consistent format that the validator expects
export function mapExtractedDataToValidatorFormat(extractedData: any) {
  if (!extractedData || typeof extractedData !== 'object') {
    return {
      structured_data: {
        patient: {},
        certification: {},
        examination_results: { test_results: {} },
        restrictions: {}
      }
    };
  }

  // Create a properly structured object
  const structuredData = {
    structured_data: {
      patient: {},
      certification: {},
      examination_results: { 
        test_results: {},
        type: {}
      },
      restrictions: {}
    }
  };

  // Map patient details
  if (extractedData.patient) {
    structuredData.structured_data.patient = {
      name: extractedData.patient.name || '',
      id_number: extractedData.patient.employee_id || extractedData.patient.id_number || '',
      company: extractedData.patient.company || '',
      occupation: extractedData.patient.occupation || ''
    };
  }

  // Map certification details
  if (extractedData.certification) {
    structuredData.structured_data.certification = {
      valid_until: extractedData.certification.valid_until || '',
      review_date: extractedData.certification.review_date || '',
      follow_up: extractedData.certification.follow_up || '',
      comments: extractedData.certification.comments || '',
      // Fitness assessment
      fit: extractedData.certification.fit || false,
      fit_with_restrictions: extractedData.certification.fit_with_restrictions || false,
      fit_with_condition: extractedData.certification.fit_with_condition || false,
      temporarily_unfit: extractedData.certification.temporarily_unfit || false,
      unfit: extractedData.certification.unfit || false
    };
  }

  // Map examination results and test results
  if (extractedData.examination_results) {
    // Check if the date property exists before trying to set it
    if (typeof extractedData.examination_results === 'object' && 
        extractedData.examination_results !== null &&
        'date' in extractedData.examination_results) {
      structuredData.structured_data.examination_results.date = extractedData.examination_results.date;
    }
    
    // Map examination type
    structuredData.structured_data.examination_results.type = {
      pre_employment: extractedData.examination_results.type?.pre_employment || false,
      periodical: extractedData.examination_results.type?.periodical || false,
      exit: extractedData.examination_results.type?.exit || false
    };

    // Map test results
    if (extractedData.examination_results.test_results) {
      const testResults = extractedData.examination_results.test_results;
      
      structuredData.structured_data.examination_results.test_results = {
        // Blood tests
        bloods_done: testResults.bloods_done || false,
        bloods_results: testResults.bloods_results || '',
        
        // Vision tests
        far_near_vision_done: testResults.far_near_vision_done || false,
        far_near_vision_results: testResults.far_near_vision_results || '',
        
        side_depth_done: testResults.side_depth_done || false,
        side_depth_results: testResults.side_depth_results || '',
        
        night_vision_done: testResults.night_vision_done || false,
        night_vision_results: testResults.night_vision_results || '',
        
        // Other tests
        hearing_done: testResults.hearing_done || false,
        hearing_results: testResults.hearing_results || '',
        
        heights_done: testResults.heights_done || false,
        heights_results: testResults.heights_results || '',
        
        lung_function_done: testResults.lung_function_done || false,
        lung_function_results: testResults.lung_function_results || '',
        
        x_ray_done: testResults.x_ray_done || false,
        x_ray_results: testResults.x_ray_results || '',
        
        drug_screen_done: testResults.drug_screen_done || false,
        drug_screen_results: testResults.drug_screen_results || ''
      };
    }
  }

  // Map restrictions
  if (extractedData.restrictions) {
    structuredData.structured_data.restrictions = {
      heights: extractedData.restrictions.heights || false,
      dust_exposure: extractedData.restrictions.dust_exposure || false,
      motorized_equipment: extractedData.restrictions.motorized_equipment || false,
      wear_hearing_protection: extractedData.restrictions.wear_hearing_protection || false,
      confined_spaces: extractedData.restrictions.confined_spaces || false,
      chemical_exposure: extractedData.restrictions.chemical_exposure || false,
      wear_spectacles: extractedData.restrictions.wear_spectacles || false,
      remain_on_treatment_for_chronic_conditions: extractedData.restrictions.remain_on_treatment_for_chronic_conditions || false
    };
  }

  return structuredData;
}

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

// Corrected import statement to use the actual names exported from use-toast.ts
export { useToast, toast } from "@/hooks/use-toast";
