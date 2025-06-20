
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { FileText, Download, Calendar, Building2, Users, TrendingUp, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PremiumReports = () => {
  const { executiveSummary, companyBenchmarks, riskAssessment, monthlyTrends } = useEnhancedAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const generateAdvancedReport = async (reportType: string) => {
    toast.success(`Generating ${reportType} report...`);
    // Here you would implement the actual report generation
    setTimeout(() => {
      toast.success(`${reportType} report generated successfully!`);
    }, 2000);
  };

  const premiumReportTypes = [
    {
      title: "Executive Health Intelligence Report",
      description: "Comprehensive C-suite report with strategic insights and predictions",
      icon: Target,
      color: "text-purple-600",
      features: ["Predictive analytics", "Risk forecasting", "Strategic recommendations", "Executive summary"]
    },
    {
      title: "Department Risk Analysis",
      description: "Detailed breakdown by department with risk mitigation strategies",
      icon: Building2,
      color: "text-blue-600",
      features: ["Department comparisons", "Risk heat maps", "Compliance gaps", "Action plans"]
    },
    {
      title: "Trend Intelligence Dashboard",
      description: "Advanced trend analysis with machine learning insights",
      icon: TrendingUp,
      color: "text-green-600",
      features: ["Seasonal patterns", "Predictive modeling", "Benchmark comparisons", "Future projections"]
    },
    {
      title: "Custom Branded Analytics",
      description: "White-labeled reports with your organization's branding",
      icon: Zap,
      color: "text-yellow-600",
      features: ["Custom branding", "Logo integration", "Color schemes", "Professional layouts"]
    }
  ];

  const recentReports = [
    {
      name: "Q4 Executive Health Intelligence",
      type: "Executive Report",
      generated: "2024-12-15",
      status: "Ready",
      downloads: 23
    },
    {
      name: "Department Risk Analysis - Manufacturing",
      type: "Department Report",
      generated: "2024-12-10",
      status: "Ready",
      downloads: 15
    },
    {
      name: "Monthly Trend Intelligence - December",
      type: "Trend Analysis",
      generated: "2024-12-05",
      status: "Ready",
      downloads: 31
    }
  ];

  return (
    <div className="space-y-6">
      {/* Premium Reports Header */}
      <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Premium Analytics Reports
              </h2>
              <p className="text-gray-600 mb-4">
                Advanced reporting with custom branding, predictive insights, and strategic intelligence.
              </p>
              <Badge className="bg-yellow-100 text-yellow-800">
                <Zap className="h-3 w-3 mr-1" />
                Premium Features
              </Badge>
            </div>
            <FileText className="h-12 w-12 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      {/* Report Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Advanced Reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create custom reports with advanced analytics and branding
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="excel">Excel Dashboard</SelectItem>
                  <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                  <SelectItem value="interactive">Interactive Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                <Download className="h-4 w-4 mr-2" />
                Quick Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {premiumReportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.title} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className={`h-5 w-5 ${report.color}`} />
                      {report.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {report.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Premium Features:</h4>
                    <ul className="text-sm space-y-1">
                      {report.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => generateAdvancedReport(report.title)}
                  >
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Premium Reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            Access your generated advanced reports and analytics
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {report.type} • Generated {report.generated}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {report.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {report.downloads} downloads
                  </span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumReports;
