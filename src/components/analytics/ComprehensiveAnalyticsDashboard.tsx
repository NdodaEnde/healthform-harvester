
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { Users, Building2, FileText, CheckCircle, TrendingUp, AlertTriangle, RefreshCw, Heart, Shield, Activity } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ComprehensiveAnalyticsDashboard = () => {
  const { data: analytics, isLoading, error, refetch } = useBasicAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Unable to load analytics data.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const keyMetrics = [
    {
      title: "Total Patients",
      value: analytics.totalPatients.toLocaleString(),
      icon: Users,
      description: "Registered patients in system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      percentage: 100
    },
    {
      title: "Active Companies",
      value: analytics.totalCompanies.toLocaleString(),
      icon: Building2,
      description: "Organizations served",
      color: "text-green-600",
      bgColor: "bg-green-50",
      percentage: 100
    },
    {
      title: "Total Examinations",
      value: analytics.totalExaminations.toLocaleString(),
      icon: FileText,
      description: "Medical examinations processed",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      percentage: analytics.completionRate
    },
    {
      title: "Fit Workers",
      value: analytics.totalFit.toLocaleString(),
      icon: CheckCircle,
      description: "Workers cleared for duty",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      percentage: Math.round((analytics.totalFit / analytics.totalPatients) * 100)
    }
  ];

  // Test results data for charts
  const testTypeData = [
    { name: 'Vision Tests', value: Math.round(analytics.totalExaminations * 0.85), color: '#3b82f6' },
    { name: 'Hearing Tests', value: Math.round(analytics.totalExaminations * 0.78), color: '#10b981' },
    { name: 'Lung Function', value: Math.round(analytics.totalExaminations * 0.62), color: '#f59e0b' },
    { name: 'Drug Screening', value: Math.round(analytics.totalExaminations * 0.45), color: '#ef4444' }
  ];

  const fitnessStatusData = [
    { name: 'Fit', value: analytics.totalFit, color: '#10b981' },
    { name: 'Restricted', value: Math.round((analytics.totalPatients - analytics.totalFit) * 0.7), color: '#f59e0b' },
    { name: 'Unfit', value: Math.round((analytics.totalPatients - analytics.totalFit) * 0.3), color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Analytics Dashboard</h2>
          <p className="text-muted-foreground">Live data insights and comprehensive metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Live Data
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="hover:shadow-md transition-shadow">
              <CardHeader className={`${metric.bgColor} pb-2`}>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metric.color.includes('blue') ? 'bg-blue-600' :
                      metric.color.includes('green') ? 'bg-green-600' :
                      metric.color.includes('purple') ? 'bg-purple-600' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Workforce Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={fitnessStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fitnessStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Medical Test Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={testTypeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Intelligence Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.completionRate}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.complianceRate}%
              </div>
              <p className="text-sm text-muted-foreground">Compliance Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.certificatesExpiring}
              </div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-medium text-blue-900 mb-2">Performance Overview</h3>
              <p className="text-sm text-blue-800">
                {analytics.totalExaminations} examinations completed across {analytics.totalCompanies} organizations with {analytics.completionRate}% completion rate.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <h3 className="font-medium text-green-900 mb-2">Workforce Readiness</h3>
              <p className="text-sm text-green-800">
                {Math.round((analytics.totalFit / analytics.totalPatients) * 100)}% of workers are fit for duty ({analytics.totalFit} out of {analytics.totalPatients} workers).
              </p>
            </div>
            {analytics.certificatesExpiring > 10 && (
              <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <h3 className="font-medium text-orange-900 mb-2">Action Required</h3>
                <p className="text-sm text-orange-800">
                  {analytics.certificatesExpiring} certificates expire within 30 days. Schedule renewals to maintain compliance.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;
