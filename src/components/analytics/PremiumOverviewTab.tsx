
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Zap, TrendingUp, Target, AlertTriangle, Building2, Users, BarChart3 } from 'lucide-react';
import PremiumAnalyticsDashboard from './PremiumAnalyticsDashboard';
import PremiumReports from './PremiumReports';
import ComplianceMonitoring from './ComplianceMonitoring';
import MonthlyTestingMetrics from './MonthlyTestingMetrics';
import EmployeeRoster from './EmployeeRoster';

const PremiumOverviewTab = () => {
  const { executiveSummary, isLoading } = useEnhancedAnalytics();

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

  const premiumStats = [
    {
      title: "Health Intelligence Score",
      value: executiveSummary?.health_score?.toFixed(1) || "0.0",
      icon: Target,
      trend: "AI-powered insights",
      color: "text-purple-600",
      change: "+2.3 points this month"
    },
    {
      title: "Risk Predictions",
      value: executiveSummary?.high_risk_results || 0,
      icon: AlertTriangle,
      trend: "Early warnings active",
      color: "text-red-600",
      change: "3 new alerts"
    },
    {
      title: "Department Analytics",
      value: "12",
      icon: Building2,
      trend: "Departments analyzed",
      color: "text-blue-600",
      change: "Full coverage"
    },
    {
      title: "Trend Accuracy",
      value: "94.2%",
      icon: BarChart3,
      trend: "ML model performance",
      color: "text-green-600",
      change: "+1.8% improvement"
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
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Premium Plan
                </Badge>
                <span className="text-sm text-gray-500">
                  Advanced features for strategic decision making
                </span>
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
            <Card key={stat.title} className="border-l-4 border-l-yellow-500">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Premium Content Tabs */}
      <Tabs defaultValue="advanced-dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="advanced-dashboard">Advanced Dashboard</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Metrics</TabsTrigger>
          <TabsTrigger value="roster">Employee Roster</TabsTrigger>
          <TabsTrigger value="premium-reports">Premium Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="advanced-dashboard" className="space-y-4">
          <PremiumAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4">
          <ComplianceMonitoring />
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-4">
          <MonthlyTestingMetrics />
        </TabsContent>
        
        <TabsContent value="roster" className="space-y-4">
          <EmployeeRoster />
        </TabsContent>
        
        <TabsContent value="premium-reports" className="space-y-4">
          <PremiumReports />
        </TabsContent>
      </Tabs>

      {/* Premium Feature Showcase */}
      <Card className="border-dashed border-2 border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-green-800">Premium Features Active</CardTitle>
          <p className="text-sm text-green-700">
            You have access to all premium analytics and reporting features
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-3">✅ Premium Analytics</h4>
              <ul className="space-y-2 text-sm">
                <li>• Advanced trend analysis & forecasting</li>
                <li>• Risk intelligence dashboard</li>
                <li>• Department-level breakdowns</li>
                <li>• Predictive health analytics</li>
                <li>• Custom branded reports</li>
                <li>• Automated report scheduling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-3">🚀 Coming Soon to Enterprise</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Competitive benchmarking</li>
                <li>• API access & integrations</li>
                <li>• White-label solutions</li>
                <li>• Dedicated support</li>
                <li>• Custom ML models</li>
                <li>• Strategic consulting</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              Upgrade to Enterprise - $999/month
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumOverviewTab;
