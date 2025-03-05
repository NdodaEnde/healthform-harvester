
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
    
    // Add more robust patterns to catch dates in different formats
    const examDatePatterns = [
      /\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i,
      /Date of Examination:?\s*(.*?)(?=\n|\r|$)/i,
      /Examination Date:?\s*(.*?)(?=\n|\r|$)/i,
      /\|\s*Date of Examination\s*\|\s*(.*?)\s*\|/i
    ];
    
    // Try each pattern for exam date
    for (const pattern of examDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        extracted.examination_results.date = match[1].trim();
        break;
      }
    }
    
    // Multiple patterns for expiry date
    const expiryDatePatterns = [
      /\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i,
      /Expiry Date:?\s*(.*?)(?=\n|\r|$)/i,
      /Expiration Date:?\s*(.*?)(?=\n|\r|$)/i,
      /Valid Until:?\s*(.*?)(?=\n|\r|$)/i,
      /\|\s*Expiry Date\s*\|\s*(.*?)\s*\|/i
    ];
    
    // Try each pattern for expiry date
    for (const pattern of expiryDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        extracted.certification.valid_until = match[1].trim();
        break;
      }
    }
    
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
    
    console.log("Attempting to extract markdown from data structure");
    
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
    
    // ADDITIONAL: Check for event_message field and try to extract markdown from it
    if (data.event_message && typeof data.event_message === 'string') {
      console.log("Checking event_message for potential markdown content");
      
      // Look for a JSON structure in the event_message
      const jsonMatch = data.event_message.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const parsedJson = JSON.parse(jsonMatch[0]);
          if (parsedJson.data && parsedJson.data.markdown) {
            console.log("Found markdown in event_message JSON");
            return parsedJson.data.markdown;
          }
        } catch (e) {
          console.log("Failed to parse potential JSON in event_message");
        }
      }
    }
    
    // ADDITIONAL: Look for raw text that might contain certificate content
    if (data.raw_text || data.text || (data.data && data.data.text)) {
      const rawText = data.raw_text || data.text || (data.data && data.data.text);
      if (typeof rawText === 'string' && 
          (rawText.includes("Certificate of Fitness") || 
           rawText.includes("Initials & Surname") || 
           rawText.includes("Medical Examination"))) {
        console.log("Found raw text that looks like certificate content");
        return rawText;
      }
    }
    
    console.log("Could not find markdown in provided data");
    return null;
  };
  
  // IMPORTANT ADDITION: Debug the input data structure
  console.log("Initial extractedData structure:", JSON.stringify(extractedData, null, 2));
  
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
    if (markdown) {
      console.log("Extracting from markdown content");
      structuredData = extractDataFromMarkdown(markdown);
    } else {
      console.log("No markdown found, using extractedData as is");
      
      // NEW: Try to parse event_message if it exists and looks like it contains API response
      if (extractedData && extractedData.event_message && 
          typeof extractedData.event_message === 'string' &&
          extractedData.event_message.includes('Response:')) {
        try {
          console.log("Found event_message, trying to parse API response");
          
          // Find the JSON in the event_message
          const match = extractedData.event_message.match(/Response:\s*(\{.*\})/s);
          if (match && match[1]) {
            const parsedData = JSON.parse(match[1]);
            console.log("Successfully parsed data from event_message");
            
            if (parsedData.data && parsedData.data.markdown) {
              console.log("Found markdown in parsed event_message data");
              structuredData = extractDataFromMarkdown(parsedData.data.markdown);
            } else {
              structuredData = parsedData;
            }
          }
        } catch (e) {
          console.error("Error parsing event_message:", e);
          structuredData = extractedData || {};
        }
      } else {
        structuredData = extractedData || {};
      }
    }
  }
  
  // Get the main sections from the data
  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || structuredData.medical_details || {};
  const restrictions = structuredData.restrictions || {};
  const certification = structuredData.certification || structuredData.fitness_assessment || {};
  const testResults = examination.test_results || examination.tests || {};
  
  // Create dedicated variables for important dates with multiple fallbacks
  const examDate = getValue(examination, 'date') || 
                  getValue(extractedData, 'examination_date') ||
                  getValue(structuredData, 'exam_date') ||
                  getValue(structuredData, 'examination_date');
                  
  const expiryDate = getValue(certification, 'valid_until') || 
                    getValue(certification, 'expiration_date') ||
                    getValue(structuredData, 'expiry_date') ||
                    getValue(extractedData, 'expiry_date');
  
  console.log("Extracted dates:", { examDate, expiryDate });
  
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
    examDate,
    expiryDate,
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
                    <span className="border-b border-gray-400 flex-1">{examDate}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <span className="border-b border-gray-400 flex-1">{expiryDate}</span>
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
