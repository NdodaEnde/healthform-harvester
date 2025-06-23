
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { Users, Building2, FileText, CheckCircle, TrendingUp, AlertTriangle, RefreshCw, BarChart3, Target, DollarSign } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, AreaChart, Area } from 'recharts';

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

  const businessMetrics = [
    {
      title: "Total Workforce",
      value: analytics.totalPatients.toLocaleString(),
      icon: Users,
      description: "Employees across organizations",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+5.2%",
      percentage: 100
    },
    {
      title: "Active Organizations",
      value: analytics.totalCompanies.toLocaleString(),
      icon: Building2,
      description: "Companies under management",
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+12.3%",
      percentage: 100
    },
    {
      title: "Processing Efficiency",
      value: `${analytics.completionRate}%`,
      icon: Target,
      description: "Document completion rate",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+2.1%",
      percentage: analytics.completionRate
    },
    {
      title: "Compliance Score",
      value: `${analytics.complianceRate}%`,
      icon: CheckCircle,
      description: "Overall compliance rating",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+8.7%",
      percentage: analytics.complianceRate
    }
  ];

  // Business analytics data for charts
  const performanceData = [
    { name: 'Documents Processed', value: analytics.totalExaminations, color: '#3b82f6' },
    { name: 'Pending Review', value: analytics.pendingDocuments, color: '#f59e0b' },
    { name: 'Completed', value: analytics.totalExaminations - analytics.pendingDocuments, color: '#10b981' },
    { name: 'Expiring Soon', value: analytics.certificatesExpiring, color: '#ef4444' }
  ];

  const complianceData = [
    { name: 'Compliant', value: analytics.totalFit, color: '#10b981' },
    { name: 'Pending', value: analytics.totalPatients - analytics.totalFit, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Mock trend data for business intelligence
  const trendData = [
    { month: 'Jan', revenue: 12000, clients: 15, efficiency: 78 },
    { month: 'Feb', revenue: 14500, clients: 18, efficiency: 82 },
    { month: 'Mar', revenue: 16800, clients: 22, efficiency: 85 },
    { month: 'Apr', revenue: 18200, clients: analytics.totalCompanies, efficiency: analytics.completionRate }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Business Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Live Analytics
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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

      {/* Performance Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Document Processing Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Business Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operational Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Documents</span>
                <span className="font-medium">{analytics.totalExaminations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Processing Rate</span>
                <span className="font-medium">{analytics.completionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Organizations</span>
                <span className="font-medium">{analytics.totalCompanies}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Processing efficiency at {analytics.completionRate}% with {analytics.totalExaminations} documents handled
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  {analytics.complianceRate}% compliance rate across {analytics.totalCompanies} organizations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{analytics.pendingDocuments} documents pending review</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">{analytics.certificatesExpiring} certificates expiring soon</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm">Recent activity: {analytics.recentActivityCount} actions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Intelligence Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.totalPatients}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Records</div>
              <div className="text-xs text-blue-600 mt-1">Managed across platform</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.completionRate}%
              </div>
              <div className="text-sm text-green-700 font-medium">Efficiency Rate</div>
              <div className="text-xs text-green-600 mt-1">Document processing</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.totalCompanies}
              </div>
              <div className="text-sm text-purple-700 font-medium">Organizations</div>
              <div className="text-xs text-purple-600 mt-1">Under management</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;
