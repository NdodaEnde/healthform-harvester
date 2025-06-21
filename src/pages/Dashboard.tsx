
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
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { useToast } from '@/hooks/use-toast';
import { Suspense } from 'react';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { currentTier, colors, language, isPremium, isEnterprise } = usePackage();
  const { toast } = useToast();

  if (authLoading || orgLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <FeatureSkeleton type="card" className="h-20 w-80" />
            <FeatureSkeleton className="h-8 w-24" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <FeatureSkeleton key={i} type="card" className="h-32" />
            ))}
          </div>
          
          <FeatureSkeleton type="chart" className="h-64" />
          
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <FeatureSkeleton key={i} type="card" className="h-24" />
            ))}
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
    <div className="space-y-4 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover-scale">
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
        <Card className="hover-scale">
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
        
        {/* Header with enhanced animations */}
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className={`text-3xl font-bold ${colors.text} transition-colors duration-300`}>
              {language.dashboardTitle}
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Welcome back, {user?.email}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`${colors.background} ${colors.text} transition-all duration-300 hover:scale-105`}
          >
            {currentTier.toUpperCase()} Plan
          </Badge>
        </div>

        {/* Upgrade Prompt with enhanced styling */}
        {currentTier === 'basic' && (
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <UpgradePromptCard
              targetTier="premium"
              variant="banner"
              title="Unlock AI-Powered Health Intelligence"
              description="Get predictive insights, advanced analytics, and department-level breakdowns"
            />
          </div>
        )}

        {/* Basic Metrics with staggered animations */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Total Patients', value: basicMetrics.totalPatients.toLocaleString(), change: '+180 from last month', icon: Users },
            { title: 'Documents Processed', value: basicMetrics.documentsThisMonth, change: 'This month', icon: FileText },
            { title: 'Compliance Rate', value: `${basicMetrics.complianceRate}%`, change: '+2% from last month', icon: Activity }
          ].map((metric, index) => (
            <Card 
              key={metric.title}
              className="animate-fade-in transition-all duration-300 hover:shadow-md hover:scale-105"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          ))}

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
            <Card className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  AI Insights
                  <Zap className="h-3 w-3 text-yellow-500 animate-pulse" />
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

        {/* Advanced Analytics with Suspense boundary */}
        <Suspense fallback={<FeatureSkeleton type="chart" className="h-64" />}>
          {!isPremium && (
            <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
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
            </div>
          )}
        </Suspense>

        {/* Premium Analytics - Available for Premium/Enterprise */}
        {isPremium && (
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Advanced Analytics</h2>
              <Badge variant="secondary" className="text-xs animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                PREMIUM
              </Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover-scale">
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
              
              <Card className="hover-scale">
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

        {/* Enterprise Features with enhanced preview */}
        {!isEnterprise && (
          <div className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <PreviewFeatureGate
              requiredTier="enterprise"
              title="Strategic Command Center"
              description="Access competitive benchmarking, strategic insights, and enterprise-grade analytics."
              previewContent={
                <div className="space-y-4">
                  <Card className="hover-scale">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-600" />
                        Competitive Benchmarking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-semibold text-purple-600">Top 15% Industry Performance</div>
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
          </div>
        )}

        {/* Quick Actions with staggered animations */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Upload Documents', description: 'Process new medical documents and certificates', premium: false },
            { title: 'View Analytics', description: 'Access detailed analytics and reporting', premium: false }
          ].map((action, index) => (
            <Card key={action.title} className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${1.0 + index * 0.1}s` }}>
              <CardHeader>
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          ))}
          
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
            <Card className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: '1.2s' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Generate Reports
                  {!isPremium && <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />}
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
