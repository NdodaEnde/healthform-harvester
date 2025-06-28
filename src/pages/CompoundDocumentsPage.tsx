
import React from 'react';
import { CompoundDocumentsList } from '@/components/compound-documents';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock } from 'lucide-react';

const CompoundDocumentsPage = () => {
  const { isFeatureEnabled } = useFeatureFlags();

  if (!isFeatureEnabled('compound_documents_enabled')) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              Compound Documents
              <Badge variant="outline">Feature Not Enabled</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Compound Documents Not Available</h3>
            <p className="text-gray-600 mb-4">
              This feature is not enabled for your organization. Contact your administrator to enable compound document processing.
            </p>
            <Badge variant="secondary">Contact Administrator</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compound Documents</h1>
        <p className="text-muted-foreground">
          Manage multi-section medical documents with AI-powered processing and workflow automation
        </p>
      </div>

      <CompoundDocumentsList />
    </div>
  );
};

export default CompoundDocumentsPage;
