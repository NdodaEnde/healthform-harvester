import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type HistoricalCertificateTemplateProps = {
  extractedData: any;
  editable?: boolean;
  onDataChange?: (data: any) => void;
};

const HistoricalCertificateTemplate = ({
  extractedData,
  editable = false,
  onDataChange
}: HistoricalCertificateTemplateProps) => {
  const [editableData, setEditableData] = useState<any>(null);
  const [stampDate, setStampDate] = useState<string>('');

  // Initialize editable data
  useEffect(() => {
    if (extractedData) {
      const normalizedData = normalizeExtractedData(extractedData);
      if (editable) {
        setEditableData(normalizedData);
      }
      // Auto-populate stamp date with examination date
      if (normalizedData?.examination_results?.date) {
        setStampDate(formatDateForStamp(normalizedData.examination_results.date));
      }
    }
  }, [extractedData, editable]);

  const normalizeExtractedData = (data: any) => {
    // Same normalization logic as your current template
    if (data?.structured_data?.certificate_info) {
      const certInfo = data.structured_data.certificate_info;
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
    return data || {};
  };

  const formatDateForStamp = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch {
      return dateString;
    }
  };

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
    
    // Auto-update stamp date when examination date changes
    if (path === 'examination_results.date') {
      setStampDate(formatDateForStamp(value));
    }
    
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const handleCheckboxChange = (path: string, checked: boolean) => {
    handleFieldChange(path, checked);
  };

  const dataToRender = editable && editableData ? editableData : normalizeExtractedData(extractedData);
  
  const patient = dataToRender.patient || {};
  const examination = dataToRender.examination_results || {};
  const restrictions = dataToRender.restrictions || {};
  const certification = dataToRender.certification || {};
  const testResults = examination.test_results || {};

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
    return <span className={className}>{value || ''}</span>;
  };

  const renderCheckbox = (checked: boolean, path: string) => {
    if (editable) {
      return (
        <input
          type="checkbox"
          checked={checked || false}
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
            {editable && (
              <div className="px-4 pt-2">
                <Badge variant="secondary" className="mb-2">
                  Historical Template
                </Badge>
              </div>
            )}

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
                <div className="bg-white text-right">
                  <div className="text-sm font-bold bg-gray-800 text-white px-3 py-1 text-right">BLUECOLLAR OCCUPATIONAL HEALTH</div>
                  <div className="text-[0.65rem] mt-1 px-3 text-black text-right">Tel: +27 11 892 0771/011 892 0627</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">Email: admin@bluecollarhealth.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">office@bluecollarhealth.co.za</div>
                  <div className="text-[0.65rem] px-3 text-black text-right">135 Leeuwpoort Street, Boksburg South, Boksburg</div>
                </div>
              </div>
            </div>
            
            {/* Title */}
            <div className="bg-gray-800 text-white text-center py-2 mb-2">
              <h2 className="text-lg font-bold">CERTIFICATE OF FITNESS</h2>
            </div>
            
            {/* Certification text */}
            <div className="text-center text-xs px-4 mb-3">
              <p>
                Dr. MJ Mphuthi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            {/* Patient Information */}
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
                      {renderField(examination.date, 'examination_results.date')}
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
                      {renderCheckbox(examination.type?.pre_employment, 'examination_results.type.pre_employment')}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {renderCheckbox(examination.type?.periodical, 'examination_results.type.periodical')}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {renderCheckbox(examination.type?.exit, 'examination_results.type.exit')}
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
            
            {/* Follow up actions */}
            <div className="px-4 mb-4">
              <div className="flex items-center">
                <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
                <div className="border-b border-gray-400 flex-1">
                  {renderField(certification.follow_up, 'certification.follow_up')}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">
                      {renderField(certification.review_date, 'certification.review_date', 'text-red-600')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Restrictions */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-xs font-semibold mb-2">
                Restrictions:
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400 text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Heights</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.heights, 'restrictions.heights')}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Dust Exposure</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.dust_exposure, 'restrictions.dust_exposure')}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Motorized Equipment</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.motorized_equipment, 'restrictions.motorized_equipment')}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Wear Hearing Protection</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.wear_hearing_protection, 'restrictions.wear_hearing_protection')}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Confined Spaces</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.confined_spaces, 'restrictions.confined_spaces')}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Chemical Exposure</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.chemical_exposure, 'restrictions.chemical_exposure')}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Wear Spectacles</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.wear_spectacles, 'restrictions.wear_spectacles')}
                        </div>
                      </td>
                      <td className="border border-gray-400 p-1 text-center">
                        <div className="text-xs font-medium">Remain on Treatment</div>
                        <div className="text-[0.6rem]">
                          {renderCheckbox(restrictions.remain_on_treatment_for_chronic_conditions, 'restrictions.remain_on_treatment_for_chronic_conditions')}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* FITNESS ASSESSMENT */}
            <div className="mb-2">
              <div className="bg-gray-800 text-white text-center py-1 text-xs font-semibold mb-1">
                FITNESS ASSESSMENT
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400">
                  <tbody>
                    <tr>
                      <th className="border border-gray-400 p-1 text-center bg-green-100">
                        <div className="text-xs">FIT</div>
                        <div className="text-green-600 text-sm">
                          {renderCheckbox(certification.fit, 'certification.fit')}
                        </div>
                      </th>
                      <th className="border border-gray-400 p-1 text-center">
                        <div className="text-xs">Fit with Restriction</div>
                        <div className="text-yellow-600 text-sm">
                          {renderCheckbox(certification.fit_with_restrictions, 'certification.fit_with_restrictions')}
                        </div>
                      </th>
                      <th className="border border-gray-400 p-1 text-center">
                        <div className="text-xs">Fit with Condition</div>
                        <div className="text-yellow-600 text-sm">
                          {renderCheckbox(certification.fit_with_condition, 'certification.fit_with_condition')}
                        </div>
                      </th>
                      <th className="border border-gray-400 p-1 text-center">
                        <div className="text-xs">Temporary Unfit</div>
                        <div className="text-red-600 text-sm">
                          {renderCheckbox(certification.temporarily_unfit, 'certification.temporarily_unfit')}
                        </div>
                      </th>
                      <th className="border border-gray-400 p-1 text-center">
                        <div className="text-xs">UNFIT</div>
                        <div className="text-red-600 text-sm">
                          {renderCheckbox(certification.unfit, 'certification.unfit')}
                        </div>
                      </th>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comments */}
            <div className="px-4 mb-1">
              <div className="font-semibold text-xs mb-0.5">Comments:</div>
              <div className="border border-gray-400 p-1 min-h-8 text-xs">
                {editable ? (
                  <Input
                    value={certification.comments || ''}
                    onChange={(e) => handleFieldChange('certification.comments', e.target.value)}
                    className="border-0 bg-transparent px-1 py-0 h-auto text-xs w-full"
                  />
                ) : (certification.comments || '')}
              </div>
            </div>
            
            {/* SIGNATURE AND STAMP SECTION - HISTORICAL VERSION */}
            <div className="px-4 mb-3">
              <div className="flex justify-between items-end">
                {/* Signature Section */}
                <div className="flex-1">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56">
                    <div className="min-h-16 flex items-center justify-center bg-gray-50 border rounded">
                      {/* Pre-filled signature image from the sample certificate */}
                      <div className="text-center p-2">
                        <div style={{ fontFamily: 'cursive', fontSize: '24px', color: '#000' }}>
                          MJ Mphuthi
                        </div>
                        <div className="border-b-2 border-black w-20 mx-auto mt-1"></div>
                      </div>
                    </div>
                    <div className="text-center font-semibold text-[0.6rem]">SIGNATURE</div>
                  </div>
                </div>
                
                {/* Middle Section - Practitioner Info */}
                <div className="flex-1 px-2 flex justify-center">
                  <div className="w-fit max-w-md text-center">
                    <p className="text-[0.6rem] leading-tight font-semibold">Occupational Health Practitioner / Occupational Medical Practitioner</p>
                    <p className="text-[0.6rem] leading-tight italic">Dr MJ Mphuthi / Practice No. 0404160</p>
                    <p className="text-[0.6rem] leading-tight">Sr. Sibongile Mahlangu</p>
                    <p className="text-[0.6rem] leading-tight">SANC No: 14262133; SASOHN No: AR 2136</p>
                    <p className="text-[0.6rem] leading-tight">Practice Number: 999 088 0000 8177 91</p>
                  </div>
                </div>
                
                {/* Stamp Section */}
                <div className="flex-1 text-right">
                  <div className="border-t border-gray-400 pt-1 mt-4 max-w-56 ml-auto">
                    <div className="min-h-16 flex flex-col items-center justify-center bg-gray-50 border rounded relative">
                      {/* Pre-filled stamp design from the sample certificate */}
                      <div className="relative">
                        {/* Circular stamp border */}
                        <div className="w-16 h-16 border-4 border-black rounded-full flex flex-col items-center justify-center text-center">
                          <div className="text-[0.45rem] font-bold leading-none">Dr MJ Mphuthi</div>
                          <div className="text-[0.35rem] leading-none mt-0.5">Occupational Medicine Practitioner</div>
                          <div className="text-[0.35rem] leading-none">BSc(Med), PDD, M.Phil (HIV/AIDS)</div>
                          <div className="text-[0.35rem] leading-none">MBCHB, DOHM & OHME</div>
                        </div>
                        
                        {/* Editable date inside stamp */}
                        <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 bg-white px-1">
                          {editable ? (
                            <Input
                              value={stampDate}
                              onChange={(e) => setStampDate(e.target.value)}
                              placeholder="DD-MM-YYYY"
                              className="border-0 border-b border-gray-400 rounded-none bg-transparent px-1 py-0 h-auto text-[0.5rem] text-center w-16"
                            />
                          ) : (
                            <span className="text-[0.5rem] font-bold">{stampDate}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Practice number at bottom right */}
                      <div className="absolute bottom-1 right-1">
                        <div className="text-[0.4rem] font-bold">Practice NO: 1522469 MP No: 0404160</div>
                        <div className="text-[0.35rem]">Email: mandlajockey@yahoo.com T: 1 083 209 1098</div>
                      </div>
                    </div>
                    <div className="text-center font-semibold text-[0.6rem]">STAMP</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
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