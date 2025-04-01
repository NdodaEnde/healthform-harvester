import React from 'react';
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { BarChart3, Upload, RefreshCw } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentUploader from "@/components/DocumentUploader";
import { Helmet } from 'react-helmet';
import { RoleBasedDashboard } from '@/components/dashboard/RoleBasedDashboard';

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const { 
    currentOrganization, 
    currentClient,
    getEffectiveOrganizationId
  } = useOrganization();

  // Get the effective organization ID
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  const { refetch: refetchMetrics } = useQuery({
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

  const { refetch: refetchActivities } = useQuery({
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

  const handleUploadComplete = () => {
    refetchMetrics();
    refetchActivities();
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly.",
    });
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <RoleBasedDashboard />
      </motion.div>
    </div>
  );
};

export default Dashboard;
