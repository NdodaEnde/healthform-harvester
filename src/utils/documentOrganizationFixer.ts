
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Utility to associate orphaned documents (documents with null organization_id) 
 * with the specified organization
 */
export const associateOrphanedDocuments = async (organizationId: string) => {
  try {
    // First get a count of orphaned documents
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .is('organization_id', null);
    
    if (countError) {
      console.error("Error counting orphaned documents:", countError);
      throw countError;
    }
    
    if (!count || count === 0) {
      toast({
        title: "No orphaned documents found",
        description: "All documents are already associated with an organization"
      });
      return { success: true, count: 0 };
    }
    
    // Update all documents with null organization_id to be associated with the current organization
    const { data, error } = await supabase
      .from('documents')
      .update({ organization_id: organizationId })
      .is('organization_id', null)
      .select();
    
    if (error) {
      console.error("Error associating orphaned documents:", error);
      throw error;
    }
    
    toast({
      title: "Documents associated successfully",
      description: `${data?.length || 0} documents are now associated with your organization`
    });
    
    return { success: true, count: data?.length || 0, data };
  } catch (error: any) {
    toast({
      title: "Error associating documents",
      description: error.message || "There was an error associating documents with your organization",
      variant: "destructive"
    });
    
    return { success: false, error };
  }
};

/**
 * Utility to delete all files from the medical-documents storage bucket
 */
export const deleteAllStorageFiles = async () => {
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
      return { success: true, count: 0, message: "No files found to delete" };
    }
    
    // Get all file paths
    const filePaths = files.map(file => file.name);
    
    // Delete all files
    const { error: deleteError } = await supabase
      .storage
      .from('medical-documents')
      .remove(filePaths);
    
    if (deleteError) {
      throw deleteError;
    }
    
    return { 
      success: true, 
      count: filePaths.length, 
      message: `Successfully deleted ${filePaths.length} files` 
    };
  } catch (error: any) {
    console.error("Error deleting storage files:", error);
    return { 
      success: false, 
      error: error.message || "An unexpected error occurred" 
    };
  }
};
