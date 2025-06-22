
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePackage } from '@/contexts/PackageContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, Activity, TrendingUp, Clock, CheckCircle, AlertTriangle, Upload, BarChart3 } from 'lucide-react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { currentTier, colors, isPremium, isEnterprise } = usePackage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    executiveSummary, 
    computedMetrics,
    isLoading: analyticsLoading 
  } = useOptimizedAnalytics({
    enableExecutiveSummary: true,
    enableTestResults: false,
    enableBenchmarks: false,
    enableRiskAssessment: false,
    enableTrends: false,
    enablePatientHistory: false
  });

  if (authLoading || orgLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-8">
            <FeatureSkeleton type="card" className="h-20 w-80" />
            <FeatureSkeleton className="h-8 w-24" />
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <FeatureSkeleton key={i} type="card" className="h-32" />
            ))}
          </div>
          
          <FeatureSkeleton type="card" className="h-32" />
          <FeatureSkeleton type="chart" className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  // Key metrics for Basic users with real data
  const keyMetrics = [
    {
      title: "Total Active Employees",
      value: executiveSummary?.total_patients?.toLocaleString() || '34',
      subtitle: "+180 from last month",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "positive"
    },
    {
      title: "Compliance Rate", 
      value: computedMetrics?.completionRateFormatted || '1000%',
      subtitle: "+2% from last month",
      icon: CheckCircle,
      color: "text-green-600", 
      bgColor: "bg-green-50",
      change: "positive",
      status: "good"
    },
    {
      title: "Certificates Expiring",
      value: "12",
      subtitle: "Next 30 days",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50", 
      change: "warning",
      status: "warning"
    },
    {
      title: "Tests This Month",
      value: executiveSummary?.total_tests_conducted?.toLocaleString() || '202',
      subtitle: "+23 from last month",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "positive"
    },
    {
      title: "Pending Reviews",
      value: "8",
      subtitle: "Awaiting attention", 
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: "warning",
      status: "warning"
    },
    {
      title: "System Health",
      value: "99.2%",
      subtitle: "All systems operational",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "positive",
      status: "good"
    }
  ];

  // Mock chart data for document processing trends
  const chartData = [
    { month: 'Jan', documents: 45 },
    { month: 'Feb', documents: 52 },
    { month: 'Mar', documents: 48 },
    { month: 'Apr', documents: 61 },
    { month: 'May', documents: 55 },
    { month: 'Jun', documents: 67 }
  ];

  // Mock recent documents data
  const recentDocuments = [
    { name: "Medical Certificate", patient: "John Smith", status: "Processed", time: "2 hours ago", statusColor: "bg-green-100 text-green-700" },
    { name: "Fitness Certificate", patient: "Sarah Johnson", status: "Processing", time: "5 hours ago", statusColor: "bg-yellow-100 text-yellow-700" },
    { name: "Health Assessment", patient: "Mike Wilson", status: "Processed", time: "1 day ago", statusColor: "bg-green-100 text-green-700" },
    { name: "Drug Screen", patient: "Lisa Brown", status: "Pending", time: "2 days ago", statusColor: "bg-gray-100 text-gray-700" }
  ];

  // Recent activity data
  const recentActivity = [
    { type: "upload", title: "Document uploaded", time: "2 hours ago", icon: "📄" },
    { type: "complete", title: "Certificate processed", time: "5 hours ago", icon: "✅" },
    { type: "expire", title: "Certificate expires soon", time: "1 day ago", icon: "⚠️" },
    { type: "complete", title: "Compliance check passed", time: "2 days ago", icon: "✅" }
  ];

  return (
  <DashboardLayout>
    <>
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Health Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.email}
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
            BASIC Plan
          </Badge>
        </div>

        {/* Key Metrics Grid - Better responsive layout */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {keyMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card 
                key={metric.title}
                className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-slate-200"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {metric.value}
                  </div>
                  <div className="flex items-center text-sm">
                    {metric.status && (
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        metric.status === 'good' ? 'bg-green-500' : 
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    )}
                    <span className={`${
                      metric.change === 'positive' ? 'text-green-600' :
                      metric.change === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metric.subtitle}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Priority Actions Banner */}
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Priority Actions
                </h3>
                <p className="text-gray-600 text-sm">
                  Key tasks that need your attention this week
                </p>
              </div>
            </div>
            
            <div className="grid gap-3 md:grid-cols-3 mb-5">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-gray-700">Schedule 12 certificate renewals (due in 30 days)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-gray-700">Review 8 pending document approvals</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-700">Generate monthly compliance report</span>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Clock className="w-4 h-4 mr-2" />
                Schedule Renewals
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Review Documents
              </Button>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Document Processing Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Document Processing Trends</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}>
                  View Details →
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="documents" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      fill="rgba(37, 99, 235, 0.1)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Documents Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Documents</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}>
                  View All →
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Document</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Patient</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocuments.map((doc, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 text-sm font-medium text-gray-900">{doc.name}</td>
                          <td className="py-3 text-sm text-gray-600">{doc.patient}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.statusColor}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-600">{doc.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        activity.type === 'upload' ? 'bg-blue-100' :
                        activity.type === 'complete' ? 'bg-green-100' :
                        activity.type === 'expire' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/documents')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button variant="outline" className="w-full justify-center" onClick={() => navigate('/patients')}>
                    <Users className="w-4 h-4 mr-2" />
                    View Employees
                  </Button>
                  <Button variant="outline" className="w-full justify-center" onClick={() => navigate('/reports')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>

                {/* Subtle upgrade hint */}
                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">Need advanced analytics?</p>
                  <Button variant="link" className="p-0 h-auto text-yellow-700 font-medium text-sm">
                    Upgrade to Premium →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>  {/* Use this instead */}
  </DashboardLayout>
  );
};

export default Dashboard;
