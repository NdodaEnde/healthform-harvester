
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

// Upload organization asset (logo, signature, stamp)
export const uploadOrganizationAsset = async (
  file: File,
  organizationId: string,
  assetType: 'logo' | 'signature' | 'stamp'
): Promise<string | null> => {
  try {
    // Ensure the bucket exists
    await ensureDocumentsBucket();
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}/${assetType}.${fileExt}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('medical-documents')
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error("Error uploading asset:", error);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadOrganizationAsset:", error);
    return null;
  }
};

// Delete organization asset
export const deleteOrganizationAsset = async (
  assetUrl: string,
  organizationId: string
): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const url = new URL(assetUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const filePath = `${organizationId}/${fileName}`;
    
    // Delete from storage
    const { error } = await supabase.storage
      .from('medical-documents')
      .remove([filePath]);
    
    if (error) {
      console.error("Error deleting asset:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteOrganizationAsset:", error);
    return false;
  }
};

// Update organization assets in database
export const updateOrganizationAssets = async (
  organizationId: string,
  updates: { [key: string]: string | null }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .update(updates as any)
      .eq('id', organizationId as any);
    
    if (error) {
      console.error("Error updating organization assets:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateOrganizationAssets:", error);
    return false;
  }
};
