
import React from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2, Download, FileText, CheckCircle, Activity, ClipboardList, HardHat, Eye, Filter } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const IntegratedOccupationalHealthPage = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const [generatingReport, setGeneratingReport] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("organizational");
  const [timeRange, setTimeRange] = React.useState("30d");

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

  // Process compliance data
  const complianceData = React.useMemo(() => {
    if (!combinedData) return [];
    
    // Get unique departments/companies
    const companies = new Set();
    combinedData.patients.forEach(patient => {
      if (patient.contact_info?.company) {
        companies.add(patient.contact_info.company);
      }
    });
    
    // Random data for the demo
    return Array.from(companies).map((company, index) => ({
      name: company,
      compliance: Math.floor(Math.random() * 30) + 70 // Random value between 70-100
    })).slice(0, 5); // Limit to 5 companies for visibility
  }, [combinedData]);

  // Process restrictions data
  const restrictionsData = React.useMemo(() => {
    if (!combinedData?.documents) return [];
    
    let heightsCount = 0;
    let dustCount = 0;
    let motorizedCount = 0;
    let hearingCount = 0;
    let confinedCount = 0;
    let chemicalCount = 0;
    let spectaclesCount = 0;
    let totalWithRestrictions = 0;
    
    combinedData.documents.forEach(doc => {
      try {
        const restrictions = doc.extracted_data?.structured_data?.restrictions;
        let hasRestriction = false;
        
        if (restrictions) {
          if (restrictions.heights) {
            heightsCount++;
            hasRestriction = true;
          }
          if (restrictions.dust_exposure) {
            dustCount++;
            hasRestriction = true;
          }
          if (restrictions.motorized_equipment) {
            motorizedCount++;
            hasRestriction = true;
          }
          if (restrictions.wear_hearing_protection || restrictions.hearing_protection) {
            hearingCount++;
            hasRestriction = true;
          }
          if (restrictions.confined_spaces) {
            confinedCount++;
            hasRestriction = true;
          }
          if (restrictions.chemical_exposure) {
            chemicalCount++;
            hasRestriction = true;
          }
          if (restrictions.wear_spectacles) {
            spectaclesCount++;
            hasRestriction = true;
          }
          
          if (hasRestriction) {
            totalWithRestrictions++;
          }
        }
      } catch (err) {
        // Skip documents with parsing issues
      }
    });
    
    return [
      { name: 'Heights', value: heightsCount },
      { name: 'Dust Exposure', value: dustCount },
      { name: 'Motorized Equipment', value: motorizedCount },
      { name: 'Hearing Protection', value: hearingCount },
      { name: 'Confined Spaces', value: confinedCount },
      { name: 'Chemical Exposure', value: chemicalCount },
      { name: 'Wear Spectacles', value: spectaclesCount }
    ].filter(item => item.value > 0);
  }, [combinedData]);

  // Generate monthly compliance trend data (simulated)
  const complianceTrendData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      rate: Math.floor(Math.random() * 15) + 80, // Random 80-95%
      target: 90
    }));
  }, []);

  // Medical examination summary stats
  const examStats = React.useMemo(() => {
    if (!combinedData?.documents) return {
      total: 0,
      complete: 0,
      rate: 0,
      avgPerEmployee: 0
    };
    
    const total = combinedData.documents.length;
    const complete = combinedData.documents.filter(d => d.status === 'processed').length;
    const employeeCount = combinedData.patients.length || 1;
    
    return {
      total: total,
      complete: complete, 
      rate: total ? Math.round((complete / total) * 100) : 0,
      avgPerEmployee: (total / employeeCount).toFixed(1)
    };
  }, [combinedData]);

  // Test type breakdown data
  const testTypeData = React.useMemo(() => [
    { name: 'Vision Tests', value: Math.floor(Math.random() * 250) + 500 },
    { name: 'Hearing Tests', value: Math.floor(Math.random() * 200) + 450 },
    { name: 'Lung Function', value: Math.floor(Math.random() * 150) + 400 },
    { name: 'General Physical', value: Math.floor(Math.random() * 300) + 600 },
    { name: 'Blood Work', value: Math.floor(Math.random() * 200) + 350 }
  ], []);

  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

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
          <h1 className="text-3xl font-bold tracking-tight">Integrated Occupational Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze occupational health metrics
          </p>
        </div>
        
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
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
          >
            {generatingReport ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assessments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tests
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examStats.complete}
            </div>
            <p className="text-xs text-muted-foreground">
              {examStats.rate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Work Restrictions
            </CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restrictionsData.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total workplace restrictions applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Tests Per Employee
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examStats.avgPerEmployee}
            </div>
            <p className="text-xs text-muted-foreground">
              {combinedData?.patients?.length || 0} employees monitored
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizational" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizational">Organizational Compliance</TabsTrigger>
          <TabsTrigger value="testTypes">Test Types</TabsTrigger>
          <TabsTrigger value="restrictions">Workplace Restrictions</TabsTrigger>
          <TabsTrigger value="trends">Trends & Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="organizational" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department/Company Compliance Rate</CardTitle>
              <CardDescription>
                Compliance rates across different departments or companies
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complianceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} label={{ value: 'Compliance Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="compliance" fill="#8884d8" name="Compliance Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testTypes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Test Type Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of test types performed
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={testTypeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Number of Tests" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restrictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workplace Restrictions Distribution</CardTitle>
              <CardDescription>
                Types of workplace restrictions applied
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={restrictionsData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Compliance Trends</CardTitle>
              <CardDescription>
                Health assessment compliance trend over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={complianceTrendData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#8884d8" name="Actual Rate (%)" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="target" stroke="#ff7300" name="Target Rate (%)" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
