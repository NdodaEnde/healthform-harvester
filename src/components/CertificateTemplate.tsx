
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CertificateTemplateContent from "./CertificateTemplateContent";

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
  const [localData, setLocalData] = useState<any>(extractedData);

  useEffect(() => {
    console.log("CertificateTemplate received data:", extractedData);
    setLocalData(extractedData);
  }, [extractedData]);

  const isChecked = (value: any, trueValues: string[] = ['yes', 'true', 'checked', '1', 'x']) => {
    if (value === undefined || value === null) return false;
    const stringValue = String(value).toLowerCase().trim();
    return trueValues.includes(stringValue) || value === true;
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

  const handleTextChange = (path: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    console.log(`Text change at ${path}:`, e.target.value);
    updateNestedValue(`structured_data.${path}`, e.target.value);
  };

  const handleCheckboxChange = (path: string, checked: boolean) => {
    console.log(`Checkbox change at ${path}:`, checked);
    updateNestedValue(`structured_data.${path}`, checked);
  };

  const updateNestedValue = (path: string, value: any) => {
    console.log(`Attempting to update path ${path} with value:`, value);
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(localData));
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    
    console.log("Updated data:", newData);
    setLocalData(newData);
    onDataChange(newData);
  };

  const renderField = (label: string, value: string, path: string) => {
    if (isEditable) {
      return (
        <div className="flex items-center">
          <span className="font-semibold mr-1">{label}:</span>
          <Input 
            className="border-b border-gray-400 flex-1 h-7 px-1 py-0 text-sm"
            value={value || ''}
            onChange={(e) => handleTextChange(path, e)}
          />
        </div>
      );
    }
    return (
      <div className="flex items-center">
        <span className="font-semibold mr-1">{label}:</span>
        <span className="border-b border-gray-400 flex-1">{value || 'N/A'}</span>
      </div>
    );
  };

  const renderCheckbox = (path: string, checked: boolean, label?: string) => {
    if (isEditable) {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`checkbox-${path}`}
            checked={checked} 
            onCheckedChange={(checked) => {
              console.log(`Checkbox ${path} changed to:`, checked);
              handleCheckboxChange(path, checked === true);
            }}
          />
          {label && <Label htmlFor={`checkbox-${path}`}>{label}</Label>}
        </div>
      );
    }
    return checked ? '✓' : '';
  };

  let structuredData: any = {};

  if (localData?.structured_data) {
    console.log("Using existing structured_data");
    structuredData = localData.structured_data;
  } else if (localData?.extracted_data?.structured_data) {
    console.log("Using structured_data from extracted_data");
    structuredData = localData.extracted_data.structured_data;
  } else {
    console.log("Using extractedData as is");
    structuredData = localData || {};
  }

  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || structuredData.medical_details || {};
  const restrictions = structuredData.restrictions || {};
  const certification = structuredData.certification || structuredData.fitness_assessment || {};
  const testResults = examination.test_results || examination.tests || {};

  const fitnessStatus = {
    fit: isChecked(certification.fit_for_duty) || isChecked(certification.fit),
    fitWithRestriction: isChecked(certification.fit_with_restrictions),
    fitWithCondition: isChecked(certification.fit_with_condition),
    temporarilyUnfit: isChecked(certification.temporarily_unfit),
    unfit: isChecked(certification.permanently_unfit) || isChecked(certification.unfit)
  };

  const medicalTests = {
    bloods: {
      done: isChecked(testResults.bloods_done) || isChecked(testResults.blood_test),
      results: getValue(testResults, 'bloods_results') || getValue(testResults, 'blood_test_results')
    },
    farNearVision: {
      done: isChecked(testResults.far_near_vision_done) || isChecked(testResults.vision_test),
      results: getValue(testResults, 'far_near_vision_results') || getValue(testResults, 'vision_results')
    },
    sideDepth: {
      done: isChecked(testResults.side_depth_done) || isChecked(testResults.peripheral_vision),
      results: getValue(testResults, 'side_depth_results') || getValue(testResults, 'peripheral_vision_results')
    },
    nightVision: {
      done: isChecked(testResults.night_vision_done) || isChecked(testResults.night_vision_test),
      results: getValue(testResults, 'night_vision_results')
    },
    hearing: {
      done: isChecked(testResults.hearing_done) || isChecked(testResults.hearing_test),
      results: getValue(testResults, 'hearing_results') || getValue(testResults, 'hearing_test_results')
    },
    heights: {
      done: isChecked(testResults.heights_done) || isChecked(testResults.working_at_heights),
      results: getValue(testResults, 'heights_results') || getValue(testResults, 'working_at_heights_results')
    },
    lungFunction: {
      done: isChecked(testResults.lung_function_done) || isChecked(testResults.pulmonary_function),
      results: getValue(testResults, 'lung_function_results') || getValue(testResults, 'pulmonary_function_results')
    },
    xRay: {
      done: isChecked(testResults.x_ray_done) || isChecked(testResults.chest_x_ray),
      results: getValue(testResults, 'x_ray_results') || getValue(testResults, 'chest_x_ray_results')
    },
    drugScreen: {
      done: isChecked(testResults.drug_screen_done) || isChecked(testResults.drug_screen_test),
      results: getValue(testResults, 'drug_screen_results')
    }
  };

  const restrictionsData = {
    heights: isChecked(restrictions.heights),
    dustExposure: isChecked(restrictions.dust_exposure),
    motorizedEquipment: isChecked(restrictions.motorized_equipment),
    hearingProtection: isChecked(restrictions.hearing_protection) || isChecked(restrictions.wear_hearing_protection),
    confinedSpaces: isChecked(restrictions.confined_spaces),
    chemicalExposure: isChecked(restrictions.chemical_exposure),
    wearSpectacles: isChecked(restrictions.wear_spectacles),
    chronicConditions: isChecked(restrictions.chronic_conditions) || isChecked(restrictions.remain_on_treatment_for_chronic_conditions)
  };

  const examinationType = {
    preEmployment: isChecked(examination.pre_employment) || isChecked(examination.type?.pre_employment),
    periodical: isChecked(examination.periodical) || isChecked(examination.type?.periodical),
    exit: isChecked(examination.exit) || isChecked(examination.type?.exit)
  };

  return (
    <ScrollArea className="h-full">
      <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black">
        <CertificateTemplateContent
          patient={patient}
          examination={examination}
          certification={certification}
          examinationType={examinationType}
          medicalTests={medicalTests}
          restrictionsData={restrictionsData}
          fitnessStatus={fitnessStatus}
          isEditable={isEditable}
          renderField={renderField}
          renderCheckbox={renderCheckbox}
          getValue={getValue}
          handleTextChange={handleTextChange}
          handleCheckboxChange={handleCheckboxChange}
        />
      </Card>
    </ScrollArea>
  );
};

export default CertificateTemplate;
