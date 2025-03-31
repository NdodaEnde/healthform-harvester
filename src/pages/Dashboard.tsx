
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentUploader from "@/components/DocumentUploader";
import BatchDocumentUploader from "@/components/BatchDocumentUploader";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Plus, 
  Upload, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Activity, 
  Users, 
  Clock, 
  PieChart, 
  Calendar, 
  BarChart3,
  Building,
  UserRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OrphanedDocumentFixer } from "@/components/OrphanedDocumentFixer";
import { StorageCleanupUtility } from "@/components/StorageCleanupUtility";

// Define a type for the review status
type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';

// Define metrics cards for the dashboard
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

const MetricCard = ({ title, value, description, icon, trend }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {trend && (
        <div className={`flex items-center mt-1 text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
          <span>{trend.positive ? '↑' : '↓'} {trend.value}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// Activity feed item interface
interface ActivityItem {
  id: number;
  action: string;
  target: string;
  timestamp: string;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCleanupTools, setShowCleanupTools] = useState(false);
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    currentClient,
    isServiceProvider,
    getEffectiveOrganizationId
  } = useOrganization();
  const { user } = useAuth();

  // Get the effective organization ID (either client organization if selected, or current organization)
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  // Define user role - in a real app, this would come from auth context
  // For now, we'll simulate based on isServiceProvider
  const userRole = isServiceProvider() ? 'admin' : 'staff';

  // Check for documents without organization context
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

  // Fetch documents
  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*');
      
      // If viewing as service provider with a client selected
      if (currentClient && isServiceProvider()) {
        query = query.eq('client_organization_id', currentClient.id);
      } 
      // If viewing own organization
      else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching documents",
          description: error.message,
          variant: "destructive"
        });
        throw new Error(error.message);
      }

      return data?.map(doc => ({
        ...doc, 
        reviewStatus: localStorage.getItem(`doc-review-${doc.id}`) as ReviewStatus || 'not-reviewed',
        reviewNote: localStorage.getItem(`doc-review-note-${doc.id}`) || ''
      })) || [];
    },
    enabled: !!organizationId
  });

  // Fetch patients count
  const { data: patientsCount } = useQuery({
    queryKey: ['patients-count', organizationId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching patients count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!organizationId
  });

  // Mock activity feed data - in a real app, this would come from the backend
  const recentActivities: ActivityItem[] = [
    {
      id: 1,
      action: "Certificate uploaded",
      target: "John Smith",
      timestamp: "10 minutes ago",
      icon: <FileText size={16} className="text-blue-500" />
    },
    {
      id: 2,
      action: "Patient added",
      target: "Sarah Johnson",
      timestamp: "2 hours ago",
      icon: <UserRound size={16} className="text-green-500" />
    },
    {
      id: 3,
      action: "Certificate reviewed",
      target: "Michael Brown",
      timestamp: "Yesterday",
      icon: <CheckCircle size={16} className="text-green-600" />
    },
    {
      id: 4,
      action: "Organization updated",
      target: "Healthcare Corp",
      timestamp: "2 days ago",
      icon: <Building size={16} className="text-purple-500" />
    }
  ];

  // Handle document upload
  const handleUploadComplete = () => {
    // Refresh the documents list after upload completes
    refetch();
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly.",
    });
  };

  // Handle document viewing
  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  // Handle document review status update
  const updateDocumentReviewStatus = (documentId: string, reviewStatus: ReviewStatus, reviewNote?: string) => {
    // Store review status in localStorage
    localStorage.setItem(`doc-review-${documentId}`, reviewStatus);
    if (reviewNote) {
      localStorage.setItem(`doc-review-note-${documentId}`, reviewNote);
    }
    
    // Update the UI by refetching the documents
    refetch();
    
    toast({
      title: "Review status updated",
      description: `Document has been marked as ${reviewStatus.replace('-', ' ')}`
    });
  };

  // Helper function to get review status badge
  const getReviewStatusBadge = (reviewStatus: ReviewStatus | undefined) => {
    if (!reviewStatus || reviewStatus === 'not-reviewed') {
      return <Badge variant="outline" className="text-xs">Not Reviewed</Badge>;
    } else if (reviewStatus === 'reviewed') {
      return <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600 text-white">Reviewed</Badge>;
    } else if (reviewStatus === 'needs-correction') {
      return <Badge variant="destructive" className="text-xs">Needs Correction</Badge>;
    }
  };

  // Only show upload button if we have an organization context
  const canUpload = !!organizationId;

  // Calculate review statistics
  const notReviewedCount = documents?.filter(doc => 
    !doc.reviewStatus || doc.reviewStatus === 'not-reviewed'
  ).length || 0;
  
  const reviewedCount = documents?.filter(doc => 
    doc.reviewStatus === 'reviewed'
  ).length || 0;
  
  const needsCorrectionCount = documents?.filter(doc => 
    doc.reviewStatus === 'needs-correction'
  ).length || 0;

  // Format user name for welcome message
  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}</h1>
        <p className="text-muted-foreground">
          {contextLabel ? `You're viewing data for ${contextLabel}` : "Here's an overview of your system"}
        </p>
      </div>

      {/* Admin Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <Button 
          className="flex items-center gap-2" 
          onClick={() => setShowUploadDialog(true)}
          disabled={!canUpload}
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </Button>
        
        {userRole === 'admin' && (
          <>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/organizations/new')} 
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Add Organization</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCleanupTools(prev => !prev)} 
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              <span>Cleanup Tools</span>
            </Button>
          </>
        )}
        
        {userRole === 'staff' && (
          <Button 
            variant="outline" 
            onClick={() => navigate('/patients')} 
            className="flex items-center gap-2"
          >
            <UserRound size={16} />
            <span>Manage Patients</span>
          </Button>
        )}
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
      {orphanedDocsCount && orphanedDocsCount > 0 && userRole === 'admin' && (
        <div className="mb-6">
          <OrphanedDocumentFixer />
        </div>
      )}

      {/* Show cleanup tools if enabled */}
      {showCleanupTools && userRole === 'admin' && (
        <div className="mb-6">
          <StorageCleanupUtility />
        </div>
      )}
      
      {/* Dashboard Metrics based on role */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metrics for all users */}
        <MetricCard 
          title="Total Documents"
          value={documents?.length || 0}
          icon={<FileText size={18} className="text-blue-500" />}
          description="Processed documents"
        />
        
        <MetricCard 
          title="Active Patients"
          value={patientsCount || 0}
          icon={<UserRound size={18} className="text-green-500" />}
          description="Registered patients"
        />
        
        {/* Admin-specific metrics */}
        {userRole === 'admin' && (
          <>
            <MetricCard 
              title="Organizations"
              value="5"
              icon={<Building size={18} className="text-purple-500" />}
              description="Active organizations"
            />
            
            <MetricCard 
              title="System Users"
              value="24"
              icon={<Users size={18} className="text-amber-500" />}
              description="Active users"
              trend={{
                value: "2 new this month",
                positive: true
              }}
            />
          </>
        )}
        
        {/* Staff-specific metrics */}
        {userRole === 'staff' && (
          <>
            <MetricCard 
              title="Pending Reviews"
              value={notReviewedCount}
              icon={<Clock size={18} className="text-amber-500" />}
              description="Documents awaiting review"
            />
            
            <MetricCard 
              title="Certificates Expiring"
              value="12"
              icon={<Calendar size={18} className="text-red-500" />}
              description="Next 30 days"
            />
          </>
        )}
      </div>
      
      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Recent Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="admin">Admin Tools</TabsTrigger>
          )}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="mt-0.5">{activity.icon}</div>
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.target}</div>
                        <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/activity')}>
                  View all activity
                </Button>
              </CardFooter>
            </Card>
            
            {/* Fit Status Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle>Fitness Status Distribution</CardTitle>
                <CardDescription>Patient certification status</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Fit</span>
                    </div>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{width: '65%'}}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                      <span>Fit with Restrictions</span>
                    </div>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{width: '20%'}}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
                      <span>Temporarily Unfit</span>
                    </div>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{width: '10%'}}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                      <span>Unfit</span>
                    </div>
                    <span className="font-medium">5%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{width: '5%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents">
          {!organizationId ? (
            <div className="text-center py-10 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No organization selected</h3>
              <p className="text-muted-foreground mb-4">Please select an organization to view documents</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-destructive">Error: {(error as Error).message}</p>
            </div>
          ) : documents && documents.length > 0 ? (
            <>
              {/* Review status summary */}
              {documents.length > 0 && (
                <div className="mb-6 flex items-center gap-4 text-sm">
                  <span className="font-medium">Review Status:</span>
                  {notReviewedCount > 0 && <span className="text-muted-foreground">{notReviewedCount} not reviewed</span>}
                  {reviewedCount > 0 && <span className="text-green-500">{reviewedCount} reviewed</span>}
                  {needsCorrectionCount > 0 && <span className="text-red-500">{needsCorrectionCount} needs correction</span>}
                </div>
              )}
            
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {documents.slice(0, 6).map((document) => (
                  <Card key={document.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{document.file_name}</CardTitle>
                        </div>
                        <div>
                          {getReviewStatusBadge(document.reviewStatus)}
                        </div>
                      </div>
                      <CardDescription>Uploaded on {new Date(document.created_at).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            document.status === 'processed' 
                              ? 'bg-green-100 text-green-800' 
                              : document.status === 'processing' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Type:</span>
                          <span className="text-sm">{document.document_type || 'Unknown'}</span>
                        </div>
                        {document.client_organization_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Client:</span>
                            <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              For client
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex gap-2">
                        <Button onClick={() => handleViewDocument(document.id)} variant="default">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => updateDocumentReviewStatus(document.id, 'reviewed')}
                              >
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as reviewed</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => updateDocumentReviewStatus(document.id, 'needs-correction')}
                              >
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as needs correction</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </motion.div>
              
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard?tab=documents')}
                >
                  View All Documents
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
              <Button 
                variant="outline" 
                className="mx-auto"
                onClick={() => setShowUploadDialog(true)}
                disabled={!canUpload}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Activity Feed Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>All recent actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array(10).fill(0).map((_, i) => {
                  const activity = recentActivities[i % recentActivities.length];
                  return (
                    <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="mt-0.5">{activity.icon}</div>
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.target}</div>
                        <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Admin Tab */}
        {userRole === 'admin' && (
          <TabsContent value="admin">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Queue</CardTitle>
                  <CardDescription>Document processing status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Documents in queue</span>
                      <Badge variant="outline">3</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Currently processing</span>
                      <Badge variant="outline">1</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Failed processing</span>
                      <Badge variant="destructive">2</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Processed today</span>
                      <Badge variant="outline">12</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">Manage Queue</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Health and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>API Service</span>
                      </div>
                      <span className="text-green-500">Operational</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Database</span>
                      </div>
                      <span className="text-green-500">Operational</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Storage</span>
                      </div>
                      <span className="text-green-500">Operational</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                        <span>AI Processing</span>
                      </div>
                      <span className="text-amber-500">Degraded</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">View System Status</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;
