import { extractPath, cleanValue, isChecked } from "../utils.ts";

// Process certificate of fitness data from Landing AI response
export function processCertificateOfFitnessData(apiResponse: any) {
  try {
    // Extract fields from AI response
    const extractedData = apiResponse.result || {};
    const markdown = apiResponse.data?.markdown || '';

    console.log('Processing certificate of fitness data from API response');
    
    // Build structured data object from API response and markdown
    let structuredData = {
      patient: {
        name: cleanValue(extractPath(extractedData, 'patient.name')) || 
              cleanValue(extractPath(extractedData, 'employee.name')) || 'Unknown',
        date_of_birth: cleanValue(extractPath(extractedData, 'patient.date_of_birth')) || 
                      cleanValue(extractPath(extractedData, 'patient.dob')) || '',
        employee_id: cleanValue(extractPath(extractedData, 'patient.id')) || 
                    cleanValue(extractPath(extractedData, 'patient.id_number')) || 
                    cleanValue(extractPath(extractedData, 'employee.id')) || '',
        company: cleanValue(extractPath(extractedData, 'company')) || 
                cleanValue(extractPath(extractedData, 'employer')) || 
                cleanValue(extractPath(extractedData, 'patient.company')) || '',
        occupation: cleanValue(extractPath(extractedData, 'patient.occupation')) || 
                  cleanValue(extractPath(extractedData, 'patient.job_title')) || 
                  cleanValue(extractPath(extractedData, 'occupation')) || 
                  cleanValue(extractPath(extractedData, 'job_title')) || '',
        gender: cleanValue(extractPath(extractedData, 'patient.gender')) || 
               cleanValue(extractPath(extractedData, 'gender')) || 
               inferGenderFromMarkdown(markdown) || 'unknown'
      },
      examination_results: {
        date: cleanValue(extractPath(extractedData, 'examination.date')) || 
              cleanValue(extractPath(extractedData, 'date')) || 
              cleanValue(extractPath(extractedData, 'date_of_examination')) || 
              new Date().toISOString().split('T')[0],
        physician: cleanValue(extractPath(extractedData, 'examination.physician')) || 
                  cleanValue(extractPath(extractedData, 'physician')) || '',
        fitness_status: cleanValue(extractPath(extractedData, 'examination.fitness_status')) || 
                       cleanValue(extractPath(extractedData, 'fitness_status')) || 'Unknown',
        restrictions: cleanValue(extractPath(extractedData, 'examination.restrictions')) || 
                     cleanValue(extractPath(extractedData, 'restrictions')) || 'None',
        next_examination_date: cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                             cleanValue(extractPath(extractedData, 'valid_until')) || 
                             cleanValue(extractPath(extractedData, 'expiry_date')) || '',
        type: {
          pre_employment: false,
          periodical: false,
          exit: false
        },
        test_results: {}
      },
      certification: {
        fit: false,
        fit_with_restrictions: false,
        fit_with_condition: false,
        temporarily_unfit: false,
        unfit: false,
        follow_up: '',
        review_date: '',
        comments: '',
        valid_until: cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                    cleanValue(extractPath(extractedData, 'valid_until')) || 
                    cleanValue(extractPath(extractedData, 'expiry_date')) || ''
      },
      restrictions: {},
      raw_content: markdown || null
    };
    
    // If we have markdown, extract more detailed data
    if (markdown) {
      console.log('Extracting detailed data from markdown');
      
      // Extract Patient Information using more specific patterns
      structuredData = extractPatientInfoFromMarkdown(markdown, structuredData);
      
      // Extract Examination Type
      structuredData.examination_results.type = extractExaminationTypeFromMarkdown(markdown);
      
      // Extract Medical Test Results
      structuredData.examination_results.test_results = extractTestResultsFromMarkdown(markdown);
      
      // Extract Fitness Status
      structuredData.certification = extractFitnessStatusFromMarkdown(markdown, structuredData.certification);
      
      // Extract Restrictions
      structuredData.restrictions = extractRestrictionsFromMarkdown(markdown);
    }
    
    // Ensure patient always has a gender value
    if (!structuredData.patient.gender || structuredData.patient.gender === '') {
      structuredData.patient.gender = 'unknown';
      console.log('Setting default gender to "unknown"');
    }
    
    return structuredData;
    
  } catch (error) {
    console.error('Error processing certificate of fitness data:', error);
    // Return basic structure with default values on error
    return {
      patient: {
        name: "Unknown",
        employee_id: "Unknown",
        gender: "unknown"
      },
      examination_results: {
        date: new Date().toISOString().split('T')[0],
        fitness_status: "Unknown",
        type: {},
        test_results: {}
      },
      certification: {},
      restrictions: {}
    };
  }
}

// Helper function to extract patient information from markdown
function extractPatientInfoFromMarkdown(markdown: string, structuredData: any) {
  // Name extraction
  const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) || 
                   markdown.match(/Initials & Surname[:\s]+(.*?)(?=\n|\r|$|\*\*)/i);
  if (nameMatch && nameMatch[1]) {
    structuredData.patient.name = cleanValue(nameMatch[1].trim());
    console.log('Extracted name:', structuredData.patient.name);
  }
  
  // ID extraction
  const idMatch = markdown.match(/\*\*ID No[.:]\*\*\s*(.*?)(?=\n|\r|$|\*\*)/i) || 
                 markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                 markdown.match(/ID No[.:]\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (idMatch && idMatch[1]) {
    structuredData.patient.employee_id = cleanValue(idMatch[1].trim());
    console.log('Extracted ID:', structuredData.patient.employee_id);
  }
  
  // Company extraction
  const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                      markdown.match(/Company Name:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (companyMatch && companyMatch[1]) {
    structuredData.patient.company = cleanValue(companyMatch[1].trim());
    console.log('Extracted company:', structuredData.patient.company);
  }
  
  // Exam date extraction
  const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                       markdown.match(/Date of Examination:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (examDateMatch && examDateMatch[1]) {
    structuredData.examination_results.date = cleanValue(examDateMatch[1].trim());
    console.log('Extracted exam date:', structuredData.examination_results.date);
  }
  
  // Expiry date extraction
  const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                         markdown.match(/Expiry Date:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (expiryDateMatch && expiryDateMatch[1]) {
    structuredData.certification.valid_until = cleanValue(expiryDateMatch[1].trim());
    console.log('Extracted expiry date:', structuredData.certification.valid_until);
  }
  
  // Job Title extraction - try multiple patterns
  const jobTitlePatterns = [
    /\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Job Title:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Job\s*Title\s*[:\-]\s*(.*?)(?=\n|\r|$|<!--)/i,
    /Job\s*Title\s*[:\-]\s*(.*?)(?=\n|\r|$|<)/i
  ];
  
  for (const pattern of jobTitlePatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      structuredData.patient.occupation = cleanValue(match[1].trim());
      console.log('Extracted job title:', structuredData.patient.occupation);
      break;
    }
  }
  
  // Gender extraction - try multiple patterns
  const genderPatterns = [
    /\*\*Gender\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Gender:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Sex:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /\*\*Sex\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i
  ];
  
  let foundGender = false;
  for (const pattern of genderPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      let gender = cleanValue(match[1].trim().toLowerCase());
      // Normalize gender values
      if (gender === 'm' || gender.includes('male')) {
        gender = 'male';
        foundGender = true;
      } else if (gender === 'f' || gender.includes('female')) {
        gender = 'female';
        foundGender = true;
      } else if (gender && gender !== '') {
        gender = 'other';
        foundGender = true;
      }
      
      if (foundGender) {
        structuredData.patient.gender = gender;
        console.log('Extracted gender from markdown pattern:', structuredData.patient.gender);
        break;
      }
    }
  }
  
  // If we still don't have a gender, try one more approach
  if (!foundGender) {
    const inferredGender = inferGenderFromMarkdown(markdown);
    if (inferredGender) {
      structuredData.patient.gender = inferredGender;
      console.log('Inferred gender from markdown context:', inferredGender);
      foundGender = true;
    }
  }
  
  // Default to 'unknown' if gender still not found
  if (!foundGender || !structuredData.patient.gender) {
    structuredData.patient.gender = 'unknown';
    console.log('Set default gender to "unknown" after extraction attempts failed');
  }
  
  return structuredData;
}

// Helper function to infer gender from markdown if not explicitly stated
function inferGenderFromMarkdown(markdown: string): string | null {
  if (!markdown) return null;
  
  // Look for gender/sex indicators in the text
  if (markdown.match(/\bmale\b/i) && !markdown.match(/\bfemale\b/i)) {
    return 'male';
  } else if (markdown.match(/\bfemale\b/i)) {
    return 'female';
  } else if (markdown.match(/\bsex:\s*m\b/i) || markdown.match(/\bgender:\s*m\b/i)) {
    return 'male';
  } else if (markdown.match(/\bsex:\s*f\b/i) || markdown.match(/\bgender:\s*f\b/i)) {
    return 'female';
  }
  
  // Look for male/female pronouns
  const malePronouns = markdown.match(/\b(he|him|his)\b/gi);
  const femalePronouns = markdown.match(/\b(she|her|hers)\b/gi);
  
  if (malePronouns && malePronouns.length > 3 && (!femalePronouns || malePronouns.length > femalePronouns.length * 2)) {
    return 'male';
  } else if (femalePronouns && femalePronouns.length > 3 && (!malePronouns || femalePronouns.length > malePronouns.length * 2)) {
    return 'female';
  }
  
  return null;
}

// Helper function to extract examination type from markdown
function extractExaminationTypeFromMarkdown(markdown: string) {
  // Use the improved isChecked function for more accurate detection
  const preEmploymentChecked = isChecked(markdown, "Pre-Employment");
  const periodicalChecked = isChecked(markdown, "Periodical");
  const exitChecked = isChecked(markdown, "Exit");
  
  // Log actual found patterns
  if (preEmploymentChecked) console.log("Found checked pattern for Pre-Employment");
  if (periodicalChecked) console.log("Found checked pattern for Periodical");
  if (exitChecked) console.log("Found checked pattern for Exit");
  
  console.log('Examination types found:', {
    preEmploymentChecked,
    periodicalChecked,
    exitChecked
  });
  
  return {
    pre_employment: preEmploymentChecked,
    periodical: periodicalChecked,
    exit: exitChecked
  };
}

// Helper function to extract test results from markdown
function extractTestResultsFromMarkdown(markdown: string) {
  const testResults: any = {};
  
  // Define common tests to look for
  const tests = [
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
  
  // Process each test individually using the improved isChecked function
  for (const test of tests) {
    // Default values
    testResults[`${test.key}_done`] = false;
    testResults[`${test.key}_results`] = 'N/A';
    
    // Check if the test is marked as done using our improved function
    testResults[`${test.key}_done`] = isChecked(markdown, test.name);
    
    // Extract results - try various patterns
    const resultsPatterns = [
      // Pipe table format
      new RegExp(`\\|\\s*${test.name}\\s*\\|[^|]*?\\[[xX\\s]\\][^|]*?\\|\\s*([^|]*?)\\s*\\|`, 'i'),
      // HTML table format
      new RegExp(`<td>[^<]*${test.name}[^<]*</td>[^<]*<td>\\[[xX\\s]\\]</td>[^<]*<td>([^<]*)</td>`, 'i'),
      // List format with result after checkbox
      new RegExp(`${test.name}.*?\\[[xX\\s]\\].*?([\\d\\.]+\\s*\\/\\s*[\\d\\.]+|Normal|N\\/A|[\\d\\.]+\\s*-\\s*[\\d\\.]+)`, 'i')
    ];
    
    for (const pattern of resultsPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        testResults[`${test.key}_results`] = cleanValue(match[1].trim());
        break;
      }
    }
  }
  
  console.log('Extracted test results:', testResults);
  return testResults;
}

// Helper function to extract fitness status from markdown
function extractFitnessStatusFromMarkdown(markdown: string, certification: any) {
  // Use the improved isChecked function for more accurate detection
  certification.fit = isChecked(markdown, "FIT");
  certification.fit_with_restrictions = isChecked(markdown, "Fit with Restriction");
  certification.fit_with_condition = isChecked(markdown, "Fit with Condition");
  certification.temporarily_unfit = isChecked(markdown, "Temporary Unfit") || isChecked(markdown, "Temporarily Unfit");
  certification.unfit = isChecked(markdown, "UNFIT");
  
  // Extract comments if available
  const commentsMatch = markdown.match(/\*\*Comments\*\*:\s*(.*?)(?=\n\n|\n###|\n##|\n#|$|---)/i) ||
                      markdown.match(/Comments:\s*(.*?)(?=\n\n|\n###|\n##|\n#|$|---)/i);
  if (commentsMatch && commentsMatch[1] && commentsMatch[1].trim() !== '') {
    certification.comments = cleanValue(commentsMatch[1].trim());
  }
  
  // Extract follow-up information
  const followUpMatch = markdown.match(/Referred or follow up actions:\s*(.*?)(?=\n|\r|$|Review Date|<)/i);
  if (followUpMatch && followUpMatch[1]) {
    certification.follow_up = cleanValue(followUpMatch[1].trim());
  }
  
  // Extract review date
  const reviewDateMatch = markdown.match(/Review Date:\s*(.*?)(?=\n|\r|$|<)/i);
  if (reviewDateMatch && reviewDateMatch[1]) {
    certification.review_date = cleanValue(reviewDateMatch[1].trim());
  }
  
  console.log('Extracted fitness status:', certification);
  return certification;
}

// Helper function to extract restrictions from markdown
function extractRestrictionsFromMarkdown(markdown: string) {
  const restrictions: any = {
    heights: false,
    dust_exposure: false,
    motorized_equipment: false,
    wear_hearing_protection: false,
    confined_spaces: false,
    chemical_exposure: false,
    wear_spectacles: false,
    remain_on_treatment_for_chronic_conditions: false
  };
  
  // Use the improved isChecked function for more accurate detection
  restrictions.heights = isChecked(markdown, "Heights");
  restrictions.dust_exposure = isChecked(markdown, "Dust Exposure");
  restrictions.motorized_equipment = isChecked(markdown, "Motorized Equipment");
  restrictions.wear_hearing_protection = isChecked(markdown, "Wear Hearing Protection");
  restrictions.confined_spaces = isChecked(markdown, "Confined Spaces");
  restrictions.chemical_exposure = isChecked(markdown, "Chemical Exposure");
  restrictions.wear_spectacles = isChecked(markdown, "Wear Spectacles");
  restrictions.remain_on_treatment_for_chronic_conditions = isChecked(markdown, "Remain on Treatment for Chronic Conditions") || 
                                                           isChecked(markdown, "Remain on Treatment");
  
  console.log('Extracted restrictions:', restrictions);
  return restrictions;
}
