
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  RefreshCw,
  Brain,
  Workflow,
  Clock
} from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useCompoundDocumentAnalytics } from '@/hooks/useCompoundDocumentAnalytics';
import CompoundDocumentAnalytics from '@/components/compound-documents/CompoundDocumentAnalytics';

const CompoundDocumentAnalyticsPage = () => {
  const { isFeatureEnabled } = useFeatureFlags();
  const [timeRange, setTimeRange] = useState('30d');
  const { data, loading, error, refreshAnalytics } = useCompoundDocumentAnalytics(timeRange);

  if (!isFeatureEnabled('compound_documents_enabled')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Compound Document Analytics</h2>
            <p className="text-gray-600 mb-4">
              Advanced analytics for compound document processing is not enabled for your organization.
            </p>
            <Badge variant="outline">Feature Not Available</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              Error loading analytics: {error}
            </div>
            <Button onClick={refreshAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compound Document Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights into document processing and workflow performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button variant="outline" onClick={refreshAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Processing
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {data && (
            <CompoundDocumentAnalytics 
              data={data} 
              timeRange={timeRange} 
            />
          )}
        </TabsContent>

        <TabsContent value="processing">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Processing Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Detailed AI processing analytics will be available here.</p>
                  <p className="text-sm mt-2">
                    Track section detection accuracy, confidence scores, and model performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Workflow performance metrics will be displayed here.</p>
                  <p className="text-sm mt-2">
                    Analyze assignment patterns, completion times, and bottlenecks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>System performance analytics coming soon.</p>
                  <p className="text-sm mt-2">
                    Monitor processing speeds, error rates, and system health.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompoundDocumentAnalyticsPage;
