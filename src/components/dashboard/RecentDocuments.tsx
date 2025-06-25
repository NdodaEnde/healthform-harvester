
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export function RecentDocuments() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch recent documents with patient information
  const { data: documents, isLoading } = useQuery({
    queryKey: ['recent-documents', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          document_type,
          file_name,
          status,
          created_at,
          processed_at,
          owner_id,
          patients(
            first_name,
            last_name
          )
        `)
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data?.map(doc => ({
        id: doc.id,
        document: formatDocumentType(doc.document_type || 'Document'),
        patient: doc.patients?.length > 0 
          ? `${doc.patients[0]?.first_name || ''} ${doc.patients[0]?.last_name || ''}`.trim() || 'Unknown Patient'
          : 'Unassigned',
        status: formatStatus(doc.status),
        date: formatTimeAgo(new Date(doc.created_at)),
        statusColor: getStatusColor(doc.status),
        fileName: doc.file_name
      })) || [];
    },
    enabled: !!organizationId,
  });

  const formatDocumentType = (type: string) => {
    switch (type) {
      case 'certificate-fitness':
      case 'fitness-certificate':
        return 'Fitness Certificate';
      case 'medical-certificate':
      case 'certificate':
        return 'Medical Certificate';
      case 'medical-questionnaire':
        return 'Health Assessment';
      default:
        return 'Document';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Processed';
      case 'uploaded':
      case 'pending':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'uploaded':
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Documents</CardTitle>
          <a href="/documents" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All →
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
            <div>Document</div>
            <div>Patient</div>
            <div>Status</div>
            <div>Date</div>
          </div>
          
          {/* Table Rows */}
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading documents...</div>
          ) : documents && documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="grid grid-cols-4 gap-4 text-sm py-2 hover:bg-gray-50 rounded">
                <div className="font-medium truncate" title={doc.fileName}>
                  {doc.document}
                </div>
                <div className="text-muted-foreground truncate" title={doc.patient}>
                  {doc.patient}
                </div>
                <div>
                  <Badge variant="outline" className={doc.statusColor}>
                    {doc.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground">{doc.date}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No recent documents
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
