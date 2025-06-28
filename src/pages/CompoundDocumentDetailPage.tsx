
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { useCompoundDocuments } from '@/hooks/useCompoundDocuments';
import { CompoundDocumentDetail } from '@/components/compound-documents';

const CompoundDocumentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, loading, refreshDocuments } = useCompoundDocuments();

  const document = documents.find(d => d.id === id);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Document Not Found</h3>
            <p className="text-gray-600 mb-4">
              The compound document you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/compound-documents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/compound-documents')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{document.file_name}</h1>
          <p className="text-muted-foreground">Compound Document Details</p>
        </div>
      </div>

      <CompoundDocumentDetail 
        document={document} 
        onUpdate={() => {
          refreshDocuments();
          navigate('/compound-documents');
        }}
      />
    </div>
  );
};

export default CompoundDocumentDetailPage;
