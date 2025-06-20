
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Layout, 
  Settings, 
  Clock,
  Mail,
  Users,
  Building2,
  TrendingUp,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Send
} from 'lucide-react';

interface ReportConfig {
  name: string;
  description: string;
  template: string;
  format: string;
  sections: string[];
  filters: {
    dateRange: { start: string; end: string };
    companies: string[];
    testTypes: string[];
    fitnessStatus: string[];
  };
  schedule?: {
    frequency: string;
    time: string;
    recipients: string[];
  };
}

const AdvancedReportGenerator = () => {
  const { testResultsSummary, companyBenchmarks, riskAssessment, isLoading } = useEnhancedAnalytics();
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    template: 'executive',
    format: 'pdf',
    sections: ['overview', 'statistics', 'charts'],
    filters: {
      dateRange: { start: '', end: '' },
      companies: [],
      testTypes: [],
      fitnessStatus: []
    }
  });

  const [savedReports, setSavedReports] = useState([
    {
      id: '1',
      name: 'Monthly Executive Summary',
      description: 'Comprehensive monthly health overview',
      template: 'executive',
      lastGenerated: '2024-06-15',
      schedule: 'Monthly',
      status: 'active'
    },
    {
      id: '2',
      name: 'Compliance Report',
      description: 'Certificate compliance and expiration tracking',
      template: 'compliance',
      lastGenerated: '2024-06-10',
      schedule: 'Weekly',
      status: 'active'
    }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  const reportTemplates = [
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for management',
      icon: TrendingUp,
      sections: ['overview', 'statistics', 'trends', 'recommendations']
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Certificate compliance and expiration tracking',
      icon: FileText,
      sections: ['compliance', 'expirations', 'statistics']
    },
    {
      id: 'risk-analysis',
      name: 'Risk Analysis',
      description: 'Detailed risk assessment and recommendations',
      icon: BarChart3,
      sections: ['risk-matrix', 'trends', 'recommendations']
    },
    {
      id: 'company-benchmark',
      name: 'Company Benchmarking',
      description: 'Performance comparison across companies',
      icon: Building2,
      sections: ['benchmarks', 'comparisons', 'insights']
    },
    {
      id: 'medical-test-analysis',
      name: 'Medical Test Analysis',
      description: 'Detailed test results and patterns',
      icon: PieChart,
      sections: ['test-results', 'patterns', 'statistics']
    }
  ];

  const reportFormats = [
    { id: 'pdf', name: 'PDF Document', icon: FileText },
    { id: 'excel', name: 'Excel Spreadsheet', icon: FileSpreadsheet },
    { id: 'csv', name: 'CSV Data', icon: Download },
    { id: 'html', name: 'Web Report', icon: Layout }
  ];

  const availableSections = [
    { id: 'overview', name: 'Executive Overview', description: 'High-level summary and key metrics' },
    { id: 'statistics', name: 'Statistical Analysis', description: 'Detailed statistics and trends' },
    { id: 'charts', name: 'Visual Charts', description: 'Graphs and visualizations' },
    { id: 'compliance', name: 'Compliance Status', description: 'Certificate compliance tracking' },
    { id: 'risk-matrix', name: 'Risk Assessment', description: 'Risk analysis and recommendations' },
    { id: 'benchmarks', name: 'Company Benchmarks', description: 'Performance comparisons' },
    { id: 'test-results', name: 'Test Results', description: 'Detailed test result analysis' },
    { id: 'trends', name: 'Trend Analysis', description: 'Historical trends and patterns' },
    { id: 'recommendations', name: 'Recommendations', description: 'Action items and suggestions' },
    { id: 'appendix', name: 'Data Appendix', description: 'Raw data and detailed tables' }
  ];

  const uniqueCompanies = useMemo(() => 
    [...new Set(companyBenchmarks?.map(item => item.company_name).filter(Boolean))],
    [companyBenchmarks]
  );

  const uniqueTestTypes = useMemo(() => 
    [...new Set(testResultsSummary?.map(item => item.test_type).filter(Boolean))],
    [testResultsSummary]
  );

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create blob URL for download (mock)
    const reportData = JSON.stringify(reportConfig, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportConfig.name || 'Health Report'}_${new Date().toISOString().split('T')[0]}.${reportConfig.format}`;
    a.click();
    
    window.URL.revokeObjectURL(url);
    setIsGenerating(false);
  };

  const handleSaveReport = () => {
    const newReport = {
      id: Date.now().toString(),
      name: reportConfig.name,
      description: reportConfig.description,
      template: reportConfig.template,
      lastGenerated: new Date().toISOString().split('T')[0],
      schedule: showScheduler ? reportConfig.schedule?.frequency || 'None' : 'None',
      status: 'active'
    };
    
    setSavedReports(prev => [...prev, newReport]);
  };

  const handleDeleteReport = (reportId: string) => {
    setSavedReports(prev => prev.filter(report => report.id !== reportId));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Report Generator</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowScheduler(!showScheduler)}>
            <Clock className="h-4 w-4 mr-2" />
            {showScheduler ? 'Hide' : 'Show'} Scheduler
          </Button>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Report</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    placeholder="Describe the purpose of this report"
                    value={reportConfig.description}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Report Template</Label>
                  <Select 
                    value={reportConfig.template} 
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, template: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center">
                            <template.icon className="h-4 w-4 mr-2" />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select 
                    value={reportConfig.format} 
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportFormats.map(format => (
                        <SelectItem key={format.id} value={format.id}>
                          <div className="flex items-center">
                            <format.icon className="h-4 w-4 mr-2" />
                            {format.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Report Sections</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {availableSections.map(section => (
                      <div key={section.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={section.id}
                          checked={reportConfig.sections.includes(section.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReportConfig(prev => ({
                                ...prev,
                                sections: [...prev.sections, section.id]
                              }));
                            } else {
                              setReportConfig(prev => ({
                                ...prev,
                                sections: prev.sections.filter(s => s !== section.id)
                              }));
                            }
                          }}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label htmlFor={section.id} className="text-sm font-medium leading-none">
                            {section.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Data Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={reportConfig.filters.dateRange.start}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          dateRange: { ...prev.filters.dateRange, start: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={reportConfig.filters.dateRange.end}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          dateRange: { ...prev.filters.dateRange, end: e.target.value }
                        }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Companies</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uniqueCompanies.slice(0, 10).map(company => (
                      <div key={company} className="flex items-center space-x-2">
                        <Checkbox
                          id={`company-${company}`}
                          checked={reportConfig.filters.companies.includes(company)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  companies: [...prev.filters.companies, company]
                                }
                              }));
                            } else {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  companies: prev.filters.companies.filter(c => c !== company)
                                }
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`company-${company}`} className="text-sm">
                          {company}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Test Types</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uniqueTestTypes.slice(0, 8).map(testType => (
                      <div key={testType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`test-${testType}`}
                          checked={reportConfig.filters.testTypes.includes(testType)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  testTypes: [...prev.filters.testTypes, testType]
                                }
                              }));
                            } else {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  testTypes: prev.filters.testTypes.filter(t => t !== testType)
                                }
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`test-${testType}`} className="text-sm">
                          {testType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Configuration */}
          {showScheduler && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={reportConfig.schedule?.frequency || ''}
                      onValueChange={(value) => setReportConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, frequency: value, time: '', recipients: [] }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={reportConfig.schedule?.time || ''}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, time: e.target.value, frequency: prev.schedule?.frequency || '', recipients: prev.schedule?.recipients || [] }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Input
                      placeholder="email1@company.com, email2@company.com"
                      value={reportConfig.schedule?.recipients?.join(', ') || ''}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        schedule: { 
                          ...prev.schedule, 
                          recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean),
                          frequency: prev.schedule?.frequency || '',
                          time: prev.schedule?.time || ''
                        }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button onClick={handleSaveReport} variant="outline">
                Save Configuration
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating || !reportConfig.name}
                className="min-w-32"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
              {showScheduler && (
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map(template => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <template.icon className="h-5 w-5 mr-2" />
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.sections.map(section => (
                      <Badge key={section} variant="secondary" className="text-xs">
                        {section.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => setReportConfig(prev => ({ 
                      ...prev, 
                      template: template.id,
                      sections: template.sections 
                    }))}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <div className="space-y-3">
            {savedReports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{report.name}</h4>
                        <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Template: {report.template}</span>
                        <span>Last Generated: {report.lastGenerated}</span>
                        <span>Schedule: {report.schedule}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Generation History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Report generation history will be displayed here once reports are generated.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedReportGenerator;
