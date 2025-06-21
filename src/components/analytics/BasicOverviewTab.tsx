
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePackage } from '@/contexts/PackageContext';
import AnalyticsService from '@/services/AnalyticsService';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { 
  Users, CheckCircle, Clock, FileText, ArrowUpRight, 
  ArrowDownRight, Minus, TrendingUp 
} from 'lucide-react';

const iconMap = {
  Users, CheckCircle, Clock, FileText
};

const BasicOverviewTab: React.FC = () => {
  const { colors } = usePackage();
  const metrics = AnalyticsService.getMetricsForTier('basic');

  const renderBasicMetric = (metric: any) => {
    const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || FileText;
    const TrendIcon = metric.trend === 'up' ? ArrowUpRight : 
                     metric.trend === 'down' ? ArrowDownRight : Minus;
    
    const trendColor = AnalyticsService.getTrendColor(metric.trend);
    const formattedValue = AnalyticsService.formatMetricValue(metric);

    return (
      <Card key={metric.id}>
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
      {/* Essential Metrics */}
      <div>
        <h2 className={`text-xl font-bold ${colors.text} mb-4`}>
          Essential Health Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(renderBasicMetric)}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export Basic Report
            </Button>
            <Button variant="outline" size="sm">
              View Compliance
            </Button>
            <Button variant="outline" size="sm">
              Check Certificates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 ${colors.background} rounded-lg border ${colors.border}`}>
            <h3 className={`font-medium ${colors.text} mb-2`}>
              Compliance Rate Improvement
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your compliance rate has improved by 2.1% this month, indicating better health management processes.
            </p>
            <p className={`text-sm ${colors.text} font-medium`}>
              💡 Recommendation: Continue current practices and monitor monthly trends.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompt */}
      <UpgradePromptCard
        targetTier="premium"
        title="Unlock AI-Powered Analytics"
        description="Upgrade to Premium for advanced insights, predictive analytics, and automated reporting."
        features={[
          'AI-powered health intelligence scoring',
          'Predictive risk analysis and alerts',
          'Department-level performance breakdowns',
          'Advanced trend analysis and forecasting',
          'Automated report generation',
          'Custom branding for reports'
        ]}
        variant="card"
      />
    </div>
  );
};

export default BasicOverviewTab;
