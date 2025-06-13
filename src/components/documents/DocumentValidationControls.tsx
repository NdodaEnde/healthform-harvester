import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Edit, User, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificatePromotionDialog from '../certificates/CertificatePromotionDialog';
import type { DatabaseDocument } from '@/types/database';

interface DocumentValidationControlsProps {
  document: DatabaseDocument;
  isValidated: boolean;
  validatedData: any;
  onValidationModeChange: (enabled: boolean) => void;
  onValidationComplete?: () => void;
  selectedTemplate?: 'modern' | 'historical';
  onTemplateChange?: (template: 'modern' | 'historical') => void;
}

const DocumentValidationControls: React.FC<DocumentValidationControlsProps> = ({
  document,
  isValidated,
  validatedData,
  onValidationModeChange,
  onValidationComplete,
  selectedTemplate = 'modern', // Default to modern for new documents
  onTemplateChange
}) => {
  const { currentOrganization } = useOrganization();
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);

  const handleCreatePatientRecord = () => {
    if (validatedData && currentOrganization) {
      console.log('Opening promotion dialog with validated data:', validatedData);
      setIsPromotionDialogOpen(true);
    }
  };

  const handlePromotionComplete = () => {
    setIsPromotionDialogOpen(false);
    onValidationComplete?.();
  };

  // CORRECTED: Auto-detect template based on document data
  const detectTemplate = (data: any): 'modern' | 'historical' => {
    const getValue = (obj: any, path: string): any => {
      if (!obj || !path) return null;
      const keys = path.split('.');
      let current = obj;
      for (const key of keys) {
        if (current === undefined || current === null || typeof current !== 'object') {
          return null;
        }
        current = current[key];
      }
      return current;
    };

    // Check for signature data
    const hasSignature = !!(
      getValue(data, 'signature') ||
      getValue(data, 'structured_data.signature') ||
      getValue(data, 'extracted_data.signature') ||
      getValue(data, 'certificate_info.signature') ||
      getValue(data, 'structured_data.certificate_info.signature')
    );

    // Check for stamp data
    const hasStamp = !!(
      getValue(data, 'stamp') ||
      getValue(data, 'structured_data.stamp') ||
      getValue(data, 'extracted_data.stamp') ||
      getValue(data, 'certificate_info.stamp') ||
      getValue(data, 'structured_data.certificate_info.stamp')
    );

    const hasSignatureStampData = hasSignature || hasStamp;
    
    // CORRECTED LOGIC:
    // Historical documents (filed records) have physical signatures/stamps → Historical template
    // Modern documents (current workflow) don't have signatures/stamps yet → Modern template
    const detectedTemplate = hasSignatureStampData ? 'historical' : 'modern';
    
    console.log('Template detection:', {
      hasSignature,
      hasStamp,
      hasSignatureStampData,
      detectedTemplate,
      reasoning: hasSignatureStampData 
        ? 'Found signature/stamp data → Historical template (filed document)' 
        : 'No signature/stamp data → Modern template (current workflow)'
    });
    
    return detectedTemplate;
  };

  // Auto-detect template when document changes
  React.useEffect(() => {
    if (document?.extracted_data && onTemplateChange) {
      const detectedTemplate = detectTemplate(document.extracted_data);
      onTemplateChange(detectedTemplate);
    }
  }, [document?.extracted_data, onTemplateChange]);

  // Get auto-detected template for display
  const autoDetectedTemplate = document?.extracted_data ? detectTemplate(document.extracted_data) : 'modern';
  const isUsingAutoDetection = selectedTemplate === autoDetectedTemplate;

  // Transform the validated data to match what the promotion service expects
  const transformDataForPromotion = (data: any) => {
    if (!data) return null;
    
    // Handle both old and new data structures
    const patient = data.patient || {};
    const certification = data.certification || {};
    const examination_results = data.examination_results || {};
    
    return {
      patientName: patient.name || data.patientName || 'Unknown',
      patientId: patient.id_number || data.patientId || 'Unknown',
      companyName: patient.company || data.companyName || 'Unknown',
      occupation: patient.occupation || data.occupation || 'Unknown',
      fitnessStatus: certification.fit ? 'fit' : 
                    certification.fit_with_restrictions ? 'fit_with_restrictions' : 
                    certification.temporarily_unfit ? 'temporarily_unfit' : 
                    certification.unfit ? 'unfit' : 
                    data.fitnessStatus || 'unknown',
      restrictionsText: data.restrictionsText || 'None',
      examinationDate: certification.examination_date || examination_results.date || data.examinationDate || new Date().toISOString().split('T')[0],
      expiryDate: certification.valid_until || data.expiryDate,
      examinationType: examination_results.type?.pre_employment ? 'pre-employment' :
                      examination_results.type?.periodical ? 'periodical' :
                      examination_results.type?.exit ? 'exit' : 
                      data.examinationType || 'pre-employment',
      comments: certification.comments || data.comments,
      followUpActions: certification.follow_up || data.followUpActions
    };
  };

  // Only show for processed documents
  if (document.status !== 'processed' && document.status !== 'completed') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Processed
        </Badge>
        {isValidated && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Edit className="h-3 w-3 mr-1" />
            Validated
          </Badge>
        )}
      </div>

      {/* Template Selection */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Certificate Template:</span>
          <Select value={selectedTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="historical">
                Historical Certificate
                {autoDetectedTemplate === 'historical' && (
                  <Badge variant="outline" className="ml-2 text-xs text-green-600">Auto</Badge>
                )}
              </SelectItem>
              <SelectItem value="modern">
                Modern Certificate
                {autoDetectedTemplate === 'modern' && (
                  <Badge variant="outline" className="ml-2 text-xs text-green-600">Auto</Badge>
                )}
              </SelectItem>
            </SelectContent>
          </Select>
          
          {isUsingAutoDetection ? (
            <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
              Auto-detected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
              Manual override
            </Badge>
          )}
        </div>

        {/* Template Description */}
        <div className="text-xs text-muted-foreground pl-6">
          {selectedTemplate === 'historical' 
            ? 'For filed documents with physical signatures and stamps (historical records)'
            : 'For current workflow documents without physical signatures/stamps (digital workflow)'
          }
        </div>

        {/* Auto-detection explanation */}
        <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border-l-2 border-blue-200">
          <strong>Auto-detection:</strong> {autoDetectedTemplate === 'historical' 
            ? 'Found signature/stamp data → Historical template recommended'
            : 'No signature/stamp data found → Modern template recommended'
          }
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => onValidationModeChange(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Validate Data
        </Button>

        {isValidated && validatedData && (
          <Button 
            onClick={handleCreatePatientRecord}
            className="flex items-center gap-2"
            disabled={!currentOrganization}
          >
            <User className="h-4 w-4" />
            Create Patient Record
          </Button>
        )}
      </div>

      {isPromotionDialogOpen && validatedData && currentOrganization && (
        <CertificatePromotionDialog
          isOpen={isPromotionDialogOpen}
          onClose={() => setIsPromotionDialogOpen(false)}
          documentId={document.id}
          validatedData={transformDataForPromotion(validatedData)}
          organizationId={currentOrganization.id}
          clientOrganizationId={document.client_organization_id}
          onPromotionComplete={handlePromotionComplete}
        />
      )}
    </div>
  );
};

export default DocumentValidationControls;