
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePackage } from '@/contexts/PackageContext';
import { useToast } from '@/hooks/use-toast';
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import AnalyticsFeatureGate from '@/components/analytics/AnalyticsFeatureGate';
import { 
  FileText, Download, Share2, Calendar, BarChart3, 
  TrendingUp, Users, Building2, DollarSign 
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  tier: 'basic' | 'premium' | 'enterprise';
  feature?: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
}

const ReportsGenerator: React.FC = () => {
  const { currentTier, hasFeature, colors, isBasic, isPremium, isEnterprise } = usePackage();
  const { toast } = useToast();
  const { data: analytics, isLoading } = useBasicAnalytics();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'basic_health_overview',
      name: 'Health Overview Report',
      description: `${analytics.totalPatients} patients, ${analytics.complianceRate}% compliance rate`,
      tier: 'basic',
      icon: FileText,
      estimatedTime: '2 min'
    },
    {
      id: 'compliance_detailed',
      name: 'Detailed Compliance Report',
      description: `${analytics.totalFit} fit workers, ${analytics.certificatesExpiring} expiring soon`,
      tier: 'basic',
      icon: BarChart3,
      estimatedTime: '3 min'
    },
    {
      id: 'predictive_analytics',
      name: 'Predictive Analytics Report',
      description: 'AI-powered insights with trend predictions',
      tier: 'premium',
      feature: 'trend_analysis',
      icon: TrendingUp,
      estimatedTime: '5 min'
    },
    {
      id: 'department_breakdown',
      name: 'Department Analysis Report',
      description: `Department-level health analysis across ${analytics.totalCompanies} companies`,
      tier: 'premium',
      feature: 'department_breakdowns',
      icon: Building2,
      estimatedTime: '4 min'
    },
    {
      id: 'risk_assessment',
      name: 'Risk Intelligence Report',
      description: `Advanced risk analysis for ${analytics.totalPatients} workers`,
      tier: 'premium',
      feature: 'risk_intelligence',
      icon: Users,
      estimatedTime: '6 min'
    },
    {
      id: 'competitive_benchmark',
      name: 'Competitive Benchmarking Report',
      description: 'Industry comparison and strategic insights',
      tier: 'enterprise',
      feature: 'competitive_benchmarking',
      icon: TrendingUp,
      estimatedTime: '8 min'
    },
    {
      id: 'roi_analysis',
      name: 'Health Investment ROI Report',
      description: 'Financial impact analysis of health programs',
      tier: 'enterprise',
      feature: 'competitive_benchmarking',
      icon: DollarSign,
      estimatedTime: '7 min'
    }
  ];

  const generateReport = async (templateId: string) => {
    if (!analytics || isLoading) {
      toast({
        title: "Data Not Available",
        description: "Analytics data is still loading. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingReport(templateId);
    
    try {
      // Generate report based on real data
      const template = reportTemplates.find(t => t.id === templateId);
      if (!template) return;

      const reportContent = generateReportContent(template, analytics);
      
      // Create and download the report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated Successfully!",
        description: `Your ${template.name} is ready for download.`,
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateReportContent = (template: ReportTemplate, data: any) => {
    const header = `
${template.name}
Generated: ${format(new Date(), 'PPpp')}
Tier: ${template.tier.toUpperCase()}
========================================

`;

    let content = '';

    switch (template.id) {
      case 'basic_health_overview':
        content = `
HEALTH OVERVIEW SUMMARY

Key Metrics:
- Total Patients: ${data.totalPatients}
- Active Companies: ${data.totalCompanies}
- Total Examinations: ${data.totalExaminations}
- Fit Workers: ${data.totalFit}
- Compliance Rate: ${data.complianceRate}%
- Completion Rate: ${data.completionRate}%

Current Status:
- Certificates Expiring Soon: ${data.certificatesExpiring}
- Pending Documents: ${data.pendingDocuments}
- Recent Activity (7 days): ${data.recentActivityCount}

This report provides a comprehensive overview of your organization's health management program.
`;
        break;

      case 'compliance_detailed':
        content = `
DETAILED COMPLIANCE ANALYSIS

Compliance Metrics:
- Overall Compliance Rate: ${data.complianceRate}%
- Compliant Workers: ${data.totalFit} / ${data.totalPatients}
- Non-compliant Workers: ${data.totalPatients - data.totalFit}

Expiration Tracking:
- Certificates Expiring Soon: ${data.certificatesExpiring}
- Action Required: Review and schedule renewals

Document Processing:
- Pending Documents: ${data.pendingDocuments}
- Processing Required: ${data.pendingDocuments > 0 ? 'Yes' : 'No'}

Recent Activity:
- Actions in Last 7 Days: ${data.recentActivityCount}
- Activity Level: ${data.recentActivityCount > 10 ? 'High' : data.recentActivityCount > 5 ? 'Medium' : 'Low'}

This detailed compliance report helps identify areas requiring immediate attention.
`;
        break;

      default:
        content = `
REPORT DATA

This ${template.tier} tier report would include:
${template.description}

Current data snapshot:
- Total Patients: ${data.totalPatients}
- Compliance Rate: ${data.complianceRate}%
- Active Companies: ${data.totalCompanies}
- Total Examinations: ${data.totalExaminations}

Premium and Enterprise features provide enhanced analytics and insights.
`;
    }

    return header + content + `

========================================
Report generated by Health Management System
Based on real-time database data
Generated for: ${template.tier.toUpperCase()} tier
`;
  };

  const canAccessTemplate = (template: ReportTemplate) => {
    // Basic templates are always accessible
    if (template.tier === 'basic') return true;
    
    // Check feature access if template has a specific feature requirement
    if (template.feature) {
      return hasFeature(template.feature as any);
    }
    
    // Check tier access for premium and enterprise templates
    if (template.tier === 'premium') {
      return isPremium || isEnterprise;
    }
    
    if (template.tier === 'enterprise') {
      return isEnterprise;
    }
    
    return false;
  };

  const renderReportTemplate = (template: ReportTemplate) => {
    const IconComponent = template.icon;
    const hasAccess = canAccessTemplate(template);

    if (!hasAccess) {
      return (
        <AnalyticsFeatureGate
          key={template.id}
          feature={template.feature as any}
          requiredTier={template.tier as any}
          title={`${template.name} - ${template.tier.toUpperCase()} Required`}
          description={`This advanced report requires ${template.tier} features to generate.`}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  {template.name}
                </CardTitle>
                <Badge variant="outline">
                  {template.tier.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Est. {template.estimatedTime}
              </div>
              <Button className="w-full">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </AnalyticsFeatureGate>
      );
    }

    return (
      <Card key={template.id} className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {template.name}
            </CardTitle>
            <Badge variant="outline" className={template.tier === 'basic' ? 'bg-green-50 text-green-800' : ''}>
              {template.tier.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading data...' : template.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Est. {template.estimatedTime}
          </div>
          <Button 
            className="w-full"
            onClick={() => generateReport(template.id)}
            disabled={generatingReport === template.id || isLoading}
          >
            {generatingReport === template.id ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Reports Generator
            </h2>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-full">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${colors.text} flex items-center gap-2`}>
            <FileText className="h-6 w-6" />
            Reports Generator
          </h2>
          <p className="text-muted-foreground">
            Generate comprehensive reports based on real-time data ({analytics.totalPatients} patients, {analytics.totalCompanies} companies)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
            {reportTemplates.filter(t => canAccessTemplate(t)).length} Available
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Live Data
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map(renderReportTemplate)}
      </div>

      {/* Recent Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Real-Time Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{analytics.totalPatients}</div>
              <div className="text-sm text-muted-foreground">Total Patients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{analytics.complianceRate}%</div>
              <div className="text-sm text-muted-foreground">Compliance Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{analytics.totalExaminations}</div>
              <div className="text-sm text-muted-foreground">Total Examinations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{analytics.pendingDocuments}</div>
              <div className="text-sm text-muted-foreground">Pending Documents</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsGenerator;
