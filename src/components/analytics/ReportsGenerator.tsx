
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePackage } from '@/contexts/PackageContext';
import { useToast } from '@/hooks/use-toast';
import AnalyticsService, { AnalyticsReport } from '@/services/AnalyticsService';
import AnalyticsFeatureGate from '@/components/analytics/AnalyticsFeatureGate';
import { 
  FileText, Download, Share2, Calendar, BarChart3, 
  TrendingUp, Users, Building2, DollarSign 
} from 'lucide-react';

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
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'basic_health_overview',
      name: 'Health Overview Report',
      description: 'Essential health metrics and compliance summary',
      tier: 'basic',
      icon: FileText,
      estimatedTime: '2 min'
    },
    {
      id: 'compliance_detailed',
      name: 'Detailed Compliance Report',
      description: 'Comprehensive compliance analysis with trends',
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
      description: 'Department-level health and compliance breakdown',
      tier: 'premium',
      feature: 'department_breakdowns',
      icon: Building2,
      estimatedTime: '4 min'
    },
    {
      id: 'risk_assessment',
      name: 'Risk Intelligence Report',
      description: 'Advanced risk analysis with recommendations',
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
    setGeneratingReport(templateId);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const report = AnalyticsService.generateReport(currentTier);
      
      toast({
        title: "Report Generated Successfully!",
        description: `Your ${report.title} is ready for download.`,
        variant: "default"
      });
      
      // In a real implementation, you would download or open the report here
      console.log('Generated report:', report);
      
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

  const canAccessTemplate = (template: ReportTemplate) => {
    if (template.tier === 'basic') return true;
    if (template.feature) return hasFeature(template.feature as any);
    return currentTier === template.tier || 
           (template.tier === 'premium' && isEnterprise) ||
           (template.tier === 'basic' && (isPremium || isEnterprise));
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
          <Button 
            className="w-full"
            onClick={() => generateReport(template.id)}
            disabled={generatingReport === template.id}
          >
            {generatingReport === template.id ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${colors.text} flex items-center gap-2`}>
            <FileText className="h-6 w-6" />
            Reports Generator
          </h2>
          <p className="text-muted-foreground">
            Generate comprehensive reports based on your subscription tier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
            {reportTemplates.filter(t => canAccessTemplate(t)).length} Available
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
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reports generated yet</p>
            <p className="text-sm">Generate your first report to see it here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsGenerator;
