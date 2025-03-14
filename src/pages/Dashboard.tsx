import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentUploader from "@/components/DocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { motion } from "framer-motion";
import RlsTester from "@/components/RlsTester";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Dashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const navigate = useNavigate();

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }
  });

  const handleUploadComplete = (data?: any) => {
    // Refresh the documents list after upload completes
    refetch();
    setShowUploadDialog(false);
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your documents and organization
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
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <DocumentUploader onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="documents">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-destructive">Error: {error.message}</p>
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
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
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
