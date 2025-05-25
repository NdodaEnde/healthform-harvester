
import { supabase } from "@/integrations/supabase/client";
import { ensureStorageBucket } from "@/utils/documentOrganizationFixer";

// Helper function to ensure the documents bucket exists
export const ensureDocumentsBucket = async () => {
  try {
    // First check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return false;
    }
    
    const medicalDocumentsBucket = buckets?.find(bucket => bucket.name === 'medical-documents');
    
    if (medicalDocumentsBucket) {
      console.log("Medical-documents bucket already exists");
      return true;
    }
    
    // Try to create the bucket if it doesn't exist
    const { data, error } = await supabase.storage.createBucket('medical-documents', {
      public: true,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error("Error creating medical-documents bucket:", error);
      // Fallback to using ensureStorageBucket function
      return await ensureStorageBucket('medical-documents');
    }
    
    console.log("Medical-documents bucket created successfully");
    return true;
  } catch (error) {
    console.error("Error setting up documents bucket:", error);
    // Fallback to using ensureStorageBucket function
    try {
      return await ensureStorageBucket('medical-documents');
    } catch (fallbackError) {
      console.error("Fallback bucket creation also failed:", fallbackError);
      return false;
    }
  }
};

// Check if a file exists in storage
export const checkFileExists = async (bucketName: string, filePath: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    return !!data && !error;
  } catch (error) {
    console.error("Error checking if file exists:", error);
    return false;
  }
};
