
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, Eye, EyeOff } from 'lucide-react';
import CertificateTemplate from '@/components/CertificateTemplate';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';

interface ExtractedData {
  raw_content?: string;
  structured_data?: {
    certificate_info?: Record<string, any>;
    [key: string]: any;
  };
  chunks?: any[];
  [key: string]: any;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  status: string;
  document_type: string;
  extracted_data: ExtractedData;
  created_at: string;
}

const DocumentViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'structured'>('pdf');
  const [hideOriginalPdf, setHideOriginalPdf] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
  }, [id]);

  const fetchDocument = async (documentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      console.log("Document data:", data);
      
      // Handle case where extracted_data is stored as a string
      let processedData: Document = { 
        id: data.id,
        file_name: data.file_name,
        file_path: data.file_path,
        public_url: data.public_url,
        status: data.status,
        document_type: data.document_type || '',
        extracted_data: {},
        created_at: data.created_at
      };
      
      if (data.extracted_data) {
        if (typeof data.extracted_data === 'string') {
          try {
            processedData.extracted_data = JSON.parse(data.extracted_data);
          } catch (parseError) {
            console.error('Error parsing extracted_data JSON:', parseError);
            processedData.extracted_data = { raw_content: data.extracted_data };
          }
        } else {
          processedData.extracted_data = data.extracted_data as ExtractedData;
        }
      }
      
      setDocument(processedData);
      
      // Auto-switch to structured view if certificate data exists
      const hasCertificateData = 
        processedData.document_type?.includes('certificate') && 
        ((processedData.extracted_data?.structured_data?.certificate_info) ||
         (typeof processedData.extracted_data === 'object' && 
          processedData.extracted_data?.certificate_info));
      
      if (hasCertificateData) {
        toast.info('Certificate data has been detected and loaded');
        setViewMode('structured');
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = () => {
    if (document?.public_url) {
      window.open(document.public_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Document not found</p>
      </div>
    );
  }

  // Determine if certificate data exists
  const hasCertificateData = document.document_type?.includes('certificate') && 
    (document.extracted_data?.structured_data?.certificate_info || 
     document.extracted_data?.certificate_info);

  return (
    <>
      <Helmet>
        <title>Document Viewer: {document.file_name}</title>
      </Helmet>
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold">{document.file_name}</h1>
              <div className="flex gap-2 mt-2">
                <Badge variant={document.status === 'processed' ? 'success' : 
                              document.status === 'failed' ? 'destructive' : 'secondary'}>
                  {document.status}
                </Badge>
                <Badge variant="outline">
                  {document.document_type}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={viewMode === 'pdf' ? 'default' : 'outline'}
                onClick={() => setViewMode('pdf')}
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                PDF View
              </Button>
              <Button
                variant={viewMode === 'structured' ? 'default' : 'outline'}
                onClick={() => setViewMode('structured')}
                size="sm"
                disabled={!hasCertificateData}
              >
                <FileText className="w-4 h-4 mr-2" />
                {hasCertificateData ? "Certificate View" : "No Certificate Data"}
              </Button>
              {document.public_url && (
                <Button variant="outline" onClick={downloadDocument} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              {viewMode === 'structured' && hasCertificateData && (
                <Button 
                  variant="outline" 
                  onClick={() => setHideOriginalPdf(!hideOriginalPdf)} 
                  size="sm"
                >
                  {hideOriginalPdf ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Original
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Original
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${hideOriginalPdf ? '' : 'lg:grid-cols-2'} gap-6`}>
          {/* PDF Viewer - Hidden when hideOriginalPdf is true */}
          {!hideOriginalPdf && (
            <Card className="lg:h-[calc(100vh-220px)]">
              <CardHeader className="pb-2">
                <CardTitle>Original Document</CardTitle>
              </CardHeader>
              <CardContent>
                {document.public_url ? (
                  <div className="w-full h-[600px] border rounded">
                    <embed
                      src={document.public_url}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      className="rounded"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded">
                    <p className="text-gray-500">PDF not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Certificate View or Structured Data View */}
          <Card className={`${hideOriginalPdf ? 'w-full mx-auto max-w-4xl' : ''} lg:h-[calc(100vh-220px)] overflow-hidden`}>
            <CardHeader className="pb-2">
              <CardTitle>
                {viewMode === 'structured' ? 'Certificate Preview' : 'Extracted Data'}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto h-full pb-6">
              {viewMode === 'structured' ? (
                <div className="overflow-auto">
                  <CertificateTemplate 
                    extractedData={document.extracted_data}
                    documentId={id || ''}
                    editable={true}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {document.extracted_data?.structured_data?.certificate_info && (
                    <div>
                      <h3 className="font-semibold mb-2">Certificate Information</h3>
                      <div className="space-y-2 text-sm">
                        {Object.entries(document.extracted_data.structured_data.certificate_info).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold mb-2">Raw Content Preview</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm max-h-96 overflow-y-auto">
                      {document.extracted_data?.raw_content?.substring(0, 500)}...
                    </div>
                  </div>

                  {/* Display any chunks if available */}
                  {document.extracted_data?.chunks && document.extracted_data.chunks.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Document Chunks ({document.extracted_data.chunks.length})</h3>
                      <div className="space-y-2">
                        {document.extracted_data.chunks.slice(0, 3).map((chunk: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-medium mb-1">Chunk {index + 1} - Type: {chunk.chunk_type || chunk.type || 'Unknown'}</p>
                            <p className="text-gray-800">{chunk.text || chunk.content || ''}</p>
                          </div>
                        ))}
                        {document.extracted_data.chunks.length > 3 && (
                          <p className="text-sm text-gray-500">And {document.extracted_data.chunks.length - 3} more chunks...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DocumentViewer;
