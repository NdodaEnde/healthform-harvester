
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  Users, 
  TrendingUp, 
  Target, 
  Zap,
  Clock,
  Mail,
  Settings,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

const PremiumReports = () => {
  const { executiveSummary, companyBenchmarks, riskAssessment, monthlyTrends } = useEnhancedAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedBranding, setSelectedBranding] = useState('standard');

  const generateAdvancedReport = async (reportType: string) => {
    toast.success(`Generating ${reportType} with premium features...`);
    
    // Simulate advanced report generation with premium features
    setTimeout(() => {
      toast.success(`${reportType} generated with custom branding and advanced analytics!`, {
        description: "Report includes predictive insights, risk analysis, and strategic recommendations"
      });
    }, 2000);
  };

  const scheduleReport = (reportType: string) => {
    toast.success(`${reportType} scheduled for automated delivery`, {
      description: "Premium automated reporting is now active"
    });
  };

  const premiumReportTypes = [
    {
      title: "Executive Health Intelligence Report",
      description: "C-suite dashboard with predictive analytics and strategic insights",
      icon: Target,
      color: "text-purple-600",
      features: [
        "Predictive health scoring",
        "Risk forecasting models", 
        "Strategic recommendations",
        "Executive KPI dashboard",
        "ROI analysis"
      ],
      premium: true
    },
    {
      title: "Department Risk Analysis",
      description: "Granular risk assessment with mitigation strategies",
      icon: Building2,
      color: "text-blue-600",
      features: [
        "Department risk heat maps",
        "Compliance gap analysis",
        "Risk mitigation plans",
        "Performance benchmarking",
        "Resource optimization"
      ],
      premium: true
    },
    {
      title: "Predictive Trend Intelligence",
      description: "Machine learning insights and future projections",
      icon: TrendingUp,
      color: "text-green-600",
      features: [
        "Seasonal pattern analysis",
        "Predictive modeling",
        "Benchmark comparisons",
        "Future projections",
        "Market intelligence"
      ],
      premium: true
    },
    {
      title: "Custom Branded Analytics",
      description: "White-labeled reports with your organization's branding",
      icon: Zap,
      color: "text-yellow-600",
      features: [
        "Custom logo integration",
        "Brand color schemes",
        "Professional layouts",
        "White-label options",
        "Corporate styling"
      ],
      premium: true
    }
  ];

  const automatedReports = [
    {
      name: "Weekly Risk Alerts",
      schedule: "Every Monday 8:00 AM",
      recipients: "Safety Team, Management",
      status: "Active",
      lastSent: "2024-12-16"
    },
    {
      name: "Monthly Executive Summary",
      schedule: "1st of every month",
      recipients: "C-Suite, Department Heads",
      status: "Active", 
      lastSent: "2024-12-01"
    },
    {
      name: "Quarterly Compliance Report",
      schedule: "End of quarter",
      recipients: "Compliance Team, Auditors",
      status: "Scheduled",
      lastSent: "2024-09-30"
    }
  ];

  const recentReports = [
    {
      name: "Q4 Executive Health Intelligence",
      type: "Executive Report",
      generated: "2024-12-15",
      status: "Ready",
      downloads: 23,
      premium: true
    },
    {
      name: "Department Risk Analysis - Manufacturing",
      type: "Risk Analysis",
      generated: "2024-12-10", 
      status: "Ready",
      downloads: 15,
      premium: true
    },
    {
      name: "Predictive Trend Intelligence - December",
      type: "Trend Analysis",
      generated: "2024-12-05",
      status: "Ready",
      downloads: 31,
      premium: true
    },
    {
      name: "Custom Branded Monthly Summary",
      type: "Branded Report",
      generated: "2024-12-01",
      status: "Ready",
      downloads: 47,
      premium: true
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
                Advanced reporting with custom branding, predictive insights, automated scheduling, and strategic intelligence.
              </p>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Premium Features
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Automation Active
                </Badge>
                <Badge className="bg-green-100 text-green-800">
                  <Target className="h-3 w-3 mr-1" />
                  AI Insights
                </Badge>
              </div>
            </div>
            <FileText className="h-12 w-12 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="automated">Automated Reports</TabsTrigger>
          <TabsTrigger value="library">Report Library</TabsTrigger>
          <TabsTrigger value="branding">Custom Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Report Generation Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Premium Reports</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create custom reports with advanced analytics, branding, and strategic insights
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                      <SelectItem value="pdf">Premium PDF</SelectItem>
                      <SelectItem value="excel">Interactive Excel</SelectItem>
                      <SelectItem value="powerpoint">Executive PowerPoint</SelectItem>
                      <SelectItem value="dashboard">Live Dashboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Branding</label>
                  <Select value={selectedBranding} onValueChange={setSelectedBranding}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Branding</SelectItem>
                      <SelectItem value="custom">Custom Branding</SelectItem>
                      <SelectItem value="whitelabel">White Label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Premium Report
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
                <Card key={report.title} className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
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
                      <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
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
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => generateAdvancedReport(report.title)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => scheduleReport(report.title)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="automated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Automated Report Scheduling
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Premium automated reporting with intelligent scheduling and stakeholder delivery
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automatedReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.schedule} • Recipients: {report.recipients}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last sent: {report.lastSent}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={report.status === 'Active' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule New Automated Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Premium Report Library</CardTitle>
              <p className="text-sm text-muted-foreground">
                Access your generated premium reports with advanced analytics and insights
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <FileText className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {report.name}
                          {report.premium && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Premium</Badge>
                          )}
                        </div>
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
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Custom Branding & White Label
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize report appearance with your organization's branding
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Branding Options</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Logo Integration</div>
                      <div className="text-xs text-muted-foreground">Add your company logo to all reports</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Color Schemes</div>
                      <div className="text-xs text-muted-foreground">Match your brand colors</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">White Label</div>
                      <div className="text-xs text-muted-foreground">Remove all system branding</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Current Settings</h4>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">Premium Branding Active</div>
                    <div className="text-xs text-yellow-700 mt-1">
                      Custom logo, colors, and white-label options available
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Branding
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PremiumReports;
