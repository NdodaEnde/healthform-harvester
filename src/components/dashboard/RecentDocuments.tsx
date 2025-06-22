
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function RecentDocuments() {
  // Mock data - in real app this would come from props or API
  const recentDocs = [
    {
      id: '1',
      name: 'Medical Certificate - John Smith.pdf',
      type: 'Medical Certificate',
      status: 'processed',
      uploadedAt: '2 hours ago',
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'Fitness Assessment - Jane Doe.pdf',
      type: 'Fitness Assessment',
      status: 'processing',
      uploadedAt: '4 hours ago',
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'Health Questionnaire - Mike Johnson.pdf',
      type: 'Health Questionnaire',
      status: 'failed',
      uploadedAt: '6 hours ago',
      size: '950 KB'
    },
    {
      id: '4',
      name: 'Vision Test Results - Sarah Wilson.pdf',
      type: 'Vision Test',
      status: 'processed',
      uploadedAt: '1 day ago',
      size: '1.2 MB'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="outline" className="text-green-600 border-green-200">Processed</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Processing</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Recent Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              {getStatusIcon(doc.status)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{doc.type}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.uploadedAt}</span>
                </div>
              </div>
              {getStatusBadge(doc.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
