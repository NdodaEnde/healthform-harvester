
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import ReportsFeatureGate from '@/components/reports/ReportsFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { FileText, Download, Calendar, BarChart3, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const ReportsPage = () => {
  const { currentTier, colors, displayName, hasFeature, isPremium, isEnterprise } = usePackage();

  const generateBasicReport = (type: string) => {
    toast.success(`Generating ${type} report...`);
    setTimeout(() => {
      toast.success(`${type} report ready for download!`);
    }, 1500);
  };

  const basicReports = [
    {
      title: 'Employee Status Report',
      description: 'Current status of all employees and their certifications',
      icon: Users,
      available: true
    },
    {
      title: 'Compliance Summary',
      description: 'Overview of compliance rates and expiring certificates',
      icon: BarChart3,
      available: true
    },
    {
      title: 'Monthly Activity Report',
      description: 'Monthly testing activity and completion rates',
      icon: Calendar,
      available: true
    }
  ];

  const premiumReports = [
    {
      title: 'Executive Dashboard',
      description: 'Comprehensive executive summary with insights and trends',
      icon: BarChart3,
      feature: 'advanced_reporting' as const
    },
    {
      title: 'Department Analytics',
      description: 'Detailed department-level performance analysis',
      icon: Building2,
      feature: 'department_breakdowns' as const
    },
    {
      title: 'Predictive Analytics Report',
      description: 'AI-powered predictions and risk assessments',
      icon: FileText,
      feature: 'trend_analysis' as const
    }
  ];

  const enterpriseReports = [
    {
      title: 'Strategic Intelligence Report',
      description: 'Board-ready strategic insights and competitive analysis',
      icon: BarChart3,
      feature: 'competitive_benchmarking' as const
    },
    {
      title: 'Custom Business KPIs',
      description: 'Tailored reports based on your business metrics',
      icon: FileText,
      feature: 'competitive_benchmarking' as const
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${colors.text}`}>Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and insights for your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${colors.background} ${colors.text}`}>
            {displayName}
          </span>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className={`${colors.background}`}>
          <TabsTrigger value="basic">Available Reports</TabsTrigger>
          <TabsTrigger value="premium">Premium Reports</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {basicReports.map((report) => {
              const IconComponent = report.icon;
              return (
                <Card key={report.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5" />
                      {report.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => generateBasicReport(report.title)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="premium" className="space-y-4">
          {!isPremium && !isEnterprise && (
            <UpgradePromptCard
              targetTier="premium"
              title="Unlock Premium Reports"
              description="Access advanced analytics and custom branded reports"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumReports.map((report) => {
              const IconComponent = report.icon;
              return (
                <ReportsFeatureGate 
                  key={report.title}
                  feature={report.feature}
                  title={`${report.title} - Premium Required`}
                  description="This advanced report requires a Premium subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {report.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                      <Button 
                        className="w-full" 
                        onClick={() => generateBasicReport(report.title)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate Premium Report
                      </Button>
                    </CardContent>
                  </Card>
                </ReportsFeatureGate>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="enterprise" className="space-y-4">
          {!isEnterprise && (
            <UpgradePromptCard
              targetTier="enterprise"
              title="Unlock Enterprise Reports"
              description="Access strategic intelligence and competitive benchmarking"
              variant="banner"
              className="mb-6"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enterpriseReports.map((report) => {
              const IconComponent = report.icon;
              return (
                <ReportsFeatureGate 
                  key={report.title}
                  feature={report.feature}
                  requiredTier="enterprise"
                  title={`${report.title} - Enterprise Required`}
                  description="This strategic report requires an Enterprise subscription"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {report.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                      <Button 
                        className="w-full" 
                        onClick={() => generateBasicReport(report.title)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate Enterprise Report
                      </Button>
                    </CardContent>
                  </Card>
                </ReportsFeatureGate>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
