
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

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
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  
  // Handle different data sources: direct extractedData, document with extracted_data, or certificateData
  const dataToUse = extractedData || 
                   (document?.extracted_data) || 
                   certificateData;
                  
  // Extract and prepare certificate data
  const extractedCertData = dataToUse ? extractCertificateData(dataToUse) : null;
  const formattedData = extractedCertData ? formatCertificateData(extractedCertData) : null;
  
  // Get document ID from props or from document object
  const effectiveDocumentId = documentId || document?.id;
  
  // Initialize edited data from extracted data
  useEffect(() => {
    if (formattedData) {
      setEditedData({
        patientName: formattedData.patientName || '',
        patientId: formattedData.patientId || '',
        companyName: formattedData.companyName || '',
        occupation: formattedData.occupation || '',
        validUntil: formattedData.validUntil || '',
        examinationDate: formattedData.examinationDate || '',
        restrictionsText: formattedData.restrictionsText || 'None',
        comments: formattedData.comments || '',
        followUpActions: formattedData.followUpActions || '',
        reviewDate: formattedData.reviewDate || ''
      });
    }
  }, [formattedData]);
  
  // Determine fitness status if we have data
  useEffect(() => {
    if (extractedCertData) {
      const status = determineFitnessStatus(extractedCertData);
      setFitnessStatus(status);
    }
  }, [extractedCertData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFitnessStatusChange = (value: string) => {
    setFitnessStatus(value);
  };

  const handleGenerate = async () => {
    if (!effectiveDocumentId && !patientId) {
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

  if (!extractedCertData || !formattedData || !editedData) {
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
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'View Mode' : 'Edit Mode'}
        </Button>
      </CardHeader>
      <CardContent>
        {editMode ? (
          <div className="space-y-4">
            <Accordion type="single" collapsible defaultValue="patient-info">
              <AccordionItem value="patient-info">
                <AccordionTrigger>Patient Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        name="patientName"
                        value={editedData.patientName}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="patientId">Patient ID</Label>
                      <Input
                        id="patientId"
                        name="patientId"
                        value={editedData.patientId}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="company-info">
                <AccordionTrigger>Company Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={editedData.companyName}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        value={editedData.occupation}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="medical-info">
                <AccordionTrigger>Medical Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="examinationDate">Examination Date</Label>
                      <Input
                        id="examinationDate"
                        name="examinationDate"
                        type="date"
                        value={editedData.examinationDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Input
                        id="validUntil"
                        name="validUntil"
                        type="date"
                        value={editedData.validUntil}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fitnessStatus">Medical Status</Label>
                      <Select 
                        value={fitnessStatus}
                        onValueChange={handleFitnessStatusChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fit">Fit</SelectItem>
                          <SelectItem value="fit-with-restrictions">Fit with Restrictions</SelectItem>
                          <SelectItem value="temporarily-unfit">Temporarily Unfit</SelectItem>
                          <SelectItem value="unfit">Unfit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="restrictionsText">Restrictions</Label>
                      <Textarea
                        id="restrictionsText"
                        name="restrictionsText"
                        value={editedData.restrictionsText}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="additional-info">
                <AccordionTrigger>Additional Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="comments">Comments</Label>
                      <Textarea
                        id="comments"
                        name="comments"
                        value={editedData.comments}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="followUpActions">Follow-up Actions</Label>
                      <Textarea
                        id="followUpActions"
                        name="followUpActions"
                        value={editedData.followUpActions}
                        onChange={handleInputChange}
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reviewDate">Review Date</Label>
                      <Input
                        id="reviewDate"
                        name="reviewDate"
                        type="date"
                        value={editedData.reviewDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Patient Information</h3>
              <p>{editedData.patientName}</p>
              <p className="text-sm text-gray-500">ID: {editedData.patientId}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Company</h3>
              <p>{editedData.companyName}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Occupation</h3>
              <p>{editedData.occupation}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Medical Status</h3>
              <div className={`
                inline-block px-2 py-1 rounded-md text-sm font-medium
                ${fitnessStatus === 'fit' ? 'bg-green-100 text-green-800' : ''}
                ${fitnessStatus === 'fit-with-restrictions' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${fitnessStatus === 'temporarily-unfit' ? 'bg-orange-100 text-orange-800' : ''}
                ${fitnessStatus === 'unfit' ? 'bg-red-100 text-red-800' : ''}
                ${fitnessStatus === 'unknown' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {fitnessStatus.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </div>
            </div>
            
            {editedData.restrictionsText !== 'None' && (
              <div>
                <h3 className="font-semibold">Restrictions</h3>
                <p>{editedData.restrictionsText}</p>
              </div>
            )}

            {editedData.comments && (
              <div>
                <h3 className="font-semibold">Comments</h3>
                <p>{editedData.comments}</p>
              </div>
            )}

            {editedData.followUpActions && (
              <div>
                <h3 className="font-semibold">Follow-up Actions</h3>
                <p>{editedData.followUpActions}</p>
              </div>
            )}

            {editedData.reviewDate && (
              <div>
                <h3 className="font-semibold">Review Date</h3>
                <p>{editedData.reviewDate}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Certificate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCertificateGenerator;
