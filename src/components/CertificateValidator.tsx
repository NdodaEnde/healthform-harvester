
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Edit, FileText, User, Calendar, Building, Briefcase } from 'lucide-react';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import type { DatabaseDocument } from '@/types/database';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificatePromotionDialog from './certificates/CertificatePromotionDialog';

interface CertificateValidatorProps {
  document: DatabaseDocument;
  onValidationComplete?: () => void;
}

const CertificateValidator: React.FC<CertificateValidatorProps> = ({ 
  document, 
  onValidationComplete 
}) => {
  const { currentOrganization } = useOrganization();
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [validatedData, setValidatedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (document.extracted_data) {
      try {
        console.log('Processing certificate data for document:', document.id);
        setIsProcessing(true);
        
        const certificateData = extractCertificateData(document);
        const formattedData = formatCertificateData(certificateData);
        const fitnessStatus = determineFitnessStatus(certificateData);
        
        setValidatedData({
          ...formattedData,
          fitnessStatus
        });
        
        console.log('Certificate data processed successfully:', formattedData);
      } catch (error) {
        console.error('Error processing certificate data:', error);
        setValidatedData(null);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [document]);

  const handleOpenPromotionDialog = () => {
    if (validatedData && currentOrganization) {
      setIsPromotionDialogOpen(true);
    }
  };

  const handlePromotionComplete = () => {
    setIsPromotionDialogOpen(false);
    onValidationComplete?.();
  };

  if (!document.extracted_data) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          No certificate data available for validation.
        </AlertDescription>
      </Alert>
    );
  }

  if (isProcessing) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Processing certificate data...
        </AlertDescription>
      </Alert>
    );
  }

  if (!validatedData) {
    return (
      <Alert variant="destructive">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Unable to process certificate data. The document may not contain valid medical certificate information.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Certificate Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Patient:</span>
                <span>{validatedData.patientName || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ID Number:</span>
                <span>{validatedData.patientId || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Company:</span>
                <span>{validatedData.companyName || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Occupation:</span>
                <span>{validatedData.occupation || 'Not specified'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Examination Date:</span>
                <span>{validatedData.examinationDate || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Fitness Status:</span>
                <Badge variant={validatedData.fitnessStatus === 'fit' ? 'default' : 'secondary'}>
                  {validatedData.fitnessStatus || 'Unknown'}
                </Badge>
              </div>
              {validatedData.expiryDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Valid Until:</span>
                  <span>{validatedData.expiryDate}</span>
                </div>
              )}
              {validatedData.restrictionsText && validatedData.restrictionsText !== 'None' && (
                <div className="flex items-start gap-2">
                  <span className="font-medium">Restrictions:</span>
                  <span className="text-sm">{validatedData.restrictionsText}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleOpenPromotionDialog}
              className="flex items-center gap-2"
              disabled={!currentOrganization}
            >
              <Edit className="h-4 w-4" />
              Validate Data & Create Patient Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {isPromotionDialogOpen && validatedData && currentOrganization && (
        <CertificatePromotionDialog
          isOpen={isPromotionDialogOpen}
          onClose={() => setIsPromotionDialogOpen(false)}
          documentId={document.id}
          validatedData={validatedData}
          organizationId={currentOrganization.id}
          clientOrganizationId={document.client_organization_id}
          onPromotionComplete={handlePromotionComplete}
        />
      )}
    </div>
  );
};

export default CertificateValidator;
