
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Json } from "@/integrations/supabase/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define an interface for examination results to fix type errors
// Make it extend Record<string, any> to include an index signature
interface ExaminationResults extends Record<string, any> {
  test_results: Record<string, any>;
  type: Record<string, any>;
  date?: string; // Make date optional but explicitly defined
}

// Helper function to map extracted data to a consistent format that the validator expects
export function mapExtractedDataToValidatorFormat(extractedData: any): { structured_data: Record<string, any> } {
  console.log("Original data passed to mapper:", extractedData);
  
  if (!extractedData || typeof extractedData !== 'object') {
    return {
      structured_data: {
        patient: {},
        certification: {},
        examination_results: { 
          test_results: {},
          type: {}
        } as ExaminationResults,
        restrictions: {}
      }
    };
  }

  // If it's already in the expected format with structured_data, just ensure all required fields exist
  if (extractedData.structured_data && typeof extractedData.structured_data === 'object') {
    console.log("Data already has structured_data format, ensuring all fields exist");
    
    const structuredData = {
      structured_data: {
        patient: extractedData.structured_data.patient || {},
        certification: extractedData.structured_data.certification || {},
        examination_results: { 
          test_results: extractedData.structured_data.examination_results?.test_results || {},
          type: extractedData.structured_data.examination_results?.type || {}
        } as ExaminationResults,
        restrictions: extractedData.structured_data.restrictions || {}
      }
    };
    
    // Ensure examination date is set in examination_results
    if (extractedData.structured_data.examination_results && 
        typeof extractedData.structured_data.examination_results === 'object' &&
        'date' in extractedData.structured_data.examination_results) {
      structuredData.structured_data.examination_results.date = 
        extractedData.structured_data.examination_results.date;
    }
    
    console.log("Returning already structured data with ensured fields:", structuredData);
    return structuredData;
  }
  
  // Check if the data is nested in raw_response.structured_data
  if (extractedData.raw_response && 
      extractedData.raw_response.structured_data && 
      typeof extractedData.raw_response.structured_data === 'object') {
    console.log("Found structured_data inside raw_response, using that");
    return {
      structured_data: {
        patient: extractedData.raw_response.structured_data.patient || {},
        certification: extractedData.raw_response.structured_data.certification || {},
        examination_results: {
          test_results: extractedData.raw_response.structured_data.examination_results?.test_results || {},
          type: extractedData.raw_response.structured_data.examination_results?.type || {},
          date: extractedData.raw_response.structured_data.examination_results?.date || ""
        } as ExaminationResults,
        restrictions: extractedData.raw_response.structured_data.restrictions || {}
      }
    };
  }
  
  // Check if the data might be directly in a raw_response result field
  if (extractedData.raw_response && 
      extractedData.raw_response.result && 
      typeof extractedData.raw_response.result === 'object') {
    const result = extractedData.raw_response.result;
    
    // If result contains the expected fields directly, structure it properly
    if (result.patient || result.examination_results || result.certification || result.restrictions) {
      console.log("Found data fields directly in raw_response.result, structuring them");
      return {
        structured_data: {
          patient: result.patient || {},
          certification: result.certification || {},
          examination_results: {
            test_results: result.examination_results?.test_results || {},
            type: result.examination_results?.type || {},
            date: result.examination_results?.date || ""
          } as ExaminationResults,
          restrictions: result.restrictions || {}
        }
      };
    }
  }

  // IMPORTANT: Check for direct extraction data from API client
  if (extractedData.raw_response && 
      extractedData.raw_response.directExtraction &&
      typeof extractedData.raw_response.directExtraction === 'object') {
    console.log("Found directExtraction data from API client, using it");
    const directData = extractedData.raw_response.directExtraction;
    
    return {
      structured_data: {
        patient: {
          name: directData.patient?.name || '',
          id_number: directData.patient?.id_number || '',
          company: directData.patient?.company || '',
          occupation: directData.patient?.occupation || '',
          gender: 'unknown', // Default value
          date_of_birth: ''  // Usually not available in certificates
        },
        certification: {
          fit: directData.certification?.fit || false,
          fit_with_restrictions: directData.certification?.fit_with_restrictions || false,
          fit_with_condition: directData.certification?.fit_with_condition || false,
          temporarily_unfit: directData.certification?.temporarily_unfit || false,
          unfit: directData.certification?.unfit || false,
          examination_date: directData.certification?.examination_date || '',
          valid_until: directData.certification?.valid_until || '',
          follow_up: directData.certification?.follow_up || '',
          review_date: directData.certification?.review_date || '',
          comments: directData.certification?.comments || ''
        },
        examination_results: {
          date: directData.certification?.examination_date || '',
          type: {
            pre_employment: directData.examination?.type?.pre_employment || false,
            periodical: directData.examination?.type?.periodical || false,
            exit: directData.examination?.type?.exit || false
          },
          test_results: directData.examination?.tests || {},
          physician: '',
          fitness_status: directData.certification?.fit ? 'Fit' : 
                          directData.certification?.unfit ? 'Unfit' : 
                          directData.certification?.temporarily_unfit ? 'Temporarily Unfit' : 
                          directData.certification?.fit_with_restrictions ? 'Fit with Restrictions' : 
                          directData.certification?.fit_with_condition ? 'Fit with Condition' : 'Unknown',
          restrictions: 'None',
          next_examination_date: directData.certification?.valid_until || ''
        } as ExaminationResults,
        restrictions: directData.restrictions || {}
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
      } as ExaminationResults,
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
    // Add date property if it exists
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

  // Special case: if all fields are empty, try looking for raw_content and extract from markdown
  if (Object.keys(structuredData.structured_data.patient).length === 0 && 
      extractedData.raw_content && 
      typeof extractedData.raw_content === 'string') {
    console.log("Using raw_content to extract data from markdown");
    const markdown = extractedData.raw_content;
    
    // Extract patient name
    const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (nameMatch && nameMatch[1]) {
      structuredData.structured_data.patient.name = nameMatch[1].trim();
    }
    
    // Extract ID Number
    const idMatch = markdown.match(/\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (idMatch && idMatch[1]) {
      structuredData.structured_data.patient.id_number = idMatch[1].trim();
    }
    
    // Extract Company
    const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (companyMatch && companyMatch[1]) {
      structuredData.structured_data.patient.company = companyMatch[1].trim();
    }
    
    // Extract Job Title
    const jobMatch = markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (jobMatch && jobMatch[1]) {
      structuredData.structured_data.patient.occupation = jobMatch[1].trim();
    }
    
    // Add raw_content to structuredData for fallback extraction
    structuredData.structured_data.raw_content = markdown;
  }
  
  // NEW: Direct extraction from raw_response.data.markdown if available
  if (structuredData.structured_data.patient && 
      Object.keys(structuredData.structured_data.patient).length === 0 && 
      extractedData.raw_response?.data?.markdown) {
    console.log("Extracting directly from raw_response.data.markdown");
    const markdown = extractedData.raw_response.data.markdown;
    
    // Extract patient name
    const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (nameMatch && nameMatch[1]) {
      structuredData.structured_data.patient.name = cleanExtractedValue(nameMatch[1]);
    }
    
    // Extract ID Number
    const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (idMatch && idMatch[1]) {
      structuredData.structured_data.patient.id_number = cleanExtractedValue(idMatch[1]);
    }
    
    // Extract Company
    const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (companyMatch && companyMatch[1]) {
      structuredData.structured_data.patient.company = cleanExtractedValue(companyMatch[1]);
    }
    
    // Extract Examination Date
    const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (examDateMatch && examDateMatch[1]) {
      const examDate = cleanExtractedValue(examDateMatch[1]);
      structuredData.structured_data.certification.examination_date = examDate;
      structuredData.structured_data.examination_results.date = examDate;
    }
    
    // Extract Expiry Date
    const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (expiryDateMatch && expiryDateMatch[1]) {
      structuredData.structured_data.certification.valid_until = cleanExtractedValue(expiryDateMatch[1]);
    }
    
    // Extract Job Title from Key-Value Pair section
    const jobTitleMatch = markdown.match(/Job Title:\s*(.*?)(?=\n|\r|$)/i);
    if (jobTitleMatch && jobTitleMatch[1]) {
      structuredData.structured_data.patient.occupation = cleanExtractedValue(jobTitleMatch[1]);
    }
    
    // Extract examination type
    structuredData.structured_data.examination_results.type = {
      pre_employment: isCheckboxMarked(markdown, "PRE-EMPLOYMENT"),
      periodical: isCheckboxMarked(markdown, "PERIODICAL"),
      exit: isCheckboxMarked(markdown, "EXIT")
    };
    
    // Extract test results
    const testMap = [
      { name: 'BLOODS', key: 'bloods' },
      { name: 'FAR, NEAR VISION', key: 'far_near_vision' },
      { name: 'SIDE & DEPTH', key: 'side_depth' },
      { name: 'NIGHT VISION', key: 'night_vision' },
      { name: 'Hearing', key: 'hearing' },
      { name: 'Working at Heights', key: 'heights' },
      { name: 'Lung Function', key: 'lung_function' },
      { name: 'X-Ray', key: 'x_ray' },
      { name: 'Drug Screen', key: 'drug_screen' }
    ];
    
    structuredData.structured_data.examination_results.test_results = {};
    
    testMap.forEach(test => {
      structuredData.structured_data.examination_results.test_results[`${test.key}_done`] = isCheckboxMarked(markdown, test.name);
      const resultMatch = new RegExp(`${test.name}[^\\n]*?\\[(x|X)\\][^\\n]*?([^\\n<]+)`, 'i').exec(markdown);
      if (resultMatch && resultMatch[2]) {
        structuredData.structured_data.examination_results.test_results[`${test.key}_results`] = cleanExtractedValue(resultMatch[2]);
      }
    });
    
    // Extract fitness status
    structuredData.structured_data.certification.fit = isCheckboxMarked(markdown, "FIT");
    structuredData.structured_data.certification.fit_with_restrictions = isCheckboxMarked(markdown, "Fit with Restriction");
    structuredData.structured_data.certification.fit_with_condition = isCheckboxMarked(markdown, "Fit with Condition");
    structuredData.structured_data.certification.temporarily_unfit = isCheckboxMarked(markdown, "Temporary Unfit");
    structuredData.structured_data.certification.unfit = isCheckboxMarked(markdown, "UNFIT");
    
    // Add raw_content to structuredData for fallback extraction
    structuredData.structured_data.raw_content = markdown;
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

// Export the useToast and toast from use-toast.ts
export { useToast, toast } from "@/hooks/use-toast";
