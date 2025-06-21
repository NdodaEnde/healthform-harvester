
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePackage } from '@/contexts/PackageContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Activity, TrendingUp, Zap, Crown } from 'lucide-react';
import PreviewFeatureGate from '@/components/PreviewFeatureGate';
import FeatureDiscoveryTooltip from '@/components/FeatureDiscoveryTooltip';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { currentTier, colors, language, isPremium, isEnterprise } = usePackage();
  const { toast } = useToast();

  if (authLoading || orgLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Mock data for demonstration
  const basicMetrics = {
    totalPatients: 1247,
    documentsThisMonth: 189,
    complianceRate: 94,
    activeDocuments: 856
  };

  const premiumPreviewContent = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              AI Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12%</div>
            <p className="text-xs text-muted-foreground">
              Health compliance improvement detected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">
              Employees requiring follow-up
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${colors.text}`}>
              {language.dashboardTitle}
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>
          <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
            {currentTier.toUpperCase()} Plan
          </Badge>
        </div>

        {/* Upgrade Prompt for Basic Users */}
        {currentTier === 'basic' && (
          <UpgradePromptCard
            targetTier="premium"
            variant="banner"
            title="Unlock AI-Powered Health Intelligence"
            description="Get predictive insights, advanced analytics, and department-level breakdowns"
          />
        )}

        {/* Basic Metrics - Always Available */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{basicMetrics.totalPatients.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +180 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{basicMetrics.documentsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{basicMetrics.complianceRate}%</div>
              <p className="text-xs text-muted-foreground">
                +2% from last month
              </p>
            </CardContent>
          </Card>

          <FeatureDiscoveryTooltip
            requiredTier="premium"
            title="AI Health Insights"
            description="Get AI-powered health intelligence and predictive analytics"
            benefits={[
              "Predictive health risk analysis",
              "Automated compliance monitoring",
              "Smart health recommendations"
            ]}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  AI Insights
                  <Zap className="h-3 w-3 text-yellow-500" />
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">--</div>
                <p className="text-xs text-muted-foreground">
                  Premium feature
                </p>
              </CardContent>
            </Card>
          </FeatureDiscoveryTooltip>
        </div>

        {/* Advanced Analytics Preview for Basic Users */}
        {!isPremium && (
          <PreviewFeatureGate
            requiredTier="premium"
            title="Advanced Health Analytics"
            description="Unlock AI-powered insights and predictive analytics to transform your health management strategy."
            previewContent={premiumPreviewContent}
            previewTitle="Premium Analytics Dashboard Preview"
          >
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Advanced Analytics</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Health Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>AI-powered health intelligence and trend analysis</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Predictive analytics for health risk management</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </PreviewFeatureGate>
        )}

        {/* Premium Analytics - Available for Premium/Enterprise */}
        {isPremium && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Advanced Analytics</h2>
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                PREMIUM
              </Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    AI Health Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">+12%</div>
                  <p className="text-xs text-muted-foreground">
                    Health compliance improvement detected
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Risk Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">3</div>
                  <p className="text-xs text-muted-foreground">
                    Employees requiring follow-up
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Enterprise Features Preview */}
        {!isEnterprise && (
          <PreviewFeatureGate
            requiredTier="enterprise"
            title="Strategic Command Center"
            description="Access competitive benchmarking, strategic insights, and enterprise-grade analytics."
            previewContent={
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Competitive Benchmarking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">Top 15% Industry Performance</div>
                    <p className="text-sm text-muted-foreground">
                      Your organization ranks above 85% of similar companies
                    </p>
                  </CardContent>
                </Card>
              </div>
            }
            previewTitle="Enterprise Strategic Dashboard"
          >
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Enterprise Command Center</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Strategic Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Enterprise-grade insights and competitive benchmarking</p>
                </CardContent>
              </Card>
            </div>
          </PreviewFeatureGate>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Process new medical documents and certificates
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">View Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access detailed analytics and reporting
              </p>
            </CardContent>
          </Card>
          
          <FeatureDiscoveryTooltip
            requiredTier="premium"
            title="Generate Reports"
            description="Create advanced reports with AI-powered insights"
            benefits={[
              "Automated report generation",
              "Custom branding options",
              "Advanced data visualization"
            ]}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Generate Reports
                  {!isPremium && <Zap className="h-4 w-4 text-yellow-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {isPremium 
                    ? "Create comprehensive health and compliance reports"
                    : "Unlock advanced reporting capabilities"
                  }
                </p>
              </CardContent>
            </Card>
          </FeatureDiscoveryTooltip>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
