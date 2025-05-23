
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';

export interface EnhancedCertificateGeneratorProps {
  documentId?: string;
  patientId?: string;
  certificateData?: any;
  document?: any;
  extractedData?: any;
  onGenerate?: () => Promise<void>;
  onClose?: () => void;
  editable?: boolean;
  onSave?: (data: any) => Promise<void>;
}

const EnhancedCertificateGenerator: React.FC<EnhancedCertificateGeneratorProps> = ({
  documentId,
  patientId,
  certificateData,
  document,
  extractedData,
  onGenerate = async () => { /* Default empty async function */ },
  onClose,
  editable = false,
  onSave
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fitnessStatus, setFitnessStatus] = useState<string>('unknown');
  const [isEditing, setIsEditing] = useState(editable);
  const [formData, setFormData] = useState<any>({});
  
  // Handle different data sources: direct extractedData, document with extracted_data, or certificateData
  const dataToUse = extractedData || 
                   (document?.extracted_data) || 
                   certificateData;
                  
  // Extract and prepare certificate data
  const extractedCertData = dataToUse ? extractCertificateData(dataToUse) : null;
  const formattedData = extractedCertData ? formatCertificateData(extractedCertData) : null;
  
  // Initialize form data with extracted certificate data
  useEffect(() => {
    if (extractedCertData) {
      setFormData({
        patientName: formattedData?.patientName || '',
        patientId: formattedData?.patientId || '',
        companyName: formattedData?.companyName || '',
        occupation: formattedData?.occupation || '',
        restrictionsText: formattedData?.restrictionsText || 'None',
        fitnessStatus: fitnessStatus
      });
    }
  }, [extractedCertData, formattedData, fitnessStatus]);
  
  // Get document ID from props or from document object
  const effectiveDocumentId = documentId || document?.id;
  
  // Determine fitness status if we have data
  React.useEffect(() => {
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

  const handleSave = async () => {
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(formData);
        toast.success("Certificate data saved successfully");
        setIsEditing(false);
      } catch (error) {
        console.error("Error saving certificate data:", error);
        toast.error("Failed to save certificate data");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
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
      <CardHeader>
        <CardTitle>Certificate Generation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Patient Information</h3>
            {isEditing ? (
              <Input 
                value={formData.patientName || ''}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                className="mb-2"
              />
            ) : (
              <p>{formData.patientName || formattedData.patientName}</p>
            )}
            <p className="text-sm text-gray-500">
              ID: {isEditing ? (
                <Input 
                  value={formData.patientId || ''}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="mt-1"
                />
              ) : (
                formData.patientId || formattedData.patientId
              )}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold">Company</h3>
            {isEditing ? (
              <Input 
                value={formData.companyName || ''}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="mb-2"
              />
            ) : (
              <p>{formData.companyName || formattedData.companyName}</p>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold">Occupation</h3>
            {isEditing ? (
              <Input 
                value={formData.occupation || ''}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className="mb-2"
              />
            ) : (
              <p>{formData.occupation || formattedData.occupation}</p>
            )}
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
            
            {isEditing && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="status-fit"
                    checked={fitnessStatus === 'fit'}
                    onCheckedChange={() => setFitnessStatus('fit')}
                  />
                  <label htmlFor="status-fit">Fit</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="status-fit-with-restrictions"
                    checked={fitnessStatus === 'fit-with-restrictions'}
                    onCheckedChange={() => setFitnessStatus('fit-with-restrictions')}
                  />
                  <label htmlFor="status-fit-with-restrictions">Fit with restrictions</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="status-temporarily-unfit"
                    checked={fitnessStatus === 'temporarily-unfit'}
                    onCheckedChange={() => setFitnessStatus('temporarily-unfit')}
                  />
                  <label htmlFor="status-temporarily-unfit">Temporarily Unfit</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="status-unfit"
                    checked={fitnessStatus === 'unfit'}
                    onCheckedChange={() => setFitnessStatus('unfit')}
                  />
                  <label htmlFor="status-unfit">Unfit</label>
                </div>
              </div>
            )}
          </div>
          
          {(formattedData.restrictionsText !== 'None' || isEditing) && (
            <div>
              <h3 className="font-semibold">Restrictions</h3>
              {isEditing ? (
                <Input 
                  value={formData.restrictionsText || 'None'}
                  onChange={(e) => handleInputChange('restrictionsText', e.target.value)}
                  className="mb-2"
                />
              ) : (
                <p>{formData.restrictionsText || formattedData.restrictionsText}</p>
              )}
            </div>
          )}
          
          <div className="flex space-x-2">
            {onSave && (
              <>
                {isEditing ? (
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                ) : (
                  <Button 
                    onClick={toggleEditMode}
                    variant="outline"
                    className="flex-1"
                  >
                    Edit Certificate
                  </Button>
                )}
              </>
            )}
            
            {!isEditing && (
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Certificate'}
              </Button>
            )}
            
            {isEditing && (
              <Button 
                onClick={toggleEditMode}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCertificateGenerator;
