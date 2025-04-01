
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfYear, endOfYear } from "date-fns";

interface DocumentByMonth {
  month: string;
  count: number;
}

export function DocumentActivityChart({ organizationId }: { organizationId: string | null }) {
  const [activityData, setActivityData] = useState<DocumentByMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocumentActivity = async () => {
      if (!organizationId) {
        console.log("No organization ID provided to DocumentActivityChart");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      const currentYear = new Date().getFullYear();
      const startDate = startOfYear(new Date(currentYear, 0, 1)).toISOString();
      const endDate = endOfYear(new Date(currentYear, 11, 31)).toISOString();
      
      console.log("Fetching documents for organization:", organizationId);
      console.log("Date range:", { startDate, endDate });
      
      try {
        const query = supabase
          .from('documents')
          .select('created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        
        console.log("Constructed query:", JSON.stringify(query));
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching document activity:', error);
          throw error;
        }
        
        console.log("Received document data:", data?.length || 0, "documents");
        
        // Initialize array with all months
        const months = Array.from({ length: 12 }, (_, i) => ({
          month: format(new Date(currentYear, i, 1), 'MMM'),
          count: 0,
          index: i
        }));
        
        // Count documents by month
        data?.forEach(doc => {
          const docDate = new Date(doc.created_at);
          const monthIndex = docDate.getMonth();
          months[monthIndex].count += 1;
        });
        
        // Sort by month index
        const sortedMonths = months.sort((a, b) => a.index - b.index);
        
        // Remove index property before setting state
        setActivityData(sortedMonths.map(({ month, count }) => ({ month, count })));
      } catch (error) {
        console.error('Error fetching document activity:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentActivity();
  }, [organizationId]);
  
  const getBarColor = (count: number) => {
    if (count > 10) return "#22c55e";  // High activity - green
    if (count > 5) return "#3b82f6";   // Medium activity - blue
    return "#94a3b8";                   // Low activity - gray
  };

  return (
    <Card className="col-span-12 md:col-span-8 h-full">
      <CardHeader>
        <CardTitle>Document Activity</CardTitle>
        <CardDescription>Monthly document volume for {new Date().getFullYear()}</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activityData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} documents`, 'Count']}
                labelFormatter={(label) => `${label} ${new Date().getFullYear()}`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
