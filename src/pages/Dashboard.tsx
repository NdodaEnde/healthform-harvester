
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentUploader from "@/components/DocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { motion } from "framer-motion";
import RlsTester from "@/components/RlsTester";

const Dashboard = () => {
  const [uploading, setUploading] = useState(false);

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

  const handleUploadComplete = () => {
    // Refresh the documents list after upload completes
    refetch();
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between space-y-2 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Manage and view your uploaded documents here.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DocumentUploader onUploadComplete={handleUploadComplete} />
              {uploading && <p>Uploading...</p>}
            </div>
          </div>
          
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="documents">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {isLoading ? (
                  <div>Loading documents...</div>
                ) : error ? (
                  <div>Error: {error.message}</div>
                ) : documents && documents.length > 0 ? (
                  documents.map((document) => (
                    <Card key={document.id}>
                      <CardHeader>
                        <CardTitle>{document.file_name}</CardTitle>
                        <CardDescription>Uploaded on {new Date(document.created_at).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Status: {document.status}</p>
                        <p>Type: {document.document_type}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button onClick={() => window.open(`/document/${document.id}`, '_blank')}>View</Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div>No documents found.</div>
                )}
              </motion.div>
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
      </div>
    </div>
  );
};

export default Dashboard;
