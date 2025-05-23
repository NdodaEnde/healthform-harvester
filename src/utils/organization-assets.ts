
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
