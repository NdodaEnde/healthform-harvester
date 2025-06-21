
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePackage } from '@/contexts/PackageContext';
import AnalyticsService, { AnalyticsMetric } from '@/services/AnalyticsService';
import AnalyticsFeatureGate from '@/components/analytics/AnalyticsFeatureGate';
import { 
  Users, CheckCircle, Clock, FileText, Target, AlertTriangle, 
  Building2, BarChart3, TrendingUp, DollarSign, Shield, Settings,
  TrendingDown, Minus, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const iconMap = {
  Users, CheckCircle, Clock, FileText, Target, AlertTriangle,
  Building2, BarChart3, TrendingUp, DollarSign, Shield, Settings,
  TrendingDown, Minus
};

const EnhancedMetricsDashboard: React.FC = () => {
  const { currentTier, hasFeature, colors } = usePackage();
  const metrics = AnalyticsService.getMetricsForTier(currentTier);

  const renderMetricCard = (metric: AnalyticsMetric) => {
    const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || FileText;
    const TrendIcon = metric.trend === 'up' ? ArrowUpRight : 
                     metric.trend === 'down' ? ArrowDownRight : Minus;
    
    const trendColor = AnalyticsService.getTrendColor(metric.trend);
    const formattedValue = AnalyticsService.formatMetricValue(metric);

    // Check if this metric requires a higher tier
    const requiresUpgrade = metric.tier && !hasFeature(metric.feature!);

    if (requiresUpgrade) {
      return (
        <AnalyticsFeatureGate
          key={metric.id}
          feature={metric.feature}
          title={`${metric.name} - ${metric.tier?.toUpperCase()} Required`}
          description={`This advanced metric requires ${metric.tier} features to view detailed analytics.`}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconComponent className={`h-4 w-4 ${metric.color}`} />
                {metric.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formattedValue}</div>
              {metric.change && (
                <div className={`flex items-center text-sm ${trendColor}`}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {Math.abs(metric.change)}%
                </div>
              )}
            </CardContent>
          </Card>
        </AnalyticsFeatureGate>
      );
    }

    return (
      <Card key={metric.id} className="relative">
        {metric.tier && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs">
              {metric.tier.toUpperCase()}
            </Badge>
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconComponent className={`h-4 w-4 ${metric.color}`} />
            {metric.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          {metric.change && (
            <div className={`flex items-center text-sm ${trendColor}`}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {Math.abs(metric.change)}%
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${colors.text}`}>
            Health Metrics Dashboard
          </h2>
          <p className="text-muted-foreground">
            {currentTier === 'enterprise' ? 'Strategic intelligence with competitive benchmarking' :
             currentTier === 'premium' ? 'AI-powered insights with predictive analytics' :
             'Essential health metrics and compliance overview'}
          </p>
        </div>
        <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
          {metrics.length} Metrics Available
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(renderMetricCard)}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export Metrics
            </Button>
            <Button variant="outline" size="sm">
              Schedule Report
            </Button>
            {(currentTier === 'premium' || currentTier === 'enterprise') && (
              <Button variant="outline" size="sm">
                View Trends
              </Button>
            )}
            {currentTier === 'enterprise' && (
              <Button variant="outline" size="sm">
                Benchmark Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedMetricsDashboard;
