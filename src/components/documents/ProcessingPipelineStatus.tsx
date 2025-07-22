
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  Upload, 
  Settings, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface PipelineStatus {
  uploaded: number;
  processing: number;
  pending_review: number;
  processed: number;
  failed: number;
}

export default function ProcessingPipelineStatus() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ['processing-pipeline-status', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { data, error } = await supabase
        .from('documents')
        .select('status')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`);

      if (error) throw error;

      const statusCounts = data?.reduce((acc, doc) => {
        const status = doc.status || 'uploaded';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        uploaded: statusCounts.uploaded || 0,
        processing: statusCounts.processing || 0,
        pending_review: statusCounts.pending_review || 0,
        processed: statusCounts.processed || 0,
        failed: statusCounts.failed || 0,
      } as PipelineStatus;
    },
    enabled: !!organizationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processing Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading pipeline status...</div>
        </CardContent>
      </Card>
    );
  }

  const total = pipelineData ? 
    pipelineData.uploaded + pipelineData.processing + pipelineData.pending_review + 
    pipelineData.processed + pipelineData.failed : 0;

  const stages = [
    {
      name: 'Uploaded',
      count: pipelineData?.uploaded || 0,
      icon: Upload,
      color: 'bg-blue-100 text-blue-700',
      description: 'Documents uploaded and queued'
    },
    {
      name: 'Processing',
      count: pipelineData?.processing || 0,
      icon: Settings,
      color: 'bg-yellow-100 text-yellow-700',
      description: 'AI extraction in progress'
    },
    {
      name: 'Pending Review',
      count: pipelineData?.pending_review || 0,
      icon: Eye,
      color: 'bg-orange-100 text-orange-700',
      description: 'Requires manual verification'
    },
    {
      name: 'Processed',
      count: pipelineData?.processed || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
      description: 'Successfully completed'
    },
    {
      name: 'Failed',
      count: pipelineData?.failed || 0,
      icon: XCircle,
      color: 'bg-red-100 text-red-700',
      description: 'Processing failed or rejected'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Processing Pipeline Status
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stages.map((stage) => {
            const IconComponent = stage.icon;
            const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
            
            return (
              <div key={stage.name} className="text-center space-y-2">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${stage.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stage.count}</div>
                  <div className="text-sm font-medium">{stage.name}</div>
                  <div className="text-xs text-muted-foreground">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pipeline Flow Visualization */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Pipeline Flow</h4>
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
              
              return (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-muted-foreground">
                      {stage.count} documents ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{total}</div>
              <div className="text-sm text-muted-foreground">Total Documents</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {total > 0 ? Math.round(((pipelineData?.processed || 0) / total) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">
                {(pipelineData?.processing || 0) + (pipelineData?.pending_review || 0)}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(pipelineData?.failed || 0) > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              {pipelineData?.failed} documents require attention
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
