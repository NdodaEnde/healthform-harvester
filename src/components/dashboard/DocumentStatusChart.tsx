
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface StatusCount {
  name: string;
  value: number;
  color: string;
}

export function DocumentStatusChart({ organizationId }: { organizationId: string | null }) {
  const [statusData, setStatusData] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocumentStatuses = async () => {
      if (!organizationId) {
        console.log("No organization ID provided to DocumentStatusChart");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      console.log("Fetching document statuses for organization:", organizationId);
      
      try {
        const query = supabase
          .from('documents')
          .select('status')
          .eq('organization_id', organizationId);
        
        console.log("Constructed status query:", JSON.stringify(query));
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching document statuses:', error);
          throw error;
        }
        
        console.log("Received document status data:", data?.length || 0, "documents");
        
        // Count documents by status
        const statusCounts: Record<string, number> = {
          'pending': 0,
          'processing': 0,
          'processed': 0,
          'error': 0
        };
        
        data?.forEach(doc => {
          const status = doc.status || 'pending';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        console.log("Status counts:", statusCounts);
        
        // Transform to chart data format
        const chartData: StatusCount[] = [
          { name: 'Processed', value: statusCounts['processed'], color: '#22c55e' },
          { name: 'Processing', value: statusCounts['processing'], color: '#3b82f6' },
          { name: 'Pending', value: statusCounts['pending'], color: '#f59e0b' },
          { name: 'Error', value: statusCounts['error'], color: '#ef4444' }
        ].filter(item => item.value > 0); // Only include statuses with documents
        
        setStatusData(chartData);
      } catch (error) {
        console.error('Error fetching document statuses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentStatuses();
  }, [organizationId]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <Card className="col-span-12 md:col-span-4 h-full">
      <CardHeader>
        <CardTitle>Document Status</CardTitle>
        <CardDescription>Current status distribution</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} documents`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No document data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
