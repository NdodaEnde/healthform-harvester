import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { AlertCircle, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentData {
  id: string;
  document_type: string | null;
  created_at: string;
  extracted_data: any;
  status: string;
}

const AccuracyMatrix = () => {
  const { currentOrganization, currentClient, getEffectiveOrganizationId } = useOrganization();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const organizationId = getEffectiveOrganizationId();

  const fetchDocuments = async () => {
    if (!organizationId && !currentOrganization?.id) return;
    
    try {
      setIsLoading(true);
      
      // Build the query for documents based on context
      let documentsQuery = supabase
        .from('documents')
        .select('id, document_type, created_at, extracted_data, status')
        .not('status', 'eq', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter by organization context
      if (currentClient) {
        // When specific client is selected, show only that client's documents
        documentsQuery = documentsQuery.eq('client_organization_id', currentClient.id);
      } else if (currentOrganization?.organization_type === 'service_provider') {
        // When "All Clients" is selected for service provider, show all client documents
        documentsQuery = documentsQuery.eq('organization_id', currentOrganization.id);
      } else {
        // For regular organizations, show their documents
        documentsQuery = documentsQuery.eq('organization_id', organizationId as any);
      }

      const { data, error } = await documentsQuery;

      if (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to fetch documents for accuracy analysis');
        return;
      }

      // Safely process the data with proper type checking
      const typedDocuments: DocumentData[] = (data || [])
        .filter((doc): doc is any => doc && typeof doc === 'object' && 'id' in doc)
        .map(doc => ({
          id: String(doc.id || ''),
          document_type: doc.document_type,
          created_at: String(doc.created_at || ''),
          extracted_data: doc.extracted_data,
          status: String(doc.status || '')
        }));
      setDocuments(typedDocuments);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
    toast.success('Accuracy matrix refreshed');
  };

  useEffect(() => {
    fetchDocuments();
  }, [organizationId, currentClient?.id, currentOrganization?.id]);

  const getAccuracyStats = () => {
    if (documents.length === 0) return { total: 0, processed: 0, failed: 0, accuracy: 0 };
    
    const processed = documents.filter(doc => doc.status === 'processed').length;
    const failed = documents.filter(doc => doc.status === 'failed').length;
    const total = documents.length;
    const accuracy = total > 0 ? Math.round((processed / total) * 100) : 0;
    
    return { total, processed, failed, accuracy };
  };

  const getDocumentTypeStats = () => {
    const typeStats: Record<string, { total: number; processed: number; failed: number }> = {};
    
    documents.forEach(doc => {
      const type = doc.document_type || 'unknown';
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, processed: 0, failed: 0 };
      }
      
      typeStats[type].total++;
      if (doc.status === 'processed') {
        typeStats[type].processed++;
      } else if (doc.status === 'failed') {
        typeStats[type].failed++;
      }
    });
    
    return typeStats;
  };

  const getDataQualityStats = () => {
    const processedDocs = documents.filter(doc => doc.status === 'processed');
    if (processedDocs.length === 0) return { withStructuredData: 0, withRawOnly: 0, withoutData: 0 };
    
    let withStructuredData = 0;
    let withRawOnly = 0;
    let withoutData = 0;
    
    processedDocs.forEach(doc => {
      const extractedData = doc.extracted_data;
      
      if (extractedData?.structured_data && Object.keys(extractedData.structured_data).length > 0) {
        withStructuredData++;
      } else if (extractedData?.raw_content && extractedData.raw_content.length > 0) {
        withRawOnly++;
      } else {
        withoutData++;
      }
    });
    
    return { withStructuredData, withRawOnly, withoutData };
  };

  const stats = getAccuracyStats();
  const typeStats = getDocumentTypeStats();
  const qualityStats = getDataQualityStats();

  const getRecentTrend = () => {
    const last7Days = documents.filter(doc => {
      const docDate = new Date(doc.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return docDate >= weekAgo;
    });
    
    const recentProcessed = last7Days.filter(doc => doc.status === 'processed').length;
    const recentTotal = last7Days.length;
    
    return recentTotal > 0 ? Math.round((recentProcessed / recentTotal) * 100) : 0;
  };

  const recentTrend = getRecentTrend();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing Accuracy Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Processing Accuracy Matrix
            {currentClient && (
              <span className="text-sm text-blue-600 ml-2">({currentClient.name})</span>
            )}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.processed}</div>
              <div className="text-sm text-muted-foreground">Successfully Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.accuracy}%</div>
              <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">7-day trend:</span>
            <Badge variant={recentTrend >= stats.accuracy ? "default" : "destructive"}>
              {recentTrend}% accuracy
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Document Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy by Document Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(typeStats).map(([type, stat]) => {
              const accuracy = stat.total > 0 ? Math.round((stat.processed / stat.total) * 100) : 0;
              return (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{type.replace(/-/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.processed}/{stat.total} processed
                    </div>
                  </div>
                  <Badge 
                    variant={accuracy >= 80 ? "default" : accuracy >= 60 ? "secondary" : "destructive"}
                  >
                    {accuracy}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality */}
      <Card>
        <CardHeader>
          <CardTitle>Data Extraction Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{qualityStats.withStructuredData}</div>
              <div className="text-sm text-muted-foreground">With Structured Data</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{qualityStats.withRawOnly}</div>
              <div className="text-sm text-muted-foreground">Raw Text Only</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-2xl font-bold">{qualityStats.withoutData}</div>
              <div className="text-sm text-muted-foreground">No Data Extracted</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccuracyMatrix;
