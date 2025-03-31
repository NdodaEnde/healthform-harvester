
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, format } from "date-fns";

export function TotalDocumentsCard({ organizationId }: { organizationId: string | null }) {
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [thisMonthDocuments, setThisMonthDocuments] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocumentCounts = async () => {
      if (!organizationId) return;
      
      setLoading(true);
      
      try {
        // Get total document count
        const { count: totalCount, error: totalError } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);
        
        if (totalError) throw totalError;
        
        // Get this month's document count
        const currentMonth = startOfMonth(new Date()).toISOString();
        const { count: monthCount, error: monthError } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', currentMonth);
        
        if (monthError) throw monthError;
        
        setTotalDocuments(totalCount || 0);
        setThisMonthDocuments(monthCount || 0);
      } catch (error) {
        console.error('Error fetching document counts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentCounts();
  }, [organizationId]);

  const currentMonth = format(new Date(), 'MMMM');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-16 items-center">
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {thisMonthDocuments > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{thisMonthDocuments}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-amber-500" />
                  <span className="text-amber-500">0</span>
                </>
              )}
              <span className="ml-1">this {currentMonth}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
