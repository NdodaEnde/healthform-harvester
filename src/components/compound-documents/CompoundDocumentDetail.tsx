
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Settings, 
  Users, 
  Eye, 
  Download,
  Calendar,
  User
} from 'lucide-react';
import { CompoundDocument } from '@/types/compound-document';
import SectionEditor from './SectionEditor';
import WorkflowAssignmentPanel from './WorkflowAssignmentPanel';

interface CompoundDocumentDetailProps {
  document: CompoundDocument;
  onUpdate?: () => void;
}

const CompoundDocumentDetail: React.FC<CompoundDocumentDetailProps> = ({ 
  document, 
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkflowStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'doctor_approval':
        return 'bg-purple-100 text-purple-800';
      case 'tech_review':
        return 'bg-blue-100 text-blue-800';
      case 'nurse_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">{document.file_name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Uploaded {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(document.status)}>
                {document.status.toUpperCase()}
              </Badge>
              <Badge className={getWorkflowStatusColor(document.workflow_status)}>
                {document.workflow_status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">File Size:</span>
              <p className="font-medium">
                {document.file_size ? (document.file_size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500">Pages:</span>
              <p className="font-medium">{document.total_pages || 0}</p>
            </div>
            
            <div>
              <span className="text-gray-500">Sections:</span>
              <p className="font-medium">{document.detected_sections.length}</p>
            </div>
            
            <div>
              <span className="text-gray-500">Patient:</span>
              <p className="font-medium">
                {document.owner_id ? `Patient ${document.owner_id.substring(0, 8)}...` : 'Unassigned'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Document
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">MIME Type:</span>
                  <span className="font-medium">{document.mime_type}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium">
                    {document.organization_id ? 'Primary' : 'Client'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(document.updated_at).toLocaleDateString()}
                  </span>
                </div>
                
                {document.public_url && (
                  <div className="pt-2">
                    <Button variant="outline" className="w-full" asChild>
                      <a href={document.public_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        View Original File
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(document.processing_metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">
                      {key.replace('_', ' ')}:
                    </span>
                    <span className="font-medium truncate ml-2">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <SectionEditor 
            document={document} 
            onSectionUpdate={onUpdate} 
          />
        </TabsContent>

        <TabsContent value="workflow">
          <WorkflowAssignmentPanel 
            document={document} 
            onWorkflowUpdate={onUpdate} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompoundDocumentDetail;
