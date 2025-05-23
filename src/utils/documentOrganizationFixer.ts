
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
 * Can optionally standardize storage location to use a single bucket
 */
export const fixDocumentUrls = async (organizationId: string, standardizeToBucket?: string) => {
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
    
    // Define the standard bucket to use if standardizing
    const standardBucket = standardizeToBucket || 'medical-documents';
    const bucketExists = await ensureStorageBucket(standardBucket);
    
    if (!bucketExists && standardizeToBucket) {
      console.error(`Cannot standardize to bucket ${standardBucket} as it doesn't exist`);
      return { success: false, error: `Bucket ${standardBucket} doesn't exist` };
    }
    
    // Fix each document
    for (const doc of docsToProcess) {
      if (doc.file_path) {
        // First, check which bucket the file is actually in
        let sourceBucketName = 'medical-documents'; // Default bucket
        let publicUrl = '';
        let fileExists = false;
        
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
          sourceBucketName = 'medical-documents';
          fileExists = true;
        } else if (documentsBucketData?.publicUrl) {
          publicUrl = documentsBucketData.publicUrl;
          sourceBucketName = 'documents';
          fileExists = true;
        } else {
          // Try to construct a URL manually as a last resort
          publicUrl = `${supabase.storageUrl}/object/public/${standardBucket}/${doc.file_path}`;
          fileExists = false;
        }
        
        // If standardizing to a specific bucket and the file exists but in a different bucket
        if (standardizeToBucket && fileExists && sourceBucketName !== standardBucket) {
          try {
            // Get the file from the source bucket
            const { data: fileData, error: downloadError } = await supabase
              .storage
              .from(sourceBucketName)
              .download(doc.file_path);
            
            if (downloadError || !fileData) {
              console.error(`Failed to download file from ${sourceBucketName} bucket:`, downloadError);
              continue; // Skip to next document
            }
            
            // Upload to the standard bucket
            const { error: uploadError } = await supabase
              .storage
              .from(standardBucket)
              .upload(doc.file_path, fileData, { upsert: true });
            
            if (uploadError) {
              console.error(`Failed to upload file to ${standardBucket} bucket:`, uploadError);
              continue; // Skip to next document
            }
            
            // Get the new public URL
            const { data: newUrlData } = await supabase
              .storage
              .from(standardBucket)
              .getPublicUrl(doc.file_path);
            
            if (newUrlData?.publicUrl) {
              publicUrl = newUrlData.publicUrl;
              console.log(`Successfully migrated file from ${sourceBucketName} to ${standardBucket}`);
            }
          } catch (migrationError) {
            console.error("Error during file migration:", migrationError);
            // Continue with the original URL if migration fails
          }
        }
        
        // Only update if URL is null or different
        if (!doc.public_url || doc.public_url !== publicUrl) {
          console.log(`Updating document ${doc.id} with URL from ${fileExists ? sourceBucketName : 'constructed'} bucket`);
          
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

// Helper function to ensure storage bucket exists
export const ensureStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking storage buckets:', listError);
      return false;
    }

    // If the bucket already exists, return true
    if (buckets && buckets.some(bucket => bucket.name === bucketName)) {
      console.log(`Bucket ${bucketName} already exists`);
      return true;
    }

    // Create the bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true, // Make it public so documents can be viewed
      fileSizeLimit: 10485760 // 10MB file size limit
    });

    if (createError) {
      console.error(`Error creating ${bucketName} bucket:`, createError);
      return false;
    }

    console.log(`Created ${bucketName} bucket successfully`);
    return true;
  } catch (err) {
    console.error(`Error ensuring ${bucketName} bucket exists:`, err);
    return false;
  }
};

/**
 * Helper to create a standardized file path for document organization
 * Creates paths in the format: [organization-id]/[document-type]/[patient-id]/[filename]
 */
export const createStandardizedFilePath = (
  organizationId: string,
  documentType: string,
  patientId: string | null,
  originalFileName: string
): string => {
  // Sanitize the document type (remove spaces, convert to lowercase)
  const safeDocType = documentType?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
  
  // Create a path structure
  let path = `${organizationId}/${safeDocType}`;
  
  // Add patient folder if available
  if (patientId) {
    path += `/${patientId}`;
  }
  
  // Add timestamp to ensure uniqueness
  const timestamp = new Date().getTime();
  
  // Extract file extension
  const fileExt = originalFileName.split('.').pop() || 'pdf';
  
  // Create filename with timestamp
  const fileName = `${timestamp}_${originalFileName.replace(/\s+/g, '_')}`;
  
  return `${path}/${fileName}`;
};
