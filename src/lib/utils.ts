import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to map extracted data to a consistent format that the validator expects
export function mapExtractedDataToValidatorFormat(extractedData: any) {
  console.log("Original data passed to mapper:", extractedData);
  
  if (!extractedData || typeof extractedData !== 'object') {
    return {
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
  }

  // If it's already in the expected format with structured_data, just ensure all required fields exist
  if (extractedData.structured_data && typeof extractedData.structured_data === 'object') {
    console.log("Data already has structured_data format, ensuring all fields exist");
    
    const structuredData = {
      structured_data: {
        patient: { ...extractedData.structured_data.patient } || {},
        certification: { ...extractedData.structured_data.certification } || {},
        examination_results: { 
          test_results: { ...extractedData.structured_data.examination_results?.test_results } || {},
          type: { ...extractedData.structured_data.examination_results?.type } || {}
        },
        restrictions: { ...extractedData.structured_data.restrictions } || {}
      }
    };
    
    // Ensure examination date is set in examination_results
    if (extractedData.structured_data.examination_results?.date) {
      structuredData.structured_data.examination_results.date = 
        extractedData.structured_data.examination_results.date;
    }
    
    console.log("Returning already structured data with ensured fields:", structuredData);
    return structuredData;
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
      name: extractedData.patient.name || extractedData.patient.full_name || '',
      id_number: extractedData.patient.employee_id || extractedData.patient.id_number || extractedData.patient.id || '',
      company: extractedData.patient.company || extractedData.patient.company_name || extractedData.patient.employer || '',
      occupation: extractedData.patient.occupation || extractedData.patient.job_title || extractedData.patient.job || ''
    };
  }

  // Map certification details
  if (extractedData.certification) {
    structuredData.structured_data.certification = {
      examination_date: extractedData.certification.examination_date || extractedData.certification.date || '',
      valid_until: extractedData.certification.valid_until || extractedData.certification.expiry_date || '',
      review_date: extractedData.certification.review_date || '',
      follow_up: extractedData.certification.follow_up || '',
      comments: extractedData.certification.comments || extractedData.certification.notes || '',
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
    
    // Map examination type, with multiple name variations to catch different data formats
    structuredData.structured_data.examination_results.type = {
      pre_employment: extractedData.examination_results.type?.pre_employment || 
                      extractedData.examination_results.pre_employment || 
                      extractedData.examination_type?.pre_employment || false,
      periodical: extractedData.examination_results.type?.periodical || 
                 extractedData.examination_results.periodical || 
                 extractedData.examination_type?.periodical || false,
      exit: extractedData.examination_results.type?.exit || 
            extractedData.examination_results.exit || 
            extractedData.examination_type?.exit || false
    };

    // Map test results with multiple name variations to catch different data formats
    if (extractedData.examination_results.test_results) {
      const testResults = extractedData.examination_results.test_results;
      
      structuredData.structured_data.examination_results.test_results = {
        // Blood tests - map multiple possible field names
        bloods_done: testResults.bloods_done || testResults.blood_test_done || testResults.blood_done || false,
        bloods_results: testResults.bloods_results || testResults.blood_test_results || testResults.blood_results || '',
        
        // Vision tests - map multiple possible field names
        far_near_vision_done: testResults.far_near_vision_done || testResults.vision_test_done || testResults.vision_done || false,
        far_near_vision_results: testResults.far_near_vision_results || testResults.vision_test_results || testResults.vision_results || '',
        
        side_depth_done: testResults.side_depth_done || testResults.depth_test_done || testResults.depth_perception_done || false,
        side_depth_results: testResults.side_depth_results || testResults.depth_test_results || testResults.depth_perception_results || '',
        
        night_vision_done: testResults.night_vision_done || false,
        night_vision_results: testResults.night_vision_results || '',
        
        // Other tests - map multiple possible field names
        hearing_done: testResults.hearing_done || testResults.hearing_test_done || false,
        hearing_results: testResults.hearing_results || testResults.hearing_test_results || '',
        
        heights_done: testResults.heights_done || testResults.heights_test_done || false,
        heights_results: testResults.heights_results || testResults.heights_test_results || '',
        
        lung_function_done: testResults.lung_function_done || testResults.lung_test_done || false,
        lung_function_results: testResults.lung_function_results || testResults.lung_test_results || '',
        
        x_ray_done: testResults.x_ray_done || testResults.xray_done || false,
        x_ray_results: testResults.x_ray_results || testResults.xray_results || '',
        
        drug_screen_done: testResults.drug_screen_done || false,
        drug_screen_results: testResults.drug_screen_results || ''
      };
    }
  }

  // Map restrictions with multiple field name variations
  if (extractedData.restrictions) {
    structuredData.structured_data.restrictions = {
      heights: extractedData.restrictions.heights || false,
      dust_exposure: extractedData.restrictions.dust_exposure || extractedData.restrictions.dust || false,
      motorized_equipment: extractedData.restrictions.motorized_equipment || extractedData.restrictions.equipment || false,
      wear_hearing_protection: extractedData.restrictions.wear_hearing_protection || 
                             extractedData.restrictions.hearing_protection || false,
      confined_spaces: extractedData.restrictions.confined_spaces || false,
      chemical_exposure: extractedData.restrictions.chemical_exposure || extractedData.restrictions.chemicals || false,
      wear_spectacles: extractedData.restrictions.wear_spectacles || 
                      extractedData.restrictions.spectacles || false,
      remain_on_treatment_for_chronic_conditions: extractedData.restrictions.remain_on_treatment_for_chronic_conditions || 
                                                extractedData.restrictions.chronic_treatment || false
    };
  }

  console.log("Mapped data result:", structuredData);
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
