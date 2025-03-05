import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { calculateConfidence, getConfidenceLevel, cleanExtractedValue } from "@/lib/document-utils";

type CertificateTemplateProps = {
  extractedData: any;
  onSave?: (editedData: any) => void;
};

// Confidence indicator component
const ConfidenceIndicator = ({ score }: { score: number }) => {
  const getColorClass = () => {
    if (score >= 0.7) return "bg-green-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`w-2 h-2 rounded-full ml-1 ${getColorClass()}`}></div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence: {Math.round(score * 100)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// EditableField component
const EditableField = ({ 
  value, 
  onChange, 
  fieldName, 
  confidence = 0.9, 
  className = "" 
}: { 
  value: string | null | undefined; 
  onChange: (field: string, value: string) => void; 
  fieldName: string; 
  confidence?: number; 
  className?: string;
}) => {
  return (
    <div className="flex items-center flex-1">
      <Input
        type="text"
        value={value || ""}
        onChange={e => onChange(fieldName, e.target.value)}
        className={`border-b border-gray-400 bg-transparent px-0 ${className}`}
      />
      <ConfidenceIndicator score={confidence} />
    </div>
  );
};

// CheckboxField component with allowUncheck parameter
const CheckboxField = ({ 
  checked, 
  onChange, 
  fieldName, 
  confidence = 0.9,
  allowUncheck = true
}: { 
  checked: boolean; 
  onChange: (field: string, value: boolean) => void; 
  fieldName: string; 
  confidence?: number;
  allowUncheck?: boolean;
}) => {
  const handleChange = () => {
    // If already checked and allowUncheck is true, uncheck it
    // Otherwise, check it
    onChange(fieldName, allowUncheck ? !checked : true);
  };

  return (
    <div className="flex items-center justify-center h-8">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={handleChange}
        className="w-5 h-5"
      />
      <ConfidenceIndicator score={confidence} />
    </div>
  );
};

// FitnessDeclaration component
const FitnessDeclaration = ({ 
  formData, 
  handleCheckboxChange, 
  confidenceScores 
}: { 
  formData: any; 
  handleCheckboxChange: (field: string, value: boolean) => void; 
  confidenceScores: any;
}) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
        Medical Fitness Declaration
      </div>
      
      <div className="px-4">
        <table className="w-full border border-gray-400">
          <tbody>
            <tr>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.fit ? 'bg-green-100' : ''}`}>
                <div className="font-semibold text-sm">FIT</div>
                <CheckboxField 
                  checked={formData.certification.fit} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.fit"
                  confidence={confidenceScores.certification.fit}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.fit_with_restrictions ? 'bg-yellow-100' : ''}`}>
                <div className="font-semibold text-sm">Fit with Restriction</div>
                <CheckboxField 
                  checked={formData.certification.fit_with_restrictions} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.fit_with_restrictions"
                  confidence={confidenceScores.certification.fit_with_restrictions}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.fit_with_condition ? 'bg-yellow-100' : ''}`}>
                <div className="font-semibold text-sm">Fit with Condition</div>
                <CheckboxField 
                  checked={formData.certification.fit_with_condition} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.fit_with_condition"
                  confidence={confidenceScores.certification.fit_with_condition}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.temporarily_unfit ? 'bg-red-100' : ''}`}>
                <div className="font-semibold text-sm">Temporary Unfit</div>
                <CheckboxField 
                  checked={formData.certification.temporarily_unfit} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.temporarily_unfit"
                  confidence={confidenceScores.certification.temporarily_unfit}
                  allowUncheck={true}
                />
              </td>
              <td className={`border border-gray-400 p-3 text-center ${formData.certification.unfit ? 'bg-red-100' : ''}`}>
                <div className="font-semibold text-sm">UNFIT</div>
                <CheckboxField 
                  checked={formData.certification.unfit} 
                  onChange={handleCheckboxChange} 
                  fieldName="certification.unfit"
                  confidence={confidenceScores.certification.unfit}
                  allowUncheck={true}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CertificateTemplate = ({ extractedData, onSave }: CertificateTemplateProps) => {
  // Initialize state with empty structure
  const [formData, setFormData] = useState<any>({
    patient: {},
    examination_results: {
      type: {},
      test_results: {}
    },
    certification: {},
    restrictions: {}
  });
  
  // Initialize confidence scores
  const [confidenceScores] = useState<any>({
    patient: {
      name: 0.85,
      id_number: 0.85,
      company: 0.85,
      occupation: 0.75
    },
    examination_results: {
      date: 0.85,
      type: {
        pre_employment: 0.7,
        periodical: 0.7,
        exit: 0.7
      },
      test_results: {}
    },
    certification: {
      valid_until: 0.85,
      follow_up: 0.6,
      review_date: 0.6,
      comments: 0.6,
      fit: 0.7,
      fit_with_restrictions: 0.7,
      fit_with_condition: 0.7,
      temporarily_unfit: 0.7,
      unfit: 0.7
    },
    restrictions: {}
  });
  
  // Add confidence scores for tests
  const tests = [
    'bloods', 'far_near_vision', 'side_depth', 'night_vision', 
    'hearing', 'heights', 'lung_function', 'x_ray', 'drug_screen'
  ];
  
  useEffect(() => {
    // Initialize test confidence scores
    const testConfidences = { ...confidenceScores };
    
    tests.forEach(test => {
      testConfidences.examination_results.test_results[`${test}_done`] = 0.7;
      testConfidences.examination_results.test_results[`${test}_results`] = 0.6;
    });
    
    // Initialize restriction confidence scores
    const restrictionTypes = [
      'heights', 'dust_exposure', 'motorized_equipment', 'wear_hearing_protection',
      'confined_spaces', 'chemical_exposure', 'wear_spectacles', 'remain_on_treatment_for_chronic_conditions'
    ];
    
    restrictionTypes.forEach(restriction => {
      testConfidences.restrictions[restriction] = 0.7;
    });
  }, []);
  
  // Update form data when extractedData changes
  useEffect(() => {
    if (extractedData) {
      console.log("Certificate template received data:", extractedData);
      
      // Helper function to safely get nested values
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
      
      // Helper to check if a value is checked/selected
      const isChecked = (value: any) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'boolean') return value;
        
        const stringValue = String(value).toLowerCase().trim();
        return ['yes', 'true', 'checked', '1', 'x'].includes(stringValue);
      };
      
      setFormData({
        patient: {
          name: cleanExtractedValue(getValue(extractedData, 'patient.name')),
          id_number: cleanExtractedValue(getValue(extractedData, 'patient.id_number')),
          company: cleanExtractedValue(getValue(extractedData, 'patient.company')),
          occupation: cleanExtractedValue(getValue(extractedData, 'patient.occupation'))
        },
        examination_results: {
          date: cleanExtractedValue(getValue(extractedData, 'examination_results.date')),
          type: {
            pre_employment: isChecked(getValue(extractedData, 'examination_results.type.pre_employment')),
            periodical: isChecked(getValue(extractedData, 'examination_results.type.periodical')),
            exit: isChecked(getValue(extractedData, 'examination_results.type.exit'))
          },
          test_results: {
            bloods_done: isChecked(getValue(extractedData, 'examination_results.test_results.bloods_done')),
            bloods_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.bloods_results')),
            far_near_vision_done: isChecked(getValue(extractedData, 'examination_results.test_results.far_near_vision_done')),
            far_near_vision_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.far_near_vision_results')),
            side_depth_done: isChecked(getValue(extractedData, 'examination_results.test_results.side_depth_done')),
            side_depth_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.side_depth_results')),
            night_vision_done: isChecked(getValue(extractedData, 'examination_results.test_results.night_vision_done')),
            night_vision_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.night_vision_results')),
            hearing_done: isChecked(getValue(extractedData, 'examination_results.test_results.hearing_done')),
            hearing_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.hearing_results')),
            heights_done: isChecked(getValue(extractedData, 'examination_results.test_results.heights_done')),
            heights_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.heights_results')),
            lung_function_done: isChecked(getValue(extractedData, 'examination_results.test_results.lung_function_done')),
            lung_function_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.lung_function_results')),
            x_ray_done: isChecked(getValue(extractedData, 'examination_results.test_results.x_ray_done')),
            x_ray_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.x_ray_results')),
            drug_screen_done: isChecked(getValue(extractedData, 'examination_results.test_results.drug_screen_done')),
            drug_screen_results: cleanExtractedValue(getValue(extractedData, 'examination_results.test_results.drug_screen_results'))
          }
        },
        certification: {
          valid_until: cleanExtractedValue(getValue(extractedData, 'certification.valid_until')),
          follow_up: cleanExtractedValue(getValue(extractedData, 'certification.follow_up')),
          review_date: cleanExtractedValue(getValue(extractedData, 'certification.review_date')),
          comments: cleanExtractedValue(getValue(extractedData, 'certification.comments', 'N/A')),
          fit: isChecked(getValue(extractedData, 'certification.fit')),
          fit_with_restrictions: isChecked(getValue(extractedData, 'certification.fit_with_restrictions')),
          fit_with_condition: isChecked(getValue(extractedData, 'certification.fit_with_condition')),
          temporarily_unfit: isChecked(getValue(extractedData, 'certification.temporarily_unfit')),
          unfit: isChecked(getValue(extractedData, 'certification.unfit'))
        },
        restrictions: {
          heights: isChecked(getValue(extractedData, 'restrictions.heights')),
          dust_exposure: isChecked(getValue(extractedData, 'restrictions.dust_exposure')),
          motorized_equipment: isChecked(getValue(extractedData, 'restrictions.motorized_equipment')),
          wear_hearing_protection: isChecked(getValue(extractedData, 'restrictions.wear_hearing_protection')),
          confined_spaces: isChecked(getValue(extractedData, 'restrictions.confined_spaces')),
          chemical_exposure: isChecked(getValue(extractedData, 'restrictions.chemical_exposure')),
          wear_spectacles: isChecked(getValue(extractedData, 'restrictions.wear_spectacles')),
          remain_on_treatment_for_chronic_conditions: isChecked(getValue(extractedData, 'restrictions.remain_on_treatment_for_chronic_conditions'))
        }
      });
      
      // Dynamic confidence scores calculation
      const newConfidenceScores = { ...confidenceScores };
      
      // Calculate confidence for text fields
      newConfidenceScores.patient.name = calculateConfidence(getValue(extractedData, 'patient.name'), 'name');
      newConfidenceScores.patient.id_number = calculateConfidence(getValue(extractedData, 'patient.id_number'), 'id');
      newConfidenceScores.patient.company = calculateConfidence(getValue(extractedData, 'patient.company'), 'text');
      newConfidenceScores.patient.occupation = calculateConfidence(getValue(extractedData, 'patient.occupation'), 'text');
      
      newConfidenceScores.examination_results.date = calculateConfidence(getValue(extractedData, 'examination_results.date'), 'date');
      newConfidenceScores.certification.valid_until = calculateConfidence(getValue(extractedData, 'certification.valid_until'), 'date');
      newConfidenceScores.certification.follow_up = calculateConfidence(getValue(extractedData, 'certification.follow_up'), 'text');
      newConfidenceScores.certification.review_date = calculateConfidence(getValue(extractedData, 'certification.review_date'), 'date');
      newConfidenceScores.certification.comments = calculateConfidence(getValue(extractedData, 'certification.comments'), 'text');
      
      // Calculate confidence for checkbox fields (boolean types)
      newConfidenceScores.examination_results.type.pre_employment = calculateConfidence(getValue(extractedData, 'examination_results.type.pre_employment'), 'boolean');
      newConfidenceScores.examination_results.type.periodical = calculateConfidence(getValue(extractedData, 'examination_results.type.periodical'), 'boolean');
      newConfidenceScores.examination_results.type.exit = calculateConfidence(getValue(extractedData, 'examination_results.type.exit'), 'boolean');
      
      // Medical tests
      tests.forEach(test => {
        newConfidenceScores.examination_results.test_results[`${test}_done`] = calculateConfidence(
          getValue(extractedData, `examination_results.test_results.${test}_done`), 
          'boolean'
        );
        newConfidenceScores.examination_results.test_results[`${test}_results`] = calculateConfidence(
          getValue(extractedData, `examination_results.test_results.${test}_results`), 
          'text'
        );
      });
      
      // Fitness status
      newConfidenceScores.certification.fit = calculateConfidence(getValue(extractedData, 'certification.fit'), 'boolean');
      newConfidenceScores.certification.fit_with_restrictions = calculateConfidence(getValue(extractedData, 'certification.fit_with_restrictions'), 'boolean');
      newConfidenceScores.certification.fit_with_condition = calculateConfidence(getValue(extractedData, 'certification.fit_with_condition'), 'boolean');
      newConfidenceScores.certification.temporarily_unfit = calculateConfidence(getValue(extractedData, 'certification.temporarily_unfit'), 'boolean');
      newConfidenceScores.certification.unfit = calculateConfidence(getValue(extractedData, 'certification.unfit'), 'boolean');
      
      // Restrictions
      const restrictionTypes = [
        'heights', 'dust_exposure', 'motorized_equipment', 'wear_hearing_protection',
        'confined_spaces', 'chemical_exposure', 'wear_spectacles', 'remain_on_treatment_for_chronic_conditions'
      ];
      
      restrictionTypes.forEach(restriction => {
        newConfidenceScores.restrictions[restriction] = calculateConfidence(
          getValue(extractedData, `restrictions.${restriction}`), 
          'boolean'
        );
      });
    }
  }, [extractedData]);
  
  // Handle text field changes
  const handleTextChange = (field: string, value: string) => {
    const parts = field.split('.');
    
    setFormData((prev: any) => {
      const newData = { ...prev };
      if (parts.length === 1) {
        newData[parts[0]] = value;
      } else if (parts.length === 2) {
        newData[parts[0]] = { ...newData[parts[0]], [parts[1]]: value };
      } else if (parts.length === 3) {
        newData[parts[0]][parts[1]] = { ...newData[parts[0]][parts[1]], [parts[2]]: value };
      }
      return newData;
    });
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (field: string, value: boolean) => {
    const parts = field.split('.');
    
    setFormData((prev: any) => {
      const newData = { ...prev };
      if (parts.length === 1) {
        newData[parts[0]] = value;
      } else if (parts.length === 2) {
        newData[parts[0]] = { ...newData[parts[0]], [parts[1]]: value };
      } else if (parts.length === 3) {
        newData[parts[0]][parts[1]] = { ...newData[parts[0]][parts[1]], [parts[2]]: value };
      }
      return newData;
    });
  };
  
  // Save changes
  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
  };
  
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
                    <EditableField 
                      value={formData.patient.name} 
                      onChange={handleTextChange} 
                      fieldName="patient.name"
                      confidence={confidenceScores.patient.name}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <EditableField 
                      value={formData.patient.id_number} 
                      onChange={handleTextChange} 
                      fieldName="patient.id_number"
                      confidence={confidenceScores.patient.id_number}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <EditableField 
                  value={formData.patient.company} 
                  onChange={handleTextChange} 
                  fieldName="patient.company"
                  confidence={confidenceScores.patient.company}
                />
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <EditableField 
                      value={formData.examination_results.date} 
                      onChange={handleTextChange} 
                      fieldName="examination_results.date"
                      confidence={confidenceScores.examination_results.date}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <EditableField 
                      value={formData.certification.valid_until} 
                      onChange={handleTextChange} 
                      fieldName="certification.valid_until"
                      confidence={confidenceScores.certification.valid_until}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <EditableField 
                  value={formData.patient.occupation} 
                  onChange={handleTextChange} 
                  fieldName="patient.occupation"
                  confidence={confidenceScores.patient.occupation}
                />
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
                    <td className="border border-gray-400 text-center">
                      <CheckboxField 
                        checked={formData.examination_results.type.pre_employment} 
                        onChange={handleCheckboxChange} 
                        fieldName="examination_results.type.pre_employment"
                        confidence={confidenceScores.examination_results.type.pre_employment}
                      />
                    </td>
                    <td className="border border-gray-400 text-center">
                      <CheckboxField 
                        checked={formData.examination_results.type.periodical} 
                        onChange={handleCheckboxChange} 
                        fieldName="examination_results.type.periodical"
                        confidence={confidenceScores.examination_results.type.periodical}
                      />
                    </td>
                    <td className="border border-gray-400 text-center">
                      <CheckboxField 
                        checked={formData.examination_results.type.exit} 
                        onChange={handleCheckboxChange} 
                        fieldName="examination_results.type.exit"
                        confidence={confidenceScores.examination_results.type.exit}
                      />
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
                            <CheckboxField 
                              checked={formData.examination_results.test_results.bloods_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.bloods_done"
                              confidence={confidenceScores.examination_results.test_results.bloods_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.bloods_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.bloods_results"
                              confidence={confidenceScores.examination_results.test_results.bloods_results}
                              className="text-center"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            <CheckboxField 
                              checked={formData.examination_results.test_results.far_near_vision_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.far_near_vision_done"
                              confidence={confidenceScores.examination_results.test_results.far_near_vision_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.far_near_vision_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.far_near_vision_results"
                              confidence={confidenceScores.examination_results.test_results.far_near_vision_results}
                              className="text-center"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            <CheckboxField 
                              checked={formData.examination_results.test_results.side_depth_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.side_depth_done"
                              confidence={confidenceScores.examination_results.test_results.side_depth_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.side_depth_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.side_depth_results"
                              confidence={confidenceScores.examination_results.test_results.side_depth_results}
                              className="text-center"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            <CheckboxField 
                              checked={formData.examination_results.test_results.night_vision_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.night_vision_done"
                              confidence={confidenceScores.examination_results.test_results.night_vision_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.night_vision_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.night_vision_results"
                              confidence={confidenceScores.examination_results.test_results.night_vision_results}
                              className="text-center"
                            />
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
                            <CheckboxField 
                              checked={formData.examination_results.test_results.hearing_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.hearing_done"
                              confidence={confidenceScores.examination_results.test_results.hearing_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.hearing_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.hearing_results"
                              confidence={confidenceScores.examination_results.test_results.hearing_results}
                              className="text-center"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            <CheckboxField 
                              checked={formData.examination_results.test_results.heights_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.heights_done"
                              confidence={confidenceScores.examination_results.test_results.heights_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.heights_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.heights_results"
                              confidence={confidenceScores.examination_results.test_results.heights_results}
                              className="text-center"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            <CheckboxField 
                              checked={formData.examination_results.test_results.lung_function_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.lung_function_done"
                              confidence={confidenceScores.examination_results.test_results.lung_function_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.lung_function_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.lung_function_results"
                              confidence={confidenceScores.examination_results.test_results.lung_function_results}
                              className="text-center"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            <CheckboxField 
                              checked={formData.examination_results.test_results.x_ray_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.x_ray_done"
                              confidence={confidenceScores.examination_results.test_results.x_ray_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.x_ray_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.x_ray_results"
                              confidence={confidenceScores.examination_results.test_results.x_ray_results}
                              className="text-center"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            <CheckboxField 
                              checked={formData.examination_results.test_results.drug_screen_done} 
                              onChange={handleCheckboxChange} 
                              fieldName="examination_results.test_results.drug_screen_done"
                              confidence={confidenceScores.examination_results.test_results.drug_screen_done}
                            />
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            <EditableField 
                              value={formData.examination_results.test_results.drug_screen_results} 
                              onChange={handleTextChange} 
                              fieldName="examination_results.test_results.drug_screen_results"
                              confidence={confidenceScores.examination_results.test_results.drug_screen_results}
                              className="text-center"
                            />
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
                <div className="flex-1">
                  <EditableField 
                    value={formData.certification.follow_up} 
                    onChange={handleTextChange} 
                    fieldName="certification.follow_up"
                    confidence={confidenceScores.certification.follow_up}
                  />
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <EditableField 
                      value={formData.certification.review_date} 
                      onChange={handleTextChange} 
                      fieldName="certification.review_date"
                      confidence={confidenceScores.certification.review_date}
                      className="text-red-600 w-32"
                    />
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
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Heights</div>
                        <CheckboxField 
                          checked={formData.restrictions.heights} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.heights"
                          confidence={confidenceScores.restrictions.heights}
                        />
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.dust_exposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Dust Exposure</div>
                        <CheckboxField 
                          checked={formData.restrictions.dust_exposure} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.dust_exposure"
                          confidence={confidenceScores.restrictions.dust_exposure}
                        />
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.motorized_equipment ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Motorized Equipment</div>
                        <CheckboxField 
                          checked={formData.restrictions.motorized_equipment} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.motorized_equipment"
                          confidence={confidenceScores.restrictions.motorized_equipment}
                        />
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.wear_hearing_protection ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Hearing Protection</div>
                        <CheckboxField 
                          checked={formData.restrictions.wear_hearing_protection} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.wear_hearing_protection"
                          confidence={confidenceScores.restrictions.wear_hearing_protection}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.confined_spaces ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Confined Spaces</div>
                        <CheckboxField 
                          checked={formData.restrictions.confined_spaces} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.confined_spaces"
                          confidence={confidenceScores.restrictions.confined_spaces}
                        />
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.chemical_exposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Chemical Exposure</div>
                        <CheckboxField 
                          checked={formData.restrictions.chemical_exposure} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.chemical_exposure"
                          confidence={confidenceScores.restrictions.chemical_exposure}
                        />
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.wear_spectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Spectacles</div>
                        <CheckboxField 
                          checked={formData.restrictions.wear_spectacles} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.wear_spectacles"
                          confidence={confidenceScores.restrictions.wear_spectacles}
                        />
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${formData.restrictions.remain_on_treatment_for_chronic_conditions ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Remain on Treatment for Chronic Conditions</div>
                        <CheckboxField 
                          checked={formData.restrictions.remain_on_treatment_for_chronic_conditions} 
                          onChange={handleCheckboxChange} 
                          fieldName="restrictions.remain_on_treatment_for_chronic_conditions"
                          confidence={confidenceScores.restrictions.remain_on_treatment_for_chronic_conditions}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Use the dedicated FitnessDeclaration component */}
            <FitnessDeclaration 
              formData={formData}
              handleCheckboxChange={handleCheckboxChange}
              confidenceScores={confidenceScores}
            />
            
            {/* Comments */}
            <div className="px-4 mb-6">
              <div className="flex flex-col">
                <div className="font-semibold text-sm mb-1">Comments:</div>
                <div className="border border-gray-400 p-2 min-h-24">
                  <Input
                    type="text"
                    value={formData.certification.comments || ""}
                    onChange={(e) => handleTextChange("certification.comments", e.target.value)}
                    className="w-full h-full border-0 p-0 bg-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer with signature */}
            <div className="px-4 flex justify-between items-end mb-4">
              <div className="w-56">
                <div className="border-b border-gray-400 h-14"></div>
                <div className="text-center text-sm font-semibold mt-1">
                  Signature
                </div>
              </div>
              
              <div className="w-56">
                <div className="border-b border-gray-400 h-14 border-dashed"></div>
                <div className="text-center text-sm font-semibold mt-1">
                  Stamp
                </div>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="bg-gray-100 p-3 text-xs text-center">
              <p>This certificate is valid for the duration specified above from the date of medical examination, 
                unless there is a change in the employees' medical condition or the nature of their work.</p>
            </div>
            
            {/* Save Button */}
            {onSave && (
              <div className="px-4 py-3 bg-gray-50 text-right">
                <Button 
                  onClick={handleSave}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </ScrollArea>
  );
};

export default CertificateTemplate;
