
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

  useEffect(() => {
    console.log('CertificateValidator received document:', document);
    
    if (!document) {
      console.error('CertificateValidator: No document provided');
      return;
    }

    // Use extracted_data (snake_case from DB)
    const extractedData = document.extracted_data;
    
    if (!extractedData) {
      console.error('CertificateValidator: No extracted data in document');
      return;
    }

    try {
      // Create a normalized document object with extracted_data for the utility functions
      const normalizedDocument = {
        ...document,
        extracted_data: extractedData
      };
      
      const certificateData = extractCertificateData(normalizedDocument);
      const formattedData = formatCertificateData(certificateData);
      const fitnessStatus = determineFitnessStatus(certificateData);
      
      setValidatedData({
        ...formattedData,
        fitnessStatus
      });
    } catch (error) {
      console.error('Error processing certificate data:', error);
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

  if (!document) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          No document provided for validation.
        </AlertDescription>
      </Alert>
    );
  }

  const extractedData = document.extracted_data;
  
  if (!extractedData || !validatedData) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          No certificate data available for validation.
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
                <span>{validatedData.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ID Number:</span>
                <span>{validatedData.patientId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Company:</span>
                <span>{validatedData.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Occupation:</span>
                <span>{validatedData.occupation}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Examination Date:</span>
                <span>{validatedData.examinationDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Fitness Status:</span>
                <Badge variant={validatedData.fitnessStatus === 'fit' ? 'default' : 'secondary'}>
                  {validatedData.fitnessStatus}
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
              Create Patient Record
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
