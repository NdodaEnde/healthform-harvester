import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Edit, Save, Check } from 'lucide-react';

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
      fitnessStatus: fitnessStatus || 'unknown'
    }
  });

  // Update form when formattedData changes
  useEffect(() => {
    if (formattedData) {
      form.reset({
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
      // Call the onGenerate prop which is expected to return a Promise
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
      
      // Create updated data structure
      const updatedData = {
        structured_data: {
          patient: {
            name: values.patientName,
            id_number: values.patientId,
            company: values.companyName,
            occupation: values.occupation
          },
          certification: {
            examination_date: values.examinationDate,
            valid_until: values.validUntil
          },
          examination_results: {
            fitness: {
              fit: values.fitnessStatus === 'fit',
              fit_with_restrictions: values.fitnessStatus === 'fit-with-restrictions',
              temporarily_unfit: values.fitnessStatus === 'temporarily-unfit',
              unfit: values.fitnessStatus === 'unfit'
            }
          },
          restrictions: values.restrictionsText !== 'None' ? values.restrictionsText : null
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
        <CardTitle>Certificate Generation</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleEditMode}
          className="ml-auto mr-2"
        >
          {isEditing ? (
            <>
              <Check className="h-4 w-4 mr-2" />
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
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="patient-info">
                  <AccordionTrigger>Patient Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient ID</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="company-info">
                  <AccordionTrigger>Company Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="certification-info">
                  <AccordionTrigger>Certification Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="examinationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Examination Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valid Until</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="fitness-info">
                  <AccordionTrigger>Medical Status</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fitnessStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fitness Status</FormLabel>
                            <FormControl>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="fit">Fit</option>
                                <option value="fit-with-restrictions">Fit with Restrictions</option>
                                <option value="temporarily-unfit">Temporarily Unfit</option>
                                <option value="unfit">Unfit</option>
                                <option value="unknown">Unknown</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="restrictionsText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restrictions</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="flex justify-end space-x-2">
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
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Patient Information</h3>
              <p>{form.getValues('patientName')}</p>
              <p className="text-sm text-gray-500">ID: {form.getValues('patientId')}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Company</h3>
              <p>{form.getValues('companyName')}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Occupation</h3>
              <p>{form.getValues('occupation')}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Medical Status</h3>
              <div className={`
                inline-block px-2 py-1 rounded-md text-sm font-medium
                ${form.getValues('fitnessStatus') === 'fit' ? 'bg-green-100 text-green-800' : ''}
                ${form.getValues('fitnessStatus') === 'fit-with-restrictions' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${form.getValues('fitnessStatus') === 'temporarily-unfit' ? 'bg-orange-100 text-orange-800' : ''}
                ${form.getValues('fitnessStatus') === 'unfit' ? 'bg-red-100 text-red-800' : ''}
                ${form.getValues('fitnessStatus') === 'unknown' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {form.getValues('fitnessStatus').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </div>
            </div>
            
            {form.getValues('restrictionsText') !== 'None' && (
              <div>
                <h3 className="font-semibold">Restrictions</h3>
                <p>{form.getValues('restrictionsText')}</p>
              </div>
            )}
            
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Certificate'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedCertificateGenerator;
