
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentUploader from "@/components/DocumentUploader";
import BatchDocumentUploader from "@/components/BatchDocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { motion } from "framer-motion";
import RlsTester from "@/components/RlsTester";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Upload, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/components/ui/use-toast";
import { OrphanedDocumentFixer } from "@/components/OrphanedDocumentFixer";
import { StorageCleanupUtility } from "@/components/StorageCleanupUtility";

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

  // Get the effective organization ID (either client organization if selected, or current organization)
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

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

      return data || [];
    },
    enabled: !!organizationId
  });

  const handleUploadComplete = () => {
    // Refresh the documents list after upload completes
    refetch();
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly.",
    });
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  // Only show upload button if we have an organization context
  const canUpload = !!organizationId;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {contextLabel ? `Viewing documents for ${contextLabel}` : "Manage your documents and organization"}
          </p>
        </div>
        <div className="flex items-center gap-4 z-10 relative">
          <Button 
            variant="outline" 
            onClick={() => setShowCleanupTools(prev => !prev)} 
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            <span>Cleanup Tools</span>
          </Button>
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
            disabled={!canUpload}
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

      {/* Show cleanup tools if enabled */}
      {showCleanupTools && (
        <div className="mb-6">
          <StorageCleanupUtility />
        </div>
      )}
      
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="uploads">Upload Documents</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {documents.map((document) => (
                <Card key={document.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{document.file_name}</CardTitle>
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
                    <Button onClick={() => handleViewDocument(document.id)}>View</Button>
                  </CardFooter>
                </Card>
              ))}
            </motion.div>
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
        
        <TabsContent value="uploads">
          {!organizationId ? (
            <div className="text-center py-10 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No organization selected</h3>
              <p className="text-muted-foreground mb-4">Please select an organization to upload documents</p>
            </div>
          ) : (
            <div className="space-y-8">
              <BatchDocumentUploader 
                onUploadComplete={handleUploadComplete}
                organizationId={currentOrganization?.id}
                clientOrganizationId={currentClient?.id}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <RlsTester />
            
            <Card>
              <CardHeader>
                <CardTitle>RLS Testing Guide</CardTitle>
                <CardDescription>
                  How to verify multi-tenant security in your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Testing Checklist:</h3>
                  <ul className="list-disc pl-5 pt-2 space-y-1">
                    <li>Create test users in different organizations</li>
                    <li>Verify users can only see their organization's data</li>
                    <li>Test document uploads with different user accounts</li>
                    <li>Validate cross-organization access is prevented</li>
                    <li>Test different roles within organizations</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Common Issues:</h3>
                  <ul className="list-disc pl-5 pt-2 space-y-1">
                    <li>Missing RLS policies on tables</li>
                    <li>Incorrectly configured policies</li>
                    <li>Missing automatic organization ID assignment</li>
                    <li>Recursive RLS policy issues</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
