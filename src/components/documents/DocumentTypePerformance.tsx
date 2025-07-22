
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function DocumentTypePerformance() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['document-type-performance', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { data, error } = await supabase
        .from('documents')
        .select('document_type, status, created_at')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`);

      if (error) throw error;

      // Group by document type
      const typeStats = data?.reduce((acc, doc) => {
        const type = doc.document_type || 'Unknown';
        const status = doc.status || 'uploaded';
        
        if (!acc[type]) {
          acc[type] = {
            type,
            total: 0,
            processed: 0,
            failed: 0,
            processing: 0,
            pending_review: 0
          };
        }
        
        acc[type].total += 1;
        acc[type][status] = (acc[type][status] || 0) + 1;
        
        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate success rates and format data
      const typePerformance = Object.values(typeStats).map((stats: any) => {
        const successRate = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;
        const failureRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;
        
        return {
          type: stats.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          originalType: stats.type,
          total: stats.total,
          processed: stats.processed || 0,
          failed: stats.failed || 0,
          processing: stats.processing || 0,
          pending_review: stats.pending_review || 0,
          successRate,
          failureRate
        };
      }).sort((a, b) => b.total - a.total);

      // Overall distribution for pie chart
      const totalDocs = typePerformance.reduce((sum, item) => sum + item.total, 0);
      const pieData = typePerformance.slice(0, 6).map((item, index) => ({
        name: item.type,
        value: item.total,
        percentage: totalDocs > 0 ? Math.round((item.total / totalDocs) * 100) : 0,
        color: COLORS[index % COLORS.length]
      }));

      return {
        typePerformance: typePerformance.slice(0, 8),
        pieData,
        totalDocuments: totalDocs
      };
    },
    enabled: !!organizationId,
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Type Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading performance data...</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (successRate: number) => {
    if (successRate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (successRate >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (successRate >= 50) return <Badge className="bg-orange-100 text-orange-800">Needs Attention</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Type Performance
          </CardTitle>
          <Badge variant="outline">
            {performanceData?.totalDocuments || 0} Total Documents
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Distribution Pie Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Document Distribution</h4>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="h-48 lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData?.pieData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {performanceData?.pieData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} documents`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:w-1/2 space-y-2">
              {performanceData?.pieData?.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Success Rate by Type */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Success Rate by Document Type</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData?.typePerformance || []}>
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
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Success Rate']}
                />
                <Bar 
                  dataKey="successRate" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Performance Table */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Detailed Performance Breakdown</h4>
          <div className="space-y-2">
            {performanceData?.typePerformance?.map((type) => (
              <div key={type.originalType} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{type.type}</span>
                    {getStatusBadge(type.successRate)}
                  </div>
                  <span className="text-sm text-muted-foreground">{type.total} total</span>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Processed: {type.processed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    <span>Failed: {type.failed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    <span>Processing: {type.processing}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                    <span>Review: {type.pending_review}</span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-green-600 font-medium">{type.successRate}% success rate</span>
                  {type.failureRate > 10 && (
                    <span className="text-red-600 ml-2">({type.failureRate}% failure rate)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
