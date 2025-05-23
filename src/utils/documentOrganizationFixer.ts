
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      toast.info("No orphaned documents found", {
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
    
    toast.success("Documents associated successfully", {
      description: `${data?.length || 0} documents are now associated with your organization`
    });
    
    return { success: true, count: data?.length || 0, data };
  } catch (error: any) {
    toast.error("Error associating documents", {
      description: error.message || "There was an error associating documents with your organization"
    });
    
    return { success: false, error };
  }
};

/**
 * Utility to fix document URLs by regenerating them from storage paths
 */
export const fixDocumentUrls = async (organizationId: string) => {
  try {
    // Get documents missing URLs but having file paths
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .is('public_url', null)
      .not('file_path', 'is', null);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      toast.info("No documents need URL fixing");
      return { success: true, count: 0 };
    }
    
    let fixed = 0;
    
    // Fix each document
    for (const doc of data) {
      if (doc.file_path) {
        const bucketName = 'medical-documents';
        const publicUrl = `${supabase.storageUrl}/object/public/${bucketName}/${doc.file_path}`;
        
        const { error: updateError } = await supabase
          .from('documents')
          .update({ public_url: publicUrl })
          .eq('id', doc.id);
        
        if (!updateError) fixed++;
      }
    }
    
    if (fixed > 0) {
      toast.success(`Fixed URLs for ${fixed} documents`);
    }
    
    return { success: true, count: fixed };
  } catch (error: any) {
    toast.error("Error fixing document URLs", {
      description: error.message
    });
    return { success: false, error };
  }
};
