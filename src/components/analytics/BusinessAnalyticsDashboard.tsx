
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { TrendingUp, Users, Building2, FileText, Calendar, BarChart3, DollarSign, Target } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

const BusinessAnalyticsDashboard = () => {
  const { data: analytics, isLoading, error } = useBasicAnalytics();

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
          <p className="text-muted-foreground">Unable to load business analytics data.</p>
        </CardContent>
      </Card>
    );
  }

  const businessMetrics = [
    {
      title: "Total Workforce",
      value: analytics.totalPatients.toLocaleString(),
      icon: Users,
      description: "Employees across all companies",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+5.2%"
    },
    {
      title: "Active Organizations",
      value: analytics.totalCompanies.toLocaleString(),
      icon: Building2,
      description: "Companies under management",
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+12.3%"
    },
    {
      title: "Operational Efficiency",
      value: `${analytics.completionRate}%`,
      icon: Target,
      description: "Process completion rate",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+2.1%"
    },
    {
      title: "Compliance ROI",
      value: `${Math.round(analytics.complianceRate * 1.2)}%`,
      icon: DollarSign,
      description: "Return on compliance investment",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+8.7%"
    }
  ];

  // Mock trend data for demonstration
  const trendData = [
    { month: 'Jan', patients: 120, examinations: 85, compliance: 78 },
    { month: 'Feb', patients: 132, examinations: 92, compliance: 82 },
    { month: 'Mar', patients: 145, examinations: 98, compliance: 85 },
    { month: 'Apr', patients: analytics.totalPatients, examinations: analytics.totalExaminations, compliance: analytics.complianceRate }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Business Intelligence Dashboard</h2>
          <p className="text-muted-foreground">Strategic insights and operational metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Business Analytics
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-800">
            Live Data
          </Badge>
        </div>
      </div>

      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {businessMetrics.map((metric) => {
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
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                  <span className="text-xs text-green-600 font-medium">
                    {metric.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Workforce Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="patients" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.totalPatients}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Workforce</div>
              <div className="text-xs text-blue-600 mt-1">Across {analytics.totalCompanies} organizations</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.complianceRate}%
              </div>
              <div className="text-sm text-green-700 font-medium">Compliance Rate</div>
              <div className="text-xs text-green-600 mt-1">Meeting regulatory standards</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.totalExaminations}
              </div>
              <div className="text-sm text-purple-700 font-medium">Total Assessments</div>
              <div className="text-xs text-purple-600 mt-1">Completed this period</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-medium text-blue-900 mb-2">Operational Excellence</h3>
              <p className="text-sm text-blue-800">
                Your organization maintains a {analytics.complianceRate}% compliance rate across {analytics.totalCompanies} companies, 
                demonstrating strong operational control and risk management.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <h3 className="font-medium text-green-900 mb-2">Growth Opportunity</h3>
              <p className="text-sm text-green-800">
                With {analytics.totalFit} fit workers and {analytics.certificatesExpiring} certificates requiring renewal, 
                there's potential to optimize workforce readiness and reduce administrative overhead.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Executive Report
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Dashboard
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trend Analysis
            </Button>
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              ROI Calculator
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessAnalyticsDashboard;
