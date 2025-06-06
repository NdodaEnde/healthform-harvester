
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, FileText, Download, User, Calendar, Building, Edit } from 'lucide-react';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import type { DatabaseDocument } from '@/types/database';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificateTemplate from '../CertificateTemplate';
import CertificatePromotionDialog from '../certificates/CertificatePromotionDialog';

interface DocumentValidationWorkflowProps {
  document: DatabaseDocument;
  onValidationComplete?: () => void;
}

const DocumentValidationWorkflow: React.FC<DocumentValidationWorkflowProps> = ({ 
  document, 
  onValidationComplete 
}) => {
  const { currentOrganization } = useOrganization();
  const [certificateData, setCertificateData] = useState<any>(null);
  const [isValidationMode, setIsValidationMode] = useState(false);
  const [editableData, setEditableData] = useState<any>(null);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);

  React.useEffect(() => {
    if (document.extracted_data) {
      const data = extractCertificateData(document);
      const formattedData = formatCertificateData(data);
      const fitnessStatus = determineFitnessStatus(data);
      
      const processedData = {
        ...formattedData,
        fitnessStatus,
        rawData: data
      };
      
      setCertificateData(processedData);
      setEditableData(processedData);
    }
  }, [document]);

  const handleValidateData = () => {
    setIsValidationMode(true);
  };

  const handleBackToView = () => {
    setIsValidationMode(false);
  };

  const handleDataChange = (updatedData: any) => {
    setEditableData(updatedData);
  };

  const handleValidateAndCreateRecord = () => {
    if (editableData && currentOrganization) {
      setIsPromotionDialogOpen(true);
    }
  };

  const handlePromotionComplete = () => {
    setIsPromotionDialogOpen(false);
    setIsValidationMode(false);
    onValidationComplete?.();
  };

  const handleDownloadDocument = () => {
    if (document.public_url) {
      window.open(document.public_url, '_blank');
    }
  };

  if (!document.extracted_data) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Document is still being processed. Please wait for processing to complete.
        </AlertDescription>
      </Alert>
    );
  }

  if (!certificateData) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Unable to extract data from this document.
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
            Document - Ready for Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Processed
            </Badge>
            <Badge variant="outline">
              {document.document_type || 'Medical Document'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {!isValidationMode && (
              <Button 
                onClick={handleValidateData}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Validate Data
              </Button>
            )}
            {isValidationMode && (
              <>
                <Button 
                  onClick={handleBackToView}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Back to View
                </Button>
                <Button 
                  onClick={handleValidateAndCreateRecord}
                  className="flex items-center gap-2"
                  disabled={!currentOrganization || !editableData}
                >
                  <User className="h-4 w-4" />
                  Validate & Create Patient Record
                </Button>
              </>
            )}
            {document.public_url && (
              <Button 
                onClick={handleDownloadDocument}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Document
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Template - editable when in validation mode */}
      <CertificateTemplate 
        extractedData={isValidationMode ? editableData : certificateData}
        editable={isValidationMode}
        onDataChange={isValidationMode ? handleDataChange : undefined}
      />

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

export default DocumentValidationWorkflow;
