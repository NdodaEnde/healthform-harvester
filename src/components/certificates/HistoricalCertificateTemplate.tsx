import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type HistoricalCertificateTemplateProps = {
  extractedData: any;
  documentId?: string;
  editable?: boolean;
  onDataChange?: (data: any) => void;
};

const HistoricalCertificateTemplate = ({
  extractedData,
  documentId,
  editable = false,
  onDataChange
}: HistoricalCertificateTemplateProps) => {
  const [editableData, setEditableData] = useState<any>(null);

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

  const isChecked = (value: any, trueValues: string[] = ['yes', 'true', 'checked', '1', 'x']) => {
    if (value === undefined || value === null) return false;
    const stringValue = String(value).toLowerCase().trim();
    return trueValues.includes(stringValue);
  };

  // Enhanced normalize function to handle microservice structure
const normalizeExtractedDataForTemplate = (extractedData: any): any => {
  if (!extractedData) return {
    patient: { name: '', id_number: '', company: '', occupation: '' },
    examination_results: { 
      date: '', 
      type: { pre_employment: false, periodical: false, exit: false },
      test_results: {}
    },
    certification: {
      examination_date: '',
      valid_until: '',
      stamp_date: '',
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

  // Handle the microservice structure (your working version)
  let sourceData = extractedData;
  
  // If we have structured_data wrapper, use that
  if (extractedData?.structured_data) {
    sourceData = extractedData.structured_data;
  }

  // NEW: Handle microservice structure with employee_info and medical_examination
  if (sourceData?.employee_info || sourceData?.medical_examination) {
    const empInfo = sourceData.employee_info || {};
    const medExam = sourceData.medical_examination || {};
    const medTests = sourceData.medical_tests || {};
    const medPractitioner = sourceData.medical_practitioner || {};
    
    console.log('Processing microservice structure:', {
      empInfo,
      medExam,
      medTests,
      medPractitioner
    });

    // Map medical tests from microservice format to template format
    const testResults = {};
    if (medTests) {
      // Blood test
      if (medTests.blood_test) {
        testResults.bloods_done = medTests.blood_test.performed || false;
        testResults.bloods_results = medTests.blood_test.result || 'N/A';
      }
      
      // Vision tests
      if (medTests.vision_test) {
        testResults.far_near_vision_done = medTests.vision_test.performed || false;
        testResults.far_near_vision_results = medTests.vision_test.result || 'N/A';
      }
      
      if (medTests.side_depth_test) {
        testResults.side_depth_done = medTests.side_depth_test.performed || false;
        testResults.side_depth_results = medTests.side_depth_test.result || 'N/A';
      }
      
      if (medTests.night_vision) {
        testResults.night_vision_done = medTests.night_vision.performed || false;
        testResults.night_vision_results = medTests.night_vision.result || 'N/A';
      }
      
      // Other tests
      if (medTests.hearing_test) {
        testResults.hearing_done = medTests.hearing_test.performed || false;
        testResults.hearing_results = medTests.hearing_test.result || 'N/A';
      }
      
      if (medTests.heights_test) {
        testResults.heights_done = medTests.heights_test.performed || false;
        testResults.heights_results = medTests.heights_test.result || 'N/A';
      }
      
      if (medTests.lung_function) {
        testResults.lung_function_done = medTests.lung_function.performed || false;
        testResults.lung_function_results = medTests.lung_function.result || 'N/A';
      }
      
      if (medTests.x_ray) {
        testResults.x_ray_done = medTests.x_ray.performed || false;
        testResults.x_ray_results = medTests.x_ray.result || 'N/A';
      }
      
      if (medTests.drug_screen) {
        testResults.drug_screen_done = medTests.drug_screen.performed || false;
        testResults.drug_screen_results = medTests.drug_screen.result || 'N/A';
      }
    }

    // Map examination type
    const examinationType = {
      pre_employment: medExam.examination_type === 'PRE-EMPLOYMENT',
      periodical: medExam.examination_type === 'PERIODICAL', 
      exit: medExam.examination_type === 'EXIT'
    };

    // Map fitness status
    const fitnessStatus = medExam.fitness_status || 'UNKNOWN';
    const fitness = {
      fit: fitnessStatus === 'FIT',
      fit_with_restrictions: fitnessStatus === 'FIT_WITH_RESTRICTIONS',
      fit_with_condition: fitnessStatus === 'FIT_WITH_CONDITION',
      temporarily_unfit: fitnessStatus === 'TEMPORARILY_UNFIT',
      unfit: fitnessStatus === 'UNFIT'
    };

    // Map work restrictions
    const restrictions = medExam.work_restrictions || {};

    return {
      patient: {
        name: empInfo.full_name || '',
        id_number: empInfo.id_number || '',
        company: empInfo.company_name || '',
        occupation: empInfo.job_title || ''
      },
      examination_results: {
        date: medExam.examination_date || '',
        type: examinationType,
        test_results: testResults
      },
      certification: {
        examination_date: medExam.examination_date || '',
        valid_until: medExam.expiry_date || '',
        stamp_date: medExam.examination_date || '',
        fit: fitness.fit,
        fit_with_restrictions: fitness.fit_with_restrictions,
        fit_with_condition: fitness.fit_with_condition,
        temporarily_unfit: fitness.temporarily_unfit,
        unfit: fitness.unfit,
        comments: medExam.comments || '',
        follow_up: medExam.follow_up_actions || '',
        review_date: medExam.review_date || ''
      },
      restrictions: {
        heights: restrictions.heights || false,
        dust_exposure: restrictions.dust_exposure || false,
        motorized_equipment: restrictions.motorized_equipment || false,
        wear_hearing_protection: restrictions.wear_hearing_protection || false,
        confined_spaces: restrictions.confined_spaces || false,
        chemical_exposure: restrictions.chemical_exposure || false,
        wear_spectacles: restrictions.wear_spectacles || false,
        chronic_conditions: restrictions.chronic_conditions || false
      }
    };
  }
  
  // Handle existing certificate_info structure (platform version)
  if (sourceData?.certificate_info) {
    const certInfo = sourceData.certificate_info;
    
    return {
      patient: {
        name: certInfo.employee_name || '',
        id_number: certInfo.id_number || '',
        company: certInfo.company_name || '',
        occupation: certInfo.job_title || ''
      },
      examination_results: {
        date: certInfo.examination_date || '',
        type: {
          pre_employment: certInfo.pre_employment_checked || false,
          periodical: certInfo.periodical_checked || false,
          exit: certInfo.exit_checked || false
        },
        test_results: certInfo.medical_tests || {}
      },
      certification: {
        examination_date: certInfo.examination_date || '',
        valid_until: certInfo.expiry_date || '',
        stamp_date: certInfo.examination_date || '',
        fit: certInfo.fitness_status?.fit || false,
        fit_with_restrictions: certInfo.fitness_status?.fit_with_restrictions || false,
        fit_with_condition: certInfo.fitness_status?.fit_with_condition || false,
        temporarily_unfit: certInfo.fitness_status?.temporarily_unfit || false,
        unfit: certInfo.fitness_status?.unfit || false,
        comments: certInfo.comments || '',
        follow_up: certInfo.follow_up || '',
        review_date: certInfo.review_date || ''
      },
      restrictions: certInfo.restrictions || {}
    };
  }
  
  // If data is already in the right structure, return as-is
  if (sourceData?.patient || sourceData?.examination_results || sourceData?.certification) {
    // Ensure stamp_date is set to examination_date if not present
    if (sourceData.certification && !sourceData.certification.stamp_date) {
      sourceData.certification.stamp_date = sourceData.certification.examination_date || sourceData.examination_results?.date || '';
    }
    return sourceData;
  }
  
  return sourceData;
};

  // Initialize editable data state
  useEffect(() => {
    if (extractedData) {
      const normalizedData = normalizeExtractedDataForTemplate(extractedData);
      if (editable) {
        setEditableData(normalizedData);
      }
    }
  }, [extractedData, editable]);

  // Handle field changes in editable mode
  const handleFieldChange = (path: string, value: any) => {
    if (!editable || !editableData) return;
    
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(editableData));
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditableData(newData);
    
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (path: string, checked: boolean) => {
    handleFieldChange(path, checked);
  };

  // Use editable data if in edit mode, otherwise normalize and use extracted data
  const dataToRender = editable && editableData ? 
    editableData : 
    normalizeExtractedDataForTemplate(extractedData);

  const patient = dataToRender.patient || {};
  const examination = dataToRender.examination_results || {};
  const restrictions = dataToRender.restrictions || {};
  const certification = dataToRender.certification || {};
  const testResults = examination.test_results || {};

  const fitnessStatus = {
    fit: isChecked(certification.fit),
    fitWithRestriction: isChecked(certification.fit_with_restrictions),
    fitWithCondition: isChecked(certification.fit_with_condition),
    temporarilyUnfit: isChecked(certification.temporarily_unfit),
    unfit: isChecked(certification.unfit)
  };

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

  // Extract organization information for signatures and stamps
  const physician = 'MJ Mphuthi';
  const practiceNumber = '0404160';
  const nurse = 'Sibongile Mahlangu';
  const nurseNumber = '999 088 0000 8177 91';

  // Helper function to render field (editable input or static text)
  const renderField = (value: string, path: string, className: string = "") => {
    if (editable) {
      return (
        <Input
          value={value || ''}
          onChange={(e) => handleFieldChange(path, e.target.value)}
          className={`border-0 border-b border-gray-400 rounded-none bg-transparent px-1 py-0 h-auto text-sm focus:border-blue-500 focus:ring-0 ${className}`}
        />
      );
    }
    return <span className={`${className}`}>{value || 'Not Provided'}</span>;
  };

  // Helper function to render checkbox
  const renderCheckbox = (checked: boolean, path: string) => {
    if (editable) {
      return (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => handleCheckboxChange(path, e.target.checked)}
          className="w-4 h-4"
        />
      );
    }
    return checked ? '✓' : '';
  };

  return (
    <ScrollArea className="h-full">
      <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black">
        <div className="relative overflow-hidden">
          <div className="absolute top-[47%] inset-x-0 flex items-center justify-center opacity-40 pointer-events-none" aria-hidden="true">
            <img 
              src="/lovable-uploads/ead30039-3558-4ae0-a3ec-c58d8755a311.png" 
              alt="BlueCollar Health & Wellness" 
              className="w-[83%] h-[83%] object-contain"
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
            
            {/* Patient Information Section */}
            <div className="px-4 space-y-4 mb-4">
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Initials & Surname:</span>
                    <div className="border-b border-gray-400 flex-1">
                      {renderField(patient.name, 'patient.name')}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <div className="border-b border-gray-400 flex-1">
                      {renderField(patient.id_number, 'patient.id_number')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <div className="border-b border-gray-400 flex-1">
                  {renderField(patient.company, 'patient.company')}
                </div>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <div className="border-b border-gray-400 flex-1">
                      {renderField(examination.date || certification.examination_date, 'examination_results.date')}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <div className="border-b border-gray-400 flex-1">
                      {renderField(certification.valid_until, 'certification.valid_until')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <div className="border-b border-gray-400 flex-1">
                  {renderField(patient.occupation, 'patient.occupation')}
                </div>
              </div>
            </div>
            
            {/* Examination Type Table */}
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
                      {renderCheckbox(examinationType.preEmployment, 'examination_results.type.pre_employment')}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {renderCheckbox(examinationType.periodical, 'examination_results.type.periodical')}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {renderCheckbox(examinationType.exit, 'examination_results.type.exit')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Medical Tests Section */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
              </div>
              
              <div className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Table */}
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
                          <td className="border border-gray-400 pl-2 text-sm">BLOODS</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.bloods_done, 'examination_results.test_results.bloods_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.bloods_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.bloods_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.bloods_results || '')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.far_near_vision_done, 'examination_results.test_results.far_near_vision_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.far_near_vision_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.far_near_vision_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.far_near_vision_results || '')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.side_depth_done, 'examination_results.test_results.side_depth_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.side_depth_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.side_depth_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.side_depth_results || '')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.night_vision_done, 'examination_results.test_results.night_vision_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.night_vision_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.night_vision_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.night_vision_results || '')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Right Table */}
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
                            {renderCheckbox(testResults.hearing_done, 'examination_results.test_results.hearing_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.hearing_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.hearing_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.hearing_results || '')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.heights_done, 'examination_results.test_results.heights_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.heights_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.heights_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.heights_results || '')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.lung_function_done, 'examination_results.test_results.lung_function_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.lung_function_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.lung_function_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.lung_function_results || '')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.x_ray_done, 'examination_results.test_results.x_ray_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.x_ray_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.x_ray_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.x_ray_results || '')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(testResults.drug_screen_done, 'examination_results.test_results.drug_screen_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={testResults.drug_screen_results || ''}
                                onChange={(e) => handleFieldChange('examination_results.test_results.drug_screen_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : (testResults.drug_screen_results || '')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Follow-up Actions */}
            <div className="px-4 mb-4">
              <div className="flex items-center">
                <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
                <div className="border-b border-gray-400 flex-1">
                  {renderField(certification.follow_up || '', 'certification.follow_up')}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">
                      {renderField(certification.review_date || '', 'certification.review_date', 'text-red-600')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Restrictions Section */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-xs font-semibold mb-2">
                Restrictions:
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400 text-sm">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Heights</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.heights, 'restrictions.heights')}
                        </div>
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.dustExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Dust Exposure</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.dustExposure, 'restrictions.dust_exposure')}
                        </div>
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.motorizedEquipment ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Motorized Equipment</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.motorizedEquipment, 'restrictions.motorized_equipment')}
                        </div>
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.hearingProtection ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Wear Hearing Protection</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.hearingProtection, 'restrictions.wear_hearing_protection')}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.confinedSpaces ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Confined Spaces</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.confinedSpaces, 'restrictions.confined_spaces')}
                        </div>
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.chemicalExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Chemical Exposure</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.chemicalExposure, 'restrictions.chemical_exposure')}
                        </div>
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.wearSpectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Wear Spectacles</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.wearSpectacles, 'restrictions.wear_spectacles')}
                        </div>
                      </td>
                      <td className={`border border-gray-400 p-1 text-center ${restrictionsData.chronicConditions ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs font-medium">Remain on Treatment</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictionsData.chronicConditions, 'restrictions.remain_on_treatment_for_chronic_conditions')}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Fitness Assessment Section */}
            <div className="mb-2">
              <div className="bg-gray-800 text-white text-center py-1 text-xs font-semibold mb-1">
                Medical Fitness Declaration
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400">
                  <tbody>
                    <tr>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.fit ? 'bg-green-100' : ''}`}>
                        <div className="text-xs">FIT</div>
                        <div className="text-green-600 text-sm">
                          {renderCheckbox(fitnessStatus.fit, 'certification.fit')}
                        </div>
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.fitWithRestriction ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Fit with Restriction</div>
                        <div className="text-yellow-600 text-sm">
                          {renderCheckbox(fitnessStatus.fitWithRestriction, 'certification.fit_with_restrictions')}
                        </div>
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.fitWithCondition ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Fit with Condition</div>
                        <div className="text-yellow-600 text-sm">
                          {renderCheckbox(fitnessStatus.fitWithCondition, 'certification.fit_with_condition')}
                        </div>
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.temporarilyUnfit ? 'bg-red-100' : ''}`}>
                        <div className="text-xs">Temporary Unfit</div>
                        <div className="text-red-600 text-sm">
                          {renderCheckbox(fitnessStatus.temporarilyUnfit, 'certification.temporarily_unfit')}
                        </div>
                      </th>
                      <th className={`border border-gray-400 p-1 text-center ${fitnessStatus.unfit ? 'bg-red-100' : ''}`}>
                        <div className="text-xs">UNFIT</div>
                        <div className="text-red-600 text-sm">
                          {renderCheckbox(fitnessStatus.unfit, 'certification.unfit')}
                        </div>
                      </th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comments Section */}
            <div className="px-4 mb-1">
              <div className="font-semibold text-xs mb-0.5">Comments:</div>
              <div className="border border-gray-400 p-1 min-h-8 text-xs">
                {editable ? (
                  <Input
                    value={certification.comments || ''}
                    onChange={(e) => handleFieldChange('certification.comments', e.target.value)}
                    className="border-0 bg-transparent px-1 py-0 h-auto text-xs w-full"
                  />
                ) : (certification.comments || 'N/A')}
              </div>
            </div>
            
            {/* Historical Signature and Stamp Section */}
            <div className="px-4 mb-3">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="max-w-56">
                    <div className="min-h-16 flex items-center justify-center">
                      <img 
                        src="/lovable-uploads/signature-image.png" 
                        alt="Historical Signature" 
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
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
                  <div className="max-w-56 ml-auto">
                    <div className="min-h-16 flex items-center justify-center relative">
                      <img 
                        src="/lovable-uploads/stamp-image.png" 
                        alt="Historical Stamp" 
                        className="max-h-16 w-auto object-contain"
                      />
                      {/* Overlay date on stamp */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center mt-2">
                          {editable ? (
                            <Input
                              value={certification.stamp_date || certification.examination_date || ''}
                              onChange={(e) => handleFieldChange('certification.stamp_date', e.target.value)}
                              className="border-0 bg-transparent px-1 py-0 h-auto text-xs font-bold text-center w-20 focus:bg-white focus:bg-opacity-70"
                              placeholder="DD-MM-YYYY"
                            />
                          ) : (
                            <span className="text-xs font-bold text-black">
                              {certification.stamp_date || certification.examination_date || ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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

export default HistoricalCertificateTemplate;
