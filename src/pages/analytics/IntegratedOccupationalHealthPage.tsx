
import React from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const IntegratedOccupationalHealthPage = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const [generatingReport, setGeneratingReport] = React.useState(false);

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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrated Occupational Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze occupational health metrics
          </p>
        </div>
        
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
              Generate Report
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {combinedData?.documents?.length ? 
                Math.round((combinedData.documents.filter(d => d.status === 'processed').length / combinedData.documents.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall health assessment compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Medical Restrictions
            </CardTitle>
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
              Active Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {combinedData?.patients?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees under active health monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizational" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizational">Organizational Compliance</TabsTrigger>
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
