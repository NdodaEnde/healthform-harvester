
import React from 'react';
import { extractPath } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const CertificateTemplate = ({ extractedData }: { extractedData: any }) => {
  // Helper function to safely extract values from the data
  const getValue = (obj: any, path: string, defaultValue: string = 'N/A') => {
    if (!obj) return defaultValue;
    const value = typeof obj === 'object' ? extractPath(obj, path) : undefined;
    
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    // Clean up N/A values
    if (value === 'N/A' || value === '[ ]' || value === '[]') {
      return defaultValue;
    }
    
    return value;
  };
  
  // Check if a restriction is marked as true
  const hasRestriction = (restrictions: any, key: string) => {
    if (!restrictions) return false;
    return restrictions[key] === true;
  };
  
  // Extract the necessary data from the provided extractedData object
  const structuredData = extractedData.structured_data || extractedData;
  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || {};
  const certification = structuredData.certification || {};
  const restrictions = structuredData.restrictions || {};
  const examType = examination.type || {};
  const testResults = examination.test_results || {};
  
  // Determine the fitness status for display
  const fitnessStatus = {
    fit: certification.fit === true,
    fitWithRestrictions: certification.fit_with_restrictions === true,
    fitWithCondition: certification.fit_with_condition === true,
    temporarilyUnfit: certification.temporarily_unfit === true,
    unfit: certification.unfit === true
  };
  
  // Format date display
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format date as DD/MM/YYYY
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-4xl mx-auto">
        <div className="certificate-page bg-white text-black">
          {/* Print-friendly layer with absolute positioning */}
          <div className="fixed top-0 left-0 w-full print:hidden invisible">
            <style type="text/css" media="print">
              {`
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                .certificate-page {
                  width: 210mm;
                  min-height: 297mm;
                  padding: 10mm;
                  margin: 0 auto;
                  background: white;
                  color: black;
                  font-size: 12pt;
                }
              `}
            </style>
          </div>
          
          <div className="relative z-10">
            {/* Header section with logo */}
            <div className="px-4 pt-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold">
                    {getValue(patient, 'company', 'Company Name')}
                  </h3>
                  <p className="text-sm">
                    Occupational Health Assessment
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    Date: {formatDate(getValue(examination, 'date', new Date().toISOString().split('T')[0]))}
                  </p>
                  <p className="text-sm">
                    Valid until: {formatDate(getValue(certification, 'valid_until', 'N/A'))}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Title section */}
            <div className="bg-gray-800 text-white text-center py-2 mb-2">
              <h2 className="text-lg font-bold">CERTIFICATE OF FITNESS</h2>
            </div>
            
            {/* Doctor info */}
            <div className="text-center text-xs px-4 mb-3">
              <p>
                Dr. {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mphuthi'} / Practice No: {getValue(examination, 'practice_number') || '0404160'} / Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'} / Practice No: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            {/* Patient info section */}
            <div className="px-4 space-y-4 mb-4">
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold">Initials & Surname:</p>
                  <p>{getValue(patient, 'name')}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">ID No:</p>
                  <p>{getValue(patient, 'employee_id') || getValue(patient, 'id_number')}</p>
                </div>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold">Date of Birth:</p>
                  <p>{formatDate(getValue(patient, 'date_of_birth', 'N/A'))}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Gender:</p>
                  <p>{getValue(patient, 'gender')}</p>
                </div>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold">Company Name:</p>
                  <p>{getValue(patient, 'company')}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Job Title:</p>
                  <p>{getValue(patient, 'occupation')}</p>
                </div>
              </div>
            </div>
            
            {/* Examination type section */}
            <div className="px-4 mb-4">
              <table className="w-full border border-gray-400">
                <thead>
                  <tr className="bg-gray-200">
                    <th colSpan={3} className="text-center py-1 text-sm font-semibold">
                      EXAMINATION TYPE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center">
                    <td className="p-2 border border-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="border border-gray-400 w-4 h-4 flex items-center justify-center">
                          {examType.pre_employment ? 'X' : ''}
                        </span>
                        <span>PRE-EMPLOYMENT</span>
                      </div>
                    </td>
                    <td className="p-2 border border-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="border border-gray-400 w-4 h-4 flex items-center justify-center">
                          {examType.periodical ? 'X' : ''}
                        </span>
                        <span>PERIODICAL</span>
                      </div>
                    </td>
                    <td className="p-2 border border-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="border border-gray-400 w-4 h-4 flex items-center justify-center">
                          {examType.exit ? 'X' : ''}
                        </span>
                        <span>EXIT</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Medical tests section */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
              </div>
              
              <div className="px-4 grid grid-cols-2 gap-2">
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.bloods_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Bloods</div>
                    <div className="text-xs">{getValue(testResults, 'bloods_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.far_near_vision_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Far, Near Vision</div>
                    <div className="text-xs">{getValue(testResults, 'far_near_vision_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.side_depth_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Side & Depth</div>
                    <div className="text-xs">{getValue(testResults, 'side_depth_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.night_vision_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Night Vision</div>
                    <div className="text-xs">{getValue(testResults, 'night_vision_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.hearing_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Hearing</div>
                    <div className="text-xs">{getValue(testResults, 'hearing_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.heights_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Working at Heights</div>
                    <div className="text-xs">{getValue(testResults, 'heights_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.lung_function_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Lung Function</div>
                    <div className="text-xs">{getValue(testResults, 'lung_function_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.x_ray_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">X-Ray</div>
                    <div className="text-xs">{getValue(testResults, 'x_ray_results')}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {testResults.drug_screen_done ? 'X' : ''}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Drug Screen</div>
                    <div className="text-xs">{getValue(testResults, 'drug_screen_results')}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Referral section */}
            <div className="px-4 mb-4">
              <div className="flex items-center">
                <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
                <div className="flex-1 border-b border-gray-400 min-h-[24px] px-2">
                  {getValue(certification, 'follow_up', '')}
                </div>
              </div>
              {certification.review_date && (
                <div className="flex items-center mt-2">
                  <div className="font-semibold text-sm mr-1">Review Date:</div>
                  <div className="flex-1 border-b border-gray-400 min-h-[24px] px-2">
                    {formatDate(certification.review_date)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Restrictions section */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                RESTRICTIONS
              </div>
              
              <div className="px-4 grid grid-cols-2 gap-2">
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'heights') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Heights</div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'dust_exposure') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Dust Exposure</div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'motorized_equipment') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Motorized Equipment</div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'wear_hearing_protection') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Wear Hearing Protection</div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'confined_spaces') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Confined Spaces</div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'chemical_exposure') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Chemical Exposure</div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'wear_spectacles') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Wear Spectacles</div>
                </div>
                
                <div className="flex items-start">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mt-1 mr-2">
                    {hasRestriction(restrictions, 'remain_on_treatment_for_chronic_conditions') ? 'X' : ''}
                  </div>
                  <div className="text-sm">Remain on Treatment for Chronic Conditions</div>
                </div>
              </div>
            </div>
            
            {/* Fitness assessment section */}
            <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
              FITNESS ASSESSMENT FOR CURRENT JOB
            </div>
            
            <div className="px-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mr-2">
                    {fitnessStatus.fit ? 'X' : ''}
                  </div>
                  <span className="text-sm">FIT</span>
                </div>
                
                <div className="flex items-center">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mr-2">
                    {fitnessStatus.fitWithRestrictions ? 'X' : ''}
                  </div>
                  <span className="text-sm">FIT WITH RESTRICTIONS</span>
                </div>
                
                <div className="flex items-center">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mr-2">
                    {fitnessStatus.fitWithCondition ? 'X' : ''}
                  </div>
                  <span className="text-sm">FIT WITH CONDITION</span>
                </div>
                
                <div className="flex items-center">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mr-2">
                    {fitnessStatus.temporarilyUnfit ? 'X' : ''}
                  </div>
                  <span className="text-sm">TEMPORARILY UNFIT</span>
                </div>
                
                <div className="flex items-center">
                  <div className="border border-gray-400 w-4 h-4 flex items-center justify-center mr-2">
                    {fitnessStatus.unfit ? 'X' : ''}
                  </div>
                  <span className="text-sm">UNFIT</span>
                </div>
              </div>
            </div>
            
            {/* Comments section */}
            <div className="mb-4 px-4">
              <div className="mb-2 mt-2">
                <div className="font-semibold text-sm">Comments:</div>
                <div className="min-h-[60px] border border-gray-300 p-2 text-sm">
                  {getValue(certification, 'comments', '')}
                </div>
              </div>
              
              {/* Signature section with 3-column layout as shown in image */}
              <div className="mt-6 mb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="border-b border-gray-400 min-h-[60px]"></div>
                    <div className="text-center text-sm font-bold mt-2">SIGNATURE</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="min-h-[60px]"></div>
                    <div className="text-center text-sm">
                      <p className="font-bold">Occupational Health Practitioner / Occupational Medical Practitioner</p>
                      <p>Dr MJ Mphuthi / Practice No. 0404160</p>
                      <p>Sr. Sibongile Mahlangu</p>
                      <p>SANC No: 14262133; SASOHN No: AR 2136 / MBCHB DOH</p>
                      <p>Practice Number: 999 088 0000 8177 91</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="border-b border-gray-400 min-h-[60px]"></div>
                    <div className="text-center text-sm font-bold mt-2">STAMP</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-6 px-4 text-center text-xs text-gray-500">
              <p>This certificate is valid for the type of assessment conducted as indicated above.</p>
              <p>It may need to be reviewed if the employee's health status or job description changes.</p>
            </div>
          </div>
        </div>
      </Card>
    </ScrollArea>
  );
};

export default CertificateTemplate;
