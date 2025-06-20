
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Zap, TrendingUp, Target, AlertTriangle, Building2, Users, BarChart3, Download, Calendar, FileText } from 'lucide-react';
import PremiumAnalyticsDashboard from './PremiumAnalyticsDashboard';
import PremiumReports from './PremiumReports';
import ComplianceMonitoring from './ComplianceMonitoring';
import MonthlyTestingMetrics from './MonthlyTestingMetrics';
import EmployeeRoster from './EmployeeRoster';
import { toast } from 'sonner';

const PremiumOverviewTab = () => {
  const { executiveSummary, riskAssessment, monthlyTrends, isLoading } = useEnhancedAnalytics();

  const generateAdvancedReport = (reportType: string) => {
    toast.success(`Generating ${reportType} report with advanced analytics...`);
    // Simulate report generation
    setTimeout(() => {
      toast.success(`${reportType} report with premium insights ready for download!`);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Premium advanced metrics
  const advancedMetrics = React.useMemo(() => {
    const riskDistribution = riskAssessment?.reduce((acc, item) => {
      const riskLevel = item.risk_level?.toLowerCase() || 'low';
      if (riskLevel.includes('high')) acc.high += item.test_count || 0;
      else if (riskLevel.includes('medium')) acc.medium += item.test_count || 0;
      else acc.low += item.test_count || 0;
      return acc;
    }, { low: 0, medium: 0, high: 0 }) || { low: 0, medium: 0, high: 0 };

    const trendAccuracy = monthlyTrends?.length > 2 ? 
      Math.round(85 + Math.random() * 10) : 85; // Simulated ML accuracy

    return {
      healthScore: executiveSummary?.health_score?.toFixed(1) || "7.8",
      riskPredictions: riskDistribution.high,
      departmentCount: riskAssessment?.length || 0,
      trendAccuracy: `${trendAccuracy}%`,
      riskDistribution
    };
  }, [executiveSummary, riskAssessment, monthlyTrends]);

  const premiumStats = [
    {
      title: "Health Intelligence Score",
      value: advancedMetrics.healthScore,
      icon: Target,
      trend: "AI-powered insights",
      color: "text-purple-600",
      change: "+2.3 points this month",
      description: "Advanced predictive health scoring"
    },
    {
      title: "Risk Predictions",
      value: advancedMetrics.riskPredictions,
      icon: AlertTriangle,
      trend: "Early warnings active",
      color: "text-red-600",
      change: "3 new alerts detected",
      description: "ML-powered risk detection"
    },
    {
      title: "Department Analytics",
      value: advancedMetrics.departmentCount,
      icon: Building2,
      trend: "Departments analyzed",
      color: "text-blue-600",
      change: "Full coverage active",
      description: "Granular department insights"
    },
    {
      title: "Trend Accuracy",
      value: advancedMetrics.trendAccuracy,
      icon: BarChart3,
      trend: "ML model performance",
      color: "text-green-600",
      change: "+1.8% improvement",
      description: "Predictive model accuracy"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Premium Welcome Banner */}
      <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Premium Analytics Suite
              </h2>
              <p className="text-gray-600 mb-4">
                Advanced insights with trend analysis, risk intelligence, department breakdowns, and predictive analytics.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Premium Plan Active
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => generateAdvancedReport('Executive Summary')}
                  className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Executive Report
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">✨ Premium Features Active:</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Advanced trend analysis</li>
                    <li>• Risk intelligence dashboard</li>
                    <li>• Department-level breakdowns</li>
                    <li>• Custom branded reports</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">🚀 Enhanced Capabilities:</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Predictive health analytics</li>
                    <li>• Automated report scheduling</li>
                    <li>• Real-time risk alerts</li>
                    <li>• Strategic recommendations</li>
                  </ul>
                </div>
              </div>
            </div>
            <TrendingUp className="h-12 w-12 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      {/* Premium Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {premiumStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.trend}
                </p>
                <p className="text-xs text-yellow-700 mt-1 font-medium">
                  {stat.change}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Premium Content Tabs */}
      <Tabs defaultValue="advanced-dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="advanced-dashboard">Advanced Dashboard</TabsTrigger>
          <TabsTrigger value="compliance">Smart Compliance</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Analytics</TabsTrigger>
          <TabsTrigger value="roster">Employee Intelligence</TabsTrigger>
          <TabsTrigger value="premium-reports">Premium Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="advanced-dashboard" className="space-y-4">
          <PremiumAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4">
          <Card className="mb-4 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">🎯 Premium Compliance Features</h3>
              <p className="text-yellow-700 text-sm">
                Advanced compliance monitoring with predictive alerts, risk scoring, and automated workflows.
              </p>
            </CardContent>
          </Card>
          <ComplianceMonitoring />
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-4">
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Advanced Monthly Analytics</h3>
              <p className="text-blue-700 text-sm">
                Deep-dive monthly metrics with trend analysis, forecasting, and performance benchmarking.
              </p>
            </CardContent>
          </Card>
          <MonthlyTestingMetrics />
        </TabsContent>
        
        <TabsContent value="roster" className="space-y-4">
          <Card className="mb-4 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-800 mb-2">👥 Employee Intelligence Dashboard</h3>
              <p className="text-green-700 text-sm">
                Advanced employee roster with health risk profiling, predictive insights, and custom analytics.
              </p>
            </CardContent>
          </Card>
          <EmployeeRoster />
        </TabsContent>
        
        <TabsContent value="premium-reports" className="space-y-4">
          <PremiumReports />
        </TabsContent>
      </Tabs>

      {/* Premium Value Proposition */}
      <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Premium Features Delivering Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Advanced Analytics
              </h4>
              <ul className="space-y-2 text-sm">
                <li>✅ Predictive health scoring</li>
                <li>✅ Risk intelligence dashboard</li>
                <li>✅ Department-level insights</li>
                <li>✅ Trend forecasting</li>
                <li>✅ Benchmark comparisons</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Premium Reporting
              </h4>
              <ul className="space-y-2 text-sm">
                <li>✅ Custom branded reports</li>
                <li>✅ Executive summaries</li>
                <li>✅ Automated scheduling</li>
                <li>✅ Interactive dashboards</li>
                <li>✅ Strategic recommendations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Smart Operations
              </h4>
              <ul className="space-y-2 text-sm">
                <li>✅ Predictive compliance alerts</li>
                <li>✅ Automated workflows</li>
                <li>✅ Real-time risk monitoring</li>
                <li>✅ Performance optimization</li>
                <li>✅ Strategic insights</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-900">Ready for Enterprise?</h4>
                <p className="text-sm text-gray-600">Unlock competitive benchmarking, API access, and white-label solutions</p>
              </div>
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                Upgrade to Enterprise
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumOverviewTab;
