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
    structuredData.structured_data.examination_results.date = extractedData.examination_results.date || '';
    
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
