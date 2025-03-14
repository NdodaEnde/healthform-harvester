
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const StorageCleanupUtility = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [deletedFiles, setDeletedFiles] = useState(0);

  const handleDeleteAllFiles = async () => {
    if (!confirm("Are you sure you want to delete ALL document files from storage? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setProgress(0);
    setDeletedFiles(0);
    
    try {
      // List all files in the medical-documents bucket
      const { data: files, error } = await supabase
        .storage
        .from('medical-documents')
        .list('', { limit: 1000 });
      
      if (error) {
        throw error;
      }
      
      if (!files || files.length === 0) {
        toast({
          title: "No files found",
          description: "There are no files in the storage bucket to delete.",
        });
        setLoading(false);
        return;
      }
      
      setTotalFiles(files.length);
      
      // Create a recursive function to delete files in batches
      const deleteFiles = async (paths: string[], startIndex: number, batchSize: number) => {
        if (startIndex >= paths.length) {
          setProgress(100);
          setDeletedFiles(paths.length);
          return;
        }
        
        const batch = paths.slice(startIndex, startIndex + batchSize);
        
        // Delete the batch of files
        const { error: deleteError } = await supabase
          .storage
          .from('medical-documents')
          .remove(batch);
        
        if (deleteError) {
          console.error("Error deleting files:", deleteError);
          toast({
            title: "Error deleting files",
            description: deleteError.message,
            variant: "destructive"
          });
        }
        
        // Update progress
        const newDeletedCount = startIndex + batch.length;
        setDeletedFiles(newDeletedCount);
        setProgress(Math.floor((newDeletedCount / paths.length) * 100));
        
        // Process next batch
        await deleteFiles(paths, startIndex + batchSize, batchSize);
      };
      
      // Start deleting files - get all file paths
      const filePaths = files.map(file => file.name);
      await deleteFiles(filePaths, 0, 20); // Delete in batches of 20
      
      toast({
        title: "Files deleted successfully",
        description: `Deleted ${filePaths.length} files from storage.`,
        variant: "success"
      });
      
    } catch (error: any) {
      console.error("Error during file cleanup:", error);
      toast({
        title: "Error cleaning up storage",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Storage Cleanup Utility
        </CardTitle>
        <CardDescription className="text-red-600">
          Permanently delete all document files from Supabase storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-600 mb-4">
          This utility will delete all files from the medical-documents storage bucket.
          This action cannot be undone. The database records were already deleted in the previous step.
        </p>
        
        {loading && (
          <div className="space-y-2 mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-red-600">
              Deleting files ({deletedFiles} of {totalFiles})...
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="destructive"
          onClick={handleDeleteAllFiles}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Deleting Files..." : "Delete All Document Files"}
        </Button>
      </CardFooter>
    </Card>
  );
};
