
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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

      const isServiceProvider = organizationId === 'e95df707-d618-4ca4-9e2f-d80359e96622';
      const orgFilter = isServiceProvider 
        ? `organization_id.eq.${organizationId}`
        : `client_organization_id.eq.${organizationId}`;

      // Get documents processed in the last 6 months, grouped by month
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('documents')
        .select('processed_at, created_at')
        .or(orgFilter)
        .eq('status', 'processed')
        .gte('processed_at', sixMonthsAgo.toISOString())
        .order('processed_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData = {};
      const currentDate = new Date();
      
      // Initialize last 6 months with 0 values
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyData[yearMonth] = { month: monthKey, value: 0 };
      }

      // Count processed documents by month
      data?.forEach(doc => {
        if (doc.processed_at) {
          const date = new Date(doc.processed_at);
          const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (monthlyData[yearMonth]) {
            monthlyData[yearMonth].value++;
          }
        }
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
                  domain={[0, 'dataMax + 5']}
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
