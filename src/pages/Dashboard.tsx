import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Upload,
  Plus,
  ArrowRight,
  Activity
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    currentClient,
    getEffectiveOrganizationId
  } = useOrganization();

  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  // Fetch summary statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', organizationId],
    queryFn: async () => {
      // Get document count by status
      let query = supabase
        .from('documents')
        .select('status', { count: 'exact' });
      
      if (currentClient) {
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { count: documentsCount, error: docsError } = await query;
      
      if (docsError) throw docsError;
      
      // Get document counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('documents')
        .select('status, created_at')
        .eq('organization_id', organizationId);
      
      if (statusError) throw statusError;
      
      const processed = statusCounts?.filter(doc => doc.status === 'processed').length || 0;
      const processing = statusCounts?.filter(doc => doc.status === 'processing').length || 0;
      const error = statusCounts?.filter(doc => doc.status === 'error').length || 0;
      
      // Get patient count
      const { count: patientsCount, error: patientsError } = await supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId);
      
      if (patientsError) throw patientsError;
      
      // Get recent documents
      const { data: recentDocuments, error: recentError } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) throw recentError;

      const documentsReviewedCount = recentDocuments?.filter(doc => 
        localStorage.getItem(`doc-review-${doc.id}`) === 'reviewed'
      ).length || 0;
      
      const documentsNeedsCorrectionCount = recentDocuments?.filter(doc => 
        localStorage.getItem(`doc-review-${doc.id}`) === 'needs-correction'
      ).length || 0;

      // Calculate monthly document counts
      const monthlyDocumentsData = calculateMonthlyDocumentData(statusCounts || []);
      
      return {
        documentsCount: documentsCount || 0,
        patientsCount: patientsCount || 0,
        processed,
        processing,
        error,
        recentDocuments: recentDocuments || [],
        documentsReviewedCount,
        documentsNeedsCorrectionCount,
        monthlyDocumentsData
      };
    },
    enabled: !!organizationId
  });

  // Fetch work queue items - fix by properly destructuring the query result
  const { data: workQueueItems, isLoading: isLoadingWorkQueue, refetch: refetchWorkQueue } = useQuery({
    queryKey: ['work-queue', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_queue')
        .select('*')
        .eq('organization_id', organizationId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        toast({
          title: "Error fetching work queue",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId
  });

  // Helper function to calculate monthly document data
  const calculateMonthlyDocumentData = (documents) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Initialize counts for each month
    const monthlyData = months.map(month => ({ month, count: 0 }));
    
    // Count documents by month
    documents.forEach(doc => {
      const createdAt = new Date(doc.created_at);
      // Only count documents from the current year
      if (createdAt.getFullYear() === currentYear) {
        const monthIndex = createdAt.getMonth();
        monthlyData[monthIndex].count += 1;
      }
    });
    
    return monthlyData;
  };

  // Prepare data for the status chart using real data
  const statusChartData = [
    { name: 'Processed', value: stats?.processed || 0, color: '#10b981' },
    { name: 'Processing', value: stats?.processing || 0, color: '#3b82f6' },
    { name: 'Error', value: stats?.error || 0, color: '#ef4444' }
  ];

  // Helper function to get priority style
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to handle work item action (mark as in progress or completed)
  const handleWorkItemAction = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('work_queue')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Refetch work queue items - using the properly destructured refetch function
      await refetchWorkQueue();
      
      toast({
        title: "Status updated",
        description: `Work item marked as ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!organizationId) {
    return (
      <div className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">No organization selected</h3>
              <p className="text-muted-foreground mb-4">Please select an organization to view your dashboard</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/organizations')}
              >
                View Organizations
              </Button>
            </div>
          </CardContent>
        </Card>
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
            {contextLabel ? `Overview for ${contextLabel}` : "Overview of your organization"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/patients/new')}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Patient</span>
          </Button>
          
          <Button 
            className="flex items-center gap-2" 
            onClick={() => navigate('/documents')}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.documentsCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.monthlyDocumentsData && 
               stats.monthlyDocumentsData[new Date().getMonth()].count > 0 ? 
                `+${stats.monthlyDocumentsData[new Date().getMonth()].count} this month` : 
                "No new documents this month"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.patientsCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered patients in your system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Processing
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                stats?.processing || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents currently processing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Attention
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                (stats?.error || 0) + (stats?.documentsNeedsCorrectionCount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents requiring your attention
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7 mb-8">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Document Activity</CardTitle>
            <CardDescription>
              Monthly document upload activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.monthlyDocumentsData || []}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Document Status</CardTitle>
            <CardDescription>
              Current status of all documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              The latest documents added to your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between border-b pb-2">
                    <div className="w-1/2 h-5 bg-muted rounded animate-pulse" />
                    <div className="w-1/4 h-5 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
              <div className="space-y-4">
                {stats.recentDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent documents found
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/documents')}
            >
              View All Documents
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Work Queue</CardTitle>
            <CardDescription>
              Tasks requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingWorkQueue ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-5 w-full bg-gray-200 rounded animate-pulse mt-2"></div>
                  </div>
                ))}
              </div>
            ) : workQueueItems?.length > 0 ? (
              <div className="space-y-4">
                {workQueueItems.map(item => (
                  <div key={item.id} className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <Badge className={`${getPriorityStyle(item.priority)}`}>
                        {item.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-2">{item.title}</p>
                    
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                    
                    <div className="flex gap-2 mt-2">
                      {item.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleWorkItemAction(item.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      
                      {item.status === 'in_progress' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleWorkItemAction(item.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      
                      {item.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                      
                      {item.status === 'in_progress' && (
                        <Badge variant="secondary" className="text-xs">In Progress</Badge>
                      )}
                      
                      {item.status === 'completed' && (
                        <Badge variant="default" className="bg-green-500 text-xs">Completed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No tasks in your work queue</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate('/documents')}
                >
                  Process Documents
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/work-queue')}
            >
              View All Tasks
              <Activity className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
