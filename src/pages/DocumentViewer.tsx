
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, FileText, Download, Users, Calendar, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DocumentHeader from '@/components/DocumentHeader';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificateOverview from '@/components/CertificateOverview';
import { parseCertificateData, CertificateData } from '@/types/patient';
import { Json } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  document_type: string | null;
  processed_at: string | null;
  created_at: string;
  extracted_data: Json | null;
  [key: string]: any;
}

const DocumentViewer = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('preview');
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: document, isLoading, isError, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      console.log('Fetching document with ID:', documentId);
      
      if (!documentId) {
        throw new Error('Document ID is missing');
      }
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (error) {
        console.error('Error fetching document:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Document not found');
      }
      
      console.log('Document retrieved:', data);
      return data as Document;
    },
    enabled: !!documentId,
    retry: 1,
    onError: (err) => {
      console.error('Query error:', err);
      toast({
        title: 'Error',
        description: `Failed to load document: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  const handleDownload = async () => {
    if (!document) return;

    try {
      // Get the bucket name from the file path - the format is usually "bucket/path/to/file"
      const pathParts = document.file_path.split('/');
      const bucket = pathParts[0]; // First part should be the bucket name
      const filePath = pathParts.slice(1).join('/'); // The rest is the file path
      
      console.log('Downloading file from bucket:', bucket, 'path:', filePath);

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) {
        console.error("Error downloading file:", error);
        toast({
          title: 'Download Failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Unexpected error downloading file:", error);
      toast({
        title: 'Download Failed',
        description: 'An unexpected error occurred while downloading the file',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">
      <div className="flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    </div>;
  }

  if (isError || !document) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <FileText className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Error loading document</h3>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const certificateData = parseCertificateData(document.extracted_data);

  // Build the correct preview URL
  let previewUrl = '';
  try {
    if (document.file_path) {
      // Get the bucket name and file path
      const pathParts = document.file_path.split('/');
      const bucket = pathParts[0];
      const filePath = pathParts.slice(1).join('/');
      
      // Construct the URL for public bucket access
      previewUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
      console.log('Document preview URL:', previewUrl);
    }
  } catch (e) {
    console.error('Error constructing preview URL:', e);
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Document header */}
      <DocumentHeader document={document} />
      
      {/* Document content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left sidebar with document metadata */}
        <div className="md:col-span-1 space-y-6">
          {/* Document metadata */}
          <Card>
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 opacity-70" />
                <span>{document.file_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 opacity-70" />
                <span>Uploaded: {format(new Date(document.created_at), 'PPP')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="h-4 w-4 opacity-70" />
                <span>Status: {document.status}</span>
              </div>
              <Button variant="secondary" onClick={handleDownload} className="w-full mt-2">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
          
          {/* Add the certificate overview component when document is a certificate */}
          {document?.document_type?.includes('certificate') && document?.extracted_data && (
            <CertificateOverview 
              certificateData={certificateData}
            />
          )}
          
          {/* Patient matching - Placeholder for future implementation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 opacity-70" />
                <span>Potential Patient Matches</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This feature is coming soon. We'll help you match this document to an existing patient.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main document view area */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="extracted-data">Extracted Data</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <Card>
                <CardContent className="p-1 md:p-2">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title="Document Preview"
                      className="w-full h-[600px] border-0"
                    />
                  ) : (
                    <div className="flex justify-center items-center h-[600px] bg-muted/20">
                      <p className="text-muted-foreground">Preview not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="extracted-data">
              <Card>
                <CardContent className="p-6">
                  {document.extracted_data ? (
                    <pre className="p-4 bg-muted/20 rounded-md overflow-auto text-sm whitespace-pre-wrap">
                      {JSON.stringify(document.extracted_data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-center text-muted-foreground py-10">No extracted data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
