
import { ensureStorageBucket } from "@/utils/documentOrganizationFixer";

// Helper function to ensure the documents bucket exists
export const ensureDocumentsBucket = async () => {
  try {
    // Always use medical-documents as the primary bucket
    const medicalDocumentsBucketExists = await ensureStorageBucket('medical-documents');
    
    // For backward compatibility, also ensure the documents bucket exists
    const documentsBucketExists = await ensureStorageBucket('documents');
    
    return medicalDocumentsBucketExists || documentsBucketExists;
  } catch (error) {
    console.error("Error setting up documents buckets:", error);
    return false;
  }
};
