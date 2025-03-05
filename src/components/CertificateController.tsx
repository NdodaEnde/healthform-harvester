import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import CertificateEditor from "./CertificateEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CertificateControllerProps {
  documentId: string;
  extractedData: any;
  onSave: (updatedData: any) => void;
}

const CertificateController = ({ 
  documentId, 
  extractedData, 
  onSave 
}: CertificateControllerProps) => {
  // State to track if we're in edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State to store the certificate data
  const [certificateData, setCertificateData] = useState<any>(null);

  // Initialize with document data when it loads
  useEffect(() => {
    if (extractedData) {
      setCertificateData(extractedData);
    }
  }, [extractedData]);

  // Handle switching to edit mode
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle saving changes
  const handleSaveChanges = async (editedData: any) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          extracted_data: editedData
        })
        .eq('id', documentId);
      
      if (error) {
        toast.error("Failed to save changes", {
          description: error.message
        });
        console.error("Save error:", error);
        return;
      }
      
      // Update local state with edited data
      setCertificateData(editedData);
      
      // Call the parent save handler
      onSave(editedData);
      
      // Exit edit mode
      setIsEditing(false);
      
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Save error:", error);
    }
  };

  // Handle cancelling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // If data isn't loaded yet, show loading
  if (!certificateData) {
    return <div className="p-8 text-center">Loading certificate data...</div>;
  }

  // Show either the viewer or editor based on mode
  if (isEditing) {
    return (
      <CertificateEditor
        documentId={documentId}
        extractedData={certificateData}
        onSave={handleSaveChanges}
      />
    );
  }

  // Otherwise show the viewer
  return (
    <CertificateViewer 
      certificateData={certificateData} 
      onEdit={handleEditClick}
    />
  );
};

// CertificateViewer component - displays the certificate in non-editable format
const CertificateViewer = ({ 
  certificateData, 
  onEdit 
}: { 
  certificateData: any;
  onEdit: () => void;
}) => {
  // Helper to get value safely
  const getValue = (obj: any, path: string, defaultValue = '') => {
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
  
  // Extract data from the certificate structure
  const structuredData = certificateData.structured_data || {};
  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || {};
  const certification = structuredData.certification || {};
  const restrictions = structuredData.restrictions || {};
  const testResults = examination.test_results || {};
  
  return (
    <ScrollArea className="h-full">
      <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black relative">
        {/* Edit button floating at the top right */}
        <Button 
          onClick={onEdit}
          className="absolute top-2 right-2 bg-blue-600 text-white hover:bg-blue-700 z-10"
        >
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
        
        <div className="relative overflow-hidden">
          {/* Certificate watermark */}
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
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'name')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'id_number')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'company')}</span>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(examination, 'date')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(certification, 'valid_until')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'occupation')}</span>
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
                    <td className="border border-gray-400 h-8 text-center">
                      {getValue(examination, 'type.pre_employment') === 'true' ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {getValue(examination, 'type.periodical') === 'true' ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {getValue(examination, 'type.exit') === 'true' ? '✓' : ''}
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
                            {getValue(testResults, 'bloods_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'bloods_results')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {getValue(testResults, 'far_near_vision_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'far_near_vision_results')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {getValue(testResults, 'side_depth_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'side_depth_results')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {getValue(testResults, 'night_vision_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'night_vision_results')}
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
                            {getValue(testResults, 'hearing_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'hearing_results')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {getValue(testResults, 'heights_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'heights_results')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {getValue(testResults, 'lung_function_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'lung_function_results')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {getValue(testResults, 'x_ray_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'x_ray_results')}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {getValue(testResults, 'drug_screen_done') === 'true' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm text-center">
                            {getValue(testResults, 'drug_screen_results')}
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
                <div className="border-b border-gray-400 flex-1">
                  {getValue(certification, 'follow_up')}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">{getValue(certification, 'review_date')}</span>
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
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'heights') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Heights</div>
                        <div className="text-xs">{getValue(restrictions, 'heights') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'dust_exposure') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Dust Exposure</div>
                        <div className="text-xs">{getValue(restrictions, 'dust_exposure') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'motorized_equipment') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Motorized Equipment</div>
                        <div className="text-xs">{getValue(restrictions, 'motorized_equipment') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'wear_hearing_protection') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Hearing Protection</div>
                        <div className="text-xs">{getValue(restrictions, 'wear_hearing_protection') === 'true' ? '✓' : ''}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'confined_spaces') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Confined Spaces</div>
                        <div className="text-xs">{getValue(restrictions, 'confined_spaces') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'chemical_exposure') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Chemical Exposure</div>
                        <div className="text-xs">{getValue(restrictions, 'chemical_exposure') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'wear_spectacles') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Spectacles</div>
                        <div className="text-xs">{getValue(restrictions, 'wear_spectacles') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${getValue(restrictions, 'remain_on_treatment_for_chronic_conditions') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Remain on Treatment for Chronic Conditions</div>
                        <div className="text-xs">{getValue(restrictions, 'remain_on_treatment_for_chronic_conditions') === 'true' ? '✓' : ''}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Fitness Status */}
            <div className="mb-6">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                Medical Fitness Declaration
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-3 text-center ${getValue(certification, 'fit') === 'true' ? 'bg-green-100' : ''}`}>
                        <div className="font-semibold text-sm">FIT</div>
                        <div className="mt-1 text-sm">{getValue(certification, 'fit') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${getValue(certification, 'fit_with_restrictions') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Restriction</div>
                        <div className="mt-1 text-sm">{getValue(certification, 'fit_with_restrictions') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${getValue(certification, 'fit_with_condition') === 'true' ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Condition</div>
                        <div className="mt-1 text-sm">{getValue(certification, 'fit_with_condition') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${getValue(certification, 'temporarily_unfit') === 'true' ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">Temporary Unfit</div>
                        <div className="mt-1 text-sm">{getValue(certification, 'temporarily_unfit') === 'true' ? '✓' : ''}</div>
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${getValue(certification, 'unfit') === 'true' ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">UNFIT</div>
                        <div className="mt-1 text-sm">{getValue(certification, 'unfit') === 'true' ? '✓' : ''}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comments */}
            <div className="px-4 mb-6">
              <div className="flex flex-col">
                <div className="font-semibold text-sm mb-1">Comments:</div>
                <div className="border border-gray-400 p-2 min-h-24 text-sm">
                  {getValue(certification, 'comments') || 'N/A'}
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
          </div>
        </div>
      </Card>
    </ScrollArea>
  );
};

export default CertificateController;
