import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart, Calendar, Download, Loader2, Search, Filter, Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ReportGeneratorCard from "@/pages/analytics/components/ReportGeneratorCard";

const ReportsPage = () => {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");

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

  // Sample data for saved reports
  const savedReports = [
    {
      id: "r1",
      name: "Monthly Document Processing Summary",
      type: "Document Analytics",
      date: "2023-05-15",
      format: "PDF",
      size: "2.4 MB",
    },
    {
      id: "r2",
      name: "Patient Demographics Analysis",
      type: "Clinical Analytics",
      date: "2023-05-10",
      format: "XLSX",
      size: "4.1 MB",
    },
    {
      id: "r3",
      name: "System Performance Report",
      type: "System Analytics",
      date: "2023-05-05",
      format: "PDF",
      size: "1.8 MB",
    },
    {
      id: "r4",
      name: "Occupational Health Compliance",
      type: "Occupational Health",
      date: "2023-05-01",
      format: "PDF",
      size: "3.2 MB",
    },
    {
      id: "r5",
      name: "Medical Examination Statistics",
      type: "Medical Examinations",
      date: "2023-04-28",
      format: "XLSX",
      size: "5.6 MB",
    },
  ];

  // Sample data for scheduled reports
  const scheduledReports = [
    {
      id: "sr1",
      name: "Weekly Document Processing Summary",
      type: "Document Analytics",
      schedule: "Every Monday",
      nextRun: "2023-05-22",
      format: "PDF",
      recipients: "team@example.com",
    },
    {
      id: "sr2",
      name: "Monthly Patient Demographics",
      type: "Clinical Analytics",
      schedule: "1st of month",
      nextRun: "2023-06-01",
      format: "XLSX",
      recipients: "management@example.com",
    },
    {
      id: "sr3",
      name: "Quarterly System Performance",
      type: "System Analytics",
      schedule: "Every 3 months",
      nextRun: "2023-07-01",
      format: "PDF",
      recipients: "it@example.com",
    },
    {
      id: "sr4",
      name: "Monthly Compliance Report",
      type: "Occupational Health",
      schedule: "Last day of month",
      nextRun: "2023-05-31",
      format: "PDF",
      recipients: "compliance@example.com",
    },
  ];

  const filteredSavedReports = savedReports.filter(
    (report) =>
      (reportTypeFilter === "all" || report.type === reportTypeFilter) &&
      report.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredScheduledReports = scheduledReports.filter(
    (report) =>
      (reportTypeFilter === "all" || report.type === reportTypeFilter) &&
      report.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and view reports on patients, documents, and health metrics
          </p>
        </div>
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Button 
            onClick={() => setActiveTab("generate")} 
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
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
                    <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">{reportData?.totalPatients || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Processed Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">{reportData?.documentsByStatus?.processed || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Failed Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">{reportData?.documentsByStatus?.failed || 0}</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Processing</CardTitle>
                    <CardDescription>
                      Monthly document processing statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={reportData?.documentChartData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="documents" name="Total Documents" fill="#8884d8" />
                          <Bar dataKey="processed" name="Processed" fill="#10b981" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button 
                      onClick={() => generateReport('Document Processing')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Document Status</CardTitle>
                    <CardDescription>
                      Distribution of document processing status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                            {reportData?.pieChartData?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button 
                      onClick={() => generateReport('Document Status')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={reportTypeFilter}
              onValueChange={setReportTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Document Analytics">Document Analytics</SelectItem>
                <SelectItem value="Clinical Analytics">Clinical Analytics</SelectItem>
                <SelectItem value="System Analytics">System Analytics</SelectItem>
                <SelectItem value="Occupational Health">Occupational Health</SelectItem>
                <SelectItem value="Medical Examinations">Medical Examinations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSavedReports.length > 0 ? (
                    filteredSavedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.format}</TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No reports found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search scheduled reports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={reportTypeFilter}
              onValueChange={setReportTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Document Analytics">Document Analytics</SelectItem>
                <SelectItem value="Clinical Analytics">Clinical Analytics</SelectItem>
                <SelectItem value="System Analytics">System Analytics</SelectItem>
                <SelectItem value="Occupational Health">Occupational Health</SelectItem>
                <SelectItem value="Medical Examinations">Medical Examinations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScheduledReports.length > 0 ? (
                    filteredScheduledReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            {report.schedule}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {report.nextRun}
                          </div>
                        </TableCell>
                        <TableCell>{report.format}</TableCell>
                        <TableCell>{report.recipients}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm">Cancel</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No scheduled reports found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <div className="max-w-3xl mx-auto">
            <ReportGeneratorCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
