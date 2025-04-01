
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function WorkQueueCard({ organizationId }: { organizationId: string | null }) {
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery({
    queryKey: ['work-queue', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      // Get pending documents
      const { count: pendingCount, error: pendingError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending');
      
      if (pendingError) throw pendingError;
      
      // Get processing documents
      const { count: processingCount, error: processingError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'processing');
      
      if (processingError) throw processingError;
      
      // Get recent documents (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { count: recentCount, error: recentError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'processed')
        .gte('created_at', oneDayAgo.toISOString());
      
      if (recentError) throw recentError;
      
      // Get documents with errors
      const { count: errorCount, error: errorCountError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'error');
      
      if (errorCountError) throw errorCountError;
      
      return {
        pendingCount: pendingCount || 0,
        processingCount: processingCount || 0,
        recentCount: recentCount || 0,
        errorCount: errorCount || 0
      };
    },
    enabled: !!organizationId
  });
  
  const workItems = [
    {
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      label: "Pending Documents",
      count: data?.pendingCount || 0,
      status: "warning",
      action: () => navigate('/documents?status=pending')
    },
    {
      icon: <FileText className="h-4 w-4 text-blue-500" />,
      label: "Processing Documents",
      count: data?.processingCount || 0,
      status: "info",
      action: () => navigate('/documents?status=processing')
    },
    {
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      label: "Recently Processed",
      count: data?.recentCount || 0,
      status: "success",
      action: () => navigate('/documents?status=processed')
    },
    {
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      label: "Processing Errors",
      count: data?.errorCount || 0,
      status: "error",
      action: () => navigate('/documents?status=error')
    }
  ];

  return (
    <Card className="col-span-12 md:col-span-6">
      <CardHeader>
        <CardTitle>Work Queue</CardTitle>
        <CardDescription>
          Documents requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-12 bg-muted animate-pulse rounded"></div>
            <div className="h-12 bg-muted animate-pulse rounded"></div>
            <div className="h-12 bg-muted animate-pulse rounded"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {workItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-background rounded-md border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={item.action}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-background p-1">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      item.status === "warning" ? "outline" : 
                      item.status === "error" ? "destructive" : 
                      item.status === "success" ? "secondary" : 
                      "outline"
                    }
                    className={
                      item.status === "warning" ? "bg-amber-100 text-amber-700 border-amber-200" : 
                      item.status === "info" ? "bg-blue-100 text-blue-700 border-blue-200" : 
                      item.status === "success" ? "bg-green-100 text-green-700 border-green-200" : 
                      item.status === "error" ? "bg-red-100 text-red-700 border-red-200" : ""
                    }
                  >
                    {item.count}
                  </Badge>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => navigate('/documents')}
            >
              View All Documents
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
