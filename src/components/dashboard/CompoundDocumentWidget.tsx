
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Upload
} from 'lucide-react';
import { useCompoundDocuments } from '@/hooks/useCompoundDocuments';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useNavigate } from 'react-router-dom';

const CompoundDocumentWidget = () => {
  const { documents, loading } = useCompoundDocuments();
  const { isFeatureEnabled } = useFeatureFlags();
  const navigate = useNavigate();

  if (!isFeatureEnabled('compound_documents_enabled')) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compound Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const processingCount = documents.filter(d => d.status === 'processing').length;
  const completedCount = documents.filter(d => d.status === 'completed').length;
  const errorCount = documents.filter(d => d.status === 'error').length;
  const pendingWorkflowCount = documents.filter(d => 
    d.workflow_status !== 'completed' && d.status === 'completed'
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compound Documents
            <Badge variant="outline">Beta</Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/compound-documents')}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-4">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">No compound documents yet</p>
            <Button 
              size="sm" 
              onClick={() => navigate('/compound-documents')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                <div className="text-xs text-gray-500">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-xs text-gray-500">Processed</div>
              </div>
            </div>

            {(processingCount > 0 || pendingWorkflowCount > 0 || errorCount > 0) && (
              <div className="space-y-2">
                {processingCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{processingCount} processing</span>
                  </div>
                )}
                {pendingWorkflowCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>{pendingWorkflowCount} pending workflow</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>{errorCount} errors</span>
                  </div>
                )}
              </div>
            )}

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/compound-documents')}
            >
              Manage Documents
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CompoundDocumentWidget;
