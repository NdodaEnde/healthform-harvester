
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, Eye } from 'lucide-react';
import CertificateTemplate from '@/components/CertificateTemplate';
import { Helmet } from 'react-helmet';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  status: string;
  document_type: string;
  extracted_data: any;
  created_at: string;
}

const DocumentViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'structured'>('pdf');

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
      setDocument(data);
      console.log("Document data:", data);
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
              >
                <FileText className="w-4 h-4 mr-2" />
                Structured Data
              </Button>
              {document.public_url && (
                <Button variant="outline" onClick={downloadDocument} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF Viewer */}
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

          {/* Structured Data View */}
          <Card className="lg:h-[calc(100vh-220px)] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>
                {viewMode === 'structured' ? 'Extracted Data' : 'Certificate Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto h-full pb-6">
              {viewMode === 'structured' ? (
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
              ) : (
                <div className="overflow-auto">
                  <CertificateTemplate 
                    extractedData={document.extracted_data} 
                  />
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
