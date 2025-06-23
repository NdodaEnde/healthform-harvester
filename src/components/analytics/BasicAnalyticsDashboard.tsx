
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { Users, Building2, FileText, Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import AnalyticsSetupComponent from './AnalyticsSetupComponent';

const BasicAnalyticsDashboard = () => {
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
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Unable to load analytics data. This might be because the analytics infrastructure needs to be set up.
            </p>
            <Button onClick={() => refetch()} className="mb-6">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
        
        {/* Show setup component when there's an error */}
        <AnalyticsSetupComponent />
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
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Companies",
      value: analytics.totalCompanies.toLocaleString(),
      icon: Building2,
      description: "Organizations served",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Examinations",
      value: analytics.totalExaminations.toLocaleString(),
      icon: FileText,
      description: "Medical examinations processed",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Fit Workers",
      value: analytics.totalFit.toLocaleString(),
      icon: Calendar,
      description: "Workers cleared for duty",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  // Fitness status distribution
  const fitnessData = [
    { name: 'Fit', value: analytics.totalFit, color: '#10b981' },
    { name: 'Restricted/Other', value: analytics.totalPatients - analytics.totalFit, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Basic Analytics Overview</h2>
          <p className="text-muted-foreground">Essential health metrics powered by RPC functions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Basic Plan
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {basicMetrics.map((metric) => {
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
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Key Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.complianceRate}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(analytics.complianceRate, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.totalFit} of {analytics.totalPatients} workers fit for duty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.completionRate}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(analytics.completionRate, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Medical examination progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alerts & Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Expiring Soon</span>
                <Badge variant={analytics.certificatesExpiring > 10 ? "destructive" : "secondary"}>
                  {analytics.certificatesExpiring}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Recent Activity</span>
                <Badge variant="outline">
                  {analytics.recentActivityCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Documents</span>
                <Badge variant={analytics.pendingDocuments > 0 ? "secondary" : "outline"}>
                  {analytics.pendingDocuments}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fitness Distribution Chart */}
      {fitnessData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Worker Fitness Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Overview of your workforce health status
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={fitnessData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fitnessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt */}
      <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Want More Insights?</h3>
          <p className="text-muted-foreground mb-4">
            Upgrade to Premium for advanced analytics, trend analysis, and detailed reporting.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicAnalyticsDashboard;
