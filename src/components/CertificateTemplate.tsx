
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
  
  // Extract data based on expected structure from API response
  const data = extractedData?.structured_data || {};
  
  // Get the main sections from the data
  const patient = data.patient || {};
  const examination = data.examination_results || data.medical_details || {};
  const restrictions = data.restrictions || {};
  const certification = data.certification || data.fitness_assessment || {};
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
          
          {/* Fitness Declaration */}
          <div className="mb-4">
            <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
              Medical Fitness Declaration
            </div>
            
            <div className="px-4">
              <table className="w-full border border-gray-400 text-sm">
                <thead>
                  <tr>
                    <th className={`border border-gray-400 py-2 px-3 text-center w-1/5 ${fitnessStatus.fit ? 'bg-green-200' : 'bg-green-100'}`}>
                      FIT
                    </th>
                    <th className={`border border-gray-400 py-2 px-3 text-center w-1/5 ${fitnessStatus.fitWithRestriction ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
                      Fit with Restriction
                    </th>
                    <th className={`border border-gray-400 py-2 px-3 text-center w-1/5 ${fitnessStatus.fitWithCondition ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
                      Fit with Condition
                    </th>
                    <th className={`border border-gray-400 py-2 px-3 text-center w-1/5 ${fitnessStatus.temporarilyUnfit ? 'bg-orange-200' : 'bg-orange-100'}`}>
                      Temporary Unfit
                    </th>
                    <th className={`border border-gray-400 py-2 px-3 text-center w-1/5 ${fitnessStatus.unfit ? 'bg-red-200' : 'bg-red-100'}`}>
                      UNFIT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 h-10 text-center">
                      {fitnessStatus.fit ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-10 text-center">
                      {fitnessStatus.fitWithRestriction ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-10 text-center">
                      {fitnessStatus.fitWithCondition ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-10 text-center">
                      {fitnessStatus.temporarilyUnfit ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-10 text-center">
                      {fitnessStatus.unfit ? '✓' : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Comments */}
          <div className="px-4 mb-6">
            <div className="flex items-center mb-1">
              <span className="font-semibold mr-1">Comments:</span>
            </div>
            <div className="border-b border-gray-400 pb-1 min-h-[2.5rem]">
              {getValue(certification, 'comments') || getValue(certification, 'notes') || getValue(certification, 'additional_comments')}
            </div>
            <div className="border-b border-gray-400 pb-1 min-h-[1.5rem]">&nbsp;</div>
          </div>
          
          {/* Signature Section */}
          <div className="px-4 mb-4">
            <div className="text-center text-xs mt-6">
              <p>Occupational Health Practitioner / Occupational Medical Practitioner</p>
              <p>Dr MJ Mpishi / Practice No: 0404160</p>
            </div>
            
            <div className="flex justify-between items-end mt-4">
              <div className="w-48 border-t border-black text-center">
                <div className="font-semibold">SIGNATURE</div>
                <div className="text-xs">
                  SANC No: 14262351, SASOHN Reg. Nr: 2136 / MBCHB DOH
                  <br />
                  Practice Number: 999 088 0000 8177 91
                </div>
              </div>
              
              <div className="w-48 text-center">
                <div className="rounded-full border border-black w-24 h-24 mx-auto mb-2"></div>
                <div className="font-semibold">STAMP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CertificateTemplate;
