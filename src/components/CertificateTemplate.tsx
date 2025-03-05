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

// Extract data from the API response
const extractDataFromResponse = (response: any) => {
  console.log("Extracting data from API response");
  
  // Initialize the structured data object
  const structuredData = {
    patient: {
      name: "",
      id_number: "",
      company: "",
      occupation: ""
    },
    dates: {
      examination_date: "",
      expiry_date: ""
    },
    examination_type: {
      pre_employment: false,
      periodical: false,
      exit: false
    },
    medical_tests: {
      bloods: { done: false, results: "" },
      far_near_vision: { done: false, results: "" },
      side_depth: { done: false, results: "" },
      night_vision: { done: false, results: "" },
      hearing: { done: false, results: "" },
      heights: { done: false, results: "" },
      lung_function: { done: false, results: "" },
      x_ray: { done: false, results: "" },
      drug_screen: { done: false, results: "" }
    },
    referral: {
      actions: "",
      review_date: ""
    },
    restrictions: {
      heights: false,
      dust_exposure: false,
      motorized_equipment: false,
      hearing_protection: false,
      confined_spaces: false,
      chemical_exposure: false,
      wear_spectacles: false,
      chronic_conditions: false
    },
    fitness_status: {
      fit: false,
      fit_with_restriction: false,
      fit_with_condition: false,
      temporarily_unfit: false,
      unfit: false
    },
    comments: ""
  };

  // Get the markdown content from the response
  let markdown = "";
  if (response && response.event_message) {
    try {
      // Try to extract the markdown from the event_message JSON
      const match = response.event_message.match(/Response:\s*(\{.*\})/s);
      if (match && match[1]) {
        const parsedData = JSON.parse(match[1]);
        if (parsedData.data && parsedData.data.markdown) {
          markdown = parsedData.data.markdown;
          console.log("Successfully extracted markdown from event_message");
        }
      }
    } catch (error) {
      console.error("Error parsing event_message:", error);
    }
  }

  if (!markdown && response.data && response.data.markdown) {
    markdown = response.data.markdown;
    console.log("Using markdown directly from response.data");
  }

  if (!markdown) {
    console.error("No markdown found in the response");
    return structuredData;
  }

  console.log("Parsing markdown content");

  // Extract patient information - handle both markdown and plain text formats
  const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i) || 
                    markdown.match(/Initials & Surname:\s*(.*?)(?=\n|\r|$)/i);
  if (nameMatch && nameMatch[1]) {
    structuredData.patient.name = nameMatch[1].trim();
  }

  const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i) || 
                  markdown.match(/ID NO:\s*(.*?)(?=\n|\r|$)/i);
  if (idMatch && idMatch[1]) {
    structuredData.patient.id_number = idMatch[1].trim();
  }

  const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i) || 
                       markdown.match(/Company Name:\s*(.*?)(?=\n|\r|$)/i);
  if (companyMatch && companyMatch[1]) {
    structuredData.patient.company = companyMatch[1].trim();
  }

  // Extract job title - handle various formats
  const jobTitleMatch = markdown.match(/Job Title:\s*(.*?)(?=\n|\r|$)/i) || 
                        markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$)/i) ||
                        markdown.match(/TECHNICIAN|TEC\s*HAI\s*TIA/i);
  if (jobTitleMatch && jobTitleMatch[1]) {
    structuredData.patient.occupation = jobTitleMatch[1].trim();
  } else if (jobTitleMatch) {
    structuredData.patient.occupation = "Technician"; // Default if only the word is found
  }

  // Extract dates - handle both markdown and plain text formats
  const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i) || 
                        markdown.match(/Date of Examination:\s*(.*?)(?=\n|\r|$)/i);
  if (examDateMatch && examDateMatch[1]) {
    structuredData.dates.examination_date = examDateMatch[1].trim();
  }

  const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i) || 
                          markdown.match(/Expiry Date:\s*(.*?)(?=\n|\r|$)/i);
  if (expiryDateMatch && expiryDateMatch[1]) {
    structuredData.dates.expiry_date = expiryDateMatch[1].trim();
  }

  // Extract examination type - handle various checkbox formats and OCR variations
  // Look for PRE-EMPLOYMENT with any mark or indication
  structuredData.examination_type.pre_employment = 
    (markdown.includes("PRE-EMPLOYMENT") || markdown.includes("PRE EMPLOYMENT")) && 
    (markdown.match(/PRE[\s-]EMPLOYMENT[\s\S]*?\[(x|X|✓|√|v)\]/) || 
     markdown.match(/\[(x|X|✓|√|v)\][\s\S]*?PRE[\s-]EMPLOYMENT/) ||
     markdown.match(/PRE[\s-]EMPLOYMENT[\s\S]*?checked/) ||
     markdown.match(/PRE[\s-]EMPLOYMENT[\s\S]*?marked/));
  
  // Look for PERIODICAL with any mark or indication
  structuredData.examination_type.periodical = 
    markdown.includes("PERIODICAL") && 
    (markdown.match(/PERIODICAL[\s\S]*?\[(x|X|✓|√|v)\]/) || 
     markdown.match(/\[(x|X|✓|√|v)\][\s\S]*?PERIODICAL/) ||
     markdown.match(/PERIODICAL[\s\S]*?checked/) ||
     markdown.match(/PERIODICAL[\s\S]*?marked/));
  
  // Look for EXIT with any mark or indication, including OCR variations like "CE"
  structuredData.examination_type.exit = 
    (markdown.includes("EXIT") || markdown.includes("CE")) && 
    (markdown.match(/EXIT[\s\S]*?\[(x|X|✓|√|v)\]/) || 
     markdown.match(/\[(x|X|✓|√|v)\][\s\S]*?EXIT/) ||
     markdown.match(/EXIT[\s\S]*?checked/) ||
     markdown.match(/EXIT[\s\S]*?marked/) ||
     markdown.match(/CE[\s\S]*?marked/));

  // Extract medical tests - handle various checkbox formats and OCR variations
  const extractTestResults = (testName: string, markdown: string) => {
    // Create a flexible regex that can handle various formats of the test name
    const testNameVariations = testName.replace(/\s+/g, '\\s*').replace(/&/g, '[&]');
    const regex = new RegExp(`${testNameVariations}[\\s\\S]*?\\[(x|X|✓|√|v| )\\][\\s\\S]*?([^\\n|]*?)(?=\\n|\\r|$)`, 'i');
    
    // Also try to match without explicit checkbox notation (for OCR variations)
    const altRegex = new RegExp(`${testNameVariations}[\\s\\S]*?(done|performed|completed)[\\s\\S]*?([^\\n|]*?)(?=\\n|\\r|$)`, 'i');
    
    const match = markdown.match(regex) || markdown.match(altRegex);
    
    if (match) {
      // Check if the checkbox contains x, X, ✓, √, v or if "done" is mentioned
      const isDone = /[xX✓√v]/.test(match[1]) || /done|performed|completed/i.test(match[1]);
      return {
        done: isDone,
        results: match[2] ? match[2].trim() : ""
      };
    }
    
    // Special case for OCR results that might not follow the pattern
    if (markdown.includes(testName) && 
        (markdown.includes(`${testName} done`) || 
         markdown.includes(`${testName} performed`) || 
         markdown.includes(`${testName} completed`))) {
      return {
        done: true,
        results: ""
      };
    }
    
    return { done: false, results: "" };
  };

  // Extract each test result
  structuredData.medical_tests.bloods = extractTestResults("BLOODS", markdown);
  structuredData.medical_tests.far_near_vision = extractTestResults("FAR, NEAR VISION", markdown);
  structuredData.medical_tests.side_depth = extractTestResults("SIDE & DEPTH", markdown);
  structuredData.medical_tests.night_vision = extractTestResults("NIGHT VISION", markdown);
  structuredData.medical_tests.hearing = extractTestResults("Hearing", markdown);
  structuredData.medical_tests.heights = extractTestResults("Working at Heights", markdown);
  structuredData.medical_tests.lung_function = extractTestResults("Lung Function", markdown);
  structuredData.medical_tests.x_ray = extractTestResults("X-Ray", markdown);
  structuredData.medical_tests.drug_screen = extractTestResults("Drug Screen", markdown);

  // Extract referral information
  const referralMatch = markdown.match(/Referred or follow up actions:\s*(.*?)(?=\n|\r|$)/i);
  if (referralMatch && referralMatch[1]) {
    structuredData.referral.actions = referralMatch[1].trim();
  }

  const reviewDateMatch = markdown.match(/Review Date:\s*(.*?)(?=\n|\r|$)/i);
  if (reviewDateMatch && reviewDateMatch[1]) {
    structuredData.referral.review_date = reviewDateMatch[1].trim();
  }

  // Extract restrictions - handle various checkbox formats and OCR variations
  const checkRestriction = (restrictionName: string) => {
    // Create a flexible regex for the restriction name
    const restrictionNameVariations = restrictionName.replace(/\s+/g, '\\s*');
    
    // Look for the restriction name near a checkbox or any indication of selection
    const regex = new RegExp(
      `${restrictionNameVariations}[\\s\\S]*?\\[(x|X|✓|√|v)\\]|` +
      `\\[(x|X|✓|√|v)\\][\\s\\S]*?${restrictionNameVariations}|` +
      `${restrictionNameVariations}[\\s\\S]*?(selected|checked|marked|applied)`, 'i'
    );
    
    return regex.test(markdown);
  };

  structuredData.restrictions.heights = checkRestriction("Heights");
  structuredData.restrictions.dust_exposure = checkRestriction("Dust Exposure");
  structuredData.restrictions.motorized_equipment = checkRestriction("Motorized Equipment");
  structuredData.restrictions.hearing_protection = checkRestriction("Wear Hearing Protection");
  structuredData.restrictions.confined_spaces = checkRestriction("Confined Spaces");
  structuredData.restrictions.chemical_exposure = checkRestriction("Chemical Exposure");
  structuredData.restrictions.wear_spectacles = checkRestriction("Wear Spectacles");
  structuredData.restrictions.chronic_conditions = checkRestriction("Remain on Treatment for Chronic Conditions");

  // Extract fitness status - handle various checkbox formats and OCR variations
  // For FIT status, we need to check if the word "FIT" appears alone (not as part of another status)
  const fitPattern = /\bFIT\b(?!.*with)/i;
  
  structuredData.fitness_status.fit = 
    fitPattern.test(markdown) && 
    (markdown.match(/FIT[\s\S]*?\[(x|X|✓|√|v)\]|[\s\S]*?FIT[\s\S]*?\[(x|X|✓|√|v)\]/i) ||
     markdown.match(/FIT[\s\S]*?(selected|checked|marked)/i));
  
  structuredData.fitness_status.fit_with_restriction = 
    (markdown.includes("Fit with Restriction") || markdown.includes("Fit with Restrictions")) && 
    (markdown.match(/Fit with Restriction[\s\S]*?\[(x|X|✓|√|v)\]|[\s\S]*?Fit with Restriction[\s\S]*?\[(x|X|✓|√|v)\]/i) ||
     markdown.match(/Fit with Restriction[\s\S]*?(selected|checked|marked)/i));
  
  structuredData.fitness_status.fit_with_condition = 
    markdown.includes("Fit with Condition") && 
    (markdown.match(/Fit with Condition[\s\S]*?\[(x|X|✓|√|v)\]|[\s\S]*?Fit with Condition[\s\S]*?\[(x|X|✓|√|v)\]/i) ||
     markdown.match(/Fit with Condition[\s\S]*?(selected|checked|marked)/i));
  
  structuredData.fitness_status.temporarily_unfit = 
    (markdown.includes("Temporary Unfit") || markdown.includes("Temporarily Unfit")) && 
    (markdown.match(/Temporary Unfit[\s\S]*?\[(x|X|✓|√|v)\]|[\s\S]*?Temporary Unfit[\s\S]*?\[(x|X|✓|√|v)\]/i) ||
     markdown.match(/Temporary Unfit[\s\S]*?(selected|checked|marked)/i));
  
  structuredData.fitness_status.unfit = 
    markdown.includes("UNFIT") && 
    (markdown.match(/UNFIT[\s\S]*?\[(x|X|✓|√|v)\]|[\s\S]*?UNFIT[\s\S]*?\[(x|X|✓|√|v)\]/i) ||
     markdown.match(/UNFIT[\s\S]*?(selected|checked|marked)/i));

  // Extract comments
  const commentsMatch = markdown.match(/Comments:\s*(.*?)(?=\n\n|\r\r|$)/is);
  if (commentsMatch && commentsMatch[1]) {
    structuredData.comments = commentsMatch[1].trim();
  }

  console.log("Extracted structured data:", structuredData);
  return structuredData;
};

  // Process the extracted data
  const processedData = extractDataFromResponse(extractedData);

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
                Dr. MJ Mphuthi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            {/* Employee Details Section */}
            <div className="px-4 space-y-4 mb-4">
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Initials & Surname:</span>
                    <span className="border-b border-gray-400 flex-1">{processedData.patient.name}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <span className="border-b border-gray-400 flex-1">{processedData.patient.id_number}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <span className="border-b border-gray-400 flex-1">{processedData.patient.company}</span>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <span className="border-b border-gray-400 flex-1">{processedData.dates.examination_date}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <span className="border-b border-gray-400 flex-1">{processedData.dates.expiry_date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <span className="border-b border-gray-400 flex-1">{processedData.patient.occupation}</span>
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
                      {processedData.examination_type.pre_employment ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {processedData.examination_type.periodical ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {processedData.examination_type.exit ? '✓' : ''}
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
                          <th className="border border-gray-400 py-1 w-1/3 text-left pl-2 bg-blue-50 text-sm">Test</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">BLOODS</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.bloods.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.bloods.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.far_near_vision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.far_near_vision.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.side_depth.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.side_depth.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.night_vision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.night_vision.results}
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
                            {processedData.medical_tests.hearing.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.hearing.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.heights.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.heights.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.lung_function.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.lung_function.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.x_ray.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.x_ray.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {processedData.medical_tests.drug_screen.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {processedData.medical_tests.drug_screen.results}
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
                  {processedData.referral.actions}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">{processedData.referral.review_date}</span>
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
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Heights</div>
                        {processedData.restrictions.heights && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.dust_exposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Dust Exposure</div>
                        {processedData.restrictions.dust_exposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.motorized_equipment ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Motorized Equipment</div>
                        {processedData.restrictions.motorized_equipment && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.hearing_protection ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Hearing Protection</div>
                        {processedData.restrictions.hearing_protection && <div className="text-xs">✓</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.confined_spaces ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Confined Spaces</div>
                        {processedData.restrictions.confined_spaces && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.chemical_exposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Chemical Exposure</div>
                        {processedData.restrictions.chemical_exposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.wear_spectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Spectacles</div>
                        {processedData.restrictions.wear_spectacles && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${processedData.restrictions.chronic_conditions ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Remain on Treatment for Chronic Conditions</div>
                        {processedData.restrictions.chronic_conditions && <div className="text-xs">✓</div>}
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
                      <td className={`border border-gray-400 p-3 text-center ${processedData.fitness_status.fit ? 'bg-green-100' : ''}`}>
                        <div className="font-semibold text-sm">FIT</div>
                        {processedData.fitness_status.fit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${processedData.fitness_status.fit_with_restriction ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Restriction</div>
                        {processedData.fitness_status.fit_with_restriction && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${processedData.fitness_status.fit_with_condition ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Condition</div>
                        {processedData.fitness_status.fit_with_condition && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${processedData.fitness_status.temporarily_unfit ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">Temporary Unfit</div>
                        {processedData.fitness_status.temporarily_unfit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${processedData.fitness_status.unfit ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">UNFIT</div>
                        {processedData.fitness_status.unfit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comments Section */}
            <div className="px-4 mb-6">
              <div className="font-semibold text-sm mb-1">Comments:</div>
              <div className="border-b border-gray-400 min-h-[2rem]">
                {processedData.comments}
              </div>
            </div>
            
            {/* Signature Section */}
            <div className="px-4 mb-4">
              <div className="text-center text-xs mb-2">
                Occupational Health Practitioner / Occupational Medical Practitioner
              </div>
              
              <div className="flex justify-between items-end">
                <div className="w-1/3">
                  <div className="text-xs mb-1">Dr MJ Mphuthi / Practice No. 0404160</div>
                  <div className="text-xs">Sr. Sibongile Mahlangu</div>
                  <div className="text-xs">SANC No: 14262133; SASOHN No: AR 2136 / MBCHB DOH</div>
                  <div className="text-xs">Practice Number: 999 088 0000 8177 91</div>
                  
                  <div className="mt-4 border-t border-gray-400 pt-1 text-center">
                    <div className="text-xs font-semibold">SIGNATURE</div>
                  </div>
                </div>
                
                <div className="w-1/3">
                  <div className="border border-gray-400 h-24 flex items-center justify-center">
                    <div className="text-xs text-gray-400">STAMP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </ScrollArea>
  );
};

export default CertificateTemplate;
