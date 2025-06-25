
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export function DocumentProcessingTrends() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch real document processing trends from the last 6 months
  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['document-processing-trends', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Get documents processed in the last 6 months, grouped by month
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('documents')
        .select('processed_at, created_at, status')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month and count processed vs total
      const monthlyData = {};
      const currentDate = new Date();
      
      // Initialize last 6 months with 0 values
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyData[yearMonth] = { 
          month: monthKey, 
          total: 0, 
          processed: 0,
          value: 0 // This will be the processed count for the chart
        };
      }

      // Count documents by month
      data?.forEach(doc => {
        const date = new Date(doc.created_at);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (monthlyData[yearMonth]) {
          monthlyData[yearMonth].total++;
          if (doc.status === 'processed') {
            monthlyData[yearMonth].processed++;
          }
        }
      });

      // Set the value for chart display (processed documents)
      Object.keys(monthlyData).forEach(key => {
        monthlyData[key].value = monthlyData[key].processed;
      });

      return Object.values(monthlyData);
    },
    enabled: !!organizationId,
  });

  const chartData = trendsData || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            Document Processing Trends
          </CardTitle>
          <a href="/documents" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View Details →
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading trends...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={[0, 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px' 
                  }}
                  formatter={(value, name) => [value, 'Documents Processed']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
