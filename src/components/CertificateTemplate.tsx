import React from "react";
import { Card } from "@/components/ui/card";

type CertificateTemplateProps = {
  extractedData: any;
};

const CertificateTemplate = ({ extractedData }: CertificateTemplateProps) => {
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
  
  // Extract data from both potential sources
  // First, try to extract from the raw_response which contains markdown
  const parseFromMarkdown = (data: any) => {
    // Create a structured data object from the markdown information
    if (!data || !data.raw_response || !data.raw_response.data) return null;
    
    const markdown = data.raw_response.data.markdown;
    if (!markdown) return null;
    
    // Basic parsing to extract important fields
    const structured: any = {
      patient: {},
      examination_results: { test_results: {} },
      restrictions: {},
      certification: {},
    };
    
    // Extract patient information from the markdown
    const nameMatch = markdown.match(/\*\*Initials & Surname\*\*: (.*?)(?=\n|\r|$)/);
    if (nameMatch && nameMatch[1]) structured.patient.name = nameMatch[1].trim();
    
    const idMatch = markdown.match(/\*\*ID NO\*\*: (.*?)(?=\n|\r|$)/);
    if (idMatch && idMatch[1]) structured.patient.id_number = idMatch[1].trim();
    
    const companyMatch = markdown.match(/\*\*Company Name\*\*: (.*?)(?=\n|\r|$)/);
    if (companyMatch && companyMatch[1]) structured.patient.company = companyMatch[1].trim();
    
    const jobTitleMatch = markdown.match(/## Job Title: (.*?)(?=\n|\r|$|<)/);
    if (jobTitleMatch && jobTitleMatch[1]) structured.patient.occupation = jobTitleMatch[1].trim();
    
    const examDateMatch = markdown.match(/\*\*Date of Examination\*\*: (.*?)(?=\n|\r|$)/);
    if (examDateMatch && examDateMatch[1]) structured.examination_results.date = examDateMatch[1].trim();
    
    const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*: (.*?)(?=\n|\r|$)/);
    if (expiryDateMatch && expiryDateMatch[1]) structured.certification.valid_until = expiryDateMatch[1].trim();
    
    // Extract examination type
    if (markdown.includes('[x]</td>') && markdown.includes('PRE-EMPLOYMENT')) {
      structured.examination_results.type = { pre_employment: true };
    } else if (markdown.includes('[x]</td>') && markdown.includes('PERIODICAL')) {
      structured.examination_results.type = { periodical: true };
    } else if (markdown.includes('[x]</td>') && markdown.includes('EXIT')) {
      structured.examination_results.type = { exit: true };
    }
    
    // Extract test results
    if (markdown.includes('BLOODS') && markdown.includes('[x]')) {
      structured.examination_results.test_results.bloods_done = true;
      const bloodsResultsMatch = markdown.match(/BLOODS<\/td>\s*<td>\[x\]<\/td>\s*<td>(.*?)<\/td>/);
      if (bloodsResultsMatch && bloodsResultsMatch[1]) {
        structured.examination_results.test_results.bloods_results = bloodsResultsMatch[1].trim();
      }
    }
    
    if (markdown.includes('FAR, NEAR VISION')) {
      const visionDoneMatch = markdown.match(/FAR, NEAR VISION<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.vision_test = visionDoneMatch && visionDoneMatch[1] === 'x';
      
      const visionResultsMatch = markdown.match(/FAR, NEAR VISION<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (visionResultsMatch && visionResultsMatch[2]) {
        structured.examination_results.test_results.vision_results = visionResultsMatch[2].trim();
      }
    }
    
    if (markdown.includes('SIDE & DEPTH')) {
      const sideDepthDoneMatch = markdown.match(/SIDE & DEPTH<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.side_depth_test = sideDepthDoneMatch && sideDepthDoneMatch[1] === 'x';
      
      const sideDepthResultsMatch = markdown.match(/SIDE & DEPTH<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (sideDepthResultsMatch && sideDepthResultsMatch[2]) {
        structured.examination_results.test_results.side_depth_results = sideDepthResultsMatch[2].trim();
      }
    }
    
    if (markdown.includes('NIGHT VISION')) {
      const nightVisionDoneMatch = markdown.match(/NIGHT VISION<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.night_vision_test = nightVisionDoneMatch && nightVisionDoneMatch[1] === 'x';
      
      const nightVisionResultsMatch = markdown.match(/NIGHT VISION<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (nightVisionResultsMatch && nightVisionResultsMatch[2]) {
        structured.examination_results.test_results.night_vision_results = nightVisionResultsMatch[2].trim();
      }
    }
    
    if (markdown.includes('Hearing')) {
      const hearingDoneMatch = markdown.match(/Hearing<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.hearing_test = hearingDoneMatch && hearingDoneMatch[1] === 'x';
      
      const hearingResultsMatch = markdown.match(/Hearing<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (hearingResultsMatch && hearingResultsMatch[2]) {
        structured.examination_results.test_results.hearing_test_results = hearingResultsMatch[2].trim();
      }
    }
    
    if (markdown.includes('Working at Heights')) {
      const heightsDoneMatch = markdown.match(/Working at Heights<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.heights_test = heightsDoneMatch && heightsDoneMatch[1] === 'x';
      
      const heightsResultsMatch = markdown.match(/Working at Heights<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (heightsResultsMatch && heightsResultsMatch[2]) {
        structured.examination_results.test_results.heights_results = heightsResultsMatch[2].trim();
      }
    }
    
    if (markdown.includes('Lung Function')) {
      const lungDoneMatch = markdown.match(/Lung Function<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.lung_function_test = lungDoneMatch && lungDoneMatch[1] === 'x';
      
      const lungResultsMatch = markdown.match(/Lung Function<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (lungResultsMatch && lungResultsMatch[2]) {
        structured.examination_results.test_results.lung_function_results = lungResultsMatch[2].trim();
      }
    }
    
    if (markdown.includes('X-Ray')) {
      const xrayDoneMatch = markdown.match(/X-Ray<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.x_ray_test = xrayDoneMatch && xrayDoneMatch[1] === 'x';
      
      const xrayResultsMatch = markdown.match(/X-Ray<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (xrayResultsMatch && xrayResultsMatch[2]) {
        structured.examination_results.test_results.x_ray_results = xrayResultsMatch[2].trim();
      }
    }
    
    if (markdown.includes('Drug Screen')) {
      const drugDoneMatch = markdown.match(/Drug Screen<\/td>\s*<td>\[(x| )\]<\/td>/);
      structured.examination_results.test_results.drug_screen_test = drugDoneMatch && drugDoneMatch[1] === 'x';
      
      const drugResultsMatch = markdown.match(/Drug Screen<\/td>\s*<td>\[(x| )\]<\/td>\s*<td>(.*?)<\/td>/);
      if (drugResultsMatch && drugResultsMatch[2]) {
        structured.examination_results.test_results.drug_screen_results = drugResultsMatch[2].trim();
      }
    }
    
    // Extract restrictions
    if (markdown.includes('**Heights**:')) structured.restrictions.heights = true;
    if (markdown.includes('**Confined Spaces**:')) structured.restrictions.confined_spaces = true;
    if (markdown.includes('**Dust Exposure**:')) structured.restrictions.dust_exposure = true;
    if (markdown.includes('**Chemical Exposure**:')) structured.restrictions.chemical_exposure = true;
    if (markdown.includes('**Motorized Equipment**:')) structured.restrictions.motorized_equipment = true;
    if (markdown.includes('**Wear Spectacles**:')) structured.restrictions.wear_spectacles = true;
    if (markdown.includes('**Wear Hearing Protection**:')) structured.restrictions.wear_hearing_protection = true;
    if (markdown.includes('**Remain on Treatment for Chronic Conditions**:')) structured.restrictions.chronic_conditions = true;
    
    // Extract fitness declaration
    if (markdown.includes('<th>FIT</th>') && markdown.match(/FIT<\/th>[\s\S]*?\[x\]/)) {
      structured.certification.fit = true;
    }
    if (markdown.includes('<th>Fit with Restriction</th>') && markdown.match(/Fit with Restriction<\/th>[\s\S]*?\[x\]/)) {
      structured.certification.fit_with_restrictions = true;
    }
    if (markdown.includes('<th>Fit with Condition</th>') && markdown.match(/Fit with Condition<\/th>[\s\S]*?\[x\]/)) {
      structured.certification.fit_with_condition = true;
    }
    if (markdown.includes('<th>Temporary Unfit</th>') && markdown.match(/Temporary Unfit<\/th>[\s\S]*?\[x\]/)) {
      structured.certification.temporarily_unfit = true;
    }
    if (markdown.includes('<th>UNFIT</th>') && markdown.match(/UNFIT<\/th>[\s\S]*?\[x\]/)) {
      structured.certification.unfit = true;
    }
    
    // Extract referred or follow up actions
    const followUpMatch = markdown.match(/Referred or follow up actions:(.*?)(?=\n|\r|$|<)/);
    if (followUpMatch && followUpMatch[1]) structured.certification.follow_up = followUpMatch[1].trim();
    
    // Extract review date
    const reviewDateMatch = markdown.match(/Review Date:(.*?)(?=\n|\r|$|<)/);
    if (reviewDateMatch && reviewDateMatch[1]) structured.certification.review_date = reviewDateMatch[1].trim();
    
    // Extract comments
    const commentsMatch = markdown.match(/Comments:(.*?)(?=\n\n|\r\n\r\n|$)/s);
    if (commentsMatch && commentsMatch[1]) structured.certification.comments = commentsMatch[1].trim();
    
    return { structured_data: structured };
  };
  
  // Try to get structured data from the extractedData
  let data;
  
  // First check if we have structured_data directly
  if (extractedData?.structured_data) {
    console.log("Using existing structured_data");
    data = extractedData;
  } 
  // Then check if we have it in the extractedData.extracted_data object
  else if (extractedData?.extracted_data?.structured_data) {
    console.log("Using structured_data from extracted_data");
    data = extractedData.extracted_data;
  }
  // Then try to parse from raw_response
  else if (extractedData?.extracted_data?.raw_response) {
    console.log("Parsing from raw_response");
    data = parseFromMarkdown(extractedData.extracted_data);
  }
  // Finally check if the extractedData itself is the raw_response
  else if (extractedData?.raw_response) {
    console.log("Parsing from direct raw_response");
    data = parseFromMarkdown(extractedData);
  }
  // If nothing worked, use the extractedData as is
  else {
    console.log("Using default data handling");
    data = { structured_data: {} };
    
    // Try to get the highest level object that might contain our data
    if (typeof extractedData === 'object' && extractedData !== null) {
      data.structured_data = extractedData;
    }
  }
  
  console.log("Final data structure used:", data);
  
  // Extract data based on expected structure from API response
  const structured_data = data?.structured_data || {};
  
  // Get the main sections from the data
  const patient = structured_data.patient || {};
  const examination = structured_data.examination_results || structured_data.medical_details || {};
  const restrictions = structured_data.restrictions || {};
  const certification = structured_data.certification || structured_data.fitness_assessment || {};
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
      done: isChecked(testResults.vision_test) || isChecked(testResults.far_near_vision),
      results: getValue(testResults, 'vision_results') || getValue(testResults, 'far_near_vision_results')
    },
    sideDepth: {
      done: isChecked(testResults.side_depth_test) || isChecked(testResults.peripheral_vision),
      results: getValue(testResults, 'side_depth_results') || getValue(testResults, 'peripheral_vision_results')
    },
    nightVision: {
      done: isChecked(testResults.night_vision_test),
      results: getValue(testResults, 'night_vision_results')
    },
    hearing: {
      done: isChecked(testResults.hearing_test),
      results: getValue(testResults, 'hearing_test_results')
    },
    heights: {
      done: isChecked(testResults.heights_test) || isChecked(testResults.working_at_heights),
      results: getValue(testResults, 'heights_results') || getValue(testResults, 'working_at_heights_results')
    },
    lungFunction: {
      done: isChecked(testResults.lung_function_test) || isChecked(testResults.pulmonary_function),
      results: getValue(testResults, 'lung_function_results') || getValue(testResults, 'pulmonary_function_results')
    },
    xRay: {
      done: isChecked(testResults.x_ray_test) || isChecked(testResults.chest_x_ray),
      results: getValue(testResults, 'x_ray_results') || getValue(testResults, 'chest_x_ray_results')
    },
    drugScreen: {
      done: isChecked(testResults.drug_screen_test),
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
    chronicConditions: isChecked(restrictions.chronic_conditions)
  };
  
  // Determine examination type
  const examinationType = {
    preEmployment: isChecked(examination.pre_employment) || isChecked(examination.type?.pre_employment),
    periodical: isChecked(examination.periodical) || isChecked(examination.type?.periodical),
    exit: isChecked(examination.exit) || isChecked(examination.type?.exit)
  };
  
  return (
    
    <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black">
      {/* Add console logging to help debugging */}
      {console.log("Certificate Data:", {
        patient,
        examination,
        restrictions,
        certification,
        testResults,
        medicalTests,
        restrictionsData,
        fitnessStatus,
        examinationType
      })}
      
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
              Dr. {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mpishi'} / Practice No: {getValue(examination, 'practice_number') || '0404160'} / Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'} / Practice No: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}
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
                  <span className="border-b border-gray-400 flex-1">{getValue(examination, 'date') || getValue(data, 'examination_date')}</span>
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
                    <td className={`border border-gray-400 p-2 text-center ${restrictionsData.confinedSpaces ? 'bg-yellow-
