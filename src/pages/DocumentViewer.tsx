
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
import { CertificateData } from '@/types/patient';

interface ExtractedData {
  text?: string;
  structured_data?: CertificateData['structured_data'];
  patient_info?: CertificateData['patient_info'];
  [key: string]: any;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  document_type: string | null;
  processed_at: string | null;
  created_at: string;
  extracted_data: ExtractedData | null;
  [key: string]: any;
}

const DocumentViewer = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('preview');
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: document, isLoading, isError } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      return data as Document;
    },
    enabled: !!documentId,
  });

  const handleDownload = async () => {
    if (!document) return;

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) {
        console.error("Error downloading file:", error);
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
    }
  };

  if (isLoading) {
    return <div>Loading document...</div>;
  }

  if (isError || !document) {
    return <div>Error loading document.</div>;
  }

  // Pass the document to DocumentHeader component
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
            <CardContent className="space-y-2">
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
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
          
          {/* Add the certificate overview component when document is a certificate */}
          {document?.document_type?.includes('certificate') && document?.extracted_data && (
            <CertificateOverview 
              certificateData={document.extracted_data}
            />
          )}
          
          {/* Patient matching - Placeholder for future implementation */}
          <Card>
            <CardContent>
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
                <CardContent>
                  <iframe
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${document.file_path}`}
                    title="Document Preview"
                    className="w-full h-[600px]"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="extracted-data">
              <Card>
                <CardContent>
                  <pre>{JSON.stringify(document.extracted_data, null, 2)}</pre>
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
