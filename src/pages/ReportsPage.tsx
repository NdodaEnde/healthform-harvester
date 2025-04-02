
import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart, Calendar, Download, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/components/ui/use-toast";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const ReportsPage = () => {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch data for reports
  const { data: reportData, isLoading: loadingReportData } = useQuery({
    queryKey: ['report-data', organizationId],
    queryFn: async () => {
      // Get patients data
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, created_at, gender')
        .eq('organization_id', organizationId);
      
      if (patientsError) throw patientsError;
      
      // Get documents data
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('id, created_at, status, document_type')
        .eq('organization_id', organizationId);
      
      if (documentsError) throw documentsError;
      
      // Process data for reports
      const now = new Date();
      const monthsBack = 6; // Show 6 months of data
      
      // Prepare monthly data structures
      const monthlyPatients = Array(monthsBack).fill(0);
      const monthlyDocuments = Array(monthsBack).fill(0);
      const monthlyDocumentsByStatus = Array(monthsBack).fill(0).map(() => ({
        processed: 0,
        processing: 0,
        failed: 0,
        pending: 0
      }));
      
      // Populate monthly patient data
      patients?.forEach(patient => {
        const patientDate = new Date(patient.created_at);
        const monthDiff = (now.getMonth() - patientDate.getMonth()) + 
                          (now.getFullYear() - patientDate.getFullYear()) * 12;
        
        if (monthDiff >= 0 && monthDiff < monthsBack) {
          monthlyPatients[monthsBack - 1 - monthDiff]++;
        }
      });
      
      // Populate monthly document data
      documents?.forEach(doc => {
        const docDate = new Date(doc.created_at);
        const monthDiff = (now.getMonth() - docDate.getMonth()) + 
                         (now.getFullYear() - docDate.getFullYear()) * 12;
        
        if (monthDiff >= 0 && monthDiff < monthsBack) {
          monthlyDocuments[monthsBack - 1 - monthDiff]++;
          
          // Track document status
          if (monthlyDocumentsByStatus[monthsBack - 1 - monthDiff][doc.status]) {
            monthlyDocumentsByStatus[monthsBack - 1 - monthDiff][doc.status]++;
          }
        }
      });
      
      // Create labels for months (e.g., "Jun", "Jul", etc.)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLabels = [];
      
      for (let i = 0; i < monthsBack; i++) {
        const monthIndex = (now.getMonth() - (monthsBack - 1 - i) + 12) % 12;
        monthLabels.push(monthNames[monthIndex]);
      }
      
      // Format data for charts
      const patientChartData = monthLabels.map((month, i) => ({
        name: month,
        patients: monthlyPatients[i]
      }));
      
      const documentChartData = monthLabels.map((month, i) => ({
        name: month,
        documents: monthlyDocuments[i],
        processed: monthlyDocumentsByStatus[i].processed,
        processing: monthlyDocumentsByStatus[i].processing,
        failed: monthlyDocumentsByStatus[i].failed,
        pending: monthlyDocumentsByStatus[i].pending
      }));

      // Summary statistics
      const totalPatients = patients?.length || 0;
      const totalDocuments = documents?.length || 0;
      
      const documentsByStatus = {
        processed: documents?.filter(d => d.status === 'processed').length || 0,
        processing: documents?.filter(d => d.status === 'processing').length || 0,
        failed: documents?.filter(d => d.status === 'failed').length || 0,
        pending: documents?.filter(d => d.status === 'pending').length || 0
      };
      
      const pieChartData = [
        { name: 'Processed', value: documentsByStatus.processed },
        { name: 'Processing', value: documentsByStatus.processing },
        { name: 'Failed', value: documentsByStatus.failed },
        { name: 'Pending', value: documentsByStatus.pending }
      ].filter(item => item.value > 0);
      
      return {
        patientChartData,
        documentChartData,
        totalPatients,
        totalDocuments,
        documentsByStatus,
        pieChartData
      };
    },
    enabled: !!organizationId
  });

  const generateReport = (reportType: string) => {
    setGeneratingReport(reportType);
    
    setTimeout(() => {
      // In a real implementation, this would be creating a PDF or Excel file
      // For now, we'll just simulate the report generation
      setGeneratingReport(null);
      toast({
        title: "Report Generated",
        description: `${reportType} has been generated successfully.`,
      });
    }, 2000);
  };

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Reports</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and view reports on patients and documents
          </p>
        </div>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="patients">Patient Reports</TabsTrigger>
          <TabsTrigger value="documents">Document Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Patient Summary</CardTitle>
              <CardDescription>
                View and generate monthly reports of patient registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReportData ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">{reportData?.totalPatients || 0}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={reportData?.patientChartData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="patients" fill="#8884d8" name="New Patients" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={() => generateReport('Monthly Patient Summary')}
                disabled={generatingReport === 'Monthly Patient Summary' || loadingReportData}
                className="flex items-center gap-2"
              >
                {generatingReport === 'Monthly Patient Summary' ? (
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
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Processing Metrics</CardTitle>
              <CardDescription>
                View and generate reports on document processing metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReportData ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">{reportData?.totalDocuments || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Processed</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">{reportData?.documentsByStatus?.processed || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">{reportData?.documentsByStatus?.failed || 0}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">
                          {(reportData?.documentsByStatus?.pending || 0) + 
                           (reportData?.documentsByStatus?.processing || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={reportData?.documentChartData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="documents" fill="#8884d8" name="Total Documents" />
                          <Bar dataKey="processed" fill="#10b981" name="Processed" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData?.pieChartData || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {reportData?.pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={() => generateReport('Document Processing Metrics')}
                disabled={generatingReport === 'Document Processing Metrics' || loadingReportData}
                className="flex items-center gap-2"
              >
                {generatingReport === 'Document Processing Metrics' ? (
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
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
