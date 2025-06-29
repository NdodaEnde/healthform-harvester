import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Zap, 
  Settings, 
  BarChart3,
  TestTube,
  RefreshCw
} from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useStructuredExtractionV2, useStructuredExtractionRollout } from '@/hooks/useStructuredExtractionV2';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import ExtractionComparisonPanel from './ExtractionComparisonPanel';
import EnhancedDocumentUploader from '../EnhancedDocumentUploader';

interface ExtractionStats {
  totalDocuments: number;
  v1Documents: number;
  v2Documents: number;
  avgV1Confidence: number;
  avgV2Confidence: number;
  v1SuccessRate: number;
  v2SuccessRate: number;
}

const StructuredExtractionDashboard = () => {
  const [stats, setStats] = useState<ExtractionStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { flags, refreshFlags } = useFeatureFlags();
  const { shouldUseV2: v2Enabled, source } = useStructuredExtractionV2();
  const { shouldUseV2: rolloutEnabled, rolloutPercentage, userPercentage, isInRollout } = useStructuredExtractionRollout();
  const { getEffectiveOrganizationId } = useOrganization();

  useEffect(() => {
    fetchExtractionStats();
  }, []);

  const fetchExtractionStats = async () => {
    try {
      setLoading(true);
      const organizationId = getEffectiveOrganizationId();
      
      if (!organizationId) {
        setLoading(false);
        return;
      }

      // Try to query with processing_metadata first, fallback if column doesn't exist
      let documents: any[] | null = null;
      let hasProcessingMetadata = true;

      try {
        const { data, error } = await supabase
          .from('documents')
          .select('processing_metadata, status, created_at')
          .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        if (error && error.message.includes('processing_metadata')) {
          hasProcessingMetadata = false;
          throw error;
        }

        documents = data;
      } catch (error: any) {
        // If processing_metadata column doesn't exist, query without it
        if (error.message?.includes('processing_metadata') || error.message?.includes('column')) {
          console.log('Processing metadata column not found, using basic query');
          hasProcessingMetadata = false;
          
          const { data, error: fallbackError } = await supabase
            .from('documents')
            .select('status, created_at')
            .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

          if (fallbackError) throw fallbackError;
          documents = data;
        } else {
          throw error;
        }
      }

      // Process the data based on whether we have processing_metadata
      let v1Docs, v2Docs, v1Confidences, v2Confidences, v1Success, v2Success;

      if (hasProcessingMetadata && documents) {
        v1Docs = documents.filter((doc: any) => 
          !doc.processing_metadata?.extraction_method || 
          doc.processing_metadata.extraction_method !== 'structured_extraction_v2'
        );
        
        v2Docs = documents.filter((doc: any) => 
          doc.processing_metadata?.extraction_method === 'structured_extraction_v2'
        );

        v1Confidences = v1Docs
          .map((doc: any) => doc.processing_metadata?.confidence_score || 0.5)
          .filter(score => score > 0);
        
        v2Confidences = v2Docs
          .map((doc: any) => doc.processing_metadata?.confidence_score || 0)
          .filter(score => score > 0);

        v1Success = v1Docs.filter((doc: any) => doc.status === 'processed').length;
        v2Success = v2Docs.filter((doc: any) => doc.status === 'processed').length;
      } else {
        // Fallback: assume all documents are V1 for now
        v1Docs = documents || [];
        v2Docs = [];
        v1Confidences = [0.5]; // Default confidence for V1
        v2Confidences = [];
        v1Success = v1Docs.filter((doc: any) => doc.status === 'processed').length;
        v2Success = 0;
      }

      setStats({
        totalDocuments: documents?.length || 0,
        v1Documents: v1Docs.length,
        v2Documents: v2Docs.length,
        avgV1Confidence: v1Confidences.length > 0 
          ? v1Confidences.reduce((a: number, b: number) => a + b, 0) / v1Confidences.length 
          : 0.5,
        avgV2Confidence: v2Confidences.length > 0 
          ? v2Confidences.reduce((a: number, b: number) => a + b, 0) / v2Confidences.length 
          : 0,
        v1SuccessRate: v1Docs.length > 0 ? v1Success / v1Docs.length : 0,
        v2SuccessRate: v2Docs.length > 0 ? v2Success / v2Docs.length : 0
      });

    } catch (error) {
      console.error('Error fetching extraction stats:', error);
      // Set default stats on any error
      setStats({
        totalDocuments: 0,
        v1Documents: 0,
        v2Documents: 0,
        avgV1Confidence: 0.5,
        avgV2Confidence: 0,
        v1SuccessRate: 0,
        v2SuccessRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getV2StatusBadge = () => {
    if (v2Enabled) {
      return <Badge variant="default">Enabled</Badge>;
    } else if (rolloutEnabled) {
      return <Badge variant="secondary">Rollout Active</Badge>;
    } else {
      return <Badge variant="outline">Disabled</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Structured Extraction Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Structured Extraction Dashboard
            {getV2StatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                    <p className="text-sm text-muted-foreground">Total Documents (30d)</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats?.v1Documents || 0}</div>
                    <p className="text-sm text-muted-foreground">V1 Processed</p>
                    <div className="text-xs text-gray-500">
                      {stats ? (stats.avgV1Confidence * 100).toFixed(1) : 0}% avg confidence
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{stats?.v2Documents || 0}</div>
                    <p className="text-sm text-muted-foreground">V2 Processed</p>
                    <div className="text-xs text-gray-500">
                      {stats ? (stats.avgV2Confidence * 100).toFixed(1) : 0}% avg confidence
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats && stats.v2Documents > 0 
                        ? ((stats.avgV2Confidence - stats.avgV1Confidence) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">V2 Improvement</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>V2 Feature Flag:</span>
                      <Badge variant={flags.structured_extraction_v2 ? "default" : "secondary"}>
                        {flags.structured_extraction_v2 ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Rollout Active:</span>
                      <Badge variant={isInRollout ? "default" : "secondary"}>
                        {isInRollout ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {isInRollout && (
                      <>
                        <div className="flex justify-between">
                          <span>Rollout Percentage:</span>
                          <span>{rolloutPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Your User ID:</span>
                          <span>{userPercentage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>You Get V2:</span>
                          <Badge variant={rolloutEnabled ? "default" : "secondary"}>
                            {rolloutEnabled ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Success Rates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>V1 Success Rate:</span>
                      <span>{stats ? (stats.v1SuccessRate * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>V2 Success Rate:</span>
                      <span>{stats ? (stats.v2SuccessRate * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Improvement:</span>
                      <span className={
                        stats && stats.v2SuccessRate > stats.v1SuccessRate 
                          ? "text-green-600" 
                          : "text-red-600"
                      }>
                        {stats 
                          ? ((stats.v2SuccessRate - stats.v1SuccessRate) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchExtractionStats} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
                <Button onClick={refreshFlags} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Refresh Flags
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Upload (Method Selection)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EnhancedDocumentUploader
                      allowMethodSelection={true}
                      organizationId={getEffectiveOrganizationId() || undefined}
                      onUploadComplete={(data) => {
                        console.log('Test upload complete:', data);
                        fetchExtractionStats(); // Refresh stats after upload
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="font-medium">V1 (Legacy)</div>
                        <div className="text-sm text-gray-600">
                          Documents: {stats?.v1Documents || 0}<br/>
                          Avg Confidence: {stats ? (stats.avgV1Confidence * 100).toFixed(1) : 0}%<br/>
                          Success Rate: {stats ? (stats.v1SuccessRate * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded">
                        <div className="font-medium">V2 (Structured)</div>
                        <div className="text-sm text-gray-600">
                          Documents: {stats?.v2Documents || 0}<br/>
                          Avg Confidence: {stats ? (stats.avgV2Confidence * 100).toFixed(1) : 0}%<br/>
                          Success Rate: {stats ? (stats.v2SuccessRate * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <ExtractionComparisonPanel />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Flag Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Structured Extraction V2</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enable structured extraction for all uploads</span>
                        <Badge variant={flags.structured_extraction_v2 ? "default" : "secondary"}>
                          {flags.structured_extraction_v2 ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Structured Extraction Rollout</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enable gradual rollout (25% of users)</span>
                        <Badge variant={flags.structured_extraction_rollout ? "default" : "secondary"}>
                          {flags.structured_extraction_rollout ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                      <p>To modify feature flags, go to Settings → Features or use the Feature Flag Manager.</p>
                      <p>Changes may take a few minutes to propagate across all components.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StructuredExtractionDashboard;
