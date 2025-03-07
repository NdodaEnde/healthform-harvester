
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
        gender: cleanValue(extractPath(extractedData, 'patient.gender')) || ''
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
      restrictions: {
        heights: false,
        dust_exposure: false,
        motorized_equipment: false,
        wear_hearing_protection: false,
        confined_spaces: false,
        chemical_exposure: false,
        wear_spectacles: false,
        remain_on_treatment_for_chronic_conditions: false
      },
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
    
    // Log the final structured data for debugging
    console.log('Final processed certificate data:', JSON.stringify(structuredData));
    
    return structuredData;
    
  } catch (error) {
    console.error('Error processing certificate of fitness data:', error);
    // Return basic structure with default values on error
    return {
      patient: {
        name: "Unknown",
        employee_id: "Unknown"
      },
      examination_results: {
        date: new Date().toISOString().split('T')[0],
        fitness_status: "Unknown",
        type: {},
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
        valid_until: ''
      },
      restrictions: {
        heights: false,
        dust_exposure: false,
        motorized_equipment: false,
        wear_hearing_protection: false,
        confined_spaces: false,
        chemical_exposure: false,
        wear_spectacles: false,
        remain_on_treatment_for_chronic_conditions: false
      }
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
    /Job Title:\s*(.*?)(?=\n|\r|$|<!--)/i,
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
  
  return structuredData;
}

// Helper function to extract examination type from markdown
function extractExaminationTypeFromMarkdown(markdown: string) {
  const preEmploymentChecked = isChecked(markdown, "Pre-Employment") || 
                              isChecked(markdown, "PRE-EMPLOYMENT");
  
  const periodicalChecked = isChecked(markdown, "Periodical") || 
                           isChecked(markdown, "PERIODICAL");
  
  const exitChecked = isChecked(markdown, "Exit") || 
                     isChecked(markdown, "EXIT");
  
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
    { name: 'Bloods', key: 'bloods' },
    { name: 'Far, Near Vision', key: 'far_near_vision' },
    { name: 'Side & Depth', key: 'side_depth' },
    { name: 'Night Vision', key: 'night_vision' },
    { name: 'Hearing', key: 'hearing' },
    { name: 'Working at Heights', key: 'heights' },
    { name: 'Lung Function', key: 'lung_function' },
    { name: 'X-Ray', key: 'x_ray' },
    { name: 'Drug Screen', key: 'drug_screen' }
  ];
  
  // Process each test individually with improved extraction
  for (const test of tests) {
    const testData = extractTestData(markdown, test.name);
    
    testResults[`${test.key}_done`] = testData.isDone;
    
    if (testData.result) {
      testResults[`${test.key}_results`] = testData.result;
    }
  }
  
  console.log('Extracted test results:', testResults);
  return testResults;
}

// Helper function to extract data for a specific test
function extractTestData(markdown: string, testName: string) {
  // Normalize test name for case-insensitive matching
  const normalizedTestName = testName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const testVariants = [
    testName,
    testName.toUpperCase(),
    testName.toLowerCase(),
    normalizedTestName
  ];
  
  // First, try to find test data in tables
  const tableSections = markdown.match(/<table>[\s\S]*?<\/table>/g) || [];
  
  for (const tableSection of tableSections) {
    for (const variant of testVariants) {
      // Try to match rows containing test name, checkbox, and result
      const rowPatterns = [
        new RegExp(`<tr>\\s*<td>${variant}\\s*</td>\\s*<td>\\[(x|X|)\\]</td>\\s*<td>([^<]*)</td>`, 'i'),
        new RegExp(`<tr>\\s*<td>([^<]*${variant}[^<]*)</td>\\s*<td>\\[(x|X|)\\]</td>\\s*<td>([^<]*)</td>`, 'i'),
        new RegExp(`<tr>[^<]*<td>[^<]*${variant}[^<]*</td>[^<]*<td>\\[(x|X|)\\]</td>[^<]*<td>([^<]*)</td>`, 'i')
      ];
      
      for (const pattern of rowPatterns) {
        const match = tableSection.match(pattern);
        if (match) {
          const isDone = match[1] === 'x' || match[1] === 'X';
          let result = match[2] ? match[2].trim() : '';
          if (result === 'N/A') result = null;
          
          console.log(`Found test ${testName} in table: done=${isDone}, result=${result}`);
          return { isDone, result };
        }
      }
    }
  }
  
  // Try to extract from markdown list format
  for (const variant of testVariants) {
    const listPatterns = [
      new RegExp(`\\|\\s*${variant}\\s*\\|\\s*\\[(x|X|)\\]\\s*\\|\\s*([^\\|]*)\\|`, 'i'),
      new RegExp(`\\- \\*\\*${variant}\\*\\*:\\s*\\[(x|X|)\\]\\s*([^\\n]*)`, 'i'),
      new RegExp(`${variant}[^\\n]*:\\s*\\[(x|X|)\\]\\s*([^\\n]*)`, 'i')
    ];
    
    for (const pattern of listPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        const isDone = match[1] === 'x' || match[1] === 'X';
        let result = match[2] ? match[2].trim() : '';
        if (result === 'N/A') result = null;
        
        console.log(`Found test ${testName} in list format: done=${isDone}, result=${result}`);
        return { isDone, result };
      }
    }
  }
  
  // Check for general checkbox patterns
  const isTestDone = isChecked(markdown, testName);
  
  // Try to extract results if the test is mentioned
  let testResult = null;
  const resultPattern = new RegExp(`${testName}[^\\n]*:?\\s*([^\\n,]*?)(?:\\n|,|$)`, 'i');
  const resultMatch = markdown.match(resultPattern);
  if (resultMatch && resultMatch[1] && resultMatch[1].trim() !== 'N/A') {
    testResult = resultMatch[1].trim();
  }
  
  return { 
    isDone: isTestDone, 
    result: testResult 
  };
}

// Helper function to extract fitness status from markdown
function extractFitnessStatusFromMarkdown(markdown: string, certification: any) {
  // Directly check for checked fitness statuses
  certification.fit = isChecked(markdown, "FIT");
  certification.fit_with_restrictions = isChecked(markdown, "Fit with Restriction");
  certification.fit_with_condition = isChecked(markdown, "Fit with Condition");
  certification.temporarily_unfit = isChecked(markdown, "Temporary Unfit") || 
                                   isChecked(markdown, "Temporarily Unfit");
  certification.unfit = isChecked(markdown, "UNFIT");
  
  // Special case: Check if FIT is crossed out
  const fitCrossedOut = markdown.includes('crossing it out') || 
                       markdown.includes('crossed out') || 
                       markdown.includes('large "X"') ||
                       markdown.includes('crossing out of the word "FIT"');
                       
  if (fitCrossedOut) {
    certification.fit = false;
    certification.unfit = true;
  }
  
  // Extract follow-up actions if available
  const followUpMatch = markdown.match(/Referred or follow up actions:?\s*(.*?)(?=\n\n|\r\n\r\n|$|Review Date)/is);
  if (followUpMatch && followUpMatch[1] && followUpMatch[1].trim() !== '') {
    certification.follow_up = cleanValue(followUpMatch[1].trim());
  }
  
  // Extract review date if available
  const reviewDateMatch = markdown.match(/Review Date:?\s*(.*?)(?=\n|\r|$|<)/i);
  if (reviewDateMatch && reviewDateMatch[1] && reviewDateMatch[1].trim() !== '') {
    certification.review_date = cleanValue(reviewDateMatch[1].trim());
  }
  
  // Extract comments if available
  const commentsMatch = markdown.match(/Comments:?\s*(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
  if (commentsMatch && commentsMatch[1]) {
    let comments = commentsMatch[1].trim();
    if (comments !== 'N/A' && comments !== '') {
      certification.comments = cleanValue(comments);
    }
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
  
  // Check for checked restrictions directly
  restrictions.heights = isChecked(markdown, "Heights");
  restrictions.dust_exposure = isChecked(markdown, "Dust Exposure");
  restrictions.motorized_equipment = isChecked(markdown, "Motorized Equipment");
  restrictions.wear_hearing_protection = isChecked(markdown, "Wear Hearing Protection");
  restrictions.confined_spaces = isChecked(markdown, "Confined Spaces");
  restrictions.chemical_exposure = isChecked(markdown, "Chemical Exposure");
  restrictions.wear_spectacles = isChecked(markdown, "Wear Spectacles");
  restrictions.remain_on_treatment_for_chronic_conditions = isChecked(markdown, "Remain on Treatment") || 
                                                          isChecked(markdown, "Remain on Treatment for Chronic Conditions");
  
  console.log('Extracted restrictions:', restrictions);
  return restrictions;
}
