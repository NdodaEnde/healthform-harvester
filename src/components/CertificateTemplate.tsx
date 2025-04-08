import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type CertificateTemplateProps = {
  extractedData: any;
};

const CertificateTemplate = ({
  extractedData
}: CertificateTemplateProps) => {
  useEffect(() => {
    console.log("CertificateTemplate received data:", extractedData);
  }, [extractedData]);

  const isChecked = (value: any, trueValues: string[] = ['yes', 'true', 'checked', '1', 'x']) => {
    if (value === undefined || value === null) return false;
    const stringValue = String(value).toLowerCase().trim();
    return trueValues.includes(stringValue);
  };

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

    extracted.examination_results.type.pre_employment = markdown.includes('**Pre-Employment**: [x]') || markdown.match(/PRE-EMPLOYMENT.*?\[\s*x\s*\]/is) !== null;
    extracted.examination_results.type.periodical = markdown.includes('**Periodical**: [x]') || markdown.match(/PERIODICAL.*?\[\s*x\s*\]/is) !== null;
    extracted.examination_results.type.exit = markdown.includes('**Exit**: [x]') || markdown.match(/EXIT.*?\[\s*x\s*\]/is) !== null;

    const testsMap = [{
      name: 'BLOODS',
      key: 'bloods'
    }, {
      name: 'FAR, NEAR VISION',
      key: 'far_near_vision'
    }, {
      name: 'SIDE & DEPTH',
      key: 'side_depth'
    }, {
      name: 'NIGHT VISION',
      key: 'night_vision'
    }, {
      name: 'Hearing',
      key: 'hearing'
    }, {
      name: 'Working at Heights',
      key: 'heights'
    }, {
      name: 'Lung Function',
      key: 'lung_function'
    }, {
      name: 'X-Ray',
      key: 'x_ray'
    }, {
      name: 'Drug Screen',
      key: 'drug_screen'
    }];
    
    testsMap.forEach(test => {
      const tableRegex = new RegExp(`\\| ${test.name}\\s*\\| \\[(x| )\\]\\s*\\| (.*?)\\|`, 'is');
      const tableMatch = markdown.match(tableRegex);
      const listRegex = new RegExp(`${test.name}.*?\\[(x| )\\].*?(\\d+\\/\\d+|Normal|N\\/A|\\d+-\\d+)`, 'is');
      const listMatch = markdown.match(listRegex);
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

    const fitnessOptions = [{
      name: 'FIT',
      key: 'fit'
    }, {
      name: 'Fit with Restriction',
      key: 'fit_with_restrictions'
    }, {
      name: 'Fit with Condition',
      key: 'fit_with_condition'
    }, {
      name: 'Temporary Unfit',
      key: 'temporarily_unfit'
    }, {
      name: 'UNFIT',
      key: 'unfit'
    }];
    
    fitnessOptions.forEach(option => {
      const patterns = [
        new RegExp(`\\*\\*${option.name}\\*\\*: \\[(x| )\\]`, 'is'), 
        new RegExp(`<th>${option.name}</th>[\\s\\S]*?<td>\\[(x| )\\]</td>`, 'is'), 
        new RegExp(`\\| ${option.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];

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

    const restrictions = [{
      name: 'Heights',
      key: 'heights'
    }, {
      name: 'Dust Exposure',
      key: 'dust_exposure'
    }, {
      name: 'Motorized Equipment',
      key: 'motorized_equipment'
    }, {
      name: 'Wear Hearing Protection',
      key: 'wear_hearing_protection'
    }, {
      name: 'Confined Spaces',
      key: 'confined_spaces'
    }, {
      name: 'Chemical Exposure',
      key: 'chemical_exposure'
    }, {
      name: 'Wear Spectacles',
      key: 'wear_spectacles'
    }, {
      name: 'Remain on Treatment for Chronic Conditions',
      key: 'remain_on_treatment_for_chronic_conditions'
    }];
    
    restrictions.forEach(restriction => {
      const patterns = [
        new RegExp(`\\*\\*${restriction.name}\\*\\*: \\[(x| )\\]`, 'is'), 
        new RegExp(`<td>${restriction.name}</td>\\s*<td>\\[(x| )\\]</td>`, 'is'), 
        new RegExp(`\\| ${restriction.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];

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

    const followUpMatch = markdown.match(/Referred or follow up actions:(.*?)(?=\n|\r|$|<)/i);
    if (followUpMatch && followUpMatch[1]) extracted.certification.follow_up = followUpMatch[1].trim();
    const reviewDateMatch = markdown.match(/Review Date:(.*?)(?=\n|\r|$|<)/i);
    if (reviewDateMatch && reviewDateMatch[1]) extracted.certification.review_date = reviewDateMatch[1].trim();
    const commentsMatch = markdown.match(/Comments:(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
    if (commentsMatch && commentsMatch[1]) {
      let comments = commentsMatch[1].trim();
      if (comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "N/A" || comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "") {
        extracted.certification.comments = "N/A";
      } else {
        extracted.certification.comments = comments;
      }
    }
    console.log("Extracted data from markdown:", extracted);
    return extracted;
  };

  const getMarkdown = (data: any): string | null => {
    if (!data) return null;
    console.log("Attempting to extract markdown from data structure");

    const possiblePaths = ['raw_response.data.markdown', 'extracted_data.raw_response.data.markdown', 'markdown', 'raw_markdown'];
    for (const path of possiblePaths) {
      const value = getValue(data, path);
      if (value && typeof value === 'string') {
        console.log(`Found markdown at path: ${path}`);
        return value;
      }
    }

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

    if (data.structured_data && data.structured_data.raw_content) {
      console.log("Found structured_data.raw_content, using as markdown");
      return data.structured_data.raw_content;
    }
    console.log("Could not find markdown in provided data");
    return null;
  };

  let structuredData: any = {};

  if (extractedData?.structured_data) {
    console.log("Using existing structured_data");
    structuredData = extractedData.structured_data;
  } else if (extractedData?.extracted_data?.structured_data) {
    console.log("Using structured_data from extracted_data");
    structuredData = extractedData.extracted_data.structured_data;
  } else {
    const markdown = getMarkdown(extractedData);
    if (markdown) {
      console.log("Extracting from markdown content");
      structuredData = extractDataFromMarkdown(markdown);
    } else {
      console.log("No markdown found, using extractedData as is");
      structuredData = extractedData || {};
    }
  }

  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || structuredData.medical_details || {};
  const restrictions = structuredData.restrictions || {};
  const certification = structuredData.certification || structuredData.fitness_assessment || {};
  const testResults = examination.test_results || examination.tests || {};

  const fitnessStatus = {
    fit: isChecked(certification.fit_for_duty) || isChecked(certification.fit),
    fitWithRestriction: isChecked(certification.fit_with_restrictions),
    fitWithCondition: isChecked(certification.fit_with_condition),
    temporarilyUnfit: isChecked(certification.temporarily_unfit),
    unfit: isChecked(certification.permanently_unfit) || isChecked(certification.unfit)
  };

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

  const examinationType = {
    preEmployment: isChecked(examination.pre_employment) || isChecked(examination.type?.pre_employment),
    periodical: isChecked(examination.periodical) || isChecked(examination.type?.periodical),
    exit: isChecked(examination.exit) || isChecked(examination.type?.exit)
  };

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
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none" aria-hidden="true">
            <span className="text-8xl font-bold tracking-widest text-gray-400 rotate-45">
              OCCUPATIONAL HEALTH
            </span>
          </div>
          
          <div className="relative z-10">
            <div className="px-4 pt-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <img 
                    src="/lovable-uploads/b75ebd30-51c1-441a-8b04-eec2746a7ebd.png" 
                    alt="BlueCollar Health & Wellness Logo" 
                    className="h-20 object-contain"
                  />
                </div>
                <div className="bg-white text-right">
                  <div className="text-sm font-bold bg-gray-800 text-white px-3 py-1 text-right">BLUECOLLAR OCCUPATIONAL HEALTH</div>
                  <div className="text-[0.65rem] mt-1 px-3 text-black text-right">Tel: +27 11 892 0771/011 892 0627</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">Email: admin@bluecollarhealth.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">office@bluecollarhealth.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">135 Leeuwpoort Street, Boksburg South, Boksburg</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 text-white text-center py-2 mb-2">
              <h2 className="text-lg font-bold">CERTIFICATE OF FITNESS</h2>
            </div>
            
            <div className="text-center text-xs px-4 mb-3">
              <p>
                Dr. {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mphuthi'} / Practice No: {getValue(examination, 'practice_number') || '0404160'} / Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'} / Practice No: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}
              </p>
              <p>certify that the following employee:</p>
            </div>
            
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
            
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                Restrictions:
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400 text-sm">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Heights</div>
                        {restrictionsData.heights && <div className="text-[0.6rem]">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.dustExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Dust Exposure</div>
                        {restrictionsData.dustExposure && <div className="text-[0.6rem]">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.motorizedEquipment ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Motorized Equipment</div>
                        {restrictionsData.motorizedEquipment && <div className="text-[0.6rem]">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.hearingProtection ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Wear Hearing Protection</div>
                        {restrictionsData.hearingProtection && <div className="text-[0.6rem]">✓</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.confinedSpaces ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Confined Spaces</div>
                        {restrictionsData.confinedSpaces && <div className="text-[0.6rem]">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.chemicalExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Chemical Exposure</div>
                        {restrictionsData.chemicalExposure && <div className="text-[0.6rem]">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.wearSpectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Wear Spectacles</div>
                        {restrictionsData.wearSpectacles && <div className="text-[0.6rem]">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.chronicConditions ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Remain on Treatment</div>
                        {restrictionsData.chronicConditions && <div className="text-[0.6rem]">✓</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Moved Fitness Assessment to be before Comments section */}
            <div className="mb-2">
              <div className="bg-gray-800 text-white text-center py-1 text-xs font-semibold mb-1">
                FITNESS ASSESSMENT
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400">
                  <tbody>
                    <tr>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.fit ? 'bg-green-100' : ''}`}>
                        <div className="text-xs">FIT</div>
                        {fitnessStatus.fit && <div className="text-green-600 text-sm">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.fitWithRestriction ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Fit with Restriction</div>
                        {fitnessStatus.fitWithRestriction && <div className="text-yellow-600 text-sm">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.fitWithCondition ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Fit with Condition</div>
                        {fitnessStatus.fitWithCondition && <div className="text-yellow-600 text-sm">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.temporarilyUnfit ? 'bg-red-100' : ''}`}>
                        <div className="text-xs">Temporary Unfit</div>
                        {fitnessStatus.temporarilyUnfit && <div className="text-red-600 text-sm">✓</div>}
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.unfit ? 'bg-red-100' : ''}`}>
                        <div className="text-xs">UNFIT</div>
                        {fitnessStatus.unfit && <div className="text-red-600 text-sm">✓</div>}
                      </th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Moved Comments section to be the last section before the signature */}
            <div className="px-4 mb-1">
              <div className="font-semibold text-xs mb-0.5">Comments:</div>
              <div className="border border-gray-400 p-1 min-h-8 text-xs">
                {getValue(certification, 'comments')}
              </div>
            </div>
            
            <div className="px-4 mb-3">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56">
                    <div className="text-center font-semibold text-[0.6rem]">SIGNATURE</div>
                  </div>
                </div>
                
                <div className="flex-1 px-2 flex justify-center">
                  <div className="w-fit max-w-md text-center">
                    <p className="text-[0.6rem] leading-tight font-semibold">Occupational Health Practitioner / Occupational Medical Practitioner</p>
                    <p className="text-[0.6rem] leading-tight italic">Dr {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mphuthi'} / Practice No. {getValue(examination, 'practice_number') || '0404160'}</p>
                    <p className="text-[0.6rem] leading-tight">Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'}</p>
                    <p className="text-[0.6rem] leading-tight">SANC No: 14262133; SASOHN No: AR 2136</p>
                    <p className="text-[0.6rem] leading-tight">Practice Number: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}</p>
                  </div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56 ml-auto">
                    <div className="text-center font-semibold text-[0.6rem]">STAMP</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 text-white text-center px-1 text-[0.55rem] leading-none py-1 mt-2">
              © {new Date().getFullYear()} BlueCollar Health & Wellness
            </div>
          </div>
        </div>
      </Card>
    </ScrollArea>
  );
};

export default CertificateTemplate;