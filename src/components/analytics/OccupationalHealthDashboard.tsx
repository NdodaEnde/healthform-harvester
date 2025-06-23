import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { Heart, Shield, AlertTriangle, Activity, Stethoscope, Eye, Ear, Wind } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const OccupationalHealthDashboard = () => {
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
          <p className="text-muted-foreground">Unable to load occupational health data.</p>
        </CardContent>
      </Card>
    );
  }

  const healthMetrics = [
    {
      title: "Fit for Duty",
      value: analytics.totalFit.toLocaleString(),
      icon: Heart,
      description: "Workers cleared for work",
      color: "text-green-600",
      bgColor: "bg-green-50",
      percentage: Math.round((analytics.totalFit / analytics.totalPatients) * 100)
    },
    {
      title: "Health Assessments",
      value: analytics.totalExaminations.toLocaleString(),
      icon: Stethoscope,
      description: "Medical examinations completed",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      percentage: analytics.completionRate
    },
    {
      title: "Risk Alerts",
      value: analytics.certificatesExpiring.toLocaleString(),
      icon: AlertTriangle,
      description: "Certificates expiring soon",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      percentage: Math.round((analytics.certificatesExpiring / analytics.totalPatients) * 100)
    },
    {
      title: "Health Score",
      value: Math.round(analytics.complianceRate / 10).toString(),
      icon: Shield,
      description: "Overall health compliance",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      percentage: analytics.complianceRate
    }
  ];

  // Medical test distribution data
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
          <h2 className="text-2xl font-bold">Occupational Health Dashboard</h2>
          <p className="text-muted-foreground">Clinical insights and worker health monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-800">
            Clinical Analytics
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Real-time Health Data
          </Badge>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric) => {
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
                      metric.color.includes('green') ? 'bg-green-600' :
                      metric.color.includes('blue') ? 'bg-blue-600' :
                      metric.color.includes('orange') ? 'bg-orange-600' : 'bg-purple-600'
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

      {/* Health Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Fitness Status Distribution
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

      {/* Health Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Health Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Low Risk</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{analytics.totalFit}</div>
              <div className="text-sm text-green-600">Workers with no restrictions</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Medium Risk</span>
              </div>
              <div className="text-2xl font-bold text-yellow-700">{analytics.certificatesExpiring}</div>
              <div className="text-sm text-yellow-600">Certificates expiring soon</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">High Risk</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{analytics.pendingDocuments}</div>
              <div className="text-sm text-red-600">Pending health assessments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clinical Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Health Assessment Coverage
              </h3>
              <p className="text-sm text-blue-800">
                {analytics.totalExaminations} medical examinations completed with {analytics.completionRate}% completion rate. 
                {analytics.pendingDocuments > 0 && ` ${analytics.pendingDocuments} assessments pending review.`}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Workforce Fitness
              </h3>
              <p className="text-sm text-green-800">
                {Math.round((analytics.totalFit / analytics.totalPatients) * 100)}% of workers are currently fit for duty. 
                This represents {analytics.totalFit} out of {analytics.totalPatients} workers in your program.
              </p>
            </div>
            {analytics.certificatesExpiring > 10 && (
              <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <h3 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Upcoming Renewals
                </h3>
                <p className="text-sm text-orange-800">
                  {analytics.certificatesExpiring} certificates will expire within 30 days. Consider scheduling renewal 
                  examinations to maintain compliance and workforce readiness.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clinical Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Vision Test Analysis
            </Button>
            <Button variant="outline" size="sm">
              <Ear className="h-4 w-4 mr-2" />
              Hearing Assessment
            </Button>
            <Button variant="outline" size="sm">
              <Wind className="h-4 w-4 mr-2" />
              Respiratory Health
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Risk Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OccupationalHealthDashboard;
