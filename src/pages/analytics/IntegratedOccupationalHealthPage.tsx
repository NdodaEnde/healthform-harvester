
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

// Import components
import StatsSummaryCards from "./components/StatsSummaryCards";
import FitnessCertificateStats from "./components/FitnessCertificateStats";
import OccupationalRestrictionsChart from "./components/OccupationalRestrictionsChart";
import MedicalExaminationStats from "./components/MedicalExaminationStats";
import TestTypeBreakdownCard from "./components/TestTypeBreakdownCard";
import CertificateComplianceCard from "./components/CertificateComplianceCard";
import HealthMetricsAssessment from "./components/HealthMetricsAssessment";

const IntegratedOccupationalHealthPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  // Fetch documents data
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents-occupational', organizationId, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
  });
  
  // Calculate fitness statuses
  const fitnessStatuses = React.useMemo(() => {
    if (!documentsData) return {
      "Fit": 0,
      "Fit with Restrictions": 0,
      "Temporarily Unfit": 0,
      "Permanently Unfit": 0,
      "Unknown": 0
    };
    
    const statuses = {
      "Fit": 0,
      "Fit with Restrictions": 0,
      "Temporarily Unfit": 0,
      "Permanently Unfit": 0,
      "Unknown": 0
    };
    
    documentsData.forEach(doc => {
      try {
        const extractedData = doc.extracted_data;
        if (!extractedData || typeof extractedData !== 'object') {
          statuses['Unknown']++;
          return;
        }
        
        // Check if extracted_data is an array
        if (Array.isArray(extractedData)) {
          statuses['Unknown']++;
          return;
        }
        
        // Now we know extractedData is an object type
        const structuredData = extractedData.structured_data;
        if (!structuredData || typeof structuredData !== 'object' || Array.isArray(structuredData)) {
          statuses['Unknown']++;
          return;
        }
        
        // Check if certification exists and is an object
        const certification = structuredData.certification;
        if (!certification || typeof certification !== 'object' || Array.isArray(certification)) {
          statuses['Unknown']++;
          return;
        }
        
        if (certification.fit || certification.fit_for_duty) {
          statuses['Fit']++;
        } else if (certification.fit_with_restrictions) {
          statuses['Fit with Restrictions']++;
        } else if (certification.temporarily_unfit) {
          statuses['Temporarily Unfit']++;
        } else if (certification.unfit || certification.permanently_unfit) {
          statuses['Permanently Unfit']++;
        } else {
          statuses['Unknown']++;
        }
      } catch (err) {
        statuses['Unknown']++;
      }
    });
    
    return statuses;
  }, [documentsData]);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-background border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health-metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="medical-tests">Medical Tests</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key stats cards */}
          <StatsSummaryCards 
            totalDocuments={documentsData?.length}
            isLoading={isLoading}
            fitnessStatuses={fitnessStatuses}
          />

          {/* Certificate of Fitness and Workplace Restrictions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FitnessCertificateStats />
            <OccupationalRestrictionsChart />
          </div>

          {/* Medical Test Volume */}
          <MedicalExaminationStats />

          {/* Key Medical Tests */}
          <TestTypeBreakdownCard />

          {/* Certificate Compliance */}
          <CertificateComplianceCard />
        </TabsContent>

        <TabsContent value="health-metrics">
          <HealthMetricsAssessment />
        </TabsContent>

        <TabsContent value="medical-tests">
          <div className="grid gap-6">
            <TestTypeBreakdownCard />
            <MedicalExaminationStats />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <OccupationalRestrictionsChart
                title="Test Results Distribution"
                description="Distribution of test outcomes and findings"
              />
              <FitnessCertificateStats />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid gap-6">
            <CertificateComplianceCard />
            <FitnessCertificateStats />
            <TestTypeBreakdownCard
              title="Compliance Test Breakdown"
              description="Detailed breakdown of compliance-required tests"
            />
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid gap-6">
            <div className="bg-muted/40 border rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium mb-2">Generate Custom Reports</h3>
              <p className="text-muted-foreground mb-6">
                Create customized reports with your selected parameters and data filters.
              </p>
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
                    Generate Custom Report
                  </>
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2">Monthly Test Completion Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Summary of all test completions for the current month
                </p>
                <Button variant="outline" className="w-full">Download</Button>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2">Certificate Compliance Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Overview of certification status and compliance metrics
                </p>
                <Button variant="outline" className="w-full">Download</Button>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2">Department Health Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed breakdown of health findings by department
                </p>
                <Button variant="outline" className="w-full">Download</Button>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2">Expiring Certifications List</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  List of all certifications expiring in the next 90 days
                </p>
                <Button variant="outline" className="w-full">Download</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
