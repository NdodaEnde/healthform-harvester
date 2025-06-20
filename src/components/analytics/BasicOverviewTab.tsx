
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Users, Building2, FileText, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import BasicAnalyticsDashboard from './BasicAnalyticsDashboard';

const BasicOverviewTab = () => {
  const { executiveSummary, isLoading } = useEnhancedAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      title: "Active Patients",
      value: executiveSummary?.total_patients || 0,
      icon: Users,
      trend: "+12% this month",
      color: "text-blue-600"
    },
    {
      title: "Health Checks",
      value: executiveSummary?.total_examinations || 0,
      icon: FileText,
      trend: "Processing smoothly",
      color: "text-green-600"
    },
    {
      title: "Compliance Rate",
      value: `${executiveSummary?.overall_completion_rate?.toFixed(1) || 0}%`,
      icon: CheckCircle,
      trend: "Within target",
      color: "text-emerald-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Your Health Analytics
              </h2>
              <p className="text-gray-600 mb-4">
                Get essential insights into your workforce health and compliance status.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  Basic Plan
                </Badge>
                <span className="text-sm text-gray-500">
                  Essential features for health management
                </span>
              </div>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard */}
      <BasicAnalyticsDashboard />

      {/* Getting Started Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Getting Started Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">📋 Upload Documents</h4>
              <p className="text-sm text-muted-foreground">
                Start by uploading medical certificates to populate your analytics dashboard.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">👥 Manage Patients</h4>
              <p className="text-sm text-muted-foreground">
                Add patient information to track health compliance across your organization.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">📊 Monitor Status</h4>
              <p className="text-sm text-muted-foreground">
                Keep track of fitness declarations and certificate expiration dates.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">📈 Generate Reports</h4>
              <p className="text-sm text-muted-foreground">
                Create basic reports to share health compliance status with stakeholders.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison */}
      <Card className="border-dashed border-2 border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle>Unlock More with Premium</CardTitle>
          <p className="text-sm text-muted-foreground">
            See what additional features you could access with an upgrade
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-3">✅ Current Basic Features</h4>
              <ul className="space-y-2 text-sm">
                <li>• Patient status overview</li>
                <li>• Basic compliance tracking</li>
                <li>• Simple reporting</li>
                <li>• Certificate alerts</li>
                <li>• Basic charts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-3">🚀 Premium Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Advanced trend analysis</li>
                <li>• Risk intelligence</li>
                <li>• Department breakdowns</li>
                <li>• Custom branding</li>
                <li>• Automated scheduling</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Upgrade to Premium - $299/month
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicOverviewTab;
