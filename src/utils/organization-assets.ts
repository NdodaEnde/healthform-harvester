
import { ensureStorageBucket } from "@/utils/documentOrganizationFixer";

// Helper function to ensure the documents bucket exists
export const ensureDocumentsBucket = async () => {
  try {
    // Only use medical-documents as the standard bucket
    const medicalDocumentsBucketExists = await ensureStorageBucket('medical-documents');
    
    return medicalDocumentsBucketExists;
  } catch (error) {
    console.error("Error setting up documents bucket:", error);
    return false;
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
