
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { TrendingUp, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export default function QualityTrendsDashboard() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: qualityData, isLoading } = useQuery({
    queryKey: ['quality-trends-dashboard', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      // Get documents with validation data from the last 60 days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data, error } = await supabase
        .from('documents')
        .select('created_at, status, extracted_data, validation_status, document_type')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by week and calculate quality metrics
      const weeklyData = data?.reduce((acc, doc) => {
        const date = new Date(doc.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!acc[weekKey]) {
          acc[weekKey] = {
            week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: 0,
            processed: 0,
            validated: 0,
            failed: 0,
            extractionSuccess: 0,
            manualReview: 0
          };
        }
        
        acc[weekKey].total += 1;
        
        if (doc.status === 'processed') {
          acc[weekKey].processed += 1;
          acc[weekKey].extractionSuccess += 1;
        } else if (doc.status === 'failed') {
          acc[weekKey].failed += 1;
        } else if (doc.status === 'pending_review') {
          acc[weekKey].manualReview += 1;
        }
        
        if (doc.validation_status === 'validated') {
          acc[weekKey].validated += 1;
        }
        
        return acc;
      }, {} as Record<string, any>) || {};

      // Convert to array and calculate percentages
      const trendData = Object.values(weeklyData).map((week: any) => ({
        ...week,
        successRate: week.total > 0 ? Math.round((week.processed / week.total) * 100) : 0,
        validationRate: week.total > 0 ? Math.round((week.validated / week.total) * 100) : 0,
        failureRate: week.total > 0 ? Math.round((week.failed / week.total) * 100) : 0,
        reviewRate: week.total > 0 ? Math.round((week.manualReview / week.total) * 100) : 0
      })).slice(-8); // Last 8 weeks

      // Calculate overall metrics
      const totalDocs = data?.length || 0;
      const processedDocs = data?.filter(d => d.status === 'processed').length || 0;
      const validatedDocs = data?.filter(d => d.validation_status === 'validated').length || 0;
      const failedDocs = data?.filter(d => d.status === 'failed').length || 0;
      const reviewDocs = data?.filter(d => d.status === 'pending_review').length || 0;

      const overallMetrics = {
        successRate: totalDocs > 0 ? Math.round((processedDocs / totalDocs) * 100) : 0,
        validationRate: totalDocs > 0 ? Math.round((validatedDocs / totalDocs) * 100) : 0,
        failureRate: totalDocs > 0 ? Math.round((failedDocs / totalDocs) * 100) : 0,
        reviewRate: totalDocs > 0 ? Math.round((reviewDocs / totalDocs) * 100) : 0,
        totalDocuments: totalDocs
      };

      // Calculate quality score (weighted average)
      const qualityScore = Math.round(
        (overallMetrics.successRate * 0.4) + 
        (overallMetrics.validationRate * 0.3) + 
        ((100 - overallMetrics.failureRate) * 0.3)
      );

      return {
        trendData,
        overallMetrics,
        qualityScore
      };
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quality Trends Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading quality trends...</div>
        </CardContent>
      </Card>
    );
  }

  const getQualityBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quality Trends Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            {getQualityBadge(qualityData?.qualityScore || 0)}
            <Badge variant="outline">Last 60 Days</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Score */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-blue-600">
            {qualityData?.qualityScore || 0}
          </div>
          <div className="text-sm text-muted-foreground">
            Overall Quality Score
          </div>
          <div className="text-xs text-muted-foreground">
            Based on processing success, validation rate, and failure rate
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle className="h-5 w-5" />
              {qualityData?.overallMetrics.successRate || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
              <Target className="h-5 w-5" />
              {qualityData?.overallMetrics.validationRate || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Validation Rate</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <AlertTriangle className="h-5 w-5" />
              {qualityData?.overallMetrics.reviewRate || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Manual Review</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-red-600">
              {qualityData?.overallMetrics.failureRate || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Failure Rate</div>
          </div>
        </div>

        {/* Success Rate Trend */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Processing Success Rate Trend</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qualityData?.trendData || []}>
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  name="Success Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-metric Trend */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quality Metrics Comparison</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityData?.trendData || []}>
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Success Rate"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="validationRate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Validation Rate"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="failureRate" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Failure Rate"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="reviewRate" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Review Rate"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Insights */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium">Quality Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="text-muted-foreground">
              Processed {qualityData?.overallMetrics.totalDocuments || 0} documents in the last 60 days
            </div>
            
            {(qualityData?.overallMetrics.failureRate || 0) > 15 && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                High failure rate detected - review processing pipeline
              </div>
            )}
            
            {(qualityData?.overallMetrics.reviewRate || 0) > 25 && (
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                High manual review rate - consider AI model improvements
              </div>
            )}
            
            {(qualityData?.qualityScore || 0) >= 90 && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                <CheckCircle className="h-4 w-4" />
                Excellent quality performance maintained
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
