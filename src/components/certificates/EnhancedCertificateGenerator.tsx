
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, User, Building, Briefcase } from 'lucide-react';
import CertificatePromotionDialog from './CertificatePromotionDialog';
import { useOrganization } from '@/contexts/OrganizationContext';

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
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const { currentOrganization } = useOrganization();
  
  // Handle different data sources: direct extractedData, document with extracted_data, or certificateData
  const dataToUse = extractedData || 
                   (document?.extracted_data) || 
                   certificateData;
                  
  // Extract and prepare certificate data
  const extractedCertData = dataToUse ? extractCertificateData(dataToUse) : null;
  const formattedData = extractedCertData ? formatCertificateData(extractedCertData) : null;
  
  // Check if document is already promoted
  const isPromoted = document?.validation_status === 'promoted_to_patient';
  const isValidated = document?.validation_status === 'validated';
  
  // Initialize form data with extracted certificate data when component mounts or data changes
  useEffect(() => {
    if (extractedCertData) {
      const status = determineFitnessStatus(extractedCertData);
      setFitnessStatus(status);
      
      setFormData({
        patientName: formattedData?.patientName || '',
        patientId: formattedData?.patientId || '',
        companyName: formattedData?.companyName || '',
        occupation: formattedData?.occupation || '',
        restrictionsText: formattedData?.restrictionsText || 'None',
        fitnessStatus: status,
        examinationDate: formattedData?.examinationDate || '',
        expiryDate: formattedData?.expiryDate || '',
        examinationType: formattedData?.examinationType || 'pre-employment',
        comments: formattedData?.comments || '',
        followUpActions: formattedData?.followUpActions || ''
      });
    }
  }, [extractedCertData, formattedData]);
  
  // Get document ID from props or from document object
  const effectiveDocumentId = documentId || document?.id;

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
        await onSave({
          ...formData,
          fitnessStatus: fitnessStatus
        });
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
    // When toggling edit mode, ensure form data is properly initialized
    if (!isEditing && formattedData) {
      setFormData({
        patientName: formattedData.patientName || '',
        patientId: formattedData.patientId || '',
        companyName: formattedData.companyName || '',
        occupation: formattedData.occupation || '',
        restrictionsText: formattedData.restrictionsText || 'None',
        fitnessStatus: fitnessStatus,
        examinationDate: formattedData.examinationDate || '',
        expiryDate: formattedData.expiryDate || '',
        examinationType: formattedData.examinationType || 'pre-employment',
        comments: formattedData.comments || '',
        followUpActions: formattedData.followUpActions || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handlePromoteToPatient = () => {
    setShowPromotionDialog(true);
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Certificate Data Management
            <div className="flex gap-2">
              {isPromoted && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <User className="h-3 w-3 mr-1" />
                  Patient Record Created
                </Badge>
              )}
              {isValidated && !isPromoted && (
                <Badge variant="secondary">
                  Validated
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient Information
              </h3>
              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <Input 
                    placeholder="Patient Name"
                    value={formData.patientName || formattedData.patientName || ''}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                  />
                  <Input 
                    placeholder="ID Number"
                    value={formData.patientId || formattedData.patientId || ''}
                    onChange={(e) => handleInputChange('patientId', e.target.value)}
                  />
                </div>
              ) : (
                <div className="mt-2">
                  <p className="font-medium">{formData.patientName || formattedData.patientName}</p>
                  <p className="text-sm text-gray-500">
                    ID: {formData.patientId || formattedData.patientId}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company & Role
              </h3>
              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <Input 
                    placeholder="Company Name"
                    value={formData.companyName || formattedData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                  />
                  <Input 
                    placeholder="Job Title"
                    value={formData.occupation || formattedData.occupation || ''}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                  />
                </div>
              ) : (
                <div className="mt-2">
                  <p>{formData.companyName || formattedData.companyName}</p>
                  <p className="text-sm text-gray-500">{formData.occupation || formattedData.occupation}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Examination Details
              </h3>
              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <Input 
                    type="date"
                    placeholder="Examination Date"
                    value={formData.examinationDate || ''}
                    onChange={(e) => handleInputChange('examinationDate', e.target.value)}
                  />
                  <Input 
                    type="date"
                    placeholder="Expiry Date"
                    value={formData.expiryDate || ''}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                  <Select value={formData.examinationType || 'pre-employment'} onValueChange={(value) => handleInputChange('examinationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Examination Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre-employment">Pre-Employment</SelectItem>
                      <SelectItem value="periodical">Periodical</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Date:</span> {formData.examinationDate || 'Not specified'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Expires:</span> {formData.expiryDate || 'Not specified'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type:</span> {formData.examinationType || 'Pre-Employment'}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold">Medical Status</h3>
              <div className={`
                inline-block px-2 py-1 rounded-md text-sm font-medium mt-2
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
                    placeholder="Restrictions (or 'None')"
                    value={formData.restrictionsText || formattedData.restrictionsText || 'None'}
                    onChange={(e) => handleInputChange('restrictionsText', e.target.value)}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2">{formData.restrictionsText || formattedData.restrictionsText}</p>
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
              
              {!isEditing && !isPromoted && (
                <Button 
                  onClick={handlePromoteToPatient}
                  disabled={!effectiveDocumentId || !currentOrganization}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Create Patient Record
                </Button>
              )}

              {!isEditing && !isPromoted && (
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  variant="outline"
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

      <CertificatePromotionDialog
        isOpen={showPromotionDialog}
        onClose={() => setShowPromotionDialog(false)}
        documentId={effectiveDocumentId || ''}
        validatedData={formData}
        organizationId={currentOrganization?.id || ''}
        clientOrganizationId={document?.client_organization_id}
        onPromotionComplete={() => {
          // Refresh the component or notify parent
          toast.success('Patient record created successfully!');
          if (onClose) onClose();
        }}
      />
    </>
  );
};

export default EnhancedCertificateGenerator;
