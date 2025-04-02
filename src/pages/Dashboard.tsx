
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { FileText, Plus, Upload, Clock, Users, AlertTriangle, CheckCircle, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import DocumentUploader from "@/components/DocumentUploader";
import RlsTester from "@/components/RlsTester";
import { OrphanedDocumentFixer } from "@/components/OrphanedDocumentFixer";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { currentOrganization, currentClient, getEffectiveOrganizationId } = useOrganization();
  const navigate = useNavigate();
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  // Fetch summary data
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary', organizationId],
    queryFn: async () => {
      // Get document counts
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, status, created_at')
        .eq('organization_id', organizationId);
      
      if (docError) throw docError;
      
      // Get patient counts
      const { count: patientCount, error: patientError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (patientError) throw patientError;
      
      // Create status breakdown
      const statusCounts = {
        processed: 0,
        processing: 0,
        failed:, 0,
        pending: 0
      };
      
      documents?.forEach(doc => {
        if (statusCounts[doc.status] !== undefined) {
          statusCounts[doc.status]++;
        }
      });
      
      // Get documents created this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthDocs = documents?.filter(doc => 
        new Date(doc.created_at) >= firstDayOfMonth
      ).length || 0;
      
      // Calculate monthly document data
      const monthlyData = Array(12).fill(0);
      documents?.forEach(doc => {
        const docDate = new Date(doc.created_at);
        if (docDate.getFullYear() === now.getFullYear()) {
          monthlyData[docDate.getMonth()]++;
        }
      });
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const activityData = monthNames.map((month, index) => ({
        name: month,
        documents: monthlyData[index]
      }));
      
      // Create status chart data
      const statusData = [
        { name: 'Processed', value: statusCounts.processed },
        { name: 'Processing', value: statusCounts.processing },
        { name: 'Failed', value: statusCounts.failed },
        { name: 'Pending', value: statusCounts.pending }
      ].filter(item => item.value > 0);
      
      return {
        totalDocuments: documents?.length || 0,
        thisMonthDocuments: thisMonthDocs,
        totalPatients: patientCount || 0,
        pendingReviews: (documents?.filter(d => d.status !== 'processed').length || 0),
        activityData,
        statusData,
        statusCounts
      };
    },
    enabled: !!organizationId
  });

  // Check for orphaned documents
  const { data: orphanedDocsCount } = useQuery({
    queryKey: ['orphaned-documents-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .is('organization_id', null);

      if (error) {
        console.error('Error checking for orphaned documents:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!currentOrganization
  });

  // Recent documents
  const { data: recentDocuments } = useQuery({
    queryKey: ['recent-documents', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
  });

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly.",
    });
  };

  // Status colors for the pie chart
  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {contextLabel ? `Overview for ${contextLabel}` : "Organization overview"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/organizations/new')} 
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Organization</span>
          </Button>
          <Button 
            className="flex items-center gap-2" 
            onClick={() => setShowUploadDialog(true)}
            disabled={!organizationId}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>

      {/* Document Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentClient 
                ? `Upload Document for ${currentClient.name}` 
                : "Upload Document"}
            </DialogTitle>
          </DialogHeader>
          <DocumentUploader 
            onUploadComplete={handleUploadComplete} 
            organizationId={currentOrganization?.id}
            clientOrganizationId={currentClient?.id}
          />
        </DialogContent>
      </Dialog>
      
      {/* Show orphaned document fixer if needed */}
      {orphanedDocsCount && orphanedDocsCount > 0 && (
        <div className="mb-6">
          <OrphanedDocumentFixer />
        </div>
      )}

      {!organizationId ? (
        <div className="text-center py-10 border rounded-lg bg-background">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No organization selected</h3>
          <p className="text-muted-foreground mb-4">Please select an organization to view dashboard</p>
        </div>
      ) : loadingSummary ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData?.totalDocuments || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{summaryData?.thisMonthDocuments || 0} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData?.totalPatients || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Active patient records
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData?.pendingReviews || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Documents awaiting review
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summaryData?.statusCounts.processed || 0}/{summaryData?.totalDocuments || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Documents successfully processed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Document Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summaryData?.activityData || []}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="documents" fill="#8884d8" name="Documents" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Document Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summaryData?.statusData || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {summaryData?.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentDocuments?.length > 0 ? (
                      recentDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between border-b py-2 last:border-0">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${doc.status === 'processed' ? 'bg-green-100 text-green-800' : 
                                doc.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {doc.status}
                            </span>
                            <Button variant="ghost" size="sm" className="ml-2" onClick={() => navigate(`/documents/${doc.id}`)}>
                              <ArrowUpRight size={16} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-2">No recent documents found</p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
                      View all documents
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/documents')}>
                      <FileText className="h-5 w-5" />
                      <span>View Documents</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setShowUploadDialog(true)}>
                      <Upload className="h-5 w-5" />
                      <span>Upload Document</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/patients')}>
                      <Users className="h-5 w-5" />
                      <span>Manage Patients</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/settings/organization')}>
                      <CheckCircle className="h-5 w-5" />
                      <span>Update Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security">
            <RlsTester />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Dashboard;
