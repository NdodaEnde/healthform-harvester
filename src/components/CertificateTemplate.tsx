
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CertificateTemplateProps = {
  extractedData: any;
  isEditable?: boolean;
  onDataChange?: (updatedData: any) => void;
};

const CertificateTemplate = ({
  extractedData,
  isEditable = false,
  onDataChange = () => {}
}: CertificateTemplateProps) => {
  const [patient, setPatient] = useState<any>({});
  const [examination, setExamination] = useState<any>({});
  const [certification, setCertification] = useState<any>({});
  const [examinationType, setExaminationType] = useState<any>({
    preEmployment: false,
    periodical: false,
    exit: false
  });
  const [medicalTests, setMedicalTests] = useState<any>({
    bloods: { done: false, results: '' },
    farNearVision: { done: false, results: '' },
    sideDepth: { done: false, results: '' },
    nightVision: { done: false, results: '' },
    hearing: { done: false, results: '' },
    heights: { done: false, results: '' },
    lungFunction: { done: false, results: '' },
    xRay: { done: false, results: '' },
    drugScreen: { done: false, results: '' }
  });
  const [restrictionsData, setRestrictionsData] = useState<any>({
    heights: false,
    dustExposure: false,
    motorizedEquipment: false,
    hearingProtection: false,
    confinedSpaces: false,
    chemicalExposure: false,
    wearSpectacles: false,
    chronicConditions: false
  });
  const [fitnessStatus, setFitnessStatus] = useState<any>({
    fit: false,
    fitWithRestriction: false,
    fitWithCondition: false,
    temporarilyUnfit: false,
    unfit: false
  });

  useEffect(() => {
    if (extractedData) {
      // Extract data from structured data
      const structuredData = extractedData.structured_data || extractedData;
      setPatient(structuredData?.patient || {});
      setExamination(structuredData?.examination_results || {});
      setCertification(structuredData?.certification || {});

      // Extract examination type
      if (structuredData?.examination_results?.type) {
        setExaminationType({
          preEmployment: structuredData.examination_results.type.pre_employment || false,
          periodical: structuredData.examination_results.type.periodical || false,
          exit: structuredData.examination_results.type.exit || false
        });
      }

      // Extract medical tests
      if (structuredData?.examination_results?.test_results) {
        const testResults = structuredData.examination_results.test_results;
        setMedicalTests({
          bloods: { done: testResults.bloods_done || false, results: testResults.bloods_results || '' },
          farNearVision: { done: testResults.far_near_vision_done || false, results: testResults.far_near_vision_results || '' },
          sideDepth: { done: testResults.side_depth_done || false, results: testResults.side_depth_results || '' },
          nightVision: { done: testResults.night_vision_done || false, results: testResults.night_vision_results || '' },
          hearing: { done: testResults.hearing_done || false, results: testResults.hearing_results || '' },
          heights: { done: testResults.heights_done || false, results: testResults.heights_results || '' },
          lungFunction: { done: testResults.lung_function_done || false, results: testResults.lung_function_results || '' },
          xRay: { done: testResults.x_ray_done || false, results: testResults.x_ray_results || '' },
          drugScreen: { done: testResults.drug_screen_done || false, results: testResults.drug_screen_results || '' }
        });
      }

      // Extract restrictions
      if (structuredData?.restrictions) {
        setRestrictionsData({
          heights: structuredData.restrictions.heights || false,
          dustExposure: structuredData.restrictions.dust_exposure || false,
          motorizedEquipment: structuredData.restrictions.motorized_equipment || false,
          hearingProtection: structuredData.restrictions.wear_hearing_protection || false,
          confinedSpaces: structuredData.restrictions.confined_spaces || false,
          chemicalExposure: structuredData.restrictions.chemical_exposure || false,
          wearSpectacles: structuredData.restrictions.wear_spectacles || false,
          chronicConditions: structuredData.restrictions.remain_on_treatment_for_chronic_conditions || false
        });
      }

      // Extract fitness status
      if (structuredData?.certification) {
        setFitnessStatus({
          fit: structuredData.certification.fit || false,
          fitWithRestriction: structuredData.certification.fit_with_restrictions || false,
          fitWithCondition: structuredData.certification.fit_with_condition || false,
          temporarilyUnfit: structuredData.certification.temporarily_unfit || false,
          unfit: structuredData.certification.unfit || false
        });
      }
    }
  }, [extractedData]);

  const getValue = (obj: any, path: string, defaultValue = '') => {
    try {
      const value = path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
      return value !== undefined && value !== null ? value : defaultValue;
    } catch (error) {
      console.error(`Error accessing path ${path} in object:`, error);
      return defaultValue;
    }
  };

  const handleTextChange = (path: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    updateData(path, newValue);
  };

  const handleCheckboxChange = (path: string, checked: boolean) => {
    updateData(path, checked);
  };

  const updateData = (path: string, value: any) => {
    const pathParts = path.split('.');
    const lastPart = pathParts.pop();
    let current = extractedData.structured_data || extractedData;

    for (const part of pathParts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[lastPart] = value;
    onDataChange(extractedData);
  };

  const renderField = (label: string, value: string, path: string) => {
    if (isEditable) {
      return (
        <div>
          <Label htmlFor={path} className="block text-sm font-medium text-gray-700">{label}:</Label>
          <Input
            type="text"
            id={path}
            className="mt-1 block w-full text-sm"
            value={value || ''}
            onChange={(e) => handleTextChange(path, e)}
          />
        </div>
      );
    }
    return (
      <div>
        <div className="font-semibold">{label}:</div>
        <div>{value || 'N/A'}</div>
      </div>
    );
  };

  const renderCheckbox = (path: string, checked: boolean, label?: string) => {
    if (isEditable) {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox 
            checked={checked} 
            onCheckedChange={(checked) => handleCheckboxChange(path, !!checked)}
            id={`checkbox-${path}`}
          />
          {label && <Label htmlFor={`checkbox-${path}`}>{label}</Label>}
        </div>
      );
    }
    return checked ? '✓' : '';
  };

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
                  {renderField("Initials & Surname", getValue(patient, 'name') || getValue(patient, 'full_name'), "patient.name")}
                </div>
                <div className="flex-1">
                  {renderField("ID NO", getValue(patient, 'id_number') || getValue(patient, 'employee_id') || getValue(patient, 'id'), "patient.id_number")}
                </div>
              </div>
              
              {renderField("Company Name", getValue(patient, 'company') || getValue(patient, 'employer') || getValue(patient, 'employment.employer'), "patient.company")}
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  {renderField("Date of Examination", getValue(examination, 'date') || getValue(extractedData, 'examination_date'), "examination_results.date")}
                </div>
                <div className="flex-1">
                  {renderField("Expiry Date", getValue(certification, 'valid_until') || getValue(certification, 'expiration_date'), "certification.valid_until")}
                </div>
              </div>
              
              {renderField("Job Title", getValue(patient, 'occupation') || getValue(patient, 'job_title') || getValue(patient, 'employment.occupation'), "patient.occupation")}
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
                      {isEditable ? (
                        <Checkbox 
                          checked={examinationType.preEmployment} 
                          onCheckedChange={(checked) => handleCheckboxChange("examination_results.type.pre_employment", !!checked)}
                        />
                      ) : (
                        examinationType.preEmployment ? '✓' : ''
                      )}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {isEditable ? (
                        <Checkbox 
                          checked={examinationType.periodical} 
                          onCheckedChange={(checked) => handleCheckboxChange("examination_results.type.periodical", !!checked)}
                        />
                      ) : (
                        examinationType.periodical ? '✓' : ''
                      )}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {isEditable ? (
                        <Checkbox 
                          checked={examinationType.exit} 
                          onCheckedChange={(checked) => handleCheckboxChange("examination_results.type.exit", !!checked)}
                        />
                      ) : (
                        examinationType.exit ? '✓' : ''
                      )}
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
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.bloods.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.bloods_done", !!checked)}
                              />
                            ) : (
                              medicalTests.bloods.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.bloods.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.bloods_results", e)} 
                              />
                            ) : (
                              medicalTests.bloods.results
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.farNearVision.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.far_near_vision_done", !!checked)}
                              />
                            ) : (
                              medicalTests.farNearVision.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.farNearVision.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.far_near_vision_results", e)} 
                              />
                            ) : (
                              medicalTests.farNearVision.results
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.sideDepth.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.side_depth_done", !!checked)}
                              />
                            ) : (
                              medicalTests.sideDepth.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.sideDepth.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.side_depth_results", e)} 
                              />
                            ) : (
                              medicalTests.sideDepth.results
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.nightVision.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.night_vision_done", !!checked)}
                              />
                            ) : (
                              medicalTests.nightVision.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.nightVision.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.night_vision_results", e)} 
                              />
                            ) : (
                              medicalTests.nightVision.results
                            )}
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
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.hearing.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.hearing_done", !!checked)}
                              />
                            ) : (
                              medicalTests.hearing.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.hearing.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.hearing_results", e)} 
                              />
                            ) : (
                              medicalTests.hearing.results
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.heights.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.heights_done", !!checked)}
                              />
                            ) : (
                              medicalTests.heights.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.heights.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.heights_results", e)} 
                              />
                            ) : (
                              medicalTests.heights.results
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.lungFunction.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.lung_function_done", !!checked)}
                              />
                            ) : (
                              medicalTests.lungFunction.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.lungFunction.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.lung_function_results", e)} 
                              />
                            ) : (
                              medicalTests.lungFunction.results
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.xRay.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.x_ray_done", !!checked)}
                              />
                            ) : (
                              medicalTests.xRay.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.xRay.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.x_ray_results", e)} 
                              />
                            ) : (
                              medicalTests.xRay.results
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {isEditable ? (
                              <Checkbox 
                                checked={medicalTests.drugScreen.done} 
                                onCheckedChange={(checked) => handleCheckboxChange("examination_results.test_results.drug_screen_done", !!checked)}
                              />
                            ) : (
                              medicalTests.drugScreen.done ? '✓' : ''
                            )}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {isEditable ? (
                              <Input 
                                className="w-full h-7 text-xs" 
                                value={medicalTests.drugScreen.results || ''} 
                                onChange={(e) => handleTextChange("examination_results.test_results.drug_screen_results", e)} 
                              />
                            ) : (
                              medicalTests.drugScreen.results
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RESTRICTIONS SECTION */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                RESTRICTIONS
              </div>
              
              <div className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <table className="w-full border border-gray-400">
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="heights"
                                  checked={restrictionsData.heights} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.heights", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="heights">Heights</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.heights ? '✓' : ''}</span>
                                <span>Heights</span>
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="dustExposure"
                                  checked={restrictionsData.dustExposure} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.dust_exposure", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="dustExposure">Dust Exposure</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.dustExposure ? '✓' : ''}</span>
                                <span>Dust Exposure</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="motorizedEquipment"
                                  checked={restrictionsData.motorizedEquipment} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.motorized_equipment", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="motorizedEquipment">Motorized Equipment</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.motorizedEquipment ? '✓' : ''}</span>
                                <span>Motorized Equipment</span>
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="hearingProtection"
                                  checked={restrictionsData.hearingProtection} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.wear_hearing_protection", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="hearingProtection">Wear Hearing Protection</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.hearingProtection ? '✓' : ''}</span>
                                <span>Wear Hearing Protection</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="confinedSpaces"
                                  checked={restrictionsData.confinedSpaces} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.confined_spaces", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="confinedSpaces">Confined Spaces</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.confinedSpaces ? '✓' : ''}</span>
                                <span>Confined Spaces</span>
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="chemicalExposure"
                                  checked={restrictionsData.chemicalExposure} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.chemical_exposure", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="chemicalExposure">Chemical Exposure</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.chemicalExposure ? '✓' : ''}</span>
                                <span>Chemical Exposure</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="wearSpectacles"
                                  checked={restrictionsData.wearSpectacles} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.wear_spectacles", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="wearSpectacles">Wear Spectacles</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.wearSpectacles ? '✓' : ''}</span>
                                <span>Wear Spectacles</span>
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="chronicConditions"
                                  checked={restrictionsData.chronicConditions} 
                                  onCheckedChange={(checked) => handleCheckboxChange("restrictions.remain_on_treatment_for_chronic_conditions", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="chronicConditions">Remain on Treatment for Chronic Conditions</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{restrictionsData.chronicConditions ? '✓' : ''}</span>
                                <span>Remain on Treatment for Chronic Conditions</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* MEDICAL FITNESS DECLARATION SECTION */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                MEDICAL FITNESS DECLARATION
              </div>
              
              <div className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <table className="w-full border border-gray-400">
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="fit"
                                  checked={fitnessStatus.fit} 
                                  onCheckedChange={(checked) => handleCheckboxChange("certification.fit", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="fit">FIT</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{fitnessStatus.fit ? '✓' : ''}</span>
                                <span>FIT</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="fitWithRestriction"
                                  checked={fitnessStatus.fitWithRestriction} 
                                  onCheckedChange={(checked) => handleCheckboxChange("certification.fit_with_restrictions", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="fitWithRestriction">Fit with Restriction</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{fitnessStatus.fitWithRestriction ? '✓' : ''}</span>
                                <span>Fit with Restriction</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="fitWithCondition"
                                  checked={fitnessStatus.fitWithCondition} 
                                  onCheckedChange={(checked) => handleCheckboxChange("certification.fit_with_condition", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="fitWithCondition">Fit with Condition</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{fitnessStatus.fitWithCondition ? '✓' : ''}</span>
                                <span>Fit with Condition</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="temporarilyUnfit"
                                  checked={fitnessStatus.temporarilyUnfit} 
                                  onCheckedChange={(checked) => handleCheckboxChange("certification.temporarily_unfit", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="temporarilyUnfit">Temporarily Unfit</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{fitnessStatus.temporarilyUnfit ? '✓' : ''}</span>
                                <span>Temporarily Unfit</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-2">
                            {isEditable ? (
                              <div className="flex items-center">
                                <Checkbox 
                                  id="unfit"
                                  checked={fitnessStatus.unfit} 
                                  onCheckedChange={(checked) => handleCheckboxChange("certification.unfit", !!checked)}
                                  className="mr-2"
                                />
                                <Label htmlFor="unfit">UNFIT</Label>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="w-6 flex-shrink-0">{fitnessStatus.unfit ? '✓' : ''}</span>
                                <span>UNFIT</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
