
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
 * Standardizes storage location to use a single bucket
 */
export const fixDocumentUrls = async (organizationId: string, targetBucket: string = 'medical-documents') => {
  try {
    // Get documents missing URLs but having file paths
    const { data: missingUrlDocs, error: missingUrlError } = await supabase
      .from('documents')
      .select('id, file_path')
      .eq('organization_id', organizationId)
      .is('public_url', null)
      .not('file_path', 'is', null);
    
    if (missingUrlError) throw missingUrlError;
    
    // Get documents with potentially incorrect URLs
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
    
    // Ensure the target bucket exists
    const bucketExists = await ensureStorageBucket(targetBucket);
    
    if (!bucketExists) {
      console.error(`Cannot standardize to bucket ${targetBucket} as it doesn't exist`);
      return { success: false, error: `Bucket ${targetBucket} doesn't exist` };
    }
    
    // Fix each document
    for (const doc of docsToProcess) {
      if (doc.file_path) {
        try {
          // Get the new public URL from the target bucket
          const { data: urlData } = await supabase
            .storage
            .from(targetBucket)
            .getPublicUrl(doc.file_path);
          
          const publicUrl = urlData?.publicUrl || '';
          
          // Only update if URL is null or different
          if (!doc.public_url || doc.public_url !== publicUrl) {
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
        } catch (docError) {
          console.error(`Error processing document ${doc.id}:`, docError);
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

/**
 * Utility to standardize document storage by reorganizing files into a proper folder structure
 */
export const standardizeDocumentStorage = async (organizationId: string, targetBucket: string = 'medical-documents') => {
  try {
    console.log(`Starting document storage standardization for organization ${organizationId} to bucket ${targetBucket}`);
    
    // Ensure the target bucket exists
    const bucketExists = await ensureStorageBucket(targetBucket);
    if (!bucketExists) {
      throw new Error(`Target bucket ${targetBucket} doesn't exist and couldn't be created`);
    }
    
    // Get all documents for the organization that need to be standardized
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, file_path, file_name, document_type, owner_id, organization_id')
      .eq('organization_id', organizationId)
      .not('file_path', 'is', null);
    
    if (fetchError) throw fetchError;
    if (!documents || documents.length === 0) {
      console.log('No documents found for standardization');
      return { success: true, count: 0 };
    }
    
    console.log(`Found ${documents.length} documents to standardize`);
    
    let standardizedCount = 0;
    
    // Process each document
    for (const doc of documents) {
      try {
        // Check if file path already follows the standard format
        if (doc.file_path.startsWith(`${organizationId}/`)) {
          console.log(`Document ${doc.id} already has standardized path: ${doc.file_path}`);
          continue;
        }
        
        // Check if the file exists in any bucket - for migration from documents bucket
        let fileData = null;
        let fileExists = false;
        
        // Try to download from the documents bucket if it exists
        try {
          const { data: existsInDocuments, error: docsCheckError } = await supabase
            .storage
            .from('documents')
            .download(doc.file_path);
            
          if (existsInDocuments) {
            fileExists = true;
            fileData = existsInDocuments;
          }
        } catch (e) {
          console.log(`File not found in documents bucket: ${doc.file_path}`);
        }
        
        // If file doesn't exist in documents bucket, check medical-documents bucket
        if (!fileExists) {
          try {
            const { data: existsInMedical, error: medicalCheckError } = await supabase
              .storage
              .from('medical-documents')
              .download(doc.file_path);
              
            if (existsInMedical) {
              fileExists = true;
              fileData = existsInMedical;
            }
          } catch (e) {
            console.log(`File not found in medical-documents bucket: ${doc.file_path}`);
          }
        }
        
        if (!fileExists || !fileData) {
          console.log(`File for document ${doc.id} not found in any bucket: ${doc.file_path}`);
          continue;
        }
        
        // Create a standardized file path
        const documentType = doc.document_type || 'unknown';
        const newFilePath = createStandardizedFilePath(
          organizationId,
          documentType,
          doc.owner_id || null,
          doc.file_name || 'unnamed.pdf'
        );
        
        // Upload to the target bucket with the new standardized path
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from(targetBucket)
          .upload(newFilePath, fileData, { upsert: true });
          
        if (uploadError) {
          console.error(`Failed to upload file to standardized location for document ${doc.id}:`, uploadError);
          continue;
        }
        
        // Get the new public URL
        const { data: publicUrlData } = await supabase
          .storage
          .from(targetBucket)
          .getPublicUrl(newFilePath);
          
        if (!publicUrlData?.publicUrl) {
          console.error(`Failed to get public URL for standardized file for document ${doc.id}`);
          continue;
        }
        
        // Update the document record with the new file path and URL
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            file_path: newFilePath,
            public_url: publicUrlData.publicUrl
          })
          .eq('id', doc.id);
          
        if (updateError) {
          console.error(`Failed to update document ${doc.id} with standardized path:`, updateError);
          continue;
        }
        
        console.log(`Successfully standardized document ${doc.id}. Old path: ${doc.file_path}, New path: ${newFilePath}`);
        standardizedCount++;
        
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
      }
    }
    
    console.log(`Standardized storage for ${standardizedCount} documents`);
    return { success: true, count: standardizedCount };
    
  } catch (error: any) {
    console.error("Error standardizing document storage:", error);
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
