
import { extractPath, cleanValue, isChecked } from "../utils.ts";

// Process certificate of fitness data from Landing AI response
export function processCertificateOfFitnessData(apiResponse: any) {
  try {
    console.log("Starting certificate data extraction process");
    
    // Check if the response includes directExtraction data from our API client
    if (apiResponse.directExtraction) {
      console.log("Found directExtraction data from API client");
      const directData = apiResponse.directExtraction;
      
      // Build structured data from directExtraction
      return {
        patient: {
          name: directData.patient?.name || 'Unknown',
          date_of_birth: '',
          employee_id: directData.patient?.id_number || '',
          company: directData.patient?.company || '',
          occupation: directData.patient?.occupation || '',
          gender: 'unknown'
        },
        examination_results: {
          date: directData.certification?.examination_date || new Date().toISOString().split('T')[0],
          physician: '',
          fitness_status: directData.certification?.fit ? 'Fit' : 
                         directData.certification?.unfit ? 'Unfit' : 
                         directData.certification?.temporarily_unfit ? 'Temporarily Unfit' : 
                         directData.certification?.fit_with_restrictions ? 'Fit with Restrictions' : 
                         directData.certification?.fit_with_condition ? 'Fit with Condition' : 'Unknown',
          restrictions: 'None',
          next_examination_date: directData.certification?.valid_until || '',
          type: {
            pre_employment: directData.examination?.type?.pre_employment || false,
            periodical: directData.examination?.type?.periodical || false,
            exit: directData.examination?.type?.exit || false
          },
          test_results: directData.examination?.tests || {}
        },
        certification: {
          fit: directData.certification?.fit || false,
          fit_with_restrictions: directData.certification?.fit_with_restrictions || false,
          fit_with_condition: directData.certification?.fit_with_condition || false,
          temporarily_unfit: directData.certification?.temporarily_unfit || false,
          unfit: directData.certification?.unfit || false,
          follow_up: directData.certification?.follow_up || '',
          review_date: directData.certification?.review_date || '',
          comments: directData.certification?.comments || '',
          examination_date: directData.certification?.examination_date || '',
          valid_until: directData.certification?.valid_until || ''
        },
        restrictions: directData.restrictions || {},
        raw_content: null
      };
    }
    
    // Extract potential fields from AI response
    const extractedData = apiResponse.result || {};
    
    // Try to get markdown from different possible locations
    let markdown = '';
    if (apiResponse.data?.markdown) {
      markdown = apiResponse.data.markdown;
      console.log("Found markdown in apiResponse.data.markdown");
    } else if (apiResponse.raw_response?.data?.markdown) {
      markdown = apiResponse.raw_response.data.markdown;
      console.log("Found markdown in apiResponse.raw_response.data.markdown");
    } else if (apiResponse.structured_data?.full_text) {
      // Use full_text from SDK if markdown not available
      markdown = apiResponse.structured_data.full_text;
      console.log("Using full_text from SDK for markdown");
    } else if (apiResponse.raw_response?.document_analysis?.text) {
      // Use document analysis text if available
      markdown = apiResponse.raw_response.document_analysis.text;
      console.log("Using document_analysis.text for markdown");
    } else if (apiResponse.document_analysis?.text) {
      // Direct access to document analysis
      markdown = apiResponse.document_analysis.text;
      console.log("Using direct document_analysis.text for markdown");
    }
    
    // Check the markdown content
    if (markdown) {
      console.log('Processing certificate of fitness data, text length:', markdown.length);
      console.log('Text sample:', markdown.substring(0, 200));
    } else {
      console.log('No markdown text found in API response!');
      
      // Try to find any text content in the response
      if (typeof apiResponse === 'object') {
        const findTextRecursive = (obj: any, path = ''): string | null => {
          if (!obj) return null;
          
          if (typeof obj === 'string' && obj.length > 100) {
            console.log(`Found potential text content at ${path}, length: ${obj.length}`);
            return obj;
          }
          
          if (typeof obj === 'object') {
            for (const key in obj) {
              const result = findTextRecursive(obj[key], `${path}.${key}`);
              if (result) return result;
            }
          }
          
          return null;
        };
        
        const foundText = findTextRecursive(apiResponse);
        if (foundText) {
          console.log('Using discovered text content as markdown');
          markdown = foundText;
        }
      }
    }
    
    // Check if form fields are available from SDK extraction
    const formFields = apiResponse.structured_data?.form_fields || {};
    
    // Extract patient name from form fields or direct paths
    let patientName = formFields['Initials & Surname'] || 
                      cleanValue(extractPath(extractedData, 'patient.name')) || 
                      cleanValue(extractPath(extractedData, 'employee.name'));
    
    // Extract ID from form fields or direct paths  
    let patientId = formFields['ID No'] || formFields['ID NO'] ||
                    cleanValue(extractPath(extractedData, 'patient.id')) || 
                    cleanValue(extractPath(extractedData, 'patient.id_number')) || 
                    cleanValue(extractPath(extractedData, 'employee.id'));
                    
    // Extract company from form fields or direct paths
    let company = formFields['Company Name'] ||
                  cleanValue(extractPath(extractedData, 'company')) || 
                  cleanValue(extractPath(extractedData, 'employer')) || 
                  cleanValue(extractPath(extractedData, 'patient.company'));
                  
    // Extract job title from form fields or direct paths
    let occupation = formFields['Job Title'] ||
                     cleanValue(extractPath(extractedData, 'patient.occupation')) || 
                     cleanValue(extractPath(extractedData, 'patient.job_title')) || 
                     cleanValue(extractPath(extractedData, 'occupation')) || 
                     cleanValue(extractPath(extractedData, 'job_title'));
                     
    // Extract dates from form fields or direct paths
    let examDate = formFields['Date of Examination'] ||
                  cleanValue(extractPath(extractedData, 'examination.date')) || 
                  cleanValue(extractPath(extractedData, 'date')) || 
                  cleanValue(extractPath(extractedData, 'date_of_examination'));
                  
    let expiryDate = formFields['Expiry Date'] ||
                    cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                    cleanValue(extractPath(extractedData, 'valid_until')) || 
                    cleanValue(extractPath(extractedData, 'expiry_date'));
    
    // Fall back to extracting from markdown if needed
    if (!patientName || !patientId || !company || !occupation || !examDate || !expiryDate) {
      if (markdown) {
        console.log('Using markdown to extract missing fields');
        
        // Try extracting from markdown
        if (!patientName) {
          const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
          if (nameMatch && nameMatch[1]) {
            patientName = nameMatch[1].trim();
            console.log(`Extracted patient name from markdown: ${patientName}`);
          }
        }
        
        if (!patientId) {
          const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i);
          if (idMatch && idMatch[1]) {
            patientId = idMatch[1].trim();
            console.log(`Extracted ID number from markdown: ${patientId}`);
          }
        }
        
        if (!company) {
          const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
          if (companyMatch && companyMatch[1]) {
            company = companyMatch[1].trim();
            console.log(`Extracted company from markdown: ${company}`);
          }
        }
        
        if (!occupation) {
          const jobMatch = markdown.match(/Job Title:\s*(.*?)(?=\n|\r|$)/i);
          if (jobMatch && jobMatch[1]) {
            occupation = jobMatch[1].trim();
            console.log(`Extracted job title from markdown: ${occupation}`);
          }
        }
        
        if (!examDate) {
          const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i);
          if (examDateMatch && examDateMatch[1]) {
            examDate = examDateMatch[1].trim();
            console.log(`Extracted exam date from markdown: ${examDate}`);
          }
        }
        
        if (!expiryDate) {
          const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i);
          if (expiryDateMatch && expiryDateMatch[1]) {
            expiryDate = expiryDateMatch[1].trim();
            console.log(`Extracted expiry date from markdown: ${expiryDate}`);
          }
        }
      }
    }
      
    // Build structured data object from API response and extracted fields
    let structuredData = {
      patient: {
        name: patientName || 'Unknown',
        date_of_birth: cleanValue(extractPath(extractedData, 'patient.date_of_birth')) || 
                      cleanValue(extractPath(extractedData, 'patient.dob')) || '',
        employee_id: patientId || '',
        company: company || '',
        occupation: occupation || '',
        gender: cleanValue(extractPath(extractedData, 'patient.gender')) || 
               cleanValue(extractPath(extractedData, 'gender')) || 
               inferGenderFromMarkdown(markdown) || 'unknown'
      },
      examination_results: {
        date: examDate || 
              cleanValue(extractPath(extractedData, 'examination.date')) || 
              cleanValue(extractPath(extractedData, 'date')) || 
              cleanValue(extractPath(extractedData, 'date_of_examination')) || 
              new Date().toISOString().split('T')[0],
        physician: formFields['Physician'] ||
                  cleanValue(extractPath(extractedData, 'examination.physician')) || 
                  cleanValue(extractPath(extractedData, 'physician')) || '',
        fitness_status: cleanValue(extractPath(extractedData, 'examination.fitness_status')) || 
                       cleanValue(extractPath(extractedData, 'fitness_status')) || 'Unknown',
        restrictions: cleanValue(extractPath(extractedData, 'examination.restrictions')) || 
                     cleanValue(extractPath(extractedData, 'restrictions')) || 'None',
        next_examination_date: expiryDate ||
                             cleanValue(extractPath(extractedData, 'examination.next_date')) || 
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
        follow_up: formFields['Referred or follow up actions'] || '',
        review_date: formFields['Review Date'] || '',
        comments: formFields['Comments'] || '',
        examination_date: examDate || 
                        cleanValue(extractPath(extractedData, 'examination.date')) || 
                        cleanValue(extractPath(extractedData, 'date_of_examination')) || '',
        valid_until: expiryDate ||
                    cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                    cleanValue(extractPath(extractedData, 'valid_until')) || 
                    cleanValue(extractPath(extractedData, 'expiry_date')) || ''
      },
      restrictions: {},
      raw_content: markdown || null
    };
    
    // Process checkboxes if available from SDK
    const checkboxes = apiResponse.structured_data?.checkboxes || [];
    if (checkboxes.length > 0) {
      console.log('Processing checkboxes from SDK, count:', checkboxes.length);
      
      // Process examination type checkboxes
      structuredData.examination_results.type.pre_employment = checkboxes.some(cb => 
        cb.text && cb.text.toLowerCase().includes('pre-employment') && cb.checked);
        
      structuredData.examination_results.type.periodical = checkboxes.some(cb => 
        cb.text && cb.text.toLowerCase().includes('periodical') && cb.checked);
        
      structuredData.examination_results.type.exit = checkboxes.some(cb => 
        cb.text && cb.text.toLowerCase().includes('exit') && cb.checked);
      
      // Process fitness assessment checkboxes
      structuredData.certification.fit = checkboxes.some(cb => 
        cb.text && cb.text.toLowerCase() === 'fit' && cb.checked);
        
      structuredData.certification.fit_with_restrictions = checkboxes.some(cb => 
        cb.text && cb.text.toLowerCase().includes('fit with restriction') && cb.checked);
        
      structuredData.certification.fit_with_condition = checkboxes.some(cb => 
        cb.text && cb.text.toLowerCase().includes('fit with condition') && cb.checked);
        
      structuredData.certification.temporarily_unfit = checkboxes.some(cb => 
        cb.text && (cb.text.toLowerCase().includes('temporary unfit') || 
                   cb.text.toLowerCase().includes('temporarily unfit')) && cb.checked);
        
      structuredData.certification.unfit = checkboxes.some(cb => 
        cb.text && cb.text.toLowerCase() === 'unfit' && cb.checked);
      
      // Process restrictions checkboxes
      const restrictionTypes = [
        {key: 'heights', text: 'heights'},
        {key: 'dust_exposure', text: 'dust exposure'},
        {key: 'motorized_equipment', text: 'motorized equipment'},
        {key: 'wear_hearing_protection', text: 'hearing protection'},
        {key: 'confined_spaces', text: 'confined spaces'},
        {key: 'chemical_exposure', text: 'chemical exposure'},
        {key: 'wear_spectacles', text: 'spectacles'},
        {key: 'remain_on_treatment_for_chronic_conditions', text: 'remain on treatment'}
      ];
      
      for (const restriction of restrictionTypes) {
        structuredData.restrictions[restriction.key] = checkboxes.some(cb => 
          cb.text && cb.text.toLowerCase().includes(restriction.text) && cb.checked);
      }
    }
    
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
    
    // Try to extract data from HTML tables if available in the markdown
    if (markdown && markdown.includes('<table>')) {
      console.log('Processing HTML tables from markdown');
      
      // Extract examination type from HTML table
      if (markdown.match(/<th>PRE-EMPLOYMENT<\/th>/i)) {
        const preEmploymentMatch = markdown.match(/PRE-EMPLOYMENT[^]*?<td>\[(x| )\]<\/td>/i);
        if (preEmploymentMatch && preEmploymentMatch[0].includes('[x]')) {
          structuredData.examination_results.type.pre_employment = true;
          console.log('Extracted PRE-EMPLOYMENT from HTML table: checked');
        }
        
        const periodicalMatch = markdown.match(/PERIODICAL[^]*?<td>\[(x| )\]<\/td>/i);
        if (periodicalMatch && periodicalMatch[0].includes('[x]')) {
          structuredData.examination_results.type.periodical = true;
          console.log('Extracted PERIODICAL from HTML table: checked');
        }
        
        const exitMatch = markdown.match(/EXIT[^]*?<td>\[(x| )\]<\/td>/i);
        if (exitMatch && exitMatch[0].includes('[x]')) {
          structuredData.examination_results.type.exit = true;
          console.log('Extracted EXIT from HTML table: checked');
        }
      }
      
      // Extract medical tests from HTML tables
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
      
      for (const test of testMap) {
        // Pattern for checking and test results in HTML tables
        const testRegex = new RegExp(`<td>${test.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>([^<]*)</td>`, 'i');
        const match = markdown.match(testRegex);
        
        if (match) {
          structuredData.examination_results.test_results[`${test.key}_done`] = match[1].trim() === 'x';
          structuredData.examination_results.test_results[`${test.key}_results`] = cleanValue(match[2].trim());
          
          console.log(`Extracted test ${test.key} from HTML table: done=${match[1].trim() === 'x'}, results=${match[2].trim()}`);
        }
      }
      
      // Extract fitness status from HTML table
      const fitRegex = /<th>FIT<\/th>[^]*?<td>\[(x| )\]<\/td>/i;
      const fitWithRestrictionRegex = /<th>Fit with Restriction<\/th>[^]*?<td>\[(x| )\]<\/td>/i;
      const fitWithConditionRegex = /<th>Fit with Condition<\/th>[^]*?<td>\[(x| )\]<\/td>/i;
      const temporarilyUnfitRegex = /<th>Temporary Unfit<\/th>[^]*?<td>\[(x| )\]<\/td>/i;
      const unfitRegex = /<th>UNFIT<\/th>[^]*?<td>\[(x| )\]<\/td>/i;
      
      if (markdown.match(fitRegex) && markdown.match(fitRegex)[0].includes('[x]')) {
        structuredData.certification.fit = true;
        console.log('Extracted FIT status from HTML table: checked');
      }
      
      if (markdown.match(fitWithRestrictionRegex) && markdown.match(fitWithRestrictionRegex)[0].includes('[x]')) {
        structuredData.certification.fit_with_restrictions = true;
        console.log('Extracted Fit with Restriction status from HTML table: checked');
      }
      
      if (markdown.match(fitWithConditionRegex) && markdown.match(fitWithConditionRegex)[0].includes('[x]')) {
        structuredData.certification.fit_with_condition = true;
        console.log('Extracted Fit with Condition status from HTML table: checked');
      }
      
      if (markdown.match(temporarilyUnfitRegex) && markdown.match(temporarilyUnfitRegex)[0].includes('[x]')) {
        structuredData.certification.temporarily_unfit = true;
        console.log('Extracted Temporarily Unfit status from HTML table: checked');
      }
      
      if (markdown.match(unfitRegex) && markdown.match(unfitRegex)[0].includes('[x]')) {
        structuredData.certification.unfit = true;
        console.log('Extracted UNFIT status from HTML table: checked');
      }
    }
    
    // If we have valid_until but no examination_date, calculate it based on valid_until (typically one year before)
    if (structuredData.certification.valid_until && !structuredData.certification.examination_date && !structuredData.examination_results.date) {
      try {
        const expiryDate = new Date(structuredData.certification.valid_until);
        if (!isNaN(expiryDate.getTime())) {
          const examDate = new Date(expiryDate);
          examDate.setFullYear(examDate.getFullYear() - 1);
          const formattedExamDate = examDate.toISOString().split('T')[0];
          
          structuredData.certification.examination_date = formattedExamDate;
          structuredData.examination_results.date = formattedExamDate;
          
          console.log('Calculated examination date from expiry date:', formattedExamDate);
        }
      } catch (e) {
        console.error('Error calculating examination date from valid_until:', e);
      }
    }
    
    // Ensure patient always has a gender value
    if (!structuredData.patient.gender || structuredData.patient.gender === '') {
      structuredData.patient.gender = 'unknown';
      console.log('Setting default gender to "unknown"');
    }
    
    // Final logging of the structured data
    console.log('Final structured data:', JSON.stringify(structuredData));
    
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
  
  // ID extraction - enhanced to handle more formats including South African ID numbers
  const idPatterns = [
    // Common patterns in medical forms
    /\*\*ID No[.:]\*\*\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /ID No[.:]\s*(.*?)(?=\n|\r|$|\*\*)/i,
    // South African specific patterns
    /\*\*ID Number\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /\*\*South African ID\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /\*\*Identity Number\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    // More general patterns
    /\bID\s*(?:Number|No|#)?\s*[:.]\s*(\d[\d\s-]*\d)/i,
    /\bIdentity\s*(?:Number|No|#)?\s*[:.]\s*(\d[\d\s-]*\d)/i,
    // Look for 13-digit numbers that might be SA ID numbers
    /\b(\d{6}[-\s]?\d{4}[-\s]?\d{3})\b/
  ];
  
  let foundId = false;
  for (const pattern of idPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      structuredData.patient.employee_id = cleanValue(match[1].trim());
      console.log('Extracted ID:', structuredData.patient.employee_id);
      foundId = true;
      break;
    }
  }
  
  // If we still don't have an ID, try a more aggressive approach
  // looking for ID number-like patterns in the text
  if (!foundId) {
    const aggressiveIdMatch = markdown.match(/\b(\d{13})\b/);
    if (aggressiveIdMatch && aggressiveIdMatch[1]) {
      structuredData.patient.employee_id = aggressiveIdMatch[1];
      console.log('Extracted potential SA ID with aggressive pattern:', structuredData.patient.employee_id);
    }
  }
  
  // Company extraction
  const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                      markdown.match(/Company Name:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (companyMatch && companyMatch[1]) {
    structuredData.patient.company = cleanValue(companyMatch[1].trim());
    console.log('Extracted company:', structuredData.patient.company);
  }
  
  // Exam date extraction - improved with additional patterns
  const examDatePatterns = [
    /\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Date of Examination:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /\*\*Examination Date\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Examination Date:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /\*\*Date\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i
  ];
  
  for (const pattern of examDatePatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const examDate = cleanValue(match[1].trim());
      structuredData.examination_results.date = examDate;
      structuredData.certification.examination_date = examDate;
      console.log('Extracted exam date:', examDate);
      break;
    }
  }
  
  // Expiry date extraction - improved with additional patterns
  const expiryDatePatterns = [
    /\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Expiry Date:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /\*\*Valid Until\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Valid Until:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Certificate Valid Until:\s*(.*?)(?=\n|\r|$|\*\*)/i
  ];
  
  for (const pattern of expiryDatePatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const expiryDate = cleanValue(match[1].trim());
      structuredData.certification.valid_until = expiryDate;
      console.log('Extracted expiry date:', expiryDate);
      break;
    }
  }
  
  // Job Title extraction - try multiple patterns
  const jobTitlePatterns = [
    /\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Job Title:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Job\s*Title\s*[:\-]\s*(.*?)(?=\n|\r|$|<!--)/i,
    /Job\s*Title\s*[:\-]\s*(.*?)(?=\n|\r|$|<)/i,
    /^Job Title:\s*(.*?)(?=\n|\r|$)/im
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
  console.log("Extracting examination type from markdown");
  
  // Direct examination type extraction
  let preEmploymentChecked = false;
  let periodicalChecked = false;
  let exitChecked = false;
  
  // Try multiple patterns for examination type detection
  
  // Pattern 1: HTML table extraction
  const tableRegex = /<table>[\s\S]*?<th>PRE-EMPLOYMENT<\/th>[\s\S]*?<th>PERIODICAL<\/th>[\s\S]*?<th>EXIT<\/th>[\s\S]*?<tr>[\s\S]*?<td>\[([x ])\]<\/td>[\s\S]*?<td>\[([x ])\]<\/td>[\s\S]*?<td>\[([x ])\]<\/td>/i;
  const tableMatch = markdown.match(tableRegex);
  
  if (tableMatch) {
    preEmploymentChecked = tableMatch[1].trim() === 'x';
    periodicalChecked = tableMatch[2].trim() === 'x';
    exitChecked = tableMatch[3].trim() === 'x';
    
    console.log("Found HTML table examination type data:", {
      preEmploymentChecked,
      periodicalChecked,
      exitChecked
    });
  } else {
    // Use individual pattern matching as fallback
    preEmploymentChecked = isChecked(markdown, "Pre-Employment") || isChecked(markdown, "PRE-EMPLOYMENT");
    periodicalChecked = isChecked(markdown, "Periodical") || isChecked(markdown, "PERIODICAL");
    exitChecked = isChecked(markdown, "Exit") || isChecked(markdown, "EXIT");
    
    console.log("Using individual pattern matching for examination type:", {
      preEmploymentChecked,
      periodicalChecked,
      exitChecked
    });
  }
  
  return {
    pre_employment: preEmploymentChecked,
    periodical: periodicalChecked,
    exit: exitChecked
  };
}

// Helper function to extract test results from markdown
function extractTestResultsFromMarkdown(markdown: string) {
  console.log("Extracting test results from markdown");
  
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
  
  // Try to find the medical examination section
  const medicalExamSection = markdown.match(/MEDICAL EXAMINATION CONDUCTED[^]+?(?=##|$)/i);
  const medicalExamText = medicalExamSection ? medicalExamSection[0] : markdown;
  
  // Process each test individually using multiple pattern detection approaches
  for (const test of tests) {
    // Default values
    testResults[`${test.key}_done`] = false;
    testResults[`${test.key}_results`] = 'N/A';
    
    // Pattern 1: HTML table cells with test name, checkbox, and results
    const htmlTablePattern = new RegExp(`<td>${test.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>([^<]*)</td>`, 'i');
    const htmlTableMatch = medicalExamText.match(htmlTablePattern);
    
    if (htmlTableMatch) {
      testResults[`${test.key}_done`] = htmlTableMatch[1].trim() === 'x';
      testResults[`${test.key}_results`] = cleanValue(htmlTableMatch[2].trim());
      console.log(`Extracted test ${test.key} with HTML table pattern: done=${testResults[`${test.key}_done`]}, results=${testResults[`${test.key}_results`]}`);
      continue; // Found result, move to next test
    }
    
    // Pattern 2: Pipe table format
    const pipeTablePattern = new RegExp(`\\|\\s*${test.name}\\s*\\|\\s*\\[(x| )\\]\\s*\\|\\s*([^|]*?)\\s*\\|`, 'i');
    const pipeTableMatch = medicalExamText.match(pipeTablePattern);
    
    if (pipeTableMatch) {
      testResults[`${test.key}_done`] = pipeTableMatch[1].trim() === 'x';
      testResults[`${test.key}_results`] = cleanValue(pipeTableMatch[2].trim());
      console.log(`Extracted test ${test.key} with pipe table pattern: done=${testResults[`${test.key}_done`]}, results=${testResults[`${test.key}_results`]}`);
      continue; // Found result, move to next test
    }
    
    // Pattern 3: List format with result after checkbox
    const listPattern = new RegExp(`${test.name}.*?\\[(x| )\\].*?([\\d\\.]+\\s*\\/\\s*[\\d\\.]+|Normal|N\\/A|[\\d\\.]+\\s*-\\s*[\\d\\.]+)`, 'i');
    const listMatch = medicalExamText.match(listPattern);
    
    if (listMatch) {
      testResults[`${test.key}_done`] = listMatch[1].trim() === 'x';
      testResults[`${test.key}_results`] = cleanValue(listMatch[2].trim());
      console.log(`Extracted test ${test.key} with list pattern: done=${testResults[`${test.key}_done`]}, results=${testResults[`${test.key}_results`]}`);
      continue; // Found result, move to next test
    }
    
    // Check if the test is marked as done using our improved isChecked function
    testResults[`${test.key}_done`] = isChecked(medicalExamText, test.name);
    if (testResults[`${test.key}_done`]) {
      console.log(`Detected ${test.key} as done through isChecked function`);
      
      // Try to find the corresponding result
      const resultPatterns = [
        new RegExp(`${test.name}.*?:.*?([\\d\\.]+\\s*\\/\\s*[\\d\\.]+|Normal|N\\/A|[\\d\\.]+\\s*-\\s*[\\d\\.]+)`, 'i'),
        new RegExp(`${test.name}.*?([\\d\\.]+\\s*\\/\\s*[\\d\\.]+|Normal|N\\/A|[\\d\\.]+\\s*-\\s*[\\d\\.]+)`, 'i'),
        new RegExp(`${test.name}\\s*results?:?\\s*([^\\n]+)`, 'i')
      ];
      
      for (const pattern of resultPatterns) {
        const resultMatch = medicalExamText.match(pattern);
        if (resultMatch && resultMatch[1] && resultMatch[1].trim() !== '') {
          testResults[`${test.key}_results`] = cleanValue(resultMatch[1].trim());
          console.log(`Found result for ${test.key}: ${testResults[`${test.key}_results`]}`);
          break;
        }
      }
    }
  }
  
  console.log('Extracted test results:', testResults);
  return testResults;
}

// Helper function to extract fitness status from markdown
function extractFitnessStatusFromMarkdown(markdown: string, certification: any) {
  console.log("Extracting fitness status from markdown");
  
  // Try to find a FITNESS ASSESSMENT or Medical Fitness Declaration section
  const fitnessSection = markdown.match(/FITNESS ASSESSMENT[^]+?(?=##|$)/i) || 
                        markdown.match(/Medical Fitness Declaration[^]+?(?=##|$)/i);
  const fitnessText = fitnessSection ? fitnessSection[0] : markdown;
  
  // Check for HTML table with fitness options
  const htmlTablePattern = /<table>[\s\S]*?<th>FIT<\/th>[\s\S]*?<th>Fit with Restriction<\/th>[\s\S]*?<th>Fit with Condition<\/th>[\s\S]*?<th>Temporary Unfit<\/th>[\s\S]*?<th>UNFIT<\/th>[\s\S]*?<tr>[\s\S]*?<td>\[([x ])\]<\/td>[\s\S]*?<td>\[([x ])\]<\/td>[\s\S]*?<td>\[([x ])\]<\/td>[\s\S]*?<td>\[([x ])\]<\/td>[\s\S]*?<td>\[([x ])\]<\/td>/i;
  const htmlTableMatch = fitnessText.match(htmlTablePattern);
  
  if (htmlTableMatch) {
    certification.fit = htmlTableMatch[1].trim() === 'x';
    certification.fit_with_restrictions = htmlTableMatch[2].trim() === 'x';
    certification.fit_with_condition = htmlTableMatch[3].trim() === 'x';
    certification.temporarily_unfit = htmlTableMatch[4].trim() === 'x';
    certification.unfit = htmlTableMatch[5].trim() === 'x';
    
    console.log('Extracted fitness status from HTML table:', {
      fit: certification.fit,
      fit_with_restrictions: certification.fit_with_restrictions,
      fit_with_condition: certification.fit_with_condition,
      temporarily_unfit: certification.temporarily_unfit,
      unfit: certification.unfit
    });
  } else {
    // Use the improved isChecked function for more accurate detection
    certification.fit = isChecked(fitnessText, "FIT");
    certification.fit_with_restrictions = isChecked(fitnessText, "Fit with Restriction");
    certification.fit_with_condition = isChecked(fitnessText, "Fit with Condition");
    certification.temporarily_unfit = isChecked(fitnessText, "Temporary Unfit") || isChecked(fitnessText, "Temporarily Unfit");
    certification.unfit = isChecked(fitnessText, "UNFIT");
    
    console.log('Extracted fitness status using isChecked function:', {
      fit: certification.fit,
      fit_with_restrictions: certification.fit_with_restrictions,
      fit_with_condition: certification.fit_with_condition,
      temporarily_unfit: certification.temporarily_unfit,
      unfit: certification.unfit
    });
  }
  
  // Extract comments if available
  const commentsMatch = markdown.match(/\*\*Comments\*\*:\s*(.*?)(?=\n\n|\n###|\n##|\n#|$|---)/i) ||
                      markdown.match(/Comments:\s*(.*?)(?=\n\n|\n###|\n##|\n#|$|---)/i);
  if (commentsMatch && commentsMatch[1] && commentsMatch[1].trim() !== '') {
    certification.comments = cleanValue(commentsMatch[1].trim());
    console.log('Extracted comments:', certification.comments);
  }
  
  // Extract follow-up information
  const followUpMatch = markdown.match(/Referred or follow up actions:\s*(.*?)(?=\n|\r|$|Review Date|<)/i);
  if (followUpMatch && followUpMatch[1]) {
    certification.follow_up = cleanValue(followUpMatch[1].trim());
    console.log('Extracted follow-up actions:', certification.follow_up);
  }
  
  // Extract review date
  const reviewDateMatch = markdown.match(/Review Date:\s*(.*?)(?=\n|\r|$|<)/i);
  if (reviewDateMatch && reviewDateMatch[1]) {
    certification.review_date = cleanValue(reviewDateMatch[1].trim());
    console.log('Extracted review date:', certification.review_date);
  }
  
  console.log('Final fitness status data:', certification);
  return certification;
}

// Helper function to extract restrictions from markdown
function extractRestrictionsFromMarkdown(markdown: string) {
  console.log("Extracting restrictions from markdown");
  
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
  
  // Try to find a Restrictions section
  const restrictionsSection = markdown.match(/Restrictions[:\n][^]+?(?=##|$)/i);
  const restrictionsText = restrictionsSection ? restrictionsSection[0] : markdown;
  
  // Use the improved isChecked function for more accurate detection
  restrictions.heights = isChecked(restrictionsText, "Heights");
  restrictions.dust_exposure = isChecked(restrictionsText, "Dust Exposure");
  restrictions.motorized_equipment = isChecked(restrictionsText, "Motorized Equipment");
  restrictions.wear_hearing_protection = isChecked(restrictionsText, "Wear Hearing Protection");
  restrictions.confined_spaces = isChecked(restrictionsText, "Confined Spaces");
  restrictions.chemical_exposure = isChecked(restrictionsText, "Chemical Exposure");
  restrictions.wear_spectacles = isChecked(restrictionsText, "Wear Spectacles");
  restrictions.remain_on_treatment_for_chronic_conditions = isChecked(restrictionsText, "Remain on Treatment for Chronic Conditions") || 
                                                        isChecked(restrictionsText, "Remain on Treatment");
  
  // HTML tables pattern for restrictions
  // Note that these might appear in a different format than the checkbox pattern
  const restrictionTerms = [
    { name: "Heights", key: "heights" },
    { name: "Dust Exposure", key: "dust_exposure" },
    { name: "Motorized Equipment", key: "motorized_equipment" },
    { name: "Wear Hearing Protection", key: "wear_hearing_protection" },
    { name: "Confined Spaces", key: "confined_spaces" },
    { name: "Chemical Exposure", key: "chemical_exposure" },
    { name: "Wear Spectacles", key: "wear_spectacles" },
    { name: "Remain on Treatment for Chronic Conditions", key: "remain_on_treatment_for_chronic_conditions" }
  ];
  
  // Check if any restriction is highlighted or marked in an HTML table
  for (const restriction of restrictionTerms) {
    // If already detected, skip
    if (restrictions[restriction.key]) continue;
    
    // Look for highlighted cells in tables
    const highlightPattern = new RegExp(`<td[^>]*bg-yellow[^>]*>${restriction.name}</td>`, 'i');
    if (highlightPattern.test(restrictionsText)) {
      restrictions[restriction.key] = true;
      console.log(`Found highlighted restriction ${restriction.key}`);
      continue;
    }
    
    // Look for any indication that this restriction is present
    const indication = markdown.match(new RegExp(`${restriction.name}\\s*(\\*|:|\\+|-)`, 'i'));
    if (indication) {
      restrictions[restriction.key] = true;
      console.log(`Found indication of restriction ${restriction.key}`);
      continue;
    }
  }
  
  console.log('Extracted restrictions:', restrictions);
  return restrictions;
}
