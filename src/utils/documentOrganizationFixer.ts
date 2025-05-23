
import { supabase } from "@/integrations/supabase/client";

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
      console.log("No orphaned documents found");
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
    
    console.log(`Associated ${data?.length || 0} orphaned documents with organization ${organizationId}`);
    
    return { success: true, count: data?.length || 0, data };
  } catch (error: any) {
    console.error("Error associating documents:", error);
    
    return { success: false, error };
  }
};

/**
 * Utility to fix document URLs by regenerating them from storage paths
 */
export const fixDocumentUrls = async (organizationId: string) => {
  try {
    // Get documents missing URLs but having file paths
    const { data: missingUrlDocs, error: missingUrlError } = await supabase
      .from('documents')
      .select('id, file_path')
      .eq('organization_id', organizationId)
      .is('public_url', null)
      .not('file_path', 'is', null);
    
    if (missingUrlError) throw missingUrlError;
    
    // Get documents with potentially incorrect URLs (they have a URL but it might be wrong)
    const { data: potentiallyBrokenDocs, error: brokenUrlError } = await supabase
      .from('documents')
      .select('id, file_path, public_url')
      .eq('organization_id', organizationId)
      .not('public_url', 'is', null)
      .not('file_path', 'is', null);
      
    if (brokenUrlError) throw brokenUrlError;
    
    console.log(`Found ${missingUrlDocs?.length || 0} documents with missing URLs`);
    console.log(`Found ${potentiallyBrokenDocs?.length || 0} documents to check for correct URLs`);
    
    // Combine both sets of documents that need attention
    const docsToProcess = [
      ...(missingUrlDocs || []), 
      ...(potentiallyBrokenDocs || [])
    ];
    
    if (docsToProcess.length === 0) {
      return { success: true, count: 0 };
    }
    
    let fixed = 0;
    
    // Fix each document
    for (const doc of docsToProcess) {
      if (doc.file_path) {
        // First, check which bucket the file is actually in
        let bucketName = 'medical-documents'; // Default bucket
        let publicUrl = '';
        
        // Check if file exists in medical-documents bucket
        const { data: medicalBucketData } = await supabase
          .storage
          .from('medical-documents')
          .getPublicUrl(doc.file_path);
        
        // Check if file exists in documents bucket
        const { data: documentsBucketData } = await supabase
          .storage
          .from('documents')
          .getPublicUrl(doc.file_path);
        
        // Determine which bucket actually has the file
        if (medicalBucketData?.publicUrl) {
          publicUrl = medicalBucketData.publicUrl;
          bucketName = 'medical-documents';
        } else if (documentsBucketData?.publicUrl) {
          publicUrl = documentsBucketData.publicUrl;
          bucketName = 'documents';
        } else {
          // Try to construct a URL manually as a last resort
          publicUrl = `${supabase.storageUrl}/object/public/${bucketName}/${doc.file_path}`;
        }
        
        // Only update if URL is null or different
        if (!doc.public_url || doc.public_url !== publicUrl) {
          console.log(`Updating document ${doc.id} with URL from ${bucketName} bucket`);
          
          const { error: updateError } = await supabase
            .from('documents')
            .update({ public_url: publicUrl })
            .eq('id', doc.id);
          
          if (updateError) {
            console.error(`Failed to update document ${doc.id}:`, updateError);
          } else {
            fixed++;
          }
        }
      }
    }
    
    console.log(`Fixed URLs for ${fixed} documents`);
    
    return { success: true, count: fixed };
  } catch (error: any) {
    console.error("Error fixing document URLs:", error);
    return { success: false, error };
  }
};
