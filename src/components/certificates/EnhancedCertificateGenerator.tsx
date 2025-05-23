
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Edit, Save, Check, Eye } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

export interface EnhancedCertificateGeneratorProps {
  documentId?: string;
  patientId?: string;
  certificateData?: any;
  document?: any;
  extractedData?: any;
  onGenerate?: () => Promise<void>;
  onClose?: () => void;
}

const EnhancedCertificateGenerator: React.FC<EnhancedCertificateGeneratorProps> = ({
  documentId,
  patientId,
  certificateData,
  document,
  extractedData,
  onGenerate = async () => { /* Default empty async function */ },
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fitnessStatus, setFitnessStatus] = useState<string>('unknown');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle different data sources: direct extractedData, document with extracted_data, or certificateData
  const dataToUse = extractedData || 
                   (document?.extracted_data) || 
                   certificateData;
                  
  // Extract and prepare certificate data
  const extractedCertData = dataToUse ? extractCertificateData(dataToUse) : null;
  const formattedData = extractedCertData ? formatCertificateData(extractedCertData) : null;
  
  // Get document ID from props or from document object
  const effectiveDocumentId = documentId || document?.id;

  // Get medical exam data
  const medicalTests = extractedCertData?.examination_results?.tests || {};

  // Initialize form with formatted data
  const form = useForm({
    defaultValues: {
      patientName: formattedData?.patientName || '',
      patientId: formattedData?.patientId || '',
      companyName: formattedData?.companyName || '',
      occupation: formattedData?.occupation || '',
      examinationDate: formattedData?.examinationDate || '',
      validUntil: formattedData?.validUntil || '',
      restrictionsText: formattedData?.restrictionsText || '',
      fitnessStatus: fitnessStatus || 'unknown',
      bloodsResult: medicalTests?.bloods?.result || 'N/A',
      visionResult: medicalTests?.vision?.result || 'N/A',
      hearingResult: medicalTests?.hearing?.result || 'N/A',
      heightsResult: medicalTests?.heights?.result || 'N/A',
      lungResult: medicalTests?.lung?.result || 'N/A',
      xrayResult: medicalTests?.xray?.result || 'N/A',
      drugResult: medicalTests?.drug?.result || 'N/A',
      examType: extractedCertData?.examination_results?.type?.pre_employment ? 'pre-employment' : 
                extractedCertData?.examination_results?.type?.periodical ? 'periodical' : 
                extractedCertData?.examination_results?.type?.exit ? 'exit' : 'pre-employment',
      reviewDate: extractedCertData?.followup?.review_date || '',
      restrictions: {
        heights: extractedCertData?.restrictions?.heights || false,
        dust: extractedCertData?.restrictions?.dust || false,
        motorized: extractedCertData?.restrictions?.motorized || false,
        hearing: extractedCertData?.restrictions?.hearing || false,
        confined: extractedCertData?.restrictions?.confined || false,
        chemical: extractedCertData?.restrictions?.chemical || false,
        spectacles: extractedCertData?.restrictions?.spectacles || false,
        treatment: extractedCertData?.restrictions?.treatment || false
      },
      comments: extractedCertData?.comments || ''
    }
  });

  // Update form when formattedData changes
  useEffect(() => {
    if (formattedData) {
      form.reset({
        ...form.getValues(),
        patientName: formattedData.patientName,
        patientId: formattedData.patientId,
        companyName: formattedData.companyName,
        occupation: formattedData.occupation,
        examinationDate: formattedData.examinationDate,
        validUntil: formattedData.validUntil,
        restrictionsText: formattedData.restrictionsText,
        fitnessStatus: fitnessStatus
      });
    }
  }, [formattedData, fitnessStatus]);
  
  // Determine fitness status if we have data
  useEffect(() => {
    if (extractedCertData) {
      const status = determineFitnessStatus(extractedCertData);
      setFitnessStatus(status);
    }
  }, [extractedCertData]);

  const handleGenerate = async () => {
    if (!effectiveDocumentId || !patientId) {
      toast.error("Missing required information to generate certificate");
      return;
    }
    
    try {
      setIsGenerating(true);
      await onGenerate();
      toast.success("Certificate generated successfully");
      
      // Close dialog after successful generation if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (values: any) => {
    if (!effectiveDocumentId) {
      toast.error("Missing document ID to save changes");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Map restrictions from checkboxes to object structure
      const restrictionsArray = Object.entries(values.restrictions)
        .filter(([_, isChecked]) => isChecked)
        .map(([name]) => name);
      
      // Create updated data structure
      const updatedData = {
        structured_data: {
          patient: {
            name: values.patientName,
            id_number: values.patientId
          },
          certification: {
            examination_date: values.examinationDate,
            valid_until: values.validUntil
          },
          company: {
            name: values.companyName,
          },
          patient: {
            name: values.patientName,
            id_number: values.patientId,
            occupation: values.occupation
          },
          examination_results: {
            type: {
              pre_employment: values.examType === 'pre-employment',
              periodical: values.examType === 'periodical',
              exit: values.examType === 'exit'
            },
            fitness: {
              fit: values.fitnessStatus === 'fit',
              fit_with_restrictions: values.fitnessStatus === 'fit-with-restrictions',
              fit_with_condition: values.fitnessStatus === 'fit-with-condition',
              temporarily_unfit: values.fitnessStatus === 'temporarily-unfit',
              unfit: values.fitnessStatus === 'unfit'
            },
            tests: {
              bloods: { done: !!values.bloodsResult, result: values.bloodsResult },
              vision: { done: !!values.visionResult, result: values.visionResult },
              hearing: { done: !!values.hearingResult, result: values.hearingResult },
              heights: { done: !!values.heightsResult, result: values.heightsResult },
              lung: { done: !!values.lungResult, result: values.lungResult },
              xray: { done: !!values.xrayResult, result: values.xrayResult },
              drug: { done: !!values.drugResult, result: values.drugResult }
            }
          },
          restrictions: {
            heights: values.restrictions.heights,
            dust: values.restrictions.dust,
            motorized: values.restrictions.motorized,
            hearing: values.restrictions.hearing,
            confined: values.restrictions.confined,
            chemical: values.restrictions.chemical,
            spectacles: values.restrictions.spectacles,
            treatment: values.restrictions.treatment
          },
          followup: {
            review_date: values.reviewDate
          },
          comments: values.comments
        },
        // Keep the raw_content intact
        raw_content: dataToUse?.raw_content || ''
      };
      
      // Update the document's extracted_data in the database
      const { error } = await supabase
        .from('documents')
        .update({
          extracted_data: updatedData,
          status: 'validated' // Update status to reflect validation
        })
        .eq('id', effectiveDocumentId);
      
      if (error) throw error;
      
      toast.success("Document data saved successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving document data:", error);
      toast.error("Failed to save document data");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (!extractedCertData || !formattedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificate Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No certificate data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Certificate of Fitness</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleEditMode}
          className="ml-auto mr-2"
        >
          {isEditing ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              View Mode
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Mode
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              <div className="p-4 border rounded-md bg-white">
                {/* Certificate Header */}
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-xl font-bold text-center">CERTIFICATE OF FITNESS</h2>
                </div>
                
                {/* Patient and Doctor Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Company and Job Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="examinationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Examination</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? field.value.split('T')[0] : ''} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? field.value.split('T')[0] : ''} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Examination Type */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="examType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Examination Type</FormLabel>
                        <div className="grid grid-cols-3 gap-2 border rounded-md p-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={field.value === 'pre-employment'}
                              onChange={() => field.onChange('pre-employment')}
                              className="form-radio"
                            />
                            <span>PRE-EMPLOYMENT</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={field.value === 'periodical'}
                              onChange={() => field.onChange('periodical')}
                              className="form-radio"
                            />
                            <span>PERIODICAL</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={field.value === 'exit'}
                              onChange={() => field.onChange('exit')}
                              className="form-radio"
                            />
                            <span>EXIT</span>
                          </label>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Collapsible>
                  <CollapsibleTrigger className="w-full bg-blue-900 text-white p-2 flex justify-center font-bold">
                    MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="border">
                        <div className="grid grid-cols-2">
                          <div className="border p-2 font-bold">Test</div>
                          <div className="border p-2 font-bold">Result</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="border p-2">BLOODS</div>
                          <FormField
                            control={form.control}
                            name="bloodsResult"
                            render={({ field }) => (
                              <FormControl>
                                <Input {...field} className="border-0 h-full" />
                              </FormControl>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="border p-2">FAR, NEAR VISION</div>
                          <FormField
                            control={form.control}
                            name="visionResult"
                            render={({ field }) => (
                              <FormControl>
                                <Input {...field} className="border-0 h-full" />
                              </FormControl>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="border">
                        <div className="grid grid-cols-2">
                          <div className="border p-2 font-bold">Test</div>
                          <div className="border p-2 font-bold">Result</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="border p-2">Hearing</div>
                          <FormField
                            control={form.control}
                            name="hearingResult"
                            render={({ field }) => (
                              <FormControl>
                                <Input {...field} className="border-0 h-full" />
                              </FormControl>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="border p-2">Lung Function</div>
                          <FormField
                            control={form.control}
                            name="lungResult"
                            render={({ field }) => (
                              <FormControl>
                                <Input {...field} className="border-0 h-full" />
                              </FormControl>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Followup and Review */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border">
                  <div className="p-2">
                    <span className="font-bold">Referred or follow up actions:</span>
                  </div>
                  <div className="p-2">
                    <FormField
                      control={form.control}
                      name="reviewDate"
                      render={({ field }) => (
                        <div>
                          <span className="font-bold text-red-700">Review Date: </span>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value ? field.value.split('T')[0] : ''} 
                            className="inline w-40 ml-2"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
                
                {/* Restrictions */}
                <div className="mt-4">
                  <div className="bg-blue-900 text-white p-2 flex justify-center font-bold">
                    Restrictions
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1 border">
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.heights')}
                        onChange={(e) => form.setValue('restrictions.heights', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Heights</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.dust')}
                        onChange={(e) => form.setValue('restrictions.dust', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Dust Exposure</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.motorized')}
                        onChange={(e) => form.setValue('restrictions.motorized', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Motorized Equipment</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.hearing')}
                        onChange={(e) => form.setValue('restrictions.hearing', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Wear Hearing Protection</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.confined')}
                        onChange={(e) => form.setValue('restrictions.confined', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Confined Spaces</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.chemical')}
                        onChange={(e) => form.setValue('restrictions.chemical', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Chemical Exposure</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.spectacles')}
                        onChange={(e) => form.setValue('restrictions.spectacles', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Wear Spectacles</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2 border">
                      <input
                        type="checkbox"
                        checked={form.getValues('restrictions.treatment')}
                        onChange={(e) => form.setValue('restrictions.treatment', e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Remain on Treatment</span>
                    </label>
                  </div>
                </div>
                
                {/* Medical Fitness Declaration */}
                <div className="mt-4">
                  <div className="bg-blue-900 text-white p-2 flex justify-center font-bold">
                    Medical Fitness Declaration
                  </div>
                  <FormField
                    control={form.control}
                    name="fitnessStatus"
                    render={({ field }) => (
                      <div className="grid grid-cols-5 border">
                        <label className={`flex items-center justify-center p-2 border ${field.value === 'fit' ? 'bg-green-200' : ''}`}>
                          <input
                            type="radio"
                            checked={field.value === 'fit'}
                            onChange={() => field.onChange('fit')}
                            className="form-radio mr-2"
                          />
                          <span className="font-bold">FIT</span>
                        </label>
                        <label className={`flex items-center justify-center p-2 border ${field.value === 'fit-with-restrictions' ? 'bg-yellow-200' : ''}`}>
                          <input
                            type="radio"
                            checked={field.value === 'fit-with-restrictions'}
                            onChange={() => field.onChange('fit-with-restrictions')}
                            className="form-radio mr-2"
                          />
                          <span className="font-bold text-center">Fit with Restriction</span>
                        </label>
                        <label className={`flex items-center justify-center p-2 border ${field.value === 'fit-with-condition' ? 'bg-yellow-100' : ''}`}>
                          <input
                            type="radio"
                            checked={field.value === 'fit-with-condition'}
                            onChange={() => field.onChange('fit-with-condition')}
                            className="form-radio mr-2"
                          />
                          <span className="font-bold text-center">Fit with Condition</span>
                        </label>
                        <label className={`flex items-center justify-center p-2 border ${field.value === 'temporarily-unfit' ? 'bg-orange-200' : ''}`}>
                          <input
                            type="radio"
                            checked={field.value === 'temporarily-unfit'}
                            onChange={() => field.onChange('temporarily-unfit')}
                            className="form-radio mr-2"
                          />
                          <span className="font-bold text-center">Temporary Unfit</span>
                        </label>
                        <label className={`flex items-center justify-center p-2 border ${field.value === 'unfit' ? 'bg-red-200' : ''}`}>
                          <input
                            type="radio"
                            checked={field.value === 'unfit'}
                            onChange={() => field.onChange('unfit')}
                            className="form-radio mr-2"
                          />
                          <span className="font-bold">UNFIT</span>
                        </label>
                      </div>
                    )}
                  />
                </div>
                
                {/* Comments */}
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments:</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="p-4 border rounded-md bg-white">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-bold text-center">CERTIFICATE OF FITNESS</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p><span className="font-semibold">Patient Name:</span> {form.getValues('patientName')}</p>
                <p><span className="font-semibold">Company:</span> {form.getValues('companyName')}</p>
                <p><span className="font-semibold">Date of Examination:</span> {form.getValues('examinationDate')}</p>
              </div>
              <div>
                <p><span className="font-semibold">ID Number:</span> {form.getValues('patientId')}</p>
                <p><span className="font-semibold">Job Title:</span> {form.getValues('occupation')}</p>
                <p><span className="font-semibold">Expiry Date:</span> {form.getValues('validUntil')}</p>
              </div>
            </div>
            
            <div className="mb-4 grid grid-cols-3 gap-2 border rounded-md p-2">
              <div className={`text-center p-2 ${form.getValues('examType') === 'pre-employment' ? 'bg-blue-100 font-bold' : ''}`}>
                PRE-EMPLOYMENT
                {form.getValues('examType') === 'pre-employment' && <Check className="inline-block ml-1 w-4 h-4" />}
              </div>
              <div className={`text-center p-2 ${form.getValues('examType') === 'periodical' ? 'bg-blue-100 font-bold' : ''}`}>
                PERIODICAL
                {form.getValues('examType') === 'periodical' && <Check className="inline-block ml-1 w-4 h-4" />}
              </div>
              <div className={`text-center p-2 ${form.getValues('examType') === 'exit' ? 'bg-blue-100 font-bold' : ''}`}>
                EXIT
                {form.getValues('examType') === 'exit' && <Check className="inline-block ml-1 w-4 h-4" />}
              </div>
            </div>
            
            <div className="bg-blue-900 text-white p-2 mb-2 flex justify-center font-bold">
              MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border">
                <div className="grid grid-cols-2">
                  <div className="border p-2 font-bold">Test</div>
                  <div className="border p-2 font-bold">Result</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border p-2">BLOODS</div>
                  <div className="border p-2">{form.getValues('bloodsResult')}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border p-2">FAR, NEAR VISION</div>
                  <div className="border p-2">{form.getValues('visionResult')}</div>
                </div>
              </div>
              
              <div className="border">
                <div className="grid grid-cols-2">
                  <div className="border p-2 font-bold">Test</div>
                  <div className="border p-2 font-bold">Result</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border p-2">Hearing</div>
                  <div className="border p-2">{form.getValues('hearingResult')}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border p-2">Lung Function</div>
                  <div className="border p-2">{form.getValues('lungResult')}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border">
              <div className="p-2">
                <span className="font-bold">Referred or follow up actions:</span>
              </div>
              <div className="p-2">
                <span className="font-bold text-red-700">Review Date: </span>
                {form.getValues('reviewDate')}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-blue-900 text-white p-2 flex justify-center font-bold">
                Restrictions
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 border">
                <div className={`p-2 border ${form.getValues('restrictions.heights') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.heights') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Heights
                </div>
                <div className={`p-2 border ${form.getValues('restrictions.dust') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.dust') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Dust Exposure
                </div>
                <div className={`p-2 border ${form.getValues('restrictions.motorized') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.motorized') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Motorized Equipment
                </div>
                <div className={`p-2 border ${form.getValues('restrictions.hearing') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.hearing') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Wear Hearing Protection
                </div>
                <div className={`p-2 border ${form.getValues('restrictions.confined') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.confined') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Confined Spaces
                </div>
                <div className={`p-2 border ${form.getValues('restrictions.chemical') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.chemical') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Chemical Exposure
                </div>
                <div className={`p-2 border ${form.getValues('restrictions.spectacles') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.spectacles') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Wear Spectacles
                </div>
                <div className={`p-2 border ${form.getValues('restrictions.treatment') ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('restrictions.treatment') && <Check className="inline-block mr-1 w-4 h-4" />}
                  Remain on Treatment
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="bg-blue-900 text-white p-2 flex justify-center font-bold">
                Medical Fitness Declaration
              </div>
              <div className="grid grid-cols-5 border">
                <div className={`p-2 border text-center font-bold ${form.getValues('fitnessStatus') === 'fit' ? 'bg-green-200' : ''}`}>
                  {form.getValues('fitnessStatus') === 'fit' && <Check className="inline-block mr-1 w-4 h-4" />}
                  FIT
                </div>
                <div className={`p-2 border text-center font-bold ${form.getValues('fitnessStatus') === 'fit-with-restrictions' ? 'bg-yellow-200' : ''}`}>
                  {form.getValues('fitnessStatus') === 'fit-with-restrictions' && <Check className="inline-block mr-1 w-4 h-4" />}
                  Fit with Restriction
                </div>
                <div className={`p-2 border text-center font-bold ${form.getValues('fitnessStatus') === 'fit-with-condition' ? 'bg-yellow-100' : ''}`}>
                  {form.getValues('fitnessStatus') === 'fit-with-condition' && <Check className="inline-block mr-1 w-4 h-4" />}
                  Fit with Condition
                </div>
                <div className={`p-2 border text-center font-bold ${form.getValues('fitnessStatus') === 'temporarily-unfit' ? 'bg-orange-200' : ''}`}>
                  {form.getValues('fitnessStatus') === 'temporarily-unfit' && <Check className="inline-block mr-1 w-4 h-4" />}
                  Temporary Unfit
                </div>
                <div className={`p-2 border text-center font-bold ${form.getValues('fitnessStatus') === 'unfit' ? 'bg-red-200' : ''}`}>
                  {form.getValues('fitnessStatus') === 'unfit' && <Check className="inline-block mr-1 w-4 h-4" />}
                  UNFIT
                </div>
              </div>
            </div>
            
            {form.getValues('comments') && (
              <div className="mb-6">
                <p><span className="font-semibold">Comments:</span> {form.getValues('comments')}</p>
              </div>
            )}
            
            <div className="text-center">
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full max-w-md"
              >
                {isGenerating ? 'Generating...' : 'Generate Certificate'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedCertificateGenerator;
