
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  User, 
  CheckCircle, 
  Clock, 
  Upload, 
  AlertCircle, 
  FolderCheck, 
  BarChart3,
  UserRound,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { format, subDays } from 'date-fns';
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentUploader from "@/components/DocumentUploader";
import { Helmet } from 'react-helmet';

// Define a type for the work queue items
interface WorkQueueItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  type: string;
  organization_id: string | null;
  assigned_to: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    currentClient,
    isServiceProvider,
    getEffectiveOrganizationId
  } = useOrganization();

  // Get the effective organization ID
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  // Fetch dashboard metrics
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      // Get total document count
      const { count: totalDocuments, error: docError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (docError) throw new Error(docError.message);

      // Get patients count
      const { count: totalPatients, error: patientError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (patientError) throw new Error(patientError.message);

      // Get pending documents count
      const { count: pendingDocuments, error: pendingError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending');
      
      if (pendingError) throw new Error(pendingError.message);

      // Get processed documents count
      const { count: processedDocuments, error: processedError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'processed');
      
      if (processedError) throw new Error(processedError.message);
      
      // Get recent documents (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentDocuments, error: recentError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (recentError) throw new Error(recentError.message);
      
      // Get certificate templates count
      const { count: certificateTemplates, error: templateError } = await supabase
        .from('certificate_templates')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (templateError) throw new Error(templateError.message);
      
      return {
        totalDocuments: totalDocuments || 0,
        totalPatients: totalPatients || 0,
        pendingDocuments: pendingDocuments || 0,
        processedDocuments: processedDocuments || 0,
        recentDocuments: recentDocuments || 0,
        certificateTemplates: certificateTemplates || 0
      };
    },
    enabled: !!organizationId
  });

  // Fetch recent activities (last 5 documents)
  const { data: recentActivities, isLoading: loadingActivities, refetch: refetchActivities } = useQuery({
    queryKey: ['recent-activities', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw new Error(error.message);
      
      return data || [];
    },
    enabled: !!organizationId
  });

  // Mock work queue items instead of fetching from the database
  const { data: workQueue, isLoading: loadingWorkQueue, refetch: refetchWorkQueue } = useQuery({
    queryKey: ['work-queue', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Create mock data for work queue since it doesn't exist in the database yet
      const mockWorkQueue: WorkQueueItem[] = [
        {
          id: '1',
          title: 'Review Document',
          description: 'Review the uploaded medical certificate',
          priority: 'high',
          status: 'pending',
          type: 'document_review',
          organization_id: organizationId,
          assigned_to: null,
          related_entity_type: 'document',
          related_entity_id: recentActivities && recentActivities.length > 0 ? recentActivities[0].id : null,
          due_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Patient Follow-up',
          description: 'Follow up with patient about their latest visit',
          priority: 'medium',
          status: 'pending',
          type: 'patient_followup',
          organization_id: organizationId,
          assigned_to: null,
          related_entity_type: 'patient',
          related_entity_id: null,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return mockWorkQueue;
    },
    enabled: !!organizationId && !!recentActivities
  });

  const handleUploadComplete = () => {
    refetchMetrics();
    refetchActivities();
    refetchWorkQueue();
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly.",
    });
  };

  // Function to get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'processed':
        return "bg-green-100 text-green-800";
      case 'processing':
        return "bg-blue-100 text-blue-800";
      case 'error':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return "bg-red-100 text-red-800";
      case 'medium':
        return "bg-yellow-100 text-yellow-800";
      case 'low':
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!organizationId) {
    return (
      <div className="text-center py-10 border rounded-lg bg-background mt-4">
        <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No organization selected</h3>
        <p className="text-muted-foreground mb-4">Please select an organization to view the dashboard</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {contextLabel ? `Viewing dashboard for ${contextLabel}` : "Overview of your organization"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              refetchMetrics();
              refetchActivities();
              refetchWorkQueue();
              toast({
                title: "Dashboard refreshed",
                description: "The dashboard data has been refreshed.",
              });
            }} 
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </Button>
          <Button 
            className="flex items-center gap-2" 
            onClick={() => setShowUploadDialog(true)}
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
      
      {/* Main Dashboard Content */}
      <div className="space-y-8">
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Documents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingMetrics ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalDocuments || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.recentDocuments || 0} new in the last 30 days
                </p>
              </CardContent>
            </Card>
            
            {/* Total Patients */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patients</CardTitle>
                <UserRound className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingMetrics ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    metrics?.totalPatients || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => navigate('/patients')}
                  >
                    View all patients
                  </Button>
                </p>
              </CardContent>
            </Card>
            
            {/* Document Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Document Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingMetrics ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `${metrics?.processedDocuments || 0}/${metrics?.totalDocuments || 0}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.pendingDocuments || 0} pending documents
                </p>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/documents')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>View Documents</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/patients')}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Manage Patients</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
        
        {/* Recent Activity and Work Queue */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest documents uploaded to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivities ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities && recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.file_name}
                        </p>
                        <div className="flex items-center">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'MMM d, yyyy')}
                          </p>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/documents/${activity.id}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No recent activity found</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/documents')}
              >
                View All Documents
              </Button>
            </CardFooter>
          </Card>
          
          {/* Work Queue */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Work Queue</CardTitle>
              <CardDescription>
                Tasks that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWorkQueue ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : workQueue && workQueue.length > 0 ? (
                <div className="space-y-4">
                  {workQueue.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <FolderCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {item.title}
                        </p>
                        <div className="flex items-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(item.priority)}`}>
                            {item.priority}
                          </span>
                          {item.due_date && (
                            <>
                              <span className="mx-2 text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Handle work item action
                          if (item.related_entity_type === 'document' && item.related_entity_id) {
                            navigate(`/documents/${item.related_entity_id}`);
                          } else if (item.related_entity_type === 'patient' && item.related_entity_id) {
                            navigate(`/patients/${item.related_entity_id}`);
                          }
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No work queue items found</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // Add an action for viewing all work queue items
                  toast({
                    title: "Coming soon",
                    description: "Full work queue management is coming soon.",
                  });
                }}
              >
                View All Tasks
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
