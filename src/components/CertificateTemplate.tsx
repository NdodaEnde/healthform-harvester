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

  const normalizeExtractedDataForTemplate = (extractedData: any): any => {
    console.log("Normalizing extracted data for template:", extractedData);
    
    // Handle the case where data comes from document processing
    let sourceData = extractedData;
    
    // If we have structured_data wrapper, use that
    if (extractedData?.structured_data) {
      sourceData = extractedData.structured_data;
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

  const medicalTests = {
    bloods: {
      done: isChecked(testResults.bloods_done),
      results: getValue(testResults, 'bloods_results', '')
    },
    farNearVision: {
      done: isChecked(testResults.far_near_vision_done),
      results: getValue(testResults, 'far_near_vision_results', '')
    },
    sideDepth: {
      done: isChecked(testResults.side_depth_done),
      results: getValue(testResults, 'side_depth_results', '')
    },
    nightVision: {
      done: isChecked(testResults.night_vision_done),
      results: getValue(testResults, 'night_vision_results', '')
    },
    hearing: {
      done: isChecked(testResults.hearing_done),
      results: getValue(testResults, 'hearing_results', '')
    },
    heights: {
      done: isChecked(testResults.heights_done),
      results: getValue(testResults, 'heights_results', '')
    },
    lungFunction: {
      done: isChecked(testResults.lung_function_done),
      results: getValue(testResults, 'lung_function_results', '')
    },
    xRay: {
      done: isChecked(testResults.x_ray_done),
      results: getValue(testResults, 'x_ray_results', '')
    },
    drugScreen: {
      done: isChecked(testResults.drug_screen_done),
      results: getValue(testResults, 'drug_screen_results', '')
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
    return <span className={`${className}`}>{value || ''}</span>;
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
          {/* Watermark */}
          <div className="absolute top-[47%] inset-x-0 flex items-center justify-center opacity-40 pointer-events-none" aria-hidden="true">
            <img 
              src="/lovable-uploads/ead30039-3558-4ae0-a3ec-c58d8755a311.png" 
              alt="BlueCollar Health & Wellness" 
              className="w-[83%] h-[83%] object-contain"
            />
          </div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="px-4 pt-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <img 
                    src="/lovable-uploads/b75ebd30-51c1-441a-8b04-eec2746a7ebd.png" 
                    alt="BlueCollar Health & Wellness Logo" 
                    className="h-20 object-contain"
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold bg-gray-800 text-white px-3 py-1">BLUECOLLAR OCCUPATIONAL HEALTH</div>
                  <div className="text-[0.65rem] mt-1 px-3 text-black">Tel: +27 11 892 0771/ 011 892 0627</div>
                  <div className="text-[0.65rem] px-3 text-black">Email: admin@bluecollarocc.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black">office@bluecollarocc.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black">135 Leeuwpoort Street; Boksburg South; Boksburg</div>
                </div>
              </div>
            </div>
            
            {/* Title */}
            <div className="bg-gray-800 text-white text-center py-2 mb-3">
              <h2 className="text-lg font-bold">CERTIFICATE OF FITNESS</h2>
            </div>
            
            {/* Doctor certification text */}
            <div className="text-center text-xs px-4 mb-4">
              <p>
                <span className="font-semibold">Dr. {physician} / Practice No: {practiceNumber} / Sr. {nurse} / Practice No: {nurseNumber}</span>
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            {/* Patient Info Form */}
            <div className="px-4 space-y-3 mb-4">
              <div className="flex items-center">
                <span className="font-semibold text-sm mr-2">Initials & Surname:</span>
                <div className="border-b border-gray-900 flex-1 mr-8">
                  {renderField(patient.name, 'patient.name')}
                </div>
                <span className="font-semibold text-sm mr-2">ID NO:</span>
                <div className="border-b border-gray-900 w-64">
                  {renderField(patient.id_number, 'patient.id_number')}
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold text-sm mr-2">Company Name:</span>
                <div className="border-b border-gray-900 flex-1">
                  {renderField(patient.company, 'patient.company')}
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold text-sm mr-2">Date of Examination:</span>
                <div className="border-b border-gray-900 flex-1 mr-8">
                  {renderField(examination.date || certification.examination_date, 'examination_results.date')}
                </div>
                <span className="font-semibold text-sm mr-2">Expiry Date:</span>
                <div className="border-b border-gray-900 w-48">
                  {renderField(certification.valid_until, 'certification.valid_until')}
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold text-sm mr-2">Job Title:</span>
                <div className="border-b border-gray-900 flex-1">
                  {renderField(patient.occupation, 'patient.occupation')}
                </div>
              </div>
            </div>
            
            {/* Examination Type */}
            <div className="px-4 mb-4">
              <table className="w-full border border-gray-900">
                <thead>
                  <tr>
                    <th className="border border-gray-900 py-2 w-1/3 text-center bg-gray-100 text-sm font-bold">PRE-EMPLOYMENT</th>
                    <th className="border border-gray-900 py-2 w-1/3 text-center bg-gray-100 text-sm font-bold">PERIODICAL</th>
                    <th className="border border-gray-900 py-2 w-1/3 text-center bg-gray-100 text-sm font-bold">EXIT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-900 h-8 text-center">
                      {renderCheckbox(examinationType.preEmployment, 'examination_results.type.pre_employment')}
                    </td>
                    <td className="border border-gray-900 h-8 text-center">
                      {renderCheckbox(examinationType.periodical, 'examination_results.type.periodical')}
                    </td>
                    <td className="border border-gray-900 h-8 text-center">
                      {renderCheckbox(examinationType.exit, 'examination_results.type.exit')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Medical Tests Section */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-bold mb-3">
                MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
              </div>
              
              <div className="px-4">
                <div className="flex gap-4">
                  {/* Left Table */}
                  <div className="flex-1">
                    <table className="w-full border border-gray-900">
                      <thead>
                        <tr>
                          <th className="border-r border-gray-900 py-1 w-1/3 text-center bg-blue-50 text-xs font-bold">Done</th>
                          <th className="py-1 w-2/3 text-center bg-blue-50 text-xs font-bold">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border-r border-gray-900 border-b border-gray-900 pl-2 text-sm font-medium w-1/3">BLOODS</td>
                          <td className="border-b border-gray-900 text-center py-1 w-1/3">
                            {renderCheckbox(medicalTests.bloods.done, 'examination_results.test_results.bloods_done')}
                          </td>
                          <td className="border-b border-gray-900 p-1 text-sm w-1/3">
                            {editable ? (
                              <Input
                                value={medicalTests.bloods.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.bloods_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.bloods.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-900 border-b border-gray-900 pl-2 text-sm font-medium">FAR, NEAR VISION</td>
                          <td className="border-b border-gray-900 text-center py-1">
                            {renderCheckbox(medicalTests.farNearVision.done, 'examination_results.test_results.far_near_vision_done')}
                          </td>
                          <td className="border-b border-gray-900 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.farNearVision.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.far_near_vision_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.farNearVision.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-900 border-b border-gray-900 pl-2 text-sm font-medium">SIDE & DEPTH</td>
                          <td className="border-b border-gray-900 text-center py-1">
                            {renderCheckbox(medicalTests.sideDepth.done, 'examination_results.test_results.side_depth_done')}
                          </td>
                          <td className="border-b border-gray-900 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.sideDepth.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.side_depth_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.sideDepth.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-900 pl-2 text-sm font-medium">NIGHT VISION</td>
                          <td className="text-center py-1">
                            {renderCheckbox(medicalTests.nightVision.done, 'examination_results.test_results.night_vision_done')}
                          </td>
                          <td className="p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.nightVision.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.night_vision_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.nightVision.results}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Right Table */}
                  <div className="flex-1">
                    <table className="w-full border border-gray-900">
                      <thead>
                        <tr>
                          <th className="border-r border-gray-900 py-1 w-1/3 text-center bg-blue-50 text-xs font-bold">Done</th>
                          <th className="py-1 w-2/3 text-center bg-blue-50 text-xs font-bold">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border-r border-gray-900 border-b border-gray-900 pl-2 text-sm font-medium">Hearing</td>
                          <td className="border-b border-gray-900 text-center py-1">
                            {renderCheckbox(medicalTests.hearing.done, 'examination_results.test_results.hearing_done')}
                          </td>
                          <td className="border-b border-gray-900 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.hearing.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.hearing_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.hearing.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-900 border-b border-gray-900 pl-2 text-sm font-medium">Working at Heights</td>
                          <td className="border-b border-gray-900 text-center py-1">
                            {renderCheckbox(medicalTests.heights.done, 'examination_results.test_results.heights_done')}
                          </td>
                          <td className="border-b border-gray-900 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.heights.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.heights_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.heights.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-900 border-b border-gray-900 pl-2 text-sm font-medium">Lung Function</td>
                          <td className="border-b border-gray-900 text-center py-1">
                            {renderCheckbox(medicalTests.lungFunction.done, 'examination_results.test_results.lung_function_done')}
                          </td>
                          <td className="border-b border-gray-900 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.lungFunction.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.lung_function_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.lungFunction.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-900 border-b border-gray-900 pl-2 text-sm font-medium">X-Ray</td>
                          <td className="border-b border-gray-900 text-center py-1">
                            {renderCheckbox(medicalTests.xRay.done, 'examination_results.test_results.x_ray_done')}
                          </td>
                          <td className="border-b border-gray-900 p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.xRay.results}
                                onChange={(e) => handleFieldChange('examination_results.test_results.x_ray_results', e.target.value)}
                                className="border-0 bg-transparent px-1 py-0 h-auto text-xs"
                              />
                            ) : medicalTests.xRay.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-900 pl-2 text-sm font-medium">Drug Screen</td>
                          <td className="text-center py-1">
                            {renderCheckbox(medicalTests.drugScreen.done, 'examination_results.test_results.drug_screen_done')}
                          </td>
                          <td className="p-1 text-sm">
                            {editable ? (
                              <Input
                                value={medicalTests.drugScreen.results}
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
            
            {/* Follow-up Actions */}
            <div className="px-4 mb-4">
              <div className="flex items-center">
                <span className="font-semibold text-sm mr-2">Referred or follow up actions:</span>
                <div className="border-b border-gray-900 flex-1 mr-8">
                  {renderField(certification.follow_up || '', 'certification.follow_up')}
                </div>
                <span className="font-semibold text-sm mr-2 text-red-600">Review Date:</span>
                <div className="border-b border-gray-900 w-48">
                  {renderField(certification.review_date || '', 'certification.review_date')}
                </div>
              </div>
            </div>
            
            {/* Restrictions */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-bold mb-2">
                Restrictions:
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-900 text-sm">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Heights</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.heights, 'restrictions.heights')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.dustExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Dust Exposure</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.dustExposure, 'restrictions.dust_exposure')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.motorizedEquipment ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Motorized Equipment</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.motorizedEquipment, 'restrictions.motorized_equipment')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.hearingProtection ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Wear Hearing Protection</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.hearingProtection, 'restrictions.wear_hearing_protection')}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.confinedSpaces ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Confined Spaces</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.confinedSpaces, 'restrictions.confined_spaces')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.chemicalExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Chemical Exposure</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.chemicalExposure, 'restrictions.chemical_exposure')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.wearSpectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Wear Spectacles</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.wearSpectacles, 'restrictions.wear_spectacles')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-2 text-center ${restrictionsData.chronicConditions ? 'bg-yellow-100' : ''}`}>
                        <div className="text-xs">Remain on Treatment for Chronic Conditions</div>
                        <div className="mt-1">
                          {renderCheckbox(restrictionsData.chronicConditions, 'restrictions.remain_on_treatment_for_chronic_conditions')}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Medical Fitness Declaration */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-bold mb-2">
                Medical Fitness Declaration
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-900">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-900 p-3 text-center ${fitnessStatus.fit ? 'bg-green-200' : ''}`}>
                        <div className="text-sm font-bold">FIT</div>
                        <div className="mt-2">
                          {renderCheckbox(fitnessStatus.fit, 'certification.fit')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-3 text-center ${fitnessStatus.fitWithRestriction ? 'bg-blue-200' : ''}`}>
                        <div className="text-sm font-bold">Fit with Restriction</div>
                        <div className="mt-2">
                          {renderCheckbox(fitnessStatus.fitWithRestriction, 'certification.fit_with_restrictions')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-3 text-center ${fitnessStatus.fitWithCondition ? 'bg-cyan-200' : ''}`}>
                        <div className="text-sm font-bold">Fit with Condition</div>
                        <div className="mt-2">
                          {renderCheckbox(fitnessStatus.fitWithCondition, 'certification.fit_with_condition')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-3 text-center ${fitnessStatus.temporarilyUnfit ? 'bg-yellow-200' : ''}`}>
                        <div className="text-sm font-bold">Temporary Unfit</div>
                        <div className="mt-2">
                          {renderCheckbox(fitnessStatus.temporarilyUnfit, 'certification.temporarily_unfit')}
                        </div>
                      </td>
                      <td className={`border border-gray-900 p-3 text-center ${fitnessStatus.unfit ? 'bg-red-200' : ''}`}>
                        <div className="text-sm font-bold">UNFIT</div>
                        <div className="mt-2">
                          {renderCheckbox(fitnessStatus.unfit, 'certification.unfit')}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comments */}
            <div className="px-4 mb-6">
              <div className="flex items-start">
                <span className="font-semibold text-sm mr-2 mt-1">Comments:</span>
                <div className="border border-gray-900 flex-1 min-h-12 p-2">
                  {editable ? (
                    <Input
                      value={certification.comments || ''}
                      onChange={(e) => handleFieldChange('certification.comments', e.target.value)}
                      className="border-0 bg-transparent px-0 py-0 h-auto text-sm w-full"
                    />
                  ) : (certification.comments || '')}
                </div>
              </div>
            </div>
            
            {/* Signature Section */}
            <div className="px-4 mb-4">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="border-t border-gray-900 pt-2 max-w-64">
                    <div className="min-h-16 flex items-center justify-center">
                      <OrganizationLogo
                        variant="signature"
                        organization={organization}
                        size="lg"
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                    <div className="text-center font-bold text-sm mt-2">SIGNATURE</div>
                  </div>
                </div>
                
                <div className="flex-1 px-4 text-center">
                  <div className="text-xs leading-tight">
                    <p className="font-bold">Occupational Health Practitioner / Occupational Medical Practitioner</p>
                    <p className="italic">Dr {physician} / Practice No. {practiceNumber}</p>
                    <p>Sr. {nurse}</p>
                    <p>SANC No: 14262133; SASOHN No: AR 2136 / MBCHB DOH</p>
                    <p>Practice Number: {nurseNumber}</p>
                  </div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="border-t border-gray-900 pt-2 max-w-64 ml-auto">
                    <div className="min-h-16 flex items-center justify-center">
                      <OrganizationLogo
                        variant="stamp"
                        organization={organization}
                        size="lg"
                        className="max-h-16 w-auto object-contain"
                      />
                    </div>
                    <div className="text-center font-bold text-sm mt-2">STAMP</div>
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