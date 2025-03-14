
import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type CertificateTemplateContentProps = {
  patient: any;
  examination: any;
  certification: any;
  examinationType: any;
  medicalTests: any;
  restrictionsData: any;
  fitnessStatus: any;
  isEditable: boolean;
  renderField: (label: string, value: string, path: string) => React.ReactNode;
  renderCheckbox: (path: string, checked: boolean, label?: string) => React.ReactNode;
  getValue: (obj: any, path: string, defaultValue?: string) => string;
};

const CertificateTemplateContent = ({
  patient,
  examination,
  certification,
  examinationType,
  medicalTests,
  restrictionsData,
  fitnessStatus,
  isEditable,
  renderField,
  renderCheckbox,
  getValue
}: CertificateTemplateContentProps) => {
  return (
    <div className="bg-white w-full max-w-3xl mx-auto font-sans text-black">
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
                {renderField("Date of Examination", getValue(examination, 'date'), "examination_results.date")}
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
                        onCheckedChange={(checked) => renderCheckbox("examination_results.type.pre_employment", !!checked)}
                      />
                    ) : (
                      examinationType.preEmployment ? '✓' : ''
                    )}
                  </td>
                  <td className="border border-gray-400 h-8 text-center">
                    {isEditable ? (
                      <Checkbox 
                        checked={examinationType.periodical} 
                        onCheckedChange={(checked) => renderCheckbox("examination_results.type.periodical", !!checked)}
                      />
                    ) : (
                      examinationType.periodical ? '✓' : ''
                    )}
                  </td>
                  <td className="border border-gray-400 h-8 text-center">
                    {isEditable ? (
                      <Checkbox 
                        checked={examinationType.exit} 
                        onCheckedChange={(checked) => renderCheckbox("examination_results.type.exit", !!checked)}
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.bloods_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.bloods_results", e.target.value, "examination_results.test_results.bloods_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.far_near_vision_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.far_near_vision_results", e.target.value, "examination_results.test_results.far_near_vision_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.side_depth_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.side_depth_results", e.target.value, "examination_results.test_results.side_depth_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.night_vision_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.night_vision_results", e.target.value, "examination_results.test_results.night_vision_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.hearing_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.hearing_results", e.target.value, "examination_results.test_results.hearing_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.heights_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.heights_results", e.target.value, "examination_results.test_results.heights_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.lung_function_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.lung_function_results", e.target.value, "examination_results.test_results.lung_function_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.x_ray_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.x_ray_results", e.target.value, "examination_results.test_results.x_ray_results")} 
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
                              onCheckedChange={(checked) => renderCheckbox("examination_results.test_results.drug_screen_done", !!checked)}
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
                              onChange={(e) => renderField("examination_results.test_results.drug_screen_results", e.target.value, "examination_results.test_results.drug_screen_results")} 
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
              <table className="w-full border border-gray-400">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2">
                      {isEditable ? (
                        <div className="flex items-center">
                          <Checkbox 
                            id="heights"
                            checked={restrictionsData.heights} 
                            onCheckedChange={(checked) => renderCheckbox("restrictions.heights", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("restrictions.dust_exposure", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("restrictions.motorized_equipment", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("restrictions.wear_hearing_protection", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("restrictions.confined_spaces", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("restrictions.chemical_exposure", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("restrictions.wear_spectacles", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("restrictions.remain_on_treatment_for_chronic_conditions", !!checked)}
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

          {/* MEDICAL FITNESS DECLARATION SECTION */}
          <div className="mb-4">
            <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
              MEDICAL FITNESS DECLARATION
            </div>
            
            <div className="px-4">
              <table className="w-full border border-gray-400">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2">
                      {isEditable ? (
                        <div className="flex items-center">
                          <Checkbox 
                            id="fit"
                            checked={fitnessStatus.fit} 
                            onCheckedChange={(checked) => renderCheckbox("certification.fit", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("certification.fit_with_restrictions", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("certification.fit_with_condition", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("certification.temporarily_unfit", !!checked)}
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
                            onCheckedChange={(checked) => renderCheckbox("certification.unfit", !!checked)}
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

          {/* COMMENTS SECTION */}
          <div className="mb-4">
            <div className="px-4">
              <div className="mb-4">
                <Label htmlFor="comments" className="block text-sm font-medium text-gray-700">Comments:</Label>
                {isEditable ? (
                  <Textarea
                    id="comments"
                    value={getValue(certification, 'comments', '')}
                    onChange={(e) => renderField("certification.comments", e.target.value, "certification.comments")}
                    className="mt-1 block w-full"
                    rows={3}
                  />
                ) : (
                  <div className="border rounded p-2 mt-1 min-h-[3em] bg-gray-50">
                    {getValue(certification, 'comments', 'N/A')}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="followUp" className="block text-sm font-medium text-gray-700">Referred or follow up actions:</Label>
                  {isEditable ? (
                    <Input
                      id="followUp"
                      value={getValue(certification, 'follow_up', '')}
                      onChange={(e) => renderField("certification.follow_up", e.target.value, "certification.follow_up")}
                      className="mt-1 block w-full"
                    />
                  ) : (
                    <div className="border rounded p-2 mt-1 bg-gray-50">
                      {getValue(certification, 'follow_up', 'N/A')}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="reviewDate" className="block text-sm font-medium text-gray-700">Review Date:</Label>
                  {isEditable ? (
                    <Input
                      id="reviewDate"
                      value={getValue(certification, 'review_date', '')}
                      onChange={(e) => renderField("certification.review_date", e.target.value, "certification.review_date")}
                      className="mt-1 block w-full"
                    />
                  ) : (
                    <div className="border rounded p-2 mt-1 bg-gray-50">
                      {getValue(certification, 'review_date', 'N/A')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE SECTION */}
          <div className="mb-4">
            <div className="px-4">
              <div className="flex justify-between mt-6">
                <div className="text-center w-1/2 pr-2">
                  <div className="border-b border-black pb-4 mb-2">&nbsp;</div>
                  <div className="text-sm font-semibold">Medical Practitioner / Occupational Health Nurse</div>
                </div>
                <div className="text-center w-1/2 pl-2">
                  <div className="border-b border-black pb-4 mb-2">&nbsp;</div>
                  <div className="text-sm font-semibold">Date</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplateContent;
