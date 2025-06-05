
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Edit, FileText } from 'lucide-react';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import type { DatabaseDocument } from '@/types/database';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificatePromotionDialog from './certificates/CertificatePromotionDialog';
import CertificateTemplate from './CertificateTemplate';

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
  const [editableData, setEditableData] = useState<any>(null);

  useEffect(() => {
    console.log('CertificateValidator received document:', document);
    
    if (!document) {
      console.error('CertificateValidator: No document provided');
      return;
    }

    // Use extracted_data from database
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
      
      const processedData = {
        ...formattedData,
        fitnessStatus
      };
      
      setValidatedData(processedData);
      setEditableData(processedData);
    } catch (error) {
      console.error('Error processing certificate data:', error);
    }
  }, [document]);

  const handleDataChange = (updatedData: any) => {
    setEditableData(updatedData);
  };

  const handleOpenPromotionDialog = () => {
    if (editableData && currentOrganization) {
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
        <CardContent>
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Review and edit the extracted certificate data below. Make any necessary corrections before creating a patient record.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 mb-4">
            <Button 
              onClick={handleOpenPromotionDialog}
              className="flex items-center gap-2"
              disabled={!currentOrganization || !editableData}
            >
              <Edit className="h-4 w-4" />
              Validate Data & Create Patient Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Editable Certificate Template */}
      <div className="border rounded-lg p-4">
        <CertificateTemplate 
          extractedData={editableData}
          editable={true}
          onDataChange={handleDataChange}
        />
      </div>

      {isPromotionDialogOpen && editableData && currentOrganization && (
        <CertificatePromotionDialog
          isOpen={isPromotionDialogOpen}
          onClose={() => setIsPromotionDialogOpen(false)}
          documentId={document.id}
          validatedData={editableData}
          organizationId={currentOrganization.id}
          clientOrganizationId={document.client_organization_id}
          onPromotionComplete={handlePromotionComplete}
        />
      )}
    </div>
  );
};

export default CertificateValidator;
