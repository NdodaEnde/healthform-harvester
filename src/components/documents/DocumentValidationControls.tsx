
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Edit, User } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificatePromotionDialog from '../certificates/CertificatePromotionDialog';
import type { DatabaseDocument } from '@/types/database';

interface DocumentValidationControlsProps {
  document: DatabaseDocument;
  isValidated: boolean;
  validatedData: any;
  onValidationModeChange: (enabled: boolean) => void;
  onValidationComplete?: () => void;
}

const DocumentValidationControls: React.FC<DocumentValidationControlsProps> = ({
  document,
  isValidated,
  validatedData,
  onValidationModeChange,
  onValidationComplete
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
