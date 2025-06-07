import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrganizationLogo from "./OrganizationLogo";

type CertificateTemplateProps = {
  extractedData: any;
  documentId?: string;
  editable?: boolean;
  onDataChange?: (data: any) => void;
};

const CertificateTemplate = ({
  extractedData,
  documentId,
  editable = false,
  onDataChange
}: CertificateTemplateProps) => {
  const [editableData, setEditableData] = useState<any>(null);

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

    return extracted;
  };

  const normalizeExtractedDataForTemplate = (extractedData: any): any => {
    console.log("Normalizing extracted data for template:", extractedData);
    
    // Handle the case where data comes from document processing
    let sourceData = extractedData;
    
    // If we have structured_data wrapper, use that
    if (extractedData?.structured_data) {
      sourceData = extractedData.structured_data;
    }
    
    // If we have certificate_info from document processing, map it properly
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
      return sourceData;
    }
    
    // Try to extract from raw_content if available
    const rawContent = extractedData?.raw_content || 
                      extractedData?.structured_data?.raw_content ||
                      extractedData?.extracted_data?.raw_content;
    
    if (rawContent && typeof rawContent === 'string') {
      return extractDataFromMarkdown(rawContent);
    }
    
    // Return empty structure if no valid data found
    return {
      patient: { name: '', id_number: '', company: '', occupation: '' },
      examination_results: { 
        date: '', 
        type: { pre_employment: false, periodical: false, exit: false },
        test_results: {}
      },
      certification: {
        examination_date: '',
        valid_until: '',
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
  };

  // Initialize editable data state
  useEffect(() => {
    console.log("CertificateTemplate received data:", extractedData);
    
    if (extractedData) {
      const normalizedData = normalizeExtractedDataForTemplate(extractedData);
      console.log("Normalized data:", normalizedData);
      
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
      console.log('Calling onDataChange with:', newData);
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

  console.log("Data to render in template:", dataToRender);

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
  const organization = extractedData?.organization || {};
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
                          <th className="border border-gray-400 py-1 w-1/2 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm font-medium bg-gray-100">BLOODS</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.bloods.done, 'examination_results.test_results.bloods_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.bloods.results === 'N/A' ? '' : medicalTests.bloods.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.bloods_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.bloods.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm font-medium bg-gray-100">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.farNearVision.done, 'examination_results.test_results.far_near_vision_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.farNearVision.results === 'N/A' ? '' : medicalTests.farNearVision.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.far_near_vision_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.farNearVision.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm font-medium bg-gray-100">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.sideDepth.done, 'examination_results.test_results.side_depth_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.sideDepth.results === 'N/A' ? '' : medicalTests.sideDepth.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.side_depth_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.sideDepth.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm font-medium bg-gray-100">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.nightVision.done, 'examination_results.test_results.night_vision_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.nightVision.results === 'N/A' ? '' : medicalTests.nightVision.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.night_vision_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.nightVision.results}
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
                            {renderCheckbox(medicalTests.hearing.done, 'examination_results.test_results.hearing_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.hearing.results === 'N/A' ? '' : medicalTests.hearing.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.hearing_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.hearing.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.heights.done, 'examination_results.test_results.heights_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.heights.results === 'N/A' ? '' : medicalTests.heights.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.heights_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.heights.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.lungFunction.done, 'examination_results.test_results.lung_function_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.lungFunction.results === 'N/A' ? '' : medicalTests.lungFunction.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.lung_function_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.lungFunction.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.xRay.done, 'examination_results.test_results.x_ray_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.xRay.results === 'N/A' ? '' : medicalTests.xRay.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.x_ray_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.xRay.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {renderCheckbox(medicalTests.drugScreen.done, 'examination_results.test_results.drug_screen_done')}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.drugScreen.results === 'N/A' ? '' : medicalTests.drugScreen.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.drug_screen_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.drugScreen.results}
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