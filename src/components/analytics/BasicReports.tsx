
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Download, FileText, Calendar, Users, Building2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BasicReports = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const { executiveSummary, isLoading } = useEnhancedAnalytics();

  const basicReports = [
    {
      id: 'patient-summary',
      name: 'Patient Summary Report',
      description: 'Basic overview of all patients and their current status',
      icon: Users,
      available: true
    },
    {
      id: 'company-overview',
      name: 'Company Overview Report',
      description: 'Summary of organizations and their workforce health',
      icon: Building2,
      available: true
    },
    {
      id: 'fitness-status',
      name: 'Fitness Status Report',
      description: 'Current fitness declarations across your organization',
      icon: FileText,
      available: true
    }
  ];

  const premiumReports = [
    {
      id: 'trend-analysis',
      name: 'Trend Analysis Report',
      description: 'Advanced trend analysis and predictive insights',
      icon: Zap,
      available: false,
      tier: 'Premium'
    },
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Report',
      description: 'Detailed risk analysis and recommendations',
      icon: Zap,
      available: false,
      tier: 'Premium'
    },
    {
      id: 'compliance-audit',
      name: 'Compliance Audit Report',
      description: 'Comprehensive compliance tracking and alerts',
      icon: Zap,
      available: false,
      tier: 'Premium'
    }
  ];

  const generateBasicReport = (reportId: string) => {
    if (!executiveSummary) {
      toast.error('No data available for report generation');
      return;
    }

    const reportData = {
      'patient-summary': {
        title: 'Patient Summary Report',
        data: {
          totalPatients: executiveSummary.total_patients,
          totalCompanies: executiveSummary.total_companies,
          totalFit: executiveSummary.total_fit,
          generatedAt: new Date().toISOString()
        }
      },
      'company-overview': {
        title: 'Company Overview Report',
        data: {
          totalCompanies: executiveSummary.total_companies,
          totalExaminations: executiveSummary.total_examinations,
          completionRate: executiveSummary.overall_completion_rate,
          generatedAt: new Date().toISOString()
        }
      },
      'fitness-status': {
        title: 'Fitness Status Report',
        data: {
          totalFit: executiveSummary.total_fit,
          totalPatients: executiveSummary.total_patients,
          fitPercentage: executiveSummary.total_patients ? 
            ((executiveSummary.total_fit / executiveSummary.total_patients) * 100).toFixed(1) : 0,
          generatedAt: new Date().toISOString()
        }
      }
    };

    const report = reportData[reportId as keyof typeof reportData];
    if (report) {
      // Create a simple text report
      const reportContent = `
${report.title}
Generated: ${new Date(report.data.generatedAt).toLocaleDateString()}

${Object.entries(report.data)
  .filter(([key]) => key !== 'generatedAt')
  .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
  .join('\n')}
      `.trim();

      // Create and download the report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Report generated successfully!');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-semibold">Basic Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate essential reports for your organization
          </p>
        </div>
        <Badge variant="outline" className="bg-gray-50">
          Basic Plan
        </Badge>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a report to generate" />
              </SelectTrigger>
              <SelectContent>
                {basicReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => selectedReport && generateBasicReport(selectedReport)}
              disabled={!selectedReport || !executiveSummary}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
          
          {selectedReport && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {basicReports.find(r => r.id === selectedReport)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {basicReports.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                  <Badge variant="secondary">Available</Badge>
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
                  onClick={() => generateBasicReport(report.id)}
                  disabled={!executiveSummary}
                >
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Premium Reports Teaser */}
      <Card className="border-dashed border-2 border-yellow-200 bg-yellow-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Premium Reports
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Unlock advanced reporting with Premium subscription
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {premiumReports.map((report) => {
              const IconComponent = report.icon;
              return (
                <div key={report.id} className="p-3 bg-white rounded-lg border opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className="h-5 w-5 text-yellow-600" />
                    <Badge variant="outline" className="text-xs">
                      {report.tier}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{report.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Upgrade for Advanced Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicReports;
