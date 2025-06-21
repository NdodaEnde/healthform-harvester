
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePackage } from '@/contexts/PackageContext';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { 
  Users, CheckCircle, Clock, FileText, TrendingUp, Building2
} from 'lucide-react';

const BasicOverviewTab: React.FC = () => {
  const { colors } = usePackage();
  const { 
    executiveSummary, 
    computedMetrics,
    isLoading, 
    error 
  } = useOptimizedAnalytics({
    enableExecutiveSummary: true,
    enableTestResults: false,
    enableBenchmarks: false,
    enableRiskAssessment: false,
    enableTrends: false,
    enablePatientHistory: false
  });

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
          </CardContent>
        </Card>
      </div>
    );
  }

  const basicMetrics = [
    {
      title: "Total Patients",
      value: executiveSummary?.total_patients?.toLocaleString() || '0',
      icon: Users,
      description: "Registered patients in system",
      color: "text-blue-600",
      change: null
    },
    {
      title: "Active Companies", 
      value: executiveSummary?.total_companies?.toLocaleString() || '0',
      icon: Building2,
      description: "Organizations served",
      color: "text-green-600",
      change: null
    },
    {
      title: "Total Examinations",
      value: executiveSummary?.total_examinations?.toLocaleString() || '0',
      icon: FileText,
      description: "Medical examinations processed",
      color: "text-purple-600",
      change: null
    },
    {
      title: "Completion Rate",
      value: computedMetrics?.completionRateFormatted || '0%',
      icon: CheckCircle,
      description: "Overall completion rate",
      color: "text-emerald-600",
      change: null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Essential Metrics */}
      <div>
        <h2 className={`text-xl font-bold ${colors.text} mb-4`}>
          Essential Health Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {basicMetrics.map((metric) => {
            const IconComponent = metric.icon;
            return (
              <Card key={metric.title} className="hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${metric.color}`} />
                    {metric.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Health Score Overview */}
      {executiveSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {executiveSummary.total_fit || 0}
                </div>
                <div className="text-sm text-green-700">Fit Workers</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {executiveSummary.total_tests_completed || 0}
                </div>
                <div className="text-sm text-blue-700">Tests Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {computedMetrics?.healthScorePercentage || 0}
                </div>
                <div className="text-sm text-purple-700">Health Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
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
              Current Health Status
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {executiveSummary ? 
                `Your organization has ${executiveSummary.total_patients || 0} registered patients with ${computedMetrics?.completionRateFormatted || '0%'} completion rate.` :
                'Loading health status insights...'
              }
            </p>
            <p className={`text-sm ${colors.text} font-medium`}>
              💡 Recommendation: Continue monitoring patient health trends and maintain regular examinations.
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
