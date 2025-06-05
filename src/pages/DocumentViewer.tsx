
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { DatabaseDocument } from '@/types/database';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificateValidator from '@/components/CertificateValidator';

const DocumentViewer = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();

  const [document, setDocument] = useState<DatabaseDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExtractedData, setShowExtractedData] = useState(false);

  useEffect(() => {
    if (!documentId || !currentOrganization) {
      return;
    }

    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching document:', documentId);
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .eq('organization_id', currentOrganization.id)
          .single();

        if (error) {
          console.error('Error fetching document:', error);
          setError('Failed to load document. Please try again.');
        } else if (data) {
          console.log('Document loaded:', data);
          setDocument(data as DatabaseDocument);
        } else {
          setError('Document not found.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, currentOrganization]);

  const handleDownload = () => {
    if (document?.public_url) {
      window.open(document.public_url, '_blank');
    } else {
      toast.error('Download URL not available.');
    }
  };

  const toggleExtractedDataVisibility = () => {
    setShowExtractedData(!showExtractedData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>Loading document...</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <FileText className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <FileText className="h-4 w-4" />
          <AlertDescription>Document not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if this is a medical certificate with patient data
  const hasPatientData = document.extracted_data && 
    typeof document.extracted_data === 'object' && 
    document.extracted_data !== null &&
    'structured_data' in document.extracted_data &&
    document.extracted_data.structured_data &&
    typeof document.extracted_data.structured_data === 'object' &&
    'patient' in document.extracted_data.structured_data;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">File Name:</span>
              <span>{document.file_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{document.document_type || 'Document'}</Badge>
              <Badge>{document.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Validator - only show for medical certificates with patient data */}
      {hasPatientData && (
        <CertificateValidator 
          document={document}
          onValidationComplete={() => {
            toast.success('Patient record created successfully');
            navigate('/patients');
          }}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Extracted Data
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleExtractedDataVisibility}>
              {showExtractedData ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showExtractedData ? (
            <pre className="whitespace-pre-wrap">{JSON.stringify(document.extracted_data, null, 2)}</pre>
          ) : (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>Extracted data is hidden. Click "Show" to display.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentViewer;
