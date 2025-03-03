import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type CertificateTemplateProps = {
  extractedData: any;
};

const CertificateTemplate = ({ extractedData }: CertificateTemplateProps) => {
  useEffect(() => {
    console.log("CertificateTemplate received data:", extractedData);
  }, [extractedData]);

  // Helper to check if a value is checked/selected
  const isChecked = (value: any, trueValues: string[] = ['yes', 'true', 'checked', '1', 'x']) => {
    if (value === undefined || value === null) return false;
    
    const stringValue = String(value).toLowerCase().trim();
    return trueValues.includes(stringValue);
  };
  
  // Helper to get nested values safely
  const getValue = (obj: any, path: string, defaultValue: any = '') => {
    if (!obj || !path) return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined && current !== null ? current : defaultValue;
  };

  // Extract data directly from markdown
  const extractDataFromMarkdown = (markdown: string): any => {
    if (!markdown) return {};
    
    console.log("Extracting data from markdown");
    
    const extracted: any = {
      patient: {},
      examination_results: {
        type: {},
        test_results: {}
      },
      certification: {},
      restrictions: {}
    };
    
    // Patient data - more robust pattern matching
    const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (nameMatch && nameMatch[1]) extracted.patient.name = nameMatch[1].trim();
    
    const idMatch = markdown.match(/\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (idMatch && idMatch[1]) extracted.patient.id_number = idMatch[1].trim();
    
    const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (companyMatch && companyMatch[1]) extracted.patient.company = companyMatch[1].trim();
    
    const jobTitleMatch = markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (jobTitleMatch && jobTitleMatch[1]) extracted.patient.occupation = jobTitleMatch[1].trim();
    
    const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (examDateMatch && examDateMatch[1]) extracted.examination_results.date = examDateMatch[1].trim();
    
    const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (expiryDateMatch && expiryDateMatch[1]) extracted.certification.valid_until = expiryDateMatch[1].trim();
    
    // Examination type - look for [x] markers in different formats
    extracted.examination_results.type.pre_employment = 
      markdown.includes('**Pre-Employment**: [x]') || 
      markdown.match(/PRE-EMPLOYMENT.*?\[\s*x\s*\]/is) !== null;
      
    extracted.examination_results.type.periodical = 
      markdown.includes('**Periodical**: [x]') || 
      markdown.match(/PERIODICAL.*?\[\s*x\s*\]/is) !== null;
      
    extracted.examination_results.type.exit = 
      markdown.includes('**Exit**: [x]') || 
      markdown.match(/EXIT.*?\[\s*x\s*\]/is) !== null;
    
    // Medical tests - check multiple formats
    const testsMap = [
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
    
    testsMap.forEach(test => {
      // Check table format with pipe separators
      const tableRegex = new RegExp(`\\| ${test.name}\\s*\\| \\[(x| )\\]\\s*\\| (.*?)\\|`, 'is');
      const tableMatch = markdown.match(tableRegex);
      
      // Check list format
      const listRegex = new RegExp(`${test.name}.*?\\[(x| )\\].*?(\\d+\\/\\d+|Normal|N\\/A|\\d+-\\d+)`, 'is');
      const listMatch = markdown.match(listRegex);
      
      // Check HTML table format
      const htmlTableRegex = new RegExp(`<td>${test.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>(.*?)</td>`, 'is');
      const htmlTableMatch = markdown.match(htmlTableRegex);
      
      let isDone = false;
      let results = '';
      
      if (tableMatch) {
        isDone = tableMatch[1].trim() === 'x';
        results = tableMatch[2] ? tableMatch[2].trim() : '';
      } else if (listMatch) {
        isDone = listMatch[1].trim() === 'x';
        results = listMatch[2] ? listMatch[2].trim() : '';
      } else if (htmlTableMatch) {
        isDone = htmlTableMatch[1].trim() === 'x';
        results = htmlTableMatch[2] ? htmlTableMatch[2].trim() : '';
      }
      
      if (isDone || results) {
        extracted.examination_results.test_results[`${test.key}_done`] = isDone;
        extracted.examination_results.test_results[`${test.key}_results`] = results;
      }
    });
    
    // Fitness status - check various formats
    const fitnessOptions = [
      { name: 'FIT', key: 'fit' },
      { name: 'Fit with Restriction', key: 'fit_with_restrictions' },
      { name: 'Fit with Condition', key: 'fit_with_condition' },
      { name: 'Temporary Unfit', key: 'temporarily_unfit' },
      { name: 'UNFIT', key: 'unfit' }
    ];
    
    fitnessOptions.forEach(option => {
      // Check multiple formats
      const patterns = [
        new RegExp(`\\*\\*${option.name}\\*\\*: \\[(x| )\\]`, 'is'),
        new RegExp(`<th>${option.name}</th>[\\s\\S]*?<td>\\[(x| )\\]</td>`, 'is'),
        new RegExp(`\\| ${option.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];
      
      // Check all patterns
      let isSelected = false;
      for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match && match[0].includes('[x]')) {
          isSelected = true;
          break;
        }
      }
      
      extracted.certification[option.key] = isSelected;
    });
    
    // Restrictions - check both table and list formats
    const restrictions = [
      { name: 'Heights', key: 'heights' },
      { name: 'Dust Exposure', key: 'dust_exposure' },
      { name: 'Motorized Equipment', key: 'motorized_equipment' },
      { name: 'Wear Hearing Protection', key: 'wear_hearing_protection' },
      { name: 'Confined Spaces', key: 'confined_spaces' },
      { name: 'Chemical Exposure', key: 'chemical_exposure' },
      { name: 'Wear Spectacles', key: 'wear_spectacles' },
      { name: 'Remain on Treatment for Chronic Conditions', key: 'remain_on_treatment_for_chronic_conditions' }
    ];
    
    restrictions.forEach(restriction => {
      // Check multiple formats
      const patterns = [
        new RegExp(`\\*\\*${restriction.name}\\*\\*: \\[(x| )\\]`, 'is'),
        new RegExp(`<td>${restriction.name}</td>\\s*<td>\\[(x| )\\]</td>`, 'is'),
        new RegExp(`\\| ${restriction.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];
      
      // Check all patterns
      let isSelected = false;
      for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match && match[0].includes('[x]')) {
          isSelected = true;
          break;
        }
      }
      
      extracted.restrictions[restriction.key] = isSelected;
    });
    
    // Follow-up actions and comments
    const followUpMatch = markdown.match(/Referred or follow up actions:(.*?)(?=\n|\r|$|<)/i);
    if (followUpMatch && followUpMatch[1]) extracted.certification.follow_up = followUpMatch[1].trim();
    
    const reviewDateMatch = markdown.match(/Review Date:(.*?)(?=\n|\r|$|<)/i);
    if (reviewDateMatch && reviewDateMatch[1]) extracted.certification.review_date = reviewDateMatch[1].trim();
    
    const commentsMatch = markdown.match(/Comments:(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
    if (commentsMatch && commentsMatch[1]) {
      let comments = commentsMatch[1].trim();
      // If it's just "N/A" or empty after HTML tags are removed
      if (comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "N/A" || 
          comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "") {
        extracted.certification.comments = "N/A";
      } else {
        extracted.certification.comments = comments;
      }
    }
    
    console.log("Extracted data from markdown:", extracted);
    return extracted;
  };
  
  // Enhanced function to extract markdown from the Landing AI response
  const getMarkdown = (data: any): string | null => {
    if (!data) return null;
    
    console.log("Attempting to extract markdown from data structure:", data);
    
    // First, try direct known paths
    const possiblePaths = [
      'raw_response.data.markdown',
      'extracted_data.raw_response.data.markdown',
      'markdown',
      'raw_markdown'
    ];
    
    for (const path of possiblePaths) {
      const value = getValue(data, path);
      if (value && typeof value === 'string') {
        console.log(`Found markdown at path: ${path}`);
        return value;
      }
    }
    
    // Check if data is a string that contains markdown-like content
    if (typeof data === 'string') {
      if (data.includes('## Description') || data.includes('**') || data.includes('# CERTIFICATE OF FITNESS')) {
        console.log("Data is a string that appears to contain markdown");
        return data;
      }
      
      // Try to extract markdown from a JSON string
      if (data.includes('"markdown":"')) {
        try {
          const markdownMatch = data.match(/"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s);
          if (markdownMatch && markdownMatch[1]) {
            const markdownContent = markdownMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            console.log("Extracted markdown from JSON string");
            return markdownContent;
          }
        } catch (e) {
          console.error("Error extracting markdown from string:", e);
        }
      }
      
      // Try to extract from Response: format
      if (data.includes('Response:')) {
        try {
          const responseMatch = data.match(/Response:\s*(\{.*\})/s);
          if (responseMatch && responseMatch[1]) {
            try {
              const responseObj = JSON.parse(responseMatch[1]);
              if (responseObj.data && responseObj.data.markdown) {
                console.log("Extracted markdown from Response: format");
                return responseObj.data.markdown;
              }
            } catch (e) {
              console.error("Error parsing Response JSON:", e);
            }
          }
        } catch (e) {
          console.error("Error extracting from Response format:", e);
        }
      }
    }
    
    // Deep search for any property containing markdown content
    const searchForMarkdown = (obj: any, path = ''): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      
      if (obj.markdown && typeof obj.markdown === 'string') {
        console.log(`Found markdown at deep path: ${path}.markdown`);
        return obj.markdown;
      }
      
      if (obj.raw_response && obj.raw_response.data && obj.raw_response.data.markdown) {
        console.log(`Found markdown at deep path: ${path}.raw_response.data.markdown`);
        return obj.raw_response.data.markdown;
      }
      
      if (obj.data && obj.data.markdown) {
        console.log(`Found markdown at deep path: ${path}.data.markdown`);
        return obj.data.markdown;
      }
      
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const result = searchForMarkdown(obj[key], `${path}.${key}`);
          if (result) return result;
        } else if (typeof obj[key] === 'string') {
          // Check if any string property contains markdown-like content
          const str = obj[key];
          if (str.includes('"markdown":"')) {
            try {
              const markdownMatch = str.match(/"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s);
              if (markdownMatch && markdownMatch[1]) {
                const markdownContent = markdownMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');
                console.log(`Found markdown in string property at ${path}.${key}`);
                return markdownContent;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }
      }
      
      return null;
    };
    
    const deepMarkdown = searchForMarkdown(data);
    if (deepMarkdown) return deepMarkdown;
    
    // Try to find structured_data.raw_content
    if (data.structured_data && data.structured_data.raw_content) {
      console.log("Found structured_data.raw_content, using as markdown");
      return data.structured_data.raw_content;
    }
    
    // Last attempt: check if event_message contains markdown
    if (data.event_message && typeof data.event_message === 'string') {
      console.log("Checking event_message for markdown content");
      return getMarkdown(data.event_message); // Recursive call with event_message
    }
    
    console.log("Could not find markdown in provided data");
    return null;
  };
  
  // Get structured data from either direct input or extracted from markdown
  let structuredData: any = {};
  
  // First try to get structured data directly from the input
  if (extractedData?.structured_data) {
    console.log("Using existing structured_data");
    structuredData = extractedData.structured_data;
  } else if (extractedData?.extracted_data?.structured_data) {
    console.log("Using structured_data from extracted_data");
    structuredData = extractedData.extracted_data.structured_data;
  } else {
    // If no structured data, try to extract from markdown
    const markdown = getMarkdown(extractedData);
    console.log("Markdown content found:", markdown ? "Yes" : "No");
    if (markdown) {
      console.log("Extracting from markdown content");
      structuredData = extractDataFromMarkdown(markdown);
    } else {
      // Try direct access to event_message as a last resort
      if (extractedData?.event_message && typeof extractedData.event_message === 'string') {
        console.log("Attempting to extract directly from event_message");
        structuredData = extractDataFromMarkdown(extractedData.event_message);
      } else {
        console.log("No markdown found, using extractedData as is");
        structuredData = extractedData || {};
      }
    }
  }
  
  console.log("Final structured data:", structuredData);
  
  // Get the main sections from the data
  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || structuredData.medical_details || {};
  const restrictions = structuredData.restrictions || {};
  const certification = structuredData.certification || structuredData.fitness_assessment || {};
  const testResults = examination.test_results || examination.tests || {};
  
  // Fitness status
  const fitnessStatus = {
    fit: isChecked(certification.fit_for_duty) || isChecked(certification.fit),
    fitWithRestriction: isChecked(certification.fit_with_restrictions),
    fitWithCondition: isChecked(certification.fit_with_condition),
    temporarilyUnfit: isChecked(certification.temporarily_unfit),
    unfit: isChecked(certification.permanently_unfit) || isChecked(certification.unfit)
  };
  
  // Medical tests status
  const medicalTests = {
    bloods: {
      done: isChecked(testResults.bloods_done) || isChecked(testResults.blood_test),
      results: getValue(testResults, 'bloods_results') || getValue(testResults, 'blood_test_results')
    },
    farNearVision: {
      done: isChecked(testResults.far_near_vision_done) || isChecked(testResults.vision_test),
      results: getValue(testResults, 'far_near_vision_results') || getValue(testResults, 'vision_results')
    },
    sideDepth: {
      done: isChecked(testResults.side_depth_done) || isChecked(testResults.peripheral_vision),
      results: getValue(testResults, 'side_depth_results') || getValue(testResults, 'peripheral_vision_results')
    },
    nightVision: {
      done: isChecked(testResults.night_vision_done) || isChecked(testResults.night_vision_test),
      results: getValue(testResults, 'night_vision_results')
    },
    hearing: {
      done: isChecked(testResults.hearing_done) || isChecked(testResults.hearing_test),
      results: getValue(testResults, 'hearing_results') || getValue(testResults, 'hearing_test_results')
    },
    heights: {
      done: isChecked(testResults.heights_done) || isChecked(testResults.working_at_heights),
      results: getValue(testResults, 'heights_results') || getValue(testResults, 'working_at_heights_results')
    },
    lungFunction: {
      done: isChecked(testResults.lung_function_done) || isChecked(testResults.pulmonary_function),
      results: getValue(testResults, 'lung_function_results') || getValue(testResults, 'pulmonary_function_results')
    },
    xRay: {
      done: isChecked(testResults.x_ray_done) || isChecked(testResults.chest_x_ray),
      results: getValue(testResults, 'x_ray_results') || getValue(testResults, 'chest_x_ray_results')
    },
    drugScreen: {
      done: isChecked(testResults.drug_screen_done) || isChecked(testResults.drug_screen_test),
      results: getValue(testResults, 'drug_screen_results')
    }
  };
  
  // Restrictions
  const restrictionsData = {
    heights: isChecked(restrictions.heights),
    dustExposure: isChecked(restrictions.dust_exposure),
    motorizedEquipment: isChecked(restrictions.motorized_equipment),
    hearingProtection: isChecked(restrictions.hearing_protection) || isChecked(restrictions.wear_hearing_protection),
    confinedSpaces: isChecked(restrictions.confined_spaces),
    chemicalExposure: isChecked(restrictions.chemical_exposure),
    wearSpectacles: isChecked(restrictions.wear_spectacles),
    chronicConditions: isChecked(restrictions.chronic_conditions) || isChecked(restrictions.remain_on_treatment_for_chronic_conditions)
  };
  
  // Determine examination type
  const examinationType = {
    preEmployment: isChecked(examination.pre_employment) || isChecked(examination.type?.pre_employment),
    periodical: isChecked(examination.periodical) || isChecked(examination.type?.periodical),
    exit: isChecked(examination.exit) || isChecked(examination.type?.exit)
  };
  
  // For debugging - log the patient data to console
  console.log("Certificate template using data:", {
    name: getValue(patient, 'name'),
    id: getValue(patient, 'id_number'),
    company: getValue(patient, 'company'),
    occupation: getValue(patient, 'occupation'),
    examDate: getValue(examination, 'date'),
    expiryDate: getValue(certification, 'valid_until'),
    examinationType,
    fitnessStatus,
    medicalTests,
    restrictionsData
  });
  
  return (
    <ScrollArea className="h-full">
      <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black">
        <div className="relative overflow-hidden">
          {/* Certificate watermark (faint background) */}
          <div 
            className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
            aria-hidden="true"
          >
            <span className="text-8xl font-bold tracking-widest text-gray-400 rotate-45">
              OCCUPATIONAL HEALTH
            </span>
          </div>
          
          {/* Certificate content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="px-4 pt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  {/* Logo placeholder */}
                  <div className="w-16 h-16 rounded overflow-hidden bg-blue-100 flex items-center justify-center mr-2">
                    <svg viewBox="0 0 100 100" className="w-14 h-14 text-blue-500">
                      <path d="M50,20 C70,20 85,35 85,55 C85,75 70,90 50,90 C30,90 15,75 15,55 C15,35 30,20 50,20 Z" fill="none" stroke="currentColor" strokeWidth="4"></path>
                      <path d="M30,55 Q40,30 50,55 Q60,80 70,55" fill="none" stroke="currentColor" strokeWidth="4"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Blue<span className="font-bold">Collar</span></div>
                    <div className="text-xs">Occupational Health Services</div>
                  </div>
                </div>
                <div className="bg-gray-800 text-white px-3 py-1">
                  <div className="text-sm font-bold">BLUECOLLAR OCCUPATIONAL HEALTH</div>
                  <div className="text-xs mt-1">Tel: +27 11 892 0771/011 892 0627</div>
                  <div className="text-xs">Email: admin@bluecollarhealth.co.za</div>
                  <div className="text-xs">office@bluecollarhealth.co.za</div>
                  <div className="text-xs">135 Leeuwpoort Street, Boksburg South, Boksburg</div>
                </div>
              </div>
            </div>
            
            {/* Certificate Title */}
            <div className="bg-gray-800 text-white text-center py-2 mb-2">
              <h2 className="text-lg font-bold">CERTIFICATE OF FITNESS</h2>
            </div>
            
            {/* Physician/Practice Info */}
            <div className="text-center text-xs px-4 mb-3">
              <p>
                Dr. {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mphuthi'} / Practice No: {getValue(examination, 'practice_number') || '0404160'} / Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'} / Practice No: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            {/* Employee Details Section */}
            <div className="px-4 space-y-4 mb-4">
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Initials & Surname:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'name') || getValue(patient, 'full_name')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'id_number') || getValue(patient, 'employee_id') || getValue(patient, 'id')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'company') || getValue(patient, 'employer') || getValue(patient, 'employment.employer')}</span>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(examination, 'date') || getValue(extractedData, 'examination_date')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(certification, 'valid_until') || getValue(certification, 'expiration_date')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'occupation') || getValue(patient, 'job_title') || getValue(patient, 'employment.occupation')}</span>
              </div>
            </div>
            
            {/* Examination Type */}
            <div className="px-4 mb-4">
              <table className="w-full border border-gray-400">
                <thead>
                  <tr>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PRE-EMPLOYMENT</th>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PERIODICAL</th>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">EXIT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.preEmployment ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.periodical ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.exit ? '✓' : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Medical Examination Tests */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
              </div>
              
              <div className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <table className="w-full border border-gray-400">
                      <thead>
                        <tr>
                          <th className="border border-gray-400 py-1 w-1/3 text-left pl-2 bg-blue-50 text-sm">BLOODS</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">BLOODS</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.bloods.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.bloods.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.farNearVision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.farNearVision.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.sideDepth.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.sideDepth.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.nightVision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.nightVision.results}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <table className="w-full border border-gray-400">
                      <thead>
                        <tr>
                          <th className="border border-gray-400 py-1 text-left pl-2 bg-blue-50 text-sm">Hearing</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Hearing</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.hearing.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.hearing.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.heights.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.heights.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.lungFunction.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.lungFunction.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.xRay.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.xRay.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.drugScreen.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.drugScreen.results}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Referral Section */}
            <div className="px-4 mb-4">
              <div className="flex items-center">
                <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
                <div className="border-b border-gray-400 flex-1">
                  {getValue(certification, 'follow_up') || getValue(certification, 'referral')}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">{getValue(certification, 'review_date')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Restrictions Table */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                Restrictions:
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400 text-sm">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Heights</div>
                        {restrictionsData.heights && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.dustExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Dust Exposure</div>
                        {restrictionsData.dustExposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.motorizedEquipment ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Motorized Equipment</div>
                        {restrictionsData.motorizedEquipment && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.hearingProtection ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Hearing Protection</div>
                        {restrictionsData.hearingProtection && <div className="text-xs">✓</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.confinedSpaces ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Confined Spaces</div>
                        {restrictionsData.confinedSpaces && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.chemicalExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Chemical Exposure</div>
                        {restrictionsData.chemicalExposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.wearSpectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Spectacles</div>
                        {restrictionsData.wearSpectacles && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.chronicConditions ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Remain on Treatment for Chronic Conditions</div>
                        {restrictionsData.chronicConditions && <div className="text-xs">✓</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Fitness Status */}
            <div className="mb-6">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                Medical Fitness Declaration
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.fit ? 'bg-green-100' : ''}`}>
                        <div className="font-semibold text-sm">FIT</div>
                        {fitnessStatus.fit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.fitWithRestriction ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Restriction</div>
                        {fitnessStatus.fitWithRestriction && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.fitWithCondition ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Condition</div>
                        {fitnessStatus.fitWithCondition && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.temporarilyUnfit ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">Temporary Unfit</div>
                        {fitnessStatus.temporarilyUnfit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.unfit ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">UNFIT</div>
                        {fitnessStatus.unfit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comments */}
            <div className="px-4 mb-6">
              <div className="flex flex-col">
                <div className="font-semibold text-sm mb-1">Comments:</div>
                <div className="border border-gray-400 p-2 min-h-24 text-sm">
                  {getValue(certification, 'comments') || 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Footer with signature */}
            <div className="px-4 flex justify-between items-end mb-4">
              <div className="w-56">
                <div className="border-b border-gray-400 h-14 flex items-end justify-center pb-1">
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgODAiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0yMCA0MGMwIDAgMjAtMzAgNjAgMCBjIDMwIDI1IDQwLTEwIDYwIDUgYyAyMCAxNyA0MCA1IDYwLTEwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==" 
                    alt="Signature" 
                    className="h-12 opacity-70"
                  />
                </div>
                <div className="text-center text-sm font-semibold mt-1">
                  Medical Practitioner
                </div>
              </div>
              
              <div className="w-56">
                <div className="border-b border-gray-400 h-14"></div>
                <div className="text-center text-sm font-semibold mt-1">
                  Employee Signature
                </div>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="bg-gray-100 p-3 text-xs text-center">
              <p>This certificate is valid for the duration specified above from the date of medical examination, 
                unless there is a change in the employees' medical condition or the nature of their work.</p>
            </div>
          </div>
        </div>
      </Card>
    </ScrollArea>
  );
};

export default CertificateTemplate;
