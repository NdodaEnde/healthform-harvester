
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePackage } from '@/contexts/PackageContext';
import DashboardLayout from '@/components/DashboardLayout';
import DocumentUploader from '@/components/DocumentUploader';
import BatchDocumentUploader from '@/components/BatchDocumentUploader';
import PatientList from '@/components/PatientList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Activity, TrendingUp, Clock, CheckCircle, AlertTriangle, Upload, BarChart3, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import PackageBadge from '@/components/PackageBadge';
import EnhancedFeatureGate from '@/components/EnhancedFeatureGate';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { currentTier, hasFeature, colors } = usePackage();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (authLoading || orgLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Basic metrics available to all tiers
  const basicMetrics = [
    {
      title: "Total Active Employees",
      value: "34",
      subtitle: "+180 from last month",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "positive"
    },
    {
      title: "Compliance Rate",
      value: "96%",
      subtitle: "+2% from last month",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "positive"
    },
    {
      title: "Certificates Expiring",
      value: "12",
      subtitle: "Next 30 days",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "warning"
    },
    {
      title: "Tests This Month",
      value: "202",
      subtitle: "+23 from last month",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "positive"
    }
  ];

  // Premium metrics for higher tiers
  const premiumMetrics = [
    {
      title: "Health Intelligence Score",
      value: "87",
      subtitle: "AI-powered insights",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "positive",
      isPremium: true
    },
    {
      title: "Risk Predictions",
      value: "3",
      subtitle: "Potential issues detected",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      change: "warning",
      isPremium: true
    }
  ];

  return (
    <DashboardLayout>
      <div className="mt-4">
        {/* Package badge as positioned overlay - doesn't affect layout */}
        <div className="absolute top-4 right-4 z-10">
          <PackageBadge tier={currentTier} />
        </div>

        {/* Original header structure */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your organization today.
          </p>
        </div>

        {/* Greeting section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Good morning! 👋</CardTitle>
              <CardDescription>
                You have 12 pending documents to review and 3 certificates expiring this week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/documents')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Review Documents
                </Button>
                <Button variant="outline" onClick={() => navigate('/certificates')}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Check Certificates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Basic metrics - always visible for all tiers */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {basicMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={metric.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{metric.value}</div>
                  <p className={`text-xs ${
                    metric.change === 'positive' ? 'text-green-600' :
                    metric.change === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metric.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Premium metrics - conditionally shown */}
        {hasFeature('trend_analysis') && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {premiumMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <Card key={metric.title} className="hover:shadow-md transition-shadow border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      {metric.title}
                      <Zap className="h-3 w-3 text-purple-500" />
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${metric.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1">{metric.value}</div>
                    <p className={`text-xs ${
                      metric.change === 'positive' ? 'text-green-600' :
                      metric.change === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metric.subtitle}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upgrade prompt banner for basic users - additive, not structural */}
        {currentTier === 'basic' && (
          <div className="mb-8">
            <Card className={`border-dashed border-2 ${colors.border} ${colors.background}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Unlock Advanced Analytics
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Get AI-powered insights, risk predictions, and advanced reporting with Premium.
                    </p>
                    <Button className={colors.primary}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                  <div className="text-6xl opacity-20">📊</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main content grid - original structure */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Quick Upload
              </CardTitle>
              <CardDescription>
                Upload individual documents for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader />
            </CardContent>
          </Card>

          {/* Batch Upload */}
          <EnhancedFeatureGate 
            feature="advanced_reporting" 
            fallback={
              <Card className="opacity-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Batch Upload
                    <Badge variant="outline" className="ml-2">Premium</Badge>
                  </CardTitle>
                  <CardDescription>
                    Upload multiple documents at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Upgrade to Premium for batch upload capabilities
                  </p>
                  <Button variant="outline" disabled>
                    Batch Upload (Premium)
                  </Button>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Batch Upload
                </CardTitle>
                <CardDescription>
                  Upload multiple documents at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BatchDocumentUploader />
              </CardContent>
            </Card>
          </EnhancedFeatureGate>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and navigation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/patients')}
              >
                <Users className="w-4 h-4 mr-2" />
                View All Patients
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/documents')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Manage Documents
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/reports')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Patients Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>
                Latest patient records and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientList limit={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
