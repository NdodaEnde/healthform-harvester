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
  // Updated to correctly check for [x] vs [ ] in the markdown
  const preEmploymentChecked = markdown.includes("Pre-Employment") && 
                              (markdown.includes("Pre-Employment") && markdown.includes("[x]") || 
                               markdown.includes("PRE-EMPLOYMENT") && markdown.includes("[x]"));
  
  const periodicalChecked = markdown.includes("Periodical") && 
                           (markdown.includes("Periodical") && markdown.includes("[x]") || 
                            markdown.includes("PERIODICAL") && markdown.includes("[x]"));
  
  const exitChecked = markdown.includes("Exit") && 
                     (markdown.includes("Exit") && markdown.includes("[x]") || 
                      markdown.includes("EXIT") && markdown.includes("[x]"));
  
  // More specific check using the patterns in the actual document
  const preEmploymentPattern = /- \*\*Pre-Employment\*\*: \[x\]/i;
  const periodicalPattern = /- \*\*Periodical\*\*: \[ \]/i;
  const exitPattern = /- \*\*Exit\*\*: \[ \]/i;
  
  // Check using the more specific patterns as well
  const preEmploymentExact = preEmploymentPattern.test(markdown);
  const periodicalExact = !periodicalPattern.test(markdown) && markdown.includes("Periodical") && markdown.includes("[x]");
  const exitExact = !exitPattern.test(markdown) && markdown.includes("Exit") && markdown.includes("[x]");
  
  // Log actual found patterns
  if (preEmploymentExact) console.log("Found checked pattern for Pre-Employment");
  if (periodicalExact) console.log("Found checked pattern for Periodical");
  if (exitExact) console.log("Found checked pattern for Exit");
  
  console.log('Examination types found:', {
    preEmploymentChecked: preEmploymentExact,
    periodicalChecked: periodicalExact,
    exitChecked: exitExact
  });
  
  return {
    pre_employment: preEmploymentExact,
    periodical: periodicalExact,
    exit: exitExact
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
  
  // Extract table structure for test results
  const tableMatch = markdown.match(/\|\s*Test\s*\|\s*Done\s*\|\s*Results\s*\|[\s\S]*?\n([\s\S]*?)(?=\n\n|\n###|\n##|\n#|$)/i);
  
  if (tableMatch && tableMatch[1]) {
    const tableRows = tableMatch[1].split('\n').filter(row => row.trim() !== '');
    
    // Process each test individually
    for (const test of tests) {
      // Default values
      testResults[`${test.key}_done`] = false;
      testResults[`${test.key}_results`] = 'N/A';
      
      // Look for the test in table rows
      for (const row of tableRows) {
        if (row.toLowerCase().includes(test.name.toLowerCase())) {
          // Check if done
          testResults[`${test.key}_done`] = row.includes('[x]');
          
          // Extract results
          const resultsMatch = row.match(/\|\s*\[\s*[xX]?\s*\]\s*\|\s*(.*?)\s*\|/);
          if (resultsMatch && resultsMatch[1]) {
            testResults[`${test.key}_results`] = cleanValue(resultsMatch[1].trim());
          }
          
          break;
        }
      }
    }
  } else {
    // Alternative HTML table extraction
    const htmlTableMatch = markdown.match(/<table>[\s\S]*?<\/table>/);
    if (htmlTableMatch) {
      const tableHTML = htmlTableMatch[0];
      
      // Process each test individually with HTML parsing
      for (const test of tests) {
        // Default values
        testResults[`${test.key}_done`] = false;
        testResults[`${test.key}_results`] = 'N/A';
        
        // Check for test in HTML table
        const testRowRegex = new RegExp(`<tr>[\\s\\S]*?<td>[\\s\\S]*?${test.name}[\\s\\S]*?</td>[\\s\\S]*?<td>\\[(x|X| )\\]</td>[\\s\\S]*?<td>([\\s\\S]*?)</td>[\\s\\S]*?</tr>`, 'i');
        const testRowMatch = tableHTML.match(testRowRegex);
        
        if (testRowMatch) {
          // Check if checkbox is marked
          testResults[`${test.key}_done`] = testRowMatch[1] === 'x' || testRowMatch[1] === 'X';
          
          // Extract results
          if (testRowMatch[2]) {
            testResults[`${test.key}_results`] = cleanValue(testRowMatch[2].trim());
          }
        }
      }
    }
  }
  
  console.log('Extracted test results:', testResults);
  return testResults;
}

// Helper function to extract fitness status from markdown
function extractFitnessStatusFromMarkdown(markdown: string, certification: any) {
  // Look for the Medical Fitness Declaration section
  const fitnessSectionMatch = markdown.match(/### Medical Fitness(?:\s*Declaration|Evaluation)\s*([\s\S]*?)(?=\n\n|\n###|\n##|\n#|$)/i);
  
  if (fitnessSectionMatch && fitnessSectionMatch[1]) {
    const fitnessSection = fitnessSectionMatch[1];
    
    // Check for fit status in the markdown using better pattern matching
    certification.fit = fitnessSection.includes('FIT') && 
                     (fitnessSection.includes('FIT') && fitnessSection.includes('[x]') && 
                      !fitnessSection.includes('with Restriction') && !fitnessSection.includes('with Condition') && 
                      !fitnessSection.includes('Temporary Unfit') && !fitnessSection.includes('UNFIT'));
    
    certification.fit_with_restrictions = fitnessSection.includes('Fit with Restriction') && 
                                      fitnessSection.includes('Fit with Restriction') && fitnessSection.includes('[x]');
    
    certification.fit_with_condition = fitnessSection.includes('Fit with Condition') && 
                                    fitnessSection.includes('Fit with Condition') && fitnessSection.includes('[x]');
    
    certification.temporarily_unfit = (fitnessSection.includes('Temporary Unfit') || fitnessSection.includes('Temporarily Unfit')) && 
                                   ((fitnessSection.includes('Temporary Unfit') || fitnessSection.includes('Temporarily Unfit')) && 
                                    fitnessSection.includes('[x]'));
    
    certification.unfit = fitnessSection.includes('UNFIT') && fitnessSection.includes('UNFIT') && fitnessSection.includes('[x]');
    
    // Check HTML table format if available
    if (markdown.includes('<table>') && markdown.includes('FIT')) {
      const fitTableMatch = markdown.match(/<table>[\s\S]*?<tr>[\s\S]*?<th>FIT<\/th>[\s\S]*?<\/tr>[\s\S]*?<tr>([\s\S]*?)<\/tr>/i);
      
      if (fitTableMatch && fitTableMatch[1]) {
        const cells = fitTableMatch[1].match(/<td>\[(x|X| )\]<\/td>/g) || [];
        
        if (cells.length >= 5) {
          certification.fit = cells[0].includes('[x]') || cells[0].includes('[X]');
          certification.fit_with_restrictions = cells[1].includes('[x]') || cells[1].includes('[X]');
          certification.fit_with_condition = cells[2].includes('[x]') || cells[2].includes('[X]');
          certification.temporarily_unfit = cells[3].includes('[x]') || cells[3].includes('[X]');
          certification.unfit = cells[4].includes('[x]') || cells[4].includes('[X]');
        }
      }
    }
    
    // Extract comments if available
    const commentsMatch = markdown.match(/\*\*Comments\*\*:\s*(.*?)(?=\n\n|\n###|\n##|\n#|$|---)/i);
    if (commentsMatch && commentsMatch[1] && commentsMatch[1].trim() !== '') {
      certification.comments = cleanValue(commentsMatch[1].trim());
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
  
  // Look for the Restrictions section
  const restrictionsSectionMatch = markdown.match(/### Restrictions\s*([\s\S]*?)(?=\n\n|\n###|\n##|\n#|$)/i);
  
  if (restrictionsSectionMatch && restrictionsSectionMatch[1]) {
    const restrictionsSection = restrictionsSectionMatch[1];
    
    // Check for each restriction
    restrictions.heights = restrictionsSection.includes('Heights') && restrictionsSection.includes('[x]');
    restrictions.dust_exposure = restrictionsSection.includes('Dust Exposure') && restrictionsSection.includes('[x]');
    restrictions.motorized_equipment = restrictionsSection.includes('Motorized Equipment') && restrictionsSection.includes('[x]');
    restrictions.wear_hearing_protection = restrictionsSection.includes('Wear Hearing Protection') && restrictionsSection.includes('[x]');
    restrictions.confined_spaces = restrictionsSection.includes('Confined Spaces') && restrictionsSection.includes('[x]');
    restrictions.chemical_exposure = restrictionsSection.includes('Chemical Exposure') && restrictionsSection.includes('[x]');
    restrictions.wear_spectacles = restrictionsSection.includes('Wear Spectacles') && restrictionsSection.includes('[x]');
    restrictions.remain_on_treatment_for_chronic_conditions = 
      (restrictionsSection.includes('Remain on Treatment') || restrictionsSection.includes('Remain on Treatment for Chronic Conditions')) && 
      restrictionsSection.includes('[x]');
  }
  
  console.log('Extracted restrictions:', restrictions);
  return restrictions;
}
