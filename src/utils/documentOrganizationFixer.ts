
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
