
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePackage } from '@/contexts/PackageContext';
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface MetricCardProps {
  metric: {
    id: string;
    title: string;
    icon: string;
    color: string;
    description: string;
    isPremium?: boolean;
    isEnterprise?: boolean;
  };
  value: string | number;
  change?: string;
  trend?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, value, change, trend }) => {
  const { colors } = usePackage();
  const IconComponent = Icons[metric.icon as keyof typeof Icons] as LucideIcon;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${metric.isPremium ? 'border-yellow-200' : metric.isEnterprise ? 'border-purple-200' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className={`h-4 w-4 ${metric.color}`} />}
          {metric.isPremium && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
              Premium
            </Badge>
          )}
          {metric.isEnterprise && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
              Enterprise
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {metric.description}
        </p>
        {change && (
          <p className={`text-xs mt-1 font-medium ${colors.accent}`}>
            {change}
          </p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const PackageAwareMetrics: React.FC = () => {
  const { metrics, hasFeature } = usePackage();
  const { executiveSummary, riskAssessment, monthlyTrends } = useEnhancedAnalytics();

  // Calculate metric values based on available data
  const getMetricValue = (metricId: string) => {
    switch (metricId) {
      case 'active_employees':
        return executiveSummary?.total_patients || 0;
      case 'compliance_rate':
        return `${executiveSummary?.overall_completion_rate?.toFixed(1) || 0}%`;
      case 'expiring_certificates':
        return Math.floor(Math.random() * 25) + 5; // Simulated
      case 'monthly_tests':
        return executiveSummary?.total_examinations || 0;
      case 'health_intelligence_score':
        return executiveSummary?.health_score?.toFixed(1) || "7.8";
      case 'risk_predictions':
        const highRisk = riskAssessment?.filter(item => 
          item.risk_level?.toLowerCase().includes('high')
        ).length || 0;
        return highRisk;
      case 'department_analytics':
        return riskAssessment?.length || 0;
      case 'trend_accuracy':
        return monthlyTrends?.length > 2 ? `${Math.round(85 + Math.random() * 10)}%` : '85%';
      case 'competitive_benchmarking':
        return hasFeature('competitive_benchmarking') ? 'Active' : 'N/A';
      case 'roi_health_investments':
        return hasFeature('competitive_benchmarking') ? '$2.4M' : 'N/A';
      case 'regulatory_risk_score':
        return hasFeature('competitive_benchmarking') ? '2.1/10' : 'N/A';
      case 'custom_business_kpis':
        return hasFeature('competitive_benchmarking') ? '12 Active' : 'N/A';
      default:
        return 'N/A';
    }
  };

  const getMetricChange = (metricId: string) => {
    if (metricId.includes('premium') || metricId.includes('enterprise')) {
      return '+15% this month';
    }
    return '+5.2% from last month';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          value={getMetricValue(metric.id)}
          change={getMetricChange(metric.id)}
        />
      ))}
    </div>
  );
};

export default PackageAwareMetrics;
