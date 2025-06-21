
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePackage } from '@/contexts/PackageContext';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { EnhancedMetricsDashboard } from '@/components/analytics/EnhancedMetricsDashboard';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { 
  TrendingUp, AlertTriangle, Users, Building2, Target, BarChart3,
  Zap, Crown
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

const PremiumOverviewTab: React.FC = () => {
  const { colors, currentTier, isEnterprise } = usePackage();
  const { 
    executiveSummary, 
    monthlyTrends, 
    riskAssessment, 
    computedMetrics,
    isLoading, 
    error 
  } = useOptimizedAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <FeatureSkeleton type="card" className="h-32" />
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
            <p className="text-muted-foreground">Unable to load premium analytics data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trendData = monthlyTrends?.slice(-6).map(trend => ({
    month: new Date(trend.test_month).toLocaleDateString('en-US', { month: 'short' }),
    tests: trend.test_count,
    completion_rate: Math.round(trend.completion_rate) || 0,
    abnormal_rate: Math.round(trend.abnormal_rate) || 0
  })) || [];

  const riskDistribution = React.useMemo(() => {
    if (!riskAssessment) return { low: 0, medium: 0, high: 0 };
    
    return riskAssessment.reduce((acc, item) => {
      const riskLevel = item.risk_level?.toLowerCase() || 'low';
      if (riskLevel.includes('high')) {
        acc.high += item.test_count || 0;
      } else if (riskLevel.includes('medium')) {
        acc.medium += item.test_count || 0;
      } else {
        acc.low += item.test_count || 0;
      }
      return acc;
    }, { low: 0, medium: 0, high: 0 });
  }, [riskAssessment]);

  const premiumMetrics = [
    {
      title: "Health Intelligence Score",
      value: computedMetrics?.healthScorePercentage?.toFixed(1) || "0.0",
      icon: Target,
      trend: "AI-powered scoring",
      color: "text-blue-600",
      description: "Advanced health scoring algorithm"
    },
    {
      title: "Risk Intelligence",
      value: riskDistribution.high,
      icon: AlertTriangle,
      trend: "High-risk cases identified",
      color: "text-red-600",
      description: "AI-powered risk assessment"
    },
    {
      title: "Department Insights",
      value: riskAssessment?.length || 0,
      icon: Building2,
      trend: "Departments analyzed",
      color: "text-purple-600",
      description: "Department-level breakdowns"
    },
    {
      title: "Completion Excellence",
      value: computedMetrics?.completionRateFormatted || "0%",
      icon: BarChart3,
      trend: "Overall performance",
      color: "text-green-600",
      description: "Advanced completion tracking"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Premium Features Banner */}
      <Card className={`${currentTier === 'enterprise' ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isEnterprise ? 'Enterprise Analytics Dashboard' : 'Premium Analytics Dashboard'}
              </h2>
              <p className="text-gray-600 mb-4">
                {isEnterprise ? 
                  'Strategic intelligence with competitive benchmarking and enterprise-grade insights.' :
                  'Advanced insights with trend analysis, risk intelligence, and predictive analytics.'
                }
              </p>
              <Badge className={isEnterprise ? "bg-purple-100 text-purple-800" : "bg-yellow-100 text-yellow-800"}>
                {isEnterprise ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Enterprise Features Active
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    Premium Features Active
                  </>
                )}
              </Badge>
            </div>
            {isEnterprise ? (
              <Crown className="h-12 w-12 text-purple-600" />
            ) : (
              <TrendingUp className="h-12 w-12 text-yellow-600" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Premium Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {premiumMetrics.map((metric) => {
          const IconComponent = metric.icon;
          const borderColor = isEnterprise ? "border-l-purple-500" : "border-l-yellow-500";
          return (
            <Card key={metric.title} className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow duration-300`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.trend}
                </p>
                <p className={`text-xs mt-1 font-medium ${isEnterprise ? 'text-purple-700' : 'text-yellow-700'}`}>
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${isEnterprise ? 'text-purple-600' : 'text-yellow-600'}`} />
              Health Trends Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEnterprise ? 'Strategic trend analysis with predictive modeling' : 'Advanced trend analysis with completion predictions'}
            </p>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="completion_rate" 
                    stroke={isEnterprise ? "#8b5cf6" : "#f59e0b"} 
                    fill={isEnterprise ? "#ede9fe" : "#fef3c7"} 
                    name="Completion Rate %" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="abnormal_rate" 
                    stroke="#ef4444" 
                    fill="#fee2e2" 
                    name="Abnormal Rate %" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Risk Intelligence Matrix
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEnterprise ? 'Enterprise risk assessment with compliance tracking' : 'AI-powered risk assessment and predictions'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{riskDistribution.low}</div>
                  <div className="text-sm text-green-700">Low Risk</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{riskDistribution.medium}</div>
                  <div className="text-sm text-yellow-700">Medium Risk</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{riskDistribution.high}</div>
                  <div className="text-sm text-red-700">High Risk</div>
                </div>
              </div>
              
              <div className={`mt-4 p-4 rounded-lg ${isEnterprise ? 'bg-purple-50' : 'bg-yellow-50'}`}>
                <h4 className={`font-medium mb-2 ${isEnterprise ? 'text-purple-800' : 'text-yellow-800'}`}>
                  {isEnterprise ? 'Enterprise Insights' : 'Premium Insights'}
                </h4>
                <ul className={`text-sm space-y-1 ${isEnterprise ? 'text-purple-700' : 'text-yellow-700'}`}>
                  <li>• {isEnterprise ? 'Strategic risk modeling active' : 'Predictive risk modeling active'}</li>
                  <li>• Department-level risk analysis</li>
                  <li>• Early intervention recommendations</li>
                  <li>• {isEnterprise ? 'Compliance-based forecasting' : 'Trend-based health forecasting'}</li>
                  {isEnterprise && <li>• Competitive benchmarking insights</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Metrics Dashboard */}
      <EnhancedMetricsDashboard />

      {/* Enterprise Upgrade Prompt */}
      {!isEnterprise && (
        <Card className="border-dashed border-2 border-purple-200 bg-purple-50/30">
          <CardContent className="p-6 text-center">
            <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unlock Enterprise Intelligence</h3>
            <p className="text-muted-foreground mb-4">
              Access strategic insights, competitive benchmarking, and board-ready analytics.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Enterprise
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PremiumOverviewTab;
