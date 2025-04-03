
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { 
  Loader2, 
  Download, 
  FileText, 
  CheckCircle, 
  Activity, 
  ClipboardList, 
  HardHat, 
  Eye, 
  Filter,
  Calendar,
  AlertCircle,
  PieChart,
  BarChart
} from "lucide-react";
import { ResponsiveContainer, PieChart as RPieChart, Pie, Cell, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const IntegratedOccupationalHealthPage = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const [generatingReport, setGeneratingReport] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [timeRange, setTimeRange] = React.useState("30d");
  const [activeTestTab, setActiveTestTab] = React.useState("mandatory");
  const [activeMedicalVolumeTab, setActiveMedicalVolumeTab] = React.useState("volume");
  const [activeTimeFrame, setActiveTimeFrame] = React.useState("month");

  // Fetch documents and patients data
  const { data: combinedData, isLoading } = useQuery({
    queryKey: ['integrated-health-data', organizationId],
    queryFn: async () => {
      // Fetch documents
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (docError) throw docError;
      
      // Fetch patients
      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (patientError) throw patientError;
      
      return { documents: documents || [], patients: patients || [] };
    },
    enabled: !!organizationId
  });

  // Process restrictions data
  const restrictionsData = React.useMemo(() => {
    if (!combinedData?.documents) return [];
    
    let heightsCount = 0;
    let dustCount = 0;
    let motorizedCount = 0;
    let hearingCount = 0;
    let confinedCount = 0;
    let chemicalCount = 0;
    let otherCount = 0;
    
    combinedData.documents.forEach(doc => {
      try {
        const restrictions = doc.extracted_data?.structured_data?.restrictions;
        
        if (restrictions) {
          if (restrictions.heights) heightsCount++;
          if (restrictions.dust_exposure) dustCount++;
          if (restrictions.motorized_equipment) motorizedCount++;
          if (restrictions.wear_hearing_protection || restrictions.hearing_protection) hearingCount++;
          if (restrictions.confined_spaces) confinedCount++;
          if (restrictions.chemical_exposure) chemicalCount++;
          // Count any other restrictions
          const otherKeys = Object.keys(restrictions).filter(key => 
            !['heights', 'dust_exposure', 'motorized_equipment', 'wear_hearing_protection', 
              'hearing_protection', 'confined_spaces', 'chemical_exposure'].includes(key));
          if (otherKeys.length > 0) otherCount++;
        }
      } catch (err) {
        // Skip documents with parsing issues
      }
    });
    
    return [
      { name: 'Heights', value: heightsCount, percentage: '28%', color: '#f87171' },
      { name: 'Dust Exposure', value: dustCount, percentage: '22%', color: '#2dd4bf' },
      { name: 'Chemical Exposure', value: chemicalCount, percentage: '17%', color: '#1e293b' },
      { name: 'Confined Spaces', value: confinedCount, percentage: '15%', color: '#eab308' },
      { name: 'Motorized Equipment', value: motorizedCount, percentage: '12%', color: '#f97316' },
      { name: 'Other', value: otherCount, percentage: '6%', color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [combinedData]);

  // Medical test data
  const testTypeData = React.useMemo(() => [
    { name: 'Vision Test', value: 1248, growth: '+5%', color: '#f87171' },
    { name: 'Hearing Test', value: 1156, growth: '+6%', color: '#2dd4bf' },
    { name: 'Lung Function', value: 987, growth: '+7%', color: '#1e293b' },
    { name: 'Blood Pressure', value: 876, growth: '+4%', color: '#eab308' },
    { name: 'BMI Assessment', value: 754, growth: '+3%', color: '#f97316' }
  ], []);

  // Key medical tests with completion rates
  const keyMedicalTests = React.useMemo(() => [
    { 
      name: 'Vision Assessment', 
      description: 'Visual acuity, color vision, depth perception',
      completionRate: 98,
      tests: 1248,
      priority: 'high'
    },
    { 
      name: 'Hearing Test', 
      description: 'Audiometry, speech discrimination',
      completionRate: 95,
      tests: 1156,
      priority: 'high'
    },
    { 
      name: 'Lung Function', 
      description: 'Spirometry, peak flow measurement',
      completionRate: 92,
      tests: 987,
      priority: 'high'
    },
    { 
      name: 'Blood Pressure', 
      description: 'Systolic and diastolic measurements',
      completionRate: 99,
      tests: 876,
      priority: 'high'
    },
    { 
      name: 'Drug Screen', 
      description: 'Substance detection and analysis',
      completionRate: 96,
      tests: 945,
      priority: 'high'
    },
    { 
      name: 'Working at Heights', 
      description: 'Balance, vertigo and spatial awareness',
      completionRate: 94,
      tests: 823,
      priority: 'high'
    },
    { 
      name: 'BMI Assessment', 
      description: 'Height, weight, body mass calculation',
      completionRate: 97,
      tests: 754,
      priority: 'high'
    }
  ], []);

  // Department compliance data
  const departmentComplianceData = React.useMemo(() => [
    { name: 'Production', rate: 94 },
    { name: 'Maintenance', rate: 88 },
    { name: 'Warehouse', rate: 96 },
    { name: 'Administration', rate: 98 },
    { name: 'Logistics', rate: 86 }
  ], []);

  // Certificate status distribution
  const certificateStatusData = React.useMemo(() => [
    { name: 'Fit', value: 158, percentage: '64%', color: '#22c55e' },
    { name: 'Fit with Restriction', value: 52, percentage: '21%', color: '#eab308' },
    { name: 'Fit with Condition', value: 25, percentage: '10%', color: '#f97316' },
    { name: 'Temporary Unfit', value: 7, percentage: '3%', color: '#f59e0b' },
    { name: 'Unfit', value: 3, percentage: '1%', color: '#ef4444' }
  ], []);

  // Common restrictions
  const commonRestrictions = React.useMemo(() => [
    'Heights', 'Dust Exposure', 'Chemical Exposure', 'Confined Spaces', 'Motorized Equipment'
  ], []);

  // Required protections
  const requiredProtections = React.useMemo(() => {
    return {
      vision: { name: 'Wear Spectacles', percentage: '32%' },
      hearing: { name: 'Hearing Protection', percentage: '45%' },
      dust: { name: 'Dust Protection', percentage: '28%' },
      conditions: { name: 'Chronic Conditions', percentage: '18%' }
    };
  }, []);

  // Medical examination summary stats
  const examStats = React.useMemo(() => {
    if (!combinedData?.documents) return {
      totalAssessments: 2854,
      fitForWork: 2345,
      withRestrictions: 412,
      totalMedicalTests: 5021,
      growthAssessments: '+12%',
      percentageFit: '82.2%',
      percentageRestrictions: '14.4%',
      growthTests: '+8.2%'
    };
    
    return {
      totalAssessments: 2854,
      fitForWork: 2345,
      withRestrictions: 412,
      totalMedicalTests: 5021,
      growthAssessments: '+12%',
      percentageFit: '82.2%',
      percentageRestrictions: '14.4%',
      growthTests: '+8.2%'
    };
  }, [combinedData]);

  // Certificate compliance data
  const certificateComplianceData = React.useMemo(() => {
    return {
      overallCompliance: 92,
      completed: 226,
      pending: 12,
      overdue: 7,
      expiringCertificates: 18
    };
  }, []);

  // Compliance insights
  const complianceInsights = React.useMemo(() => [
    { type: 'success', message: 'Monthly compliance target of 90% met.' },
    { type: 'warning', message: 'Maintenance, Logistics departments require attention.' },
    { type: 'info', message: 'Schedule 18 follow-up assessments for expiring certificates.' }
  ], []);

  const COLORS = ['#f87171', '#2dd4bf', '#1e293b', '#eab308', '#f97316', '#ef4444'];

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(false);
      toast({
        title: "Report Generated",
        description: "Occupational health report has been generated successfully.",
      });
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Integrated Occupational Health</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Occupational Health & Medical Examinations</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights on employee health assessments, medical examinations, and certifications
          </p>
        </div>
        
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="flex items-center gap-2"
            variant="outline"
          >
            {generatingReport ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-background border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health-metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="medical-tests">Medical Tests</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key stats cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {examStats.totalAssessments.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {examStats.growthAssessments} from previous period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Fit for Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {examStats.fitForWork.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {examStats.percentageFit} of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  With Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {examStats.withRestrictions.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {examStats.percentageRestrictions} of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Medical Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {examStats.totalMedicalTests.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {examStats.growthTests} from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Certificate of Fitness and Workplace Restrictions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Certificate of Fitness Statistics</CardTitle>
                <div className="flex gap-2 mt-4">
                  <TabsList className="bg-muted">
                    <TabsTrigger value="month" onClick={() => setActiveTimeFrame("month")}>Month</TabsTrigger>
                    <TabsTrigger value="quarter" onClick={() => setActiveTimeFrame("quarter")}>Quarter</TabsTrigger>
                    <TabsTrigger value="year" onClick={() => setActiveTimeFrame("year")}>Year</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Certificate Status Distribution</h3>
                    <p className="text-xs text-muted-foreground mb-4">Total: {certificateStatusData.reduce((sum, item) => sum + item.value, 0)}</p>
                    
                    <div className="space-y-4">
                      {certificateStatusData.map((item, index) => (
                        <div key={index} className="flex flex-col">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm">{item.name}</span>
                            <span className="ml-auto text-sm font-medium">{item.value} ({item.percentage})</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: item.percentage, 
                                backgroundColor: item.color 
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <h3 className="text-sm font-medium mb-2">Completion Rate</h3>
                      <div className="flex items-center">
                        <Progress value={92} className="h-2 flex-1" />
                        <span className="ml-4 text-lg font-bold">92%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">Total Certificates</h3>
                        <p className="text-4xl font-bold">245</p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">Expiring Soon</h3>
                        <p className="text-4xl font-bold">18</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-3">Common Restrictions</h3>
                      <div className="flex flex-wrap gap-2">
                        {commonRestrictions.map((restriction, index) => (
                          <Badge key={index} variant="outline" className="px-3 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Required Protections</h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                            <span>Wear Spectacles:</span>
                            <span className="ml-auto">{requiredProtections.vision.percentage}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                            <span>Hearing Protection:</span>
                            <span className="ml-auto">{requiredProtections.hearing.percentage}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2 opacity-0">.</h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                            <span>Chronic Conditions:</span>
                            <span className="ml-auto">{requiredProtections.conditions.percentage}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                            <span>Dust Protection:</span>
                            <span className="ml-auto">{requiredProtections.dust.percentage}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Workplace Restrictions Analysis</CardTitle>
                    <CardDescription>
                      Distribution of workplace restrictions from health assessments
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="px-2.5 py-1.5 h-8">
                      <PieChart className="h-4 w-4 mr-1" />
                      Pie
                    </Button>
                    <Button variant="outline" size="sm" className="px-2.5 py-1.5 h-8">
                      <BarChart className="h-4 w-4 mr-1" />
                      Bar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie
                        data={restrictionsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={70}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {restrictionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {restrictionsData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm">{item.name}: {item.percentage}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical Test Volume */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Medical Test Volume</CardTitle>
                  <CardDescription>Analysis of test types and volumes</CardDescription>
                </div>
                <Select defaultValue="30d">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TabsList className="bg-muted mt-2 w-full justify-start">
                <TabsTrigger 
                  value="volume"
                  onClick={() => setActiveMedicalVolumeTab("volume")}
                  className={activeMedicalVolumeTab === "volume" ? "bg-background" : ""}
                >
                  Test Volume
                </TabsTrigger>
                <TabsTrigger 
                  value="distribution"
                  onClick={() => setActiveMedicalVolumeTab("distribution")}
                  className={activeMedicalVolumeTab === "distribution" ? "bg-background" : ""}
                >
                  Distribution
                </TabsTrigger>
                <TabsTrigger 
                  value="trends"
                  onClick={() => setActiveMedicalVolumeTab("trends")}
                  className={activeMedicalVolumeTab === "trends" ? "bg-background" : ""}
                >
                  Trends
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="col-span-5">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RBarChart data={testTypeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {testTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </RBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="grid grid-cols-1 gap-4">
                    {testTypeData.slice(0, 3).map((test, index) => (
                      <Card key={index} className="shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="text-sm font-semibold">{test.name}</h3>
                              <div className="flex items-center mt-1">
                                <p className="text-lg font-bold">{test.value}</p>
                                <span className="text-xs text-emerald-600 ml-2">{test.growth} from last month</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Medical Tests */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Key Medical Tests</CardTitle>
                  <CardDescription>Completion rates for mandatory tests</CardDescription>
                </div>
              </div>
              <TabsList className="bg-muted mt-2">
                <TabsTrigger 
                  value="mandatory" 
                  onClick={() => setActiveTestTab("mandatory")}
                  className={activeTestTab === "mandatory" ? "bg-background" : ""}
                >
                  Mandatory Tests
                </TabsTrigger>
                <TabsTrigger 
                  value="specialized"
                  onClick={() => setActiveTestTab("specialized")}
                  className={activeTestTab === "specialized" ? "bg-background" : ""}
                >
                  Specialized Tests
                </TabsTrigger>
                <TabsTrigger 
                  value="followup"
                  onClick={() => setActiveTestTab("followup")}
                  className={activeTestTab === "followup" ? "bg-background" : ""}
                >
                  Follow-up Tests
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {keyMedicalTests.map((test, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-base font-semibold">{test.name}</h3>
                          {test.priority === 'high' && (
                            <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{test.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-medium">{test.tests.toLocaleString()} tests</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-medium min-w-16">Completion Rate</p>
                      <div className="flex-1 relative">
                        <Progress value={test.completionRate} className="h-2" />
                      </div>
                      <span className="text-sm font-medium">{test.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certificate Compliance */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Certificate Compliance</CardTitle>
                  <CardDescription>Employee health assessment compliance tracking</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="px-3 h-8">Month</Button>
                  <Button variant="outline" size="sm" className="px-3 h-8">Quarter</Button>
                  <Button variant="outline" size="sm" className="px-3 h-8">Year</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-2">Overall Compliance</h3>
                    <p className="text-5xl font-bold">{certificateComplianceData.overallCompliance}%</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="shadow-sm">
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold">{certificateComplianceData.completed}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                      <CardContent className="p-4 text-center">
                        <div className="h-5 w-5 mx-auto mb-1 text-amber-500">📋</div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold">{certificateComplianceData.pending}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                      <CardContent className="p-4 text-center">
                        <div className="h-5 w-5 mx-auto mb-1 text-red-500">❌</div>
                        <p className="text-sm text-muted-foreground">Overdue</p>
                        <p className="text-2xl font-bold">{certificateComplianceData.overdue}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-amber-500" />
                      <h3 className="text-base font-medium">Certificates Expiring Soon</h3>
                      <span className="ml-auto text-lg font-bold">{certificateComplianceData.expiringCertificates}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                      {certificateComplianceData.expiringCertificates} certificates will expire in the next 30 days. 
                      Schedule follow-up assessments to maintain compliance.
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-3">
                  <h3 className="text-base font-medium mb-4">Compliance by Department</h3>
                  <div className="space-y-4">
                    {departmentComplianceData.map((dept, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{dept.name}</span>
                          <span className="text-sm font-medium">{dept.rate}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="bg-blue-900 h-2.5 rounded-full" 
                            style={{ width: `${dept.rate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <h3 className="text-base font-medium mb-4">Compliance Insights</h3>
                  <div className="space-y-4">
                    {complianceInsights.map((insight, index) => {
                      let icon = null;
                      let textColor = '';
                      if (insight.type === 'success') {
                        icon = <CheckCircle className="h-5 w-5 text-emerald-500" />;
                        textColor = 'text-emerald-700';
                      } else if (insight.type === 'warning') {
                        icon = <AlertCircle className="h-5 w-5 text-amber-500" />;
                        textColor = 'text-amber-700';
                      } else {
                        icon = <Calendar className="h-5 w-5 text-blue-500" />;
                        textColor = 'text-blue-700';
                      }
                      
                      return (
                        <div key={index} className="flex items-start gap-3">
                          {icon}
                          <p className={`text-sm ${textColor}`}>{insight.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health-metrics">
          <Card className="p-6">
            <CardTitle className="mb-6">Health Metrics Content</CardTitle>
            <p>This tab will show detailed health metrics.</p>
          </Card>
        </TabsContent>

        <TabsContent value="medical-tests">
          <Card className="p-6">
            <CardTitle className="mb-6">Medical Tests Content</CardTitle>
            <p>This tab will show detailed medical tests information.</p>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card className="p-6">
            <CardTitle className="mb-6">Compliance Content</CardTitle>
            <p>This tab will show detailed compliance information.</p>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-6">
            <CardTitle className="mb-6">Reports Content</CardTitle>
            <p>This tab will allow generating various reports.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
