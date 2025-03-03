
import React from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
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
  const getValue = (obj: any, path: string, defaultValue: any = 'N/A') => {
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
  const certification = data.certification || data.fitness_assessment || {};
  const visionTests = examination.vision_tests || examination.vision || {};
  const medicalTests = examination.medical_tests || examination.tests || {};
  
  return (
    <Card className="p-6 border-2 border-gray-300 bg-white">
      <div className="space-y-6">
        {/* Certificate Header */}
        <div className="text-center border-b pb-4">
          <h2 className="text-xl font-bold uppercase">Certificate of Fitness</h2>
          <p className="text-sm text-gray-600">Medical Evaluation Results</p>
        </div>
        
        {/* Patient Information */}
        <div className="grid grid-cols-2 gap-4 border-b pb-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Patient Information</h3>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm col-span-2 font-medium">{getValue(patient, 'name')}</span>
              
              <span className="text-sm text-gray-600">ID/Employee #:</span>
              <span className="text-sm col-span-2 font-medium">{getValue(patient, 'employee_id') || getValue(patient, 'id')}</span>
              
              <span className="text-sm text-gray-600">Date of Birth:</span>
              <span className="text-sm col-span-2 font-medium">{getValue(patient, 'date_of_birth') || getValue(patient, 'dob')}</span>
              
              <span className="text-sm text-gray-600">Gender:</span>
              <span className="text-sm col-span-2 font-medium">{getValue(patient, 'gender')}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Examination Details</h3>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-gray-600">Date:</span>
              <span className="text-sm col-span-2 font-medium">{getValue(examination, 'date') || getValue(data, 'examination_date')}</span>
              
              <span className="text-sm text-gray-600">Physician:</span>
              <span className="text-sm col-span-2 font-medium">{getValue(examination, 'physician') || getValue(certification, 'certifying_physician')}</span>
              
              <span className="text-sm text-gray-600">Location:</span>
              <span className="text-sm col-span-2 font-medium">{getValue(examination, 'location') || getValue(data, 'facility')}</span>
            </div>
          </div>
        </div>
        
        {/* Vision Tests */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3">Vision Tests</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="mr-2 mt-0.5">
                  {isChecked(visionTests.glasses_required) ? 
                    <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                    <Circle className="h-5 w-5 text-gray-300" />}
                </div>
                <div>
                  <p className="font-medium">Glasses Required</p>
                  <p className="text-sm text-gray-600">{getValue(visionTests, 'glasses_notes')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-2 mt-0.5">
                  {isChecked(visionTests.contacts_required) ? 
                    <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                    <Circle className="h-5 w-5 text-gray-300" />}
                </div>
                <div>
                  <p className="font-medium">Contact Lenses Required</p>
                  <p className="text-sm text-gray-600">{getValue(visionTests, 'contacts_notes')}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-gray-600">Visual Acuity:</span>
                <span className="text-sm col-span-2 font-medium">{getValue(visionTests, 'visual_acuity')}</span>
                
                <span className="text-sm text-gray-600">Color Vision:</span>
                <span className="text-sm col-span-2 font-medium">{getValue(visionTests, 'color_vision')}</span>
                
                <span className="text-sm text-gray-600">Field of Vision:</span>
                <span className="text-sm col-span-2 font-medium">{getValue(visionTests, 'field_of_vision')}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Medical Tests */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3">Medical Tests</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(medicalTests.blood_pressure_normal) ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Blood Pressure Normal</p>
                <p className="text-sm text-gray-600">{getValue(medicalTests, 'blood_pressure_reading') || getValue(examination, 'blood_pressure')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(medicalTests.hearing_normal) ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Hearing Normal</p>
                <p className="text-sm text-gray-600">{getValue(medicalTests, 'hearing_notes')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(medicalTests.cardiovascular_normal) ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Cardiovascular Normal</p>
                <p className="text-sm text-gray-600">{getValue(medicalTests, 'cardiovascular_notes')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(medicalTests.respiratory_normal) ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Respiratory Normal</p>
                <p className="text-sm text-gray-600">{getValue(medicalTests, 'respiratory_notes')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(medicalTests.musculoskeletal_normal) ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Musculoskeletal Normal</p>
                <p className="text-sm text-gray-600">{getValue(medicalTests, 'musculoskeletal_notes')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(medicalTests.neurological_normal) ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Neurological Normal</p>
                <p className="text-sm text-gray-600">{getValue(medicalTests, 'neurological_notes')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Certification/Fitness Assessment */}
        <div className="space-y-4">
          <h3 className="font-semibold">Fitness Assessment</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(certification.fit_for_duty) ? 
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Fit for Duty</p>
                <p className="text-sm text-gray-600">{getValue(certification, 'fit_notes')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(certification.fit_with_restrictions) ? 
                  <CheckCircle2 className="h-5 w-5 text-yellow-600" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Fit for Duty with Restrictions</p>
                <p className="text-sm text-gray-600">{getValue(certification, 'restrictions') || getValue(certification, 'restrictions_notes')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(certification.temporarily_unfit) ? 
                  <CheckCircle2 className="h-5 w-5 text-orange-600" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Temporarily Unfit for Duty</p>
                <p className="text-sm text-gray-600">{getValue(certification, 'temporarily_unfit_notes')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                {isChecked(certification.permanently_unfit) ? 
                  <CheckCircle2 className="h-5 w-5 text-red-600" /> : 
                  <Circle className="h-5 w-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-medium">Permanently Unfit for Duty</p>
                <p className="text-sm text-gray-600">{getValue(certification, 'permanently_unfit_notes')}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Additional Comments</h4>
            <p className="text-sm p-3 bg-gray-50 rounded-md min-h-16 whitespace-pre-wrap">
              {getValue(certification, 'comments') || getValue(certification, 'notes') || getValue(certification, 'additional_comments')}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Valid From</p>
              <p className="font-medium">{getValue(certification, 'valid_from') || getValue(certification, 'effective_date')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="font-medium">{getValue(certification, 'valid_until') || getValue(certification, 'expiration_date')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Certifying Physician</p>
              <p className="font-medium">{getValue(certification, 'certifying_physician') || getValue(certification, 'physician_name')}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CertificateTemplate;
