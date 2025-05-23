import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrganizationLogo from "./OrganizationLogo";

type CertificateTemplateProps = {
  extractedData: any;
  documentId?: string;
  editable?: boolean;
};

const CertificateTemplate = ({
  extractedData,
  documentId,
  editable = false
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

  // Enhanced extraction function that handles your specific data structure
  const extractCertificateData = (data: any): any => {
    console.log("Starting certificate data extraction...");
    
    // Initialize the result structure
    const result = {
      patient: {
        name: '',
        id_number: '',
        company: '',
        occupation: ''
      },
      examination_results: {
        date: '',
        type: {
          pre_employment: false,
          periodical: false,
          exit: false
        },
        test_results: {}
      },
      certification: {
        valid_until: '',
        examination_date: '',
        fit: false,
        fit_with_restrictions: false,
        fit_with_condition: false,
        temporarily_unfit: false,
        unfit: false,
        comments: '',
        follow_up: '',
        review_date: ''
      },
      restrictions: {}
    };

    // First, try to get data from the structured_data.certificate_info if it exists
    const certificateInfo = getValue(data, 'structured_data.certificate_info') || 
                           getValue(data, 'extracted_data.structured_data.certificate_info') ||
                           getValue(data, 'certificate_info');

    if (certificateInfo) {
      console.log("Found certificate_info:", certificateInfo);
      
      // Map the certificate_info fields to our result structure
      result.patient.name = getValue(certificateInfo, 'employee_name') || '';
      result.patient.id_number = getValue(certificateInfo, 'id_number') || '';
      result.patient.company = getValue(certificateInfo, 'company_name') || '';
      result.patient.occupation = getValue(certificateInfo, 'job_title') || '';
      
      result.examination_results.date = getValue(certificateInfo, 'examination_date') || '';
      result.certification.examination_date = getValue(certificateInfo, 'examination_date') || '';
      result.certification.valid_until = getValue(certificateInfo, 'expiry_date') || '';
      
      // Map examination type
      result.examination_results.type.pre_employment = getValue(certificateInfo, 'pre_employment_checked') === true;
      result.examination_results.type.periodical = getValue(certificateInfo, 'periodical_checked') === true;
      result.examination_results.type.exit = getValue(certificateInfo, 'exit_checked') === true;
      
      // Map medical tests if available
      const medicalTests = getValue(certificateInfo, 'medical_tests');
      if (medicalTests && typeof medicalTests === 'object') {
        result.examination_results.test_results = medicalTests;
      }
    }

    // Next, try to extract from raw_content if we have it
    const rawContent = getValue(data, 'raw_content') || 
                      getValue(data, 'structured_data.raw_content') ||
                      getValue(data, 'extracted_data.raw_content') ||
                      getValue(data, 'extracted_data.structured_data.raw_content');

    if (rawContent && typeof rawContent === 'string') {
      console.log("Found raw_content, extracting additional data...");
      const enhancedData = extractDataFromMarkdown(rawContent);
      
      // Merge enhanced data, but don't overwrite existing good data
      if (!result.patient.name && enhancedData.patient?.name) {
        result.patient.name = enhancedData.patient.name;
      }
      if (!result.patient.id_number && enhancedData.patient?.id_number) {
        result.patient.id_number = enhancedData.patient.id_number;
      }
      if (!result.patient.company && enhancedData.patient?.company) {
        result.patient.company = enhancedData.patient.company;
      }
      if (!result.patient.occupation && enhancedData.patient?.occupation) {
        result.patient.occupation = enhancedData.patient.occupation;
      }
      
      // Merge examination data
      if (enhancedData.examination_results) {
        if (!result.examination_results.date && enhancedData.examination_results.date) {
          result.examination_results.date = enhancedData.examination_results.date;
          result.certification.examination_date = enhancedData.examination_results.date;
        }
        
        if (enhancedData.examination_results.type) {
          Object.keys(enhancedData.examination_results.type).forEach(key => {
            if (enhancedData.examination_results.type[key] === true) {
              result.examination_results.type[key] = true;
            }
          });
        }
        
        if (enhancedData.examination_results.test_results) {
          result.examination_results.test_results = {
            ...result.examination_results.test_results,
            ...enhancedData.examination_results.test_results
          };
        }
      }
      
      // Merge certification data
      if (enhancedData.certification) {
        if (!result.certification.valid_until && enhancedData.certification.valid_until) {
          result.certification.valid_until = enhancedData.certification.valid_until;
        }
        
        // Merge fitness status
        Object.keys(enhancedData.certification).forEach(key => {
          if (enhancedData.certification[key] === true) {
            result.certification[key] = true;
          } else if (enhancedData.certification[key] && !result.certification[key]) {
            result.certification[key] = enhancedData.certification[key];
          }
        });
      }
      
      // Merge restrictions
      if (enhancedData.restrictions) {
        result.restrictions = {
          ...result.restrictions,
          ...enhancedData.restrictions
        };
      }
    }

    console.log("Final extracted certificate data:", result);
    return result;
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

    // Extract patient information with more flexible patterns
    const namePatterns = [
      /Initials\s*&?\s*Surname:\s*([^\n\r]+)/i,
      /Employee[:\s]*([^\n\r]+)/i,
      /Name[:\s]*([^\n\r]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        extracted.patient.name = match[1].trim();
        break;
      }
    }

    const idPatterns = [
      /ID\s*No:?\s*([^\n\r]+)/i,
      /ID\s*Number:?\s*([^\n\r]+)/i,
      /Identity:?\s*([^\n\r]+)/i
    ];
    
    for (const pattern of idPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        extracted.patient.id_number = match[1].trim();
        break;
      }
    }

    const companyPatterns = [
      /Company\s*Name:\s*([^\n\r]+)/i,
      /Employer:\s*([^\n\r]+)/i,
      /Organization:\s*([^\n\r]+)/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        extracted.patient.company = match[1].trim();
        break;
      }
    }

    const jobPatterns = [
      /Job\s*Title:\s*([^\n\r]+)/i,
      /Position:\s*([^\n\r]+)/i,
      /Occupation:\s*([^\n\r]+)/i
    ];
    
    for (const pattern of jobPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        extracted.patient.occupation = match[1].trim();
        break;
      }
    }

    // Extract dates
    const examDatePatterns = [
      /Date\s*of\s*Examination:\s*([^\n\r]+)/i,
      /Examination\s*Date:\s*([^\n\r]+)/i,
      /Date\s*Examined:\s*([^\n\r]+)/i
    ];
    
    for (const pattern of examDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        extracted.examination_results.date = match[1].trim();
        break;
      }
    }

    const expiryPatterns = [
      /Expiry\s*Date:\s*([^\n\r]+)/i,
      /Valid\s*Until:\s*([^\n\r]+)/i,
      /Expires:\s*([^\n\r]+)/i
    ];
    
    for (const pattern of expiryPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        extracted.certification.valid_until = match[1].trim();
        break;
      }
    }

    // Extract examination type with more flexible patterns
    extracted.examination_results.type.pre_employment = 
      /PRE-?EMPLOYMENT[^[\]]*\[\s*[xX✓]\s*\]/i.test(markdown) ||
      /PRE-?EMPLOYMENT[^[\]]*:\s*[xX✓]/i.test(markdown);
      
    extracted.examination_results.type.periodical = 
      /PERIODICAL[^[\]]*\[\s*[xX✓]\s*\]/i.test(markdown) ||
      /PERIODICAL[^[\]]*:\s*[xX✓]/i.test(markdown);
      
    extracted.examination_results.type.exit = 
      /EXIT[^[\]]*\[\s*[xX✓]\s*\]/i.test(markdown) ||
      /EXIT[^[\]]*:\s*[xX✓]/i.test(markdown);

    // Extract medical test results with more flexible patterns
    const testsMap = [
      { names: ['BLOODS', 'BLOOD TEST', 'BLOOD WORK'], key: 'bloods' },
      { names: ['FAR, NEAR VISION', 'VISION TEST', 'EYE TEST'], key: 'far_near_vision' },
      { names: ['SIDE & DEPTH', 'PERIPHERAL VISION'], key: 'side_depth' },
      { names: ['NIGHT VISION'], key: 'night_vision' },
      { names: ['HEARING', 'AUDIOMETRY'], key: 'hearing' },
      { names: ['WORKING AT HEIGHTS', 'HEIGHTS'], key: 'heights' },
      { names: ['LUNG FUNCTION', 'SPIROMETRY'], key: 'lung_function' },
      { names: ['X-RAY', 'CHEST X-RAY'], key: 'x_ray' },
      { names: ['DRUG SCREEN', 'DRUG TEST'], key: 'drug_screen' }
    ];
    
    testsMap.forEach(test => {
      let isDone = false;
      let results = '';
      
      for (const testName of test.names) {
        // Try various patterns for each test name
        const patterns = [
          new RegExp(`${testName}[^|]*\\|[^|]*([xX✓])[^|]*\\|[^|]*([^|\\n\\r]+)`, 'i'),
          new RegExp(`${testName}[^:]*:[^:]*([xX✓])[^:]*:[^:]*([^:\\n\\r]+)`, 'i'),
          new RegExp(`<td[^>]*>${testName}[^<]*</td>[^<]*<td[^>]*>([xX✓])[^<]*</td>[^<]*<td[^>]*>([^<]+)</td>`, 'i')
        ];
        
        for (const pattern of patterns) {
          const match = markdown.match(pattern);
          if (match) {
            isDone = match[1] && /[xX✓]/.test(match[1]);
            results = match[2] ? match[2].trim() : '';
            break;
          }
        }
        
        if (isDone || results) break;
      }
      
      if (isDone || results) {
        extracted.examination_results.test_results[`${test.key}_done`] = isDone;
        extracted.examination_results.test_results[`${test.key}_results`] = results;
      }
    });

    // Extract fitness status
    const fitnessOptions = [
      { names: ['FIT'], key: 'fit' },
      { names: ['FIT WITH RESTRICTION', 'FIT WITH RESTRICTIONS'], key: 'fit_with_restrictions' },
      { names: ['FIT WITH CONDITION'], key: 'fit_with_condition' },
      { names: ['TEMPORARY UNFIT', 'TEMPORARILY UNFIT'], key: 'temporarily_unfit' },
      { names: ['UNFIT', 'PERMANENTLY UNFIT'], key: 'unfit' }
    ];
    
    fitnessOptions.forEach(option => {
      let isSelected = false;
      
      for (const optionName of option.names) {
        const patterns = [
          new RegExp(`${optionName}[^|\\[]*\\[[^\\]]*[xX✓][^\\]]*\\]`, 'i'),
          new RegExp(`<th[^>]*>${optionName}[^<]*</th>[\\s\\S]*?<td[^>]*>\\[[^\\]]*[xX✓][^\\]]*\\]</td>`, 'i'),
          new RegExp(`\\|[^|]*${optionName}[^|]*\\|[^|]*\\[[^\\]]*[xX✓][^\\]]*\\]`, 'i')
        ];

        for (const pattern of patterns) {
          const match = markdown.match(pattern);
          if (match) {
            isSelected = true;
            break;
          }
        }
        
        if (isSelected) break;
      }
      
      extracted.certification[option.key] = isSelected;
    });

    // Extract restrictions
    const restrictions = [
      { names: ['HEIGHTS'], key: 'heights' },
      { names: ['DUST EXPOSURE'], key: 'dust_exposure' },
      { names: ['MOTORIZED EQUIPMENT'], key: 'motorized_equipment' },
      { names: ['WEAR HEARING PROTECTION', 'HEARING PROTECTION'], key: 'wear_hearing_protection' },
      { names: ['CONFINED SPACES'], key: 'confined_spaces' },
      { names: ['CHEMICAL EXPOSURE'], key: 'chemical_exposure' },
      { names: ['WEAR SPECTACLES', 'SPECTACLES'], key: 'wear_spectacles' },
      { names: ['REMAIN ON TREATMENT FOR CHRONIC CONDITIONS', 'CHRONIC CONDITIONS'], key: 'remain_on_treatment_for_chronic_conditions' }
    ];
    
    restrictions.forEach(restriction => {
      let isSelected = false;
      
      for (const restrictionName of restriction.names) {
        const patterns = [
          new RegExp(`${restrictionName}[^|\\[]*\\[[^\\]]*[xX✓][^\\]]*\\]`, 'i'),
          new RegExp(`<td[^>]*>${restrictionName}[^<]*</td>[^<]*<td[^>]*>\\[[^\\]]*[xX✓][^\\]]*\\]</td>`, 'i'),
          new RegExp(`\\|[^|]*${restrictionName}[^|]*\\|[^|]*\\[[^\\]]*[xX✓][^\\]]*\\]`, 'i')
        ];

        for (const pattern of patterns) {
          const match = markdown.match(pattern);
          if (match) {
            isSelected = true;
            break;
          }
        }
        
        if (isSelected) break;
      }
      
      extracted.restrictions[restriction.key] = isSelected;
    });

    // Extract additional information - UPDATED SECTION
    // Improved follow up action extraction
    const followUpPatterns = [
      /Referred\s+or\s+follow\s+up\s+actions:?\s*([^<\n\r]+)/i,
      /Follow\s+up\s+actions:?\s*([^<\n\r]+)/i,
      /Referred:?\s*([^<\n\r]+)/i
    ];
    
    for (const pattern of followUpPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        const cleanedText = match[1].trim().replace(/<\/td>.*$/, '');
        extracted.certification.follow_up = cleanedText === "N/A" ? "N/A" : cleanedText;
        break;
      }
    }

    // Improved review date extraction
    const reviewDatePatterns = [
      /Review\s+Date:?\s*([^<\n\r]+)/i,
      /Next\s+Review:?\s*([^<\n\r]+)/i,
      /Follow\s+up\s+Date:?\s*([^<\n\r]+)/i
    ];
    
    for (const pattern of reviewDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        const cleanedText = match[1].trim().replace(/<\/td>.*$/, '').replace(/<\/tr>.*$/, '');
        extracted.certification.review_date = cleanedText;
        break;
      }
    }

    // As a fallback, try to find the review date in the raw text
    if (!extracted.certification.review_date || extracted.certification.review_date.includes('<')) {
      const rawReviewMatch = markdown.match(/Review\s+Date:?\s*([^\n<]+)/i);
      if (rawReviewMatch && rawReviewMatch[1]) {
        extracted.certification.review_date = rawReviewMatch[1].trim();
      } else {
        extracted.certification.review_date = '';
      }
    }

    // Fallback for follow up if it contains HTML
    if (!extracted.certification.follow_up || extracted.certification.follow_up.includes('<')) {
      const rawFollowUpMatch = markdown.match(/follow\s+up\s+actions:?\s*([^\n<]+)/i);
      if (rawFollowUpMatch && rawFollowUpMatch[1]) {
        extracted.certification.follow_up = rawFollowUpMatch[1].trim();
      } else {
        extracted.certification.follow_up = '';
      }
    }

    // Comments extraction - keeping this as is
    const commentsMatch = markdown.match(/Comments:\s*([^<\n\r]+)/i);
    if (commentsMatch && commentsMatch[1]) {
      let comments = commentsMatch[1].trim();
      extracted.certification.comments = comments === "N/A" ? "N/A" : comments;
    }

    console.log("Extracted data from markdown:", extracted);
    return extracted;
  };

  // Log detailed structure to debug extraction issues
  console.log("Full extracted data structure received:", JSON.stringify(extractedData, null, 2));

  // Use the enhanced extraction function
  const structuredData = extractCertificateData(extractedData);

  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || {};
  const restrictions = structuredData.restrictions || {};
  const certification = structuredData.certification || {};
  const testResults = examination.test_results || {};

  const fitnessStatus = {
    fit: isChecked(certification.fit),
    fitWithRestriction: isChecked(certification.fit_with_restrictions),
    fitWithCondition: isChecked(certification.fit_with_condition),
    temporarilyUnfit: isChecked(certification.temporarily_unfit),
    unfit: isChecked(certification.unfit)
  };

  const medicalTests = {
    bloods: {
      done: isChecked(testResults.bloods_done),
      results: getValue(testResults, 'bloods_results', 'N/A')
    },
    farNearVision: {
      done: isChecked(testResults.far_near_vision_done),
      results: getValue(testResults, 'far_near_vision_results', 'N/A')
    },
    sideDepth: {
      done: isChecked(testResults.side_depth_done),
      results: getValue(testResults, 'side_depth_results', 'N/A')
    },
    nightVision: {
      done: isChecked(testResults.night_vision_done),
      results: getValue(testResults, 'night_vision_results', 'N/A')
    },
    hearing: {
      done: isChecked(testResults.hearing_done),
      results: getValue(testResults, 'hearing_results', 'N/A')
    },
    heights: {
      done: isChecked(testResults.heights_done),
      results: getValue(testResults, 'heights_results', 'N/A')
    },
    lungFunction: {
      done: isChecked(testResults.lung_function_done),
      results: getValue(testResults, 'lung_function_results', 'N/A')
    },
    xRay: {
      done: isChecked(testResults.x_ray_done),
      results: getValue(testResults, 'x_ray_results', 'N/A')
    },
    drugScreen: {
      done: isChecked(testResults.drug_screen_done),
      results: getValue(testResults, 'drug_screen_results', 'N/A')
    }
  };

  console.log("Medical tests data:", medicalTests);

  const restrictionsData = {
    heights: isChecked(restrictions.heights),
    dustExposure: isChecked(restrictions.dust_exposure),
    motorizedEquipment: isChecked(restrictions.motorized_equipment),
    hearingProtection: isChecked(restrictions.wear_hearing_protection),
    confinedSpaces: isChecked(restrictions.confined_spaces),
    chemicalExposure: isChecked(restrictions.chemical_exposure),
    wearSpectacles: isChecked(restrictions.wear_spectacles),
    chronicConditions: isChecked(restrictions.remain_on_treatment_for_chronic_conditions)
  };

  const examinationType = {
    preEmployment: isChecked(examination.type?.pre_employment),
    periodical: isChecked(examination.type?.periodical),
    exit: isChecked(examination.type?.exit)
  };

  console.log("Certificate template using data:", {
    name: patient.name,
    id: patient.id_number,
    company: patient.company,
    occupation: patient.occupation,
    examDate: examination.date,
    expiryDate: certification.valid_until,
    examinationType,
    fitnessStatus,
    medicalTests,
    restrictionsData
  });

  // Extract organization information for signatures and stamps
  const organization = extractedData?.organization || {};
  const physician = 'MJ Mphuthi';
  const practiceNumber = '0404160';
  const nurse = 'Sibongile Mahlangu';
  const nurseNumber = '999 088 0000 8177 91';

  return (
    <ScrollArea className="h-full">
      <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none" aria-hidden="true">
            <img 
              src="/lovable-uploads/ead30039-3558-4ae0-a3ec-c58d8755a311.png" 
              alt="BlueCollar Health & Wellness" 
              className="w-3/4 h-3/4 object-contain"
            />
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
                Dr. {physician} / Practice No: {practiceNumber} / Sr. {nurse} / Practice No: {nurseNumber}
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            <div className="px-4 space-y-4 mb-4">
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Initials & Surname:</span>
                    <span className="border-b border-gray-400 flex-1">{patient.name || 'Not Provided'}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <span className="border-b border-gray-400 flex-1">{patient.id_number || 'Not Provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <span className="border-b border-gray-400 flex-1">{patient.company || 'Not Provided'}</span>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <span className="border-b border-gray-400 flex-1">{examination.date || certification.examination_date || 'Not Provided'}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <span className="border-b border-gray-400 flex-1">{certification.valid_until || 'Not Provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <span className="border-b border-gray-400 flex-1">{patient.occupation || 'Not Provided'}</span>
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
                            {medicalTests.bloods.done ? '✓' : 'X'}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.bloods.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.farNearVision.done ? '✓' : 'X'}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.farNearVision.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.sideDepth.done ? '✓' : 'X'}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.sideDepth.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.nightVision.done ? '✓' : 'X'}
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
                          <th className="border border-gray-400 py-1 text-left pl-2 bg-blue-50 text-sm">Test</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Hearing</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.hearing.done ? '✓' : 'X'}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.hearing.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.heights.done ? '✓' : 'X'}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.heights.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.lungFunction.done ? '✓' : 'X'}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.lungFunction.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.xRay.done ? '✓' : 'X'}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.xRay.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.drugScreen.done ? '✓' : 'X'}
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
                  {certification.follow_up || ''}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">{certification.review_date || ''}</span>
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
            
            <div className="px-4 mb-1">
              <div className="font-semibold text-xs mb-0.5">Comments:</div>
              <div className="border border-gray-400 p-1 min-h-8 text-xs">
                {certification.comments || 'N/A'}
              </div>
            </div>
            
            <div className="px-4 mb-3">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56">
                    <div className="min-h-16 flex items-center justify-center">
                      <OrganizationLogo
                        variant="signature"
                        organization={organization}
                        size="lg"
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                    <div className="text-center font-semibold text-[0.6rem]">SIGNATURE</div>
                  </div>
                </div>
                
                <div className="flex-1 px-2 flex justify-center">
                  <div className="w-fit max-w-md text-center">
                    <p className="text-[0.6rem] leading-tight font-semibold">Occupational Health Practitioner / Occupational Medical Practitioner</p>
                    <p className="text-[0.6rem] leading-tight italic">Dr {physician} / Practice No. {practiceNumber}</p>
                    <p className="text-[0.6rem] leading-tight">Sr. {nurse}</p>
                    <p className="text-[0.6rem] leading-tight">SANC No: 14262133; SASOHN No: AR 2136</p>
                    <p className="text-[0.6rem] leading-tight">Practice Number: {nurseNumber}</p>
                  </div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56 ml-auto">
                    <div className="min-h-16 flex items-center justify-center">
                      <OrganizationLogo
                        variant="stamp"
                        organization={organization}
                        size="lg"
                        className="max-h-16 w-auto object-contain"
                      />
                    </div>
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
