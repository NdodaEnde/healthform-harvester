
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, FileText, Download, User, Calendar, Building, Edit } from 'lucide-react';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import type { DatabaseDocument } from '@/types/database';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificateTemplate from '../CertificateTemplate';
import CertificatePromotionDialog from './CertificatePromotionDialog';

interface EnhancedCertificateGeneratorProps {
  document: DatabaseDocument;
  onValidationComplete?: () => void;
}

const EnhancedCertificateGenerator: React.FC<EnhancedCertificateGeneratorProps> = ({ 
  document, 
  onValidationComplete 
}) => {
  const { currentOrganization } = useOrganization();
  const [certificateData, setCertificateData] = useState<any>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isValidationMode, setIsValidationMode] = useState(false);
  const [editableData, setEditableData] = useState<any>(null);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);

  useEffect(() => {
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
      setIsProcessed(document.status === 'processed' || document.status === 'completed');
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

  const handleCreatePatientRecord = () => {
    if (editableData && currentOrganization) {
      setIsPromotionDialogOpen(true);
    }
  };

  const handlePromotionComplete = () => {
    setIsPromotionDialogOpen(false);
    setIsValidationMode(false);
    onValidationComplete?.();
  };

  const handleDownloadCertificate = () => {
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
          Unable to extract certificate data from this document.
        </AlertDescription>
      </Alert>
    );
  }

  // Show basic certificate info for non-processed documents
  if (!isProcessed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificate Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Patient:</span>
                <span>{certificateData.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ID Number:</span>
                <span>{certificateData.patientId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Company:</span>
                <span>{certificateData.companyName}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Examination Date:</span>
                <span>{certificateData.examinationDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status:</span>
                <Badge variant={certificateData.fitnessStatus === 'fit' ? 'default' : 'secondary'}>
                  {certificateData.fitnessStatus}
                </Badge>
              </div>
            </div>
          </div>

          {document.public_url && (
            <div className="pt-4">
              <Button 
                onClick={handleDownloadCertificate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Certificate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Regular view mode
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Medical Certificate - Ready for Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Processed
            </Badge>
            <Badge variant="outline">
              {document.document_type || 'Medical Certificate'}
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
                  onClick={handleCreatePatientRecord}
                  className="flex items-center gap-2"
                  disabled={!currentOrganization || !editableData}
                >
                  <Edit className="h-4 w-4" />
                  Create Patient Record
                </Button>
              </>
            )}
            {document.public_url && (
              <Button 
                onClick={handleDownloadCertificate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Certificate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certificate Template - editable when in validation mode */}
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

export default EnhancedCertificateGenerator;
