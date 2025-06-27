
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Calendar
} from 'lucide-react';
import { useCompoundDocuments } from '@/hooks/useCompoundDocuments';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const CompoundDocumentsList = () => {
  const { documents, loading, error } = useCompoundDocuments();
  const { isFeatureEnabled } = useFeatureFlags();

  // Only render if feature is enabled
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
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Compound Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center p-4">
            Error loading documents: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getWorkflowStatusColor = (status: string) => {
    switch (status) {
      case 'receptionist_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'nurse_review':
        return 'bg-blue-100 text-blue-800';
      case 'tech_review':
        return 'bg-purple-100 text-purple-800';
      case 'doctor_approval':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Compound Documents
          <Badge variant="outline" className="ml-auto">
            Beta Feature
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No compound documents uploaded yet</p>
            <p className="text-sm mt-2">
              Upload multi-section medical files to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(doc.status)}
                      <h3 className="font-medium text-gray-900 truncate">
                        {doc.file_name}
                      </h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge 
                        variant="outline" 
                        className={getWorkflowStatusColor(doc.workflow_status)}
                      >
                        {doc.workflow_status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      
                      {doc.total_pages > 0 && (
                        <Badge variant="outline">
                          {doc.total_pages} pages
                        </Badge>
                      )}
                      
                      {doc.detected_sections.length > 0 && (
                        <Badge variant="outline">
                          {doc.detected_sections.length} sections
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                      
                      {doc.file_size && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    {doc.workflow_status !== 'completed' && (
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompoundDocumentsList;
