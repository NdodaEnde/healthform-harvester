
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Link2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CertificateTemplate from '@/components/CertificateTemplate';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/components/ui/use-toast';
import { Json } from '@/integrations/supabase/types';

// Update DocumentHeader import to match its props
import DocumentHeaderComponent from '@/components/DocumentHeader';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  document_type: string | null;
  processed_at: string | null;
  created_at: string;
  extracted_data: any; // Using 'any' for extracted_data to avoid type errors
}

const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);

  // Document data query with improved error handling
  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) throw new Error('Document ID is required');

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching document:', error);
        throw error;
      }

      console.log('Fetched document data:', data);
      
      // Extract patient information for linking
      if (data && data.extracted_data) {
        console.log('Extracting patient name from:', data.extracted_data);
        
        // Safely access nested properties
        const extractedData = data.extracted_data as any;
        const patientInfo = extractedData.patient_info;
        
        // Get patient name from various possible locations in the data structure
        const patientName = patientInfo?.name || (
          extractedData.structured_data?.patient?.name || 
          'Unknown Patient'
        );
        setPatientName(patientName);
        
        console.log('Extracting patient ID from:', data.extracted_data);
        // Get patient ID from various possible locations
        const patientId = patientInfo?.id || 
          (extractedData.structured_data?.patient?.id) || null;
        setPatientId(patientId);

        // Process the extracted data further if needed
        // Instead of adding to the document type, create a local processed data variable
        const processedData = processExtractedData(data.extracted_data);
        console.log('Processed extracted data:', processedData);
      }

      return data as Document;
    },
    meta: {
      onError: (err: Error) => {
        toast({
          title: "Error loading document",
          description: err.message,
          variant: "destructive"
        });
      }
    }
  });

  // Process extracted data to ensure it's in the right format for certificates
  const processExtractedData = (extractedData: any) => {
    if (!extractedData) return {};
    
    // Create a standardized structure for the certificate template
    const processedData = { ...extractedData };
    
    // Make sure we have structured_data available
    if (!processedData.structured_data && processedData.extracted_data?.structured_data) {
      processedData.structured_data = processedData.extracted_data.structured_data;
    } else if (!processedData.structured_data) {
      processedData.structured_data = {};
    }
    
    console.log('Passing to CertificateTemplate:', processedData);
    return processedData;
  };

  // Handle document download with improved error handling
  const handleDownload = async () => {
    if (!document) {
      toast({
        title: "Document not available",
        description: "Unable to download document.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get the URL with proper error handling
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('medical-documents')
        .createSignedUrl(document.file_path, 60);

      if (urlError || !urlData?.signedUrl) {
        throw new Error(urlError?.message || "Unable to generate download link");
      }

      // Use window.document instead of document to avoid confusion with our Document interface
      const link = window.document.createElement('a');
      link.href = urlData.signedUrl;
      link.setAttribute('download', document.file_name);
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading ${document.file_name}`
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive"
      });
    }
  };

  // Handle navigation back
  const handleBack = () => {
    navigate(-1);
  };

  // Handle navigation to patient profile
  const handleViewPatient = () => {
    if (patientId) {
      navigate(`/patients/${patientId}`);
    } else {
      toast({
        title: "Cannot find patient",
        description: "Patient information is not available or couldn't be extracted from this document.",
        variant: "destructive"
      });
    }
  };

  // Get document URL for preview
  const getDocumentUrl = async (): Promise<string | null> => {
    if (!document) return null;
    
    try {
      const { data, error } = await supabase
        .storage
        .from('medical-documents')
        .createSignedUrl(document.file_path, 60);
      
      if (error) {
        console.error('Error getting document URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error retrieving document URL:', error);
      return null;
    }
  };

  // Create a simple document header component for the document viewer
  const DocumentHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <Button onClick={handleBack} variant="outline" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div>
        <h2 className="text-2xl font-bold">
          {document ? document.file_name : 'Document Details'}
        </h2>
        {patientName && (
          <p className="text-muted-foreground">Patient: {patientName}</p>
        )}
      </div>
      {patientId && (
        <Button onClick={handleViewPatient} variant="outline" size="sm">
          View Patient
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <DocumentHeader />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium">Error Loading Document</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              {error instanceof Error ? error.message : "Could not load document data."}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          </CardContent>
        </Card>
      ) : document ? (
        <Tabs defaultValue={document.document_type?.includes('certificate') ? "certificate" : "preview"}>
          <TabsList className="mb-4">
            {document.document_type?.includes('certificate') && (
              <TabsTrigger value="certificate">Certificate View</TabsTrigger>
            )}
            <TabsTrigger value="preview">Document Preview</TabsTrigger>
            <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
          </TabsList>

          {document.document_type?.includes('certificate') && (
            <TabsContent value="certificate">
              <div className="bg-white rounded-lg shadow">
                <CertificateTemplate extractedData={document.extracted_data} />
              </div>
            </TabsContent>
          )}

          <TabsContent value="preview">
            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                    <span className="font-medium">{document.file_name}</span>
                    <Button onClick={handleDownload} size="sm" variant="ghost">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="h-[70vh] relative overflow-hidden">
                    <DocumentPreview documentPath={document.file_path} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extracted">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Extracted Data</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[60vh] text-xs">
                  {JSON.stringify(document.extracted_data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium">Document Not Found</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              The document you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Document preview component with error handling
const DocumentPreview = ({ documentPath }: { documentPath: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .storage
          .from('medical-documents')
          .createSignedUrl(documentPath, 60);

        if (error) throw new Error(error.message);
        if (!data?.signedUrl) throw new Error('Failed to generate URL');
        
        setUrl(data.signedUrl);
      } catch (err) {
        console.error('Error getting document URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    getUrl();
  }, [documentPath]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-4">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Preview Unavailable</h3>
        <p className="text-muted-foreground text-center mb-4">{error || 'Could not load document preview'}</p>
        <Button variant="outline" onClick={() => window.open(url, '_blank')} disabled={!url}>
          <Link2 className="mr-2 h-4 w-4" />
          Try opening directly
        </Button>
      </div>
    );
  }

  return (
    <iframe 
      src={url} 
      className="absolute inset-0 w-full h-full border-0" 
      title="Document Preview" 
      onError={() => setError('Failed to load preview')}
    />
  );
};

export default DocumentViewer;
