
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Clock, Zap, CheckCircle } from 'lucide-react';

interface QueueStats {
  totalInQueue: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
  throughputPerHour: number;
}

export default function RealtimeQueueMonitor() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const [queueStats, setQueueStats] = useState<QueueStats>({
    totalInQueue: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    avgProcessingTime: 0,
    throughputPerHour: 0
  });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!organizationId) return;

    const fetchQueueStats = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('status, created_at, processed_at')
          .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`);

        if (error) throw error;

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentDocs = data?.filter(doc => new Date(doc.created_at) >= oneDayAgo) || [];
        const lastHourDocs = data?.filter(doc => new Date(doc.created_at) >= oneHourAgo) || [];

        const statusCounts = recentDocs.reduce((acc, doc) => {
          const status = doc.status || 'uploaded';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Calculate average processing time
        const processedDocs = recentDocs.filter(doc => doc.processed_at && doc.status === 'processed');
        const processingTimes = processedDocs.map(doc => {
          const created = new Date(doc.created_at);
          const processed = new Date(doc.processed_at!);
          return (processed.getTime() - created.getTime()) / (1000 * 60); // minutes
        });

        const avgTime = processingTimes.length > 0 
          ? Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length)
          : 0;

        setQueueStats({
          totalInQueue: (statusCounts.uploaded || 0) + (statusCounts.processing || 0) + (statusCounts.pending_review || 0),
          processing: statusCounts.processing || 0,
          completed: statusCounts.processed || 0,
          failed: statusCounts.failed || 0,
          avgProcessingTime: avgTime,
          throughputPerHour: lastHourDocs.filter(doc => doc.status === 'processed').length
        });

        setIsLive(true);
      } catch (error) {
        console.error('Error fetching queue stats:', error);
        setIsLive(false);
      }
    };

    // Initial fetch
    fetchQueueStats();

    // Set up real-time subscription
    const channel = supabase
      .channel('queue-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        () => {
          console.log('Document change detected, refreshing queue stats');
          fetchQueueStats();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchQueueStats, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [organizationId]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const completionRate = queueStats.completed + queueStats.failed > 0 
    ? Math.round((queueStats.completed / (queueStats.completed + queueStats.failed)) * 100)
    : 0;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Real-time Processing Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <Badge variant={isLive ? "default" : "secondary"} className="text-xs">
              {isLive ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Queue Size */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-blue-600">
              {queueStats.totalInQueue}
            </div>
            <div className="text-sm text-muted-foreground">In Queue</div>
            <div className="text-xs text-muted-foreground">
              {queueStats.processing} processing
            </div>
          </div>

          {/* Completion Rate */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-green-600">
              {completionRate}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <Progress value={completionRate} className="h-1" />
          </div>

          {/* Processing Time */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
              <Clock className="h-5 w-5" />
              {formatTime(queueStats.avgProcessingTime)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Time</div>
            <div className="text-xs text-muted-foreground">Last 24h</div>
          </div>

          {/* Throughput */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <Zap className="h-5 w-5" />
              {queueStats.throughputPerHour}
            </div>
            <div className="text-sm text-muted-foreground">Per Hour</div>
            <div className="text-xs text-muted-foreground">Current rate</div>
          </div>

          {/* Status Summary */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-gray-700 flex items-center justify-center gap-1">
              <CheckCircle className="h-5 w-5" />
              {queueStats.completed}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-xs text-red-600">
              {queueStats.failed} failed
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">System Status:</span>
            <div className="flex items-center gap-2">
              {queueStats.totalInQueue === 0 ? (
                <Badge className="bg-green-100 text-green-800">Idle</Badge>
              ) : queueStats.processing > 0 ? (
                <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">Queued</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Updated {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
