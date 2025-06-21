
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { usePackage } from '@/contexts/PackageContext';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { 
  Users, Building2, FileText, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, Target, BarChart3
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const RealDataAnalyticsDashboard = () => {
  const { currentTier, colors, isPremium, isEnterprise } = usePackage();
  const { 
    executiveSummary, 
    testResultsSummary,
    monthlyTrends,
    riskAssessment,
    computedMetrics,
    isLoading, 
    error 
  } = useOptimizedAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <FeatureSkeleton key={i} type="card" className="h-32" />
          ))}
        </div>
        <FeatureSkeleton type="chart" className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureSkeleton type="chart" className="h-64" />
          <FeatureSkeleton type="chart" className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Analytics</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading your analytics data. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Key metrics for all tiers
  const keyMetrics = [
    {
      title: "Total Patients",
      value: executiveSummary?.total_patients?.toLocaleString() || '0',
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Companies",
      value: executiveSummary?.total_companies?.toLocaleString() || '0',
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Examinations",
      value: executiveSummary?.total_examinations?.toLocaleString() || '0',
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Fit Workers",
      value: executiveSummary?.total_fit?.toLocaleString() || '0',
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  // Test results data for charts
  const testResultsChartData = testResultsSummary?.slice(0, 8).map(result => ({
    testType: result.test_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
    total: result.total_tests || 0,
    completed: result.completed_tests || 0,
    abnormal: result.abnormal_count || 0,
    completionRate: Math.round(result.completion_rate || 0)
  })) || [];

  // Monthly trends data for line chart
  const trendsChartData = monthlyTrends?.slice(-6).map(trend => ({
    month: new Date(trend.test_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    tests: trend.test_count || 0,
    completion: Math.round(trend.completion_rate || 0),
    abnormal: Math.round(trend.abnormal_rate || 0)
  })) || [];

  // Fitness status distribution
  const fitnessData = executiveSummary ? [
    { 
      name: 'Fit Workers', 
      value: executiveSummary.total_fit || 0, 
      color: '#10b981' 
    },
    { 
      name: 'Others', 
      value: Math.max(0, (executiveSummary.total_patients || 0) - (executiveSummary.total_fit || 0)), 
      color: '#f59e0b' 
    }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Live data from your organization's health management system
          </p>
        </div>
        <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
          {currentTier.toUpperCase()} Analytics
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Live from database
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of medical test types and completion rates
            </p>
          </CardHeader>
          <CardContent>
            {testResultsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={testResultsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="testType" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#e5e7eb" name="Total Tests" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="abnormal" fill="#ef4444" name="Abnormal" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No test results data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fitness Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Workforce Fitness Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current fitness status of your workforce
            </p>
          </CardHeader>
          <CardContent>
            {fitnessData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={fitnessData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {fitnessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {executiveSummary?.total_fit || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Fit Workers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {(executiveSummary?.total_patients || 0) - (executiveSummary?.total_fit || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Others</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No fitness data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Premium/Enterprise Features */}
      {(isPremium || isEnterprise) && trendsChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trends Analysis
              <Badge variant="secondary" className="ml-2">
                {isEnterprise ? 'ENTERPRISE' : 'PREMIUM'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEnterprise ? 'Strategic trends with predictive insights' : 'Advanced trend analysis over time'}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="tests" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Tests"
                />
                <Line 
                  type="monotone" 
                  dataKey="completion" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Completion Rate %"
                />
                {isEnterprise && (
                  <Line 
                    type="monotone" 
                    dataKey="abnormal" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Abnormal Rate %"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Health Intelligence Summary */}
      {executiveSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Health Intelligence Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {computedMetrics?.completionRateFormatted || '0%'}
                </div>
                <p className="text-sm text-muted-foreground">Overall Completion Rate</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {computedMetrics?.healthScorePercentage || 0}
                </div>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {executiveSummary.total_tests_conducted || 0}
                </div>
                <p className="text-sm text-muted-foreground">Total Tests Conducted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealDataAnalyticsDashboard;
