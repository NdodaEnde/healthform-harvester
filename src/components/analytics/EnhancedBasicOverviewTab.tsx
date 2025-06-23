
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePackage } from '@/contexts/PackageContext';
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { 
  Users, CheckCircle, AlertTriangle, FileText, TrendingUp, Building2,
  Activity, RefreshCw, Clock
} from 'lucide-react';

const EnhancedBasicOverviewTab: React.FC = () => {
  const { colors, currentTier } = usePackage();
  const { data: analytics, isLoading, error, refetch } = useBasicAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <FeatureSkeleton key={i} type="card" className="h-32" />
          ))}
        </div>
        <FeatureSkeleton type="chart" className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Unable to load analytics data. Please try again later.</p>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const basicMetrics = [
    {
      title: "Total Patients",
      value: analytics.totalPatients.toLocaleString(),
      icon: Users,
      description: "Registered patients in system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Active Companies", 
      value: analytics.totalCompanies.toLocaleString(),
      icon: Building2,
      description: "Organizations served",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Compliance Rate",
      value: `${analytics.complianceRate}%`,
      icon: CheckCircle,
      description: "Current compliance status",
      color: analytics.complianceRate >= 90 ? "text-green-600" : analytics.complianceRate >= 70 ? "text-yellow-600" : "text-red-600",
      bgColor: analytics.complianceRate >= 90 ? "bg-green-50" : analytics.complianceRate >= 70 ? "bg-yellow-50" : "bg-red-50",
      borderColor: analytics.complianceRate >= 90 ? "border-green-200" : analytics.complianceRate >= 70 ? "border-yellow-200" : "border-red-200"
    },
    {
      title: "Certificates Expiring",
      value: analytics.certificatesExpiring.toString(),
      icon: AlertTriangle,
      description: "Next 30 days",
      color: analytics.certificatesExpiring > 10 ? "text-red-600" : analytics.certificatesExpiring > 5 ? "text-orange-600" : "text-green-600",
      bgColor: analytics.certificatesExpiring > 10 ? "bg-red-50" : analytics.certificatesExpiring > 5 ? "bg-orange-50" : "bg-green-50",
      borderColor: analytics.certificatesExpiring > 10 ? "border-red-200" : analytics.certificatesExpiring > 5 ? "border-orange-200" : "border-green-200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${colors.text} mb-2`}>
            Essential Health Analytics
          </h2>
          <p className="text-muted-foreground">
            Core health metrics for your organization • Updated in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            {currentTier} Plan
          </Badge>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Essential Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {basicMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className={`${metric.borderColor} border-l-4 hover:shadow-md transition-all duration-300`}>
              <CardHeader className={`${metric.bgColor} pb-2`}>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Health Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalExaminations}
              </div>
              <div className="text-sm text-blue-700">Total Examinations</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.pendingDocuments}
              </div>
              <div className="text-sm text-orange-700">Pending Reviews</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.completionRate}%
              </div>
              <div className="text-sm text-purple-700">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="justify-start gap-2">
              <FileText className="h-4 w-4" />
              Generate Basic Report
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Users className="h-4 w-4" />
              View All Patients
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Clock className="h-4 w-4" />
              Check Expiring Certificates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 ${colors.background} rounded-lg border ${colors.border}`}>
            <h3 className={`font-medium ${colors.text} mb-2`}>
              Health Management Summary
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Managing {analytics.totalPatients} patients across {analytics.totalCompanies} organizations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${analytics.complianceRate >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Current compliance rate: {analytics.complianceRate}% {analytics.complianceRate >= 90 ? '(Excellent)' : '(Needs attention)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${analytics.certificatesExpiring <= 5 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span>{analytics.certificatesExpiring} certificates expiring in the next 30 days</span>
              </div>
            </div>
            <div className={`mt-3 p-2 bg-white rounded border-l-4 ${colors.border}`}>
              <p className={`text-sm ${colors.text} font-medium`}>
                💡 Recommendation: {analytics.complianceRate < 85 
                  ? 'Focus on improving compliance rates by scheduling overdue examinations.'
                  : analytics.certificatesExpiring > 10
                  ? 'Plan ahead for upcoming certificate renewals.'
                  : 'Great job maintaining high compliance standards!'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompt */}
      <UpgradePromptCard
        targetTier="premium"
        title="Unlock Advanced Analytics"
        description="Upgrade to Premium for trend analysis, predictive insights, and detailed reporting capabilities."
        features={[
          'Advanced trend analysis and forecasting',
          'Risk assessment and predictive analytics',
          'Department-level performance breakdowns',
          'Automated compliance alerts and notifications',
          'Custom report generation and exports',
          'Real-time dashboard with live updates'
        ]}
        variant="card"
      />
    </div>
  );
};

export default EnhancedBasicOverviewTab;
