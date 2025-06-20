
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Users, Building2, FileText, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

const BasicAnalyticsDashboard = () => {
  const { executiveSummary, isLoading } = useEnhancedAnalytics();

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

  const basicMetrics = [
    {
      title: "Total Patients",
      value: executiveSummary?.total_patients?.toLocaleString() || '0',
      icon: Users,
      description: "Registered patients in system",
      color: "text-blue-600"
    },
    {
      title: "Active Companies",
      value: executiveSummary?.total_companies?.toLocaleString() || '0',
      icon: Building2,
      description: "Organizations served",
      color: "text-green-600"
    },
    {
      title: "Total Examinations",
      value: executiveSummary?.total_examinations?.toLocaleString() || '0',
      icon: FileText,
      description: "Medical examinations processed",
      color: "text-purple-600"
    },
    {
      title: "Fit Workers",
      value: executiveSummary?.total_fit?.toLocaleString() || '0',
      icon: Calendar,
      description: "Workers cleared for duty",
      color: "text-emerald-600"
    }
  ];

  // Simple fitness status distribution for basic users
  const fitnessData = [
    { name: 'Fit', value: executiveSummary?.total_fit || 0, color: '#10b981' },
    { name: 'Restricted', value: (executiveSummary?.total_patients || 0) - (executiveSummary?.total_fit || 0), color: '#f59e0b' }
  ].filter(item => item.value > 0);

  const completionRate = executiveSummary?.overall_completion_rate || 0;

  return (
    <div className="space-y-6">
      {/* Header with upgrade prompt */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Basic Analytics Overview</h2>
          <p className="text-muted-foreground">Essential health metrics for your organization</p>
        </div>
        <Badge variant="outline" className="bg-gray-50">
          Basic Plan
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {basicMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${metric.color}`} />
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

      {/* Basic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitness Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Fitness Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Overview of your workforce health status
            </p>
          </CardHeader>
          <CardContent>
            {fitnessData.length > 0 ? (
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
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No fitness data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Health Check Completion</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track your medical examination progress
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {completionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Overall completion rate</p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    {executiveSummary?.total_tests_completed || 0}
                  </div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">
                    {(executiveSummary?.total_tests_conducted || 0) - (executiveSummary?.total_tests_completed || 0)}
                  </div>
                  <div className="text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
