
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { Download, FileText, Calendar, Users, Building2, Zap, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import AnalyticsExportButton from '@/components/analytics/AnalyticsExportButton';
import { format } from 'date-fns';

const BasicReports = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const { data: analytics, isLoading } = useBasicAnalytics();

  const basicReports = [
    {
      id: 'patient-summary',
      name: 'Patient Summary Report',
      description: `Overview of ${analytics.totalPatients || 0} patients across ${analytics.totalCompanies || 0} companies`,
      icon: Users,
      available: true
    },
    {
      id: 'company-overview',
      name: 'Company Overview Report',
      description: `Health summary for ${analytics.totalCompanies || 0} organizations with workforce analysis`,
      icon: Building2,
      available: true
    },
    {
      id: 'fitness-status',
      name: 'Fitness Status Report',
      description: `Current fitness declarations - ${analytics.totalFit || 0} fit workers (${analytics.complianceRate || 0}% compliance)`,
      icon: FileText,
      available: true
    },
    {
      id: 'monthly-summary',
      name: 'Monthly Summary Report',
      description: `Comprehensive monthly metrics with ${analytics.totalExaminations || 0} examinations completed`,
      icon: Calendar,
      available: true
    },
    {
      id: 'compliance-alerts',
      name: 'Compliance Alerts Report',
      description: `${analytics.certificatesExpiring || 0} certificates expiring soon requiring attention`,
      icon: AlertTriangle,
      available: true
    },
    {
      id: 'turnaround-times',
      name: 'Processing Times Report',
      description: `${analytics.completionRate || 0}% completion rate with ${analytics.pendingDocuments || 0} pending documents`,
      icon: Clock,
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
    if (!analytics) {
      toast.error('Analytics data not available. Please try again.');
      return;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const reportData = {
      'patient-summary': {
        title: 'Patient Summary Report',
        data: {
          totalPatients: analytics.totalPatients,
          totalCompanies: analytics.totalCompanies,
          totalFit: analytics.totalFit,
          complianceRate: `${analytics.complianceRate}%`,
          totalExaminations: analytics.totalExaminations,
          generatedAt: new Date().toISOString()
        }
      },
      'company-overview': {
        title: 'Company Overview Report',
        data: {
          totalCompanies: analytics.totalCompanies,
          totalPatients: analytics.totalPatients,
          totalExaminations: analytics.totalExaminations,
          completionRate: `${analytics.completionRate}%`,
          complianceRate: `${analytics.complianceRate}%`,
          recentActivity: analytics.recentActivityCount,
          generatedAt: new Date().toISOString()
        }
      },
      'fitness-status': {
        title: 'Fitness Status Report',
        data: {
          totalFit: analytics.totalFit,
          totalPatients: analytics.totalPatients,
          fitPercentage: analytics.totalPatients ? 
            ((analytics.totalFit / analytics.totalPatients) * 100).toFixed(1) : '0',
          totalExaminations: analytics.totalExaminations,
          complianceRate: `${analytics.complianceRate}%`,
          generatedAt: new Date().toISOString()
        }
      },
      'monthly-summary': {
        title: `Monthly Summary Report - ${currentMonth}`,
        data: {
          reportMonth: currentMonth,
          totalPatients: analytics.totalPatients,
          totalExaminations: analytics.totalExaminations,
          completionRate: `${analytics.completionRate}%`,
          totalFit: analytics.totalFit,
          complianceRate: `${analytics.complianceRate}%`,
          certificatesExpiring: analytics.certificatesExpiring,
          pendingDocuments: analytics.pendingDocuments,
          recentActivity: analytics.recentActivityCount,
          generatedAt: new Date().toISOString()
        }
      },
      'compliance-alerts': {
        title: 'Compliance Alerts Report',
        data: {
          totalPatients: analytics.totalPatients,
          complianceRate: `${analytics.complianceRate}%`,
          totalFit: analytics.totalFit,
          certificatesExpiring: analytics.certificatesExpiring,
          pendingDocuments: analytics.pendingDocuments,
          urgentAction: analytics.certificatesExpiring > 0 ? 
            `Review ${analytics.certificatesExpiring} certificates expiring in next 30 days` : 
            'No immediate certificate renewals required',
          recommendation: analytics.certificatesExpiring > 0 ? 
            'Schedule renewal examinations for expiring certificates' : 
            'Continue monitoring certificate expiration dates',
          generatedAt: new Date().toISOString()
        }
      },
      'turnaround-times': {
        title: 'Processing Times Report',
        data: {
          totalExaminations: analytics.totalExaminations,
          totalPatients: analytics.totalPatients,
          completionRate: `${analytics.completionRate}%`,
          pendingDocuments: analytics.pendingDocuments,
          recentActivity: analytics.recentActivityCount,
          processingEfficiency: analytics.pendingDocuments === 0 ? 'Excellent' : 
            analytics.pendingDocuments < 5 ? 'Good' : 'Needs Attention',
          generatedAt: new Date().toISOString()
        }
      }
    };

    const report = reportData[reportId as keyof typeof reportData];
    if (report) {
      // Create a comprehensive text report
      const reportContent = `
${report.title}
Generated: ${format(new Date(report.data.generatedAt), 'PPpp')}
========================================

${Object.entries(report.data)
  .filter(([key]) => key !== 'generatedAt')
  .map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `${label}: ${value}`;
  })
  .join('\n')}

========================================
SUMMARY INSIGHTS

${reportId === 'patient-summary' ? `
This organization manages ${analytics.totalPatients} patients across ${analytics.totalCompanies} companies.
Current compliance rate of ${analytics.complianceRate}% indicates ${analytics.complianceRate >= 85 ? 'strong' : 'moderate'} health management performance.
${analytics.totalFit} workers are currently fit for duty.
` : ''}

${reportId === 'compliance-alerts' ? `
COMPLIANCE STATUS: ${analytics.complianceRate >= 90 ? 'EXCELLENT' : analytics.complianceRate >= 75 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
IMMEDIATE ACTIONS REQUIRED: ${analytics.certificatesExpiring + analytics.pendingDocuments}
PRIORITY: ${analytics.certificatesExpiring > 10 || analytics.pendingDocuments > 5 ? 'HIGH' : 'NORMAL'}
` : ''}

${reportId === 'fitness-status' ? `
FITNESS RATE: ${((analytics.totalFit / analytics.totalPatients) * 100).toFixed(1)}%
WORKFORCE READINESS: ${analytics.totalFit >= analytics.totalPatients * 0.9 ? 'EXCELLENT' : 'GOOD'}
EXAMINATION COVERAGE: ${analytics.completionRate}%
` : ''}

========================================
Report generated by Health Management System
Based on real-time database analytics
Basic Plan - For advanced analytics, upgrade to Premium
      `.trim();

      // Create and download the report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${report.title} generated successfully with live data!`);
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
          <h3 className="text-lg font-semibold">Essential Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate comprehensive reports based on real-time data from {analytics.totalPatients} patients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-gray-50">
            Basic Plan
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Live Data
          </Badge>
          <AnalyticsExportButton
            data={{ analytics }}
            title="Basic Health Report"
            variant="outline"
            size="sm"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{analytics.totalPatients}</div>
              <div className="text-xs text-muted-foreground">Total Patients</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{analytics.complianceRate}%</div>
              <div className="text-xs text-muted-foreground">Compliance Rate</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">{analytics.totalExaminations}</div>
              <div className="text-xs text-muted-foreground">Examinations</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{analytics.certificatesExpiring}</div>
              <div className="text-xs text-muted-foreground">Expiring Soon</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              disabled={!selectedReport || !analytics}
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
                  <Badge variant="secondary">Live Data</Badge>
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
                  disabled={!analytics}
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
