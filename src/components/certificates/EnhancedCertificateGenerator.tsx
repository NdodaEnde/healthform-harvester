
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, FileText, Download, User, Calendar, Building } from 'lucide-react';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import type { DatabaseDocument } from '@/types/database';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificateTemplate from '../CertificateTemplate';

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
      setIsProcessed(document.status === 'processed' || document.status === 'completed');
    }
  }, [document]);

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

  // Show basic document info for non-processed documents
  if (!isProcessed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Information
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
                onClick={handleDownloadDocument}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Regular view mode - just show the certificate template for generation purposes
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Certificate Template Generator
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

      {/* Certificate Template for generation purposes */}
      <CertificateTemplate 
        extractedData={certificateData}
        editable={false}
      />
    </div>
  );
};

export default EnhancedCertificateGenerator;
