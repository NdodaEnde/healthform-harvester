
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { Clock, TrendingUp, Zap, AlertCircle } from 'lucide-react';

export default function ProcessingTimeMetrics() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: timeMetrics, isLoading } = useQuery({
    queryKey: ['processing-time-metrics', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      // Get documents with processing times from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('documents')
        .select('created_at, processed_at, file_name, document_type, status')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('processed_at', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate processing times
      const documentsWithTimes = data?.map(doc => {
        const createdAt = new Date(doc.created_at);
        const processedAt = new Date(doc.processed_at!);
        const processingTimeMinutes = Math.round((processedAt.getTime() - createdAt.getTime()) / (1000 * 60));
        
        return {
          ...doc,
          processingTimeMinutes,
          day: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      }) || [];

      // Group by day for trends
      const dailyData = documentsWithTimes.reduce((acc, doc) => {
        const day = doc.day;
        if (!acc[day]) {
          acc[day] = { day, times: [], count: 0 };
        }
        acc[day].times.push(doc.processingTimeMinutes);
        acc[day].count += 1;
        return acc;
      }, {} as Record<string, { day: string; times: number[]; count: number }>);

      const trendData = Object.values(dailyData).map(dayData => ({
        day: dayData.day,
        avgTime: Math.round(dayData.times.reduce((sum, time) => sum + time, 0) / dayData.times.length),
        count: dayData.count,
        maxTime: Math.max(...dayData.times),
        minTime: Math.min(...dayData.times)
      }));

      // Calculate summary metrics
      const allTimes = documentsWithTimes.map(d => d.processingTimeMinutes);
      const avgTime = allTimes.length > 0 ? Math.round(allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length) : 0;
      const medianTime = allTimes.length > 0 ? allTimes.sort((a, b) => a - b)[Math.floor(allTimes.length / 2)] : 0;
      const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 0;
      const minTime = allTimes.length > 0 ? Math.min(...allTimes) : 0;

      // Group by document type
      const typeData = documentsWithTimes.reduce((acc, doc) => {
        const type = doc.document_type || 'Unknown';
        if (!acc[type]) {
          acc[type] = { type, times: [] };
        }
        acc[type].times.push(doc.processingTimeMinutes);
        return acc;
      }, {} as Record<string, { type: string; times: number[] }>);

      const typeMetrics = Object.values(typeData).map(typeInfo => ({
        type: typeInfo.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        avgTime: Math.round(typeInfo.times.reduce((sum, time) => sum + time, 0) / typeInfo.times.length),
        count: typeInfo.times.length
      })).sort((a, b) => b.avgTime - a.avgTime);

      return {
        summary: { avgTime, medianTime, maxTime, minTime, totalDocuments: allTimes.length },
        trendData: trendData.slice(-14), // Last 14 days
        typeMetrics: typeMetrics.slice(0, 6) // Top 6 document types
      };
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing Time Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading processing metrics...</div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing Time Metrics
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Last 30 Days
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(timeMetrics?.summary.avgTime || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Average Time</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600">
              {formatTime(timeMetrics?.summary.medianTime || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Median Time</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-orange-600">
              {formatTime(timeMetrics?.summary.maxTime || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Longest Time</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-purple-600">
              {formatTime(timeMetrics?.summary.minTime || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Fastest Time</div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Processing Time Trends (Last 14 Days)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeMetrics?.trendData || []}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatTime}
                />
                <Tooltip 
                  formatter={(value: number) => [formatTime(value), 'Average Time']}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Type Performance */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Processing Time by Document Type</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeMetrics?.typeMetrics || []}>
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatTime}
                />
                <Tooltip 
                  formatter={(value: number) => [formatTime(value), 'Average Time']}
                />
                <Bar dataKey="avgTime" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Insights
          </h4>
          <div className="space-y-2 text-sm">
            {(timeMetrics?.summary.avgTime || 0) > 60 && (
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                Average processing time exceeds 1 hour - consider optimization
              </div>
            )}
            {(timeMetrics?.summary.totalDocuments || 0) > 0 && (
              <div className="text-muted-foreground">
                Processed {timeMetrics?.summary.totalDocuments} documents in the last 30 days
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
