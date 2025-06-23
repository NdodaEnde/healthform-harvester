
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSetupAnalytics, useAnalyticsHealth } from '@/hooks/useBasicAnalytics';
import { AlertTriangle, CheckCircle, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AnalyticsSetupComponent: React.FC = () => {
  const setupAnalytics = useSetupAnalytics();
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useAnalyticsHealth();

  const handleSetup = async () => {
    try {
      await setupAnalytics.refetch();
      toast.success('Analytics infrastructure setup completed successfully!');
      // Refetch health data to see the updated status
      setTimeout(() => refetchHealth(), 1000);
    } catch (error) {
      console.error('Setup failed:', error);
      toast.error('Failed to setup analytics infrastructure');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: string) => {
    return status === 'healthy' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Analytics Infrastructure Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup Button */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSetup}
            disabled={setupAnalytics.isLoading}
            className="flex items-center gap-2"
          >
            {setupAnalytics.isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Setup Analytics Infrastructure
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => refetchHealth()}
            disabled={healthLoading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Health Status */}
        {healthData && (
          <div className="space-y-2">
            <h4 className="font-medium">Component Status:</h4>
            <div className="grid gap-2">
              {healthData.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium capitalize">{item.component.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{item.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup Result */}
        {setupAnalytics.data && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">{setupAnalytics.data}</p>
          </div>
        )}

        {/* Setup Error */}
        {setupAnalytics.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              Setup failed: {setupAnalytics.error.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsSetupComponent;
