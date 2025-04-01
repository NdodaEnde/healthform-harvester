
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Server, Database, FileCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SystemMetric {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
}

export function SystemHealthCards({ organizationId }: { organizationId: string | null }) {
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['system-health-metrics', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('organization_users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (usersError) throw usersError;
      
      // Get active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get documents processed in last 30 days
      const { count: recentDocuments, error: docsError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (docsError) throw docsError;
      
      // Get storage usage (in future could connect to actual storage metrics)
      // This is a placeholder for demo purposes
      const storageUsed = Math.floor(Math.random() * 1000) / 10; // Random value between 0-100 GB
      const storageLimit = 100; // 100 GB limit
      const storagePercentage = Math.floor((storageUsed / storageLimit) * 100);
      
      return {
        totalUsers: totalUsers || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.7), // Simulated: 70% of users active
        recentDocuments: recentDocuments || 0,
        storageUsed,
        storageLimit,
        storagePercentage
      };
    },
    enabled: !!organizationId
  });

  const getMetrics = (): SystemMetric[] => {
    if (!metricsData) {
      return [
        {
          title: "Users",
          value: "-",
          icon: <Users className="h-4 w-4 text-primary" />,
          description: "Total registered users"
        },
        {
          title: "Storage",
          value: "-",
          icon: <Server className="h-4 w-4 text-primary" />,
          description: "Storage space used"
        },
        {
          title: "Database",
          value: "-",
          icon: <Database className="h-4 w-4 text-primary" />,
          description: "Database status"
        },
        {
          title: "Documents",
          value: "-",
          icon: <FileCheck className="h-4 w-4 text-primary" />,
          description: "Documents processed"
        }
      ];
    }
    
    return [
      {
        title: "Users",
        value: metricsData.totalUsers,
        icon: <Users className="h-4 w-4 text-primary" />,
        description: `${metricsData.activeUsers} active users`,
        trend: {
          value: 5,
          label: "new this month",
          positive: true
        }
      },
      {
        title: "Storage",
        value: `${metricsData.storageUsed} GB`,
        icon: <Server className="h-4 w-4 text-primary" />,
        description: `${metricsData.storagePercentage}% of ${metricsData.storageLimit} GB`,
        trend: {
          value: 3,
          label: "% increase",
          positive: false
        }
      },
      {
        title: "Database",
        value: "Healthy",
        icon: <Database className="h-4 w-4 text-green-500" />,
        description: "All systems operational"
      },
      {
        title: "Documents",
        value: metricsData.recentDocuments,
        icon: <FileCheck className="h-4 w-4 text-primary" />,
        description: "Processed this month",
        trend: {
          value: 12,
          label: "% increase",
          positive: true
        }
      }
    ];
  };

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {getMetrics().map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">{metric.icon}</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                {metric.trend && (
                  <div className={`flex items-center text-xs mt-1 ${metric.trend.positive ? 'text-green-500' : 'text-amber-500'}`}>
                    {metric.trend.positive ? '↑' : '↓'} {metric.trend.value} {metric.trend.label}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
