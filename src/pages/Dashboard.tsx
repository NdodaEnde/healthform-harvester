
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Activity
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DocumentProcessingTrends } from "@/components/dashboard/DocumentProcessingTrends";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { FeatureFlagBanner, CompoundDocumentsList } from "@/components/compound-documents";
import CompoundDocumentWidget from "@/components/dashboard/CompoundDocumentWidget";

const Dashboard = () => {
  const { currentOrganization, currentClient, isServiceProvider } = useOrganization();
  const metrics = useDashboardMetrics();

  const getDisplayName = () => {
    if (isServiceProvider()) {
      return currentClient ? currentClient.name : "All Clients";
    }
    return currentOrganization?.name || "Your Organization";
  };

  if (metrics.loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to your dashboard</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Feature Flag Banner for compound documents */}
      <FeatureFlagBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {getDisplayName()} - Overview of your medical documentation system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActiveEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.complianceRate ? `${Math.round(metrics.complianceRate)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current compliance status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.certificatesExpiring || 0}</div>
            <p className="text-xs text-muted-foreground">
              Certificates expiring in 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.testsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tests completed this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compound Documents Feature */}
      <CompoundDocumentsList />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <RecentDocuments />
        </div>

        {/* Quick Actions and Widget */}
        <div className="space-y-6">
          <QuickActions />
          <CompoundDocumentWidget />
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <DocumentProcessingTrends />
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;
