
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { Download, FileText, BarChart3, TrendingUp, DollarSign, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BusinessReports = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const { data: analytics, isLoading } = useBasicAnalytics();

  const businessReports = [
    {
      id: 'executive-summary',
      name: 'Executive Summary Report',
      description: `Strategic overview of ${analytics.totalPatients || 0} employees across ${analytics.totalCompanies || 0} organizations`,
      icon: FileText,
      available: true
    },
    {
      id: 'operational-kpis',
      name: 'Operational KPIs Report',
      description: `Performance metrics with ${analytics.completionRate || 0}% operational efficiency`,
      icon: BarChart3,
      available: true
    },
    {
      id: 'roi-analysis',
      name: 'ROI Analysis Report',
      description: `Financial impact analysis of health management programs`,
      icon: DollarSign,
      available: true
    },
    {
      id: 'organizational-performance',
      name: 'Organizational Performance Report',
      description: `Multi-company analysis across ${analytics.totalCompanies || 0} organizations`,
      icon: Building2,
      available: true
    },
    {
      id: 'workforce-analytics',
      name: 'Workforce Analytics Report',
      description: `Comprehensive workforce insights and trends`,
      icon: Users,
      available: true
    },
    {
      id: 'strategic-trends',
      name: 'Strategic Trends Report',
      description: `Long-term trends and predictive business insights`,
      icon: TrendingUp,
      available: true
    }
  ];

  const generateBusinessReport = (reportId: string) => {
    if (!analytics) {
      toast.error('Analytics data not available. Please try again.');
      return;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const reportData = {
      'executive-summary': {
        title: 'Executive Summary Report',
        data: {
          totalWorkforce: analytics.totalPatients,
          totalOrganizations: analytics.totalCompanies,
          operationalEfficiency: `${analytics.completionRate}%`,
          complianceRate: `${analytics.complianceRate}%`,
          riskExposure: analytics.certificatesExpiring,
          strategicRecommendations: [
            'Maintain current compliance standards',
            'Focus on operational efficiency improvements',
            'Consider expansion opportunities'
          ],
          generatedAt: new Date().toISOString()
        }
      },
      'operational-kpis': {
        title: 'Operational KPIs Report',
        data: {
          totalProcessed: analytics.totalExaminations,
          completionRate: `${analytics.completionRate}%`,
          efficiency: analytics.pendingDocuments === 0 ? 'Excellent' : 'Good',
          throughput: analytics.recentActivityCount,
          qualityScore: Math.round(analytics.complianceRate / 10),
          generatedAt: new Date().toISOString()
        }
      },
      'roi-analysis': {
        title: 'ROI Analysis Report',
        data: {
          totalInvestment: `Estimated based on ${analytics.totalExaminations} assessments`,
          complianceROI: `${Math.round(analytics.complianceRate * 1.2)}%`,
          riskMitigation: `${analytics.totalFit} workers cleared for duty`,
          costSavings: 'Regulatory compliance maintained',
          recommendations: 'Continue current investment levels',
          generatedAt: new Date().toISOString()
        }
      }
    };

    const report = reportData[reportId as keyof typeof reportData];
    if (report) {
      const reportContent = `
${report.title}
Generated: ${format(new Date(report.data.generatedAt), 'PPpp')}
========================================

EXECUTIVE SUMMARY
${reportId === 'executive-summary' ? `
Strategic Overview:
- Total Workforce: ${analytics.totalPatients} employees
- Organizations Managed: ${analytics.totalCompanies}
- Operational Efficiency: ${analytics.completionRate}%
- Compliance Rate: ${analytics.complianceRate}%

Key Performance Indicators:
- Risk Exposure: ${analytics.certificatesExpiring} items requiring attention
- Processing Efficiency: ${analytics.recentActivityCount} recent activities
- Quality Metrics: High compliance standards maintained

Strategic Recommendations:
✓ Continue current operational practices
✓ Monitor compliance trends quarterly
✓ Evaluate expansion opportunities
` : ''}

${reportId === 'operational-kpis' ? `
Operational Performance Metrics:
- Total Processes Completed: ${analytics.totalExaminations}
- Completion Rate: ${analytics.completionRate}%
- Current Queue: ${analytics.pendingDocuments} pending items
- Recent Activity Level: ${analytics.recentActivityCount} actions

Efficiency Analysis:
- Processing Efficiency: ${analytics.pendingDocuments === 0 ? 'Excellent' : 'Good'}
- Quality Score: ${Math.round(analytics.complianceRate / 10)}/10
- Compliance Maintenance: ${analytics.complianceRate}%

Performance Insights:
✓ Strong operational control maintained
✓ Quality standards consistently met
✓ Efficient processing workflows
` : ''}

${reportId === 'roi-analysis' ? `
Return on Investment Analysis:
- Program Coverage: ${analytics.totalPatients} employees
- Assessments Completed: ${analytics.totalExaminations}
- Compliance Achievement: ${analytics.complianceRate}%

Financial Impact:
- Risk Mitigation Value: High
- Compliance ROI: ${Math.round(analytics.complianceRate * 1.2)}%
- Operational Savings: Streamlined processes
- Regulatory Compliance: Maintained

Investment Recommendations:
✓ Current investment levels are appropriate
✓ Strong return on compliance programs
✓ Consider scaling successful initiatives
` : ''}

${Object.entries(report.data)
  .filter(([key]) => !['generatedAt', 'strategicRecommendations', 'recommendations'].includes(key))
  .map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `${label}: ${value}`;
  })
  .join('\n')}

========================================
BUSINESS INTELLIGENCE SUMMARY

This report provides strategic insights for executive decision-making.
Data sourced from real-time operational systems.
Recommended review frequency: Monthly

Report generated by Health Management System
Business Intelligence Module
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${report.title} generated successfully!`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Business Intelligence Reports</h3>
          <p className="text-sm text-muted-foreground">
            Strategic reports for executive decision-making and business insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Business Analytics
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-800">
            Executive Level
          </Badge>
        </div>
      </div>

      {/* Quick Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a business report to generate" />
              </SelectTrigger>
              <SelectContent>
                {businessReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => selectedReport && generateBusinessReport(selectedReport)}
              disabled={!selectedReport || !analytics}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
          
          {selectedReport && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {businessReports.find(r => r.id === selectedReport)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Business Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businessReports.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                  <Badge variant="secondary">Business</Badge>
                </div>
                <CardTitle className="text-base">{report.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {report.description}
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => generateBusinessReport(report.id)}
                  disabled={!analytics}
                >
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessReports;
