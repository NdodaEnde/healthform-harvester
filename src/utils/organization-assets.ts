
import { supabase } from "@/integrations/supabase/client";

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

// Helper function to ensure the documents bucket exists
export const ensureDocumentsBucket = async () => {
  try {
    // Check both buckets for backward compatibility
    const medicalDocumentsBucketExists = await ensureStorageBucket('medical-documents');
    const documentsBucketExists = await ensureStorageBucket('documents');
    
    return medicalDocumentsBucketExists || documentsBucketExists;
  } catch (error) {
    console.error("Error setting up documents buckets:", error);
    return false;
  }
};
